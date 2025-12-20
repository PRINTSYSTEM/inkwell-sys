// src/Schema/proofing-order.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";
import { MaterialTypeResponseSchema } from "./material-type.schema";
import { DesignResponseSchema } from "./design.schema";
import { ProductionResponseSchema } from "./production.schema";

// ===== PaperSizeResponse =====

export const PaperSizeResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  isCustom: z.boolean(),
});

export type PaperSizeResponse = z.infer<typeof PaperSizeResponseSchema>;

// ===== PlateExportResponse =====

export const PlateExportResponseSchema = z.object({
  id: IdSchema,
  vendorName: z.string().nullable().optional(),
  sentAt: DateSchema.nullable().optional(),
  receivedAt: DateSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: DateSchema.optional(),
});

export type PlateExportResponse = z.infer<typeof PlateExportResponseSchema>;

// ===== DieExportResponse =====

export const DieExportResponseSchema = z.object({
  id: IdSchema,
  imageUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: DateSchema.optional(),
});

export type DieExportResponse = z.infer<typeof DieExportResponseSchema>;

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
    proofingFileUrl: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

    // Yêu cầu #14: Thông tin duyệt
    approvedById: IdSchema.nullable().optional(),
    approvedBy: UserInfoSchema.nullable().optional(),
    approvedAt: DateSchema.nullable().optional(),
    finalQuantity: z.number().int().nullable().optional(),

    // Yêu cầu #17: Khổ giấy
    paperSizeId: IdSchema.nullable().optional(),
    paperSize: PaperSizeResponseSchema.nullable().optional(),
    customPaperSize: z.string().nullable().optional(),

    // Yêu cầu #18, #19, #20: Xuất kẽm và khuôn bế
    isPlateExported: z.boolean().optional(),
    isDieExported: z.boolean().optional(),
    plateExport: PlateExportResponseSchema.nullable().optional(),
    dieExport: DieExportResponseSchema.nullable().optional(),

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
    orderDetailItems: z.array(
      z.object({
        orderDetailId: IdSchema,
        quantity: z.number().int().min(1, "Số lượng phải ít nhất là 1"),
      })
    ).min(1, "Cần ít nhất 1 chi tiết đơn hàng"),
    notes: z.string().nullable().optional(),
    totalQuantity: z
      .number()
      .int()
      .min(1, "Cần ít nhất 1 sản phẩm để tạo bình bài"),
    paperSizeId: IdSchema.nullable().optional(),
    customPaperSize: z.string().nullable().optional(),
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

// ===== ApproveProofingOrderRequest =====

export const ApproveProofingOrderRequestSchema = z.object({
  finalQuantity: z.number().int().nullable().optional(),
  approvalNotes: z.string().nullable().optional(),
});

export type ApproveProofingOrderRequest = z.infer<
  typeof ApproveProofingOrderRequestSchema
>;

// ===== RecordPlateExportRequest =====

export const RecordPlateExportRequestSchema = z.object({
  vendorName: z.string().min(1, "Vui lòng nhập đơn vị ghi kẽm"),
  sentAt: DateSchema.nullable().optional(),
  receivedAt: DateSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RecordPlateExportRequest = z.infer<
  typeof RecordPlateExportRequestSchema
>;

// ===== RecordDieExportRequest =====

export const RecordDieExportRequestSchema = z.object({
  imageUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type RecordDieExportRequest = z.infer<
  typeof RecordDieExportRequestSchema
>;
