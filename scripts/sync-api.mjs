// scripts/sync-api.mjs
// Master script that combines all API sync operations:
// 1. Generate OpenAPI schema and compat layer
// 2. Extract endpoints snapshot
// 3. Diff endpoints to detect changes
// 4. Validate changes with CI guard (optional)

import { mkdir, writeFile, readFile, unlink, copyFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { glob } from "glob";

dotenv.config({ path: ".env.development" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const SWAGGER_URL = process.env.VITE_SWAGGER_URL || process.env.SWAGGER_URL;
if (!SWAGGER_URL) {
  console.error("❌ Missing env: VITE_SWAGGER_URL (or SWAGGER_URL)");
  process.exit(1);
}

const OUT_DIR = "src/generated";
const SWAGGER_FILE = "swagger.json";
const OUT_FILE = `${OUT_DIR}/openapi.zod.ts`;
const COMPAT_FILE = join(rootDir, "src/Schema/generated.ts");
const CACHE_FILE = join(rootDir, ".schema-cache.json");
const SNAPSHOT_FILE = join(rootDir, ".cursor/openapi.endpoints.snapshot.json");
const PREV_SNAPSHOT_FILE = join(
  rootDir,
  ".cursor/openapi.endpoints.snapshot.prev.json"
);
const SCHEMA_CHANGES_FILE = join(rootDir, ".cursor/schema-route-changes.json");

// ============================================
// Step 1: Generate OpenAPI Zod Schema
// ============================================
async function generateOpenApiZod() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("📥 Fetch swagger:", SWAGGER_URL);
  const res = await fetch(SWAGGER_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const spec = await res.json();
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

  let prevCache = {};
  try {
    const cacheContent = await readFile(CACHE_FILE, "utf8");
    prevCache = JSON.parse(cacheContent);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`⚠️  Could not read cache file: ${err.message}`);
    }
  }

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
    const prev = prevCache[key];
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

  const newCache = {};
  for (const [key, value] of currentSchemas.entries()) {
    newCache[key] = { hash: value.hash };
  }
  await writeFile(CACHE_FILE, JSON.stringify(newCache, null, 2), "utf8");

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

      endpoints.push({
        clientMethod:
          clientMethod ||
          `${httpMethod.toLowerCase()}${path.replace(/[^a-zA-Z0-9]/g, "")}`,
        httpMethod,
        path,
        requestSchema,
        responseSchema,
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

async function diffEndpoints(newSnap, schemaChanges) {
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

  if (added.length === 0 && modified.length === 0 && removed.length === 0) {
    console.log("✓ No endpoint changes detected");
  }

  const result = {
    generatedAt: new Date().toISOString(),
    schemas: schemaChanges,
    endpoints: {
      added,
      modified,
      removed,
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

    // Step 4: Copy snapshot to previous (local dev only)
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

    // Step 5: Diff Endpoints
    const changes = await diffEndpoints(endpointsSnapshot, schemaChanges);

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
