// src/Schema/design.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";
import { DesignTypeResponseSchema } from "./design-type.schema";
import {
  MaterialTypeResponseSchema,
  MaterialTypeClassificationOptionResponseSchema,
} from "./material-type.schema";
import { CustomerSummaryResponseSchema } from "./customer.schema";
import {
  DesignTimelineEntryResponseSchema as GenDesignTimelineEntryResponseSchema,
  DesignResponseSchema as GenDesignResponseSchema,
  DesignResponsePaginateSchema as GenDesignResponsePaginateSchema,
  CreateDesignRequestSchema as GenCreateDesignRequestSchema,
  UpdateDesignRequestSchema as GenUpdateDesignRequestSchema,
  postApidesignsIdtimeline_BodySchema as GenPostApidesignsIdtimelineBodySchema,
} from "./generated";

// ===== DesignTimelineEntryResponse =====
export const DesignTimelineEntryResponseSchema =
  GenDesignTimelineEntryResponseSchema.passthrough();
export type DesignTimelineEntryResponse = z.infer<
  typeof DesignTimelineEntryResponseSchema
>;

// ===== DesignResponse =====
export const DesignResponseSchema = GenDesignResponseSchema.passthrough();
export type DesignResponse = z.infer<typeof DesignResponseSchema>;

// ===== PagedResponse =====
export const DesignResponsePagedResponseSchema =
  createPagedResponseSchema(DesignResponseSchema);
export type DesignResponsePagedResponse = z.infer<
  typeof DesignResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenDesignResponsePaginateSchema as DesignResponsePaginateSchema };
export type DesignResponsePaginate = z.infer<
  typeof GenDesignResponsePaginateSchema
>;

// Note: DesignResponsePaginateSchema is also available from generated.ts

// ===== CreateDesignRequest =====
// Base from generated, but keep custom refine for validation
export const CreateDesignRequestSchema = GenCreateDesignRequestSchema.refine(
  (data) => {
    if (data.width != null && data.height != null) {
      return data.width >= 0 && data.height >= 0;
    }
    return true;
  },
  { message: "Kích thước không hợp lệ" }
);
export type CreateDesignRequest = z.infer<typeof CreateDesignRequestSchema>;

// ===== UpdateDesignRequest =====
export const UpdateDesignRequestSchema = GenUpdateDesignRequestSchema.passthrough();
export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;

// ===== DesignResponseForDesigner =====
// Custom schema - not in generated, keep as is
export const DesignResponseForDesignerSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    customerId: IdSchema.optional(),

    designerId: IdSchema.optional(),
    designer: UserInfoSchema.optional(),

    designTypeId: IdSchema.optional(),
    designType: DesignTypeResponseSchema.optional(),

    materialTypeId: IdSchema.optional(),
    materialType: MaterialTypeResponseSchema.optional(),

    designName: z.string().nullable().optional(),
    dimensions: z.string().nullable().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    areaCm2: z.number().nullable().optional(),

    designFileUrl: z.string().nullable().optional(),
    designImageUrl: z.string().nullable().optional(),
    excelFileUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),

    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),

    timelineEntries: z
      .array(DesignTimelineEntryResponseSchema)
      .nullable()
      .optional(),
  })
  .passthrough();

export type DesignResponseForDesigner = z.infer<
  typeof DesignResponseForDesignerSchema
>;

// ===== CreateDesignTimelineEntryRequest =====
// Use generated postApidesignsIdtimeline_Body schema
export const CreateDesignTimelineEntryRequestSchema =
  GenPostApidesignsIdtimelineBodySchema.passthrough();
export type CreateDesignTimelineEntryRequest = z.infer<
  typeof CreateDesignTimelineEntryRequestSchema
>;
