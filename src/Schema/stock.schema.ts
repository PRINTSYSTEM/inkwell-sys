// src/Schema/stock.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { schemas } from "./generated";

// Try to import Stock schemas from generated, with fallback
const GenStockInItemRequestSchema = schemas.StockInItemRequest;
const GenCreateStockInRequestSchema = schemas.CreateStockInRequest;
const GenUpdateStockInRequestSchema = schemas.UpdateStockInRequest;
const GenStockOutItemRequestSchema = schemas.StockOutItemRequest;
const GenCreateStockOutRequestSchema = schemas.CreateStockOutRequest;
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
  GenStockInItemRequestSchema?.passthrough() || z.any();
export type StockInItemRequest = z.infer<typeof StockInItemRequestSchema>;

// ===== CreateStockInRequest =====
export const CreateStockInRequestSchema =
  GenCreateStockInRequestSchema?.passthrough() || z.any();
export type CreateStockInRequest = z.infer<
  typeof CreateStockInRequestSchema
>;

// ===== UpdateStockInRequest =====
export const UpdateStockInRequestSchema =
  GenUpdateStockInRequestSchema?.passthrough() || z.any();
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

