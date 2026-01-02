// src/lib/status-utils.ts
import { ENTITY_CONFIG } from "@/config/entities.config";

// ===== LABEL MAPPING CHO CÁC STATUS (từ ENTITY_CONFIG) =====

// Trạng thái đơn hàng
export const orderStatusLabels: Record<string, string> =
  ENTITY_CONFIG.orderStatuses.values;

// Mô tả chi tiết cho từng trạng thái đơn hàng (đồng bộ với ENTITY_CONFIG)
export const orderStatusDescription: Record<string, string> = {
  pending: "Đơn hàng vừa được tạo, mới nhận thông tin từ khách.",
  designing: "Đơn hàng đang được thiết kế.",
  waiting_for_customer_approval: "Đang chờ khách xem và duyệt thiết kế.",
  editing: "Đang chỉnh sửa theo yêu cầu khách.",
  confirmed_for_printing:
    "Khách đã chốt file in, có thể tạo bình bài / sản xuất.",
  waiting_for_deposit: "Khách cần đặt cọc trước khi tiếp tục xử lý đơn.",
  deposit_received: "Đã nhận tiền cọc từ khách.",
  debt_approved: "Khách công ty đã được duyệt công nợ.",
  waiting_for_proofing: "Chờ tạo mã bài.",
  waiting_for_production: "Chờ tạo lệnh sản xuất.",
  in_production: "Đơn đang được xử lý tại xưởng.",
  production_completed: "Sản xuất xong, chờ giao hàng / tất toán.",
  invoice_issued: "Đã xuất hóa đơn cho đơn hàng.",
  delivering: "Đang giao hàng cho khách.",
  completed: "Đơn hàng đã hoàn tất.",
  cancelled: "Đơn hàng bị hủy.",
};

// Trạng thái thiết kế (Design)
export const designStatusLabels: Record<string, string> =
  ENTITY_CONFIG.designStatuses.values;

// Trạng thái bình bài (ProofingOrder)
export const proofingStatusLabels: Record<string, string> =
  ENTITY_CONFIG.proofingOrderStatuses.values;

// Trạng thái sản xuất (Production)
export const productionStatusLabels: Record<string, string> =
  ENTITY_CONFIG.productionStatuses.values;

// Mô tả chi tiết cho từng trạng thái sản xuất (đồng bộ với ENTITY_CONFIG)
export const productionStatusDescription: Record<string, string> = {
  waiting_for_production:
    "Lệnh sản xuất đã được tạo, đang chờ bắt đầu sản xuất.",
  in_production: "Lệnh sản xuất đang được xử lý tại xưởng.",
  completed: "Lệnh sản xuất đã hoàn thành.",
  paused: "Lệnh sản xuất đang tạm dừng.",
};

// Trạng thái mục chi tiết đơn hàng (OrderDetail)
export const orderDetailItemStatusLabels: Record<string, string> =
  ENTITY_CONFIG.orderDetailItemStatuses.values;

export const orderDetailDerivedStatusLabels: Record<string, string> =
  ENTITY_CONFIG.orderDetailDerivedStatuses.values;

// Trạng thái thanh toán (Accounting)
export const paymentStatusLabels: Record<string, string> =
  ENTITY_CONFIG.paymentStatuses.values;

// Loại khách hàng
export const customerTypeLabels: Record<string, string> =
  ENTITY_CONFIG.customerTypes.values;

// Trạng thái chung (MaterialType, DesignType, ...)
export const commonStatusLabels: Record<string, string> =
  ENTITY_CONFIG.commonStatuses.values;

// Phương thức thanh toán
export const paymentMethodLabels: Record<string, string> =
  ENTITY_CONFIG.paymentMethods.values;

// Mapping từ code API (TM, CK, TT, etc.) sang key constants
const paymentMethodCodeToKey: Record<string, string> = {
  // Vietnamese codes
  tm: "cash",
  "tiền mặt": "cash",
  "tien mat": "cash",
  cash: "cash",
  // Bank transfer
  ck: "bank_transfer",
  "chuyển khoản": "bank_transfer",
  "chuyen khoan": "bank_transfer",
  "chuyển khoản ngân hàng": "bank_transfer",
  bank_transfer: "bank_transfer",
  "bank transfer": "bank_transfer",
  // Card
  tt: "card",
  thẻ: "card",
  the: "card",
  "thẻ tín dụng": "card",
  "the tin dung": "card",
  card: "card",
  // E-wallet
  "ví điện tử": "e_wallet",
  "vi dien tu": "e_wallet",
  e_wallet: "e_wallet",
  "e wallet": "e_wallet",
  wallet: "e_wallet",
};

// ===== HELPER FUNCTIONS FOR MAPPING RESPONSE FIELDS =====

/**
 * Map payment method code/name to Vietnamese label from constants
 * Falls back to provided name if not found in constants
 */
export function getPaymentMethodLabel(
  codeOrName: string | null | undefined,
  fallbackName?: string | null
): string {
  if (!codeOrName && !fallbackName) return "—";

  // Normalize inputs
  const normalizedCode = codeOrName?.toLowerCase().trim() || "";
  const normalizedFallback = fallbackName?.toLowerCase().trim() || "";

  // If fallbackName is already Vietnamese label from constants, use it directly
  if (normalizedFallback) {
    for (const label of Object.values(paymentMethodLabels)) {
      if (label.toLowerCase() === normalizedFallback) {
        return fallbackName!;
      }
    }
  }

  // Try to find in constants by code/name
  if (normalizedCode) {
    // First, try to map code to constant key (e.g., "tm" -> "cash", "ck" -> "bank_transfer")
    const constantKey = paymentMethodCodeToKey[normalizedCode];
    if (constantKey && paymentMethodLabels[constantKey]) {
      return paymentMethodLabels[constantKey];
    }

    // Direct match with keys in paymentMethodLabels (e.g., "cash", "bank_transfer")
    if (paymentMethodLabels[normalizedCode]) {
      return paymentMethodLabels[normalizedCode];
    }

    // Try partial match without underscores
    const normalizedNoUnderscore = normalizedCode.replace(/_/g, "");
    for (const [key, label] of Object.entries(paymentMethodLabels)) {
      const keyNoUnderscore = key.replace(/_/g, "");
      if (normalizedNoUnderscore === keyNoUnderscore) {
        return label;
      }
    }

    // Try to match with label values (in case name is already Vietnamese)
    for (const label of Object.values(paymentMethodLabels)) {
      if (label.toLowerCase() === normalizedCode) {
        return label;
      }
    }
  }

  // Fallback: if fallbackName exists and is not empty, use it
  if (fallbackName && fallbackName.trim()) {
    return fallbackName;
  }

  // Last resort: return codeOrName or "—"
  return codeOrName || "—";
}

/**
 * Get Vietnamese label for cash payment/receipt status
 */
export function getCashTransactionStatusLabel(
  status: string | null | undefined
): string {
  if (!status) return "—";

  const statusLower = status.toLowerCase();

  // Map common statuses
  if (statusLower.includes("draft") || statusLower === "draft") {
    return "Nháp";
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return "Đã duyệt";
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return "Đã hạch toán";
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return "Đã hủy";
  }

  // Return as-is if not mapped
  return status;
}

// Loại cán màng (LaminationType)
export const laminationTypeLabels: Record<string, string> =
  ENTITY_CONFIG.laminationTypes.values;

// Loại mặt (SidesClassification)
export const sidesClassificationLabels: Record<string, string> =
  ENTITY_CONFIG.sidesClassification.values;

// Loại quy trình (ProcessClassification)
export const processClassificationLabels: Record<string, string> =
  ENTITY_CONFIG.processClassification.values;

// Loại nhà cung cấp (VendorType)
export const vendorTypeLabels: Record<string, string> =
  ENTITY_CONFIG.vendorTypes.values;

// Vai trò người dùng (Role)
export const roleLabels: Record<string, string> = ENTITY_CONFIG.roles.values;

// Trạng thái phiếu giao hàng (DeliveryNote)
export const deliveryNoteStatusLabels: Record<string, string> =
  ENTITY_CONFIG.deliveryNoteStatuses.values;

// Trạng thái dòng giao hàng (DeliveryNoteLine)
export const deliveryLineStatusLabels: Record<string, string> =
  ENTITY_CONFIG.deliveryLineStatuses.values;

// Trạng thái công nợ khách hàng (Customer Debt)
export const debtStatusLabels: Record<string, string> =
  ENTITY_CONFIG.debtStatuses.values;

// ===== DESIGN STATUS CONFIG (cho UI) =====
export type DesignStatusKey = keyof typeof ENTITY_CONFIG.designStatuses.values;

export const designStatusConfig: Record<
  DesignStatusKey,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  received_info: {
    label: ENTITY_CONFIG.designStatuses.values.received_info,
    color: "bg-slate-100 text-slate-700 border-slate-300",
    bgColor: "bg-slate-50",
  },
  designing: {
    label: ENTITY_CONFIG.designStatuses.values.designing,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    bgColor: "bg-blue-50",
  },
  editing: {
    label: ENTITY_CONFIG.designStatuses.values.editing,
    color: "bg-amber-100 text-amber-700 border-amber-300",
    bgColor: "bg-amber-50",
  },
  waiting_for_customer_approval: {
    label: ENTITY_CONFIG.designStatuses.values.waiting_for_customer_approval,
    color: "bg-orange-100 text-orange-700 border-orange-300",
    bgColor: "bg-orange-50",
  },
  confirmed_for_printing: {
    label: ENTITY_CONFIG.designStatuses.values.confirmed_for_printing,
    color: "bg-green-100 text-green-700 border-green-300",
    bgColor: "bg-green-50",
  },
};

// ===== VARIANT CŨ (CHO CÁC CHỖ ĐÃ DÙNG) =====

export function getStatusVariant(
  status: string | null
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  if (!status) return "default";

  const warningStatuses = [
    "pending",
    "waiting_for_customer_approval",
    "waiting_for_proofing",
    "waiting_for_production",
    "waiting_for_file",
    "waiting_for_deposit",
    "not_paid",
    "not_completed",
    "draft",
    "failed_reschedule",
  ];

  const successStatuses = [
    "confirmed_for_printing",
    "debt_approved",
    "production_completed",
    "completed",
    "fully_paid",
    "invoice_issued",
    "delivered",
  ];

  const inProgressStatuses = [
    "designing",
    "editing",
    "in_production",
    "deposit_received",
    "delivering",
    "confirmed",
    "ready_to_ship",
    "handed_over",
    "in_transit",
    "partially_completed",
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
  // ===== ORDER STATUSES =====
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  designing: "bg-blue-50 text-blue-700 border-blue-200",
  editing: "bg-sky-50 text-sky-700 border-sky-200",
  waiting_for_customer_approval: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed_for_printing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting_for_deposit: "bg-amber-100 text-amber-800 border-amber-300",
  deposit_received: "bg-indigo-50 text-indigo-700 border-indigo-200",
  debt_approved: "bg-green-50 text-green-700 border-green-200",
  waiting_for_proofing: "bg-violet-50 text-violet-700 border-violet-200",
  waiting_for_production: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_production: "bg-cyan-50 text-cyan-700 border-cyan-200",
  production_completed: "bg-green-50 text-green-700 border-green-200",
  invoice_issued: "bg-teal-50 text-teal-700 border-teal-200",
  delivering: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",

  // ===== DESIGN STATUSES (dùng chung với Order) =====
  received_info: "bg-slate-100 text-slate-800 border-slate-200",

  // ===== PROOFING ORDER STATUSES =====
  not_completed: "bg-slate-100 text-slate-800 border-slate-200",
  // completed đã được định nghĩa ở ORDER STATUSES ở trên
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",

  // ===== ORDER DETAIL ITEM STATUSES (dùng chung với Order) =====
  // waiting_for_proofing, waiting_for_production, in_production,
  // production_completed, delivering, completed đã được định nghĩa ở trên

  // ===== PRODUCTION STATUSES =====
  // waiting_for_production, in_production, completed đã được định nghĩa ở trên
  // paused cho production (khác với paused của proofing)
  // paused: "bg-yellow-50 text-yellow-700 border-yellow-200", // đã được định nghĩa ở PROOFING ORDER STATUSES

  // ===== PAYMENT =====
  not_paid: "bg-rose-50 text-rose-700 border-rose-200",
  deposited: "bg-amber-50 text-amber-700 border-amber-200",
  fully_paid: "bg-green-50 text-green-700 border-green-200",

  // ===== INVOICE =====
  not_issued: "bg-amber-50 text-amber-700 border-amber-200",
  issued: "bg-green-50 text-green-700 border-green-200",

  // ===== CUSTOMER TYPE =====
  retail: "bg-blue-50 text-blue-700 border-blue-200",
  company: "bg-purple-50 text-purple-700 border-purple-200",

  // ===== COMMON =====
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-800 border-slate-200",

  // ===== LAMINATION TYPES =====
  glossy: "bg-blue-50 text-blue-700 border-blue-200",
  matte: "bg-slate-50 text-slate-700 border-slate-200",

  // ===== SIDES CLASSIFICATION =====
  one_side: "bg-indigo-50 text-indigo-700 border-indigo-200",
  two_side: "bg-purple-50 text-purple-700 border-purple-200",

  // ===== PROCESS CLASSIFICATION =====
  cut: "bg-cyan-50 text-cyan-700 border-cyan-200",
  die_cut: "bg-teal-50 text-teal-700 border-teal-200",

  // ===== VENDOR TYPES =====
  plate: "bg-blue-50 text-blue-700 border-blue-200",
  die: "bg-violet-50 text-violet-700 border-violet-200",

  // ===== DELIVERY NOTE STATUSES =====
  draft: "bg-slate-100 text-slate-800 border-slate-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  ready_to_ship: "bg-cyan-50 text-cyan-700 border-cyan-200",
  handed_over: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_transit: "bg-blue-50 text-blue-700 border-blue-200",
  partially_completed: "bg-amber-50 text-amber-700 border-amber-200",
  // completed đã được định nghĩa ở ORDER STATUSES ở trên
  // cancelled đã được định nghĩa ở ORDER STATUSES ở trên

  // ===== DELIVERY LINE STATUSES =====
  // pending đã được định nghĩa ở ORDER STATUSES ở trên
  // delivered: sử dụng màu xanh lá cho thành công (tương tự completed)
  failed_reschedule: "bg-orange-50 text-orange-700 border-orange-200",
  returned: "bg-rose-50 text-rose-700 border-rose-200",
  // cancelled đã được định nghĩa ở ORDER STATUSES ở trên

  // ===== DEBT STATUSES =====
  normal: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  exceeded: "bg-red-50 text-red-700 border-red-200",
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
