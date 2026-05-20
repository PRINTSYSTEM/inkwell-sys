// src/Schema/material.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  MaterialResponseSchema as GenMaterialResponseSchema,
  MaterialResponseIPaginateSchema as GenMaterialResponseIPaginateSchema,
  CreateMaterialRequestSchema as GenCreateMaterialRequestSchema,
  UpdateMaterialRequestSchema as GenUpdateMaterialRequestSchema,
} from "./generated";

// ===== MaterialResponse =====
export const MaterialResponseSchema =
  GenMaterialResponseSchema?.passthrough().extend({
    unit: z.string().nullable().optional(),
    unitPrice: z.number().nullable().optional(),
  }) || z.any();
export type MaterialResponse = z.infer<typeof MaterialResponseSchema>;

// ===== MaterialResponseIPaginate =====
export const MaterialResponseIPaginateSchema =
  GenMaterialResponseIPaginateSchema?.passthrough() || z.any();
export type MaterialResponseIPaginate = z.infer<
  typeof MaterialResponseIPaginateSchema
>;

// ===== CreateMaterialRequest =====
export const CreateMaterialRequestSchema =
  GenCreateMaterialRequestSchema?.passthrough() || z.any();
export type CreateMaterialRequest = z.infer<
  typeof CreateMaterialRequestSchema
>;

// ===== UpdateMaterialRequest =====
export const UpdateMaterialRequestSchema =
  GenUpdateMaterialRequestSchema?.passthrough().extend({
    unit: z.string().nullable().optional(),
    unitPrice: z.number().nullable().optional(),
  }) || z.any();
export type UpdateMaterialRequest = z.infer<
  typeof UpdateMaterialRequestSchema
>;


