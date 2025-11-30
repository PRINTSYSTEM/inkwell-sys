// src/Schema/user.schema.ts
import { z } from "zod";

import {
  UserRoleSchema,
  createPagedResponseSchema,
  DateSchema,
  IdSchema,
  NameSchema,
  EmailSchema,
  PhoneSchema,
} from "./common";

// CreateUserRequest
export const CreateUserRequestSchema = z
  .object({
    username: z.string().max(100),
    password: z.string().min(6).max(100),
    fullName: NameSchema,
    role: UserRoleSchema,
    email: EmailSchema.max(255).nullable().optional(),
    phone: PhoneSchema.nullable().optional(),
  })
  .strict();

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// UpdateUserRequest
export const UpdateUserRequestSchema = z
  .object({
    fullName: NameSchema.nullable().optional(),
    role: UserRoleSchema.nullable().optional(),
    email: EmailSchema.max(255).nullable().optional(),
    phone: PhoneSchema.nullable().optional(),
    isActive: z.boolean().nullable().optional(),
  })
  .strict();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// UserResponse
export const UserResponseSchema = z
  .object({
    id: IdSchema.optional(),
    username: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .strict();

export type UserResponse = z.infer<typeof UserResponseSchema>;

// UserResponsePagedResponse
export const UserResponsePagedResponseSchema =
  createPagedResponseSchema(UserResponseSchema);

export type UserResponsePagedResponse = z.infer<
  typeof UserResponsePagedResponseSchema
>;
