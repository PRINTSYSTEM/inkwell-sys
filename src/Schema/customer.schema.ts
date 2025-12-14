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
      .min(1, "Tên khách hàng không được để trống")
      .max(255, "Tên khách hàng không được vượt quá 255 ký tự"),
    companyName: z.string().max(255).nullable().optional(),
    representativeName: z
      .string({ required_error: "Tên người đại diện là bắt buộc" })
      .min(1, "Tên người đại diện không được để trống")
      .max(255, "Tên người đại diện không được vượt quá 255 ký tự"),
    phone: z
      .string({ required_error: "Số điện thoại là bắt buộc" })
      .min(1, "Số điện thoại không được để trống")
      .max(20, "Số điện thoại không được vượt quá 20 ký tự"),
    taxCode: z
      .string({ required_error: "Mã số thuế là bắt buộc" })
      .min(1, "Mã số thuế không được để trống")
      .max(50, "Mã số thuế không được vượt quá 50 ký tự"),
    address: z
      .string({ required_error: "Địa chỉ là bắt buộc" })
      .min(1, "Địa chỉ không được để trống")
      .max(255, "Địa chỉ không được vượt quá 255 ký tự"),
    type: z
      .string({ required_error: "Loại khách hàng là bắt buộc" })
      .min(1, "Vui lòng chọn loại khách hàng")
      .max(50, "Loại khách hàng không được vượt quá 50 ký tự"),
    currentDebt: z.number().min(0).optional(),
    maxDebt: z
      .number({
        required_error: "Hạn mức công nợ là bắt buộc",
        invalid_type_error: "Hạn mức công nợ phải là số",
      })
      .min(0, "Hạn mức công nợ không được âm"),
  })
  .passthrough();

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

// ===== UpdateCustomerRequest =====

export const UpdateCustomerRequestSchema = z
  .object({
    name: NameSchema.nullable().optional(),
    companyName: z.string().nullable().optional(),
    representativeName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    taxCode: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    maxDebt: z.number().nullable().optional(),
  })
  .passthrough();

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
