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

export const PagedResponseBaseSchema = z
  .object({
    totalCount: z.number().int(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int().optional(),
    hasPreviousPage: z.boolean().optional(),
    hasNextPage: z.boolean().optional(),
  })
  .passthrough();

export type PagedResponseBase = z.infer<typeof PagedResponseBaseSchema>;

export const createPagedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  PagedResponseBaseSchema.extend({
    items: z.array(itemSchema).nullable().optional(),
  });

// ===== Backend error response =====

export const BackendErrorResponseSchema = z
  .object({
    statusCode: z.number().int(),
    error: z.string().nullable().optional(),
    timeStamp: DateSchema.optional(),
  })
  .passthrough();

export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>;
