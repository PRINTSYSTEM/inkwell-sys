// src/Schema/common/base.ts
import { z } from "zod";
// ===== Primitive helpers =====

export const IdSchema = z.number().int();
export type Id = z.infer<typeof IdSchema>;

export const DateSchema = z.string(); // ISO date-time string from backend
export type DateString = z.infer<typeof DateSchema>;

export const NameSchema = z.string().max(255);
export type Name = z.infer<typeof NameSchema>;

// ===== PagedResponse base =====
// Updated to match swagger.json pagination structure: size, page, total, totalPages, items

export const PagedResponseBaseSchema = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(z.any()).nullable().optional(),
  })
  .passthrough();

export type PagedResponseBase = z.infer<typeof PagedResponseBaseSchema>;

export const createPagedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(itemSchema).nullable().optional(),
  });

// ===== Backend error response =====
// Updated to match swagger.json ErrorResponse

export const BackendErrorResponseSchema = z
  .object({
    statusCode: z.number().int(),
    error: z.string().nullable().optional(),
    timeStamp: DateSchema.optional(),
    details: z.record(z.unknown()).nullable().optional(), // Added from swagger
  })
  .passthrough();

export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>;
