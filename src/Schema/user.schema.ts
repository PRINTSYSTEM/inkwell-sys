// src/Schema/user.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
  UserRoleSchema,
} from "./Common";
import {
  UserResponseSchema as GenUserResponseSchema,
  UserResponsePaginateSchema as GenUserResponsePaginateSchema,
  CreateUserRequestSchema as GenCreateUserRequestSchema,
  UpdateUserRequestSchema as GenUpdateUserRequestSchema,
  UpdateMyProfileRequestSchema as GenUpdateMyProfileRequestSchema,
  ResetPasswordRequestSchema as GenResetPasswordRequestSchema,
  UserKpiResponseSchema as GenUserKpiResponseSchema,
  TeamKpiSummaryResponseSchema as GenTeamKpiSummaryResponseSchema,
} from "./generated";

// ===== UserResponse =====
export const UserResponseSchema = GenUserResponseSchema.passthrough().extend({
  kpi: GenUserKpiResponseSchema.nullable().optional(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// ===== UserResponsePagedResponse =====
export const UserResponsePagedResponseSchema = createPagedResponseSchema(
  UserResponseSchema
);
export type UserResponsePagedResponse = z.infer<
  typeof UserResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenUserResponsePaginateSchema as UserResponsePaginateSchema };
export type UserResponsePaginate = z.infer<
  typeof GenUserResponsePaginateSchema
>;

// ===== CreateUserRequest =====
export const CreateUserRequestSchema = z.object({
  username: z.string().min(1, "Username không được để trống").max(100),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
  fullName: z.string().min(1, "Họ và tên không được để trống").max(255),
  role: UserRoleSchema,
  email: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().email("Email không hợp lệ").optional().nullable()
  ),
  phone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().max(20, "Số điện thoại không quá 20 ký tự").optional().nullable()
  ),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// ===== UpdateUserRequest =====
export const UpdateUserRequestSchema = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống").max(255).optional().nullable(),
  role: UserRoleSchema.optional().nullable(),
  email: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().email("Email không hợp lệ").optional().nullable()
  ),
  phone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().max(20, "Số điện thoại không quá 20 ký tự").optional().nullable()
  ),
  isActive: z.boolean().optional().nullable(),
}).partial();
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ===== UpdateMyProfileRequest =====
export const UpdateMyProfileRequestSchema = GenUpdateMyProfileRequestSchema.passthrough();
export type UpdateMyProfileRequest = z.infer<typeof UpdateMyProfileRequestSchema>;

// ===== ResetPasswordRequest =====
export const ResetPasswordRequestSchema = GenResetPasswordRequestSchema.passthrough();
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// ===== UserKpiResponse =====
export const UserKpiResponseSchema = GenUserKpiResponseSchema.passthrough();
export type UserKpiResponse = z.infer<typeof UserKpiResponseSchema>;

// ===== TeamKpiSummaryResponse =====
export const TeamKpiSummaryResponseSchema =
  GenTeamKpiSummaryResponseSchema.passthrough();
export type TeamKpiSummaryResponse = z.infer<
  typeof TeamKpiSummaryResponseSchema
>;
