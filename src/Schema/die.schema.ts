// src/Schema/die.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  DieResponseSchema as GenDieResponseSchema,
  DieResponseIPaginateSchema as GenDieResponseIPaginateSchema,
  DieUsageHistoryItemSchema as GenDieUsageHistoryItemSchema,
  CreateDieRequestSchema as GenCreateDieRequestSchema,
  UpdateDieRequestSchema as GenUpdateDieRequestSchema,
  AssignDieToProofingOrderRequestSchema as GenAssignDieToProofingOrderRequestSchema,
  ProofingOrderDieResponseSchema as GenProofingOrderDieResponseSchema,
} from "./generated";

// ===== DieResponse =====
export const DieResponseSchema = GenDieResponseSchema.passthrough();
export type DieResponse = z.infer<typeof DieResponseSchema>;

// ===== DieResponsePaginate =====
export const DieResponsePaginateSchema = GenDieResponseIPaginateSchema.passthrough();
export type DieResponsePaginate = z.infer<typeof DieResponsePaginateSchema>;

// ===== DieUsageHistoryItem =====
export const DieUsageHistoryItemSchema = GenDieUsageHistoryItemSchema.passthrough();
export type DieUsageHistoryItem = z.infer<typeof DieUsageHistoryItemSchema>;

// ===== CreateDieRequest =====
export const CreateDieRequestSchema = GenCreateDieRequestSchema.passthrough();
export type CreateDieRequest = z.infer<typeof CreateDieRequestSchema>;

// ===== UpdateDieRequest =====
export const UpdateDieRequestSchema = GenUpdateDieRequestSchema.passthrough();
export type UpdateDieRequest = z.infer<typeof UpdateDieRequestSchema>;

// ===== AssignDieToProofingOrderRequest =====
export const AssignDieToProofingOrderRequestSchema =
  GenAssignDieToProofingOrderRequestSchema.passthrough();
export type AssignDieToProofingOrderRequest = z.infer<
  typeof AssignDieToProofingOrderRequestSchema
>;

// ===== ProofingOrderDieResponse =====
export const ProofingOrderDieResponseSchema =
  GenProofingOrderDieResponseSchema.passthrough();
export type ProofingOrderDieResponse = z.infer<
  typeof ProofingOrderDieResponseSchema
>;


