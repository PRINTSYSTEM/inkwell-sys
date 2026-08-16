import { z } from "zod";
import {
  DieResponseSchema as GenDieResponseSchema,
  DieResponseIPaginateSchema as GenDieResponseIPaginateSchema,
  DieUsageHistoryItemSchema as GenDieUsageHistoryItemSchema,
  CreateDieRequestSchema as GenCreateDieRequestSchema,
  UpdateDieRequestSchema as GenUpdateDieRequestSchema,
  AssignDieToProofingOrderRequestSchema as GenAssignDieToProofingOrderRequestSchema,
  ReplaceDieRequestSchema as GenReplaceDieRequestSchema,
  UpdateDieStatusRequestSchema as GenUpdateDieStatusRequestSchema,
  DieExportHistoryResponseSchema as GenDieExportHistoryResponseSchema,
} from "./generated";

// ===== DieResponse =====
export const DieResponseSchema = GenDieResponseSchema.extend({
  thumbnailUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
}).passthrough();
export type DieResponse = z.infer<typeof DieResponseSchema>;

// ===== DieResponsePaginate =====
export const DieResponsePaginateSchema = GenDieResponseIPaginateSchema.passthrough();
export type DieResponsePaginate = z.infer<typeof DieResponsePaginateSchema>;

// ===== DieUsageHistoryItem =====
export const DieUsageHistoryItemSchema = GenDieUsageHistoryItemSchema.passthrough();
export type DieUsageHistoryItem = z.infer<typeof DieUsageHistoryItemSchema>;

// ===== CreateDieRequest =====
export const CreateDieRequestSchema = GenCreateDieRequestSchema.extend({
  category: z.string().nullable().optional(),
}).passthrough();
export type CreateDieRequest = z.infer<typeof CreateDieRequestSchema>;

// ===== UpdateDieRequest =====
export const UpdateDieRequestSchema = GenUpdateDieRequestSchema.extend({
  category: z.string().nullable().optional(),
}).passthrough();
export type UpdateDieRequest = z.infer<typeof UpdateDieRequestSchema>;

// ===== AssignDieToProofingOrderRequest =====
export const AssignDieToProofingOrderRequestSchema =
  GenAssignDieToProofingOrderRequestSchema.passthrough();
export type AssignDieToProofingOrderRequest = z.infer<
  typeof AssignDieToProofingOrderRequestSchema
>;

// ===== ReplaceDieRequest =====
export const ReplaceDieRequestSchema = GenReplaceDieRequestSchema.passthrough();
export type ReplaceDieRequest = z.infer<typeof ReplaceDieRequestSchema>;

// ===== UpdateDieStatusRequest =====
export const UpdateDieStatusRequestSchema =
  GenUpdateDieStatusRequestSchema.passthrough();
export type UpdateDieStatusRequest = z.infer<
  typeof UpdateDieStatusRequestSchema
>;

// ===== DieExportHistoryResponse =====
export const DieExportHistoryResponseSchema = GenDieExportHistoryResponseSchema.passthrough();
export type DieExportHistoryResponse = z.infer<
  typeof DieExportHistoryResponseSchema
>;


