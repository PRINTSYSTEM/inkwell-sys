// src/Schema/plate-export.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema } from "./Common";

// ===== PlateExportResponse =====

export const PlateExportResponseSchema = z
  .object({
    id: IdSchema.optional(),
    plateVendorId: IdSchema.nullable().optional(),
    vendorName: z.string().nullable().optional(),
    plateCount: z.number().int().nullable().optional(),
    sentAt: DateSchema.nullable().optional(),
    receivedAt: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
  })
  .passthrough();

export type PlateExportResponse = z.infer<typeof PlateExportResponseSchema>;

// ===== RecordPlateExportRequest =====

export const RecordPlateExportRequestSchema = z
  .object({
    plateVendorId: IdSchema.nullable().optional(),
    vendorName: z.string().min(0).max(255).nullable().optional(),
    plateCount: z.number().int().min(1).max(6),
    sentAt: DateSchema.nullable().optional(),
    receivedAt: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type RecordPlateExportRequest = z.infer<
  typeof RecordPlateExportRequestSchema
>;
