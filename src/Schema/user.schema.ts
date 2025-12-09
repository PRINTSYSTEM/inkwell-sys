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
  .passthrough();

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
    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username tối đa 30 ký tự")
      .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và _"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(100, "Mật khẩu quá dài")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Mật khẩu phải có chữ hoa, chữ thường và số"
      ),
    fullName: NameSchema,
    role: UserRoleSchema,
    email: z.string().email("Email không hợp lệ").nullable().optional(),
    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{8,20}$/, "Số điện thoại không hợp lệ")
      .nullable()
      .optional(),
  })
  .passthrough();

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
  .passthrough();

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
