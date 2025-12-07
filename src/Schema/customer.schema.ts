// src/Schema/customer.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./common";
import { UserInfoSchema } from "./common";

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
  .strict();

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

// ===== CustomerSummaryResponse =====

export const CustomerSummaryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    phone: z.string().nullable().optional(),
    currentDebt: z.number().optional(),
    maxDebt: z.number().optional(),
    debtStatus: z.string().nullable().optional(),
  })
  .strict();

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
    name: NameSchema,
    companyName: z
      .string()
      .min(1, "Tên công ty không được để trống")
      .max(255, "Tên công ty quá dài"),
    representativeName: z
      .string()
      .min(1, "Tên đại diện không được để trống")
      .max(255, "Tên đại diện quá dài"),
    phone: z
      .string()
      .min(1, "Số điện thoại không được để trống")
      .regex(/^[0-9+\-\s()]{8,20}$/, "Số điện thoại không hợp lệ"),
    taxCode: z
      .string()
      .min(1, "Mã số thuế không được để trống")
      .regex(/^\d{10,13}$/, "Mã số thuế phải gồm 10-13 chữ số"),
    address: z
      .string()
      .min(1, "Địa chỉ không được để trống")
      .max(500, "Địa chỉ quá dài"),
    type: z.enum(["company", "retail"]),
    maxDebt: z.number().min(0, "Số dư tối đa không thể âm").default(0),
  })
  .strict();

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
  .strict();

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
