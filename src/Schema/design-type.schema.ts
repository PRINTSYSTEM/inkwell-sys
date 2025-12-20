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
// Updated to match swagger.json: code, name, status required
export const CreateDesignTypeRequestSchema = z
  .object({
    code: z.string().min(0).max(20), // Required in swagger
    name: z.string().min(0).max(255), // Required in swagger
    displayOrder: z.number().int().min(0).max(2147483647).optional(),
    description: z.string().nullable().optional(),
    status: z.string().regex(/^(active|inactive)$/), // Required in swagger, pattern from swagger
  })
  .passthrough();

export type CreateDesignTypeRequest = z.infer<
  typeof CreateDesignTypeRequestSchema
>;

// UpdateDesignTypeRequest
// Updated to match swagger.json: all fields optional, nullable
export const UpdateDesignTypeRequestSchema = z
  .object({
    name: z.string().min(0).max(255).nullable().optional(), // Updated to match swagger
    displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(), // Updated max from swagger
    description: z.string().nullable().optional(),
    status: z
      .string()
      .regex(/^(active|inactive)$/)
      .nullable()
      .optional(), // Updated to match swagger pattern
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
