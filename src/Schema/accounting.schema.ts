// src/Schema/accounting.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema } from "./Common";
import {
  AccountingResponseSchema as GenAccountingResponseSchema,
  ConfirmPaymentRequestSchema as GenConfirmPaymentRequestSchema,
  ExportDebtRequestSchema as GenExportDebtRequestSchema,
} from "./generated";

// ===== AccountingResponse =====
export const AccountingResponseSchema =
  GenAccountingResponseSchema.passthrough();
export type AccountingResponse = z.infer<typeof AccountingResponseSchema>;

// ===== ConfirmPaymentRequest =====
// Base from generated, but keep custom validation messages
export const ConfirmPaymentRequestSchema = GenConfirmPaymentRequestSchema.refine(
  (data) => {
    if (data.amount == null || data.amount <= 0) {
      return false;
    }
    return true;
  },
  {
    message: "Số tiền thanh toán phải lớn hơn 0",
    path: ["amount"],
  }
);
export type ConfirmPaymentRequest = z.infer<
  typeof ConfirmPaymentRequestSchema
>;

// ===== DebtComparisonFileResponse =====
// Custom schema - not in generated
export const DebtComparisonFileResponseSchema = z.string();
export type DebtComparisonFileResponse = z.infer<
  typeof DebtComparisonFileResponseSchema
>;

// ===== ExportDebtRequest =====
export const ExportDebtRequestSchema = GenExportDebtRequestSchema.passthrough();
export type ExportDebtRequest = z.infer<typeof ExportDebtRequestSchema>;
