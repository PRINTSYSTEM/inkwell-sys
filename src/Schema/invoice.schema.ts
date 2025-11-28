// src/Schema/invoice.schema.ts
import { z } from "zod";

/**
 * BE đang trả về string (có thể là mã hoá đơn hoặc URL file).
 * Swagger cho cả GET/POST /api/invoices/order/{orderId} đều là string.
 */
export const InvoiceResponseSchema = z.string();

/** Kiểu type cho invoice (string) */
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;

/**
 * Hiện tại POST không nhận body (chỉ có orderId trong path),
 * nên không cần CreateInvoiceRequest.
 * Nếu sau này BE thêm payload, lúc đó mới định nghĩa thêm.
 */
