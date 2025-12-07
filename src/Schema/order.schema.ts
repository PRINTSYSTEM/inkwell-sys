// src/Schema/order.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./common";
import { UserInfoSchema } from "./common";
import {
  DesignResponseSchema,
  DesignResponseForDesignerSchema,
} from "./design.schema";

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
  .strict();

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// ===== PagedResponse =====

export const OrderResponsePagedResponseSchema =
  createPagedResponseSchema(OrderResponseSchema);

export type OrderResponsePagedResponse = z.infer<
  typeof OrderResponsePagedResponseSchema
>;

// ===== CreateOrderRequest =====

export const CreateOrderRequestSchema = z
  .object({
    customerId: IdSchema,
    deliveryAddress: z.string().nullable().optional(),
    totalAmount: z.number(),
    depositAmount: z.number(),
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
  .strict();

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// ===== UpdateOrderRequest =====

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
  .strict();

export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

// ===== ExistingDesignRequest (dùng cho order existing designs) =====

export const ExistingDesignRequestSchema = z
  .object({
    designId: IdSchema,
    quantity: z.number().int().min(1),
  })
  .strict();

export type ExistingDesignRequest = z.infer<typeof ExistingDesignRequestSchema>;

// ===== CreateOrderWithExistingDesignsRequest =====

export const CreateOrderWithExistingDesignsRequestSchema = z
  .object({
    customerId: IdSchema,
    deliveryAddress: z.string().nullable().optional(),
    totalAmount: z.number(),
    depositAmount: z.number(),
    deliveryDate: DateSchema.nullable().optional(),
    note: z.string().nullable().optional(),

    designs: z.array(ExistingDesignRequestSchema).min(1),
  })
  .strict();

export type CreateOrderWithExistingDesignsRequest = z.infer<
  typeof CreateOrderWithExistingDesignsRequestSchema
>;

// ===== AddDesignToOrderRequest =====

export const AddDesignToOrderRequestSchema = z
  .object({
    designId: IdSchema,
    quantity: z.number().int().min(1),
  })
  .strict();

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
  .strict();

export type OrderResponseForDesigner = z.infer<
  typeof OrderResponseForDesignerSchema
>;

// OrderResponseForDesignerPagedResponse
export const OrderResponseForDesignerPagedResponseSchema =
  createPagedResponseSchema(OrderResponseForDesignerSchema);

export type OrderResponseForDesignerPagedResponse = z.infer<
  typeof OrderResponseForDesignerPagedResponseSchema
>;
