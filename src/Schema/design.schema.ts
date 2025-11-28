// src/Schema/design.schema.ts
import { z } from "zod";
import { DesignTypeResponseSchema } from "./design-type.schema";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { UserInfoSchema } from "./auth.schema";
import { PagedMetaSchema } from ".";

/** CreateDesignRequest */
export const CreateDesignRequestSchema = z.object({
  designTypeId: z.number({ required_error: "Loại thiết kế là bắt buộc" }).int(),
  materialTypeId: z
    .number({ required_error: "Loại vật liệu là bắt buộc" })
    .int(),
  assignedDesignerId: z.number().int().nullable().optional(),
  quantity: z
    .number({ required_error: "Số lượng là bắt buộc" })
    .int()
    .min(1, { message: "Số lượng tối thiểu là 1" }),
  dimensions: z.string().max(255).nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  requirements: z.string().nullable().optional(),
  additionalNotes: z.string().nullable().optional(),
});
export type CreateDesignRequest = z.infer<typeof CreateDesignRequestSchema>;

/** UpdateDesignRequest */
export const UpdateDesignRequestSchema = z.object({
  assignedDesignerId: z.number().int().nullable().optional(),
  designStatus: z.string().max(50).nullable().optional(),
  designFileUrl: z.string().nullable().optional(),
  excelFileUrl: z.string().nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  requirements: z.string().nullable().optional(),
  additionalNotes: z.string().nullable().optional(),
});
export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;

/** DesignTimelineEntryResponse */
export const DesignTimelineEntryResponseSchema = z.object({
  id: z.number().int(),
  fileUrl: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  createdBy: UserInfoSchema,
});
export type DesignTimelineEntryResponse = z.infer<
  typeof DesignTimelineEntryResponseSchema
>;

/** DesignResponse (đúng như JSON ví dụ bạn gửi) */
export const DesignResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  orderId: z.number().int(),
  designStatus: z.string().nullable(),
  statusType: z.string().nullable(),
  designerId: z.number().int(),
  designer: UserInfoSchema,
  designTypeId: z.number().int(),
  designType: DesignTypeResponseSchema,
  materialTypeId: z.number().int(),
  materialType: MaterialTypeResponseSchema,
  quantity: z.number().int(),
  dimensions: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  areaCm2: z.number().nullable(),
  unitPrice: z.number().nullable(),
  totalPrice: z.number().nullable(),
  requirements: z.string().nullable(),
  additionalNotes: z.string().nullable(),
  designFileUrl: z.string().nullable(),
  excelFileUrl: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timelineEntries: z.array(DesignTimelineEntryResponseSchema).nullable(),
});
export type DesignResponse = z.infer<typeof DesignResponseSchema>;

/** Paged designs */
export const DesignResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(DesignResponseSchema).nullable(),
});
export type DesignResponsePagedResponse = z.infer<
  typeof DesignResponsePagedSchema
>;

/** List params: /api/designs */
export const DesignListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  designerId: z.number().int().optional(),
  status: z.string().optional(),
});
export type DesignListParams = z.infer<typeof DesignListParamsSchema>;

/** My designs params: /api/designs/my */
export const MyDesignListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  status: z.string().optional(),
});
export type MyDesignListParams = z.infer<typeof MyDesignListParamsSchema>;
