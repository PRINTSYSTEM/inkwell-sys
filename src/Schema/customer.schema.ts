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
    name: z.string().max(255),
    companyName: z.string().max(255).nullable().optional(),
    representativeName: z.string().max(255).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    taxCode: z.string().max(50).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    type: z.string().max(50).nullable().optional(),
    currentDebt: z.number().min(0).optional(),
    maxDebt: z.number().min(0).optional(),
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
