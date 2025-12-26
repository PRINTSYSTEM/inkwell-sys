// scripts/build-compat-generated.mjs
// Auto-generate src/Schema/generated.ts from src/generated/openapi.zod.ts
// This ensures all schemas in swagger are available with "Schema" suffix

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const input = join(rootDir, "src/generated/openapi.zod.ts");
const output = join(rootDir, "src/Schema/generated.ts");

try {
  const src = readFileSync(input, "utf8");

  // Tìm block `export const schemas = { ... }`
  const schemasMatch = src.match(
    /export\s+const\s+schemas\s*=\s*{([\s\S]*?)}\s*;/
  );
  if (!schemasMatch) {
    console.error("❌ Cannot find `export const schemas = { ... }` in openapi.zod.ts");
    process.exit(1);
  }

  const schemasBlock = schemasMatch[1];

  // Lấy tên keys dạng `CustomerResponse,` hoặc `CustomerResponse:`
  const keys = [
    ...schemasBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:?\s*,?/gm),
  ]
    .map((x) => x[1])
    .filter((k) => k && k !== "schemas"); // Remove empty and invalid

  if (keys.length === 0) {
    console.error("❌ No schema keys found in schemas object");
    process.exit(1);
  }

  // Sort keys for consistent output
  keys.sort();

  const lines = [];
  lines.push(`/* AUTO-GENERATED FILE. DO NOT EDIT. */`);
  lines.push(`/* Source: ${input.replace(rootDir + "/", "")} */`);
  lines.push(`/* Generated at: ${new Date().toISOString()} */\n`);
  lines.push(`import { schemas, api, createApiClient } from "@/generated/openapi.zod";\n`);
  lines.push(`// Re-export API client`);
  lines.push(`export { api, createApiClient, schemas };\n`);
  lines.push(`// Re-export schemas with "Schema" suffix for compatibility\n`);

  for (const key of keys) {
    // export const CustomerResponseSchema = schemas.CustomerResponse;
    lines.push(`export const ${key}Schema = schemas.${key};`);
  }

  lines.push("");

  writeFileSync(output, lines.join("\n"), "utf8");
  console.log(`✅ Generated ${output.replace(rootDir + "/", "")}`);
  console.log(`   Exported ${keys.length} schemas with "Schema" suffix`);
} catch (error) {
  console.error("❌ Error generating compat layer:", error.message);
  process.exit(1);
}

