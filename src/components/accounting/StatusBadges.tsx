import { StatusBadge } from "@/components/ui/status-badge";
import {
  orderStatusLabels,
  paymentStatusLabels,
  customerTypeLabels,
} from "@/lib/status-utils";
import { PaymentStatus, InvoiceStatus } from "./InvoiceConfirmDialog";

interface OrderStatusBadgeProps {
  status: string | null;
  statusType: string | null;
  className?: string;
}

export function OrderStatusBadge({
  status,
  statusType,
  className,
}: OrderStatusBadgeProps) {
  const label =
    statusType || orderStatusLabels[status || ""] || status || "N/A";

  return <StatusBadge status={status} label={label} className={className} />;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const label = paymentStatusLabels[status] || status;

  return <StatusBadge status={status} label={label} className={className} />;
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const labelMap: Record<InvoiceStatus, string> = {
    not_issued: "Chưa xuất",
    issued: "Đã xuất",
  };
  const label = labelMap[status] || status;

  return <StatusBadge status={status} label={label} className={className} />;
}

interface CustomerTypeBadgeProps {
  type: string | null | undefined | unknown;
  className?: string;
}

export function CustomerTypeBadge({ type, className }: CustomerTypeBadgeProps) {
  if (!type || typeof type !== "string") return null;

  const label = customerTypeLabels[type] || type;

  return <StatusBadge status={type} label={label} className={className} />;
}

interface DebtStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function DebtStatusBadge({
  status,
  className,
}: DebtStatusBadgeProps) {
  if (!status || typeof status !== "string") return null;

  const labelMap: Record<string, string> = {
    good: "Tốt",
    warning: "Cảnh báo",
    blocked: "Bị chặn",
  };

  const label = labelMap[status] || status;

  return <StatusBadge status={status} label={label} className={className} />;
}
