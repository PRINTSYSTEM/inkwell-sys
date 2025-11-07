import { z } from 'zod';
import { StatusEnum } from './Common/enums';
import { IdSchema, NameSchema, DescriptionSchema, DateSchema } from './Common/base';

// Department Type Enum
export const DepartmentTypeEnum = z.enum([
  'design',
  'production',
  'sales',
  'hr',
  'finance',
  'it',
  'management',
  'customer_service',
  'quality_assurance'
]);

// Department Budget Schema
export const DepartmentBudgetSchema = z.object({
  fiscal_year: z.number(),
  allocated_budget: z.number().positive(),
  spent_budget: z.number().min(0).default(0),
  remaining_budget: z.number().min(0),
  budget_utilization: z.number().min(0).max(100),
  categories: z.object({
    salaries: z.number().min(0).default(0),
    equipment: z.number().min(0).default(0),
    training: z.number().min(0).default(0),
    operations: z.number().min(0).default(0),
    other: z.number().min(0).default(0)
  })
});

// Department Metrics Schema
export const DepartmentMetricsSchema = z.object({
  id: IdSchema,
  departmentId: IdSchema,
  period: z.object({
    start: DateSchema,
    end: DateSchema
  }),
  headcount: z.object({
    total: z.number().min(0),
    active: z.number().min(0),
    new_hires: z.number().min(0),
    terminations: z.number().min(0),
    turnover_rate: z.number().min(0).max(100)
  }),
  performance: z.object({
    overall_score: z.number().min(0).max(100),
    productivity: z.number().min(0).max(100),
    quality: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    goals_achieved: z.number().min(0).max(100)
  }),
  financial: z.object({
    revenue_contribution: z.number().min(0).optional(),
    cost_per_employee: z.number().min(0),
    roi: z.number().optional(),
    budget_variance: z.number()
  }),
  projects: z.object({
    total_projects: z.number().min(0),
    completed_projects: z.number().min(0),
    on_time_delivery: z.number().min(0).max(100),
    budget_adherence: z.number().min(0).max(100)
  }),
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Main Department Schema
export const DepartmentSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  type: DepartmentTypeEnum,
  code: z.string().min(2).max(10),
  
  // Hierarchy
  parentId: IdSchema.optional(),
  managerId: IdSchema,
  level: z.number().min(1).max(5).default(1),
  
  // Location & Structure
  location: z.object({
    building: z.string().optional(),
    floor: z.string().optional(),
    room: z.string().optional(),
    address: z.string().optional()
  }).optional(),
  
  // Goals & Objectives
  goals: z.array(z.object({
    id: IdSchema,
    title: z.string(),
    description: z.string().optional(),
    target_value: z.number().optional(),
    current_value: z.number().optional(),
    unit: z.string().optional(),
    due_date: DateSchema.optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'overdue']),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  })).default([]),
  
  // Budget & Resources
  budget: DepartmentBudgetSchema.optional(),
  
  // Metrics & Analytics
  metrics: z.array(DepartmentMetricsSchema).default([]),
  
  // Configuration
  settings: z.object({
    max_employees: z.number().positive().optional(),
    working_hours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: z.string().default('Asia/Ho_Chi_Minh')
    }).optional(),
    approval_hierarchy: z.array(IdSchema).default([]),
    notification_settings: z.object({
      email_notifications: z.boolean().default(true),
      slack_integration: z.boolean().default(false),
      reports_frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
    }).optional()
  }).optional(),
  
  // Status & Metadata
  status: StatusEnum,
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Create Department Schema
export const CreateDepartmentSchema = DepartmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  metrics: true
});

// Update Department Schema
export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// Department Filter Schema
export const DepartmentFilterSchema = z.object({
  search: z.string().optional(),
  type: DepartmentTypeEnum.optional(),
  parentId: IdSchema.optional(),
  managerId: IdSchema.optional(),
  status: StatusEnum.optional(),
  isActive: z.boolean().optional(),
  level: z.number().optional(),
  hasSubDepartments: z.boolean().optional(),
  sortBy: z.enum(['name', 'code', 'type', 'level', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Department Analytics Schema
export const DepartmentAnalyticsSchema = z.object({
  overview: z.object({
    total_departments: z.number().min(0),
    active_departments: z.number().min(0),
    total_employees: z.number().min(0),
    average_team_size: z.number().min(0),
    budget_utilization: z.number().min(0).max(100)
  }),
  performance: z.object({
    top_performing: z.array(z.object({
      departmentId: IdSchema,
      name: z.string(),
      score: z.number().min(0).max(100)
    })),
    lowest_performing: z.array(z.object({
      departmentId: IdSchema,
      name: z.string(),
      score: z.number().min(0).max(100)
    })),
    average_performance: z.number().min(0).max(100)
  }),
  trends: z.object({
    headcount_trend: z.array(z.object({
      period: z.string(),
      count: z.number().min(0)
    })),
    performance_trend: z.array(z.object({
      period: z.string(),
      score: z.number().min(0).max(100)
    })),
    budget_trend: z.array(z.object({
      period: z.string(),
      utilization: z.number().min(0).max(100)
    }))
  }),
  breakdown: z.object({
    by_type: z.array(z.object({
      type: DepartmentTypeEnum,
      count: z.number().min(0),
      percentage: z.number().min(0).max(100)
    })),
    by_size: z.array(z.object({
      range: z.string(),
      count: z.number().min(0),
      percentage: z.number().min(0).max(100)
    }))
  })
});

// Export types
export type DepartmentType = z.infer<typeof DepartmentTypeEnum>;
export type Department = z.infer<typeof DepartmentSchema>;
export type DepartmentBudget = z.infer<typeof DepartmentBudgetSchema>;
export type DepartmentMetrics = z.infer<typeof DepartmentMetricsSchema>;
export type CreateDepartment = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartment = z.infer<typeof UpdateDepartmentSchema>;
export type DepartmentFilter = z.infer<typeof DepartmentFilterSchema>;
export type DepartmentAnalytics = z.infer<typeof DepartmentAnalyticsSchema>;