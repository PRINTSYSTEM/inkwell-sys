// src/Schema/delivery-note.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";

// ===== DeliveryNoteOrderResponse =====
export const DeliveryNoteOrderResponseSchema = z
  .object({
    orderId: IdSchema.optional(),
    orderCode: z.string().nullable().optional(),
    customerName: z.string().nullable().optional(),
    totalAmount: z.number().optional(),
    deliveryAddress: z.string().nullable().optional(),
  })
  .passthrough();

export type DeliveryNoteOrderResponse = z.infer<
  typeof DeliveryNoteOrderResponseSchema
>;

// ===== DeliveryNoteResponse =====
export const DeliveryNoteResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    statusName: z.string().nullable().optional(),
    failureReason: z.string().nullable().optional(),
    failureType: z.string().nullable().optional(),
    failureTypeName: z.string().nullable().optional(),
    affectsDebt: z.boolean().optional(),
    recipientName: z.string().nullable().optional(),
    recipientPhone: z.string().nullable().optional(),
    deliveryAddress: z.string().nullable().optional(),
    deliveredBy: UserInfoSchema.optional(),
    deliveredAt: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
    pdfUrl: z.string().nullable().optional(),
    createdBy: UserInfoSchema.optional(),
    createdAt: DateSchema.optional(),
    orders: z.array(DeliveryNoteOrderResponseSchema).nullable().optional(),
  })
  .passthrough();

export type DeliveryNoteResponse = z.infer<typeof DeliveryNoteResponseSchema>;

// ===== DeliveryNoteResponsePaginate =====
export const DeliveryNoteResponsePaginateSchema =
  createPagedResponseSchema(DeliveryNoteResponseSchema);

export type DeliveryNoteResponsePaginate = z.infer<
  typeof DeliveryNoteResponsePaginateSchema
>;

// ===== UpdateDeliveryStatusRequest =====
export const UpdateDeliveryStatusRequestSchema = z
  .object({
    status: z.string().min(0).max(20),
    failureReason: z.string().nullable().optional(),
    failureType: z.string().min(0).max(50).nullable().optional(),
    affectsDebt: z.boolean().nullable().optional(),
    deliveredAt: DateSchema.nullable().optional(),
    deliveredById: IdSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdateDeliveryStatusRequest = z.infer<
  typeof UpdateDeliveryStatusRequestSchema
>;

// ===== RecreateDeliveryNoteRequest =====
export const RecreateDeliveryNoteRequestSchema = z
  .object({
    originalDeliveryNoteId: IdSchema,
    orderIds: z.array(IdSchema).nullable().optional(),
    recipientName: z.string().min(0).max(255).nullable().optional(),
    recipientPhone: z.string().min(0).max(20).nullable().optional(),
    deliveryAddress: z.string().min(0).max(500).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type RecreateDeliveryNoteRequest = z.infer<
  typeof RecreateDeliveryNoteRequestSchema
>;

// ===== CreateDeliveryNoteRequest =====
export const CreateDeliveryNoteRequestSchema = z
  .object({
    orderIds: z.array(IdSchema).min(1),
    recipientName: z.string().max(255).nullable().optional(),
    recipientPhone: z.string().max(20).nullable().optional(),
    deliveryAddress: z.string().max(500).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateDeliveryNoteRequest = z.infer<
  typeof CreateDeliveryNoteRequestSchema
>;

