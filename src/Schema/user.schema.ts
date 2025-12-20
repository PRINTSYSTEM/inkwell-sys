// src/Schema/user.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
  UserRoleSchema,
} from "./Common";

// ===== UserResponse =====

export const UserResponseSchema = z
  .object({
    id: IdSchema.optional(),
    username: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: UserRoleSchema.nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .passthrough();

export type UserResponse = z.infer<typeof UserResponseSchema>;

// ===== UserResponsePagedResponse =====

export const UserResponsePagedResponseSchema =
  createPagedResponseSchema(UserResponseSchema);

export type UserResponsePagedResponse = z.infer<
  typeof UserResponsePagedResponseSchema
>;

// ===== CreateUserRequest =====

export const CreateUserRequestSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username tối đa 30 ký tự")
      .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và _"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(100, "Mật khẩu quá dài")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Mật khẩu phải có chữ hoa, chữ thường và số"
      ),
    fullName: NameSchema,
    role: UserRoleSchema,
    email: z.string().email("Email không hợp lệ").nullable().optional(),
    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{8,20}$/, "Số điện thoại không hợp lệ")
      .nullable()
      .optional(),
  })
  .passthrough();

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// ===== UpdateUserRequest =====

export const UpdateUserRequestSchema = z
  .object({
    fullName: NameSchema.nullable().optional(),
    role: UserRoleSchema.nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    isActive: z.boolean().nullable().optional(),
  })
  .passthrough();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ===== UserKpiResponse =====

export const UserKpiResponseSchema = z
  .object({
    userId: IdSchema.optional(),
    fullName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    fromDate: DateSchema.optional(),
    toDate: DateSchema.optional(),
    totalDesignsAssigned: z.number().int().optional(),
    designsCompleted: z.number().int().optional(),
    designsInProgress: z.number().int().optional(),
    designCompletionRate: z.number().optional(),
    averageDesignTimeHours: z.number().optional(),
    totalProofingOrdersAssigned: z.number().int().optional(),
    proofingOrdersCompleted: z.number().int().optional(),
    proofingOrdersInProgress: z.number().int().optional(),
    proofingCompletionRate: z.number().optional(),
    totalProductionsAssigned: z.number().int().optional(),
    productionsCompleted: z.number().int().optional(),
    productionsInProgress: z.number().int().optional(),
    productionCompletionRate: z.number().optional(),
    totalOrdersHandled: z.number().int().optional(),
    totalRevenueGenerated: z.number().optional(),
  })
  .passthrough();

export type UserKpiResponse = z.infer<typeof UserKpiResponseSchema>;

// ===== TeamKpiSummaryResponse =====

export const TeamKpiSummaryResponseSchema = z
  .object({
    fromDate: DateSchema.optional(),
    toDate: DateSchema.optional(),
    userKpis: z.array(UserKpiResponseSchema).nullable().optional(),
    totalDesignsCompleted: z.number().int().optional(),
    totalProofingOrdersCompleted: z.number().int().optional(),
    totalProductionsCompleted: z.number().int().optional(),
    totalRevenue: z.number().optional(),
  })
  .passthrough();

export type TeamKpiSummaryResponse = z.infer<
  typeof TeamKpiSummaryResponseSchema
>;