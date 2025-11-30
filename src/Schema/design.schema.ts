// src/Schema/design.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  createPagedResponseSchema,
  DateSchema,
  IdSchema,
  NameSchema,
} from "./common";
import { DesignTypeResponseSchema } from "./design-type.schema";
import { MaterialTypeResponseSchema } from "./material-type.schema";

// DesignTimelineEntryResponse
export const DesignTimelineEntryResponseSchema = z
  .object({
    id: IdSchema.optional(),
    fileUrl: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .strict();

export type DesignTimelineEntryResponse = z.infer<
  typeof DesignTimelineEntryResponseSchema
>;

// DesignResponse
export const DesignResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    orderId: IdSchema.optional(),
    designStatus: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    designerId: IdSchema.optional(),
    designer: UserInfoSchema.optional(),
    designTypeId: IdSchema.optional(),
    designType: DesignTypeResponseSchema.optional(),
    materialTypeId: IdSchema.optional(),
    materialType: MaterialTypeResponseSchema.optional(),
    quantity: z.number().int().optional(),
    designName: z.string().nullable().optional(),
    dimensions: z.string().nullable().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    areaCm2: z.number().nullable().optional(),
    unitPrice: z.number().nullable().optional(),
    totalPrice: z.number().nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
    designFileUrl: z.string().nullable().optional(),
    designImageUrl: z.string().nullable().optional(),
    excelFileUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    timelineEntries: z
      .array(DesignTimelineEntryResponseSchema)
      .nullable()
      .optional(),
  })
  .strict();

export type DesignResponse = z.infer<typeof DesignResponseSchema>;

// DesignResponsePagedResponse
export const DesignResponsePagedResponseSchema =
  createPagedResponseSchema(DesignResponseSchema);

export type DesignResponsePagedResponse = z.infer<
  typeof DesignResponsePagedResponseSchema
>;

// CreateDesignRequest
export const CreateDesignRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materialTypeId: IdSchema,
    assignedDesignerId: IdSchema.nullable().optional(),
    quantity: z.number().int().min(1),
    designName: NameSchema.nullable().optional(),
    width: z.number().min(0).nullable().optional(),
    height: z.number().min(0).nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
  })
  .strict();

export type CreateDesignRequest = z.infer<typeof CreateDesignRequestSchema>;

// UpdateDesignRequest
export const UpdateDesignRequestSchema = z
  .object({
    assignedDesignerId: IdSchema.nullable().optional(),
    designStatus: z.string().max(50).nullable().optional(),
    designFileUrl: z.string().nullable().optional(),
    excelFileUrl: z.string().nullable().optional(),
    width: z.number().min(0).nullable().optional(),
    height: z.number().min(0).nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
  })
  .strict();

export type UpdateDesignRequest = z.infer<typeof UpdateDesignRequestSchema>;
