// src/Schema/production.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./common";
import { UserInfoSchema } from "./common";

// ===== ProductionResponse =====

export const ProductionResponseSchema = z
  .object({
    id: IdSchema.optional(),
    proofingOrderId: IdSchema.optional(),
    productionLeadId: IdSchema.optional(),
    productionLead: UserInfoSchema.nullable().optional(),

    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),

    progressPercent: z.number().int().optional(),
    defectNotes: z.string().nullable().optional(),
    wastage: z.number().optional(),

    startedAt: DateSchema.nullable().optional(),
    completedAt: DateSchema.nullable().optional(),

    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .passthrough();

export type ProductionResponse = z.infer<typeof ProductionResponseSchema>;

// ===== PagedResponse =====

export const ProductionResponsePagedResponseSchema = createPagedResponseSchema(
  ProductionResponseSchema
);

export type ProductionResponsePagedResponse = z.infer<
  typeof ProductionResponsePagedResponseSchema
>;

// ===== CreateProductionRequest =====

export const CreateProductionRequestSchema = z
  .object({
    proofingOrderId: IdSchema,
    productionLeadId: IdSchema,
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateProductionRequest = z.infer<
  typeof CreateProductionRequestSchema
>;

// ===== UpdateProductionRequest =====

export const UpdateProductionRequestSchema = z
  .object({
    status: z.string().min(0).max(50).nullable().optional(), // Updated to match swagger
    progressPercent: z.number().int().min(0).max(100).nullable().optional(),
    defectNotes: z.string().nullable().optional(),
    wastage: z.number().min(0).nullable().optional(), // float in swagger, but number is fine
    startedAt: DateSchema.nullable().optional(),
    completedAt: DateSchema.nullable().optional(),
  })
  .passthrough();

export type UpdateProductionRequest = z.infer<
  typeof UpdateProductionRequestSchema
>;

// ===== StartProductionRequest =====

export const StartProductionRequestSchema = z
  .object({
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type StartProductionRequest = z.infer<
  typeof StartProductionRequestSchema
>;

// ===== CompleteProductionRequest =====

export const CompleteProductionRequestSchema = z
  .object({
    progressPercent: z.number().int().min(0).max(100).optional(),
    defectNotes: z.string().nullable().optional(),
    wastage: z.number().min(0).optional(),
  })
  .passthrough();

export type CompleteProductionRequest = z.infer<
  typeof CompleteProductionRequestSchema
>;
