import { z } from 'zod';
import { StatusEnum, PriorityEnum } from './Common/enums';
import { IdSchema, DateSchema } from './Common/base';

// Order Status Enum (specific to orders)
export const OrderStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'in_production',
  'quality_check',
  'ready_for_delivery',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'on_hold',
  'returned'
]);

// Order Type Enum
export const OrderTypeEnum = z.enum([
  'standard',
  'rush',
  'sample',
  'reprint',
  'custom',
  'bulk',
  'subscription'
]);

// Payment Status Enum
export const PaymentStatusEnum = z.enum([
  'pending',
  'partial',
  'paid',
  'overdue',
  'refunded',
  'cancelled'
]);

// Payment Method Enum
export const PaymentMethodEnum = z.enum([
  'cash',
  'bank_transfer',
  'credit_card',
  'debit_card',
  'check',
  'digital_wallet',
  'credit_account'
]);

// Delivery Method Enum
export const DeliveryMethodEnum = z.enum([
  'pickup',
  'standard_delivery',
  'express_delivery',
  'same_day',
  'courier',
  'postal_service',
  'freight'
]);

// Customer Schema
export const CustomerSchema = z.object({
  id: IdSchema,
  type: z.enum(['individual', 'business']),
  
  // Basic Info
  name: z.string(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  
  // Business Info (for business customers)
  businessName: z.string().optional(),
  taxId: z.string().optional(),
  businessLicense: z.string().optional(),
  
  // Address
  addresses: z.array(z.object({
    type: z.enum(['billing', 'shipping', 'both']),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    isDefault: z.boolean().default(false)
  })).default([]),
  
  // Contact Person (for business customers)
  contactPerson: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }).optional(),
  
  // Customer Settings
  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.string().optional(),
  discountRate: z.number().min(0).max(100).default(0),
  
  // Status
  isActive: z.boolean().default(true),
  isVip: z.boolean().default(false),
  
  // Analytics
  totalOrders: z.number().min(0).default(0),
  totalRevenue: z.number().min(0).default(0),
  averageOrderValue: z.number().min(0).default(0),
  lastOrderDate: DateSchema.optional(),
  
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Order Item Schema
export const OrderItemSchema = z.object({
  id: IdSchema,
  
  // Product/Service Details
  type: z.enum(['design', 'print', 'material', 'service', 'package']),
  itemId: IdSchema.optional(), // References design, material, etc.
  name: z.string(),
  description: z.string().optional(),
  sku: z.string().optional(),
  
  // Specifications
  specifications: z.record(z.unknown()).optional(),
  designCodeId: IdSchema.optional(),
  
  // Pricing
  quantity: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  subtotal: z.number().min(0),
  
  // Production
  estimatedProductionTime: z.number().min(0).optional(), // hours
  actualProductionTime: z.number().min(0).optional(), // hours
  assignedTo: IdSchema.optional(),
  department: z.string().optional(),
  
  // Status
  status: OrderStatusEnum,
  notes: z.string().optional(),
  
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Order Payment Schema
export const OrderPaymentSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  
  // Payment Details
  amount: z.number().positive(),
  method: PaymentMethodEnum,
  reference: z.string().optional(),
  
  // Status
  status: PaymentStatusEnum,
  paidAt: DateSchema.optional(),
  dueDate: DateSchema.optional(),
  
  // Additional Info
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  
  createdAt: DateSchema,
  createdBy: IdSchema
});

// Order Delivery Schema
export const OrderDeliverySchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  
  // Delivery Details
  method: DeliveryMethodEnum,
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  
  // Address
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional()
  }),
  
  // Schedule
  scheduledDate: DateSchema.optional(),
  estimatedDelivery: DateSchema.optional(),
  actualDelivery: DateSchema.optional(),
  
  // Status
  status: z.enum(['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned']),
  
  // Cost
  deliveryCost: z.number().min(0).default(0),
  
  // Notes
  instructions: z.string().optional(),
  notes: z.string().optional(),
  
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Main Order Schema
export const OrderSchema = z.object({
  id: IdSchema,
  orderNumber: z.string().regex(/^ORD-\d{4}-\d{6}$/, "Order number must follow format ORD-YYYY-XXXXXX"),
  
  // Customer Info
  customerId: IdSchema,
  customerType: z.enum(['individual', 'business']),
  
  // Order Details
  type: OrderTypeEnum,
  priority: PriorityEnum,
  status: OrderStatusEnum,
  
  // Items
  items: z.array(OrderItemSchema),
  
  // Pricing
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  currency: z.string().default('VND'),
  
  // Payment
  paymentStatus: PaymentStatusEnum,
  paymentTerms: z.string().optional(),
  payments: z.array(OrderPaymentSchema).default([]),
  
  // Delivery
  deliveryMethod: DeliveryMethodEnum,
  delivery: OrderDeliverySchema.optional(),
  
  // Timeline
  orderDate: DateSchema,
  requestedDate: DateSchema.optional(),
  promisedDate: DateSchema.optional(),
  estimatedCompletionDate: DateSchema.optional(),
  actualCompletionDate: DateSchema.optional(),
  
  // Production
  productionStartDate: DateSchema.optional(),
  productionEndDate: DateSchema.optional(),
  qualityCheckDate: DateSchema.optional(),
  
  // Staff Assignment
  salesRepId: IdSchema.optional(),
  projectManagerId: IdSchema.optional(),
  designerId: IdSchema.optional(),
  
  // Communication
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  specialInstructions: z.string().optional(),
  
  // Documents
  quote: z.object({
    id: IdSchema,
    number: z.string(),
    validUntil: DateSchema,
    url: z.string().url().optional()
  }).optional(),
  
  invoice: z.object({
    id: IdSchema,
    number: z.string(),
    issuedDate: DateSchema,
    dueDate: DateSchema,
    url: z.string().url().optional()
  }).optional(),
  
  // Workflow
  approvals: z.array(z.object({
    type: z.enum(['credit_check', 'production', 'quality', 'delivery']),
    approver: IdSchema,
    status: z.enum(['pending', 'approved', 'rejected']),
    approvedAt: DateSchema.optional(),
    notes: z.string().optional()
  })).default([]),
  
  // Analytics
  profitMargin: z.number().optional(),
  productionEfficiency: z.number().min(0).max(100).optional(),
  customerSatisfaction: z.number().min(1).max(5).optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  source: z.enum(['website', 'phone', 'email', 'walk_in', 'referral', 'sales_rep']).optional(),
  
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema,
  lastModifiedBy: IdSchema.optional()
});

// Order Template Schema
export const OrderTemplateSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  
  // Template Items
  items: z.array(OrderItemSchema.omit({ 
    id: true, 
    status: true, 
    createdAt: true, 
    updatedAt: true 
  })),
  
  // Default Settings
  type: OrderTypeEnum,
  priority: PriorityEnum,
  estimatedDuration: z.number().min(0).optional(), // hours
  
  // Usage
  usageCount: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  
  createdAt: DateSchema,
  updatedAt: DateSchema,
  createdBy: IdSchema
});

// Order Statistics Schema
export const OrderStatsSchema = z.object({
  period: z.object({
    start: DateSchema,
    end: DateSchema
  }),
  
  overview: z.object({
    total_orders: z.number().min(0),
    completed_orders: z.number().min(0),
    cancelled_orders: z.number().min(0),
    total_revenue: z.number().min(0),
    average_order_value: z.number().min(0),
    completion_rate: z.number().min(0).max(100),
    on_time_delivery_rate: z.number().min(0).max(100)
  }),
  
  by_status: z.array(z.object({
    status: OrderStatusEnum,
    count: z.number().min(0),
    percentage: z.number().min(0).max(100)
  })),
  
  by_type: z.array(z.object({
    type: OrderTypeEnum,
    count: z.number().min(0),
    revenue: z.number().min(0)
  })),
  
  by_customer: z.array(z.object({
    customerId: IdSchema,
    customerName: z.string(),
    orders: z.number().min(0),
    revenue: z.number().min(0)
  })),
  
  top_products: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(0),
    revenue: z.number().min(0)
  })),
  
  revenue_trends: z.array(z.object({
    date: DateSchema,
    orders: z.number().min(0),
    revenue: z.number().min(0),
    average_value: z.number().min(0)
  }))
});

// Create Order Schema
export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  payments: true,
  subtotal: true,
  totalAmount: true
}).extend({
  generateOrderNumber: z.boolean().default(true)
});

// Update Order Schema
export const UpdateOrderSchema = z.object({
  type: OrderTypeEnum.optional(),
  priority: PriorityEnum.optional(),
  status: OrderStatusEnum.optional(),
  requestedDate: DateSchema.optional(),
  promisedDate: DateSchema.optional(),
  salesRepId: IdSchema.optional(),
  projectManagerId: IdSchema.optional(),
  designerId: IdSchema.optional(),
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  specialInstructions: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Order Filter Schema
export const OrderFilterSchema = z.object({
  search: z.string().optional(),
  status: OrderStatusEnum.optional(),
  type: OrderTypeEnum.optional(),
  priority: PriorityEnum.optional(),
  customerId: IdSchema.optional(),
  salesRepId: IdSchema.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  orderDateAfter: DateSchema.optional(),
  orderDateBefore: DateSchema.optional(),
  promisedDateAfter: DateSchema.optional(),
  promisedDateBefore: DateSchema.optional(),
  tags: z.array(z.string()).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  sortBy: z.enum(['orderDate', 'promisedDate', 'totalAmount', 'status', 'priority']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Export types
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type OrderType = z.infer<typeof OrderTypeEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodEnum>;
export type Customer = z.infer<typeof CustomerSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderPayment = z.infer<typeof OrderPaymentSchema>;
export type OrderDelivery = z.infer<typeof OrderDeliverySchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderTemplate = z.infer<typeof OrderTemplateSchema>;
export type OrderStats = z.infer<typeof OrderStatsSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;