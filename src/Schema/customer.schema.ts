// src/Schema/customer.schema.ts
import { z } from "zod";
import { UserInfoSchema } from "./auth.schema";
import { PagedMetaSchema } from ".";

/** CreateCustomerRequest */
export const CreateCustomerRequestSchema = z.object({
  name: z
    .string({ required_error: "Tên khách hàng là bắt buộc" })
    .max(255, { message: "Tên khách hàng tối đa 255 ký tự" }),
  companyName: z.string().max(255).nullable().optional(),
  representativeName: z.string().max(255).nullable().optional(),
  phone: z
    .string()
    .max(20, { message: "Số điện thoại tối đa 20 ký tự" })
    .nullable()
    .optional(),
  taxCode: z.string().max(50).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  currentDebt: z
    .number({ invalid_type_error: "Công nợ hiện tại phải là số" })
    .min(0, { message: "Công nợ hiện tại không được âm" }),
  maxDebt: z
    .number({ invalid_type_error: "Công nợ tối đa phải là số" })
    .min(0, { message: "Công nợ tối đa không được âm" }),
});
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

/** UpdateCustomerRequest */
export const UpdateCustomerRequestSchema = z.object({
  name: z.string().max(255).nullable().optional(),
  companyName: z.string().max(255).nullable().optional(),
  representativeName: z.string().max(255).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  taxCode: z.string().max(50).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  currentDebt: z.number().min(0).nullable().optional(),
  maxDebt: z.number().min(0).nullable().optional(),
});
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

/** CustomerResponse */
export const CustomerResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  companyName: z.string().nullable(),
  representativeName: z.string().nullable(),
  phone: z.string().nullable(),
  taxCode: z.string().nullable(),
  address: z.string().nullable(),
  type: z.string().nullable(),
  typeStatusType: z.string().nullable(),
  currentDebt: z.number(),
  maxDebt: z.number(),
  debtStatus: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: UserInfoSchema,
});
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

/** CustomerSummaryResponse */
export const CustomerSummaryResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  companyName: z.string().nullable(),
  debtStatus: z.string().nullable(),
  currentDebt: z.number(),
  maxDebt: z.number(),
});
export type CustomerSummaryResponse = z.infer<
  typeof CustomerSummaryResponseSchema
>;

/** Customer list params */
export const CustomerListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  search: z.string().optional(),
  debtStatus: z.string().optional(),
});
export type CustomerListParams = z.infer<typeof CustomerListParamsSchema>;

/** CustomerSummaryResponsePagedResponse */
export const CustomerSummaryResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(CustomerSummaryResponseSchema).nullable(),
});
export type CustomerSummaryResponsePagedResponse = z.infer<
  typeof CustomerSummaryResponsePagedSchema
>;
