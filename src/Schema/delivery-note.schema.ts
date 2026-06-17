// src/Schema/delivery-note.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { createPagedResponseSchema } from "./Common";
import { CustomerAddressSchema } from "./customer.schema";
import {
  DeliveryNoteOrderResponseSchema as GenDeliveryNoteOrderResponseSchema,
  DeliveryNoteResponseSchema as GenDeliveryNoteResponseSchema,
  DeliveryNoteResponsePaginateSchema as GenDeliveryNoteResponsePaginateSchema,
  CreateDeliveryNoteRequestSchema as GenCreateDeliveryNoteRequestSchema,
  UpdateDeliveryStatusRequestSchema as GenUpdateDeliveryStatusRequestSchema,
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
// New format per backend_new_update.md: uses lines[] instead of orderIds[]
// Validates that at least 1 line is provided
export const CreateDeliveryNoteRequestSchema =
  GenCreateDeliveryNoteRequestSchema.extend({
    customerAddressId: z.number().int().nullish(),
    notes: z.string().nullish(),
    lines: z
      .array(
        z.object({
          orderDetailId: z.number().int(),
          deliveryQty: z.number().int().gte(1),
          note: z.string().nullish(),
        })
      )
      .nullish(),
  }).refine(
    (data) => {
      if (!data.lines || data.lines.length < 1) {
        return false;
      }
      return true;
    },
    { message: "Cần ít nhất 1 dòng hàng để tạo phiếu giao", path: ["lines"] }
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
// New format per backend_new_update.md:
// - Old fields REMOVED: orderIds, recipientName, recipientPhone, deliveryAddress
// - lines: null => BE auto-recreates from all failed lines
// - lines: [...] => custom per-line recreate
export const RecreateDeliveryNoteRequestSchema = z.object({
  originalDeliveryNoteId: z.number().int(),
  lines: z
    .array(
      z.object({
        orderDetailId: z.number().int(),
        deliveryQty: z.number().int().gte(1),
        customerAddressId: z.number().int().nullish(),
        note: z.string().nullish(),
      })
    )
    .nullish(),
  notes: z.string().nullish(),
});
export type RecreateDeliveryNoteRequest = z.infer<
  typeof RecreateDeliveryNoteRequestSchema
>;

// ===== DeliveryLineRequest =====
export const DeliveryLineRequestSchema =
  GenDeliveryLineRequestSchema.extend({
    note: z.string().nullish(),
  }).passthrough();
export type DeliveryLineRequest = z.infer<typeof DeliveryLineRequestSchema>;

// ===== CustomerAddress =====
// Reused from customer.schema.ts

// ===== DeliveryNoteLineResponse =====
// Extended with new fields from backend_new_update.md §4:
// orderCode, customerAddressId, customerAddress (object)
export const DeliveryNoteLineResponseSchema =
  GenDeliveryNoteLineResponseSchema.extend({
    orderCode: z.string().nullable().optional(),
    customerAddressId: z.number().int().nullable().optional(),
    customerAddress: CustomerAddressSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    designImageUrl: z.string().nullable().optional(),
    proofingOrderCodes: z.array(z.string()).nullable().optional(),
  }).passthrough();
export type DeliveryNoteLineResponse = z.infer<
  typeof DeliveryNoteLineResponseSchema
>;

// ===== FailureReasonResponse =====
export const FailureReasonResponseSchema =
  GenFailureReasonResponseSchema.passthrough();
export type FailureReasonResponse = z.infer<typeof FailureReasonResponseSchema>;

// ===== OrderDetailForDeliveryResponse =====
// Overriding generated schema as it's missing customerId, customerName, orderCode, orderId
// per backend_new_update.md §2 response spec
export const OrderDetailForDeliveryResponseSchema = z
  .object({
    orderDetailId: z.number().int(),
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    designImageUrl: z.string().nullable().optional(),
    itemStatus: z.string().nullable(),
    orderedQty: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyTotal: z.number().int(),
    remainingToDeliver: z.number().int(),
    scrapQty: z.number().int().nullable(),
    unitPrice: z.number(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    proofingOrderCodes: z.array(z.string()).nullable().optional(),
  })
  .partial()
  .passthrough();
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
