// src/Schema/invoice.schema.ts
import { z } from "zod";

export const InvoiceFileResponseSchema = z.string();
export type InvoiceFileResponse = z.infer<typeof InvoiceFileResponseSchema>;
