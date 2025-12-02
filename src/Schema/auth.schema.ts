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
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
