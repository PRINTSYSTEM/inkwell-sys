// src/Schema/plate-export.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { IdSchema, DateSchema, createPagedResponseSchema } from "./Common";
import {
  PlateExportResponseSchema as GenPlateExportResponseSchema,
  PlateExportResponsePaginateSchema as GenPlateExportResponsePaginateSchema,
  RecordPlateExportRequestSchema as GenRecordPlateExportRequestSchema,
} from "./generated";

// ===== PlateExportResponse =====
export const PlateExportResponseSchema =
  GenPlateExportResponseSchema.passthrough();
export type PlateExportResponse = z.infer<typeof PlateExportResponseSchema>;

// ===== PagedResponse =====
export const PlateExportResponsePagedResponseSchema = createPagedResponseSchema(
  PlateExportResponseSchema
);
export type PlateExportResponsePagedResponse = z.infer<
  typeof PlateExportResponsePagedResponseSchema
>;

// Re-export generated paginate schema for compatibility
export {
  GenPlateExportResponsePaginateSchema as PlateExportResponsePaginateSchema,
};
export type PlateExportResponsePaginate = z.infer<
  typeof GenPlateExportResponsePaginateSchema
>;

// ===== RecordPlateExportRequest =====
// Extend generated schema to include vendorName for cases where vendor is not in system
export const RecordPlateExportRequestSchema =
  GenRecordPlateExportRequestSchema.extend({
    vendorName: z.string().nullable().optional(),
  }).passthrough();
export type RecordPlateExportRequest = z.infer<
  typeof RecordPlateExportRequestSchema
>;
