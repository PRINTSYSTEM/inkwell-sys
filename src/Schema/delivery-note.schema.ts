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
  OrderForDeliveryResponsePaginateSchema as GenOrderForDeliveryResponsePaginateSchema,
  UpdateDeliveryLineResultRequestSchema as GenUpdateDeliveryLineResultRequestSchema,
  DeliveryNoteHistoryItemResponseSchema as GenDeliveryNoteHistoryItemResponseSchema,
  DeliveryNoteStatsResponseSchema as GenDeliveryNoteStatsResponseSchema,
} from "./generated";

// ===== DeliveryNoteOrderResponse =====
export const DeliveryNoteOrderResponseSchema =
  GenDeliveryNoteOrderResponseSchema.extend({
    customerId: z.number().int().nullable().optional(),
  }).passthrough();
export type DeliveryNoteOrderResponse = z.infer<
  typeof DeliveryNoteOrderResponseSchema
>;

// ===== DeliveryNoteResponse =====
export const DeliveryNoteResponseSchema =
  GenDeliveryNoteResponseSchema.extend({
    expectedDeliveryDate: z.string().nullable().optional(),
    customerId: z.number().int().nullable().optional(),
  }).passthrough();
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
    expectedDeliveryDate: z.string().nullable().optional(),
    lines: z
      .array(
        z.object({
          orderDetailId: z.number().int(),
          deliveryQty: z.number().int().gte(1),
          note: z.string().nullish(),
          isRedelivery: z.boolean().optional(),
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

// ===== UpdateDeliveryNoteRequest =====
export const UpdateDeliveryNoteRequestSchema = z
  .object({
    expectedDeliveryDate: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    customerAddressId: z.number().int().nullable().optional(),
  })
  .passthrough();
export type UpdateDeliveryNoteRequest = z.infer<
  typeof UpdateDeliveryNoteRequestSchema
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
        isRedelivery: z.boolean().optional(),
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
    isRedelivery: z.boolean().optional(),
  }).passthrough();
export type DeliveryLineRequest = z.infer<typeof DeliveryLineRequestSchema>;

// ===== AddDeliveryNoteLinesRequest =====
export const AddDeliveryNoteLinesRequestSchema = z.object({
  lines: z.array(DeliveryLineRequestSchema),
}).passthrough();
export type AddDeliveryNoteLinesRequest = z.infer<
  typeof AddDeliveryNoteLinesRequestSchema
>;

// ===== UpdateDeliveryLineQuantityRequest =====
export const UpdateDeliveryLineQuantityRequestSchema = z.object({
  deliveryQty: z.number(),
  note: z.string().nullish(),
}).passthrough();
export type UpdateDeliveryLineQuantityRequest = z.infer<
  typeof UpdateDeliveryLineQuantityRequestSchema
>;

// ===== CustomerAddress =====
// Reused from customer.schema.ts

// ===== DeliveryNoteLineResponse =====
// Extended with new fields from backend_new_update.md §4:
// orderCode, customerAddressId, customerAddress (object), maxEditableQty
export const DeliveryNoteLineResponseSchema =
  GenDeliveryNoteLineResponseSchema.extend({
    orderCode: z.string().nullable().optional(),
    customerAddressId: z.number().int().nullable().optional(),
    customerAddress: CustomerAddressSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    designImageUrl: z.string().nullable().optional(),
    designThumbnailUrl: z.string().nullable().optional(),
    proofingOrderCodes: z.array(z.string()).nullable().optional(),
    maxEditableQty: z.number().nullable().optional(),
    isRedelivery: z.boolean().optional(),
    isRedeliveryName: z.string().optional(),
  }).passthrough();
export type DeliveryNoteLineResponse = z.infer<
  typeof DeliveryNoteLineResponseSchema
>;

// ===== FailureReasonResponse =====
export const FailureReasonResponseSchema =
  GenFailureReasonResponseSchema.passthrough();
export type FailureReasonResponse = z.infer<typeof FailureReasonResponseSchema>;

// ===== DeliveryNoteHistoryItemResponse =====
// Một phiếu giao hàng trong lịch sử của mã hàng (đối chiếu khi tạo PGH)
export const DeliveryNoteHistoryItemResponseSchema =
  GenDeliveryNoteHistoryItemResponseSchema.extend({
    expectedDeliveryDate: z.string().nullable().optional(),
    deliveryDate: z.string().nullable().optional(),
  }).passthrough();
export type DeliveryNoteHistoryItemResponse = z.infer<
  typeof DeliveryNoteHistoryItemResponseSchema
>;

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
    designThumbnailUrl: z.string().nullable().optional(),
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
    completedProofingOrderCodes: z.array(z.string()).nullable().optional(),
    // Lịch sử phiếu giao hàng hiệu lực của mã hàng (để đối chiếu khi tạo PGH)
    deliveryHistory: z
      .array(DeliveryNoteHistoryItemResponseSchema)
      .nullable()
      .optional(),
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

// ===== OrderForDeliveryResponsePaginate =====
export const OrderForDeliveryResponsePaginateSchema =
  GenOrderForDeliveryResponsePaginateSchema.passthrough();
export type OrderForDeliveryResponsePaginate = z.infer<
  typeof OrderForDeliveryResponsePaginateSchema
>;

// ===== UpdateDeliveryLineResultRequest =====
export const UpdateDeliveryLineResultRequestSchema =
  GenUpdateDeliveryLineResultRequestSchema.passthrough();
export type UpdateDeliveryLineResultRequest = z.infer<
  typeof UpdateDeliveryLineResultRequestSchema
>;

// ===== DeliveryNoteStatsResponse =====
export const DeliveryNoteStatsResponseSchema =
  GenDeliveryNoteStatsResponseSchema.passthrough();
export type DeliveryNoteStatsResponse = z.infer<
  typeof DeliveryNoteStatsResponseSchema
>;

// ===== BulkCompleteDeliveryNotesRequest =====
export const BulkCompleteDeliveryNotesRequestSchema = z.object({
  deliveryNoteIds: z
    .array(z.number().int())
    .min(1, "Cần chọn ít nhất 1 phiếu giao hàng"),
});
export type BulkCompleteDeliveryNotesRequest = z.infer<
  typeof BulkCompleteDeliveryNotesRequestSchema
>;

// ===== BulkCompleteResultItem =====
export const BulkCompleteResultItemSchema = z.object({
  deliveryNoteId: z.number().int(),
  code: z.string().nullable().optional(),
  status: z.string(),
  deliveredLineCount: z.number().int().optional(),
  reason: z.string().nullable().optional(),
});
export type BulkCompleteResultItem = z.infer<
  typeof BulkCompleteResultItemSchema
>;

// ===== BulkCompleteDeliveryNotesResponse =====
export const BulkCompleteDeliveryNotesResponseSchema = z.object({
  total: z.number().int(),
  completedCount: z.number().int(),
  skippedCount: z.number().int(),
  results: z.array(BulkCompleteResultItemSchema),
});
export type BulkCompleteDeliveryNotesResponse = z.infer<
  typeof BulkCompleteDeliveryNotesResponseSchema
>;

