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
  DeliveryLineRequestSchema as GenDeliveryLineRequestSchema,
  DeliveryNoteLineResponseSchema as GenDeliveryNoteLineResponseSchema,
  FailureReasonResponseSchema as GenFailureReasonResponseSchema,
  OrderDetailForDeliveryResponseSchema as GenOrderDetailForDeliveryResponseSchema,
  OrderForDeliveryResponseSchema as GenOrderForDeliveryResponseSchema,
  UpdateDeliveryLineResultRequestSchema as GenUpdateDeliveryLineResultRequestSchema,
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

// ===== DeliveryLineRequest =====
export const DeliveryLineRequestSchema =
  GenDeliveryLineRequestSchema.passthrough();
export type DeliveryLineRequest = z.infer<
  typeof DeliveryLineRequestSchema
>;

// ===== DeliveryNoteLineResponse =====
export const DeliveryNoteLineResponseSchema =
  GenDeliveryNoteLineResponseSchema.passthrough();
export type DeliveryNoteLineResponse = z.infer<
  typeof DeliveryNoteLineResponseSchema
>;

// ===== FailureReasonResponse =====
export const FailureReasonResponseSchema =
  GenFailureReasonResponseSchema.passthrough();
export type FailureReasonResponse = z.infer<
  typeof FailureReasonResponseSchema
>;

// ===== OrderDetailForDeliveryResponse =====
export const OrderDetailForDeliveryResponseSchema =
  GenOrderDetailForDeliveryResponseSchema.passthrough();
export type OrderDetailForDeliveryResponse = z.infer<
  typeof OrderDetailForDeliveryResponseSchema
>;

// ===== OrderForDeliveryResponse =====
export const OrderForDeliveryResponseSchema =
  GenOrderForDeliveryResponseSchema.passthrough();
export type OrderForDeliveryResponse = z.infer<
  typeof OrderForDeliveryResponseSchema
>;

// ===== UpdateDeliveryLineResultRequest =====
export const UpdateDeliveryLineResultRequestSchema =
  GenUpdateDeliveryLineResultRequestSchema.passthrough();
export type UpdateDeliveryLineResultRequest = z.infer<
  typeof UpdateDeliveryLineResultRequestSchema
>;
