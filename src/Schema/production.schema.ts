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
    productionLead: UserInfoSchema.optional(),

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
  .strict();

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
  .strict();

export type CreateProductionRequest = z.infer<
  typeof CreateProductionRequestSchema
>;

// ===== UpdateProductionRequest =====

export const UpdateProductionRequestSchema = z
  .object({
    status: z.string().max(50).nullable().optional(),
    progressPercent: z.number().int().nullable().optional(),
    defectNotes: z.string().nullable().optional(),
    wastage: z.number().nullable().optional(),
  })
  .strict();

export type UpdateProductionRequest = z.infer<
  typeof UpdateProductionRequestSchema
>;

// ===== StartProductionRequest =====

export const StartProductionRequestSchema = z
  .object({
    notes: z.string().nullable().optional(),
  })
  .strict();

export type StartProductionRequest = z.infer<
  typeof StartProductionRequestSchema
>;

// ===== CompleteProductionRequest =====

export const CompleteProductionRequestSchema = z
  .object({
    notes: z.string().nullable().optional(),
    defectNotes: z.string().nullable().optional(),
    wastage: z.number().nullable().optional(),
  })
  .strict();

export type CompleteProductionRequest = z.infer<
  typeof CompleteProductionRequestSchema
>;
