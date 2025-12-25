// src/Schema/invoice.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";

// ===== InvoiceItemResponse =====
export const InvoiceItemResponseSchema = z
  .object({
    id: IdSchema.optional(),
    orderDetailId: IdSchema.nullable().optional(),
    sortOrder: z.number().int().optional(),
    description: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    amount: z.number().optional(),
  })
  .passthrough();

export type InvoiceItemResponse = z.infer<typeof InvoiceItemResponseSchema>;

// ===== InvoiceOrderResponse =====
export const InvoiceOrderResponseSchema = z
  .object({
    orderId: IdSchema.optional(),
    orderCode: z.string().nullable().optional(),
    amount: z.number().optional(),
  })
  .passthrough();

export type InvoiceOrderResponse = z.infer<
  typeof InvoiceOrderResponseSchema
>;

// ===== InvoiceResponse =====
export const InvoiceResponseSchema = z
  .object({
    id: IdSchema.optional(),
    invoiceNumber: z.string().nullable().optional(),
    invoiceType: z.string().nullable().optional(),
    totalAmount: z.number().optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
    grandTotal: z.number().optional(),
    status: z.string().nullable().optional(),
    statusName: z.string().nullable().optional(),
    pdfUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    sellerName: z.string().nullable().optional(),
    sellerTaxCode: z.string().nullable().optional(),
    sellerAddress: z.string().nullable().optional(),
    sellerPhone: z.string().nullable().optional(),
    sellerBankAccount: z.string().nullable().optional(),
    sellerBankName: z.string().nullable().optional(),
    buyerName: z.string().nullable().optional(),
    buyerCompanyName: z.string().nullable().optional(),
    buyerTaxCode: z.string().nullable().optional(),
    buyerAddress: z.string().nullable().optional(),
    buyerEmail: z.string().nullable().optional(),
    paymentMethod: z.string().nullable().optional(),
    buyerBankAccount: z.string().nullable().optional(),
    createdBy: UserInfoSchema.optional(),
    issuedAt: DateSchema.optional(),
    createdAt: DateSchema.optional(),
    orders: z.array(InvoiceOrderResponseSchema).nullable().optional(),
    items: z.array(InvoiceItemResponseSchema).nullable().optional(),
  })
  .passthrough();

export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

// ===== CreateInvoiceRequest =====
export const CreateInvoiceRequestSchema = z
  .object({
    orderIds: z.array(IdSchema).min(1),
    invoiceNumber: z.string().nullable().optional(),
    taxRate: z.number().min(0).max(1).optional(),
    notes: z.string().nullable().optional(),
    buyerName: z.string().nullable().optional(),
    buyerCompanyName: z.string().nullable().optional(),
    buyerTaxCode: z.string().nullable().optional(),
    buyerAddress: z.string().nullable().optional(),
    buyerEmail: z.string().nullable().optional(),
    paymentMethod: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

// ===== UpdateInvoiceRequest =====
export const UpdateInvoiceRequestSchema = z
  .object({
    invoiceNumber: z.string().nullable().optional(),
    status: z.string().min(0).max(20).nullable().optional(),
    notes: z.string().nullable().optional(),
    buyerName: z.string().nullable().optional(),
    buyerCompanyName: z.string().nullable().optional(),
    buyerTaxCode: z.string().nullable().optional(),
    buyerAddress: z.string().nullable().optional(),
    buyerEmail: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;

// ===== InvoiceFileResponse (for export) =====
export const InvoiceFileResponseSchema = z.string();
export type InvoiceFileResponse = z.infer<typeof InvoiceFileResponseSchema>;
