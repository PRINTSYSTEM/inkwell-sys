// src/Schema/accounting.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema } from "./Common";
import {
  AccountingResponseSchema as GenAccountingResponseSchema,
  ConfirmPaymentRequestSchema as GenConfirmPaymentRequestSchema,
  ExportDebtRequestSchema as GenExportDebtRequestSchema,
  // New accounting schemas
  APAgingResponseSchema as GenAPAgingResponseSchema,
  APAgingResponseIPaginateSchema as GenAPAgingResponseIPaginateSchema,
  APDetailResponseSchema as GenAPDetailResponseSchema,
  APDetailResponseIPaginateSchema as GenAPDetailResponseIPaginateSchema,
  APSummaryResponseSchema as GenAPSummaryResponseSchema,
  APSummaryResponseIPaginateSchema as GenAPSummaryResponseIPaginateSchema,
  ARAgingResponseSchema as GenARAgingResponseSchema,
  ARAgingResponseIPaginateSchema as GenARAgingResponseIPaginateSchema,
  ARDetailResponseSchema as GenARDetailResponseSchema,
  ARDetailResponseIPaginateSchema as GenARDetailResponseIPaginateSchema,
  ARSummaryResponseSchema as GenARSummaryResponseSchema,
  ARSummaryResponseIPaginateSchema as GenARSummaryResponseIPaginateSchema,
  BankAccountResponseSchema as GenBankAccountResponseSchema,
  BankAccountResponseIPaginateSchema as GenBankAccountResponseIPaginateSchema,
  BankLedgerEntryResponseSchema as GenBankLedgerEntryResponseSchema,
  BankLedgerResponseSchema as GenBankLedgerResponseSchema,
  CashBookEntryResponseSchema as GenCashBookEntryResponseSchema,
  CashBookResponseSchema as GenCashBookResponseSchema,
  CashFundResponseSchema as GenCashFundResponseSchema,
  CashFundResponseIPaginateSchema as GenCashFundResponseIPaginateSchema,
  CashPaymentResponseSchema as GenCashPaymentResponseSchema,
  CashPaymentResponseIPaginateSchema as GenCashPaymentResponseIPaginateSchema,
  CashReceiptResponseSchema as GenCashReceiptResponseSchema,
  CashReceiptResponseIPaginateSchema as GenCashReceiptResponseIPaginateSchema,
  CollectionScheduleResponseSchema as GenCollectionScheduleResponseSchema,
  CollectionScheduleResponseIPaginateSchema as GenCollectionScheduleResponseIPaginateSchema,
  ExpenseCategoryResponseSchema as GenExpenseCategoryResponseSchema,
  ExpenseCategoryResponseIPaginateSchema as GenExpenseCategoryResponseIPaginateSchema,
  PaymentMethodResponseSchema as GenPaymentMethodResponseSchema,
  PaymentMethodResponseIPaginateSchema as GenPaymentMethodResponseIPaginateSchema,
  CreateBankAccountRequestSchema as GenCreateBankAccountRequestSchema,
  CreateCashFundRequestSchema as GenCreateCashFundRequestSchema,
  CreateCashPaymentRequestSchema as GenCreateCashPaymentRequestSchema,
  CreateCashReceiptRequestSchema as GenCreateCashReceiptRequestSchema,
  CreateExpenseCategoryRequestSchema as GenCreateExpenseCategoryRequestSchema,
  CreatePaymentMethodRequestSchema as GenCreatePaymentMethodRequestSchema,
  UpdateBankAccountRequestSchema as GenUpdateBankAccountRequestSchema,
  UpdateCashFundRequestSchema as GenUpdateCashFundRequestSchema,
  UpdateCashPaymentRequestSchema as GenUpdateCashPaymentRequestSchema,
  UpdateCashReceiptRequestSchema as GenUpdateCashReceiptRequestSchema,
  UpdateExpenseCategoryRequestSchema as GenUpdateExpenseCategoryRequestSchema,
  UpdatePaymentMethodRequestSchema as GenUpdatePaymentMethodRequestSchema,
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

// ===== Re-export new accounting schemas =====
// AP (Accounts Payable) Schemas
export const APAgingResponseSchema = GenAPAgingResponseSchema.passthrough();
export type APAgingResponse = z.infer<typeof APAgingResponseSchema>;
export const APAgingResponseIPaginateSchema = GenAPAgingResponseIPaginateSchema.passthrough();
export type APAgingResponseIPaginate = z.infer<typeof APAgingResponseIPaginateSchema>;

export const APDetailResponseSchema = GenAPDetailResponseSchema.passthrough();
export type APDetailResponse = z.infer<typeof APDetailResponseSchema>;
export const APDetailResponseIPaginateSchema = GenAPDetailResponseIPaginateSchema.passthrough();
export type APDetailResponseIPaginate = z.infer<typeof APDetailResponseIPaginateSchema>;

export const APSummaryResponseSchema = GenAPSummaryResponseSchema.passthrough();
export type APSummaryResponse = z.infer<typeof APSummaryResponseSchema>;
export const APSummaryResponseIPaginateSchema = GenAPSummaryResponseIPaginateSchema.passthrough();
export type APSummaryResponseIPaginate = z.infer<typeof APSummaryResponseIPaginateSchema>;

// AR (Accounts Receivable) Schemas
export const ARAgingResponseSchema = GenARAgingResponseSchema.passthrough();
export type ARAgingResponse = z.infer<typeof ARAgingResponseSchema>;
export const ARAgingResponseIPaginateSchema = GenARAgingResponseIPaginateSchema.passthrough();
export type ARAgingResponseIPaginate = z.infer<typeof ARAgingResponseIPaginateSchema>;

export const ARDetailResponseSchema = GenARDetailResponseSchema.passthrough();
export type ARDetailResponse = z.infer<typeof ARDetailResponseSchema>;
export const ARDetailResponseIPaginateSchema = GenARDetailResponseIPaginateSchema.passthrough();
export type ARDetailResponseIPaginate = z.infer<typeof ARDetailResponseIPaginateSchema>;

export const ARSummaryResponseSchema = GenARSummaryResponseSchema.passthrough();
export type ARSummaryResponse = z.infer<typeof ARSummaryResponseSchema>;
export const ARSummaryResponseIPaginateSchema = GenARSummaryResponseIPaginateSchema.passthrough();
export type ARSummaryResponseIPaginate = z.infer<typeof ARSummaryResponseIPaginateSchema>;

// Bank Account Schemas
export const BankAccountResponseSchema = GenBankAccountResponseSchema.passthrough();
export type BankAccountResponse = z.infer<typeof BankAccountResponseSchema>;
export const BankAccountResponseIPaginateSchema = GenBankAccountResponseIPaginateSchema.passthrough();
export type BankAccountResponseIPaginate = z.infer<typeof BankAccountResponseIPaginateSchema>;

export const BankLedgerEntryResponseSchema = GenBankLedgerEntryResponseSchema.passthrough();
export type BankLedgerEntryResponse = z.infer<typeof BankLedgerEntryResponseSchema>;
export const BankLedgerResponseSchema = GenBankLedgerResponseSchema.passthrough();
export type BankLedgerResponse = z.infer<typeof BankLedgerResponseSchema>;

// Cash Book Schemas
export const CashBookEntryResponseSchema = GenCashBookEntryResponseSchema.passthrough();
export type CashBookEntryResponse = z.infer<typeof CashBookEntryResponseSchema>;
export const CashBookResponseSchema = GenCashBookResponseSchema.passthrough();
export type CashBookResponse = z.infer<typeof CashBookResponseSchema>;

// Cash Fund Schemas
export const CashFundResponseSchema = GenCashFundResponseSchema.passthrough();
export type CashFundResponse = z.infer<typeof CashFundResponseSchema>;
export const CashFundResponseIPaginateSchema = GenCashFundResponseIPaginateSchema.passthrough();
export type CashFundResponseIPaginate = z.infer<typeof CashFundResponseIPaginateSchema>;

// Cash Payment Schemas
export const CashPaymentResponseSchema = GenCashPaymentResponseSchema.passthrough();
export type CashPaymentResponse = z.infer<typeof CashPaymentResponseSchema>;
export const CashPaymentResponseIPaginateSchema = GenCashPaymentResponseIPaginateSchema.passthrough();
export type CashPaymentResponseIPaginate = z.infer<typeof CashPaymentResponseIPaginateSchema>;

// Cash Receipt Schemas
export const CashReceiptResponseSchema = GenCashReceiptResponseSchema.passthrough();
export type CashReceiptResponse = z.infer<typeof CashReceiptResponseSchema>;
export const CashReceiptResponseIPaginateSchema = GenCashReceiptResponseIPaginateSchema.passthrough();
export type CashReceiptResponseIPaginate = z.infer<typeof CashReceiptResponseIPaginateSchema>;

// Collection Schedule Schemas
export const CollectionScheduleResponseSchema = GenCollectionScheduleResponseSchema.passthrough();
export type CollectionScheduleResponse = z.infer<typeof CollectionScheduleResponseSchema>;
export const CollectionScheduleResponseIPaginateSchema = GenCollectionScheduleResponseIPaginateSchema.passthrough();
export type CollectionScheduleResponseIPaginate = z.infer<typeof CollectionScheduleResponseIPaginateSchema>;

// Expense Category Schemas
export const ExpenseCategoryResponseSchema = GenExpenseCategoryResponseSchema.passthrough();
export type ExpenseCategoryResponse = z.infer<typeof ExpenseCategoryResponseSchema>;
export const ExpenseCategoryResponseIPaginateSchema = GenExpenseCategoryResponseIPaginateSchema.passthrough();
export type ExpenseCategoryResponseIPaginate = z.infer<typeof ExpenseCategoryResponseIPaginateSchema>;

// Payment Method Schemas
export const PaymentMethodResponseSchema = GenPaymentMethodResponseSchema.passthrough();
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>;
export const PaymentMethodResponseIPaginateSchema = GenPaymentMethodResponseIPaginateSchema.passthrough();
export type PaymentMethodResponseIPaginate = z.infer<typeof PaymentMethodResponseIPaginateSchema>;

// Request Schemas
export const CreateBankAccountRequestSchema = GenCreateBankAccountRequestSchema.passthrough();
export type CreateBankAccountRequest = z.infer<typeof CreateBankAccountRequestSchema>;
export const CreateCashFundRequestSchema = GenCreateCashFundRequestSchema.passthrough();
export type CreateCashFundRequest = z.infer<typeof CreateCashFundRequestSchema>;
export const CreateCashPaymentRequestSchema = GenCreateCashPaymentRequestSchema.passthrough();
export type CreateCashPaymentRequest = z.infer<typeof CreateCashPaymentRequestSchema>;
export const CreateCashReceiptRequestSchema = GenCreateCashReceiptRequestSchema.passthrough();
export type CreateCashReceiptRequest = z.infer<typeof CreateCashReceiptRequestSchema>;
export const CreateExpenseCategoryRequestSchema = GenCreateExpenseCategoryRequestSchema.passthrough();
export type CreateExpenseCategoryRequest = z.infer<typeof CreateExpenseCategoryRequestSchema>;
export const CreatePaymentMethodRequestSchema = GenCreatePaymentMethodRequestSchema.passthrough();
export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodRequestSchema>;

export const UpdateBankAccountRequestSchema = GenUpdateBankAccountRequestSchema.passthrough();
export type UpdateBankAccountRequest = z.infer<typeof UpdateBankAccountRequestSchema>;
export const UpdateCashFundRequestSchema = GenUpdateCashFundRequestSchema.passthrough();
export type UpdateCashFundRequest = z.infer<typeof UpdateCashFundRequestSchema>;
export const UpdateCashPaymentRequestSchema = GenUpdateCashPaymentRequestSchema.passthrough();
export type UpdateCashPaymentRequest = z.infer<typeof UpdateCashPaymentRequestSchema>;
export const UpdateCashReceiptRequestSchema = GenUpdateCashReceiptRequestSchema.passthrough();
export type UpdateCashReceiptRequest = z.infer<typeof UpdateCashReceiptRequestSchema>;
export const UpdateExpenseCategoryRequestSchema = GenUpdateExpenseCategoryRequestSchema.passthrough();
export type UpdateExpenseCategoryRequest = z.infer<typeof UpdateExpenseCategoryRequestSchema>;
export const UpdatePaymentMethodRequestSchema = GenUpdatePaymentMethodRequestSchema.passthrough();
export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodRequestSchema>;
