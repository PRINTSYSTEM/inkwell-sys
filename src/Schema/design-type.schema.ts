// src/Schema/design-type.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  CommonStatusSchema,
  DateSchema,
  IdSchema,
  NameSchema,
} from "./common";

// CreateDesignTypeRequest
export const CreateDesignTypeRequestSchema = z
  .object({
    code: z.string().max(20),
    name: NameSchema,
    displayOrder: z.number().int().min(0),
    description: z.string().nullable().optional(),
    status: CommonStatusSchema,
  })
  .strict();

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
  .strict();

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
    createdBy: UserInfoSchema.optional(),
  })
  .strict();

export type DesignTypeResponse = z.infer<typeof DesignTypeResponseSchema>;
