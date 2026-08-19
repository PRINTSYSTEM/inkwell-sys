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
  ProofingAllocationResponseSchema,
} from "./generated";

// ===== ProofingOrderDesignResponse =====
export const ProofingOrderDesignResponseSchema =
  GenProofingOrderDesignResponseSchema.extend({
    designThumbnailUrl: z.string().nullable().optional(),
    proofingAllocations: z.array(ProofingAllocationResponseSchema).nullable().optional(),
  }).passthrough();
export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

// ===== ProofingOrderImageResponse =====
export const ProofingOrderImageResponseSchema =
  GenProofingOrderImageResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderImageResponse = z.infer<typeof ProofingOrderImageResponseSchema>;

// ===== ProofingOrderResponse =====
export const ProofingOrderResponseSchema =
  GenProofingOrderResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
    scheduleStatus: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    images: z.array(ProofingOrderImageResponseSchema).nullable().optional(),
    returnType: z.string().nullable().optional(),
    returnTypeDisplayName: z.string().nullable().optional(),
    returnReason: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

// ===== ProofingOrderListResponse =====
export const ProofingOrderListResponseSchema =
  GenProofingOrderListResponseSchema.extend({
    thumbnailUrl: z.string().nullable().optional(),
    scheduleStatus: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    returnType: z.string().nullable().optional(),
    returnTypeDisplayName: z.string().nullable().optional(),
    returnReason: z.string().nullable().optional(),
  }).passthrough();
export type ProofingOrderListResponse = z.infer<typeof ProofingOrderListResponseSchema>;

// ===== CompletedProofingOrderListParams =====
export const CompletedProofingOrderListParamsSchema = z.object({
  fromDate: z.string().nullable().optional(),
  toDate: z.string().nullable().optional(),
  designTypeId: z.number().nullable().optional(),
  scheduleStatus: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  pageNumber: z.number().nullable().optional(),
  pageSize: z.number().nullable().optional(),
  sortColumn: z.string().nullable().optional(),
  sortOrder: z.string().nullable().optional(),
}).passthrough();
export type CompletedProofingOrderListParams = z.infer<typeof CompletedProofingOrderListParamsSchema>;

// ===== ProofingOrderListResponsePaginate =====
export const ProofingOrderListResponsePaginateSchema =
  GenProofingOrderListResponsePaginateSchema.extend({
    items: z.array(ProofingOrderListResponseSchema).nullable().optional(),
  }).passthrough();
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
  GenAddProofingOrderDetailItemSchema.extend({
    side: z.enum(["both", "front", "back"]).optional(),
  }).passthrough();
export type AddProofingOrderDetailItem = z.infer<
  typeof AddProofingOrderDetailItemSchema
>;

// ===== UpdateProofingDesignItem =====
export const UpdateProofingDesignItemSchema =
  GenUpdateProofingDesignItemSchema.extend({
    side: z.enum(["both", "front", "back"]).optional(),
  }).passthrough();
export type UpdateProofingDesignItem = z.infer<
  typeof UpdateProofingDesignItemSchema
>;

// ===== UpdateProofingOrderRequest =====
export const UpdateProofingOrderRequestSchema =
  GenUpdateProofingOrderRequestSchema.extend({
    completedAt: z.string().nullable().optional(),
    designUpdates: z.array(UpdateProofingDesignItemSchema).nullable().optional(),
  }).passthrough();
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
