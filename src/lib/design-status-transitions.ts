/**
 * Design Status Transition Logic
 *
 * Status Flow:
 * received_info → designing → waiting_for_customer_approval → editing/confirmed_for_printing
 *                                                             ↓
 *                                                    confirmed_for_printing (FINAL)
 */

export type DesignStatus =
  | "received_info"
  | "designing"
  | "editing"
  | "waiting_for_customer_approval"
  | "confirmed_for_printing";

export const designStatusLabels: Record<DesignStatus, string> = {
  received_info: "Nhận thông tin",
  designing: "Đang thiết kế",
  editing: "Đang chỉnh sửa",
  waiting_for_customer_approval: "Chờ khách duyệt",
  confirmed_for_printing: "Đã chốt in",
};

/**
 * Defines valid next statuses for each current status
 */
const statusTransitions: Record<DesignStatus, DesignStatus[]> = {
  received_info: ["designing"],
  designing: ["waiting_for_customer_approval"],
  waiting_for_customer_approval: ["editing", "confirmed_for_printing"],
  editing: ["waiting_for_customer_approval"],
  confirmed_for_printing: [], // Final status - no transitions allowed
};

/**
 * Get all valid next statuses for the current status
 */
export function getValidNextStatuses(
  currentStatus: DesignStatus
): DesignStatus[] {
  return statusTransitions[currentStatus] || [];
}

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: DesignStatus,
  newStatus: DesignStatus
): boolean {
  // If status hasn't changed, it's valid (no-op)
  if (currentStatus === newStatus) {
    return true;
  }

  const validNextStatuses = statusTransitions[currentStatus];
  return validNextStatuses.includes(newStatus);
}

/**
 * Get user-friendly error message for invalid transition
 */
export function getTransitionErrorMessage(
  currentStatus: DesignStatus,
  attemptedStatus: DesignStatus
): string {
  const currentLabel = designStatusLabels[currentStatus];
  const attemptedLabel = designStatusLabels[attemptedStatus];

  // Special case for final status
  if (currentStatus === "confirmed_for_printing") {
    return `Không thể thay đổi trạng thái từ "${currentLabel}" vì đây là trạng thái cuối cùng.`;
  }

  const validNextStatuses = getValidNextStatuses(currentStatus);

  if (validNextStatuses.length === 0) {
    return `Không thể thay đổi trạng thái từ "${currentLabel}".`;
  }

  const validLabels = validNextStatuses
    .map((status) => `"${designStatusLabels[status]}"`)
    .join(" hoặc ");

  return `Không thể chuyển từ "${currentLabel}" sang "${attemptedLabel}". Chỉ có thể chuyển sang ${validLabels}.`;
}

/**
 * Check if a status is the initial status
 */
export function isInitialStatus(status: DesignStatus): boolean {
  return status === "received_info";
}

/**
 * Check if a status is final (no further transitions)
 */
export function isFinalStatus(status: DesignStatus): boolean {
  return status === "confirmed_for_printing";
}
