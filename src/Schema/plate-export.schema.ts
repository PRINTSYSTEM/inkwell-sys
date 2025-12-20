// src/Schema/plate-export.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema } from "./Common";

// ===== PlateExportResponse =====

export const PlateExportResponseSchema = z
  .object({
    id: IdSchema.optional(),
    vendorName: z.string().nullable().optional(),
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
    vendorName: z.string().min(0).max(255), // Required in swagger, maxLength 255, minLength 0
    sentAt: DateSchema.nullable().optional(),
    receivedAt: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type RecordPlateExportRequest = z.infer<
  typeof RecordPlateExportRequestSchema
>;
