// src/Schema/die-export.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import {
  DieExportResponseSchema as GenDieExportResponseSchema,
  postApiproofingOrdersIddieExport_BodySchema as GenRecordDieExportRequestSchema,
} from "./generated";

// ===== DieExportResponse =====
export const DieExportResponseSchema = GenDieExportResponseSchema.passthrough();
export type DieExportResponse = z.infer<typeof DieExportResponseSchema>;

// ===== RecordDieExportRequest =====
// Extend generated schema to include vendorName for cases where vendor is not in system
export const RecordDieExportRequestSchema =
  GenRecordDieExportRequestSchema.extend({
    vendorName: z.string().nullable().optional(),
  }).passthrough();
export type RecordDieExportRequest = z.infer<
  typeof RecordDieExportRequestSchema
>;
