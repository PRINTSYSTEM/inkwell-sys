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
  UserKpiResponseSchema as GenUserKpiResponseSchema,
  TeamKpiSummaryResponseSchema as GenTeamKpiSummaryResponseSchema,
} from "./generated";

// ===== UserResponse =====
export const UserResponseSchema = GenUserResponseSchema.passthrough();
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
// Base from generated, but keep custom validation
export const CreateUserRequestSchema = GenCreateUserRequestSchema.refine(
  (data) => {
    if (data.password && data.password.length < 6) {
      return false;
    }
    return true;
  },
  { message: "Mật khẩu phải có ít nhất 6 ký tự", path: ["password"] }
);
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// ===== UpdateUserRequest =====
export const UpdateUserRequestSchema = GenUpdateUserRequestSchema.passthrough();
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ===== UserKpiResponse =====
export const UserKpiResponseSchema = GenUserKpiResponseSchema.passthrough();
export type UserKpiResponse = z.infer<typeof UserKpiResponseSchema>;

// ===== TeamKpiSummaryResponse =====
export const TeamKpiSummaryResponseSchema =
  GenTeamKpiSummaryResponseSchema.passthrough();
export type TeamKpiSummaryResponse = z.infer<
  typeof TeamKpiSummaryResponseSchema
>;
