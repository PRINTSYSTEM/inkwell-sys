// src/Schema/material-type.schema.ts
import { z } from "zod";
import { UserInfoSchema } from "./auth.schema";
import { CommonStatusEnum } from "./design-type.schema";

export const CreateMaterialTypeRequestSchema = z.object({
  code: z
    .string({ required_error: "Mã chất liệu là bắt buộc" })
    .max(20, { message: "Mã chất liệu tối đa 20 ký tự" }),
  name: z
    .string({ required_error: "Tên chất liệu là bắt buộc" })
    .max(255, { message: "Tên chất liệu tối đa 255 ký tự" }),
  displayOrder: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  price: z
    .number({ required_error: "Giá là bắt buộc" })
    .min(0, { message: "Giá không được âm" }),
  pricePerCm2: z
    .number({ required_error: "Giá theo cm² là bắt buộc" })
    .min(0, { message: "Giá theo cm² không được âm" }),
  designTypeId: z.number().int().nullable().optional(),
  status: CommonStatusEnum,
});
export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

export const UpdateMaterialTypeRequestSchema = z.object({
  name: z.string().max(255).nullable().optional(),
  displayOrder: z.number().int().min(0).nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).nullable().optional(),
  pricePerCm2: z.number().min(0).nullable().optional(),
  designTypeId: z.number().int().nullable().optional(),
  status: CommonStatusEnum.nullable().optional(),
});
export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;

export const MaterialTypeResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  displayOrder: z.number().int(),
  description: z.string().nullable(),
  price: z.number(),
  pricePerCm2: z.number(),
  designTypeId: z.number().int().nullable(),
  status: z.string().nullable(),
  statusType: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: UserInfoSchema,
});
export type MaterialTypeResponse = z.infer<typeof MaterialTypeResponseSchema>;

/** BulkCreateMaterialTypeRequest */
export const MaterialTypeItemSchema = z.object({
  code: z.string().max(20, { message: "Mã chất liệu tối đa 20 ký tự" }),
  name: z.string().max(255, { message: "Tên chất liệu tối đa 255 ký tự" }),
  displayOrder: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  pricePerCm2: z.number().min(0),
  status: CommonStatusEnum,
});
export type MaterialTypeItem = z.infer<typeof MaterialTypeItemSchema>;

export const BulkCreateMaterialTypeRequestSchema = z.object({
  designTypeId: z.number({ required_error: "designTypeId là bắt buộc" }).int(),
  materials: z
    .array(MaterialTypeItemSchema)
    .min(1, { message: "Cần ít nhất 1 chất liệu" }),
});
export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

/** List params: /api/designs/materials?status= */
export const MaterialTypeListParamsSchema = z.object({
  status: z.string().optional(),
});
export type MaterialTypeListParams = z.infer<
  typeof MaterialTypeListParamsSchema
>;

/** List theo design-type: /design-type/{id}?status= */
export const MaterialTypeByDesignTypeParamsSchema = z.object({
  designTypeId: z.number().int(),
  status: z.string().optional(),
});
export type MaterialTypeByDesignTypeParams = z.infer<
  typeof MaterialTypeByDesignTypeParamsSchema
>;
