// src/Schema/order.schema.ts
// Schema cho "Đơn hàng" (Order)
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";
import {
  DesignResponseSchema,
  DesignResponseForDesignerSchema,
} from "./design.schema";
import { CustomerSummaryResponseSchema } from "./customer.schema";
import {
  OrderResponseSchema as GenOrderResponseSchema,
  OrderResponsePaginateSchema as GenOrderResponsePaginateSchema,
  OrderDetailResponseSchema as GenOrderDetailResponseSchema,
  OrderDetailResponsePaginateSchema as GenOrderDetailResponsePaginateSchema,
  OrderDetailResponseForDesignerSchema as GenOrderDetailResponseForDesignerSchema,
  OrderResponseForDesignerSchema as GenOrderResponseForDesignerSchema,
  OrderResponseForDesignerPaginateSchema as GenOrderResponseForDesignerPaginateSchema,
  CreateOrderRequestSchema as GenCreateOrderRequestSchema,
  UpdateOrderRequestSchema as GenUpdateOrderRequestSchema,
  UpdateOrderForAccountingRequestSchema as GenUpdateOrderForAccountingRequestSchema,
  UpdateOrderDetailForAccountingRequestSchema as GenUpdateOrderDetailForAccountingRequestSchema,
  AddDesignToOrderRequestSchema as GenAddDesignToOrderRequestSchema,
  OrderDetailExportResponseSchema as GenOrderDetailExportResponseSchema,
  OrderExportResponseSchema as GenOrderExportResponseSchema,
  ProofingAllocationResponseSchema as GenProofingAllocationResponseSchema,
  PaymentSummaryResponseSchema as GenPaymentSummaryResponseSchema,
  CreateDesignRequestSchema as GenCreateDesignRequestSchema,
} from "./generated";

// ===== OrderDetailResponse =====
// Wrapper to ensure compatibility with our DesignResponseSchema
export const OrderDetailResponseSchema =
  GenOrderDetailResponseSchema.passthrough();
export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;

// Re-export generated paginate schema for compatibility
export {
  GenOrderDetailResponsePaginateSchema as OrderDetailResponsePaginateSchema,
};
export type OrderDetailResponsePaginate = z.infer<
  typeof GenOrderDetailResponsePaginateSchema
>;

// ===== OrderDetailResponseForDesigner =====
export const OrderDetailResponseForDesignerSchema =
  GenOrderDetailResponseForDesignerSchema.passthrough();
export type OrderDetailResponseForDesigner = z.infer<
  typeof OrderDetailResponseForDesignerSchema
>;

// ===== OrderResponse =====
// Wrapper to ensure compatibility with our CustomerSummaryResponseSchema
export const OrderResponseSchema = GenOrderResponseSchema.passthrough();
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// ===== PagedResponse =====
// Keep our utility-based paged responses for consistency
export const OrderResponsePagedResponseSchema =
  createPagedResponseSchema(OrderResponseSchema);
export type OrderResponsePagedResponse = z.infer<
  typeof OrderResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenOrderResponsePaginateSchema as OrderResponsePaginateSchema };
export type OrderResponsePaginate = z.infer<
  typeof GenOrderResponsePaginateSchema
>;

// ===== CreateDesignRequest (embedded in CreateOrderRequest) =====
// Custom schema - not in generated (CreateDesignRequest in generated is different)
// Có thể là design MỚI hoặc design CŨ (existing)
// - Design MỚI: designTypeId, materialTypeId, quantity, width, height (KHÔNG có designId)
// - Design CŨ: designId, quantity (KHÔNG cần designTypeId, materialTypeId)
export const CreateDesignRequestEmbeddedSchema = z.object({
  // For existing design
  designId: IdSchema.nullable().optional(),

  // For new design
  designTypeId: IdSchema.nullable().optional(),
  materialTypeId: IdSchema.nullable().optional(),
  assignedDesignerId: IdSchema.nullable().optional(),
  designName: z.string().max(255).nullable().optional(),
  length: z.number().min(0).nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  depth: z.number().min(0).nullable().optional(),
  sidesClassificationOptionId: IdSchema.nullable().optional(),
  processClassificationOptionId: IdSchema.nullable().optional(),
  laminationType: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  additionalNotes: z.string().nullable().optional(),

  // Required for both
  quantity: z.number().int().min(1).max(2147483647),
});

export type CreateDesignRequestEmbedded = z.infer<
  typeof CreateDesignRequestEmbeddedSchema
>;

// ===== CreateOrderRequest =====
// Use generated schema but extend with our custom designRequests
export const CreateOrderRequestSchema =
  GenCreateOrderRequestSchema.passthrough();
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// ===== UpdateOrderRequest =====
export const UpdateOrderRequestSchema =
  GenUpdateOrderRequestSchema.passthrough();
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

// ===== ExistingDesignRequest =====
// Custom schema - not in generated
// Dùng khi tạo đơn hàng từ danh sách thiết kế có sẵn
export const ExistingDesignRequestSchema = z
  .object({
    designId: IdSchema,
    quantity: z.number().int().min(1),
  })
  .passthrough();

export type ExistingDesignRequest = z.infer<typeof ExistingDesignRequestSchema>;

// ===== CreateOrderWithExistingDesignsRequest =====
// Custom schema - not in generated
// Payload tạo đơn hàng từ các thiết kế có sẵn
export const CreateOrderWithExistingDesignsRequestSchema = z
  .object({
    customerId: IdSchema,
    assignedToUserId: IdSchema.nullable().optional(),
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    newDesigns: z
      .array(CreateDesignRequestEmbeddedSchema)
      .nullable()
      .optional(),
    existingDesigns: z.array(ExistingDesignRequestSchema).nullable().optional(),
  })
  .passthrough();

export type CreateOrderWithExistingDesignsRequest = z.infer<
  typeof CreateOrderWithExistingDesignsRequestSchema
>;

// ===== AddDesignToOrderRequest =====
export const AddDesignToOrderRequestSchema =
  GenAddDesignToOrderRequestSchema.passthrough();
export type AddDesignToOrderRequest = z.infer<
  typeof AddDesignToOrderRequestSchema
>;

// ===== OrderResponseForDesigner =====
export const OrderResponseForDesignerSchema =
  GenOrderResponseForDesignerSchema.passthrough();
export type OrderResponseForDesigner = z.infer<
  typeof OrderResponseForDesignerSchema
>;

// ===== OrderResponseForDesignerPagedResponse =====
export const OrderResponseForDesignerPagedResponseSchema =
  createPagedResponseSchema(OrderResponseForDesignerSchema);
export type OrderResponseForDesignerPagedResponse = z.infer<
  typeof OrderResponseForDesignerPagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenOrderResponseForDesignerPaginateSchema as OrderResponseForDesignerPaginateSchema };
export type OrderResponseForDesignerPaginate = z.infer<
  typeof GenOrderResponseForDesignerPaginateSchema
>;

// ===== UpdateOrderDetailForAccountingRequest =====
export const UpdateOrderDetailForAccountingRequestSchema =
  GenUpdateOrderDetailForAccountingRequestSchema.passthrough();
export type UpdateOrderDetailForAccountingRequest = z.infer<
  typeof UpdateOrderDetailForAccountingRequestSchema
>;

// ===== UpdateOrderForAccountingRequest =====
export const UpdateOrderForAccountingRequestSchema =
  GenUpdateOrderForAccountingRequestSchema.passthrough();
export type UpdateOrderForAccountingRequest = z.infer<
  typeof UpdateOrderForAccountingRequestSchema
>;

// ===== Export Responses =====
export {
  GenOrderDetailExportResponseSchema as OrderDetailExportResponseSchema,
  GenOrderExportResponseSchema as OrderExportResponseSchema,
  GenProofingAllocationResponseSchema as ProofingAllocationResponseSchema,
  GenPaymentSummaryResponseSchema as PaymentSummaryResponseSchema,
};
export type OrderDetailExportResponse = z.infer<
  typeof GenOrderDetailExportResponseSchema
>;
export type OrderExportResponse = z.infer<typeof GenOrderExportResponseSchema>;
export type ProofingAllocationResponse = z.infer<
  typeof GenProofingAllocationResponseSchema
>;
export type PaymentSummaryResponse = z.infer<
  typeof GenPaymentSummaryResponseSchema
>;
