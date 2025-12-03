// src/Schema/params.schema.ts
import { z } from "zod";
import { UserRoleSchema, IdSchema } from "./common";

/**
 * Dùng chung cho các API list có pageNumber, pageSize
 * Swagger: integer, default 1/10, không required
 */
export const PageParamsSchema = z.object({
  pageNumber: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).default(10),
});

export type PageParams = z.infer<typeof PageParamsSchema>;

/* =========================================================
 * /api/customers  (GET)
 *   - pageNumber, pageSize, search, debtStatus
 * =======================================================*/

export const CustomerListParamsSchema = PageParamsSchema.extend({
  search: z.string().optional(),
  debtStatus: z.string().optional(),
});

export type CustomerListParams = z.infer<typeof CustomerListParamsSchema>;

/* =========================================================
 * /api/designs (GET)
 *   - pageNumber, pageSize, designerId, status
 * /api/designs/my (GET)
 *   - pageNumber, pageSize, status
 * /api/designs/user/{userId} (GET)
 *   - path: userId
 *   - query: status
 * =======================================================*/

// /api/designs (GET)
export const DesignListParamsSchema = PageParamsSchema.extend({
  designerId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export type DesignListParams = z.infer<typeof DesignListParamsSchema>;

// /api/designs/my (GET)
export const MyDesignListParamsSchema = PageParamsSchema.extend({
  status: z.string().optional(),
});

export type MyDesignListParams = z.infer<typeof MyDesignListParamsSchema>;

// /api/designs/user/{userId} (GET) - path params
export const DesignUserPathParamsSchema = z.object({
  userId: IdSchema,
});

export type DesignUserPathParams = z.infer<typeof DesignUserPathParamsSchema>;

// /api/designs/user/{userId} (GET) - query params
export const DesignUserQueryParamsSchema = z.object({
  status: z.string().optional(),
});

export type DesignUserQueryParams = z.infer<typeof DesignUserQueryParamsSchema>;

/* =========================================================
 * /api/designs/types (GET)
 *   - status
 * /api/designs/materials (GET)
 *   - status
 * /api/designs/materials/design-type/{designTypeId} (GET)
 *   - path: designTypeId
 *   - query: status
 * =======================================================*/

// /api/designs/types (GET)
export const DesignTypeListParamsSchema = PageParamsSchema.extend({
  status: z.string().optional(),
});

export type DesignTypeListParams = z.infer<typeof DesignTypeListParamsSchema>;

// /api/designs/materials (GET)
export const MaterialTypeListParamsSchema = PageParamsSchema.extend({
  status: z.string().optional(),
});

export type MaterialTypeListParams = z.infer<
  typeof MaterialTypeListParamsSchema
>;

// /api/designs/materials/design-type/{designTypeId} (GET) - path
export const MaterialByDesignTypePathParamsSchema = z.object({
  designTypeId: IdSchema,
});

export type MaterialByDesignTypePathParams = z.infer<
  typeof MaterialByDesignTypePathParamsSchema
>;

// /api/designs/materials/design-type/{designTypeId} (GET) - query
export const MaterialByDesignTypeQueryParamsSchema = z.object({
  status: z.string().optional(),
});

export type MaterialByDesignTypeQueryParams = z.infer<
  typeof MaterialByDesignTypeQueryParamsSchema
>;

/* =========================================================
 * /api/orders (GET)
 *   - pageNumber, pageSize, customerId, status
 * =======================================================*/

export const OrderListParamsSchema = PageParamsSchema.extend({
  customerId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export type OrderListParams = z.infer<typeof OrderListParamsSchema>;

/* =========================================================
 * /api/proofing-orders (GET)
 *   - pageNumber, pageSize, materialTypeId, status
 * /api/proofing-orders/available-designs (GET)
 *   - materialTypeId
 * =======================================================*/

// /api/proofing-orders (GET)
export const ProofingOrderListParamsSchema = PageParamsSchema.extend({
  materialTypeId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export type ProofingOrderListParams = z.infer<
  typeof ProofingOrderListParamsSchema
>;

// /api/proofing-orders/available-designs (GET)
export const ProofingAvailableDesignsParamsSchema = z.object({
  materialTypeId: z.coerce.number().int(),
});

export type ProofingAvailableDesignsParams = z.infer<
  typeof ProofingAvailableDesignsParamsSchema
>;

/* =========================================================
 * /api/productions (GET)
 *   - pageNumber, pageSize, proofingOrderId, productionLeadId, status
 * /api/productions/proofing-order/{proofingOrderId} (GET)
 *   - proofingOrderId (path)
 * =======================================================*/

// /api/productions (GET)
export const ProductionListParamsSchema = PageParamsSchema.extend({
  proofingOrderId: z.coerce.number().int().optional(),
  productionLeadId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export type ProductionListParams = z.infer<typeof ProductionListParamsSchema>;

// /api/productions/proofing-order/{proofingOrderId} (GET)
export const ProductionByProofingOrderPathParamsSchema = z.object({
  proofingOrderId: IdSchema,
});

export type ProductionByProofingOrderPathParams = z.infer<
  typeof ProductionByProofingOrderPathParamsSchema
>;

/* =========================================================
 * /api/users (GET)
 *   - pageNumber, pageSize, role, isActive
 * /api/users/designers (GET) - không có params
 * /api/users/username/{username} (GET) - path
 * =======================================================*/

// /api/users (GET)
export const UserListParamsSchema = PageParamsSchema.extend({
  role: UserRoleSchema.optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
});

export type UserListParams = z.infer<typeof UserListParamsSchema>;

// /api/users/username/{username} (GET)
export const UserByUsernamePathParamsSchema = z.object({
  username: z.string(),
});

export type UserByUsernamePathParams = z.infer<
  typeof UserByUsernamePathParamsSchema
>;

/* =========================================================
 * Generic path params có {id}
 * Dùng chung cho:
 *  - /api/customers/{id}
 *  - /api/designs/{id}
 *  - /api/designs/{id}/timeline
 *  - /api/designs/{id}/generate-excel
 *  - /api/designs/{id}/upload-design-file
 *  - /api/designs/{id}/upload-design-image
 *  - /api/designs/types/{id}
 *  - /api/designs/materials/{id}
 *  - /api/orders/{id}
 *  - /api/orders/{id}/generate-excel
 *  - /api/productions/{id}
 *  - /api/productions/{id}/start
 *  - /api/productions/{id}/complete
 *  - /api/proofing-orders/{id}
 *  - /api/users/{id}
 *  - /api/users/{id}/change-password
 * =======================================================*/

export const IdPathParamsSchema = z.object({
  id: IdSchema,
});

export type IdPathParams = z.infer<typeof IdPathParamsSchema>;

/* =========================================================
 * Các path params riêng còn lại:
 *  - /api/invoices/order/{orderId}
 * =======================================================*/

export const InvoiceByOrderPathParamsSchema = z.object({
  orderId: IdSchema,
});

export type InvoiceByOrderPathParams = z.infer<
  typeof InvoiceByOrderPathParamsSchema
>;
