// src/Schema/customer.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  createPagedResponseSchema,
  DateSchema,
  IdSchema,
  NameSchema,
  PhoneSchema,
} from "./common";

// ===== Payload từ Swagger =====

// CreateCustomerRequest
export const CreateCustomerRequestSchema = z
  .object({
    name: NameSchema, // string, max 255
    companyName: z.string().max(255).nullable().optional(),
    representativeName: z.string().max(255).nullable().optional(),
    phone: PhoneSchema.nullable().optional(), // swagger: nullable true
    taxCode: z.string().max(50).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    type: z.string().max(50).nullable().optional(),
    currentDebt: z.number().min(0),
    maxDebt: z.number().min(0),
  })
  .strict();

export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

// UpdateCustomerRequest
export const UpdateCustomerRequestSchema = z
  .object({
    name: NameSchema.nullable().optional(),
    companyName: z.string().max(255).nullable().optional(),
    representativeName: z.string().max(255).nullable().optional(),
    phone: PhoneSchema.nullable().optional(),
    taxCode: z.string().max(50).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    type: z.string().max(50).nullable().optional(),
    currentDebt: z.number().min(0).nullable().optional(),
    maxDebt: z.number().min(0).nullable().optional(),
  })
  .strict();

export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

// ===== Entity từ Swagger =====

// CustomerResponse
export const CustomerResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
    representativeName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    taxCode: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    typeStatusType: z.string().nullable().optional(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    debtStatus: z.string().nullable().optional(),
    createdAt: DateSchema.optional(), // format: date-time
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .strict();

export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

// CustomerSummaryResponse
export const CustomerSummaryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    companyName: z.string().nullable().optional(),
    debtStatus: z.string().nullable().optional(),
    currentDebt: z.number(),
    maxDebt: z.number(),
  })
  .strict();

export type CustomerSummaryResponse = z.infer<
  typeof CustomerSummaryResponseSchema
>;

// CustomerSummaryResponsePagedResponse
export const CustomerSummaryResponsePagedResponseSchema =
  createPagedResponseSchema(CustomerSummaryResponseSchema);

export type CustomerSummaryResponsePagedResponse = z.infer<
  typeof CustomerSummaryResponsePagedResponseSchema
>;
