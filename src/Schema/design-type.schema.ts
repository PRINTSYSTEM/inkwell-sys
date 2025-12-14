// src/Schema/design-type.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  CommonStatusSchema,
  DateSchema,
  IdSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";

// CreateDesignTypeRequest
export const CreateDesignTypeRequestSchema = z
  .object({
    code: z
      .string()
      .min(2, "Mã loại thiết kế quá ngắn")
      .max(20, "Mã loại thiết kế quá dài")
      .regex(/^[A-Z0-9-]+$/, "Mã chỉ gồm A-Z, số và dấu gạch ngang"),
    name: NameSchema,
    displayOrder: z.number().int().min(0).default(0),
    description: z.string().max(500).nullable().optional(),
    status: CommonStatusSchema,
  })
  .passthrough();

export type CreateDesignTypeRequest = z.infer<
  typeof CreateDesignTypeRequestSchema
>;

// UpdateDesignTypeRequest
export const UpdateDesignTypeRequestSchema = z
  .object({
    name: NameSchema.nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
    description: z.string().nullable().optional(),
    status: CommonStatusSchema.nullable().optional(),
  })
  .passthrough();

export type UpdateDesignTypeRequest = z.infer<
  typeof UpdateDesignTypeRequestSchema
>;

// DesignTypeResponse
export const DesignTypeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    displayOrder: z.number().int().optional(),
    description: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.nullable().optional(),
  })
  .passthrough();

export type DesignTypeResponse = z.infer<typeof DesignTypeResponseSchema>;

export const DesignTypeListResponseSchema = createPagedResponseSchema(
  DesignTypeResponseSchema
);

export type DesignTypeListResponse = z.infer<
  typeof DesignTypeListResponseSchema
>;
