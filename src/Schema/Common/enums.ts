// src/Schema/common.ts
import { z } from "zod";
import { DateSchema, IdSchema } from "./";

// ===== Enum & common types từ Swagger =====

export const UserRoleSchema = z.enum([
  "admin",
  "manager",
  "design",
  "design_lead",
  "production",
  "production_lead",
  "accounting",
  "accounting_lead",
  "warehouse",
  "warehouse_lead",
  "hr",
  "hr_lead",
  "cskh",
  "cskh_lead",
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// CommonStatus (từ constants Swagger: active/inactive)
export const CommonStatusSchema = z.enum(["active", "inactive"]);
export type CommonStatus = z.infer<typeof CommonStatusSchema>;

// ===== Swagger: UserInfo =====

export const UserInfoSchema = z
  .object({
    id: IdSchema, // integer int32
    username: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  })
  .strict();

export type UserInfo = z.infer<typeof UserInfoSchema>;

// ===== Swagger: ConstantGroup & ConstantsResponse =====

export const ConstantGroupSchema = z
  .object({
    entityType: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    values: z.record(z.string()).nullable().optional(),
  })
  .strict();

export type ConstantGroup = z.infer<typeof ConstantGroupSchema>;

export const ConstantsResponseSchema = z
  .object({
    roles: ConstantGroupSchema.optional(),
    orderStatuses: ConstantGroupSchema.optional(),
    designStatuses: ConstantGroupSchema.optional(),
    proofingOrderStatuses: ConstantGroupSchema.optional(),
    productionStatuses: ConstantGroupSchema.optional(),
    paymentStatuses: ConstantGroupSchema.optional(),
    customerTypes: ConstantGroupSchema.optional(),
    paymentMethods: ConstantGroupSchema.optional(),
    commonStatuses: ConstantGroupSchema.optional(),
  })
  .strict();

export type ConstantsResponse = z.infer<typeof ConstantsResponseSchema>;

// ===== Helper: PagedResponse<T> (Swagger style) =====

export const PagedResponseBaseSchema = z
  .object({
    totalCount: z.number().int(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int().optional(),
    hasPreviousPage: z.boolean().optional(),
    hasNextPage: z.boolean().optional(),
  })
  .strict();

export type PagedResponseBase = z.infer<typeof PagedResponseBaseSchema>;

export const createPagedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  PagedResponseBaseSchema.extend({
    items: z.array(itemSchema).nullable().optional(),
  });

// ===== LƯU Ý về ErrorResponse =====
// File base.schema.ts của bạn đã có ErrorResponseSchema cho API wrapper (success: false, error, ...).
// Swagger lại có ErrorResponse kiểu khác (statusCode, error, timeStamp).
// Nếu cần dùng ErrorResponse của Swagger, nên đặt tên khác, ví dụ:
export const BackendErrorResponseSchema = z
  .object({
    statusCode: z.number().int(),
    error: z.string().nullable().optional(),
    timeStamp: DateSchema.optional(), // format date-time
  })
  .strict();

export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>;
