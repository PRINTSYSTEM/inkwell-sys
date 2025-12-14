// src/Schema/proofing-order.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema";

// ===== ProofingOrderDesignResponse =====

export const ProofingOrderDesignResponseSchema = z
  .object({
    id: IdSchema.optional(),
    proofingOrderId: IdSchema.optional(),
    designId: IdSchema.optional(),
    design: DesignResponseSchema.nullable().optional(),
    quantity: z.number().int().optional(),
    createdAt: DateSchema.optional(),
  })
  .passthrough();

export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

// ===== ProofingOrderResponse =====

export const ProofingOrderResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),

    materialTypeId: IdSchema.optional(),
    materialType: MaterialTypeResponseSchema.nullable().optional(),

    createdById: IdSchema.optional(),
    createdBy: UserInfoSchema.nullable().optional(),

    assignedToId: IdSchema.nullable().optional(),
    assignedTo: UserInfoSchema.nullable().optional(),

    totalQuantity: z.number().int().optional(),

    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),

    proofingFileUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),

    proofingOrderDesigns: z
      .array(ProofingOrderDesignResponseSchema)
      .nullable()
      .optional(),

    productions: z.array(ProductionResponseSchema).nullable().optional(),
  })
  .passthrough();

export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

// ===== PagedResponse =====

export const ProofingOrderResponsePagedResponseSchema =
  createPagedResponseSchema(ProofingOrderResponseSchema);

export type ProofingOrderResponsePagedResponse = z.infer<
  typeof ProofingOrderResponsePagedResponseSchema
>;

// ===== CreateProofingOrderRequest =====

export const CreateProofingOrderRequestSchema = z
  .object({
    materialTypeId: IdSchema,
    designIds: z.array(IdSchema).min(1, "Cần ít nhất 1 thiết kế"),
    assignedToId: IdSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateProofingOrderRequest = z.infer<
  typeof CreateProofingOrderRequestSchema
>;

// ===== CreateProofingOrderFromDesignsRequest =====

export const CreateProofingOrderFromDesignsRequestSchema = z
  .object({
    orderDetailIds: z.array(IdSchema).min(1, "Cần ít nhất 1 chi tiết đơn hàng"),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type CreateProofingOrderFromDesignsRequest = z.infer<
  typeof CreateProofingOrderFromDesignsRequestSchema
>;

// ===== UpdateProofingOrderRequest =====

export const UpdateProofingOrderRequestSchema = z
  .object({
    assignedToId: IdSchema.nullable().optional(),
    status: z.string().max(50).nullable().optional(),
    proofingFileUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type UpdateProofingOrderRequest = z.infer<
  typeof UpdateProofingOrderRequestSchema
>;
