// src/Schema/invoice.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, createPagedResponseSchema } from "./Common";
import {
  InvoiceItemResponseSchema as GenInvoiceItemResponseSchema,
  InvoiceOrderResponseSchema as GenInvoiceOrderResponseSchema,
  InvoiceResponseSchema as GenInvoiceResponseSchema,
  InvoiceResponsePaginateSchema as GenInvoiceResponsePaginateSchema,
  CreateInvoiceRequestSchema as GenCreateInvoiceRequestSchema,
  UpdateInvoiceRequestSchema as GenUpdateInvoiceRequestSchema,
  BillableItemResponseSchema as GenBillableItemResponseSchema,
  CreateInvoiceFromLinesRequestSchema as GenCreateInvoiceFromLinesRequestSchema,
  InvoiceLineInputSchema as GenInvoiceLineInputSchema,
  IssueInvoiceRequestSchema as GenIssueInvoiceRequestSchema,
  UpdateEInvoiceInfoRequestSchema as GenUpdateEInvoiceInfoRequestSchema,
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

// Re-export generated paginate schema for compatibility
export {
  GenInvoiceResponsePaginateSchema as InvoiceResponsePaginateSchema,
};
export type InvoiceResponsePaginate = z.infer<
  typeof GenInvoiceResponsePaginateSchema
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

// ===== UpdateInvoiceRequest =====
export const UpdateInvoiceRequestSchema =
  GenUpdateInvoiceRequestSchema.passthrough();
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;

// ===== BillableItemResponse =====
export const BillableItemResponseSchema =
  GenBillableItemResponseSchema.passthrough();
export type BillableItemResponse = z.infer<typeof BillableItemResponseSchema>;

// ===== InvoiceLineInput =====
export const InvoiceLineInputSchema =
  GenInvoiceLineInputSchema.passthrough();
export type InvoiceLineInput = z.infer<typeof InvoiceLineInputSchema>;

// ===== CreateInvoiceFromLinesRequest =====
export const CreateInvoiceFromLinesRequestSchema =
  GenCreateInvoiceFromLinesRequestSchema.passthrough();
export type CreateInvoiceFromLinesRequest = z.infer<
  typeof CreateInvoiceFromLinesRequestSchema
>;

// ===== IssueInvoiceRequest =====
export const IssueInvoiceRequestSchema =
  GenIssueInvoiceRequestSchema.passthrough();
export type IssueInvoiceRequest = z.infer<typeof IssueInvoiceRequestSchema>;

// ===== UpdateEInvoiceInfoRequest =====
export const UpdateEInvoiceInfoRequestSchema =
  GenUpdateEInvoiceInfoRequestSchema.passthrough();
export type UpdateEInvoiceInfoRequest = z.infer<
  typeof UpdateEInvoiceInfoRequestSchema
>;

// ===== InvoiceFileResponse (for export) =====
// Custom schema - not in generated
export const InvoiceFileResponseSchema = z.string();
export type InvoiceFileResponse = z.infer<typeof InvoiceFileResponseSchema>;
