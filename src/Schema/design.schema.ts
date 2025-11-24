import { z } from "zod";
import { IdSchema, DateSchema } from "./Common/base";
import { DesignTypeEntitySchema } from "./design-type.schema";
import { MaterialTypeEntitySchema } from "./material-type.schema";
import { UserSchema } from "./user.schema";
import { TimelineEntrySchema } from "./timeline.schema";

// Design Status enum specific to designs
export const DesignStatusEnum = z.enum([
  "received_info",
  "designing",
  "editing",
  "waiting_for_customer_approval",
  "confirmed_for_printing",
  "pdf_exported",
]);

// Main Design Entity schema
export const DesignEntitySchema = z.object({
  id: IdSchema,
  code: z.string(),
  orderId: IdSchema,

  // Nếu muốn strict hơn:
  // designStatus: DesignStatusEnum,
  designStatus: DesignStatusEnum,
  statusType: z.string(),

  designerId: IdSchema,
  designer: UserSchema,

  designTypeId: IdSchema,
  designType: DesignTypeEntitySchema,

  materialTypeId: IdSchema,
  materialType: MaterialTypeEntitySchema,

  quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0"),
  dimensions: z.string(),

  // Các field số có thể null → nullable + optional để tránh crash
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  areaCm2: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  totalPrice: z.number().nullable().optional(),

  requirements: z.string().optional(),
  additionalNotes: z.string().optional(),

  // API đôi khi trả null → nullable + optional
  designFileUrl: z.string().nullable().optional(),
  excelFileUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  createdAt: DateSchema,
  updatedAt: DateSchema,

  // API có thể trả [] hoặc không có field → optional là ổn,
  // nếu muốn luôn là [] thì dùng .default([])
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
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Create Design Request schema
export const CreateDesignRequestSchema = z.object({
  orderId: IdSchema,
  designTypeId: IdSchema,
  materialTypeId: IdSchema,
  designerId: IdSchema.optional(),
  quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0"),
  dimensions: z.string().min(1, "Kích thước không được để trống"),
  requirements: z.string().min(1, "Yêu cầu thiết kế không được để trống"),
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
  description: z.string().min(1, "Mô tả không được để trống"),
  fileUrl: z.string().optional(),
});

// Inferred TypeScript types
export type Design = z.infer<typeof DesignEntitySchema>;
export type DesignListResponse = z.infer<typeof DesignListResponseSchema>;
export type DesignQueryParams = z.infer<typeof DesignQueryParamsSchema>;
export type CreateDesignRequest = z.infer<typeof CreateDesignRequestSchema>;
export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;
export type CreateTimelineEntry = z.infer<typeof CreateTimelineEntrySchema>;
export type DesignStatus = z.infer<typeof DesignStatusEnum>;
