// src/Schema/order.schema.ts
import { z } from "zod";
import {
  UserInfoSchema,
  createPagedResponseSchema,
  DateSchema,
  IdSchema,
} from "./common";
import { CustomerSummaryResponseSchema } from "./customer.schema";
import {
  DesignResponseSchema,
  CreateDesignRequestSchema,
} from "./design.schema";

// CreateOrderRequest
export const CreateOrderRequestSchema = z
  .object({
    customerId: IdSchema,
    assignedToUserId: IdSchema.nullable().optional(),
    deliveryAddress: z.string().max(500).nullable().optional(),
    totalAmount: z.number().min(0),
    depositAmount: z.number().min(0),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    designRequests: z.array(CreateDesignRequestSchema).nullable().optional(),
  })
  .strict();

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// UpdateOrderRequest
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
  .strict();

export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

// OrderResponse
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
    totalAmount: z.number(),
    depositAmount: z.number(),
    deliveryDate: DateSchema.nullable().optional(),
    excelFileUrl: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
    updatedAt: DateSchema.optional(),
    designs: z.array(DesignResponseSchema).nullable().optional(),
  })
  .strict();

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// OrderResponsePagedResponse
export const OrderResponsePagedResponseSchema =
  createPagedResponseSchema(OrderResponseSchema);

export type OrderResponsePagedResponse = z.infer<
  typeof OrderResponsePagedResponseSchema
>;
