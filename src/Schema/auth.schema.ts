import { z } from "zod";

// Login Request Schema
export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// User Info Schema từ API response
export const UserInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string(), // Accept any string for email (API may return invalid formats)
  phone: z.string(), // Phone as string
});

// Login Response Schema
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  userInfo: UserInfoSchema,
});

// Types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Helper function to validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to get display email (show warning if invalid)
export const getDisplayEmail = (email: string): string => {
  return isValidEmail(email) ? email : `${email} ⚠️`;
};

// Auth State Schema
export const AuthStateSchema = z.object({
  user: UserInfoSchema.nullable(),
  accessToken: z.string().nullable(),
  isAuthenticated: z.boolean(),
});

export type AuthState = z.infer<typeof AuthStateSchema>;

// Role enum for better type safety
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  DESIGNER = "designer",
}

// Helper functions for validation
export const validateLoginRequest = (data: unknown): LoginRequest => {
  return LoginRequestSchema.parse(data);
};

export const validateLoginResponse = (data: unknown): LoginResponse => {
  return LoginResponseSchema.parse(data);
};

export const validateUserInfo = (data: unknown): UserInfo => {
  return UserInfoSchema.parse(data);
};