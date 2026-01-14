// src/Schema/params.schema.ts
// This file contains manually maintained params schemas and re-exports generated ones
import { PagedParamsSchema, type PagedParams } from "./Common";

// Re-export for convenience
export { PagedParamsSchema };
export type { PagedParams };

// ===== Re-export generated params schemas =====
// Auto-generated params schemas from OpenAPI schema
export * from "./generated-params";

// ===== Manually maintained params (if any need custom logic) =====
// These can override or extend generated schemas if needed
