// src/Schema/paper-size.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  PaperSizeResponseSchema as GenPaperSizeResponseSchema,
  CreatePaperSizeRequestSchema as GenCreatePaperSizeRequestSchema,
  UpdatePaperSizeRequestSchema as GenUpdatePaperSizeRequestSchema,
  PaperSizeResponseIPaginateSchema as GenPaperSizeResponseIPaginateSchema,
} from "./generated";

// ===== PaperSizeResponse =====
export const PaperSizeResponseSchema = GenPaperSizeResponseSchema.passthrough();
export type PaperSizeResponse = z.infer<typeof PaperSizeResponseSchema>;

// ===== PaperSizeResponseIPaginate =====
export const PaperSizeResponseIPaginateSchema =
  GenPaperSizeResponseIPaginateSchema.passthrough();
export type PaperSizeResponseIPaginate = z.infer<
  typeof PaperSizeResponseIPaginateSchema
>;

// ===== CreatePaperSizeRequest =====
export const CreatePaperSizeRequestSchema =
  GenCreatePaperSizeRequestSchema.passthrough();
export type CreatePaperSizeRequest = z.infer<
  typeof CreatePaperSizeRequestSchema
>;

// ===== UpdatePaperSizeRequest =====
export const UpdatePaperSizeRequestSchema =
  GenUpdatePaperSizeRequestSchema.passthrough();
export type UpdatePaperSizeRequest = z.infer<
  typeof UpdatePaperSizeRequestSchema
>;
