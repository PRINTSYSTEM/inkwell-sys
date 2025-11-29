// src/lib/status-utils.ts

// ===== Label mapping cho các status =====

// Trạng thái đơn hàng
export const orderStatusLabels: Record<string, string> = {
  pending: "Nhận thông tin",
  waiting_for_proofing: "Chờ bình bài",
  proofed: "Đã bình bài",
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  completed: "Hoàn thành",
  invoice_issued: "Đã xuất hóa đơn",
  cancelled: "Hủy",
};

export function getStatusVariant(
  status: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (!status) return "default";

  const warningStatuses = [
    "pending",
    "payment_not_paid",
    "waiting_for_customer_approval",
    "waiting_for_production",
  ];
  const successStatuses = [
    "completed",
    "confirmed_for_printing",
    "pdf_exported",
    "fully_paid",
    "invoice_issued",
  ];
  const inProgressStatuses = [
    "designing",
    "editing",
    "in_production",
    "proofed",
    "deposited",
  ];

  if (successStatuses.includes(status)) return "success";
  if (warningStatuses.includes(status)) return "warning";
  if (inProgressStatuses.includes(status)) return "secondary";

  return "default";
}

// Mô tả chi tiết cho từng trạng thái đơn hàng (dùng ở dialog cập nhật)
export const orderStatusDescription: Record<string, string> = {
  pending: "Đơn hàng mới nhận, chưa phân công và chưa thiết kế.",
  waiting_for_proofing:
    "Tất cả thiết kế đã chốt in, chờ tạo hoặc xử lý bình bài.",
  proofed: "Đã bình bài xong, chờ tạo lệnh sản xuất.",
  waiting_for_production:
    "Đã có lệnh sản xuất, chờ bắt đầu sản xuất tại xưởng.",
  in_production: "Đang được in / gia công tại xưởng.",
  completed: "Sản xuất hoàn tất, chờ xuất hóa đơn / giao hàng.",
  invoice_issued: "Đã xuất hóa đơn cho đơn hàng.",
  cancelled: "Đơn hàng đã bị hủy.",
};

// Trạng thái thiết kế
export const designStatusLabels: Record<string, string> = {
  received_info: "Nhận thông tin",
  designing: "Đang thiết kế",
  editing: "Đang chỉnh sửa",
  waiting_for_customer_approval: "Chờ khách duyệt",
  confirmed_for_printing: "Đã chốt in",
  pdf_exported: "Đã xuất file PDF",
};

// Trạng thái bình bài (Proofing)
export const proofingStatusLabels: Record<string, string> = {
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  completed: "Hoàn thành",
};

// Trạng thái sản xuất
export const productionStatusLabels: Record<string, string> = {
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  completed: "Hoàn thành",
};

// Trạng thái thanh toán
export const paymentStatusLabels: Record<string, string> = {
  not_paid: "Chưa thanh toán",
  deposited: "Đã nhận cọc",
  fully_paid: "Đã thanh toán đủ",
};

// Loại khách hàng
export const customerTypeLabels: Record<string, string> = {
  retail: "Khách lẻ",
  company: "Khách công ty",
};

// Trạng thái chung (MaterialType, DesignType, ...)
export const commonStatusLabels: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
};

// Phương thức thanh toán
export const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  e_wallet: "Ví điện tử",
};

// ===== Helper format =====

export const formatCurrency = (
  value: number | null | undefined,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
  }
): string => {
  const val = typeof value === "number" ? value : 0;
  const { currency = "VND", minimumFractionDigits = 0 } = options || {};

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    }).format(val);
  } catch {
    // fallback đơn giản nếu Intl lỗi
    return `${val.toLocaleString("vi-VN")} ${currency}`;
  }
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTime = (
  value: string | Date | null | undefined
): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
