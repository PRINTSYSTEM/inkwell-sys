import { z } from 'zod';

// Date related schemas
export const DateSchema = z.coerce.date();

export const DateRangeSchema = z.object({
  start: DateSchema,
  end: DateSchema
}).refine(data => data.start <= data.end, {
  message: "End date must be after start date"
});

// Common ID schemas
export const IdSchema = z.string().min(1, 'ID is required');
export const OptionalIdSchema = z.string().optional();

// Common string schemas
export const NameSchema = z.string().min(1, 'Name is required').max(255, 'Name too long');
export const DescriptionSchema = z.string().max(1000, 'Description too long').optional();
export const EmailSchema = z.string().email('Invalid email format');
export const PhoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone format').optional();

// File related schemas
export const FileSchema = z.object({
  id: IdSchema,
  name: z.string(),
  url: z.string().url(),
  size: z.number().positive(),
  type: z.string(),
  uploadedAt: DateSchema,
  uploadedBy: IdSchema
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().min(0).optional(),
  totalPages: z.number().min(0).optional()
});

// Filter schemas
export const BaseFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  createdAt: DateRangeSchema.optional(),
  updatedAt: DateRangeSchema.optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.unknown().optional()
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional()
});

export const ApiResponseSchema = z.union([SuccessResponseSchema, ErrorResponseSchema]);

// Export types
export type DateRange = z.infer<typeof DateRangeSchema>;
export type FileType = z.infer<typeof FileSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type BaseFilter = z.infer<typeof BaseFilterSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;