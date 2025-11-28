// src/Schema/proofing-order.schema.ts
import { z } from "zod";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema"; // defined below
import { UserInfoSchema } from "./auth.schema";
import { PagedMetaSchema } from ".";

/** CreateProofingOrderRequest */
export const CreateProofingOrderRequestSchema = z.object({
  materialTypeId: z
    .number({ required_error: "Loại vật liệu là bắt buộc" })
    .int(),
  designIds: z
    .array(z.number().int())
    .min(1, { message: "Cần chọn ít nhất 1 thiết kế" }),
  notes: z.string().nullable().optional(),
});
export type CreateProofingOrderRequest = z.infer<
  typeof CreateProofingOrderRequestSchema
>;

/** CreateProofingOrderFromDesignsRequest */
export const CreateProofingOrderFromDesignsRequestSchema = z.object({
  designIds: z
    .array(z.number().int())
    .min(1, { message: "Cần chọn ít nhất 1 thiết kế" }),
  notes: z.string().nullable().optional(),
});
export type CreateProofingOrderFromDesignsRequest = z.infer<
  typeof CreateProofingOrderFromDesignsRequestSchema
>;

/** UpdateProofingOrderRequest */
export const UpdateProofingOrderRequestSchema = z.object({
  status: z.string().max(50).nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type UpdateProofingOrderRequest = z.infer<
  typeof UpdateProofingOrderRequestSchema
>;

/** ProofingOrderDesignResponse */
export const ProofingOrderDesignResponseSchema = z.object({
  id: z.number().int(),
  proofingOrderId: z.number().int(),
  designId: z.number().int(),
  design: DesignResponseSchema,
  quantity: z.number().int(),
  createdAt: z.string(),
});
export type ProofingOrderDesignResponse = z.infer<
  typeof ProofingOrderDesignResponseSchema
>;

/** ProofingOrderResponse */
export const ProofingOrderResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  materialTypeId: z.number().int(),
  materialType: MaterialTypeResponseSchema,
  createdById: z.number().int(),
  createdBy: UserInfoSchema,
  totalQuantity: z.number().int(),
  status: z.string().nullable(),
  statusType: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  proofingOrderDesigns: z.array(ProofingOrderDesignResponseSchema).nullable(),
  productions: z.array(ProductionResponseSchema).nullable(),
});
export type ProofingOrderResponse = z.infer<typeof ProofingOrderResponseSchema>;

/** Paged proofing orders */
export const ProofingOrderResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(ProofingOrderResponseSchema).nullable(),
});
export type ProofingOrderResponsePagedResponse = z.infer<
  typeof ProofingOrderResponsePagedSchema
>;

/** List params */
export const ProofingOrderListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  materialTypeId: z.number().int().optional(),
  status: z.string().optional(),
});
export type ProofingOrderListParams = z.infer<
  typeof ProofingOrderListParamsSchema
>;

/** Available-designs params */
export const AvailableDesignsForProofingParamsSchema = z.object({
  materialTypeId: z.number().int().optional(),
});
export type AvailableDesignsForProofingParams = z.infer<
  typeof AvailableDesignsForProofingParamsSchema
>;
