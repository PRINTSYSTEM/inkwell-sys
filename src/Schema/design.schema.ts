// src/Schema/design.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";
import { DesignTypeResponseSchema } from "./design-type.schema";
import { MaterialTypeResponseSchema } from "./material-type.schema";

// ===== DesignTimelineEntryResponse =====

export const DesignTimelineEntryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    fileUrl: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .passthrough();

export type DesignTimelineEntryResponse = z.infer<
  typeof DesignTimelineEntryResponseSchema
>;

// ===== DesignResponse =====

export const DesignResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    customerId: IdSchema.optional(),
    designerId: IdSchema.optional(),
    designer: UserInfoSchema.nullable().optional(),
    designTypeId: IdSchema.optional(),
    designType: DesignTypeResponseSchema.nullable().optional(),
    materialTypeId: IdSchema.optional(),
    materialType: MaterialTypeResponseSchema.nullable().optional(),
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

export type DesignResponse = z.infer<typeof DesignResponseSchema>;

// ===== PagedResponse =====

export const DesignResponsePagedResponseSchema =
  createPagedResponseSchema(DesignResponseSchema);

export type DesignResponsePagedResponse = z.infer<
  typeof DesignResponsePagedResponseSchema
>;

// ===== CreateDesignRequest =====

export const CreateDesignRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materialTypeId: IdSchema,
    assignedDesignerId: IdSchema.nullable().optional(),
    quantity: z.number().int().min(1, "Số lượng tối thiểu là 1"),
    designName: NameSchema.nullable().optional(),
    width: z.number().min(0, "Chiều rộng không thể âm").nullable().optional(),
    height: z.number().min(0, "Chiều cao không thể âm").nullable().optional(),
    requirements: z.string().max(2000).nullable().optional(),
    additionalNotes: z.string().max(1000).nullable().optional(),
  })
  .refine(
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

export const UpdateDesignRequestSchema = z
  .object({
    assignedDesignerId: IdSchema.nullable().optional(),
    designName: z.string().max(255).nullable().optional(),
    designStatus: z.string().max(50).nullable().optional(),
    designFileUrl: z.string().nullable().optional(),
    excelFileUrl: z.string().nullable().optional(),
    width: z.number().min(0).nullable().optional(),
    height: z.number().min(0).nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;

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

export const CreateDesignTimelineEntryRequestSchema = z
  .object({
    File: z.string(), // binary file - handled as FormData
    Description: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateDesignTimelineEntryRequest = z.infer<
  typeof CreateDesignTimelineEntryRequestSchema
>;
