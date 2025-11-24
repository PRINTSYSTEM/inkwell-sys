import { z } from 'zod';
import { StatusEnum } from './Common/enums';
import { IdSchema, NameSchema, DescriptionSchema, DateSchema, DateRangeSchema } from './Common/base';

// Report Type Enum
export const ReportTypeEnum = z.enum([
  'performance',
  'attendance', 
  'assignments',
  'analytics',
  'department',
  'employee',
  'custom',
  'financial',
  'operational'
]);

// Report Category Enum
export const ReportCategoryEnum = z.enum([
  'operational',
  'strategic', 
  'compliance',
  'management',
  'hr',
  'financial'
]);

// Export Format Enum
export const ExportFormatEnum = z.enum([
  'pdf',
  'excel',
  'csv', 
  'json',
  'png',
  'jpg'
]);

// Report Status Enum
export const ReportStatusEnum = z.enum([
  'draft',
  'active',
  'scheduled', 
  'generating',
  'completed',
  'failed',
  'archived'
]);

// Report Parameter Schema
export const ReportParameterSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'select', 'multiselect', 'boolean', 'daterange']),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  options: z.array(z.object({
    value: z.union([z.string(), z.number()]),
    label: z.string()
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional()
  }).optional()
});

// Report Section Config Schema
export const ReportSectionConfigSchema = z.object({
  dataSource: z.string(),
  columns: z.array(z.string()).optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'between', 'in']),
    value: z.unknown()
  })).optional(),
  groupBy: z.array(z.string()).optional(),
  aggregations: z.array(z.object({
    field: z.string(),
    function: z.enum(['sum', 'avg', 'count', 'min', 'max']),
    alias: z.string().optional()
  })).optional(),
  styling: z.object({
    colors: z.array(z.string()).optional(),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional()
  }).optional()
});

// Report Section Schema
export const ReportSectionSchema = z.object({
  id: IdSchema,
  title: z.string(),
  type: z.enum(['chart', 'table', 'summary', 'text', 'image']),
  config: ReportSectionConfigSchema,
  order: z.number().min(1),
  isRequired: z.boolean().default(false)
});

// Report Template Schema
export const ReportTemplateSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  category: z.string(),
  type: ReportTypeEnum,
  structure: z.array(ReportSectionSchema),
  sections: z.array(ReportSectionSchema),
  defaultParameters: z.record(z.unknown()),
  isCustomizable: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Report Schedule Schema
export const ReportScheduleSchema = z.object({
  id: IdSchema,
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  interval: z.number().min(1).default(1),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  isActive: z.boolean().default(true),
  recipients: z.array(z.string()),
  format: z.array(ExportFormatEnum),
  lastRunAt: DateSchema.optional(),
  nextRunAt: DateSchema.optional()
});

// Export Options Schema
export const ExportOptionsSchema = z.object({
  format: ExportFormatEnum,
  includeCharts: z.boolean().default(true),
  includeRawData: z.boolean().default(false),
  pageOrientation: z.enum(['portrait', 'landscape']).default('portrait'),
  pageSize: z.enum(['A4', 'A3', 'Letter', 'Legal']).default('A4'),
  compression: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  watermark: z.string().optional(),
  password: z.string().optional()
});

// Main Report Schema
export const ReportSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  description: DescriptionSchema,
  type: ReportTypeEnum,
  category: ReportCategoryEnum,
  template: ReportTemplateSchema,
  parameters: z.array(ReportParameterSchema),
  schedule: ReportScheduleSchema.optional(),
  isPublic: z.boolean().default(false),
  status: ReportStatusEnum,
  tags: z.array(z.string()).default([]),
  createdBy: IdSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  lastGeneratedAt: DateSchema.optional()
});

// Report Generation Schema
export const ReportGenerationSchema = z.object({
  id: IdSchema,
  reportId: IdSchema,
  reportName: z.string().optional(),
  parameters: z.record(z.unknown()),
  format: ExportFormatEnum,
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  startedAt: DateSchema,
  completedAt: DateSchema.optional(),
  generationTime: z.number().positive().optional(),
  fileUrl: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  error: z.string().optional(),
  generatedBy: IdSchema
});

// Export Job Schema
export const ExportJobSchema = z.object({
  id: IdSchema,
  reportId: IdSchema.optional(),
  reportIds: z.array(IdSchema).optional(),
  reportName: z.string().optional(),
  reportNames: z.array(z.string()).optional(),
  format: ExportFormatEnum,
  status: z.enum(['queued', 'in_progress', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100).optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  downloadUrl: z.string().url().optional(),
  createdAt: DateSchema,
  startedAt: DateSchema.optional(),
  completedAt: DateSchema.optional(),
  error: z.string().optional(),
  createdBy: IdSchema
});

// Bulk Export Options Schema
export const BulkExportOptionsSchema = z.object({
  format: ExportFormatEnum,
  compression: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  includeCharts: z.boolean().default(true),
  includeRawData: z.boolean().default(false),
  splitLargeFiles: z.boolean().default(true),
  maxFileSize: z.number().positive().default(10),
  outputName: z.string().default('bulk_export')
});

// Report Analytics Schema
export const ReportAnalyticsSchema = z.object({
  reportId: IdSchema,
  views: z.number().min(0).default(0),
  downloads: z.number().min(0).default(0),
  shares: z.number().min(0).default(0),
  avgGenerationTime: z.number().min(0).default(0),
  lastAccessedAt: DateSchema,
  popularFormats: z.object({
    pdf: z.number().min(0).default(0),
    excel: z.number().min(0).default(0),
    csv: z.number().min(0).default(0),
    json: z.number().min(0).default(0),
    png: z.number().min(0).default(0),
    jpg: z.number().min(0).default(0)
  }),
  userActivity: z.array(z.object({
    userId: IdSchema,
    action: z.enum(['view', 'download', 'share', 'generate']),
    timestamp: DateSchema,
    details: z.record(z.unknown()).optional()
  }))
});

// Create Report Schema
export const CreateReportSchema = ReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
});

// Update Report Schema  
export const UpdateReportSchema = CreateReportSchema.partial();

// Report Filter Schema
export const ReportFilterSchema = z.object({
  search: z.string().optional(),
  type: ReportTypeEnum.optional(),
  category: ReportCategoryEnum.optional(),
  status: ReportStatusEnum.optional(),
  isPublic: z.boolean().optional(),
  createdBy: IdSchema.optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: DateSchema.optional(),
  createdBefore: DateSchema.optional(),
  sortBy: z.enum(['name', 'type', 'category', 'createdAt', 'lastGeneratedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Export types
export type ReportType = z.infer<typeof ReportTypeEnum>;
export type ReportCategory = z.infer<typeof ReportCategoryEnum>;
export type ExportFormat = z.infer<typeof ExportFormatEnum>;
export type ReportStatus = z.infer<typeof ReportStatusEnum>;
export type Report = z.infer<typeof ReportSchema>;
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type ReportParameter = z.infer<typeof ReportParameterSchema>;
export type ReportSchedule = z.infer<typeof ReportScheduleSchema>;
export type ReportGeneration = z.infer<typeof ReportGenerationSchema>;
export type ExportJob = z.infer<typeof ExportJobSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type BulkExportOptions = z.infer<typeof BulkExportOptionsSchema>;
export type ReportAnalytics = z.infer<typeof ReportAnalyticsSchema>;
export type CreateReport = z.infer<typeof CreateReportSchema>;
export type UpdateReport = z.infer<typeof UpdateReportSchema>;
export type ReportFilter = z.infer<typeof ReportFilterSchema>;