import { z } from "zod";
import { RoleEnum, StatusEnum } from "./Common/enums";
import {
  IdSchema,
  NameSchema,
  EmailSchema,
  PhoneSchema,
  DateSchema,
  FileSchema,
} from "./Common/base";

// User Status Schema
export interface UserStatusType {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserSchema = z.object({
  id: IdSchema,
  username: z.string().min(3).max(50),
  fullName: z.string().min(1).max(100),
  role: RoleEnum,
  email: EmailSchema,
  phone: PhoneSchema,
  isActive: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal("Bearer").default("Bearer"),
});

// User Profile Schema
export const UserProfileSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  fullName: z.string().optional(),
  avatar: FileSchema.optional(),
  bio: z.string().max(500).optional(),
  dateOfBirth: DateSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("Asia/Ho_Chi_Minh"),
  language: z.string().default("vi"),
  phoneNumber: PhoneSchema,
  emergencyContact: z
    .object({
      name: z.string(),
      phone: PhoneSchema,
      relationship: z.string(),
    })
    .optional(),
});

// Password related schemas
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

export const SetNewPasswordSchema = z
  .object({
    token: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const LoginRequest = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginResponse = z.object({
  accessToken: z.string(),
  userInfo: z.object({
    id: z.number(),
    username: z.string(),
    fullName: z.string(),
    role: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
});

export type LoginRequestType = z.infer<typeof LoginRequest>;
export type LoginResponseType = z.infer<typeof LoginResponse>;
// Export types
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type SetNewPassword = z.infer<typeof SetNewPasswordSchema>;
