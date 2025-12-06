// src/Schema/material-type.schema.ts
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./common";
import { UserInfoSchema } from "./common";

// ===== MaterialTypeResponse =====

export const MaterialTypeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    designTypeId: IdSchema.optional(),
    designTypeName: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    name: NameSchema.nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    createdBy: UserInfoSchema.optional(),
  })
  .strict();

export type MaterialTypeResponse = z.infer<typeof MaterialTypeResponseSchema>;

// ===== PagedResponse =====

export const MaterialTypeResponsePagedResponseSchema =
  createPagedResponseSchema(MaterialTypeResponseSchema);

export type MaterialTypeResponsePagedResponse = z.infer<
  typeof MaterialTypeResponsePagedResponseSchema
>;

// ===== CreateMaterialTypeRequest =====

export const CreateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema,
    code: z.string().max(50),
    name: NameSchema,
    description: z.string().nullable().optional(),
  })
  .strict();

export type CreateMaterialTypeRequest = z.infer<
  typeof CreateMaterialTypeRequestSchema
>;

// ===== BulkCreateMaterialTypeRequest =====

export const BulkCreateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema,
    materials: z
      .array(
        z.object({
          code: z.string().max(50),
          name: NameSchema,
          description: z.string().nullable().optional(),
        })
      )
      .min(1),
  })
  .strict();

export type BulkCreateMaterialTypeRequest = z.infer<
  typeof BulkCreateMaterialTypeRequestSchema
>;

// ===== UpdateMaterialTypeRequest =====

export const UpdateMaterialTypeRequestSchema = z
  .object({
    designTypeId: IdSchema.nullable().optional(),
    code: z.string().max(50).nullable().optional(),
    name: NameSchema.nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
  })
  .strict();

export type UpdateMaterialTypeRequest = z.infer<
  typeof UpdateMaterialTypeRequestSchema
>;
