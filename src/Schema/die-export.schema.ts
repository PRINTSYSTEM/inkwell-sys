// src/Schema/die-export.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  DieExportResponseSchema as GenDieExportResponseSchema,
  RecordDieExportRequestSchema as GenRecordDieExportRequestSchema,
} from "./generated";

// ===== DieExportResponse =====
export const DieExportResponseSchema = GenDieExportResponseSchema.passthrough();
export type DieExportResponse = z.infer<typeof DieExportResponseSchema>;

// ===== RecordDieExportRequest =====
// Use the generated schema directly (no extension needed as schema changed)
export const RecordDieExportRequestSchema = GenRecordDieExportRequestSchema;
export type RecordDieExportRequest = z.infer<
  typeof RecordDieExportRequestSchema
>;
