// src/Schema/paper-size.schema.ts
import { z } from "zod";
import { IdSchema } from "./common";

// ===== PaperSizeResponse =====

export const PaperSizeResponseSchema = z
  .object({
    id: IdSchema.optional(),
    name: z.string().nullable().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    isCustom: z.boolean().optional(), // boolean (not nullable) in swagger
  })
  .passthrough();

export type PaperSizeResponse = z.infer<typeof PaperSizeResponseSchema>;
