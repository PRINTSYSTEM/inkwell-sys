import { z } from "zod";
import { StatusEnum } from "./Common/enums";
import { IdSchema, DateSchema } from "./Common/base";
import { UserSchema } from "./user.schema";

// Material Type Entity schema for API responses
export const MaterialTypeEntitySchema = z.object({
  id: IdSchema,
  code: z.string().min(1, "Mã loại vật liệu không được để trống"),
  name: z.string().min(1, "Tên loại vật liệu không được để trống"),
  displayOrder: z.number().int().min(0, "Thứ tự hiển thị phải >= 0"),
  description: z.string().optional(),
  price: z.number(),
  pricePerCm2: z.number(),
  designTypeId: z.number().int(),
  status: StatusEnum,
  statusType: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: UserSchema,
});

// Schema for creating new material type
export const CreateMaterialTypeSchema = z.object({
  code: z.string().min(1, "Mã loại vật liệu không được để trống"),
  name: z.string().min(1, "Tên loại vật liệu không được để trống"),
  displayOrder: z.number().int().min(0, "Thứ tự hiển thị phải >= 0").default(0),
  description: z.string().optional(),
  price: z.number().nonnegative("Giá phải >= 0"),
  pricePerCm2: z.number().nonnegative("Đơn giá trên cm² phải >= 0"),
  designTypeId: IdSchema,
  status: StatusEnum, // hoặc .default(StatusEnum.Enum.ACTIVE) nếu bạn muốn default
});
// Schema for updating material type
export const UpdateMaterialTypeSchema = CreateMaterialTypeSchema.partial();

// Schema for material type list response
export const MaterialTypeListSchema = z.object({
  data: z.array(MaterialTypeEntitySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

// Schema for material type statistics
export const MaterialTypeStatsSchema = z.object({
  total: z.number().int().min(0),
  active: z.number().int().min(0),
  inactive: z.number().int().min(0),
});

// Type exports
export type MaterialTypeEntity = z.infer<typeof MaterialTypeEntitySchema>;
export type MaterialType = MaterialTypeEntity; // Alias for compatibility
export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeSchema
>;
export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeSchema
>;
export type MaterialTypeListResponse = z.infer<typeof MaterialTypeListSchema>;
export type MaterialTypeStats = z.infer<typeof MaterialTypeStatsSchema>;
