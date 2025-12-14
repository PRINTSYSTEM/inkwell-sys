// src/Schema/params.schema.ts
import { z } from "zod";
import { IdSchema } from "./Common";

// ==== Base paged params ====

export const PagedParamsSchema = z
  .object({
    pageNumber: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).optional(),
  })
  .passthrough();

export type PagedParams = z.infer<typeof PagedParamsSchema>;

// ==== Customer list params (/api/customers) ====

export const CustomerListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  debtStatus: z.string().nullable().optional(),
});

export type CustomerListParams = z.infer<typeof CustomerListParamsSchema>;

// ==== Design list params (/api/designs) ====

export const DesignListParamsSchema = PagedParamsSchema.extend({
  customerId: IdSchema.nullable().optional(),
  designerId: IdSchema.nullable().optional(),
  status: z.string().nullable().optional(),
});

export type DesignListParams = z.infer<typeof DesignListParamsSchema>;

export const MyDesignListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
});

export type MyDesignListParams = z.infer<typeof MyDesignListParamsSchema>;

// ==== Order list params (/api/orders) ====

export const OrderListParamsSchema = PagedParamsSchema.extend({
  customerId: IdSchema.nullable().optional(),
  status: z.string().nullable().optional(),
});

export type OrderListParams = z.infer<typeof OrderListParamsSchema>;

// ==== Orders for designer (/api/orders/for-designer) ====

export const OrdersForDesignerListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
});

export type OrdersForDesignerListParams = z.infer<
  typeof OrdersForDesignerListParamsSchema
>;

// ==== Orders for accounting (/api/orders/for-accounting) ====

export const OrdersForAccountingListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
});

export type OrdersForAccountingListParams = z.infer<
  typeof OrdersForAccountingListParamsSchema
>;

// ==== ProofingOrder list (/api/proofing-orders) ====

export const ProofingOrderListParamsSchema = PagedParamsSchema.extend({
  materialTypeId: IdSchema.nullable().optional(),
  status: z.string().nullable().optional(),
});

export type ProofingOrderListParams = z.infer<
  typeof ProofingOrderListParamsSchema
>;

// ==== ProofingOrder available designs (/available-designs) ====

export const ProofingOrderAvailableDesignsParamsSchema = z
  .object({
    materialTypeId: IdSchema.optional(),
  })
  .passthrough();

export type ProofingOrderAvailableDesignsParams = z.infer<
  typeof ProofingOrderAvailableDesignsParamsSchema
>;

// ==== ProofingOrder for-production (/for-production) ====

export const ProofingOrderForProductionListParamsSchema = PagedParamsSchema;

export type ProofingOrderForProductionListParams = z.infer<
  typeof ProofingOrderForProductionListParamsSchema
>;

// ==== Production list (/api/productions) ====

export const ProductionListParamsSchema = PagedParamsSchema.extend({
  proofingOrderId: IdSchema.nullable().optional(),
  productionLeadId: IdSchema.nullable().optional(),
  status: z.string().nullable().optional(),
});

export type ProductionListParams = z.infer<typeof ProductionListParamsSchema>;

// ==== User list (/api/users) ====

export const UserListParamsSchema = PagedParamsSchema.extend({
  search: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type UserListParams = z.infer<typeof UserListParamsSchema>;

// === DesignType list (/api/design-types) ====

export const DesignTypeListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
});

export type DesignTypeListParams = z.infer<typeof DesignTypeListParamsSchema>;

// === MaterialType list (/api/material-types) ====

export const MaterialTypeListParamsSchema = PagedParamsSchema.extend({
  status: z.string().nullable().optional(),
});

export type MaterialTypeListParams = z.infer<
  typeof MaterialTypeListParamsSchema
>;
