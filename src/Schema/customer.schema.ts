// src/Schema/customer.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  IdSchema,
  DateSchema,
  NameSchema,
  createPagedResponseSchema,
} from "./Common";
import { UserInfoSchema } from "./Common";
import {
  CustomerResponseSchema as GenCustomerResponseSchema,
  CustomerSummaryResponseSchema as GenCustomerSummaryResponseSchema,
  CustomerSummaryResponsePaginateSchema as GenCustomerSummaryResponsePaginateSchema,
  CreateCustomerRequestSchema as GenCreateCustomerRequestSchema,
  UpdateCustomerRequestSchema as GenUpdateCustomerRequestSchema,
  CustomerDebtHistoryResponseSchema as GenCustomerDebtHistoryResponseSchema,
  CustomerDebtHistoryResponsePaginateSchema as GenCustomerDebtHistoryResponsePaginateSchema,
  CustomerMonthlyDebtResponseSchema as GenCustomerMonthlyDebtResponseSchema,
  CustomerDebtSummaryResponseSchema as GenCustomerDebtSummaryResponseSchema,
  CustomerStatisticsResponseSchema as GenCustomerStatisticsResponseSchema,
  FrequentProductResponseSchema as GenFrequentProductResponseSchema,
  CustomerOrderHistoryResponseSchema as GenCustomerOrderHistoryResponseSchema,
  CustomerOrderHistoryResponsePaginateSchema as GenCustomerOrderHistoryResponsePaginateSchema,
  OrderHistoryDetailResponseSchema as GenOrderHistoryDetailResponseSchema,
} from "./generated";

// ===== CustomerResponse =====
// Wrapper to ensure compatibility with our base schemas (IdSchema, DateSchema, NameSchema)
export const CustomerResponseSchema = GenCustomerResponseSchema.passthrough();
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

// ===== CustomerSummaryResponse =====
export const CustomerSummaryResponseSchema =
  GenCustomerSummaryResponseSchema.passthrough();
export type CustomerSummaryResponse = z.infer<
  typeof CustomerSummaryResponseSchema
>;

// ===== PagedResponse =====
// Keep our utility-based paged responses for consistency
export const CustomerResponsePagedResponseSchema = createPagedResponseSchema(
  CustomerResponseSchema
);
export type CustomerResponsePagedResponse = z.infer<
  typeof CustomerResponsePagedResponseSchema
>;

// Use generated paginate schema but also keep our utility version
export const CustomerSummaryResponsePagedResponseSchema =
  createPagedResponseSchema(CustomerSummaryResponseSchema);
export type CustomerSummaryResponsePagedResponse = z.infer<
  typeof CustomerSummaryResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export { GenCustomerSummaryResponsePaginateSchema as CustomerSummaryResponsePaginateSchema };
export type CustomerSummaryResponsePaginate = z.infer<
  typeof GenCustomerSummaryResponsePaginateSchema
>;

// ===== CreateCustomerRequest =====
// Add validation: companyName is required when type is "company"
export const CreateCustomerRequestSchema = GenCreateCustomerRequestSchema.refine(
  (data) => {
    // If type is "company", companyName must be provided and not empty
    if (data.type === "company") {
      return !!data.companyName && data.companyName.trim().length > 0;
    }
    return true;
  },
  {
    message: "Tên công ty là bắt buộc khi chọn loại khách công ty",
    path: ["companyName"],
  }
);
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

// ===== UpdateCustomerRequest =====
export const UpdateCustomerRequestSchema =
  GenUpdateCustomerRequestSchema.passthrough();
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

// ===== CustomerDebtHistoryResponse =====
export const CustomerDebtHistoryResponseSchema =
  GenCustomerDebtHistoryResponseSchema.passthrough();
export type CustomerDebtHistoryResponse = z.infer<
  typeof CustomerDebtHistoryResponseSchema
>;

// ===== CustomerDebtHistoryResponse PagedResponse =====
export const CustomerDebtHistoryResponsePagedResponseSchema =
  createPagedResponseSchema(CustomerDebtHistoryResponseSchema);
export type CustomerDebtHistoryResponsePagedResponse = z.infer<
  typeof CustomerDebtHistoryResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenCustomerDebtHistoryResponsePaginateSchema as CustomerDebtHistoryResponsePaginateSchema,
};
export type CustomerDebtHistoryResponsePaginate = z.infer<
  typeof GenCustomerDebtHistoryResponsePaginateSchema
>;

// ===== CustomerMonthlyDebtResponse =====
export const CustomerMonthlyDebtResponseSchema =
  GenCustomerMonthlyDebtResponseSchema.passthrough();
export type CustomerMonthlyDebtResponse = z.infer<
  typeof CustomerMonthlyDebtResponseSchema
>;

// ===== CustomerDebtSummaryResponse =====
export const CustomerDebtSummaryResponseSchema =
  GenCustomerDebtSummaryResponseSchema.passthrough();
export type CustomerDebtSummaryResponse = z.infer<
  typeof CustomerDebtSummaryResponseSchema
>;

// ===== Customer Orders Response =====
// Note: CustomerOrdersResponse is not in generated, so we keep the custom definition
// This is CustomerOrderHistoryResponse in generated
export const CustomerOrdersResponseSchema = z
  .object({
    orderId: IdSchema.optional(),
    orderCode: z.string().nullable().optional(),
    invoiceNumber: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    statusName: z.string().nullable().optional(),
    totalAmount: z.number().optional(),
    depositAmount: z.number().optional(),
    paidAmount: z.number().optional(),
    remainingAmount: z.number().optional(),
    paymentDueDate: DateSchema.nullable().optional(),
    isPaymentOverdue: z.boolean().optional(),
    createdAt: DateSchema.optional(),
    deliveryDate: DateSchema.nullable().optional(),
    itemCount: z.number().int().optional(),
    designTypeNames: z.array(z.string()).nullable().optional(),
    details: z
      .array(
        z.object({
          id: IdSchema.optional(),
          designCode: z.string().nullable().optional(),
          designName: z.string().nullable().optional(),
          quantity: z.number().int().optional(),
          netQtyTotal: z.number().int().optional(),
          unitPrice: z.number().optional(),
          totalPrice: z.number().optional(),
          status: z.string().nullable().optional(),
        })
      )
      .nullable()
      .optional(),
  })
  .passthrough();

export type CustomerOrdersResponse = z.infer<
  typeof CustomerOrdersResponseSchema
>;

export const CustomerOrdersResponsePagedResponseSchema =
  createPagedResponseSchema(CustomerOrdersResponseSchema);
export type CustomerOrdersResponsePagedResponse = z.infer<
  typeof CustomerOrdersResponsePagedResponseSchema
>;

// Re-export generated CustomerOrderHistoryResponse for compatibility
export {
  GenCustomerOrderHistoryResponseSchema as CustomerOrderHistoryResponseSchema,
  GenCustomerOrderHistoryResponsePaginateSchema as CustomerOrderHistoryResponsePaginateSchema,
  GenOrderHistoryDetailResponseSchema as OrderHistoryDetailResponseSchema,
};
export type CustomerOrderHistoryResponse = z.infer<
  typeof GenCustomerOrderHistoryResponseSchema
>;
export type CustomerOrderHistoryResponsePaginate = z.infer<
  typeof GenCustomerOrderHistoryResponsePaginateSchema
>;
export type OrderHistoryDetailResponse = z.infer<
  typeof GenOrderHistoryDetailResponseSchema
>;

// ===== FrequentProductResponse =====
export const FrequentProductResponseSchema =
  GenFrequentProductResponseSchema.passthrough();
export type FrequentProductResponse = z.infer<
  typeof FrequentProductResponseSchema
>;


// ===== CustomerStatisticsResponse =====
export const CustomerStatisticsResponseSchema =
  GenCustomerStatisticsResponseSchema.passthrough();
export type CustomerStatisticsResponse = z.infer<
  typeof CustomerStatisticsResponseSchema
>;

// ===== CustomerAddress =====
// Địa chỉ giao hàng của từng khách hàng (Sổ địa chỉ)
export const CustomerAddressSchema = z
  .object({
    id: z.number().int(),
    customerId: z.number().int().optional(),
    label: z.string().nullable().optional(),
    recipientName: z.string().nullable().optional(),
    recipientPhone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();
export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const CustomerAddressResponsePaginateSchema = z.object({
  size: z.number().int().optional(),
  page: z.number().int().optional(),
  total: z.number().int().optional(),
  totalPages: z.number().int().optional(),
  items: z.array(CustomerAddressSchema).nullable().optional(),
});
export type CustomerAddressResponsePaginate = z.infer<
  typeof CustomerAddressResponsePaginateSchema
>;

export const CreateCustomerAddressRequestSchema = z.object({
  label: z.string().min(1, "Nhãn là bắt buộc"),
  recipientName: z.string().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
  isDefault: z.boolean().optional().default(false),
});
export type CreateCustomerAddressRequest = z.infer<
  typeof CreateCustomerAddressRequestSchema
>;

export const UpdateCustomerAddressRequestSchema = z.object({
  label: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isDefault: z.boolean().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
});
export type UpdateCustomerAddressRequest = z.infer<
  typeof UpdateCustomerAddressRequestSchema
>;

// ===== CustomerFavoriteStatsResponse =====
export const DesignTypeStatSchema = z.object({
  name: z.string(),
  count: z.number(),
  percentage: z.number(),
});
export type DesignTypeStat = z.infer<typeof DesignTypeStatSchema>;

export const MaterialTypeStatSchema = z.object({
  name: z.string(),
  count: z.number(),
  percentage: z.number(),
});
export type MaterialTypeStat = z.infer<typeof MaterialTypeStatSchema>;

export const CustomerFavoriteStatsResponseSchema = z.object({
  topDesignTypes: z.array(DesignTypeStatSchema),
  topMaterialTypes: z.array(MaterialTypeStatSchema),
  commonQuantities: z.array(z.number()),
});
export type CustomerFavoriteStatsResponse = z.infer<
  typeof CustomerFavoriteStatsResponseSchema
>;

// ===== CustomerDebtStatementResponse =====
export const DebtStatementItemSchema = z.object({
  id: z.number().int().optional(),
  date: z.string().optional(),
  deliveryNoteCode: z.string().nullable().optional(),
  invoiceDate: z.string().nullable().optional(),
  invoiceCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  increaseAmount: z.number().optional(),
  decreaseAmount: z.number().optional(),
  runningBalance: z.number().optional(),
  notes: z.string().nullable().optional(),
});
export type DebtStatementItem = z.infer<typeof DebtStatementItemSchema>;

export const CustomerDebtStatementResponseSchema = z.object({
  customerId: z.number().int(),
  customerName: z.string().nullable().optional(),
  month: z.number().int(),
  year: z.number().int(),
  beginningBalance: z.number(),
  totalIncrease: z.number(),
  totalDecrease: z.number(),
  endingBalance: z.number(),
  items: z.array(DebtStatementItemSchema),
});
export type CustomerDebtStatementResponse = z.infer<
  typeof CustomerDebtStatementResponseSchema
>;

