// src/Schema/order.schema.ts
// Schema cho "Đơn hàng" (Order)
// Bao gồm: response chi tiết đơn, payload tạo/cập nhật, và các biến thể phục vụ designer
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import { UserInfoSchema } from "./Common";
import {
  DesignResponseSchema,
  DesignResponseForDesignerSchema,
} from "./design.schema";
import { CustomerSummaryResponseSchema } from "./customer.schema";

// ===== OrderDetailResponse =====
// Chi tiết từng thiết kế trong đơn hàng

export const OrderDetailResponseSchema = z
  .object({
    id: IdSchema.optional(),
    orderId: IdSchema.optional(),
    designId: IdSchema.optional(),
    design: DesignResponseSchema.nullable().optional(),
    quantity: z.number().int().optional(),
    unitPrice: z.number().nullable().optional(),
    totalPrice: z.number().nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
    derivedStatus: z.string().nullable().optional(),
    cutOverAt: DateSchema.nullable().optional(),
    itemStatus: z.string().nullable().optional(),
    isCutOver: z.boolean().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
  })
  .passthrough();

export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;

// ===== OrderDetailResponseForDesigner =====

export const OrderDetailResponseForDesignerSchema = z
  .object({
    id: IdSchema.optional(),
    orderId: IdSchema.optional(),
    designId: IdSchema.optional(),
    derivedStatus: z.string().nullable().optional(),
    cutOverAt: DateSchema.nullable().optional(),
    itemStatus: z.string().nullable().optional(),
    isCutOver: z.boolean().optional(),
    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),
    quantity: z.number().int().optional(),
    unitPrice: z.number().nullable().optional(),
    totalPrice: z.number().nullable().optional(),
    requirements: z.string().nullable().optional(),
    additionalNotes: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    design: DesignResponseSchema.nullable().optional(),
  })
  .passthrough();

export type OrderDetailResponseForDesigner = z.infer<
  typeof OrderDetailResponseForDesignerSchema
>;

// ===== OrderResponse =====
// Dữ liệu đơn hàng chi tiết

export const OrderResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),

    customerId: IdSchema.optional(),
    customer: CustomerSummaryResponseSchema.optional(),

    createdBy: IdSchema.optional(),
    creator: UserInfoSchema.optional(),

    assignedTo: IdSchema.nullable().optional(),
    assignedUser: UserInfoSchema.optional(),

    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),

    deliveryAddress: z.string().nullable().optional(),
    totalAmount: z.number().optional(),
    depositAmount: z.number().optional(),

    deliveryDate: DateSchema.nullable().optional(),

    excelFileUrl: z.string().nullable().optional(),
    note: z.string().nullable().optional(),

    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),

    orderDetails: z.array(OrderDetailResponseSchema).nullable().optional(),
  })
  .passthrough();

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// ===== PagedResponse =====
// Dữ liệu danh sách đơn hàng có phân trang

export const OrderResponsePagedResponseSchema =
  createPagedResponseSchema(OrderResponseSchema);

export type OrderResponsePagedResponse = z.infer<
  typeof OrderResponsePagedResponseSchema
>;

// ===== CreateDesignRequest (embedded in CreateOrderRequest) =====
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
  requirements: z.string().nullable().optional(),
  additionalNotes: z.string().nullable().optional(),

  // Required for both
  quantity: z.number().int().min(1),
});

export type CreateDesignRequestEmbedded = z.infer<
  typeof CreateDesignRequestEmbeddedSchema
>;

// ===== CreateOrderRequest =====
// Payload tạo đơn hàng (bao gồm danh sách thiết kế mới)

export const CreateOrderRequestSchema = z
  .object({
    customerId: IdSchema,
    assignedToUserId: IdSchema.nullable().optional(),
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    designRequests: z
      .array(CreateDesignRequestEmbeddedSchema)
      .nullable()
      .optional(),
  })
  .passthrough();

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// ===== UpdateOrderRequest =====
// Payload cập nhật đơn hàng

export const UpdateOrderRequestSchema = z
  .object({
    status: z.string().max(50).nullable().optional(),
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0).nullable().optional(),
    depositAmount: z.number().min(0).nullable().optional(),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    assignedToUserId: IdSchema.nullable().optional(),
  })
  .passthrough();

export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

// ===== ExistingDesignRequest =====
// Dùng khi tạo đơn hàng từ danh sách thiết kế có sẵn

export const ExistingDesignRequestSchema = z
  .object({
    designId: IdSchema,
    quantity: z.number().int().min(1),
  })
  .passthrough();

export type ExistingDesignRequest = z.infer<typeof ExistingDesignRequestSchema>;

// ===== CreateOrderWithExistingDesignsRequest =====
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
// Thêm một thiết kế vào đơn hàng hiện có

export const AddDesignToOrderRequestSchema = z
  .object({
    designId: IdSchema,
    quantity: z.number().int().min(1),
  })
  .passthrough();

export type AddDesignToOrderRequest = z.infer<
  typeof AddDesignToOrderRequestSchema
>;

export const OrderResponseForDesignerSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),

    customerId: IdSchema.optional(),
    customerName: z.string().nullable().optional(),
    customerCompanyName: z.string().nullable().optional(),

    status: z.string().nullable().optional(),
    statusType: z.string().nullable().optional(),

    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),

    orderDetails: z
      .array(OrderDetailResponseForDesignerSchema)
      .nullable()
      .optional(),
  })
  .passthrough();

export type OrderResponseForDesigner = z.infer<
  typeof OrderResponseForDesignerSchema
>;

// ===== OrderResponseForDesignerPagedResponse =====
// Dữ liệu danh sách đơn hàng dành cho designer (phân trang)
export const OrderResponseForDesignerPagedResponseSchema =
  createPagedResponseSchema(OrderResponseForDesignerSchema);

export type OrderResponseForDesignerPagedResponse = z.infer<
  typeof OrderResponseForDesignerPagedResponseSchema
>;
