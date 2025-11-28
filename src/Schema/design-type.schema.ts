// src/Schema/design-type.schema.ts
import { z } from "zod";
import { UserInfoSchema } from "./auth.schema";

export const CommonStatusEnum = z.enum(["active", "inactive"], {
  invalid_type_error: "Trạng thái không hợp lệ",
});

export const CreateDesignTypeRequestSchema = z.object({
  code: z
    .string({ required_error: "Mã loại thiết kế là bắt buộc" })
    .max(20, { message: "Mã loại thiết kế tối đa 20 ký tự" }),
  name: z
    .string({ required_error: "Tên loại thiết kế là bắt buộc" })
    .max(255, { message: "Tên loại thiết kế tối đa 255 ký tự" }),
  displayOrder: z
    .number()
    .int()
    .min(0, { message: "Thứ tự hiển thị không được âm" })
    .optional(),
  description: z.string().nullable().optional(),
  status: CommonStatusEnum,
});
export type CreateDesignTypeRequest = z.infer<
  typeof CreateDesignTypeRequestSchema
>;

export const UpdateDesignTypeRequestSchema = z.object({
  name: z.string().max(255).nullable().optional(),
  displayOrder: z.number().int().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
  status: CommonStatusEnum.nullable().optional(),
});
export type UpdateDesignTypeRequest = z.infer<
  typeof UpdateDesignTypeRequestSchema
>;

export const DesignTypeResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  displayOrder: z.number().int(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  statusType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: UserInfoSchema,
});
export type DesignTypeResponse = z.infer<typeof DesignTypeResponseSchema>;

/** List params (GET /api/designs/types?status=...) */
export const DesignTypeListParamsSchema = z.object({
  status: z.string().optional(),
});
export type DesignTypeListParams = z.infer<typeof DesignTypeListParamsSchema>;
