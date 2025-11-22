import { z } from 'zod';
import { StatusEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';
import { DesignTypeEntitySchema } from './design-type.schema';
import { MaterialTypeEntitySchema } from './material-type.schema';

// User/Designer schema for nested objects
export const DesignUserSchema = z.object({
  id: IdSchema,
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

// Design Status enum specific to designs
export const DesignStatusEnum = z.enum([
  'pending',
  'in_progress',
  'review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
  'on_hold'
]);

// Timeline Entry schema
export const TimelineEntrySchema = z.object({
  id: IdSchema,
  fileUrl: z.string().optional(),
  description: z.string(),
  createdAt: DateSchema,
  createdBy: DesignUserSchema,
});

// Main Design Entity schema
export const DesignEntitySchema = z.object({
  id: IdSchema,
  code: z.string(),
  orderId: IdSchema,
  designStatus: z.string(), // Using string to match API response
  designerId: IdSchema,
  designer: DesignUserSchema,
  designTypeId: IdSchema,
  designType: DesignTypeEntitySchema,
  materialTypeId: IdSchema,
  materialType: MaterialTypeEntitySchema,
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  dimensions: z.string(),
  requirements: z.string(),
  additionalNotes: z.string().optional(),
  designFileUrl: z.string().optional(),
  excelFileUrl: z.string().optional(),
  notes: z.string().optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  timelineEntries: z.array(TimelineEntrySchema).optional(),
});

// Design List Response schema (paginated)
export const DesignListResponseSchema = z.object({
  items: z.array(DesignEntitySchema),
  totalCount: z.number().int(),
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});

// Design Query Parameters
export const DesignQueryParamsSchema = z.object({
  pageNumber: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  designerId: IdSchema.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Create Design Request schema
export const CreateDesignRequestSchema = z.object({
  orderId: IdSchema,
  designTypeId: IdSchema,
  materialTypeId: IdSchema,
  designerId: IdSchema.optional(),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  dimensions: z.string().min(1, 'Kích thước không được để trống'),
  requirements: z.string().min(1, 'Yêu cầu thiết kế không được để trống'),
  additionalNotes: z.string().optional(),
});

// Update Design Request schema
export const UpdateDesignRequestSchema = z.object({
  designStatus: DesignStatusEnum.optional(),
  designerId: IdSchema.optional(),
  quantity: z.number().int().min(1).optional(),
  dimensions: z.string().optional(),
  requirements: z.string().optional(),
  additionalNotes: z.string().optional(),
  notes: z.string().optional(),
});

// Timeline Entry Create schema
export const CreateTimelineEntrySchema = z.object({
  description: z.string().min(1, 'Mô tả không được để trống'),
  fileUrl: z.string().optional(),
});

// Inferred TypeScript types
export type Design = z.infer<typeof DesignEntitySchema>;
export type Designer = z.infer<typeof DesignUserSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type DesignListResponse = z.infer<typeof DesignListResponseSchema>;
export type DesignQueryParams = z.infer<typeof DesignQueryParamsSchema>;
export type CreateDesignRequest = z.infer<typeof CreateDesignRequestSchema>;
export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;
export type CreateTimelineEntry = z.infer<typeof CreateTimelineEntrySchema>;
export type DesignStatus = z.infer<typeof DesignStatusEnum>;

// Re-export related types for convenience
export type { 
  DesignType,
  DesignTypeEntity 
} from './design-type.schema';
export type { 
  MaterialType,
  MaterialTypeEntity 
} from './material-type.schema';