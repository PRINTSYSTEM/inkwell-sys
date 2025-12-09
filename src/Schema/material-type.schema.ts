// src/Schema/material-type.schema.ts
// Schema cho quản lý "Chất liệu thiết kế" (Material Type)
// Bao gồm các dạng response, request tạo/cập nhật, và response phân trang
import { number, z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./common";
import { UserInfoSchema } from "./common";

// ===== MaterialTypeResponse =====
// Dữ liệu trả về từ API cho một chất liệu thiết kế

export const MaterialTypeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    designTypeId: IdSchema.optional(),
    displayOrder: IdSchema.optional(),
    designTypeName: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.nullable().optional(),
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
    designTypeId: IdSchema,
    code: z
      .string()
      .min(2, "Mã chất liệu quá ngắn")
      .max(20, "Mã chất liệu quá dài")
      .regex(/^[A-Z0-9-]+$/, "Mã chỉ gồm A-Z, số và dấu gạch ngang"),
    name: NameSchema,
    description: z.string().max(500).nullable().optional(),
  })
  .passthrough();

export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

// ===== BulkCreateMaterialTypeRequest =====
// Payload tạo hàng loạt chất liệu theo một loại thiết kế

export const BulkCreateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materials: z
      .array(
        z.object({
          code: z
            .string()
            .min(2, "Mã chất liệu quá ngắn")
            .max(20, "Mã chất liệu quá dài")
            .regex(/^[A-Z0-9-]+$/, "Mã chỉ gồm A-Z, số và dấu gạch ngang"),
          name: NameSchema,
          description: z.string().max(500).nullable().optional(),
        })
      )
      .min(1),
  })
  .passthrough();

export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

// ===== UpdateMaterialTypeRequest =====
// Payload cập nhật chất liệu thiết kế

export const UpdateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema.nullable().optional(),
    code: z.string().max(50).nullable().optional(),
    name: NameSchema.nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;
