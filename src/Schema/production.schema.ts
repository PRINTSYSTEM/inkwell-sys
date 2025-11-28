// src/Schema/production.schema.ts
import { z } from "zod";
import { UserInfoSchema } from "./auth.schema";
import { PagedMetaSchema } from ".";

/** CreateProductionRequest */
export const CreateProductionRequestSchema = z.object({
  proofingOrderId: z
    .number({ required_error: "ProofingOrder là bắt buộc" })
    .int(),
  productionLeadId: z
    .number({ required_error: "Người phụ trách sản xuất là bắt buộc" })
    .int(),
  notes: z.string().nullable().optional(),
});
export type CreateProductionRequest = z.infer<
  typeof CreateProductionRequestSchema
>;

/** StartProductionRequest */
export const StartProductionRequestSchema = z.object({
  notes: z.string().nullable().optional(),
});
export type StartProductionRequest = z.infer<
  typeof StartProductionRequestSchema
>;

/** CompleteProductionRequest */
export const CompleteProductionRequestSchema = z.object({
  progressPercent: z
    .number()
    .int()
    .min(0, { message: "Tiến độ tối thiểu là 0%" })
    .max(100, { message: "Tiến độ tối đa là 100%" })
    .optional(),
  defectNotes: z.string().nullable().optional(),
  wastage: z.number().min(0).optional(),
});
export type CompleteProductionRequest = z.infer<
  typeof CompleteProductionRequestSchema
>;

/** UpdateProductionRequest */
export const UpdateProductionRequestSchema = z.object({
  status: z.string().max(50).nullable().optional(),
  progressPercent: z.number().int().min(0).max(100).nullable().optional(),
  defectNotes: z.string().nullable().optional(),
  wastage: z.number().min(0).nullable().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});
export type UpdateProductionRequest = z.infer<
  typeof UpdateProductionRequestSchema
>;

/** ProductionResponse */
export const ProductionResponseSchema = z.object({
  id: z.number().int(),
  proofingOrderId: z.number().int(),
  productionLeadId: z.number().int(),
  productionLead: UserInfoSchema,
  status: z.string().nullable(),
  statusType: z.string().nullable(),
  progressPercent: z.number().int(),
  defectNotes: z.string().nullable(),
  wastage: z.number(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductionResponse = z.infer<typeof ProductionResponseSchema>;

/** Paged **/
export const ProductionResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(ProductionResponseSchema).nullable(),
});
export type ProductionResponsePagedResponse = z.infer<
  typeof ProductionResponsePagedSchema
>;

/** List params */
export const ProductionListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  proofingOrderId: z.number().int().optional(),
  productionLeadId: z.number().int().optional(),
  status: z.string().optional(),
});
export type ProductionListParams = z.infer<typeof ProductionListParamsSchema>;
