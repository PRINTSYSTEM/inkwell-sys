import { z } from 'zod';
import { IdSchema, DateSchema } from './Common/base';

// Design Assignment Priority Enum
export const DesignAssignmentPriorityEnum = z.enum([
  'low',
  'medium', 
  'high',
  'urgent'
]);

// Design Assignment Status Enum
export const DesignAssignmentStatusEnum = z.enum([
  'pending',      // Chờ bắt đầu
  'in_progress',  // Đang thực hiện
  'review',       // Đang review
  'revision',     // Cần sửa đổi
  'approved',     // Đã duyệt
  'completed',    // Hoàn thành
  'cancelled',    // Đã hủy
  'on_hold'       // Tạm dừng
]);

// Base Design Assignment Schema
export const DesignAssignmentSchema = z.object({
  id: IdSchema,
  
  // Assignment Details
  designCodeId: IdSchema,
  designerId: IdSchema,
  assignedBy: IdSchema, // ID của manager phân công
  
  // Timing
  assignedAt: DateSchema,
  deadline: DateSchema,
  startedAt: DateSchema.optional(),
  completedAt: DateSchema.optional(),
  
  // Status & Priority
  status: DesignAssignmentStatusEnum,
  priority: DesignAssignmentPriorityEnum,
  
  // Progress
  progressPercentage: z.number().min(0).max(100).default(0),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  
  // Description & Notes
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  
  // Revision tracking
  revisionCount: z.number().min(0).default(0),
  lastRevisionDate: DateSchema.optional(),
  
  // Metadata
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Create Design Assignment Schema (for new assignments)
export const CreateDesignAssignmentSchema = DesignAssignmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  progressPercentage: true,
  revisionCount: true,
}).extend({
  // Override optional fields for creation
  assignedAt: DateSchema.default(() => new Date()),
});

// Update Design Assignment Schema
export const UpdateDesignAssignmentSchema = DesignAssignmentSchema.partial().omit({
  id: true,
  createdAt: true,
}).extend({
  updatedAt: DateSchema.default(() => new Date()),
});

// Design Assignment Filter Schema
export const DesignAssignmentFilterSchema = z.object({
  designerId: IdSchema.optional(),
  assignedBy: IdSchema.optional(),
  status: DesignAssignmentStatusEnum.optional(),
  priority: DesignAssignmentPriorityEnum.optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  departmentId: IdSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['assignedAt', 'deadline', 'priority', 'status', 'title']).default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Design Assignment Statistics Schema
export const DesignAssignmentStatsSchema = z.object({
  total: z.number(),
  pending: z.number(),
  inProgress: z.number(),
  review: z.number(),
  completed: z.number(),
  overdue: z.number(),
  averageCompletionTime: z.number(), // in hours
  completionRate: z.number(), // percentage
});

// Type exports
export type DesignAssignment = z.infer<typeof DesignAssignmentSchema>;
export type CreateDesignAssignment = z.infer<typeof CreateDesignAssignmentSchema>;
export type UpdateDesignAssignment = z.infer<typeof UpdateDesignAssignmentSchema>;
export type DesignAssignmentFilter = z.infer<typeof DesignAssignmentFilterSchema>;
export type DesignAssignmentStats = z.infer<typeof DesignAssignmentStatsSchema>;
export type DesignAssignmentPriority = z.infer<typeof DesignAssignmentPriorityEnum>;
export type DesignAssignmentStatus = z.infer<typeof DesignAssignmentStatusEnum>;