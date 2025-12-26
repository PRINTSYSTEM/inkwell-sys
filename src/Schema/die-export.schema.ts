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
export const RecordDieExportRequestSchema =
  GenRecordDieExportRequestSchema.passthrough();
export type RecordDieExportRequest = z.infer<
  typeof RecordDieExportRequestSchema
>;
