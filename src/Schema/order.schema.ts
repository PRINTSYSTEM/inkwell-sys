import { z } from "zod";
import { IdSchema, DateSchema } from "./Common/base";
import { CustomerSchema } from "./customer.schema";
import { UserSchema } from "./user.schema";
import { DesignEntitySchema } from "./design.schema";

const customerSchema = CustomerSchema.omit({
  address: true,
  type: true,
  createdBy: true,
  representativeName: true,
  phone: true,
  taxCode: true,
});

export const OrderEntitySchema = z.object({
  id: IdSchema,
  code: z.string(),

  customerId: IdSchema,
  customer: customerSchema,

  createdBy: IdSchema,
  creator: UserSchema,

  assignedTo: IdSchema,
  assignedUser: UserSchema,

  status: z.string(), // ví dụ: "completed"
  statusType: z.string(), // "OrderStatus"

  deliveryAddress: z.string(),
  totalAmount: z.number(),
  depositAmount: z.number(),
  deliveryDate: DateSchema,

  excelFileUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),

  createdAt: DateSchema,
  updatedAt: DateSchema,

  designs: z.array(DesignEntitySchema),
});

/* ================== QUERY PARAMS ================== */

export const OrderQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),

  // search theo mã đơn / tên khách / mã khách...
  search: z.string().optional(),

  // lọc theo trạng thái
  status: z.string().optional(),

  // lọc theo khách hàng / người phụ trách
  customerId: IdSchema.optional(),
  assignedTo: IdSchema.optional(),

  // lọc theo khoảng ngày giao hàng
  fromDeliveryDate: DateSchema.optional(),
  toDeliveryDate: DateSchema.optional(),

  // sort
  sortBy: z.string().optional(), // ví dụ: "createdAt", "deliveryDate", "code"
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/* ================== LIST RESPONSE ================== */

export const OrderListSchema = z.object({
  data: z.array(OrderEntitySchema),
  totalCount: z.number().int(),
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});

/* ========== DESIGN REQUEST TRONG CREATE ORDER ========== */

export const DesignRequestSchema = z.object({
  designTypeId: IdSchema,
  materialTypeId: IdSchema,
  assignedDesignerId: IdSchema,

  quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0"),

  dimensions: z.string(),

  width: z.number().nonnegative().optional(), // backend cho 0, nhưng thường là >= 0
  height: z.number().nonnegative().optional(),

  requirements: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type DesignRequest = z.infer<typeof DesignRequestSchema>;

/* ========== CREATE ORDER ========== */
/*
{
  "customerId": 0,
  "assignedToUserId": 0,
  "deliveryAddress": "string",
  "totalAmount": 0,
  "depositAmount": 0,
  "deliveryDate": "2025-11-23T12:37:18.417Z",
  "note": "string",
  "designRequests": [ ... ]
}
*/

export const CreateOrderSchema = z.object({
  customerId: IdSchema,
  assignedToUserId: IdSchema, // nếu cho phép để trống thì đổi thành .optional()

  deliveryAddress: z.string().min(1, "Địa chỉ giao hàng không được để trống"),

  totalAmount: z.number().nonnegative(),

  depositAmount: z.number().nonnegative(),

  deliveryDate: DateSchema,

  note: z.string().optional(),

  designRequests: z
    .array(DesignRequestSchema)
    .min(1, "Cần ít nhất 1 yêu cầu thiết kế"),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>;

/* ========== UPDATE ORDER ========== */
/*
{
  "status": "string",
  "deliveryAddress": "string",
  "totalAmount": 0,
  "depositAmount": 0,
  "deliveryDate": "2025-11-23T12:37:01.499Z",
  "note": "string",
  "assignedToUserId": 0
}
*/

// Thường update là partial, nên mình cho tất cả optional
export const UpdateOrderSchema = z.object({
  status: z.string().optional(), // ví dụ: "pending" | "completed" | ...
  deliveryAddress: z.string().optional(),
  totalAmount: z.number().nonnegative().optional(),
  depositAmount: z.number().nonnegative().optional(),
  deliveryDate: DateSchema.optional(),
  note: z.string().optional(),
  assignedToUserId: IdSchema.optional(),
});

export type UpdateOrderRequest = z.infer<typeof UpdateOrderSchema>;

/* ================== TYPES ================== */

export type OrderEntity = z.infer<typeof OrderEntitySchema>;
export type Order = OrderEntity;

export type OrderQueryParams = z.infer<typeof OrderQuerySchema>;

export type OrderListResponse = z.infer<typeof OrderListSchema>;
