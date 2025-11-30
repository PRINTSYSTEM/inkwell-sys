// src/Schema/proofing-order.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  createPagedResponseSchema,
  DateSchema,
  IdSchema,
} from "./common";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema";

// CreateProofingOrderRequest
export const CreateProofingOrderRequestSchema = z
  .object({
    materialTypeId: IdSchema,
    designIds: z.array(IdSchema),
    notes: z.string().nullable().optional(),
  })
  .strict();

export type CreateProofingOrderRequest = z.infer<
  typeof CreateProofingOrderRequestSchema
>;

// CreateProofingOrderFromDesignsRequest
export const CreateProofingOrderFromDesignsRequestSchema = z
  .object({
    designIds: z.array(IdSchema),
    notes: z.string().nullable().optional(),
  })
  .strict();

export type CreateProofingOrderFromDesignsRequest = z.infer<
  typeof CreateProofingOrderFromDesignsRequestSchema
>;

// UpdateProofingOrderRequest
export const UpdateProofingOrderRequestSchema = z
  .object({
    status: z.string().max(50).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export type UpdateProofingOrderRequest = z.infer<
  typeof UpdateProofingOrderRequestSchema
>;

// ProofingOrderDesignResponse
export const ProofingOrderDesignResponseSchema = z
  .object({
    id: IdSchema.optional(),
    proofingOrderId: IdSchema.optional(),
    designId: IdSchema.optional(),
    design: DesignResponseSchema.optional(),
    quantity: z.number().int().optional(),
    createdAt: DateSchema.optional(),
  })
  .strict();

export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

// ProofingOrderResponse
export const ProofingOrderResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),
    materialTypeId: IdSchema.optional(),
    materialType: MaterialTypeResponseSchema.optional(),
    createdById: IdSchema.optional(),
    createdBy: UserInfoSchema.optional(),
    totalQuantity: z.number().int().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    proofingOrderDesigns: z
      .array(ProofingOrderDesignResponseSchema)
      .nullable()
      .optional(),
    productions: z.array(ProductionResponseSchema).nullable().optional(),
  })
  .strict();

export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

// ProofingOrderResponsePagedResponse
export const ProofingOrderResponsePagedResponseSchema =
  createPagedResponseSchema(ProofingOrderResponseSchema);

export type ProofingOrderResponsePagedResponse = z.infer<
  typeof ProofingOrderResponsePagedResponseSchema
>;
