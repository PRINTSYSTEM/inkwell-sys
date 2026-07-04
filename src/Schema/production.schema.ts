// src/Schema/production.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import {
  ProductionResponseSchema as GenProductionResponseSchema,
  ProductionOrderResponseSchema as GenProductionOrderResponseSchema,
  ProductionOrderResponsePaginateSchema as GenProductionOrderResponsePaginateSchema,
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
export const ProductionOrderResponseSchema =
  GenProductionOrderResponseSchema.passthrough();
export type ProductionOrderResponse = z.infer<
  typeof ProductionOrderResponseSchema
>;

// ===== ProductionOrderResponsePaginate =====
export const ProductionOrderResponsePaginateSchema =
  GenProductionOrderResponsePaginateSchema.passthrough();
export type ProductionOrderResponsePaginate = z.infer<
  typeof ProductionOrderResponsePaginateSchema
>;

// ===== ProductionStepResponse =====
export const ProductionStepResponseSchema =
  GenProductionStepResponseSchema.passthrough();
export type ProductionStepResponse = z.infer<
  typeof ProductionStepResponseSchema
>;

// ===== CreateProductionOrderRequest =====
export const CreateProductionOrderRequestSchema =
  GenCreateProductionOrderRequestSchema.passthrough();
export type CreateProductionOrderRequest = z.infer<
  typeof CreateProductionOrderRequestSchema
>;

// ===== UpdateProductionStepRequest =====
export const UpdateProductionStepRequestSchema =
  GenUpdateProductionStepRequestSchema.passthrough();
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
