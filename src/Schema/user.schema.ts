import { z } from 'zod';
import { RoleEnum, StatusEnum } from './Common/enums';
import { IdSchema, NameSchema, EmailSchema, PhoneSchema, DateSchema, FileSchema } from './Common/base';

// User Status Schema
export const UserStatusEnum = z.enum([
  'active',
  'inactive', 
  'pending',
  'suspended',
  'archived'
]);

// Authentication Schema
export const AuthCredentialsSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer').default('Bearer')
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
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  language: z.string().default('vi'),
  phoneNumber: PhoneSchema,
  emergencyContact: z.object({
    name: z.string(),
    phone: PhoneSchema,
    relationship: z.string()
  }).optional()
});

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    desktop: z.boolean().default(true)
  }),
  dashboard: z.object({
    layout: z.enum(['grid', 'list']).default('grid'),
    widgets: z.array(z.string()).default([])
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts']).default('private'),
    showOnlineStatus: z.boolean().default(true),
    allowDirectMessages: z.boolean().default(true)
  })
});

// Main User Schema
export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  username: z.string().min(3).max(50).optional(),
  profile: UserProfileSchema,
  role: RoleEnum,
  roleId: IdSchema,
  status: UserStatusEnum,
  isEmailVerified: z.boolean().default(false),
  isPhoneVerified: z.boolean().default(false),
  isTwoFactorEnabled: z.boolean().default(false),
  lastLoginAt: DateSchema.optional(),
  lastActivityAt: DateSchema.optional(),
  loginCount: z.number().min(0).default(0),
  failedLoginAttempts: z.number().min(0).default(0),
  lockedUntil: DateSchema.optional(),
  preferences: UserPreferencesSchema,
  metadata: z.record(z.unknown()).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema.optional()
});

// Create User Schema
export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6),
  profile: UserProfileSchema,
  roleId: IdSchema,
  status: UserStatusEnum.default('pending'),
  sendWelcomeEmail: z.boolean().default(true)
});

// Update User Schema
export const UpdateUserSchema = z.object({
  profile: UserProfileSchema.partial().optional(),
  roleId: IdSchema.optional(),
  status: UserStatusEnum.optional(),
  preferences: UserPreferencesSchema.partial().optional(),
  metadata: z.record(z.unknown()).optional()
});

// User Filter Schema
export const UserFilterSchema = z.object({
  search: z.string().optional(),
  role: RoleEnum.optional(),
  status: UserStatusEnum.optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAfter: DateSchema.optional(),
  createdBefore: DateSchema.optional(),
  sortBy: z.enum(['email', 'createdAt', 'lastLoginAt', 'profile.firstName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Password related schemas
export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const ResetPasswordSchema = z.object({
  email: EmailSchema
});

export const SetNewPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});


export const LoginRequest = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
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
  })
});

export type LoginRequestType = z.infer<typeof LoginRequest>;
export type LoginResponseType = z.infer<typeof LoginResponse>;
// Export types
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UserStatus = z.infer<typeof UserStatusEnum>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserFilter = z.infer<typeof UserFilterSchema>;
export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type SetNewPassword = z.infer<typeof SetNewPasswordSchema>;