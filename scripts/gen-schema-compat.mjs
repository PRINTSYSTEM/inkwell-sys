// scripts/gen-schema-compat.mjs
// Combined script to generate openapi.zod.ts and compat layer in one go
// This ensures proper execution order and better performance

import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

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

  // Verify file was created and is readable
  const content = await readFile(OUT_FILE, "utf8");
  if (!content || content.trim().length === 0) {
    throw new Error("Generated file is empty");
  }

  console.log("✅ Generated openapi.zod.ts");
  return content;
}

// Extract schema definition from openapi.zod.ts
function extractSchemaDefinition(content, schemaName) {
  // Tìm const schemaName = z.object({...}) hoặc const schemaName = z.string()...
  // Cần match cả multi-line definitions với balanced braces
  const startPattern = new RegExp(
    `const\\s+${schemaName}\\s*=\\s*`,
    "m"
  );
  const startMatch = content.search(startPattern);
  
  if (startMatch === -1) {
    return null;
  }

  // Tìm vị trí bắt đầu của definition (sau dấu =)
  let pos = startMatch;
  while (pos < content.length && content[pos] !== "=") {
    pos++;
  }
  pos++; // Skip '='
  while (pos < content.length && /\s/.test(content[pos])) {
    pos++; // Skip whitespace
  }

  // Parse balanced braces để lấy toàn bộ definition
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let startPos = pos;
  let endPos = pos;

  for (let i = pos; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : "";

    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== "\\") {
      inString = false;
      stringChar = null;
    }

    if (inString) continue;

    // Count braces
    if (char === "(" || char === "{" || char === "[") {
      depth++;
    } else if (char === ")" || char === "}" || char === "]") {
      depth--;
      if (depth < 0) {
        endPos = i;
        break;
      }
    }

    // Check for end of definition (semicolon at depth 0, or next const declaration)
    if (depth === 0 && char === ";") {
      endPos = i + 1;
      break;
    }

    // Check for next const declaration (at depth 0)
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

// Calculate hash of a string
function hashString(str) {
  return createHash("sha256").update(str || "").digest("hex").substring(0, 16);
}

async function generateCompatLayer(openApiContent) {
  console.log("🔗 Building compat layer...");

  // Tìm block `export const schemas = { ... }`
  const schemasMatch = openApiContent.match(
    /export\s+const\s+schemas\s*=\s*{([\s\S]*?)}\s*;/
  );
  if (!schemasMatch) {
    throw new Error(
      "❌ Cannot find `export const schemas = { ... }` in openapi.zod.ts"
    );
  }

  const schemasBlock = schemasMatch[1];

  // Lấy tên keys dạng `CustomerResponse,` hoặc `CustomerResponse:`
  const keys = [
    ...schemasBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:?\s*,?/gm),
  ]
    .map((x) => x[1])
    .filter((k) => k && k !== "schemas"); // Remove empty and invalid

  if (keys.length === 0) {
    throw new Error("❌ No schema keys found in schemas object");
  }

  // Sort keys for consistent output
  keys.sort();

  // Extract schema definitions and calculate hashes
  const currentSchemas = new Map();
  for (const key of keys) {
    const definition = extractSchemaDefinition(openApiContent, key);
    if (definition) {
      const hash = hashString(definition);
      currentSchemas.set(key, { definition, hash });
    }
  }

  // Load previous cache
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
    // export const CustomerResponseSchema = schemas.CustomerResponse;
    lines.push(`export const ${key}Schema = schemas.${key};`);
  }

  lines.push("");

  // ===== Detect schema changes =====
  const prevCompat = await readFile(COMPAT_FILE, "utf8").catch((err) => {
    if (err.code === "ENOENT") return null; // file chưa tồn tại
    throw err;
  });

  // Extract previous keys from existing compat file
  const prevKeys = prevCompat
    ? [...prevCompat.matchAll(/export const ([A-Za-z0-9_]+)Schema\s*=/g)].map(
        (m) => m[1]
      )
    : [];

  const prevSet = new Set(prevKeys);
  const nextSet = new Set(keys);

  const added = keys.filter((k) => !prevSet.has(k)); // có trong mới, không có trong cũ
  const removed = prevKeys.filter((k) => !nextSet.has(k)); // có trong cũ, không có trong mới
  const existing = keys.filter((k) => prevSet.has(k)); // có trong cả hai

  // Detect modified schemas by comparing hashes
  const modified = [];
  for (const key of existing) {
    const current = currentSchemas.get(key);
    const prev = prevCache[key];
    if (current && prev && current.hash !== prev.hash) {
      modified.push(key);
    }
  }

  // Log result
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

  // Save current cache for next run
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
    // Ignore if file doesn't exist
    if (err.code !== "ENOENT") {
      console.warn(`⚠️  Could not delete ${SWAGGER_FILE}:`, err.message);
    }
  }
}

async function main() {
  try {
    const openApiContent = await generateOpenApiZod();
    await generateCompatLayer(openApiContent);
    console.log("\n🎉 All done! Schema generation completed successfully.");
  } catch (e) {
    console.error("❌ Error:", e.message);
    if (e.stack) {
      console.error(e.stack);
    }
    process.exit(1);
  }
}

main();

