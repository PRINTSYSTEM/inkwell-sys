// src/Schema/material-type.schema.ts
// Schema cho quản lý "Chất liệu thiết kế" (Material Type)
// Bao gồm các dạng response, request tạo/cập nhật, và response phân trang
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";

// ===== MaterialTypeResponse =====
// Dữ liệu trả về từ API cho một chất liệu thiết kế

// ===== MaterialTypeClassificationOptionResponse =====
// Schema for classification options (sides, process, etc.)

export const MaterialTypeClassificationOptionResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    value: z.string().nullable().optional(),
    displayOrder: z.number().int().optional(),
  })
  .passthrough();

export type MaterialTypeClassificationOptionResponse = z.infer<
  typeof MaterialTypeClassificationOptionResponseSchema
>;

// ===== MaterialTypeClassificationResponse =====
// Schema for classification groups

export const MaterialTypeClassificationResponseSchema = z
  .object({
    id: IdSchema.optional(),
    classificationKey: z.string().nullable().optional(),
    classificationName: z.string().nullable().optional(),
    displayOrder: z.number().int().optional(),
    options: z
      .array(MaterialTypeClassificationOptionResponseSchema)
      .nullable()
      .optional(),
  })
  .passthrough();

export type MaterialTypeClassificationResponse = z.infer<
  typeof MaterialTypeClassificationResponseSchema
>;

// ===== MaterialTypeResponse =====
// Dữ liệu trả về từ API cho một chất liệu thiết kế

export const MaterialTypeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    displayOrder: z.number().int().optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().optional(),
    minimumQuantity: z.number().int().optional(), // Added from swagger
    designTypeId: IdSchema.nullable().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.nullable().optional(),
    classifications: z
      .array(MaterialTypeClassificationResponseSchema)
      .nullable()
      .optional(), // Added from swagger
  })
  .passthrough();

export type MaterialTypeResponse = z.infer<typeof MaterialTypeResponseSchema>;

// ===== PagedResponse =====
// Dữ liệu trả về khi lấy danh sách chất liệu với phân trang

export const MaterialTypeResponsePagedResponseSchema =
  createPagedResponseSchema(MaterialTypeResponseSchema);

export type MaterialTypeResponsePagedResponse = z.infer<
  typeof MaterialTypeResponsePagedResponseSchema
>;

// ===== CreateMaterialTypeRequest =====
// Payload tạo mới chất liệu thiết kế

export const CreateMaterialTypeRequestSchema = z
  .object({
    code: z.string().max(20),
    name: z.string().max(255),
    displayOrder: z.number().int().min(0).optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().min(0),
    minimumQuantity: z.number().int().min(0).optional(),
    designTypeId: IdSchema.nullable().optional(),
    status: z.string().regex(/^(active|inactive)$/),
  })
  .passthrough();

export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

// ===== MaterialTypeItem (for bulk create) =====

export const MaterialTypeItemSchema = z.object({
  code: z.string().max(20),
  name: z.string().max(255),
  displayOrder: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
  pricePerCm2: z.number().min(0),
  status: z.string().regex(/^(active|inactive)$/),
});

// ===== BulkCreateMaterialTypeRequest =====
// Payload tạo hàng loạt chất liệu theo một loại thiết kế

export const BulkCreateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materials: z.array(MaterialTypeItemSchema).min(1),
  })
  .passthrough();

export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

// ===== UpdateMaterialTypeRequest =====
// Payload cập nhật chất liệu thiết kế

export const UpdateMaterialTypeRequestSchema = z
  .object({
    name: z.string().max(255).nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().min(0).nullable().optional(),
    minimumQuantity: z.number().int().min(0).nullable().optional(),
    designTypeId: IdSchema.nullable().optional(),
    status: z
      .string()
      .regex(/^(active|inactive)$/)
      .nullable()
      .optional(),
  })
  .passthrough();

export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;
