// src/Schema/vendor.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { createPagedResponseSchema } from "./Common";
import { schemas } from "./generated";

// Try to import Vendor schemas, fallback to PlateVendor if not available
const GenVendorResponseSchema =
  schemas.VendorResponse || schemas.PlateVendorResponse;
const GenVendorResponsePaginateSchema =
  schemas.VendorResponsePaginate || schemas.PlateVendorResponsePaginate;
const GenCreateVendorRequestSchema =
  schemas.CreateVendorRequest || schemas.CreatePlateVendorRequest;
const GenUpdateVendorRequestSchema =
  schemas.UpdateVendorRequest || schemas.UpdatePlateVendorRequest;
const GenVendorCountOptionResponseSchema =
  schemas.VendorCountOptionResponse || schemas.PlateCountOptionResponse;
const GenVendorCountOptionResponsePaginateSchema =
  schemas.VendorCountOptionResponseIPaginate || schemas.PlateCountOptionResponsePaginate;

// ===== VendorResponse =====
export const VendorResponseSchema =
  GenVendorResponseSchema?.passthrough() || z.any();
export type VendorResponse = z.infer<typeof VendorResponseSchema>;

// ===== PagedResponse =====
export const VendorResponsePagedResponseSchema = createPagedResponseSchema(
  VendorResponseSchema
);
export type VendorResponsePagedResponse = z.infer<
  typeof VendorResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export const VendorResponsePaginateSchema =
  GenVendorResponsePaginateSchema?.passthrough() || z.any();
export type VendorResponsePaginate = z.infer<
  typeof VendorResponsePaginateSchema
>;

// ===== CreateVendorRequest =====
export const CreateVendorRequestSchema =
  GenCreateVendorRequestSchema?.passthrough() || z.any();
export type CreateVendorRequest = z.infer<
  typeof CreateVendorRequestSchema
>;

// ===== UpdateVendorRequest =====
export const UpdateVendorRequestSchema =
  GenUpdateVendorRequestSchema?.passthrough() || z.any();
export type UpdateVendorRequest = z.infer<
  typeof UpdateVendorRequestSchema
>;

// ===== VendorCountOptionResponse =====
export const VendorCountOptionResponseSchema =
  GenVendorCountOptionResponseSchema?.passthrough() || z.any();
export type VendorCountOptionResponse = z.infer<
  typeof VendorCountOptionResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenVendorCountOptionResponsePaginateSchema as VendorCountOptionResponsePaginateSchema,
};
export type VendorCountOptionResponsePaginate = z.infer<
  typeof GenVendorCountOptionResponsePaginateSchema
>;


