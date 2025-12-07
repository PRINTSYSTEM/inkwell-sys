// src/Schema/accounting.schema.ts
import { z } from "zod";

export const DebtComparisonFileResponseSchema = z.string();
export type DebtComparisonFileResponse = z.infer<
  typeof DebtComparisonFileResponseSchema
>;
