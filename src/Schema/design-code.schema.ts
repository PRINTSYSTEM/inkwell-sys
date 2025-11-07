import { z } from 'zod';
import { StatusEnum, PriorityEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';

// Design Type Enum
export const DesignTypeEnum = z.enum([
  'business_card',
  'brochure',
  'flyer',
  'poster',
  'banner',
  'catalog',
  'booklet',
  'packaging',
  'logo',
  'letterhead',
  'envelope',
  'invoice',
  'receipt',
  'label',
  'sticker',
  'magazine',
  'newspaper',
  'book',
  'calendar',
  'custom'
]);

// Paper Size Enum
export const PaperSizeEnum = z.enum([
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  'B0', 'B1', 'B2', 'B3', 'B4', 'B5',
  'Letter', 'Legal', 'Tabloid', 'Executive',
  'Custom'
]);

// Color Mode Enum
export const ColorModeEnum = z.enum([
  'CMYK',
  'RGB',
  'Pantone',
  'Grayscale',
  'Black_White'
]);

// Print Method Enum
export const PrintMethodEnum = z.enum([
  'digital',
  'offset',
  'large_format',
  'screen_printing',
  'letterpress',
  'foil_stamping',
  'embossing',
  'uv_coating'
]);

// Finishing Option Enum
export const FinishingOptionEnum = z.enum([
  'none',
  'lamination_gloss',
  'lamination_matte',
  'uv_coating',
  'aqueous_coating',
  'varnish',
  'foil_stamping',
  'embossing',
  'debossing',
  'die_cutting',
  'folding',
  'binding_saddle',
  'binding_perfect',
  'binding_spiral',
  'perforating',
  'scoring'
]);

// Design Specification Schema
export const DesignSpecificationSchema = z.object({
  // Dimensions
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['mm', 'cm', 'inch', 'px', 'pt']).default('mm'),
  
  // Paper & Print
  paperSize: PaperSizeEnum,
  paperWeight: z.number().positive().optional(),
  paperType: z.string().optional(),
  colorMode: ColorModeEnum,
  printMethod: PrintMethodEnum,
  
  // Layout
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  pages: z.number().positive().default(1),
  bleed: z.number().min(0).default(3),
  margin: z.object({
    top: z.number().min(0),
    right: z.number().min(0),
    bottom: z.number().min(0),
    left: z.number().min(0)
  }).optional(),
  
  // Finishing
  finishing: z.array(FinishingOptionEnum).default([]),
  
  // Quality
  resolution: z.number().positive().default(300),
  quality: z.enum(['draft', 'standard', 'high', 'premium']).default('standard')
});

// Design File Schema
export const DesignFileSchema = z.object({
  id: IdSchema,
  filename: z.string(),
  originalName: z.string(),
  fileType: z.enum(['ai', 'psd', 'pdf', 'eps', 'svg', 'png', 'jpg', 'tiff', 'indd']),
  fileSize: z.number().positive(),
  filePath: z.string(),
  version: z.number().positive().default(1),
  isLatest: z.boolean().default(true),
  uploadedAt: DateSchema,
  uploadedBy: IdSchema
});

// Design Revision Schema
export const DesignRevisionSchema = z.object({
  id: IdSchema,
  revisionNumber: z.number().positive(),
  description: z.string(),
  changes: z.array(z.string()).default([]),
  files: z.array(DesignFileSchema),
  createdAt: DateSchema,
  createdBy: IdSchema,
  approvedAt: DateSchema.optional(),
  approvedBy: IdSchema.optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'rejected']).default('draft'),
  feedback: z.string().optional()
});

// Design Approval Schema
export const DesignApprovalSchema = z.object({
  id: IdSchema,
  designCodeId: IdSchema,
  revisionId: IdSchema,
  approverType: z.enum(['client', 'manager', 'quality_control']),
  approverId: IdSchema,
  status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']),
  feedback: z.string().optional(),
  approvedAt: DateSchema.optional(),
  deadline: DateSchema.optional()
});

// Main Design Code Schema
export const DesignCodeSchema = z.object({
  id: IdSchema,
  code: z.string().regex(/^DC-\d{4}-\d{6}$/, "Design code must follow format DC-YYYY-XXXXXX"),
  
  // Basic Info
  title: z.string(),
  description: z.string().optional(),
  type: DesignTypeEnum,
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Client & Project
  clientId: IdSchema,
  projectId: IdSchema.optional(),
  orderId: IdSchema.optional(),
  
  // Design Details
  specifications: DesignSpecificationSchema,
  colorProfile: z.string().optional(),
  fonts: z.array(z.string()).default([]),
  
  // Files & Versions
  currentRevision: z.number().positive().default(1),
  revisions: z.array(DesignRevisionSchema).default([]),
  finalFiles: z.array(DesignFileSchema).default([]),
  
  // Workflow
  status: StatusEnum,
  priority: PriorityEnum,
  assignedTo: IdSchema.optional(),
  department: z.string().optional(),
  
  // Approval Process
  requiresApproval: z.boolean().default(true),
  approvals: z.array(DesignApprovalSchema).default([]),
  
  // Timeline
  requestedDate: DateSchema,
  estimatedCompletionDate: DateSchema.optional(),
  actualCompletionDate: DateSchema.optional(),
  deadline: DateSchema.optional(),
  
  // Production
  isReadyForProduction: z.boolean().default(false),
  productionNotes: z.string().optional(),
  printQuantity: z.number().positive().optional(),
  
  // Cost & Billing
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  billingStatus: z.enum(['not_billed', 'invoiced', 'paid']).default('not_billed'),
  
  // Analytics
  viewCount: z.number().min(0).default(0),
  downloadCount: z.number().min(0).default(0),
  lastViewedAt: DateSchema.optional(),
  
  // Metadata
  keywords: z.array(z.string()).default([]),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  
  // Timestamps
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema,
  lastModifiedBy: IdSchema.optional()
});

// Design Template Schema
export const DesignTemplateSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  type: DesignTypeEnum,
  category: z.string(),
  
  // Template Specs
  specifications: DesignSpecificationSchema,
  previewImage: z.string().url().optional(),
  
  // Template Files
  templateFiles: z.array(DesignFileSchema),
  
  // Usage
  isPublic: z.boolean().default(false),
  usageCount: z.number().min(0).default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Design Statistics Schema
export const DesignStatsSchema = z.object({
  period: z.object({
    start: DateSchema,
    end: DateSchema
  }),
  
  overview: z.object({
    total_designs: z.number().min(0),
    completed_designs: z.number().min(0),
    pending_designs: z.number().min(0),
    average_completion_time: z.number().min(0),
    completion_rate: z.number().min(0).max(100),
    client_satisfaction: z.number().min(0).max(5).optional()
  }),
  
  by_type: z.array(z.object({
    type: DesignTypeEnum,
    count: z.number().min(0),
    completed: z.number().min(0),
    average_time: z.number().min(0)
  })),
  
  by_status: z.array(z.object({
    status: StatusEnum,
    count: z.number().min(0),
    percentage: z.number().min(0).max(100)
  })),
  
  by_designer: z.array(z.object({
    designerId: IdSchema,
    designerName: z.string(),
    assigned: z.number().min(0),
    completed: z.number().min(0),
    efficiency: z.number().min(0).max(100)
  })),
  
  trends: z.array(z.object({
    date: DateSchema,
    created: z.number().min(0),
    completed: z.number().min(0),
    approved: z.number().min(0)
  }))
});

// Create Design Code Schema
export const CreateDesignCodeSchema = DesignCodeSchema.omit({
  id: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  currentRevision: true,
  revisions: true,
  finalFiles: true,
  approvals: true,
  viewCount: true,
  downloadCount: true,
  lastViewedAt: true
}).extend({
  generateCode: z.boolean().default(true)
});

// Update Design Code Schema
export const UpdateDesignCodeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  type: DesignTypeEnum.optional(),
  specifications: DesignSpecificationSchema.optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assignedTo: IdSchema.optional(),
  estimatedCompletionDate: DateSchema.optional(),
  deadline: DateSchema.optional(),
  productionNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Design Code Filter Schema
export const DesignCodeFilterSchema = z.object({
  search: z.string().optional(),
  type: DesignTypeEnum.optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  clientId: IdSchema.optional(),
  assignedTo: IdSchema.optional(),
  department: z.string().optional(),
  createdAfter: DateSchema.optional(),
  createdBefore: DateSchema.optional(),
  deadlineAfter: DateSchema.optional(),
  deadlineBefore: DateSchema.optional(),
  tags: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(),
  isReadyForProduction: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'deadline', 'priority', 'status', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Export types
export type DesignType = z.infer<typeof DesignTypeEnum>;
export type PaperSize = z.infer<typeof PaperSizeEnum>;
export type ColorMode = z.infer<typeof ColorModeEnum>;
export type PrintMethod = z.infer<typeof PrintMethodEnum>;
export type FinishingOption = z.infer<typeof FinishingOptionEnum>;
export type DesignSpecification = z.infer<typeof DesignSpecificationSchema>;
export type DesignFile = z.infer<typeof DesignFileSchema>;
export type DesignRevision = z.infer<typeof DesignRevisionSchema>;
export type DesignApproval = z.infer<typeof DesignApprovalSchema>;
export type DesignCode = z.infer<typeof DesignCodeSchema>;
export type DesignTemplate = z.infer<typeof DesignTemplateSchema>;
export type DesignStats = z.infer<typeof DesignStatsSchema>;
export type CreateDesignCode = z.infer<typeof CreateDesignCodeSchema>;
export type UpdateDesignCode = z.infer<typeof UpdateDesignCodeSchema>;
export type DesignCodeFilter = z.infer<typeof DesignCodeFilterSchema>;