import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, AlertTriangle } from "lucide-react";
import { OrderResponse } from "@/Schema";
import { ENTITY_CONFIG } from "@/config/entities.config";

// Type definitions for accounting components
export type PaymentStatus = keyof typeof ENTITY_CONFIG.paymentStatuses.values;
export type InvoiceStatus = "not_issued" | "issued";

export interface OrderWithAccounting extends OrderResponse {
  paymentStatus: PaymentStatus;
  invoiceStatus?: InvoiceStatus;
  invoiceId?: string;
}

interface InvoiceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithAccounting | null;
  onConfirm: (orderId: number) => void;
}

export function InvoiceConfirmDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
}: InvoiceConfirmDialogProps) {
  if (!order) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handleConfirm = () => {
    onConfirm(order.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Xác nhận xuất hóa đơn
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Bạn có chắc chắn muốn xuất hóa đơn cho đơn hàng{" "}
                <span className="font-medium text-foreground">
                  {order.code}
                </span>
                ?
              </p>

              {/* Order summary */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="font-medium text-foreground">
                    {order.customer.companyName || order.customer.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giá trị:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-left">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-sm text-warning">
                  Hành động này không thể hoàn tác. Hóa đơn sẽ được ghi nhận vào
                  hệ thống.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Xác nhận xuất hóa đơn
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
