// src/Schema/plate-export.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema } from "./common";

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
    vendorName: z
      .string()
      .min(1, "Tên nhà cung cấp là bắt buộc")
      .max(255, "Tên nhà cung cấp không được vượt quá 255 ký tự"),
    sentAt: DateSchema.nullable().optional(),
    receivedAt: DateSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type RecordPlateExportRequest = z.infer<
  typeof RecordPlateExportRequestSchema
>;
