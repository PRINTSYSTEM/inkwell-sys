// src/Schema/invoice.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, createPagedResponseSchema } from "./Common";
import {
  InvoiceItemResponseSchema as GenInvoiceItemResponseSchema,
  InvoiceOrderResponseSchema as GenInvoiceOrderResponseSchema,
  InvoiceResponseSchema as GenInvoiceResponseSchema,
  CreateInvoiceRequestSchema as GenCreateInvoiceRequestSchema,
  CreateInvoiceItemRequestSchema as GenCreateInvoiceItemRequestSchema,
  UpdateInvoiceRequestSchema as GenUpdateInvoiceRequestSchema,
} from "./generated";

// ===== InvoiceItemResponse =====
export const InvoiceItemResponseSchema =
  GenInvoiceItemResponseSchema.passthrough();
export type InvoiceItemResponse = z.infer<typeof InvoiceItemResponseSchema>;

// ===== InvoiceOrderResponse =====
export const InvoiceOrderResponseSchema =
  GenInvoiceOrderResponseSchema.passthrough();
export type InvoiceOrderResponse = z.infer<typeof InvoiceOrderResponseSchema>;

// ===== InvoiceResponse =====
export const InvoiceResponseSchema = GenInvoiceResponseSchema.passthrough();
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

// ===== PagedResponse =====
export const InvoiceResponsePagedResponseSchema = createPagedResponseSchema(
  InvoiceResponseSchema
);
export type InvoiceResponsePagedResponse = z.infer<
  typeof InvoiceResponsePagedResponseSchema
>;

// ===== CreateInvoiceRequest =====
// Base from generated, but keep custom validation
export const CreateInvoiceRequestSchema = GenCreateInvoiceRequestSchema.refine(
  (data) => {
    if (data.orderIds && data.orderIds.length < 1) {
      return false;
    }
    return true;
  },
  { message: "Cần ít nhất 1 đơn hàng", path: ["orderIds"] }
);
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

// ===== CreateInvoiceItemRequest =====
export const CreateInvoiceItemRequestSchema =
  GenCreateInvoiceItemRequestSchema.passthrough();
export type CreateInvoiceItemRequest = z.infer<
  typeof CreateInvoiceItemRequestSchema
>;

// ===== UpdateInvoiceRequest =====
export const UpdateInvoiceRequestSchema =
  GenUpdateInvoiceRequestSchema.passthrough();
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;

// ===== InvoiceFileResponse (for export) =====
// Custom schema - not in generated
export const InvoiceFileResponseSchema = z.string();
export type InvoiceFileResponse = z.infer<typeof InvoiceFileResponseSchema>;
