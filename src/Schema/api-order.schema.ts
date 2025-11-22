import { z } from 'zod';

// Base schemas
const IdSchema = z.number();
const DateSchema = z.string().datetime();

// API Order Response Schema - match chính xác với response từ API
export const APIOrderUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  role: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const APIOrderCustomerSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  companyName: z.string(),
  debtStatus: z.string(),
  currentDebt: z.number(),
  maxDebt: z.number(),
});

export const APIOrderTimelineEntrySchema = z.object({
  id: z.number(),
  fileUrl: z.string(),
  description: z.string(),
  createdAt: DateSchema,
  createdBy: APIOrderUserSchema,
});

export const APIOrderDesignTypeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number(),
  description: z.string(),
  status: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: APIOrderUserSchema,
});

export const APIOrderMaterialTypeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  displayOrder: z.number(),
  description: z.string(),
  status: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: APIOrderUserSchema,
});

export const APIOrderDesignSchema = z.object({
  id: z.number(),
  code: z.string(),
  orderId: z.number(),
  designStatus: z.string(),
  designerId: z.number(),
  designer: APIOrderUserSchema,
  designTypeId: z.number(),
  designType: APIOrderDesignTypeSchema,
  materialTypeId: z.number(),
  materialType: APIOrderMaterialTypeSchema,
  quantity: z.number(),
  dimensions: z.string(),
  requirements: z.string(),
  additionalNotes: z.string(),
  designFileUrl: z.string(),
  excelFileUrl: z.string(),
  notes: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  timelineEntries: z.array(APIOrderTimelineEntrySchema),
});

export const APIOrderSchema = z.object({
  id: z.number(),
  code: z.string(),
  customerId: z.number(),
  customer: APIOrderCustomerSchema,
  createdBy: z.number(),
  creator: APIOrderUserSchema,
  assignedTo: z.number(),
  assignedUser: APIOrderUserSchema,
  status: z.string(),
  deliveryAddress: z.string(),
  totalAmount: z.number(),
  depositAmount: z.number(),
  deliveryDate: DateSchema,
  excelFileUrl: z.string(),
  note: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  designs: z.array(APIOrderDesignSchema),
});

export const APIOrdersResponseSchema = z.object({
  items: z.array(APIOrderSchema),
  totalCount: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});

// Create Order Request Schema
export const CreateOrderRequestSchema = z.object({
  customerId: z.number(),
  assignedToUserId: z.number(),
  deliveryAddress: z.string(),
  totalAmount: z.number(),
  depositAmount: z.number(),
  deliveryDate: DateSchema,
  note: z.string(),
  designRequests: z.array(z.object({
    designTypeId: z.number(),
    materialTypeId: z.number(),
    assignedDesignerId: z.number(),
    quantity: z.number(),
    dimensions: z.string(),
    requirements: z.string(),
    additionalNotes: z.string(),
  })),
});

// Update Order Request Schema
export const UpdateOrderRequestSchema = z.object({
  id: z.number(),
  customerId: z.number().optional(),
  assignedToUserId: z.number().optional(),
  deliveryAddress: z.string().optional(),
  totalAmount: z.number().optional(),
  depositAmount: z.number().optional(),
  deliveryDate: DateSchema.optional(),
  note: z.string().optional(),
  status: z.string().optional(),
});

// Order Stats Schema
export const OrderStatsSchema = z.object({
  totalOrders: z.number(),
  inProduction: z.number(),
  completed: z.number(),
  totalValue: z.number(),
});

// Type inference
export type APIOrderUser = z.infer<typeof APIOrderUserSchema>;
export type APIOrderCustomer = z.infer<typeof APIOrderCustomerSchema>;
export type APIOrderTimelineEntry = z.infer<typeof APIOrderTimelineEntrySchema>;
export type APIOrderDesignType = z.infer<typeof APIOrderDesignTypeSchema>;
export type APIOrderMaterialType = z.infer<typeof APIOrderMaterialTypeSchema>;
export type APIOrderDesign = z.infer<typeof APIOrderDesignSchema>;
export type APIOrder = z.infer<typeof APIOrderSchema>;
export type APIOrdersResponse = z.infer<typeof APIOrdersResponseSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;
export type OrderStats = z.infer<typeof OrderStatsSchema>;

// Export for backward compatibility with existing code
export type Order = APIOrder;
export type OrdersResponse = APIOrdersResponse;