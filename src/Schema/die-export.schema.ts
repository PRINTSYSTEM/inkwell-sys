// src/Schema/die-export.schema.ts
import { z } from "zod";
import { IdSchema, DateSchema } from "./Common";

// ===== DieExportResponse =====

export const DieExportResponseSchema = z
  .object({
    id: IdSchema.optional(),
    imageUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: DateSchema.optional(),
  })
  .passthrough();

export type DieExportResponse = z.infer<typeof DieExportResponseSchema>;

// ===== RecordDieExportRequest =====

export const RecordDieExportRequestSchema = z
  .object({
    imageUrl: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .passthrough();

export type RecordDieExportRequest = z.infer<
  typeof RecordDieExportRequestSchema
>;
