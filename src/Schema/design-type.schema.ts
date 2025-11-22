import { z } from 'zod';
import { StatusEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';

// User schema for createdBy field
export const DesignTypeUserSchema = z.object({
  id: IdSchema,
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

// Design Type Entity schema for API responses  
export const DesignTypeEntitySchema = z.object({
  id: IdSchema,
  code: z.string().min(1, 'Mã loại thiết kế không được để trống'),
  name: z.string().min(1, 'Tên loại thiết kế không được để trống'),
  displayOrder: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0'),
  description: z.string().optional(),
  status: StatusEnum,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: DesignTypeUserSchema,
});

// Schema for creating new design type
export const CreateDesignTypeSchema = z.object({
  code: z.string().min(1, 'Mã loại thiết kế không được để trống')
    .max(10, 'Mã loại thiết kế không được quá 10 ký tự'),
  name: z.string().min(1, 'Tên loại thiết kế không được để trống')
    .max(100, 'Tên loại thiết kế không được quá 100 ký tự'),
  displayOrder: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0'),
  description: z.string().optional(),
  status: StatusEnum,
});

// Schema for updating design type
export const UpdateDesignTypeSchema = CreateDesignTypeSchema.partial();

// Schema for design type list response
export const DesignTypeListSchema = z.object({
  data: z.array(DesignTypeEntitySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

// Schema for design type statistics
export const DesignTypeStatsSchema = z.object({
  total: z.number().int().min(0),
  active: z.number().int().min(0),
  inactive: z.number().int().min(0),
});

// Type exports
export type DesignTypeEntity = z.infer<typeof DesignTypeEntitySchema>;
export type DesignType = DesignTypeEntity; // Alias for compatibility
export type CreateDesignTypeRequest = z.infer<typeof CreateDesignTypeSchema>;
export type UpdateDesignTypeRequest = z.infer<typeof UpdateDesignTypeSchema>;
export type DesignTypeListResponse = z.infer<typeof DesignTypeListSchema>;
export type DesignTypeStats = z.infer<typeof DesignTypeStatsSchema>;
export type DesignTypeUser = z.infer<typeof DesignTypeUserSchema>;