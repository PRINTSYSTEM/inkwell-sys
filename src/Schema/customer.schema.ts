// src/Schema/customer.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";

// ===== CustomerResponse =====

export const CustomerResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    companyName: z.string().nullable().optional(),
    representativeName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    taxCode: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    typeStatusType: z.string().nullable().optional(),
    currentDebt: z.number().optional(),
    maxDebt: z.number().optional(),
    debtStatus: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .passthrough();

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

// ===== CustomerSummaryResponse =====

export const CustomerSummaryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    companyName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    debtStatus: z.string().nullable().optional(),
    currentDebt: z.number().optional(),
    maxDebt: z.number().optional(),
  })
  .passthrough();

export type CustomerSummaryResponse = z.infer<
  typeof CustomerSummaryResponseSchema
>;

// ===== PagedResponse =====

export const CustomerResponsePagedResponseSchema = createPagedResponseSchema(
  CustomerResponseSchema
);

export type CustomerResponsePagedResponse = z.infer<
  typeof CustomerResponsePagedResponseSchema
>;

export const CustomerSummaryResponsePagedResponseSchema =
  createPagedResponseSchema(CustomerSummaryResponseSchema);

export type CustomerSummaryResponsePagedResponse = z.infer<
  typeof CustomerSummaryResponsePagedResponseSchema
>;

// ===== CreateCustomerRequest =====

export const CreateCustomerRequestSchema = z
  .object({
    name: z
      .string({ required_error: "Tên khách hàng là bắt buộc" })
      .min(0, "Tên khách hàng không được để trống")
      .max(255, "Tên khách hàng không được vượt quá 255 ký tự"),
    companyName: z.string().min(0).max(255).nullable().optional(),
    representativeName: z.string().min(0).max(255).nullable().optional(),
    phone: z.string().min(0).max(20).nullable().optional(),
    taxCode: z.string().min(0).max(50).nullable().optional(),
    address: z.string().min(0).max(255).nullable().optional(),
    type: z.string().min(0).max(50).nullable().optional(),
    currentDebt: z.number().min(0).optional(),
    maxDebt: z.number().min(0).optional(),
  })
  .passthrough();

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

// ===== UpdateCustomerRequest =====

export const UpdateCustomerRequestSchema = z
  .object({
    name: z.string().min(0).max(255).nullable().optional(),
    companyName: z.string().min(0).max(255).nullable().optional(),
    representativeName: z.string().min(0).max(255).nullable().optional(),
    phone: z.string().min(0).max(20).nullable().optional(),
    taxCode: z.string().min(0).max(50).nullable().optional(),
    address: z.string().min(0).max(255).nullable().optional(),
    type: z.string().min(0).max(50).nullable().optional(),
    currentDebt: z.number().min(0).nullable().optional(), // Added from swagger
    maxDebt: z.number().min(0).nullable().optional(),
  })
  .passthrough();

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

// ===== CustomerDebtHistoryResponse =====

export const CustomerDebtHistoryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    customerId: IdSchema.optional(),
    customerName: z.string().nullable().optional(),
    orderId: IdSchema.nullable().optional(),
    orderCode: z.string().nullable().optional(),
    paymentId: IdSchema.nullable().optional(),
    previousDebt: z.number().optional(),
    changeAmount: z.number().optional(),
    newDebt: z.number().optional(),
    changeType: z.string().nullable().optional(),
    changeTypeDisplay: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    createdById: IdSchema.nullable().optional(),
    createdByName: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
  })
  .passthrough();

export type CustomerDebtHistoryResponse = z.infer<
  typeof CustomerDebtHistoryResponseSchema
>;

// ===== CustomerMonthlyDebtResponse =====

export const CustomerMonthlyDebtResponseSchema = z
  .object({
    id: IdSchema.optional(),
    customerId: IdSchema.optional(),
    customerName: z.string().nullable().optional(),
    year: z.number().int().optional(),
    month: z.number().int().optional(),
    openingDebt: z.number().optional(),
    closingDebt: z.number().optional(),
    changeInMonth: z.number().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.nullable().optional(),
  })
  .passthrough();

export type CustomerMonthlyDebtResponse = z.infer<
  typeof CustomerMonthlyDebtResponseSchema
>;

// ===== CustomerDebtSummaryResponse =====

export const CustomerDebtSummaryResponseSchema = z
  .object({
    customerId: IdSchema.optional(),
    customerName: z.string().nullable().optional(),
    customerType: z.string().nullable().optional(),
    startDate: DateSchema.optional(),
    endDate: DateSchema.optional(),
    openingDebt: z.number().optional(),
    totalDebtIncurred: z.number().optional(),
    totalPaymentReceived: z.number().optional(),
    closingDebt: z.number().optional(),
    orderCount: z.number().int().optional(),
    paymentCount: z.number().int().optional(),
    details: z.array(CustomerDebtHistoryResponseSchema).nullable().optional(),
  })
  .passthrough();

export type CustomerDebtSummaryResponse = z.infer<
  typeof CustomerDebtSummaryResponseSchema
>;