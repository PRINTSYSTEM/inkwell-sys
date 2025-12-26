// scripts/gen-schema-compat.mjs
// Combined script to generate openapi.zod.ts and compat layer in one go
// This ensures proper execution order and better performance

import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

