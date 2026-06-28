// src/Schema/supplier-type.schema.ts
import { z } from "zod";
import { schemas } from "./generated";

// ===== SupplierType schemas =====
export const SupplierTypeResponseSchema = schemas.SupplierTypeResponse.passthrough();
export type SupplierTypeResponse = z.infer<typeof SupplierTypeResponseSchema>;

export const SupplierTypeResponseIPaginateSchema = schemas.SupplierTypeResponseIPaginate.passthrough();
export type SupplierTypeResponseIPaginate = z.infer<typeof SupplierTypeResponseIPaginateSchema>;

export const CreateSupplierTypeRequestSchema = schemas.CreateSupplierTypeRequest.passthrough();
export type CreateSupplierTypeRequest = z.infer<typeof CreateSupplierTypeRequestSchema>;

export const UpdateSupplierTypeRequestSchema = schemas.UpdateSupplierTypeRequest.passthrough();
export type UpdateSupplierTypeRequest = z.infer<typeof UpdateSupplierTypeRequestSchema>;
