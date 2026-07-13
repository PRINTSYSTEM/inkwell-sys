import { z } from "zod";
import {
  MaterialSpecResponseSchema as GenMaterialSpecResponseSchema,
  MaterialSpecResponsePaginateSchema as GenMaterialSpecResponsePaginateSchema,
  CreateMaterialSpecRequestSchema as GenCreateMaterialSpecRequestSchema,
  UpdateMaterialSpecRequestSchema as GenUpdateMaterialSpecRequestSchema,
} from "./generated";

// ===== MaterialSpecResponse =====
export const MaterialSpecResponseSchema = GenMaterialSpecResponseSchema.passthrough();
export type MaterialSpecResponse = z.infer<typeof MaterialSpecResponseSchema>;

// ===== MaterialSpecResponseIPaginate =====
export const MaterialSpecResponsePaginateSchema = GenMaterialSpecResponsePaginateSchema.passthrough();
export const MaterialSpecResponseIPaginateSchema = MaterialSpecResponsePaginateSchema;
export type MaterialSpecResponsePaginate = z.infer<
  typeof MaterialSpecResponsePaginateSchema
>;
export type MaterialSpecResponseIPaginate = MaterialSpecResponsePaginate;

// ===== CreateMaterialSpecRequest =====
export const CreateMaterialSpecRequestSchema = GenCreateMaterialSpecRequestSchema.passthrough();
export type CreateMaterialSpecRequest = z.infer<
  typeof CreateMaterialSpecRequestSchema
>;

// ===== UpdateMaterialSpecRequest =====
export const UpdateMaterialSpecRequestSchema = GenUpdateMaterialSpecRequestSchema.passthrough();
export type UpdateMaterialSpecRequest = z.infer<
  typeof UpdateMaterialSpecRequestSchema
>;

// ===== MaterialSpecListParams (Compatibility Alias) =====
import {
  MaterialTypeSpecsPaginatedParamsSchema,
} from "./generated-params";

export const MaterialSpecListParamsSchema = MaterialTypeSpecsPaginatedParamsSchema;
export type MaterialSpecListParams = z.infer<typeof MaterialSpecListParamsSchema>;
