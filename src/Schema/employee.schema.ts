import { z } from 'zod';
import { IdSchema, NameSchema, DescriptionSchema, EmailSchema, PhoneSchema, DateSchema, DateRangeSchema } from './Common/base';

// Employee Status Enum
export const EmployeeStatusEnum = z.enum([
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'probation',
  'contract',
  'part_time',
  'full_time'
]);

// Employee Position Schema
export const EmployeePositionSchema = z.object({
  id: IdSchema,
  title: NameSchema,
  level: z.number().min(1).max(10),
  departmentId: IdSchema,
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  salaryRange: z.object({
    min: z.number().positive(),
    max: z.number().positive()
  }).optional(),
  isActive: z.boolean().default(true)
});

// Employee Performance Metrics Schema
export const PerformanceMetricsSchema = z.object({
  id: IdSchema,
  employeeId: IdSchema,
  period: DateRangeSchema,
  overallScore: z.number().min(0).max(100),
  categories: z.object({
    productivity: z.number().min(0).max(100),
    quality: z.number().min(0).max(100),
    teamwork: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    leadership: z.number().min(0).max(100).optional(),
    innovation: z.number().min(0).max(100).optional()
  }),
  goals: z.array(z.object({
    id: IdSchema,
    title: z.string(),
    description: z.string().optional(),
    target: z.string(),
    achieved: z.boolean(),
    progress: z.number().min(0).max(100),
    dueDate: DateSchema.optional()
  })),
  feedback: z.string().optional(),
  reviewedBy: IdSchema,
  reviewedAt: DateSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Employee Assignment Schema
export const EmployeeAssignmentSchema = z.object({
  id: IdSchema,
  employeeId: IdSchema,
  taskId: IdSchema,
  projectId: IdSchema.optional(),
  title: NameSchema,
  description: DescriptionSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled']),
  startDate: DateSchema,
  dueDate: DateSchema,
  completedAt: DateSchema.optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  progress: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).default([]),
  assignedBy: IdSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Employee Skills Schema
export const EmployeeSkillSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  category: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuedBy: z.string(),
    issuedDate: DateSchema,
    expiryDate: DateSchema.optional(),
    credentialId: z.string().optional()
  })).default([]),
  endorsements: z.number().min(0).default(0),
  isVerified: z.boolean().default(false)
});

// Main Employee Schema
export const EmployeeSchema = z.object({
  id: IdSchema,
  employeeCode: z.string().min(1, 'Employee code is required'),
  userId: IdSchema,
  departmentId: IdSchema,
  positionId: IdSchema,
  managerId: IdSchema.optional(),
  
  // Personal Information
  personalInfo: z.object({
    firstName: NameSchema,
    lastName: NameSchema,
    fullName: z.string(),
    email: EmailSchema,
    phone: PhoneSchema,
    dateOfBirth: DateSchema.optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    nationalId: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().default('Vietnam'),
    emergencyContact: z.object({
      name: z.string(),
      relationship: z.string(),
      phone: PhoneSchema
    }).optional()
  }),

  // Employment Information
  employmentInfo: z.object({
    startDate: DateSchema,
    endDate: DateSchema.optional(),
    status: EmployeeStatusEnum,
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
    workLocation: z.enum(['office', 'remote', 'hybrid']).default('office'),
    workSchedule: z.object({
      workingDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      breakDuration: z.number().min(0).default(60),
      totalHoursPerWeek: z.number().positive().default(40)
    }),
    probationPeriod: z.object({
      startDate: DateSchema,
      endDate: DateSchema,
      isCompleted: z.boolean().default(false),
      feedback: z.string().optional()
    }).optional(),
    salary: z.object({
      base: z.number().positive(),
      currency: z.string().default('VND'),
      payFrequency: z.enum(['monthly', 'weekly', 'bi_weekly']).default('monthly'),
      effectiveDate: DateSchema
    }),
    benefits: z.array(z.string()).default([])
  }),

  // Skills and Performance
  skills: z.array(EmployeeSkillSchema).default([]),
  assignments: z.array(EmployeeAssignmentSchema).default([]),
  performanceMetrics: z.array(PerformanceMetricsSchema).default([]),
  
  // Attendance and Leave
  attendanceStats: z.object({
    totalWorkingDays: z.number().min(0).default(0),
    presentDays: z.number().min(0).default(0),
    absentDays: z.number().min(0).default(0),
    lateDays: z.number().min(0).default(0),
    overtimeHours: z.number().min(0).default(0),
    leaveBalance: z.object({
      annual: z.number().min(0).default(12),
      sick: z.number().min(0).default(12),
      personal: z.number().min(0).default(3),
      used: z.object({
        annual: z.number().min(0).default(0),
        sick: z.number().min(0).default(0),
        personal: z.number().min(0).default(0)
      })
    })
  }),

  // Metadata
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Create Employee Schema
export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignments: true,
  performanceMetrics: true
});

// Update Employee Schema
export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

// Employee Filter Schema
export const EmployeeFilterSchema = z.object({
  search: z.string().optional(),
  departmentId: IdSchema.optional(),
  positionId: IdSchema.optional(),
  managerId: IdSchema.optional(),
  status: EmployeeStatusEnum.optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  workLocation: z.enum(['office', 'remote', 'hybrid']).optional(),
  skills: z.array(z.string()).optional(),
  joinedAfter: DateSchema.optional(),
  joinedBefore: DateSchema.optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['employeeCode', 'personalInfo.fullName', 'employmentInfo.startDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Employee Analytics Schema
export const EmployeeAnalyticsSchema = z.object({
  totalEmployees: z.number().min(0),
  activeEmployees: z.number().min(0),
  newHires: z.number().min(0),
  turnoverRate: z.number().min(0).max(100),
  averagePerformance: z.number().min(0).max(100),
  attendanceRate: z.number().min(0).max(100),
  departmentBreakdown: z.array(z.object({
    departmentId: IdSchema,
    departmentName: z.string(),
    employeeCount: z.number().min(0),
    averagePerformance: z.number().min(0).max(100)
  })),
  skillsGaps: z.array(z.object({
    skill: z.string(),
    demandLevel: z.enum(['low', 'medium', 'high']),
    currentProficiency: z.number().min(0).max(100),
    requiredProficiency: z.number().min(0).max(100)
  }))
});

// Export types
export type Employee = z.infer<typeof EmployeeSchema>;
export type EmployeePosition = z.infer<typeof EmployeePositionSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type EmployeeAssignment = z.infer<typeof EmployeeAssignmentSchema>;
export type EmployeeSkill = z.infer<typeof EmployeeSkillSchema>;
export type EmployeeStatus = z.infer<typeof EmployeeStatusEnum>;
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFilter = z.infer<typeof EmployeeFilterSchema>;
export type EmployeeAnalytics = z.infer<typeof EmployeeAnalyticsSchema>;