// src/Schema/common/index.ts
export * from "./base";
export * from "./enums";

// Các schema dùng chung từ swagger:

import { z } from "zod";
import { DateSchema, IdSchema, createPagedResponseSchema } from "./base";

// ===== UserInfo =====

export const UserInfoSchema = z
  .object({
    id: IdSchema,
    username: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  })
  .passthrough();

export type UserInfo = z.infer<typeof UserInfoSchema>;

// ===== ConstantGroup & ConstantsResponse =====

export const ConstantGroupSchema = z
  .object({
    entityType: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    values: z.record(z.string()).nullable().optional(),
  })
  .passthrough();

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
  .passthrough();

export type ConstantsResponse = z.infer<typeof ConstantsResponseSchema>;

// ===== Generic helper cho mọi PagedResponse<T> =====
export { createPagedResponseSchema };
