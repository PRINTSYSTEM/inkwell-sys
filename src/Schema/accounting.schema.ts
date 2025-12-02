// src/Schema/accounting.schema.ts
import { z } from "zod";

/**
 * Phương thức thanh toán
 * - cash: tiền mặt
 * - bank_transfer: chuyển khoản
 * - card: thẻ
 * - e_wallet: ví điện tử (Momo, ZaloPay, ...)
 */
export const PaymentMethodEnum = z.enum(
  ["cash", "bank_transfer", "card", "e_wallet"],
  {
    required_error: "Phương thức thanh toán là bắt buộc",
    invalid_type_error: "Phương thức thanh toán không hợp lệ",
  }
);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

/**
 * Trạng thái thanh toán của đơn
 * - not_paid: chưa thanh toán
 * - deposited: đã nhận cọc
 * - fully_paid: đã thanh toán đủ
 */
export const PaymentStatusEnum = z.enum(
  ["not_paid", "deposited", "fully_paid"],
  {
    required_error: "Trạng thái thanh toán là bắt buộc",
    invalid_type_error: "Trạng thái thanh toán không hợp lệ",
  }
);

export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

/**
 * Thông tin thanh toán gắn với đơn hàng
 * (dùng cho FE validate khi nhận cọc / thanh toán)
 */
export const PaymentInfoSchema = z.object({
  totalAmount: z
    .number({
      required_error: "Tổng tiền là bắt buộc",
      invalid_type_error: "Tổng tiền không hợp lệ",
    })
    .min(0, { message: "Tổng tiền không được âm" }),

  depositAmount: z
    .number({
      invalid_type_error: "Số tiền cọc không hợp lệ",
    })
    .min(0, { message: "Số tiền cọc không được âm" })
    .default(0),

  remainingAmount: z
    .number({
      invalid_type_error: "Số tiền còn lại không hợp lệ",
    })
    .min(0, { message: "Số tiền còn lại không được âm" })
    .default(0),

  paymentStatus: PaymentStatusEnum,

  paymentMethod: PaymentMethodEnum.optional(),

  // ghi chú của kế toán / thu ngân
  paymentNote: z
    .string()
    .max(500, {
      message: "Ghi chú thanh toán không được vượt quá 500 ký tự",
    })
    .optional(),

  // thời điểm đã thanh toán đủ (nếu có)
  fullyPaidAt: z.string().datetime().optional(),
});

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;
