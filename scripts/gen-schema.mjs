// scripts/gen-schema.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

import dotenv from "dotenv";
dotenv.config({ path: ".env.development" }); 

const SWAGGER_URL = process.env.VITE_SWAGGER_URL || process.env.VITE_SWAGGER_URL;
if (!SWAGGER_URL) {
  console.error("❌ Missing env: VITE_SWAGGER_URL (or SWAGGER_URL)");
  process.exit(1);
}

const OUT_DIR = "src/generated";
const SWAGGER_FILE = "swagger.json";
const OUT_FILE = `${OUT_DIR}/openapi.zod.ts`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("📥 Fetch swagger:", SWAGGER_URL);
  const res = await fetch(SWAGGER_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const spec = await res.json();
  await writeFile(SWAGGER_FILE, JSON.stringify(spec, null, 2), "utf8");

  console.log("🧩 Generate zod ->", OUT_FILE);
  execSync(`npx openapi-zod-client ./${SWAGGER_FILE} -o ./${OUT_FILE}`, {
    stdio: "inherit",
  });

  console.log("🎨 Prettier");
  execSync(`npx prettier -w ./${OUT_FILE}`, { stdio: "inherit" });

  console.log("✅ Done");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
