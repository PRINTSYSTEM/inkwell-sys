// src/Schema/user.schema.ts
import { z } from "zod";
import { PagedMetaSchema } from ".";

/** Roles enum từ swagger pattern */
export const UserRoleEnum = z.enum(
  [
    "admin",
    "manager",
    "design",
    "production",
    "accounting",
    "warehouse",
    "hr",
    "cskh",
  ],
  {
    invalid_type_error: "Vai trò không hợp lệ",
    required_error: "Vai trò là bắt buộc",
  }
);

/** CreateUserRequest */
export const CreateUserRequestSchema = z.object({
  username: z
    .string({ required_error: "Tên đăng nhập là bắt buộc" })
    .max(100, { message: "Tên đăng nhập tối đa 100 ký tự" }),
  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, { message: "Mật khẩu tối thiểu 6 ký tự" })
    .max(100, { message: "Mật khẩu tối đa 100 ký tự" }),
  fullName: z
    .string({ required_error: "Họ tên là bắt buộc" })
    .max(255, { message: "Họ tên tối đa 255 ký tự" }),
  role: UserRoleEnum,
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .max(255, { message: "Email tối đa 255 ký tự" })
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, { message: "Số điện thoại tối đa 20 ký tự" })
    .nullable()
    .optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

/** UpdateUserRequest */
export const UpdateUserRequestSchema = z.object({
  fullName: z
    .string()
    .max(255, { message: "Họ tên tối đa 255 ký tự" })
    .nullable()
    .optional(),
  role: UserRoleEnum.nullable().optional(),
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .max(255, { message: "Email tối đa 255 ký tự" })
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20, { message: "Số điện thoại tối đa 20 ký tự" })
    .nullable()
    .optional(),
  isActive: z.boolean().nullable().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

/** ChangePasswordRequest */
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Mật khẩu hiện tại là bắt buộc" })
      .min(1, { message: "Mật khẩu hiện tại không được để trống" }),
    newPassword: z
      .string({ required_error: "Mật khẩu mới là bắt buộc" })
      .min(6, { message: "Mật khẩu mới tối thiểu 6 ký tự" })
      .max(100, { message: "Mật khẩu mới tối đa 100 ký tự" }),
    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu là bắt buộc" })
      .min(1, { message: "Xác nhận mật khẩu không được để trống" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

/** UserResponse */
export const UserResponseSchema = z.object({
  id: z.number().int(),
  username: z.string().nullable(),
  fullName: z.string().nullable(),
  role: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(), // date-time
  updatedAt: z.string(), // date-time
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

/** User list params */
export const UserListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UserListParams = z.infer<typeof UserListParamsSchema>;

/** UserResponsePagedResponse */
export const UserResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(UserResponseSchema).nullable(),
});
export type UserResponsePagedResponse = z.infer<typeof UserResponsePagedSchema>;
