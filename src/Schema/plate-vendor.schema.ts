// src/Schema/plate-vendor.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { createPagedResponseSchema } from "./Common";
import {
  PlateVendorResponseSchema as GenPlateVendorResponseSchema,
  PlateVendorResponsePaginateSchema as GenPlateVendorResponsePaginateSchema,
  CreatePlateVendorRequestSchema as GenCreatePlateVendorRequestSchema,
  UpdatePlateVendorRequestSchema as GenUpdatePlateVendorRequestSchema,
} from "./generated";

// ===== PlateVendorResponse =====
export const PlateVendorResponseSchema =
  GenPlateVendorResponseSchema.passthrough();
export type PlateVendorResponse = z.infer<typeof PlateVendorResponseSchema>;

// ===== PagedResponse =====
export const PlateVendorResponsePagedResponseSchema = createPagedResponseSchema(
  PlateVendorResponseSchema
);
export type PlateVendorResponsePagedResponse = z.infer<
  typeof PlateVendorResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenPlateVendorResponsePaginateSchema as PlateVendorResponsePaginateSchema,
};
export type PlateVendorResponsePaginate = z.infer<
  typeof GenPlateVendorResponsePaginateSchema
>;

// ===== CreatePlateVendorRequest =====
export const CreatePlateVendorRequestSchema =
  GenCreatePlateVendorRequestSchema.passthrough();
export type CreatePlateVendorRequest = z.infer<
  typeof CreatePlateVendorRequestSchema
>;

// ===== UpdatePlateVendorRequest =====
export const UpdatePlateVendorRequestSchema =
  GenUpdatePlateVendorRequestSchema.passthrough();
export type UpdatePlateVendorRequest = z.infer<
  typeof UpdatePlateVendorRequestSchema
>;
