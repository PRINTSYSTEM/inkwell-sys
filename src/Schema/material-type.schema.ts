// src/Schema/material-type.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  CommonStatusSchema,
  DateSchema,
  IdSchema,
  NameSchema,
} from "./common";

// CreateMaterialTypeRequest
export const CreateMaterialTypeRequestSchema = z
  .object({
    code: z.string().max(20),
    name: NameSchema,
    displayOrder: z.number().int().min(0),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().min(0),
    designTypeId: IdSchema.nullable().optional(),
    status: CommonStatusSchema,
  })
  .strict();

export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

// MaterialTypeItem (dùng cho bulk create)
export const MaterialTypeItemSchema = z
  .object({
    code: z.string().max(20),
    name: NameSchema,
    displayOrder: z.number().int().min(0),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().min(0),
    status: CommonStatusSchema,
  })
  .strict();

export type MaterialTypeItem = z.infer<typeof MaterialTypeItemSchema>;

// BulkCreateMaterialTypeRequest
export const BulkCreateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materials: z.array(MaterialTypeItemSchema).min(1),
  })
  .strict();

export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

// UpdateMaterialTypeRequest
export const UpdateMaterialTypeRequestSchema = z
  .object({
    name: NameSchema.nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number().min(0).nullable().optional(),
    designTypeId: IdSchema.nullable().optional(),
    status: CommonStatusSchema.nullable().optional(),
  })
  .strict();

export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;

// MaterialTypeResponse
export const MaterialTypeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    displayOrder: z.number().int().optional(),
    description: z.string().nullable().optional(),
    pricePerCm2: z.number(),
    designTypeId: IdSchema.nullable().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .strict();

export type MaterialTypeResponse = z.infer<typeof MaterialTypeResponseSchema>;
