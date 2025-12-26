// src/Schema/paper-size.schema.ts
// Wrapper around generated schemas - keeps utilities and stable exports
import { z } from "zod";
import { PaperSizeResponseSchema as GenPaperSizeResponseSchema } from "./generated";

// ===== PaperSizeResponse =====
export const PaperSizeResponseSchema = GenPaperSizeResponseSchema.passthrough();
export type PaperSizeResponse = z.infer<typeof PaperSizeResponseSchema>;
