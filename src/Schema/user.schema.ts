// src/Schema/user.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./common";
import { UserRoleSchema } from "./common/enums";

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
  .strict();

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
    username: z.string().max(100),
    password: z.string().min(6).max(100),
    fullName: NameSchema,
    role: UserRoleSchema,
    email: z.string().email().nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
  })
  .strict();

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
  .strict();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
