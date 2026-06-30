import { z } from "zod";
import {
  MaterialSpecResponseSchema as GenMaterialSpecResponseSchema,
  MaterialSpecResponseIPaginateSchema as GenMaterialSpecResponseIPaginateSchema,
  CreateMaterialSpecRequestSchema as GenCreateMaterialSpecRequestSchema,
  UpdateMaterialSpecRequestSchema as GenUpdateMaterialSpecRequestSchema,
} from "./generated";

// ===== MaterialSpecResponse =====
export const MaterialSpecResponseSchema = GenMaterialSpecResponseSchema.passthrough();
export type MaterialSpecResponse = z.infer<typeof MaterialSpecResponseSchema>;

// ===== MaterialSpecResponseIPaginate =====
export const MaterialSpecResponseIPaginateSchema = GenMaterialSpecResponseIPaginateSchema.passthrough();
export type MaterialSpecResponseIPaginate = z.infer<
  typeof MaterialSpecResponseIPaginateSchema
>;

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
