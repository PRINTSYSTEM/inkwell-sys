// src/Schema/return-note.schema.ts
import { z } from "zod";

// ===== ReturnLineRequest =====
export const ReturnLineRequestSchema = z.object({
  deliveryNoteLineId: z.number().int(),
  returnQty: z.number().int().min(1, "Số lượng trả phải lớn hơn hoặc bằng 1"),
  reason: z.string().min(1, "Lý do trả hàng không được để trống").max(500, "Lý do không được vượt quá 500 ký tự"),
});
export type ReturnLineRequest = z.infer<typeof ReturnLineRequestSchema>;

// ===== CreateReturnNoteRequest =====
export const CreateReturnNoteRequestSchema = z.object({
  deliveryNoteId: z.number().int(),
  lines: z.array(ReturnLineRequestSchema).min(1, "Cần ít nhất 1 dòng hàng trả"),
});
export type CreateReturnNoteRequest = z.infer<typeof CreateReturnNoteRequestSchema>;

// ===== ReturnNoteLineResponse =====
export const ReturnNoteLineResponseSchema = z.object({
  id: z.number().int(),
  deliveryNoteLineId: z.number().int(),
  productName: z.string().nullable().optional(),
  productCode: z.string().nullable().optional(),
  returnQty: z.number().int(),
  reason: z.string().nullable().optional(),
}).passthrough();
export type ReturnNoteLineResponse = z.infer<typeof ReturnNoteLineResponseSchema>;

// ===== ReturnNoteResponse =====
export const ReturnNoteResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable().optional(),
  deliveryNoteId: z.number().int(),
  deliveryNoteCode: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  statusLabel: z.string().nullable().optional(),
  totalReturnQty: z.number().int(),
  createdAt: z.string(),
  createdByName: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  processedByName: z.string().nullable().optional(),
  lines: z.array(ReturnNoteLineResponseSchema).nullable().optional(),
}).passthrough();
export type ReturnNoteResponse = z.infer<typeof ReturnNoteResponseSchema>;

// ===== ReturnableLineResponse =====
export const ReturnableLineResponseSchema = z.object({
  deliveryNoteLineId: z.number().int(),
  productName: z.string().nullable().optional(),
  productCode: z.string().nullable().optional(),
  actualDeliveredQty: z.number().int(),
  alreadyReturnedQty: z.number().int(),
  maxReturnableQty: z.number().int(),
  status: z.string().nullable().optional(),
}).passthrough();
export type ReturnableLineResponse = z.infer<typeof ReturnableLineResponseSchema>;

