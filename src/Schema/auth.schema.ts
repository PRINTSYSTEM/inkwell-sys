// src/Schema/auth.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { UserInfoSchema } from "./Common";
import {
  LoginRequestSchema as GenLoginRequestSchema,
  LoginResponseSchema as GenLoginResponseSchema,
  RoleDefinitionSchema as GenRoleDefinitionSchema,
  RolesResponseSchema as GenRolesResponseSchema,
  ChangePasswordRequestSchema as GenChangePasswordRequestSchema,
} from "./generated";

// ===== LoginRequest =====
// Base from generated, but keep custom validation messages
export const LoginRequestSchema = GenLoginRequestSchema.refine(
  (data) => {
    if (!data.username || data.username.length < 1) {
      return false;
    }
    if (!data.password || data.password.length < 1) {
      return false;
    }
    return true;
  },
  {
    message: "Username and password are required",
  }
);
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ===== LoginResponse =====
export const LoginResponseSchema = GenLoginResponseSchema.passthrough();
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ===== RoleDefinition =====
export const RoleDefinitionSchema = GenRoleDefinitionSchema.passthrough();
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;

// ===== RolesResponse =====
export const RolesResponseSchema = GenRolesResponseSchema.passthrough();
export type RolesResponse = z.infer<typeof RolesResponseSchema>;

// ===== Validation helper =====
/**
 * Validate raw unknown response to LoginResponse
 * Throws ZodError if invalid
 */
export function validateLoginResponse(data: unknown): LoginResponse {
  return LoginResponseSchema.parse(data);
}

// ===== ChangePasswordRequest =====
// Base from generated, but keep custom refine for password confirmation
export const ChangePasswordRequestSchema =
  GenChangePasswordRequestSchema.refine(
    (d) => d.newPassword === d.confirmPassword,
    {
      message: "Confirm password must match new password",
      path: ["confirmPassword"],
    }
  );
export type ChangePasswordRequest = z.infer<
  typeof ChangePasswordRequestSchema
>;
