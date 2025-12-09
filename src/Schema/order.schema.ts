// src/Schema/order.schema.ts
// Schema cho "Đơn hàng" (Order)
// Bao gồm: response chi tiết đơn, payload tạo/cập nhật, và các biến thể phục vụ designer
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./common";
import { UserInfoSchema } from "./common";
import {
  DesignResponseSchema,
  DesignResponseForDesignerSchema,
} from "./design.schema";

// ===== CustomerOrderResponse =====
// Thông tin tóm tắt khách hàng gắn với đơn hàng
export const CustomerOrderResponseSchema = z.object({
  id: IdSchema.optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  debtStatus: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  currentDebt: z.number().optional(),
  maxDebt: z.number().optional(),
});

// ===== OrderResponse =====
// Dữ liệu đơn hàng chi tiết

export const OrderResponseSchema = z
  .object({
    id: IdSchema.optional(),
    code: z.string().nullable().optional(),

    customerId: IdSchema.optional(),
    customer: CustomerOrderResponseSchema.optional(),

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

    designs: z.array(DesignResponseSchema).nullable().optional(),
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

// ===== CreateOrderRequest =====
// Payload tạo đơn hàng (bao gồm danh sách thiết kế mới)

export const CreateOrderRequestSchema = z
  .object({
    customerId: IdSchema,
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0, "Tổng tiền không thể âm"),
    depositAmount: z.number().min(0, "Tiền đặt cọc không thể âm"),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    designs: z
      .array(
        z.object({
          designTypeId: IdSchema,
          materialTypeId: IdSchema,
          assignedDesignerId: IdSchema.nullable().optional(),
          quantity: z.number().int().min(1),
          designName: z.string().nullable().optional(),
          width: z.number().nullable().optional(),
          height: z.number().nullable().optional(),
          requirements: z.string().nullable().optional(),
          additionalNotes: z.string().nullable().optional(),
        })
      )
      .nullable()
      .optional(),
  })
  .refine((data) => data.depositAmount <= data.totalAmount, {
    message: "Tiền đặt cọc không được lớn hơn tổng tiền",
  })
  .refine(
    (data) => {
      if (data.deliveryDate) {
        const today = new Date();
        return new Date(data.deliveryDate) >= today;
      }
      return true;
    },
    { message: "Ngày giao hàng phải từ hôm nay trở đi" }
  );

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// ===== UpdateOrderRequest =====
// Payload cập nhật đơn hàng

export const UpdateOrderRequestSchema = z
  .object({
    customerId: IdSchema.nullable().optional(),
    deliveryAddress: z.string().nullable().optional(),
    totalAmount: z.number().nullable().optional(),
    depositAmount: z.number().nullable().optional(),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
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
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0, "Tổng tiền không thể âm"),
    depositAmount: z.number().min(0, "Tiền đặt cọc không thể âm"),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    designs: z.array(ExistingDesignRequestSchema).min(1),
  })
  .refine((data) => data.depositAmount <= data.totalAmount, {
    message: "Tiền đặt cọc không được lớn hơn tổng tiền",
  });

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

    designs: z.array(DesignResponseForDesignerSchema).nullable().optional(),
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
