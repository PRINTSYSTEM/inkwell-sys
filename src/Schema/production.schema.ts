// src/Schema/production.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import {
  ProductionResponseSchema as GenProductionResponseSchema,
  ProductionOrderResponseSchema as GenProductionOrderResponseSchema,
  ProductionStepResponseSchema as GenProductionStepResponseSchema,
  CreateProductionOrderRequestSchema as GenCreateProductionOrderRequestSchema,
  UpdateProductionStepRequestSchema as GenUpdateProductionStepRequestSchema,
  AssignProductionStepRequestSchema as GenAssignProductionStepRequestSchema,
  BulkUpdateProductionOrderItemsRequestSchema as GenBulkUpdateProductionOrderItemsRequestSchema,
} from "./generated";

// ===== ProductionResponse (Legacy - still used in some endpoints) =====
export const ProductionResponseSchema =
  GenProductionResponseSchema.passthrough();
export type ProductionResponse = z.infer<typeof ProductionResponseSchema>;

// ===== ProductionOrderResponse =====
export const ProductionOrderResponseSchema = GenProductionOrderResponseSchema.extend({
  isUrgent: z.boolean().nullish(),
  proofingOrder: z.object({
    id: z.number(),
    code: z.string().nullable().optional(),
    totalQuantity: z.number().nullable().optional(),
    totalProcessedQty: z.number().nullable().optional(),
    isUrgent: z.boolean().nullish(),
    imageUrl: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
    customPaperSize: z.string().nullable().optional(),
    paperSizeId: z.number().nullable().optional(),
    paperSize: z.object({
      id: z.number(),
      name: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).nullable().optional(),
    basisWeight: z.number().nullable().optional(),
    rollWidth: z.number().nullable().optional(),
    designTypeId: z.number().nullable().optional(),
    designType: z.object({
      id: z.number(),
      code: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
    }).nullable().optional(),
    processClassification: z.string().nullable().optional(),
    laminationType: z.string().nullable().optional(),
    laminationTypeName: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    plateExport: z.object({
      id: z.number(),
      plateCount: z.number().nullable().optional(),
      productionMethod: z.string().nullable().optional(),
      plateVendorName: z.string().nullable().optional(),
      printingVendorName: z.string().nullable().optional(),
      printingVendor: z.object({
        id: z.number(),
        name: z.string().nullable().optional(),
      }).nullable().optional(),
      isReceived: z.boolean().nullable().optional(),
      receivedAt: z.string().nullable().optional(),
      estimatedReceiveAt: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      plate: z.object({
        notes: z.string().nullable().optional(),
      }).nullable().optional(),
    }).nullable().optional(),
    images: z.array(z.object({
      id: z.number(),
      imageUrl: z.string(),
      thumbnailUrl: z.string().nullable().optional(),
    })).nullable().optional(),
    proofingOrderDesigns: z.array(z.object({
      isUrgent: z.boolean().nullable().optional(),
      design: z.object({
        designType: z.object({
          id: z.number(),
          code: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
        }).nullable().optional(),
        basisWeight: z.number().nullable().optional(),
        laminationType: z.string().nullable().optional(),
        isUrgent: z.boolean().nullable().optional(),
      }).nullable().optional(),
      quantity: z.number().nullable().optional(),
      itemsPerSheet: z.number().nullable().optional(),
    })).nullable().optional(),
    proofingOrderDies: z.array(z.object({
      id: z.number(),
      code: z.string().nullable().optional(),
      size: z.string().nullable().optional(),
      isReceived: z.boolean().nullable().optional(),
      isNewDie: z.boolean().nullable().optional(),
      receivedAt: z.string().nullable().optional(),
      estimatedReceiveAt: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      dieExportNotes: z.string().nullable().optional(),
      die: z.object({
        id: z.number(),
        code: z.string().nullable().optional(),
        length: z.number().nullable().optional(),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        size: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        vendorName: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }).nullable().optional(),
    })).nullable().optional(),
  }).passthrough().nullable().optional(),
  materialTypeName: z.string().nullish(),
  paperSizeName: z.string().nullish(),
  basisWeight: z.number().nullish(),
  designTypeName: z.string().nullish(),
  specification: z.union([z.array(z.string()), z.string()]).nullish(),
  totalQuantity: z.number().nullish(),
  impositionCompletedAt: z.string().nullish(),
  printOrderCompletedAt: z.string().nullish(),
}).passthrough();
export type ProductionOrderResponse = z.infer<
  typeof ProductionOrderResponseSchema
>;

// ===== ProductionOrderResponsePaginate =====
export const ProductionOrderResponsePaginateSchema = createPagedResponseSchema(
  ProductionOrderResponseSchema
);
export type ProductionOrderResponsePaginate = z.infer<
  typeof ProductionOrderResponsePaginateSchema
>;

// ===== ProductionStepResponse =====
export const ProductionStepResponseSchema =
  GenProductionStepResponseSchema.passthrough();
export type ProductionStepResponse = z.infer<
  typeof ProductionStepResponseSchema
>;

// ===== ProductionStepHistoryResponse =====
export const ProductionStepHistoryResponseSchema = z.object({
  id: z.number(),
  stepId: z.number(),
  fromStatus: z.string().nullish(),
  toStatus: z.string().nullish(),
  note: z.string().nullish(),
  userId: z.number().nullish(),
  userName: z.string().nullish(),
  createdAt: z.string().nullish(),
}).passthrough();
export type ProductionStepHistoryResponse = z.infer<
  typeof ProductionStepHistoryResponseSchema
>;

// ===== CreateProductionOrderRequest =====
export const CreateProductionOrderRequestSchema =
  GenCreateProductionOrderRequestSchema.passthrough();
export type CreateProductionOrderRequest = z.infer<
  typeof CreateProductionOrderRequestSchema
>;

// ===== UpdateProductionStepRequest =====
export const UpdateProductionStepRequestSchema =
  GenUpdateProductionStepRequestSchema.extend({
    note: z.string().nullish(),
  }).passthrough();
export type UpdateProductionStepRequest = z.infer<
  typeof UpdateProductionStepRequestSchema
>;

// ===== AssignProductionStepRequest =====
export const AssignProductionStepRequestSchema =
  GenAssignProductionStepRequestSchema.passthrough();
export type AssignProductionStepRequest = z.infer<
  typeof AssignProductionStepRequestSchema
>;

// ===== BulkUpdateProductionOrderItemsRequest =====
export const BulkUpdateProductionOrderItemsRequestSchema =
  GenBulkUpdateProductionOrderItemsRequestSchema.passthrough();
export type BulkUpdateProductionOrderItemsRequest = z.infer<
  typeof BulkUpdateProductionOrderItemsRequestSchema
>;

// ===== PagedResponse (Legacy helper for ProductionResponse) =====
export const ProductionResponsePagedResponseSchema = createPagedResponseSchema(
  ProductionResponseSchema
);
export type ProductionResponsePagedResponse = z.infer<
  typeof ProductionResponsePagedResponseSchema
>;
