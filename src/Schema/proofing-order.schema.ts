// src/Schema/proofing-order.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema";
import { PaperSizeResponseSchema } from "./paper-size.schema";
import { PlateExportResponseSchema } from "./plate-export.schema";
import { DieExportResponseSchema } from "./die-export.schema";

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
    imageUrl: z.string().nullable().optional(), // Added from swagger
    notes: z.string().nullable().optional(),

    approvedById: IdSchema.nullable().optional(), // Added from swagger
    approvedBy: UserInfoSchema.nullable().optional(), // Added from swagger
    approvedAt: DateSchema.nullable().optional(), // Added from swagger
    finalQuantity: z.number().int().nullable().optional(), // Added from swagger

    paperSizeId: IdSchema.nullable().optional(), // Added from swagger
    paperSize: PaperSizeResponseSchema.nullable().optional(), // Added from swagger
    customPaperSize: z.string().nullable().optional(), // Added from swagger

    isPlateExported: z.boolean().optional(), // Added from swagger
    isDieExported: z.boolean().optional(), // Added from swagger
    plateExport: PlateExportResponseSchema.nullable().optional(), // Added from swagger
    dieExport: DieExportResponseSchema.nullable().optional(), // Added from swagger

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
    paperSizeId: IdSchema.nullable().optional(), // Added from swagger
    customPaperSize: z.string().nullable().optional(), // Added from swagger
  })
  .passthrough();

export type CreateProofingOrderRequest = z.infer<
  typeof CreateProofingOrderRequestSchema
>;

// ===== CreateProofingOrderFromDesignsRequest =====

// ===== CreateProofingOrderDetailItem =====

export const CreateProofingOrderDetailItemSchema = z
  .object({
    orderDetailId: IdSchema,
    quantity: z.number().int(),
  })
  .passthrough();

export type CreateProofingOrderDetailItem = z.infer<
  typeof CreateProofingOrderDetailItemSchema
>;

export const CreateProofingOrderFromDesignsRequestSchema = z
  .object({
    orderDetailItems: z
      .array(CreateProofingOrderDetailItemSchema)
      .min(1, "Cần ít nhất 1 chi tiết đơn hàng"),
    totalQuantity: z
      .number()
      .int()
      .min(1)
      .max(2147483647, "Số lượng không được vượt quá 2147483647"),
    notes: z.string().nullable().optional(),
    paperSizeId: IdSchema.nullable().optional(), // Added from swagger
    customPaperSize: z.string().nullable().optional(), // Added from swagger
  })
  .passthrough();

export type CreateProofingOrderFromDesignsRequest = z.infer<
  typeof CreateProofingOrderFromDesignsRequestSchema
>;

// ===== UpdateProofingOrderRequest =====

export const UpdateProofingOrderRequestSchema = z
  .object({
    status: z.string().max(50).nullable().optional(),
    proofingFileUrl: z.string().nullable().optional(),
    assignedToId: IdSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
    paperSizeId: IdSchema.nullable().optional(), // Added from swagger
    customPaperSize: z.string().nullable().optional(), // Added from swagger
  })
  .passthrough();

// ===== ApproveProofingOrderRequest =====

export const ApproveProofingOrderRequestSchema = z
  .object({
    finalQuantity: z.number().int().nullable().optional(),
    approvalNotes: z.string().nullable().optional(),
  })
  .passthrough();

export type ApproveProofingOrderRequest = z.infer<
  typeof ApproveProofingOrderRequestSchema
>;

// ===== UpdateProofingOrderRequest =====

export type UpdateProofingOrderRequest = z.infer<
  typeof UpdateProofingOrderRequestSchema
>;

// ===== AvailableQuantityResponse =====
// Response from /api/proofing-orders/available-quantity/{designId}
// Swagger shows empty schema, but based on endpoint name, it likely returns a number (available quantity)
// Using z.unknown() to be flexible, but can be cast to number when used

export const AvailableQuantityResponseSchema = z.unknown();
export type AvailableQuantityResponse = z.infer<
  typeof AvailableQuantityResponseSchema
>;
