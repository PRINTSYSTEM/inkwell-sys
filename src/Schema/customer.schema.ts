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
export const CreateCustomerRequestSchema =
  GenCreateCustomerRequestSchema.passthrough();
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
