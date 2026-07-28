// src/Schema/params.schema.ts
// This file contains manually maintained params schemas and re-exports generated ones
import { z } from "zod";
import { PagedParamsSchema, type PagedParams } from "./Common";

// Re-export for convenience
export { PagedParamsSchema };
export type { PagedParams };

// ===== Re-export generated params schemas =====
// Auto-generated params schemas from OpenAPI schema
export * from "./generated-params";

// ===== Manually maintained params (if any need custom logic) =====
// These can override or extend generated schemas if needed

export const DesignSaleParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
});
export type DesignSaleParams = z.infer<typeof DesignSaleParamsSchema>;

import {
  MaterialListParamsSchema as GenMaterialListParamsSchema,
  DesignListParamsSchema as GenDesignListParamsSchema,
  ProofingOrderListParamsSchema as GenProofingOrderListParamsSchema,
  InvoicBillableItemsParamsSchema as GenInvoicBillableItemsParamsSchema,
} from "./generated-params";

export const DesignListParamsSchema = GenDesignListParamsSchema.extend({
  search: z.string().nullable().optional(),
  designTypeId: z.number().nullable().optional(),
  materialTypeId: z.number().nullable().optional(),
});
export type DesignListParams = z.infer<typeof DesignListParamsSchema>;

export const MaterialListParamsSchema = GenMaterialListParamsSchema.extend({
  search: z.string().nullable().optional(),
  quantityMin: z.number().nullable().optional(),
});
export type MaterialListParams = z.infer<typeof MaterialListParamsSchema>;

export const ProofingOrderListParamsSchema = GenProofingOrderListParamsSchema.extend({
  code: z.string().nullable().optional(),
});
export type ProofingOrderListParams = z.infer<typeof ProofingOrderListParamsSchema>;

export const InvoicBillableItemsParamsSchema = GenInvoicBillableItemsParamsSchema.extend({
  fromDate: z.string().nullable().optional(),
  toDate: z.string().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
});
export type InvoicBillableItemsParams = z.infer<typeof InvoicBillableItemsParamsSchema>;
