import { z } from 'zod';
import { StatusEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';

// User schema for createdBy field
export const MaterialTypeUserSchema = z.object({
  id: IdSchema,
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

// Material Type Entity schema for API responses  
export const MaterialTypeEntitySchema = z.object({
  id: IdSchema,
  code: z.string().min(1, 'Mã loại vật liệu không được để trống'),
  name: z.string().min(1, 'Tên loại vật liệu không được để trống'),
  displayOrder: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0'),
  description: z.string().optional(),
  status: StatusEnum,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: MaterialTypeUserSchema,
});

// Schema for creating new material type
export const CreateMaterialTypeSchema = z.object({
  code: z.string().min(1, 'Mã loại vật liệu không được để trống')
    .max(10, 'Mã loại vật liệu không được quá 10 ký tự'),
  name: z.string().min(1, 'Tên loại vật liệu không được để trống')
    .max(100, 'Tên loại vật liệu không được quá 100 ký tự'),
  displayOrder: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0'),
  description: z.string().optional(),
  status: StatusEnum,
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
export type CreateMaterialTypeRequest = z.infer<typeof CreateMaterialTypeSchema>;
export type UpdateMaterialTypeRequest = z.infer<typeof UpdateMaterialTypeSchema>;
export type MaterialTypeListResponse = z.infer<typeof MaterialTypeListSchema>;
export type MaterialTypeStats = z.infer<typeof MaterialTypeStatsSchema>;
export type MaterialTypeUser = z.infer<typeof MaterialTypeUserSchema>;