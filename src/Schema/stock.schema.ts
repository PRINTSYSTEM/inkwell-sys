// src/Schema/stock.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { schemas } from "./generated";

// Try to import Stock schemas from generated, with fallback
const GenStockInItemRequestSchema = schemas.StockInItemRequest;
const GenCreateStockInRequestSchema = schemas.CreateStockInRequest;
const GenCreateStockInFromVendorRequestSchema = schemas.CreateStockInFromVendorRequest;
const GenCreateStockInFromProductionRequestSchema = schemas.CreateStockInFromProductionRequest;
const GenCreateStockInFromDeliveryReturnRequestSchema = schemas.CreateStockInFromDeliveryReturnRequest;
const GenUpdateStockInRequestSchema = schemas.UpdateStockInRequest;
const GenStockOutItemRequestSchema = schemas.StockOutItemRequest;
const GenCreateStockOutRequestSchema = schemas.CreateStockOutRequest;
const GenCreateStockOutForProductionRequestSchema = schemas.CreateStockOutForProductionRequest;
const GenCreateStockOutForDeliveryRequestSchema = schemas.CreateStockOutForDeliveryRequest;
const GenProcessDeliveryReturnRequestSchema = schemas.ProcessDeliveryReturnRequest;
const GenReturnItemRequestSchema = schemas.ReturnItemRequest;
const GenUpdateStockOutRequestSchema = schemas.UpdateStockOutRequest;

// New stock/inventory schemas
const GenCurrentStockResponseSchema = schemas.CurrentStockResponse;
const GenCurrentStockResponseIPaginateSchema = schemas.CurrentStockResponseIPaginate;
const GenInventorySummaryItemResponseSchema = schemas.InventorySummaryItemResponse;
const GenInventorySummaryItemResponseIPaginateSchema = schemas.InventorySummaryItemResponseIPaginate;
const GenLowStockResponseSchema = schemas.LowStockResponse;
const GenLowStockResponseIPaginateSchema = schemas.LowStockResponseIPaginate;
const GenSlowMovingResponseSchema = schemas.SlowMovingResponse;
const GenSlowMovingResponseIPaginateSchema = schemas.SlowMovingResponseIPaginate;
const GenStockCardEntryResponseSchema = schemas.StockCardEntryResponse;
const GenStockCardResponseSchema = schemas.StockCardResponse;

// ===== StockInItemRequest =====
export const StockInItemRequestSchema =
  GenStockInItemRequestSchema?.passthrough().extend({
    laborCost: z.number().nullable().optional(),
    proofingOrderId: z.union([z.string(), z.number()]).nullable().optional(),
    ramQuantity: z.number().nullable().optional(),
    jobCode: z.string().nullable().optional(),
  }) || z.any();
export type StockInItemRequest = z.infer<typeof StockInItemRequestSchema>;

// ===== CreateStockInRequest =====
export const CreateStockInRequestSchema = GenCreateStockInRequestSchema
  ? GenCreateStockInRequestSchema.passthrough().extend({
      items: z.array(StockInItemRequestSchema),
    })
  : z.any();
export type CreateStockInRequest = z.infer<
  typeof CreateStockInRequestSchema
>;

// ===== CreateStockInFromVendorRequest =====
export const CreateStockInFromVendorRequestSchema = GenCreateStockInFromVendorRequestSchema
  ? GenCreateStockInFromVendorRequestSchema.passthrough().extend({
      laborCost: z.number().nullable().optional(),
      items: z.array(StockInItemRequestSchema),
    })
  : z.any();
export type CreateStockInFromVendorRequest = z.infer<
  typeof CreateStockInFromVendorRequestSchema
>;

// ===== CreateStockInFromProductionRequest =====
export const CreateStockInFromProductionRequestSchema = GenCreateStockInFromProductionRequestSchema
  ? GenCreateStockInFromProductionRequestSchema.passthrough().extend({
      items: z.array(StockInItemRequestSchema),
    })
  : z.any();
export type CreateStockInFromProductionRequest = z.infer<
  typeof CreateStockInFromProductionRequestSchema
>;

// ===== CreateStockInFromDeliveryReturnRequest =====
export const CreateStockInFromDeliveryReturnRequestSchema = GenCreateStockInFromDeliveryReturnRequestSchema
  ? GenCreateStockInFromDeliveryReturnRequestSchema.passthrough().extend({
      items: z.array(StockInItemRequestSchema),
    })
  : z.any();
export type CreateStockInFromDeliveryReturnRequest = z.infer<
  typeof CreateStockInFromDeliveryReturnRequestSchema
>;

// ===== UpdateStockInRequest =====
export const UpdateStockInRequestSchema = GenUpdateStockInRequestSchema
  ? GenUpdateStockInRequestSchema.passthrough().extend({
      items: z.array(StockInItemRequestSchema).nullable().optional(),
    })
  : z.any();
export type UpdateStockInRequest = z.infer<
  typeof UpdateStockInRequestSchema
>;

// ===== StockOutItemRequest =====
export const StockOutItemRequestSchema =
  GenStockOutItemRequestSchema?.passthrough() || z.any();
export type StockOutItemRequest = z.infer<typeof StockOutItemRequestSchema>;

// ===== CreateStockOutRequest =====
export const CreateStockOutRequestSchema =
  GenCreateStockOutRequestSchema?.passthrough() || z.any();
export type CreateStockOutRequest = z.infer<
  typeof CreateStockOutRequestSchema
>;

// ===== CreateStockOutForProductionRequest =====
export const CreateStockOutForProductionRequestSchema =
  GenCreateStockOutForProductionRequestSchema?.passthrough() || z.any();
export type CreateStockOutForProductionRequest = z.infer<
  typeof CreateStockOutForProductionRequestSchema
>;

// ===== CreateStockOutForDeliveryRequest =====
export const CreateStockOutForDeliveryRequestSchema =
  GenCreateStockOutForDeliveryRequestSchema?.passthrough() || z.any();
export type CreateStockOutForDeliveryRequest = z.infer<
  typeof CreateStockOutForDeliveryRequestSchema
>;

// ===== ProcessDeliveryReturnRequest =====
export const ProcessDeliveryReturnRequestSchema =
  GenProcessDeliveryReturnRequestSchema?.passthrough() || z.any();
export type ProcessDeliveryReturnRequest = z.infer<
  typeof ProcessDeliveryReturnRequestSchema
>;

// ===== ReturnItemRequest =====
export const ReturnItemRequestSchema =
  GenReturnItemRequestSchema?.passthrough() || z.any();
export type ReturnItemRequest = z.infer<typeof ReturnItemRequestSchema>;

// ===== UpdateStockOutRequest =====
export const UpdateStockOutRequestSchema =
  GenUpdateStockOutRequestSchema?.passthrough() || z.any();
export type UpdateStockOutRequest = z.infer<
  typeof UpdateStockOutRequestSchema
>;

// ===== Re-export new stock/inventory schemas =====
export const CurrentStockResponseSchema =
  GenCurrentStockResponseSchema?.passthrough() || z.any();
export type CurrentStockResponse = z.infer<typeof CurrentStockResponseSchema>;
export const CurrentStockResponseIPaginateSchema =
  GenCurrentStockResponseIPaginateSchema?.passthrough() || z.any();
export type CurrentStockResponseIPaginate = z.infer<typeof CurrentStockResponseIPaginateSchema>;

export const InventorySummaryItemResponseSchema =
  GenInventorySummaryItemResponseSchema?.passthrough() || z.any();
export type InventorySummaryItemResponse = z.infer<typeof InventorySummaryItemResponseSchema>;
export const InventorySummaryItemResponseIPaginateSchema =
  GenInventorySummaryItemResponseIPaginateSchema?.passthrough() || z.any();
export type InventorySummaryItemResponseIPaginate = z.infer<typeof InventorySummaryItemResponseIPaginateSchema>;

export const LowStockResponseSchema =
  GenLowStockResponseSchema?.passthrough() || z.any();
export type LowStockResponse = z.infer<typeof LowStockResponseSchema>;
export const LowStockResponseIPaginateSchema =
  GenLowStockResponseIPaginateSchema?.passthrough() || z.any();
export type LowStockResponseIPaginate = z.infer<typeof LowStockResponseIPaginateSchema>;

export const SlowMovingResponseSchema =
  GenSlowMovingResponseSchema?.passthrough() || z.any();
export type SlowMovingResponse = z.infer<typeof SlowMovingResponseSchema>;
export const SlowMovingResponseIPaginateSchema =
  GenSlowMovingResponseIPaginateSchema?.passthrough() || z.any();
export type SlowMovingResponseIPaginate = z.infer<typeof SlowMovingResponseIPaginateSchema>;

export const StockCardEntryResponseSchema =
  GenStockCardEntryResponseSchema?.passthrough() || z.any();
export type StockCardEntryResponse = z.infer<typeof StockCardEntryResponseSchema>;
export const StockCardResponseSchema =
  GenStockCardResponseSchema?.passthrough() || z.any();
export type StockCardResponse = z.infer<typeof StockCardResponseSchema>;

