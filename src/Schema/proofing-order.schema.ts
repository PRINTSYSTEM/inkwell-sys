// src/Schema/proofing-order.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema";
import { PaperSizeResponseSchema } from "./paper-size.schema";
import { PlateExportResponseSchema } from "./plate-export.schema";
import { DieExportResponseSchema } from "./die-export.schema";
import {
  ProofingOrderDesignResponseSchema as GenProofingOrderDesignResponseSchema,
  ProofingOrderResponseSchema as GenProofingOrderResponseSchema,
  ProofingOrderResponsePaginateSchema as GenProofingOrderResponsePaginateSchema,
  UpdateProofingDesignItemSchema as GenUpdateProofingDesignItemSchema,
  UpdateProofingOrderRequestSchema as GenUpdateProofingOrderRequestSchema,
  AddDesignsToProofingOrderRequestSchema as GenAddDesignsToProofingOrderRequestSchema,
  AddProofingOrderDetailItemSchema as GenAddProofingOrderDetailItemSchema,
} from "./generated";

// ===== ProofingOrderDesignResponse =====
export const ProofingOrderDesignResponseSchema =
  GenProofingOrderDesignResponseSchema.passthrough();
export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

// ===== ProofingOrderResponse =====
export const ProofingOrderResponseSchema =
  GenProofingOrderResponseSchema.passthrough();
export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

// ===== PagedResponse =====
export const ProofingOrderResponsePagedResponseSchema =
  createPagedResponseSchema(ProofingOrderResponseSchema);
export type ProofingOrderResponsePagedResponse = z.infer<
  typeof ProofingOrderResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenProofingOrderResponsePaginateSchema as ProofingOrderResponsePaginateSchema };
export type ProofingOrderResponsePaginate = z.infer<
  typeof GenProofingOrderResponsePaginateSchema
>;

// ===== AddProofingOrderDetailItem =====
export const AddProofingOrderDetailItemSchema =
  GenAddProofingOrderDetailItemSchema.passthrough();
export type AddProofingOrderDetailItem = z.infer<
  typeof AddProofingOrderDetailItemSchema
>;

// ===== UpdateProofingDesignItem =====
export const UpdateProofingDesignItemSchema =
  GenUpdateProofingDesignItemSchema.passthrough();
export type UpdateProofingDesignItem = z.infer<
  typeof UpdateProofingDesignItemSchema
>;

// ===== UpdateProofingOrderRequest =====
export const UpdateProofingOrderRequestSchema =
  GenUpdateProofingOrderRequestSchema.passthrough();
export type UpdateProofingOrderRequest = z.infer<
  typeof UpdateProofingOrderRequestSchema
>;

// ===== AddDesignsToProofingOrderRequest =====
export const AddDesignsToProofingOrderRequestSchema =
  GenAddDesignsToProofingOrderRequestSchema.passthrough();
export type AddDesignsToProofingOrderRequest = z.infer<
  typeof AddDesignsToProofingOrderRequestSchema
>;

// ===== AvailableQuantityResponse =====
// Custom schema - not in generated
// Response from /api/proofing-orders/available-quantity/{designId}
export const AvailableQuantityResponseSchema = z.unknown();
export type AvailableQuantityResponse = z.infer<
  typeof AvailableQuantityResponseSchema
>;
