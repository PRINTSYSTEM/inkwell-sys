// src/Schema/accounting.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema } from "./common";

// ===== AccountingResponse =====

export const AccountingResponseSchema = z
  .object({
    id: IdSchema.optional(),
    orderId: IdSchema.optional(),
    orderCode: z.string().nullable().optional(),
    accountantId: IdSchema.optional(),
    accountantName: z.string().nullable().optional(),
    invoiceNumber: z.string().nullable().optional(),
    invoiceUrl: z.string().nullable().optional(),
    paymentStatus: z.string().nullable().optional(),
    totalAmount: z.number().optional(),
    deposit: z.number().optional(),
    remainingAmount: z.number().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    customerId: IdSchema.optional(),
    customerName: z.string().nullable().optional(),
    customerType: z.string().nullable().optional(),
    customerCurrentDebt: z.number().optional(),
  })
  .passthrough();

export type AccountingResponse = z.infer<typeof AccountingResponseSchema>;

// ===== ConfirmPaymentRequest =====

export const ConfirmPaymentRequestSchema = z
  .object({
    amount: z
      .number({
        required_error: "Số tiền thanh toán là bắt buộc",
        invalid_type_error: "Số tiền phải là số",
      })
      .min(0.01, "Số tiền thanh toán phải lớn hơn 0"),
    paymentMethod: z
      .string({
        invalid_type_error: "Phương thức thanh toán phải là chuỗi",
      })
      .nullable()
      .optional(),
    notes: z
      .string({
        invalid_type_error: "Ghi chú phải là chuỗi",
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export type ConfirmPaymentRequest = z.infer<typeof ConfirmPaymentRequestSchema>;

// ===== DebtComparisonFileResponse =====

export const DebtComparisonFileResponseSchema = z.string();
export type DebtComparisonFileResponse = z.infer<
  typeof DebtComparisonFileResponseSchema
>;
