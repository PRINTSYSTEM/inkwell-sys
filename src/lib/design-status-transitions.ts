/**
 * Design Status Transition Logic
 *
 * Status Flow:
 * received_info → designing → waiting_for_customer_approval → editing/confirmed_for_printing
 *                                                             ↓
 *                                                    confirmed_for_printing (FINAL)
 * returned → editing (can only go to editing status)
 */

import { designStatusLabels } from "./status-utils";

export type DesignStatus =
  | "received_info"
  | "designing"
  | "editing"
  | "waiting_for_customer_approval"
  | "confirmed_for_printing"
  | "returned"
  | "cancelled";

/**
 * Defines valid next statuses for each current status
 */
const statusTransitions: Record<DesignStatus, DesignStatus[]> = {
  received_info: ["designing"],
  designing: ["waiting_for_customer_approval"],
  waiting_for_customer_approval: ["editing", "confirmed_for_printing"],
  editing: ["waiting_for_customer_approval"],
  confirmed_for_printing: [], // Final status - no further transitions allowed
  returned: ["editing"], // Returned designs can only go to editing
  cancelled: [], // Terminal status
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
  const currentLabel = designStatusLabels[currentStatus] || currentStatus;
  const attemptedLabel = designStatusLabels[attemptedStatus] || attemptedStatus;

  // Special case for final status
  if (currentStatus === "confirmed_for_printing" || currentStatus === "cancelled") {
    return `Không thể thay đổi trạng thái từ "${currentLabel}" vì đây là trạng thái cuối cùng.`;
  }

  const validNextStatuses = getValidNextStatuses(currentStatus);

  if (validNextStatuses.length === 0) {
    return `Không thể thay đổi trạng thái từ "${currentLabel}".`;
  }

  const validLabels = validNextStatuses
    .map((status) => `"${designStatusLabels[status] || status}"`)
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
  return status === "confirmed_for_printing" || status === "cancelled";
}
