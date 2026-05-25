// scripts/sync-api.mjs
// Master script that combines all API sync operations:
// 1. Generate OpenAPI schema and compat layer
// 2. Extract endpoints snapshot
// 3. Diff endpoints to detect changes
// 4. Validate changes with CI guard (optional)

import { mkdir, writeFile, readFile, unlink, copyFile } from "node:fs/promises";
import { execSync, exec } from "node:child_process";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { glob } from "glob";

const execAsync = promisify(exec);

dotenv.config({ path: ".env.development" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const SWAGGER_URL = process.env.VITE_SWAGGER_URL || process.env.SWAGGER_URL || "local";

const OUT_DIR = "src/generated";
const SWAGGER_FILE = "swagger.json";
const OUT_FILE = `${OUT_DIR}/openapi.zod.ts`;
const COMPAT_FILE = join(rootDir, "src/Schema/generated.ts");
const GENERATED_PARAMS_FILE = join(rootDir, "src/Schema/generated-params.ts");
const GENERATED_FORM_BODY_FILE = join(
  rootDir,
  "src/Schema/generated-form-body.ts"
);
const CACHE_FILE = join(rootDir, ".schema-cache.json");
const SNAPSHOT_FILE = join(rootDir, ".cursor/openapi.endpoints.snapshot.json");
const PREV_SNAPSHOT_FILE = join(
  rootDir,
  ".cursor/openapi.endpoints.snapshot.prev.json"
);
const SCHEMA_CHANGES_FILE = join(rootDir, ".cursor/schema-route-changes.json");

// ============================================
// Cache Helpers (schemas + params + others)
// ============================================
/**
 * Cache file format (new):
 * {
 *   schemas: { [SchemaName]: { hash: string } },
 *   params: { [ParamSchemaName]: { hash: string } }
 * }
 *
 * Backward compatible with old format:
 * { [SchemaName]: { hash: string } }
 */
async function readSchemaCache() {
  try {
    const cacheContent = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(cacheContent);
    if (parsed && typeof parsed === "object" && parsed.schemas) {
      return {
        schemas: parsed.schemas || {},
        params: parsed.params || {},
        formBodies: parsed.formBodies || {},
      };
    }
    // Old flat cache: treat everything as schemas
    return {
      schemas: parsed || {},
      params: {},
      formBodies: {},
    };
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`⚠️  Could not read cache file: ${err.message}`);
    }
    return { schemas: {}, params: {}, formBodies: {} };
  }
}

async function writeSchemaCache(cache) {
  const next = {
    schemas: cache?.schemas || {},
    params: cache?.params || {},
    formBodies: cache?.formBodies || {},
  };
  await writeFile(CACHE_FILE, JSON.stringify(next, null, 2), "utf8");
}

// ============================================
// Generic Resource Mapping Utilities
// ============================================

/**
 * Singularize a resource name (plural -> singular)
 * Examples: customers -> customer, orders -> order, proofing-orders -> proofing-order
 */
function singularizeResource(resource) {
  // Handle compound resources
  if (resource.includes("-")) {
    const parts = resource.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart.endsWith("s") && lastPart !== "status") {
      parts[parts.length - 1] = lastPart.slice(0, -1);
    }
    return parts.join("-");
  }

  // Simple singularization
  if (resource.endsWith("ies")) {
    return resource.slice(0, -3) + "y";
  }
  if (resource.endsWith("es") && !["status", "process"].includes(resource)) {
    return resource.slice(0, -2);
  }
  if (resource.endsWith("s") && resource.length > 1) {
    return resource.slice(0, -1);
  }
  return resource;
}

/**
 * Extract resource name from endpoint path
 * Examples: /api/customers -> customers, /api/orders/:id -> orders
 */
function pathToResource(path) {
  const parts = path
    .replace("/api/", "")
    .split("/")
    .filter((p) => p && !p.startsWith(":"));
  return parts[0] || null;
}

/**
 * Convert resource name to hook file name
 * Examples: customer -> use-customer.ts, proofing-order -> use-proofing-order.ts
 */
function resourceToHookFile(resource) {
  if (!resource) return null;
  const singular = singularizeResource(resource);
  return `use-${singular}.ts`;
}

/**
 * Convert kebab-case to PascalCase
 * Examples: customer-debt-history -> CustomerDebtHistory
 */
function kebabToPascalCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Convert resource name to PascalCase (singular)
 * Examples: customers -> Customer, proofing-orders -> ProofingOrder
 */
function resourceToPascalCase(resource) {
  const singular = singularizeResource(resource);
  return kebabToPascalCase(singular);
}

/**
 * Generate param name from endpoint path (pattern-based, generic)
 * Examples:
 *   /api/customers -> CustomerListParams
 *   /api/customers/:id/debt-history -> CustomerDebtHistoryParams
 *   /api/orders/for-designer -> OrdersForDesignerListParams
 */
function generateParamName(path, httpMethod) {
  // Remove /api prefix and split path
  const pathParts = path.replace("/api/", "").split("/");
  const parts = pathParts.filter((p) => p && !p.startsWith(":"));
  const hasIdParam = pathParts.some((p) => p.startsWith(":"));

  if (parts.length === 0) return null;

  // For non-GET methods, use simple path-based naming
  if (httpMethod !== "GET") {
    const name = parts.map(kebabToPascalCase).join("");
    return `${name}Params`;
  }

  const resource = parts[0];

  // Special handling for compound resources that need singular form
  // production-orders -> Production (not ProductionOrder)
  let resourcePascal;
  if (resource === "production-orders") {
    resourcePascal = "Production";
  } else {
    resourcePascal = resourceToPascalCase(resource);
  }

  // Pattern 1: Simple list endpoint (/api/resource)
  if (parts.length === 1) {
    // Special case: dies -> Die (singular)
    if (resource === "dies") {
      return "DieListParams";
    }
    return `${resourcePascal}ListParams`;
  }

  // Pattern 2: Resource with ID param (/api/resource/:id/action)
  if (hasIdParam && parts.length === 2) {
    const action = parts[1];
    // Special cases
    if (resource === "customers" && action === "order-history") {
      return "CustomerOrdersParams"; // Alias for order-history
    }
    const actionPascal = kebabToPascalCase(action);
    return `${resourcePascal}${actionPascal}Params`;
  }

  // Pattern 3: Nested resource (/api/resource/sub-resource)
  if (parts.length === 2 && !hasIdParam) {
    const subResource = parts[1];

    // Special cases for specific patterns
    if (resource === "designs") {
      if (subResource === "types") return "DesignTypeListParams"; // Singular Type
      if (subResource === "materials") return "MaterialTypeListParams";
      if (subResource === "my") return "MyDesignListParams";
      if (subResource === "by-customer") return "DesignByCustomerListParams";
      if (subResource === "user") return "DesignByUserListParams";
    }

    // Handle /api/designs/by-customer/:customerId (has ID param but we're checking non-ID case)
    if (resource === "designs" && subResource === "by-customer" && hasIdParam) {
      return "DesignByCustomerListParams";
    }

    if (resource === "orders") {
      if (subResource === "for-designer") return "OrdersForDesignerListParams"; // Plural Orders
      if (subResource === "for-accounting")
        return "OrdersForAccountingListParams";
      if (subResource === "my") return "OrdersMyListParams";
    }

    if (resource === "categories") {
      const subPascal = kebabToPascalCase(subResource);
      return `${subPascal}ListParams`;
    }

    // Check if it's a list endpoint (common patterns)
    const listPatterns = [
      "types",
      "materials",
      "designers",
      "available-orders",
      "failure-reasons",
    ];
    if (listPatterns.includes(subResource)) {
      // For types, use singular
      if (subResource === "types") {
        return `${resourcePascal}TypeListParams`;
      }
      const subPascal = kebabToPascalCase(subResource);
      return `${resourcePascal}${subPascal}ListParams`;
    }

    // Check if it's a filtered list
    if (
      subResource.startsWith("for-") ||
      subResource.startsWith("by-") ||
      subResource === "my"
    ) {
      const subPascal = kebabToPascalCase(subResource);
      // For orders, keep plural
      if (resource === "orders") {
        return `Orders${subPascal}ListParams`;
      }
      return `${resourcePascal}${subPascal}ListParams`;
    }

    // Generic sub-resource
    const subPascal = kebabToPascalCase(subResource);
    return `${resourcePascal}${subPascal}Params`;
  }

  // Pattern 4: Deeply nested (/api/resource/:id/sub-resource/action)
  if (hasIdParam && parts.length >= 2) {
    // Special case: /api/designs/by-customer/:customerId
    if (
      resource === "designs" &&
      parts[0] === "designs" &&
      parts[1] === "by-customer"
    ) {
      return "DesignByCustomerListParams";
    }
    const subParts = parts.slice(1).map(kebabToPascalCase).join("");
    return `${resourcePascal}${subParts}Params`;
  }

  // Pattern 5: Multi-level path (/api/resource/sub-resource/action)
  if (parts.length >= 2) {
    const actionParts = parts.slice(1).map(kebabToPascalCase).join("");
    // Check for export pattern
    if (parts[parts.length - 1] === "export") {
      const baseName = parts.slice(0, -1).map(kebabToPascalCase).join("");
      return `${baseName}ExportParams`;
    }
    return `${resourcePascal}${actionParts}Params`;
  }

  // Fallback: convert all parts to PascalCase
  const name = parts.map(kebabToPascalCase).join("");
  return `${name}Params`;
}

// ============================================
// Step 1: Generate OpenAPI Zod Schema
// ============================================
async function generateOpenApiZod() {
  await mkdir(OUT_DIR, { recursive: true });

  let spec;
  try {
    const localContent = await readFile(join(rootDir, "swagger (2).json"), "utf8");
    spec = JSON.parse(localContent);
    console.log("✓ Loaded from local swagger (2).json");
  } catch (err) {
    console.log("📥 Fetch swagger:", SWAGGER_URL);
    const res = await fetch(SWAGGER_URL);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    spec = await res.json();
  }

  await writeFile(SWAGGER_FILE, JSON.stringify(spec, null, 2), "utf8");

  console.log("🧩 Generate zod ->", OUT_FILE);
  execSync(`npx openapi-zod-client ./${SWAGGER_FILE} -o ./${OUT_FILE}`, {
    stdio: "inherit",
  });

  console.log("🎨 Prettier");
  execSync(`npx prettier -w ./${OUT_FILE}`, { stdio: "inherit" });

  const content = await readFile(OUT_FILE, "utf8");
  if (!content || content.trim().length === 0) {
    throw new Error("Generated file is empty");
  }

  console.log("✅ Generated openapi.zod.ts");
  return content;
}

// ============================================
// Step 2: Extract Schema Definition
// ============================================
function extractSchemaDefinition(content, schemaName) {
  const startPattern = new RegExp(`const\\s+${schemaName}\\s*=\\s*`, "m");
  const startMatch = content.search(startPattern);

  if (startMatch === -1) {
    return null;
  }

  let pos = startMatch;
  while (pos < content.length && content[pos] !== "=") {
    pos++;
  }
  pos++;
  while (pos < content.length && /\s/.test(content[pos])) {
    pos++;
  }

  let depth = 0;
  let inString = false;
  let stringChar = null;
  let startPos = pos;
  let endPos = pos;

  for (let i = pos; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== "\\") {
      inString = false;
      stringChar = null;
    }

    if (inString) continue;

    if (char === "(" || char === "{" || char === "[") {
      depth++;
    } else if (char === ")" || char === "}" || char === "]") {
      depth--;
      if (depth < 0) {
        endPos = i;
        break;
      }
    }

    if (depth === 0 && char === ";") {
      endPos = i + 1;
      break;
    }

    if (depth === 0 && i > pos) {
      const remaining = content.substring(i);
      if (remaining.match(/^\s*const\s+[A-Z]/)) {
        endPos = i;
        break;
      }
    }
  }

  if (endPos > startPos) {
    return content.substring(startPos, endPos).trim();
  }

  return null;
}

function hashString(str) {
  return createHash("sha256")
    .update(str || "")
    .digest("hex")
    .substring(0, 16);
}

// ============================================
// Step 3: Generate Compat Layer & Detect Schema Changes
// ============================================
async function generateCompatLayer(openApiContent) {
  console.log("🔗 Building compat layer...");

  const schemasMatch = openApiContent.match(
    /export\s+const\s+schemas\s*=\s*{([\s\S]*?)}\s*;/
  );
  if (!schemasMatch) {
    throw new Error(
      "❌ Cannot find `export const schemas = { ... }` in openapi.zod.ts"
    );
  }

  const schemasBlock = schemasMatch[1];
  const keys = [...schemasBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:?\s*,?/gm)]
    .map((x) => x[1])
    .filter((k) => k && k !== "schemas");

  if (keys.length === 0) {
    throw new Error("❌ No schema keys found in schemas object");
  }

  keys.sort();

  const currentSchemas = new Map();
  for (const key of keys) {
    const definition = extractSchemaDefinition(openApiContent, key);
    if (definition) {
      const hash = hashString(definition);
      currentSchemas.set(key, { definition, hash });
    }
  }

  const cache = await readSchemaCache();
  const prevSchemasCache = cache.schemas || {};

  const lines = [];
  lines.push(`/* AUTO-GENERATED FILE. DO NOT EDIT. */`);
  lines.push(`/* Source: ${OUT_FILE} */`);
  lines.push(`/* Generated at: ${new Date().toISOString()} */\n`);
  lines.push(
    `import { schemas, api, createApiClient } from "@/generated/openapi.zod";\n`
  );
  lines.push(`// Re-export API client`);
  lines.push(`export { api, createApiClient, schemas };\n`);
  lines.push(`// Re-export schemas with "Schema" suffix for compatibility\n`);

  for (const key of keys) {
    lines.push(`export const ${key}Schema = schemas.${key};`);
  }

  lines.push("");

  const prevCompat = await readFile(COMPAT_FILE, "utf8").catch((err) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });

  const prevKeys = prevCompat
    ? [...prevCompat.matchAll(/export const ([A-Za-z0-9_]+)Schema\s*=/g)].map(
        (m) => m[1]
      )
    : [];

  const prevSet = new Set(prevKeys);
  const nextSet = new Set(keys);

  const added = keys.filter((k) => !prevSet.has(k));
  const removed = prevKeys.filter((k) => !nextSet.has(k));
  const existing = keys.filter((k) => prevSet.has(k));

  const modified = [];
  for (const key of existing) {
    const current = currentSchemas.get(key);
    const prev = prevSchemasCache[key];
    if (current && prev && current.hash !== prev.hash) {
      modified.push(key);
    }
  }

  console.log("\n🔍 Schema changes detected:");
  if (added.length > 0) {
    console.log(`  ➕ Added (${added.length}):`, added.join(", "));
  }
  if (removed.length > 0) {
    console.log(`  ➖ Removed (${removed.length}):`, removed.join(", "));
  }
  if (modified.length > 0) {
    console.log(`  🔄 Modified (${modified.length}):`, modified.join(", "));
  }
  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    console.log("  ✓ No changes detected");
  }

  const newSchemasCache = {};
  for (const [key, value] of currentSchemas.entries()) {
    newSchemasCache[key] = { hash: value.hash };
  }
  cache.schemas = newSchemasCache;
  await writeSchemaCache(cache);

  await writeFile(COMPAT_FILE, lines.join("\n"), "utf8");
  console.log(`✅ Generated ${COMPAT_FILE.replace(rootDir + "/", "")}`);
  console.log(`   Exported ${keys.length} schemas with "Schema" suffix`);

  try {
    await unlink(SWAGGER_FILE);
    console.log(`✅ Deleted ${SWAGGER_FILE}`);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`⚠️  Could not delete ${SWAGGER_FILE}:`, err.message);
    }
  }

  return { added, removed, modified };
}

// ============================================
// Step 3.5: Generate Params Schemas
// ============================================
function convertZodSchemaToParams(zodSchemaStr) {
  // Convert zod schema string to params schema format
  // Remove .default() calls
  zodSchemaStr = zodSchemaStr.replace(/\.default\([^)]+\)/g, "");

  // Add .nullable() before .optional() if not already nullable
  if (
    zodSchemaStr.includes(".optional()") &&
    !zodSchemaStr.includes(".nullable()")
  ) {
    zodSchemaStr = zodSchemaStr.replace(
      /\.optional\(\)/,
      ".nullable().optional()"
    );
  }

  return zodSchemaStr;
}

// generateParamName is now defined above in Generic Resource Mapping Utilities

async function generateParamsSchemas(endpoints) {
  console.log("📝 Generating params schemas...");

  const paramsMap = new Map();

  // Group endpoints by param name
  for (const endpoint of endpoints) {
    if (!endpoint.queryParams || endpoint.queryParams.length === 0) {
      continue;
    }

    const paramName = generateParamName(endpoint.path, endpoint.httpMethod);
    if (!paramName) continue;

    if (!paramsMap.has(paramName)) {
      paramsMap.set(paramName, {
        name: paramName,
        path: endpoint.path,
        method: endpoint.httpMethod,
        queryParams: [],
      });
    }

    // Merge query params (avoid duplicates)
    const existing = paramsMap.get(paramName);
    for (const qp of endpoint.queryParams) {
      if (!existing.queryParams.find((p) => p.name === qp.name)) {
        existing.queryParams.push(qp);
      }
    }
  }

  const lines = [];
  lines.push(`/* AUTO-GENERATED FILE. DO NOT EDIT. */`);
  lines.push(`/* Source: src/generated/openapi.zod.ts */`);
  lines.push(`/* Generated at: ${new Date().toISOString()} */\n`);
  lines.push(`import { z } from "zod";`);
  lines.push(`import { IdSchema, PagedParamsSchema } from "./Common";\n`);
  lines.push(`// ===== Generated Params Schemas =====\n`);

  // Sort by name
  const sortedParams = Array.from(paramsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Detect params schema changes (added/removed/modified) using a cache
  // Keyed by exported schema constant name: `${ParamName}Schema`
  const currentParamsCache = {};
  for (const param of sortedParams) {
    const hasPageNumber = param.queryParams.some(
      (p) => p.name === "pageNumber" || p.name === "PageNumber"
    );
    const hasPageSize = param.queryParams.some(
      (p) => p.name === "pageSize" || p.name === "PageSize"
    );
    const hasPagination = hasPageNumber && hasPageSize;

    const normalizedQueryParams = [...param.queryParams]
      .filter((p) => p.name !== "pageNumber" && p.name !== "PageNumber")
      .filter((p) => p.name !== "pageSize" && p.name !== "PageSize")
      .map((p) => ({
        name: p.name,
        schema: convertZodSchemaToParams(p.schema),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const hashInput = JSON.stringify({
      hasPagination,
      queryParams: normalizedQueryParams,
    });
    currentParamsCache[`${param.name}Schema`] = { hash: hashString(hashInput) };
  }

  const cache = await readSchemaCache();
  const prevParamsCache = cache.params || {};
  const prevParamKeys = Object.keys(prevParamsCache);
  const nextParamKeys = Object.keys(currentParamsCache);

  const paramsAdded = nextParamKeys.filter((k) => !prevParamsCache[k]);
  const paramsRemoved = prevParamKeys.filter((k) => !currentParamsCache[k]);
  const paramsModified = nextParamKeys.filter(
    (k) =>
      prevParamsCache[k] &&
      currentParamsCache[k] &&
      prevParamsCache[k].hash !== currentParamsCache[k].hash
  );

  console.log("\n🔍 Params schema changes detected:");
  if (paramsAdded.length > 0) {
    console.log(`  ➕ Added (${paramsAdded.length}):`, paramsAdded.join(", "));
  }
  if (paramsRemoved.length > 0) {
    console.log(
      `  ➖ Removed (${paramsRemoved.length}):`,
      paramsRemoved.join(", ")
    );
  }
  if (paramsModified.length > 0) {
    console.log(
      `  🔄 Modified (${paramsModified.length}):`,
      paramsModified.join(", ")
    );
  }
  if (
    paramsAdded.length === 0 &&
    paramsRemoved.length === 0 &&
    paramsModified.length === 0
  ) {
    console.log("  ✓ No params changes detected");
  }

  for (const param of sortedParams) {
    const hasPageNumber = param.queryParams.some(
      (p) => p.name === "pageNumber" || p.name === "PageNumber"
    );
    const hasPageSize = param.queryParams.some(
      (p) => p.name === "pageSize" || p.name === "PageSize"
    );
    const hasPagination = hasPageNumber && hasPageSize;

    lines.push(`// ==== ${param.name} (${param.method} ${param.path}) ====`);

    if (hasPagination) {
      lines.push(
        `export const ${param.name}Schema = PagedParamsSchema.extend({`
      );
    } else {
      lines.push(`export const ${param.name}Schema = z.object({`);
    }

    // Add non-pagination params
    for (const qp of param.queryParams) {
      if (qp.name === "pageNumber" || qp.name === "PageNumber") continue;
      if (qp.name === "pageSize" || qp.name === "PageSize") continue;

      const convertedSchema = convertZodSchemaToParams(qp.schema);
      const paramName = qp.name;
      lines.push(`  ${paramName}: ${convertedSchema},`);
    }

    if (hasPagination) {
      lines.push(`});`);
    } else {
      lines.push(`}).passthrough();`);
    }

    const typeName = param.name.replace("Schema", "");
    lines.push(
      `export type ${typeName} = z.infer<typeof ${param.name}Schema>;\n`
    );
  }

  await writeFile(GENERATED_PARAMS_FILE, lines.join("\n"), "utf8");
  console.log(
    `✅ Generated ${GENERATED_PARAMS_FILE.replace(rootDir + "/", "")}`
  );
  console.log(`   Exported ${paramsMap.size} params schemas`);

  // Persist params cache after file generation (so cache reflects actual output)
  cache.params = currentParamsCache;
  await writeSchemaCache(cache);

  return {
    count: paramsMap.size,
    changes: {
      added: paramsAdded,
      removed: paramsRemoved,
      modified: paramsModified,
    },
  };
}

// ============================================
// Step 3.6: Generate Form Body Schemas (multipart/form-data bodies)
// ============================================
function hasFileUploadInSchemaDefinition(definition) {
  if (!definition) return false;
  // openapi-zod-client uses z.instanceof(File) for file uploads
  return definition.includes("instanceof(File)");
}

async function generateFormBodySchemas(openApiContent, endpoints) {
  console.log("🧾 Generating form body schemas...");

  // Collect body schema names used by endpoints
  const bodySchemaNames = Array.from(
    new Set(
      endpoints
        .map((e) => e.requestSchema)
        .filter((x) => typeof x === "string" && x.length > 0)
    )
  );

  const fileUploadBodySchemas = [];
  for (const schemaName of bodySchemaNames) {
    const definition = extractSchemaDefinition(openApiContent, schemaName);
    if (hasFileUploadInSchemaDefinition(definition)) {
      fileUploadBodySchemas.push(schemaName);
    }
  }

  fileUploadBodySchemas.sort();

  const lines = [];
  lines.push(`/* AUTO-GENERATED FILE. DO NOT EDIT. */`);
  lines.push(`/* Source: src/generated/openapi.zod.ts */`);
  lines.push(`/* Generated at: ${new Date().toISOString()} */\n`);
  lines.push(`import { z } from "zod";`);
  lines.push(`import { schemas } from "./generated";\n`);
  lines.push(`// ===== Generated Form Body Schemas (file uploads) =====`);
  lines.push(
    `// These schemas are request bodies that include File fields (multipart/form-data).\n`
  );

  for (const key of fileUploadBodySchemas) {
    lines.push(`export const ${key}Schema = schemas.${key};`);
    lines.push(`export type ${key} = z.infer<typeof ${key}Schema>;\n`);
  }

  await writeFile(GENERATED_FORM_BODY_FILE, lines.join("\n"), "utf8");
  console.log(
    `✅ Generated ${GENERATED_FORM_BODY_FILE.replace(rootDir + "/", "")}`
  );
  console.log(`   Exported ${fileUploadBodySchemas.length} form body schemas`);

  // Detect changes for form-body schemas (multipart/form-data bodies)
  // Keyed by exported schema constant name: `${BodySchemaName}Schema`
  const currentFormBodiesCache = {};
  for (const key of fileUploadBodySchemas) {
    const definition = extractSchemaDefinition(openApiContent, key);
    // Hash the extracted schema definition to detect changes over time
    currentFormBodiesCache[`${key}Schema`] = { hash: hashString(definition) };
  }

  const cache = await readSchemaCache();
  const prevFormBodiesCache = cache.formBodies || {};
  const prevKeys = Object.keys(prevFormBodiesCache);
  const nextKeys = Object.keys(currentFormBodiesCache);

  const added = nextKeys.filter((k) => !prevFormBodiesCache[k]);
  const removed = prevKeys.filter((k) => !currentFormBodiesCache[k]);
  const modified = nextKeys.filter(
    (k) =>
      prevFormBodiesCache[k] &&
      currentFormBodiesCache[k] &&
      prevFormBodiesCache[k].hash !== currentFormBodiesCache[k].hash
  );

  console.log("\n🔍 Form-body schema changes detected:");
  if (added.length > 0) {
    console.log(`  ➕ Added (${added.length}):`, added.join(", "));
  }
  if (removed.length > 0) {
    console.log(`  ➖ Removed (${removed.length}):`, removed.join(", "));
  }
  if (modified.length > 0) {
    console.log(`  🔄 Modified (${modified.length}):`, modified.join(", "));
  }
  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    console.log("  ✓ No form-body changes detected");
  }

  cache.formBodies = currentFormBodiesCache;
  await writeSchemaCache(cache);

  return {
    count: fileUploadBodySchemas.length,
    changes: { added, removed, modified },
  };
}

// ============================================
// Step 4: Extract Endpoints Snapshot
// ============================================
async function extractEndpointsSnapshot(openApiContent) {
  console.log("📸 Extracting endpoint snapshot...");

  // Find the endpoints array: const endpoints = makeApi([...])
  const endpointsMatch = openApiContent.match(
    /const\s+endpoints\s*=\s*makeApi\s*\(\s*\[([\s\S]*?)\]\s*\)/m
  );

  if (!endpointsMatch) {
    console.warn("⚠️ Cannot find endpoints array in openapi.zod.ts");
    return [];
  }

  const endpointsArray = endpointsMatch[1];
  const endpoints = [];

  // Match each endpoint object in the array
  // Pattern: { method: "...", path: "...", alias: "...", ... }
  // Need to handle nested objects properly by counting braces
  let pos = 0;

  while (pos < endpointsArray.length) {
    // Find next endpoint object start
    const startMatch = endpointsArray.indexOf("{", pos);
    if (startMatch === -1) break;

    // Find matching closing brace
    let depth = 0;
    let inString = false;
    let stringChar = null;
    let endPos = startMatch;

    for (let i = startMatch; i < endpointsArray.length; i++) {
      const char = endpointsArray[i];
      const prevChar = i > 0 ? endpointsArray[i - 1] : "";

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false;
        stringChar = null;
      }

      if (inString) continue;

      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          endPos = i + 1;
          break;
        }
      }
    }

    const endpointBlock = endpointsArray.substring(startMatch, endPos);

    // Extract fields from endpoint block
    const methodMatch = endpointBlock.match(/method:\s*"(\w+)"/);
    const pathMatch = endpointBlock.match(/path:\s*"([^"]+)"/);
    const aliasMatch = endpointBlock.match(/alias:\s*"([^"]+)"/);

    if (methodMatch && pathMatch) {
      const httpMethod = methodMatch[1].toUpperCase();
      const path = pathMatch[1];
      const clientMethod = aliasMatch ? aliasMatch[1] : null;

      // Extract request schema from body parameter
      const bodyParamMatch = endpointBlock.match(
        /parameters:\s*\[[\s\S]*?name:\s*"body"[\s\S]*?schema:\s*(\w+)/
      );
      const requestSchema = bodyParamMatch ? bodyParamMatch[1] : null;

      // Extract response schema
      const responseMatch = endpointBlock.match(/response:\s*(\w+)/);
      const responseSchema = responseMatch ? responseMatch[1] : null;

      // Extract query parameters
      const queryParams = [];
      const paramsBlockMatch = endpointBlock.match(
        /parameters:\s*\[([\s\S]*?)\]/
      );
      if (paramsBlockMatch) {
        const paramsBlock = paramsBlockMatch[1];
        // Find all parameter objects
        let paramPos = 0;
        while (paramPos < paramsBlock.length) {
          const paramStart = paramsBlock.indexOf("{", paramPos);
          if (paramStart === -1) break;

          // Find matching closing brace for this parameter
          let depth = 0;
          let inString = false;
          let stringChar = null;
          let paramEnd = paramStart;

          for (let i = paramStart; i < paramsBlock.length; i++) {
            const char = paramsBlock[i];
            const prevChar = i > 0 ? paramsBlock[i - 1] : "";

            if (!inString && (char === '"' || char === "'" || char === "`")) {
              inString = true;
              stringChar = char;
            } else if (inString && char === stringChar && prevChar !== "\\") {
              inString = false;
              stringChar = null;
            }

            if (inString) continue;

            if (char === "{") depth++;
            else if (char === "}") {
              depth--;
              if (depth === 0) {
                paramEnd = i + 1;
                break;
              }
            }
          }

          const paramBlock = paramsBlock.substring(paramStart, paramEnd);

          // Check if it's a Query parameter
          const typeMatch = paramBlock.match(/type:\s*"Query"/);
          if (typeMatch) {
            const nameMatch = paramBlock.match(/name:\s*"([^"]+)"/);

            if (nameMatch) {
              const paramName = nameMatch[1];

              // Extract schema - need to find schema: and capture until next property or end of object
              const schemaStart = paramBlock.indexOf("schema:");
              if (schemaStart !== -1) {
                let schemaPos = schemaStart + 7; // length of "schema:"
                // Skip whitespace
                while (
                  schemaPos < paramBlock.length &&
                  /\s/.test(paramBlock[schemaPos])
                ) {
                  schemaPos++;
                }

                // Find the end of the schema expression
                // Schema can be: z.string(), z.number().int(), z.string().datetime({ offset: true }).optional(), etc.
                let depth = 0;
                let inString = false;
                let stringChar = null;
                let schemaEnd = schemaPos;
                let started = false;

                for (let i = schemaPos; i < paramBlock.length; i++) {
                  const char = paramBlock[i];
                  const prevChar = i > 0 ? paramBlock[i - 1] : "";

                  if (
                    !inString &&
                    (char === '"' || char === "'" || char === "`")
                  ) {
                    inString = true;
                    stringChar = char;
                  } else if (
                    inString &&
                    char === stringChar &&
                    prevChar !== "\\"
                  ) {
                    inString = false;
                    stringChar = null;
                  }

                  if (inString) continue;

                  if (char === "(" || char === "{" || char === "[") {
                    depth++;
                    started = true;
                  } else if (char === ")" || char === "}" || char === "]") {
                    depth--;
                  }

                  // Check if we've reached the end of the schema expression
                  // End when we hit a comma at depth 0 (after we've started parsing)
                  if (started && depth === 0) {
                    if (char === ",") {
                      schemaEnd = i;
                      break;
                    }
                    // Also check for next property (name: or type: or closing brace)
                    const remaining = paramBlock.substring(i);
                    if (
                      remaining.match(/^\s*[,}]/) ||
                      remaining.match(/^\s*(name|type|schema):/)
                    ) {
                      schemaEnd = i;
                      break;
                    }
                  }

                  // If we haven't started but hit a comma, it's a simple schema
                  if (!started && char === ",") {
                    schemaEnd = i;
                    break;
                  }
                }

                let paramSchema = paramBlock
                  .substring(schemaPos, schemaEnd)
                  .trim();

                // Clean up schema string (remove trailing commas, etc)
                paramSchema = paramSchema.replace(/,\s*$/, "").trim();

                if (paramSchema) {
                  queryParams.push({ name: paramName, schema: paramSchema });
                }
              }
            }
          }

          paramPos = paramEnd;
        }
      }

      endpoints.push({
        clientMethod:
          clientMethod ||
          `${httpMethod.toLowerCase()}${path.replace(/[^a-zA-Z0-9]/g, "")}`,
        httpMethod,
        path,
        requestSchema,
        responseSchema,
        queryParams,
      });
    }

    pos = endPos;
  }

  await mkdir(join(rootDir, ".cursor"), { recursive: true });
  await writeFile(SNAPSHOT_FILE, JSON.stringify(endpoints, null, 2), "utf8");

  console.log(
    `✅ Endpoint snapshot saved -> ${SNAPSHOT_FILE.replace(rootDir + "/", "")}`
  );
  console.log(`   Total endpoints: ${endpoints.length}`);

  return endpoints;
}

// ============================================
// Step 5: Diff Endpoints
// ============================================
function keyOf(e) {
  return `${e.httpMethod} ${e.path}`;
}

function indexBy(list, fn) {
  return new Map(list.map((x) => [fn(x), x]));
}

async function diffEndpoints(
  newSnap,
  schemaChanges,
  paramsChanges,
  formBodyChanges
) {
  console.log("🔀 Comparing endpoints...");

  let oldSnap = [];
  try {
    oldSnap = JSON.parse(await readFile(PREV_SNAPSHOT_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(
        "ℹ️  No previous snapshot found. Treating all endpoints as new."
      );
    } else {
      throw err;
    }
  }

  const oldByKey = indexBy(oldSnap, keyOf);
  const newByKey = indexBy(newSnap, keyOf);

  const added = [];
  const removed = [];
  const modified = [];

  for (const e of newSnap) {
    const key = keyOf(e);
    const old = oldByKey.get(key);
    if (!old) {
      added.push(e);
    } else if (
      old.clientMethod !== e.clientMethod ||
      old.requestSchema !== e.requestSchema ||
      old.responseSchema !== e.responseSchema
    ) {
      modified.push({ from: old, to: e });
    }
  }

  for (const e of oldSnap) {
    if (!newByKey.has(keyOf(e))) {
      removed.push(e);
    }
  }

  console.log("🔀 Endpoint diff completed");
  console.log(`➕ Added: ${added.length}`);
  console.log(`🔄 Modified: ${modified.length}`);
  console.log(`➖ Removed: ${removed.length}`);
  console.log(`   (Missing hooks will be detected by validate-hooks.mjs)`);

  if (added.length === 0 && modified.length === 0 && removed.length === 0) {
    console.log("✓ No endpoint changes detected");
  }

  const result = {
    generatedAt: new Date().toISOString(),
    schemas: schemaChanges,
    params: paramsChanges || { added: [], removed: [], modified: [] },
    formBodies: formBodyChanges || { added: [], removed: [], modified: [] },
    endpoints: {
      added,
      modified,
      removed,
      missingHooks: [], // Will be populated by validate-hooks
    },
  };

  await writeFile(SCHEMA_CHANGES_FILE, JSON.stringify(result, null, 2), "utf8");
  console.log(
    `✅ Changes written to ${SCHEMA_CHANGES_FILE.replace(rootDir + "/", "")}`
  );

  return result;
}

// ============================================
// Step 6: CI Guard Validation (Optional)
// ============================================
function fail(msg) {
  console.error("❌ CI GUARD FAILED");
  console.error(msg);
  process.exit(1);
}

async function runCIGuard(changes) {
  const { schemas = {}, endpoints = {} } = changes;

  const hasSchemaChanges =
    (schemas.added?.length ?? 0) > 0 ||
    (schemas.modified?.length ?? 0) > 0 ||
    (schemas.removed?.length ?? 0) > 0;
  const hasEndpointChanges =
    (endpoints.added?.length ?? 0) > 0 ||
    (endpoints.modified?.length ?? 0) > 0 ||
    (endpoints.removed?.length ?? 0) > 0;

  if (!hasSchemaChanges && !hasEndpointChanges) {
    console.log("✅ No schema or endpoint changes detected. Guard passed.");
    return;
  }

  console.log("🔍 Running CI guard validation...");

  const hookFiles = await glob("src/hooks/**/*.ts");
  const uiFiles = await glob("src/pages/**/*.tsx");
  const componentFiles = await glob("src/components/**/*.tsx");

  const hookContent = await Promise.all(
    hookFiles.map((f) => readFile(f, "utf8"))
  );
  const uiContent = await Promise.all(uiFiles.map((f) => readFile(f, "utf8")));
  const componentContent = await Promise.all(
    componentFiles.map((f) => readFile(f, "utf8"))
  );

  const allText = [...hookContent, ...uiContent, ...componentContent].join(
    "\n"
  );

  for (const schema of schemas?.added ?? []) {
    if (!allText.includes(schema)) {
      fail(
        `Schema "${schema}" was added but is NOT used in any hook or UI.\n` +
          `You must create/update hook AND UI to adopt this schema.`
      );
    }
  }

  for (const schema of schemas?.modified ?? []) {
    if (!allText.includes(schema)) {
      fail(
        `Schema "${schema}" was modified but is NOT referenced anywhere.\n` +
          `You must update hook/UI to match new schema.`
      );
    }
  }

  for (const e of endpoints?.modified ?? []) {
    const oldMethod = e.from?.clientMethod;
    if (oldMethod && allText.includes(`api.${oldMethod}`)) {
      fail(
        `Endpoint method "${oldMethod}" was modified but is STILL used in code.\n` +
          `You must migrate hooks to the new API method.`
      );
    }
  }

  for (const e of endpoints?.added ?? []) {
    const method = e.clientMethod;
    if (method && !allText.includes(`api.${method}`)) {
      fail(
        `Endpoint "${method}" was added but NO hook/UI uses it.\n` +
          `You must create hook and UI integration.`
      );
    }
  }

  console.log("✅ CI Guard passed: schema, route, hook, and UI are in sync.");
}

// ============================================
// Main Function
// ============================================
async function main() {
  const args = process.argv.slice(2);
  const skipGuard = args.includes("--skip-guard");
  const runGuard = args.includes("--guard") || process.env.CI;

  try {
    // Step 1: Generate OpenAPI Zod Schema
    const openApiContent = await generateOpenApiZod();

    // Step 2: Generate Compat Layer & Detect Schema Changes
    const schemaChanges = await generateCompatLayer(openApiContent);

    // Step 3: Extract Endpoints Snapshot
    const endpointsSnapshot = await extractEndpointsSnapshot(openApiContent);

    // Step 3.5: Generate Params Schemas
    const paramsResult = await generateParamsSchemas(endpointsSnapshot);
    const paramsChanges = paramsResult?.changes || {
      added: [],
      removed: [],
      modified: [],
    };

    // Step 3.6: Generate Form Body Schemas (file uploads)
    const formBodyResult = await generateFormBodySchemas(
      openApiContent,
      endpointsSnapshot
    );
    const formBodyChanges = formBodyResult?.changes || {
      added: [],
      removed: [],
      modified: [],
    };

    // Step 4: Diff Endpoints (MUST do this BEFORE copying snapshot to prev)
    const changes = await diffEndpoints(
      endpointsSnapshot,
      schemaChanges,
      paramsChanges,
      formBodyChanges
    );

    // Step 4.5: Run validate-hooks to detect ALL missing hooks (including existing endpoints)
    console.log("\n🔍 Running hook validation to detect missing hooks...");
    let missingHooksFromValidation = [];
    try {
      const { stdout } = await execAsync(
        `node scripts/validate-hooks.mjs --json`,
        { cwd: rootDir }
      );
      // validate-hooks --json must output clean JSON ONLY
      const validationResult = JSON.parse(stdout.trim());
      missingHooksFromValidation = validationResult.missingHooks || [];

      if (missingHooksFromValidation.length > 0) {
        console.log(
          `   ⚠️  Found ${missingHooksFromValidation.length} missing hooks (including existing endpoints)`
        );
      } else {
        console.log("   ✅ All endpoints have corresponding hooks");
      }
    } catch (err) {
      // If validate-hooks fails, continue anyway (might be first run)
      console.warn(`   ⚠️  Could not run validate-hooks: ${err.message}`);
    }

    // Merge missing hooks from validation into changes
    // Add endpoints that are missing hooks but not in "added" (they're existing endpoints)
    const addedEndpointKeys = new Set(
      changes.endpoints.added.map((e) => `${e.httpMethod} ${e.path}`)
    );

    for (const missing of missingHooksFromValidation) {
      const key = `${missing.method} ${missing.path}`;
      if (!addedEndpointKeys.has(key)) {
        // This is an existing endpoint that's missing a hook
        // Add it to a new "missingHooks" array in changes
        if (!changes.endpoints.missingHooks) {
          changes.endpoints.missingHooks = [];
        }
        // Find full endpoint details from snapshot
        const fullEndpoint = endpointsSnapshot.find(
          (e) => e.httpMethod === missing.method && e.path === missing.path
        );
        if (fullEndpoint) {
          changes.endpoints.missingHooks.push({
            ...fullEndpoint,
            missingReason: missing.issue,
            expectedSuffix: missing.suffix,
          });
        }
      }
    }

    // Persist merged missingHooks back to schema-route-changes.json
    try {
      await writeFile(
        SCHEMA_CHANGES_FILE,
        JSON.stringify(changes, null, 2),
        "utf8"
      );
      console.log(
        `✅ Updated ${SCHEMA_CHANGES_FILE.replace(rootDir + "/", "")} with endpoints.missingHooks (${changes.endpoints.missingHooks?.length ?? 0})`
      );
    } catch (err) {
      console.warn(
        `⚠️  Could not update ${SCHEMA_CHANGES_FILE}: ${err.message}`
      );
    }

    // Step 5: Copy snapshot to previous (local dev only) - AFTER diff is done
    if (!process.env.CI) {
      try {
        await copyFile(SNAPSHOT_FILE, PREV_SNAPSHOT_FILE);
        console.log("✅ Copied snapshot to previous snapshot file");
      } catch (err) {
        if (err.code !== "ENOENT") {
          console.warn(`⚠️  Could not copy snapshot file: ${err.message}`);
        }
      }
    }

    // Step 6: Run CI Guard (if requested)
    if (runGuard && !skipGuard) {
      await runCIGuard(changes);
    }

    console.log("\n🎉 All done! API sync completed successfully.");
  } catch (e) {
    console.error("❌ Error:", e.message);
    if (e.stack) {
      console.error(e.stack);
    }
    process.exit(1);
  }
}

main();
