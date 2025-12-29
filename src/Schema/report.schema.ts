// src/Schema/report.schema.ts
// Wrapper around generated schemas for reports - keeps utilities and stable exports
import { z } from "zod";
import {
  OrderDrillDownResponseSchema as GenOrderDrillDownResponseSchema,
  OrderDrillDownResponseIPaginateSchema as GenOrderDrillDownResponseIPaginateSchema,
  ReportExportResponseSchema as GenReportExportResponseSchema,
  ReportExportResponseIPaginateSchema as GenReportExportResponseIPaginateSchema,
  ReturnsDiscountsResponseSchema as GenReturnsDiscountsResponseSchema,
  ReturnsDiscountsResponseIPaginateSchema as GenReturnsDiscountsResponseIPaginateSchema,
  SalesByCustomerResponseSchema as GenSalesByCustomerResponseSchema,
  SalesByCustomerResponseIPaginateSchema as GenSalesByCustomerResponseIPaginateSchema,
  SalesByDimensionResponseSchema as GenSalesByDimensionResponseSchema,
  SalesByDimensionResponseIPaginateSchema as GenSalesByDimensionResponseIPaginateSchema,
  SalesByPeriodResponseSchema as GenSalesByPeriodResponseSchema,
  SalesByPeriodResponseIPaginateSchema as GenSalesByPeriodResponseIPaginateSchema,
  TopProductResponseSchema as GenTopProductResponseSchema,
  TopProductResponseIPaginateSchema as GenTopProductResponseIPaginateSchema,
} from "./generated";

// ===== OrderDrillDownResponse =====
export const OrderDrillDownResponseSchema = GenOrderDrillDownResponseSchema.passthrough();
export type OrderDrillDownResponse = z.infer<typeof OrderDrillDownResponseSchema>;
export const OrderDrillDownResponseIPaginateSchema = GenOrderDrillDownResponseIPaginateSchema.passthrough();
export type OrderDrillDownResponseIPaginate = z.infer<typeof OrderDrillDownResponseIPaginateSchema>;

// ===== ReportExportResponse =====
export const ReportExportResponseSchema = GenReportExportResponseSchema.passthrough();
export type ReportExportResponse = z.infer<typeof ReportExportResponseSchema>;
export const ReportExportResponseIPaginateSchema = GenReportExportResponseIPaginateSchema.passthrough();
export type ReportExportResponseIPaginate = z.infer<typeof ReportExportResponseIPaginateSchema>;

// ===== ReturnsDiscountsResponse =====
export const ReturnsDiscountsResponseSchema = GenReturnsDiscountsResponseSchema.passthrough();
export type ReturnsDiscountsResponse = z.infer<typeof ReturnsDiscountsResponseSchema>;
export const ReturnsDiscountsResponseIPaginateSchema = GenReturnsDiscountsResponseIPaginateSchema.passthrough();
export type ReturnsDiscountsResponseIPaginate = z.infer<typeof ReturnsDiscountsResponseIPaginateSchema>;

// ===== SalesByCustomerResponse =====
export const SalesByCustomerResponseSchema = GenSalesByCustomerResponseSchema.passthrough();
export type SalesByCustomerResponse = z.infer<typeof SalesByCustomerResponseSchema>;
export const SalesByCustomerResponseIPaginateSchema = GenSalesByCustomerResponseIPaginateSchema.passthrough();
export type SalesByCustomerResponseIPaginate = z.infer<typeof SalesByCustomerResponseIPaginateSchema>;

// ===== SalesByDimensionResponse =====
export const SalesByDimensionResponseSchema = GenSalesByDimensionResponseSchema.passthrough();
export type SalesByDimensionResponse = z.infer<typeof SalesByDimensionResponseSchema>;
export const SalesByDimensionResponseIPaginateSchema = GenSalesByDimensionResponseIPaginateSchema.passthrough();
export type SalesByDimensionResponseIPaginate = z.infer<typeof SalesByDimensionResponseIPaginateSchema>;

// ===== SalesByPeriodResponse =====
export const SalesByPeriodResponseSchema = GenSalesByPeriodResponseSchema.passthrough();
export type SalesByPeriodResponse = z.infer<typeof SalesByPeriodResponseSchema>;
export const SalesByPeriodResponseIPaginateSchema = GenSalesByPeriodResponseIPaginateSchema.passthrough();
export type SalesByPeriodResponseIPaginate = z.infer<typeof SalesByPeriodResponseIPaginateSchema>;

// ===== TopProductResponse =====
export const TopProductResponseSchema = GenTopProductResponseSchema.passthrough();
export type TopProductResponse = z.infer<typeof TopProductResponseSchema>;
export const TopProductResponseIPaginateSchema = GenTopProductResponseIPaginateSchema.passthrough();
export type TopProductResponseIPaginate = z.infer<typeof TopProductResponseIPaginateSchema>;

