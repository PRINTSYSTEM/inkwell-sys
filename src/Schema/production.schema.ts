// src/Schema/production.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import {
  ProductionResponseSchema as GenProductionResponseSchema,
  ProductionResponsePaginateSchema as GenProductionResponsePaginateSchema,
  CreateProductionRequestSchema as GenCreateProductionRequestSchema,
  UpdateProductionRequestSchema as GenUpdateProductionRequestSchema,
  StartProductionRequestSchema as GenStartProductionRequestSchema,
  CompleteProductionRequestSchema as GenCompleteProductionRequestSchema,
} from "./generated";

// ===== ProductionResponse =====
export const ProductionResponseSchema =
  GenProductionResponseSchema.passthrough();
export type ProductionResponse = z.infer<typeof ProductionResponseSchema>;

// ===== PagedResponse =====
export const ProductionResponsePagedResponseSchema = createPagedResponseSchema(
  ProductionResponseSchema
);
export type ProductionResponsePagedResponse = z.infer<
  typeof ProductionResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenProductionResponsePaginateSchema as ProductionResponsePaginateSchema,
};
export type ProductionResponsePaginate = z.infer<
  typeof GenProductionResponsePaginateSchema
>;

// ===== CreateProductionRequest =====
export const CreateProductionRequestSchema =
  GenCreateProductionRequestSchema.passthrough();
export type CreateProductionRequest = z.infer<
  typeof CreateProductionRequestSchema
>;

// ===== UpdateProductionRequest =====
export const UpdateProductionRequestSchema =
  GenUpdateProductionRequestSchema.passthrough();
export type UpdateProductionRequest = z.infer<
  typeof UpdateProductionRequestSchema
>;

// ===== StartProductionRequest =====
export const StartProductionRequestSchema =
  GenStartProductionRequestSchema.passthrough();
export type StartProductionRequest = z.infer<
  typeof StartProductionRequestSchema
>;

// ===== CompleteProductionRequest =====
export const CompleteProductionRequestSchema =
  GenCompleteProductionRequestSchema.passthrough();
export type CompleteProductionRequest = z.infer<
  typeof CompleteProductionRequestSchema
>;
