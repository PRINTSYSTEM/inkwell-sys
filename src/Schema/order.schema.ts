// src/Schema/order.schema.ts
import { z } from "zod";
import { CustomerSummaryResponseSchema } from "./customer.schema";
import {
  CreateDesignRequestSchema,
  DesignResponseSchema,
} from "./design.schema";
import { UserInfoSchema } from "./auth.schema";
import { PagedMetaSchema } from ".";

/** CreateOrderRequest */
export const CreateOrderRequestSchema = z.object({
  customerId: z.number({ required_error: "Khách hàng là bắt buộc" }).int(),
  assignedToUserId: z.number().int().nullable().optional(),
  deliveryAddress: z.string().max(500).nullable().optional(),
  totalAmount: z
    .number({ required_error: "Tổng tiền là bắt buộc" })
    .min(0, { message: "Tổng tiền không được âm" }),
  depositAmount: z
    .number({ required_error: "Tiền cọc là bắt buộc" })
    .min(0, { message: "Tiền cọc không được âm" }),
  deliveryDate: z.string().nullable().optional(), // date-time
  note: z.string().nullable().optional(),
  designRequests: z
    .array(CreateDesignRequestSchema)
    .min(1, { message: "Cần ít nhất 1 yêu cầu thiết kế" })
    .nullable()
    .optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

/** UpdateOrderRequest */
export const UpdateOrderRequestSchema = z.object({
  status: z.string().max(50).nullable().optional(),
  deliveryAddress: z.string().max(500).nullable().optional(),
  totalAmount: z.number().min(0).nullable().optional(),
  depositAmount: z.number().min(0).nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  assignedToUserId: z.number().int().nullable().optional(),
});
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

/** OrderResponse */
export const OrderResponseSchema = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  customerId: z.number().int(),
  customer: CustomerSummaryResponseSchema,
  createdBy: z.number().int(),
  creator: UserInfoSchema,
  assignedTo: z.number().int().nullable(),
  assignedUser: UserInfoSchema,
  status: z.string().nullable(),
  statusType: z.string().nullable(),
  deliveryAddress: z.string().nullable(),
  totalAmount: z.number(),
  depositAmount: z.number(),
  deliveryDate: z.string().nullable(),
  excelFileUrl: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  designs: z.array(DesignResponseSchema).nullable(),
});
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

/** Paged orders */
export const OrderResponsePagedSchema = PagedMetaSchema.extend({
  items: z.array(OrderResponseSchema).nullable(),
});
export type OrderResponsePagedResponse = z.infer<
  typeof OrderResponsePagedSchema
>;

/** Order list params */
export const OrderListParamsSchema = z.object({
  pageNumber: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  customerId: z.number().int().optional(),
  status: z.string().optional(),
});
export type OrderListParams = z.infer<typeof OrderListParamsSchema>;
