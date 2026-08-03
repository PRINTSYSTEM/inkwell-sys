// src/Schema/vendor.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { createPagedResponseSchema } from "./Common";
import { schemas } from "./generated";

// Import Vendor schemas
const GenVendorResponseSchema = schemas.VendorResponse;
const GenVendorResponsePaginateSchema = schemas.VendorResponsePaginate;
const GenCreateVendorRequestSchema = schemas.CreateVendorRequest;
const GenUpdateVendorRequestSchema = schemas.UpdateVendorRequest;
const GenVendorCountOptionResponseSchema = schemas.VendorCountOptionResponse;
const GenVendorCountOptionResponsePaginateSchema = schemas.VendorCountOptionResponseIPaginate;

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

// ===== SettleVendorDebtRequest =====
export const SettleVendorDebtRequestSchema =
  schemas.SettleVendorDebtRequest?.passthrough() || z.any();
export type SettleVendorDebtRequest = z.infer<typeof SettleVendorDebtRequestSchema>;

// ===== SettleVendorDebtBatchItem =====
export const SettleVendorDebtBatchItemSchema =
  schemas.SettleVendorDebtBatchItem?.passthrough() || z.any();
export type SettleVendorDebtBatchItem = z.infer<typeof SettleVendorDebtBatchItemSchema>;

// ===== VendorDebtHistoryResponse =====
export const VendorDebtHistoryResponseSchema =
  schemas.VendorDebtHistoryResponse?.passthrough() || z.any();
export type VendorDebtHistoryResponse = z.infer<typeof VendorDebtHistoryResponseSchema>;


