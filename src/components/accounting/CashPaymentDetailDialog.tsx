import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  CreditCard,
  CheckCircle2,
  Printer,
  Loader2,
  AlertCircle,
  Building2,
  DollarSign,
  Wallet,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useCashPayment,
  useApproveCashPayment,
  usePostCashPayment,
  useExportCashPaymentPDF,
} from "@/hooks/use-cash";
import { formatCurrency } from "@/lib/status-utils";
import { useQueryClient } from "@tanstack/react-query";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;

  const statusLower = status.toLowerCase();
  if (statusLower.includes("draft") || statusLower === "draft") {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return <StatusBadge status="approved" label="Đã duyệt" />;
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return <StatusBadge status="posted" label="Đã hạch toán" />;
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
};

interface CashPaymentDetailDialogProps {
  paymentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentUpdated?: () => void;
}

export function CashPaymentDetailDialog({
  paymentId,
  open,
  onOpenChange,
  onPaymentUpdated,
}: CashPaymentDetailDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor"] });
      queryClient.invalidateQueries({ queryKey: ["cash-payments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      if (onPaymentUpdated) onPaymentUpdated();
    }
    onOpenChange(newOpen);
  };

  const {
    data: payment,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashPayment(paymentId, open && !!paymentId);

  const approveMutation = useApproveCashPayment();
  const postMutation = usePostCashPayment();
  const { mutate: exportToPDF, isPending: isExportingPDF } =
    useExportCashPaymentPDF();

  const isDraft = payment?.status?.toLowerCase() === "draft";
  const isApproved = payment?.status?.toLowerCase() === "approved";
  const canApprove = isDraft;
  const canPost = isApproved;

  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleApprove = () => {
    if (!payment?.id) return;
    approveMutation.mutate(payment.id, {
      onSuccess: () => {
        refetch();
        if (onPaymentUpdated) onPaymentUpdated();
      },
    });
  };

  const handlePost = () => {
    if (!payment?.id) return;
    postMutation.mutate(payment.id, {
      onSuccess: () => {
        refetch();
        if (onPaymentUpdated) onPaymentUpdated();
      },
    });
  };

  const handleApproveAndPost = async () => {
    if (!payment?.id) return;
    setIsProcessingAction(true);
    try {
      await approveMutation.mutateAsync(payment.id);
      await postMutation.mutateAsync(payment.id);
      refetch();
      if (onPaymentUpdated) onPaymentUpdated();
    } catch {
      // Handled by mutation errors
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Wallet className="h-5 w-5 text-rose-600 shrink-0" />
                <span>Phiếu chi {payment?.code || (payment?.id ? `#${payment.id}` : "")}</span>
                {payment && getStatusBadge(payment.status)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {payment?.createdAt ? `Tạo lúc ${formatDateTime(payment.createdAt)}` : "Thông tin chi tiết phiếu chi"}
                {payment?.createdByName && ` bởi ${payment.createdByName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground text-sm">Đang tải thông tin phiếu chi...</p>
            </div>
          </div>
        ) : isError || !payment ? (
          <div className="py-10 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-sm font-semibold">Không thể tải thông tin phiếu chi</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Phiếu chi không tồn tại hoặc đã bị xóa."}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Amount Banner */}
            <Card className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-rose-800 uppercase tracking-wider">Số tiền chi</div>
                  <div className="text-2xl font-bold text-rose-700 mt-0.5 tabular-nums">
                    {formatCurrency(payment.amount || 0)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border bg-slate-50/50 space-y-2.5">
                <div className="font-semibold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  Thông tin đối tác & lý do
                </div>
                <div>
                  <span className="text-muted-foreground block">Người nhận tiền:</span>
                  <span className="font-semibold text-slate-900">{payment.receiverName || "—"}</span>
                </div>
                {payment.vendorName && (
                  <div>
                    <span className="text-muted-foreground block">Nhà cung cấp:</span>
                    <span className="font-medium text-blue-600">{payment.vendorName}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block">Lý do chi:</span>
                  <span className="font-medium text-slate-800">{payment.reason || "—"}</span>
                </div>
                {payment.expenseCategoryName && (
                  <div>
                    <span className="text-muted-foreground block">Khoản mục chi:</span>
                    <span className="font-medium text-slate-800">{payment.expenseCategoryName}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg border bg-slate-50/50 space-y-2.5">
                <div className="font-semibold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  Thanh toán & Chứng từ
                </div>
                <div>
                  <span className="text-muted-foreground block">Phương thức thanh toán:</span>
                  <span className="font-semibold text-slate-900">{payment.paymentMethodName || "—"}</span>
                </div>
                {(payment.bankName || payment.bankAccountNumber) && (
                  <div>
                    <span className="text-muted-foreground block">Tài khoản ngân hàng:</span>
                    <span className="font-medium text-slate-800">
                      {payment.bankName} - {payment.bankAccountNumber}
                    </span>
                  </div>
                )}
                {payment.financeAccountCode && (
                  <div>
                    <span className="text-muted-foreground block">Quỹ tiền mặt:</span>
                    <span className="font-medium text-slate-800">{payment.financeAccountCode}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground block">Ngày chứng từ:</span>
                    <span className="font-medium">{formatDate(payment.voucherDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ngày hạch toán:</span>
                    <span className="font-medium">{formatDate(payment.postingDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional info if available */}
            {(payment.orderCode || payment.invoiceNumber || payment.notes) && (
              <div className="p-3 rounded-lg border text-xs space-y-2">
                {payment.orderCode && (
                  <div>
                    <span className="text-muted-foreground">Đơn hàng liên quan: </span>
                    <span className="font-semibold text-slate-800">{String(payment.orderCode)}</span>
                  </div>
                )}
                {payment.invoiceNumber && (
                  <div>
                    <span className="text-muted-foreground">Số hóa đơn: </span>
                    <span className="font-semibold text-slate-800">{String(payment.invoiceNumber)}</span>
                  </div>
                )}
                {payment.notes && (
                  <div>
                    <span className="text-muted-foreground block">Ghi chú:</span>
                    <p className="text-slate-700 bg-white p-2 rounded border mt-0.5 whitespace-pre-wrap">
                      {payment.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator className="my-2" />

        <DialogFooter className="flex-col sm:flex-row gap-2 justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            {canApprove && (
              <Button
                size="sm"
                variant="default"
                onClick={handleApproveAndPost}
                disabled={approveMutation.isPending || postMutation.isPending || isProcessingAction}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isProcessingAction || approveMutation.isPending || postMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                Duyệt & Ghi sổ
              </Button>
            )}

            {canPost && (
              <Button
                size="sm"
                variant="default"
                onClick={handlePost}
                disabled={postMutation.isPending}
                className="h-8 text-xs"
              >
                {postMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 mr-1" />
                )}
                Ghi sổ
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => payment?.id && exportToPDF(payment.id)}
              disabled={isExportingPDF || !payment?.id}
              className="h-8 text-xs"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 mr-1 text-red-600" />
              )}
              Xuất PDF
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => payment?.id && exportToPDF(payment.id)}
              disabled={isExportingPDF || !payment?.id}
              className="h-8 text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              In
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleClose(false)}
              className="h-8 text-xs"
            >
              Đóng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
