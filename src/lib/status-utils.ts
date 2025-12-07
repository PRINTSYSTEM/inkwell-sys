// src/lib/status-utils.ts

// ===== LABEL MAPPING CHO CÁC STATUS =====

// Trạng thái đơn hàng (theo enum mới)
export const orderStatusLabels: Record<string, string> = {
  pending: "Nhận thông tin",
  designing: "Đang thiết kế",
  waiting_for_customer_approval: "Chờ khách duyệt",
  editing: "Đang chỉnh sửa",
  confirmed_for_printing: "Đã chốt in",
  waiting_for_proofing: "Chờ bình bài",
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  production_completed: "Hoàn thành sản xuất",
  completed: "Hoàn thành",
  cancelled: "Hủy",
};

// Mô tả chi tiết cho từng trạng thái đơn hàng
export const orderStatusDescription: Record<string, string> = {
  pending: "Đơn hàng vừa được tạo, mới nhận thông tin từ khách.",
  designing:
    "Đơn hàng đang trong giai đoạn thiết kế, chưa gửi khách duyệt hoặc chốt in.",
  waiting_for_customer_approval:
    "Đã có file thiết kế, đang chờ khách hàng xem và duyệt.",
  editing:
    "Khách yêu cầu chỉnh sửa, thiết kế đang được cập nhật theo feedback.",
  confirmed_for_printing:
    "Khách đã chốt file in, có thể tiến hành bình bài / lên lệnh sản xuất.",
  waiting_for_proofing:
    "Tất cả thiết kế trong đơn đã chốt in, chờ tạo và xử lý lệnh bình bài.",
  waiting_for_production:
    "Đã có thông tin bình bài, chờ tạo / xử lý lệnh sản xuất.",
  in_production: "Đơn hàng đang được in / gia công tại xưởng.",
  production_completed:
    "Đã hoàn thành toàn bộ công đoạn sản xuất, chờ giao hàng / tất toán.",
  completed: "Đơn hàng đã hoàn thành toàn bộ quy trình.",
  cancelled: "Đơn hàng đã bị hủy, không tiếp tục xử lý.",
};

// Trạng thái thiết kế (Design)
export const designStatusLabels: Record<string, string> = {
  received_info: "Nhận thông tin",
  designing: "Đang thiết kế",
  editing: "Đang chỉnh sửa",
  waiting_for_customer_approval: "Chờ khách duyệt",
  confirmed_for_printing: "Đã chốt in",
};

// Trạng thái bình bài (ProofingOrder)
export const proofingStatusLabels: Record<string, string> = {
  waiting_for_file: "Chờ file in",
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  completed: "Hoàn thành",
};

// Trạng thái sản xuất (Production)
export const productionStatusLabels: Record<string, string> = {
  waiting_for_production: "Chờ sản xuất",
  in_production: "Đang sản xuất",
  completed: "Hoàn thành",
};

// Trạng thái thanh toán (Accounting)
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

// ===== VARIANT CŨ (CHO CÁC CHỖ ĐÃ DÙNG) =====

export function getStatusVariant(
  status: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (!status) return "default";

  // Nhóm trạng thái cảnh báo / chờ
  const warningStatuses = [
    "pending",
    "waiting_for_customer_approval",
    "waiting_for_proofing",
    "waiting_for_production",
    "waiting_for_file",
    "not_paid",
  ];

  // Nhóm trạng thái đã ok / thành công
  const successStatuses = [
    "confirmed_for_printing",
    "production_completed",
    "completed",
    "fully_paid",
  ];

  // Nhóm trạng thái đang xử lý
  const inProgressStatuses = [
    "designing",
    "editing",
    "in_production",
    "deposited",
  ];

  if (successStatuses.includes(status)) return "success";
  if (warningStatuses.includes(status)) return "warning";
  if (inProgressStatuses.includes(status)) return "secondary";

  if (status === "cancelled") return "destructive";

  return "default";
}

// ===== COLOR MAPPING TỪNG STATUS (TAILWIND CLASS) =====

// Mỗi trạng thái một màu, vẫn tuân flow:
// - xám / vàng: pending, waiting, not_paid
// - xanh dương / tím / cyan: đang xử lý (designing, editing, in_production, proofing,...)
// - xanh lá / emerald: các trạng thái done / confirmed / fully_paid
// - đỏ: cancelled / not_paid (nếu muốn nhấn mạnh)
export const statusColorMap: Record<string, string> = {
  // ===== ORDER =====
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  designing: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_for_customer_approval: "bg-amber-50 text-amber-700 border-amber-200",
  editing: "bg-sky-50 text-sky-700 border-sky-200",
  confirmed_for_printing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_for_proofing: "bg-violet-50 text-violet-700 border-violet-200",
  waiting_for_production: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_production: "bg-cyan-50 text-cyan-700 border-cyan-200",
  production_completed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",

  // ===== DESIGN =====
  received_info: "bg-slate-100 text-slate-800 border-slate-200",
  // designing, editing, waiting_for_customer_approval, confirmed_for_printing dùng lại như Order

  // ===== PROOFING ORDER =====
  waiting_for_file: "bg-slate-100 text-slate-800 border-slate-200",
  // waiting_for_production, in_production, completed trùng key dùng lại ở trên

  // ===== PRODUCTION =====
  // waiting_for_production, in_production, completed: reuse

  // ===== PAYMENT =====
  not_paid: "bg-rose-50 text-rose-700 border-rose-200",
  deposited: "bg-amber-50 text-amber-700 border-amber-200",
  fully_paid: "bg-green-50 text-green-700 border-green-200",

  // ===== COMMON =====
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-800 border-slate-200",
};

// Hàm helper: trả về class tailwind cho badge
export function getStatusColorClass(status?: string | null): string {
  if (!status) {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }
  return (
    statusColorMap[status] ?? "bg-slate-100 text-slate-800 border-slate-200" // fallback
  );
}

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
