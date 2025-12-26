// src/Schema/delivery-note.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import {
  DeliveryNoteOrderResponseSchema as GenDeliveryNoteOrderResponseSchema,
  DeliveryNoteResponseSchema as GenDeliveryNoteResponseSchema,
  DeliveryNoteResponsePaginateSchema as GenDeliveryNoteResponsePaginateSchema,
  CreateDeliveryNoteRequestSchema as GenCreateDeliveryNoteRequestSchema,
  UpdateDeliveryStatusRequestSchema as GenUpdateDeliveryStatusRequestSchema,
  RecreateDeliveryNoteRequestSchema as GenRecreateDeliveryNoteRequestSchema,
} from "./generated";

// ===== DeliveryNoteOrderResponse =====
export const DeliveryNoteOrderResponseSchema =
  GenDeliveryNoteOrderResponseSchema.passthrough();
export type DeliveryNoteOrderResponse = z.infer<
  typeof DeliveryNoteOrderResponseSchema
>;

// ===== DeliveryNoteResponse =====
export const DeliveryNoteResponseSchema =
  GenDeliveryNoteResponseSchema.passthrough();
export type DeliveryNoteResponse = z.infer<typeof DeliveryNoteResponseSchema>;

// ===== DeliveryNoteResponsePaginate =====
// Use utility-based paged response
export const DeliveryNoteResponsePaginateSchema =
  createPagedResponseSchema(DeliveryNoteResponseSchema);
export type DeliveryNoteResponsePaginate = z.infer<
  typeof DeliveryNoteResponsePaginateSchema
>;

// Re-export generated paginate schema with different name for compatibility
export {
  GenDeliveryNoteResponsePaginateSchema as DeliveryNoteResponsePaginateSchemaFromGenerated,
};
export type DeliveryNoteResponsePaginateFromGenerated = z.infer<
  typeof GenDeliveryNoteResponsePaginateSchema
>;

// ===== CreateDeliveryNoteRequest =====
// Base from generated, but keep custom validation
export const CreateDeliveryNoteRequestSchema =
  GenCreateDeliveryNoteRequestSchema.refine(
    (data) => {
      if (data.orderIds && data.orderIds.length < 1) {
        return false;
      }
      return true;
    },
    { message: "Cần ít nhất 1 đơn hàng", path: ["orderIds"] }
  );
export type CreateDeliveryNoteRequest = z.infer<
  typeof CreateDeliveryNoteRequestSchema
>;

// ===== UpdateDeliveryStatusRequest =====
export const UpdateDeliveryStatusRequestSchema =
  GenUpdateDeliveryStatusRequestSchema.passthrough();
export type UpdateDeliveryStatusRequest = z.infer<
  typeof UpdateDeliveryStatusRequestSchema
>;

// ===== RecreateDeliveryNoteRequest =====
export const RecreateDeliveryNoteRequestSchema =
  GenRecreateDeliveryNoteRequestSchema.passthrough();
export type RecreateDeliveryNoteRequest = z.infer<
  typeof RecreateDeliveryNoteRequestSchema
>;
