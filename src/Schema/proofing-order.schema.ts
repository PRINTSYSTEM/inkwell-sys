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
  ProofingOrderListResponsePaginateSchema as GenProofingOrderListResponsePaginateSchema,
  ProofingOrderListResponseSchema as GenProofingOrderListResponseSchema,
  UpdateProofingDesignItemSchema as GenUpdateProofingDesignItemSchema,
  UpdateProofingOrderRequestSchema as GenUpdateProofingOrderRequestSchema,
  AddDesignsToProofingOrderRequestSchema as GenAddDesignsToProofingOrderRequestSchema,
  AddProofingOrderDetailItemSchema as GenAddProofingOrderDetailItemSchema,
  ProofingOrderImageResponseSchema as GenProofingOrderImageResponseSchema,
} from "./generated";

// ===== ProofingOrderDesignResponse =====
export const ProofingOrderDesignResponseSchema =
  GenProofingOrderDesignResponseSchema.extend({
    designThumbnailUrl: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

// ===== ProofingOrderResponse =====
export const ProofingOrderResponseSchema =
  GenProofingOrderResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

// ===== ProofingOrderListResponse =====
export const ProofingOrderListResponseSchema =
  GenProofingOrderListResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderListResponse = z.infer<typeof ProofingOrderListResponseSchema>;

// ===== ProofingOrderImageResponse =====
export const ProofingOrderImageResponseSchema =
  GenProofingOrderImageResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderImageResponse = z.infer<typeof ProofingOrderImageResponseSchema>;

// ===== ProofingOrderListResponsePaginate =====
export const ProofingOrderListResponsePaginateSchema =
  GenProofingOrderListResponsePaginateSchema.passthrough();
export type ProofingOrderListResponsePaginate = z.infer<typeof ProofingOrderListResponsePaginateSchema>;

// ===== PagedResponse =====
export const ProofingOrderResponsePagedResponseSchema =
  createPagedResponseSchema(ProofingOrderResponseSchema);
export type ProofingOrderResponsePagedResponse = z.infer<
  typeof ProofingOrderResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export const ProofingOrderResponsePaginateSchema = ProofingOrderListResponsePaginateSchema;
export type ProofingOrderResponsePaginate = ProofingOrderListResponsePaginate;

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
  GenAddDesignsToProofingOrderRequestSchema.extend({
    materialTypeId: z.number().int().nullable().optional(),
  }).passthrough();
export type AddDesignsToProofingOrderRequest = z.infer<
  typeof AddDesignsToProofingOrderRequestSchema
>;

// ===== AvailableBinResponse =====
export const AvailableBinResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  materialTypeId: z.number().int().nullable().optional(),
  materialTypeName: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
}).passthrough();
export type AvailableBinResponse = z.infer<typeof AvailableBinResponseSchema>;

// ===== AvailableQuantityResponse =====
// Custom schema - not in generated
// Response from /api/proofing-orders/available-quantity/{designId}
export const AvailableQuantityResponseSchema = z.unknown();
export type AvailableQuantityResponse = z.infer<
  typeof AvailableQuantityResponseSchema
>;
