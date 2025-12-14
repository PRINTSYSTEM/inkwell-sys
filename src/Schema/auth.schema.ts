// src/Schema/auth.schema.ts
import { z } from "zod";
import { UserInfoSchema } from "./common";

// ---------------------------
// LoginRequest
// ---------------------------
export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// ---------------------------
// LoginResponse (Swagger)
// {
//    accessToken: string | null,
//    userInfo: UserInfo | null
// }
// ---------------------------
export const LoginResponseSchema = z.object({
  accessToken: z.string().nullable(),
  userInfo: UserInfoSchema.nullable(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---------------------------
// RoleDefinition (Swagger)
// ---------------------------
export const RoleDefinitionSchema = z
  .object({
    code: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;

// ---------------------------
// RolesResponse (Swagger)
// ---------------------------
export const RolesResponseSchema = z
  .object({
    roles: z.array(RoleDefinitionSchema).nullable().optional(),
  })
  .passthrough();

export type RolesResponse = z.infer<typeof RolesResponseSchema>;

// ---------------------------
// Validation helper
// ---------------------------
/**
 * Validate raw unknown response to LoginResponse
 * Throws ZodError if invalid
 */
export function validateLoginResponse(data: unknown): LoginResponse {
  return LoginResponseSchema.parse(data);
}

// ---------------------------
// ChangePasswordRequest
// ---------------------------
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase and number"
      ),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Confirm password must match new password",
    path: ["confirmPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
