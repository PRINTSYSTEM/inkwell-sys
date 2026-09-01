import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  Calendar,
  User,
  CreditCard,
  Landmark,
  CheckCircle2,
  FileText,
  Printer,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building2,
  DollarSign,
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
  useCashReceipt,
  useApproveCashReceipt,
  usePostCashReceipt,
  useExportCashReceiptPDF,
} from "@/hooks/use-cash";
import { formatCurrency } from "@/lib/status-utils";

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

import { useQueryClient } from "@tanstack/react-query";

interface CashReceiptDetailDialogProps {
  receiptId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceiptUpdated?: () => void;
}

export function CashReceiptDetailDialog({
  receiptId,
  open,
  onOpenChange,
  onReceiptUpdated,
}: CashReceiptDetailDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-book"] });
      queryClient.invalidateQueries({ queryKey: ["ar-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ar-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ar-aging"] });
      queryClient.invalidateQueries({ queryKey: ["ar-ledger-list"] });
      queryClient.invalidateQueries({ queryKey: ["ar-ledger-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ar-detail-ledger"] });
      if (onReceiptUpdated) onReceiptUpdated();
    }
    onOpenChange(newOpen);
  };

  const {
    data: receipt,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashReceipt(receiptId, open && !!receiptId);

  const approveMutation = useApproveCashReceipt();
  const postMutation = usePostCashReceipt();
  const { mutate: exportToPDF, loading: isExportingPDF } =
    useExportCashReceiptPDF();

  const isDraft = receipt?.status?.toLowerCase() === "draft";
  const isApproved = receipt?.status?.toLowerCase() === "approved";
  const canApprove = isDraft;
  const canPost = isApproved;

  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleApprove = () => {
    if (!receipt?.id) return;
    approveMutation.mutate(receipt.id, {
      onSuccess: () => {
        refetch();
        if (onReceiptUpdated) onReceiptUpdated();
      },
    });
  };

  const handlePost = () => {
    if (!receipt?.id) return;
    postMutation.mutate(receipt.id, {
      onSuccess: () => {
        refetch();
        if (onReceiptUpdated) onReceiptUpdated();
      },
    });
  };

  const handleApproveAndPost = async () => {
    if (!receipt?.id) return;
    setIsProcessingAction(true);
    try {
      await approveMutation.mutateAsync(receipt.id);
      await postMutation.mutateAsync(receipt.id);
      refetch();
      if (onReceiptUpdated) onReceiptUpdated();
    } catch (error) {
      // Error is handled by mutations
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleNavigateToFullPage = () => {
    if (!receipt?.id) return;
    onOpenChange(false);
    navigate(`/accounting/cash-receipts/${receipt.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Phiếu thu {receipt?.code || (receipt?.id ? `#${receipt.id}` : "")}</span>
                {receipt && getStatusBadge(receipt.status)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {receipt?.createdAt ? `Tạo lúc ${formatDateTime(receipt.createdAt)}` : "Thông tin chi tiết phiếu thu"}
                {receipt?.createdByName && ` bởi ${receipt.createdByName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground text-sm">Đang tải thông tin phiếu thu...</p>
            </div>
          </div>
        ) : isError || !receipt ? (
          <div className="py-10 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-sm font-semibold">Không thể tải thông tin phiếu thu</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Phiếu thu không tồn tại hoặc đã bị xóa."}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Amount Banner */}
            <Card className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Số tiền thu</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-0.5 tabular-nums">
                    {formatCurrency(receipt.amount || 0)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
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
                  <span className="text-muted-foreground block">Người nộp tiền:</span>
                  <span className="font-semibold text-slate-900">{receipt.payerName || "—"}</span>
                </div>
                {receipt.customerName && (
                  <div>
                    <span className="text-muted-foreground block">Khách hàng:</span>
                    <span className="font-medium text-blue-600">{receipt.customerName}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block">Lý do thu:</span>
                  <span className="font-medium text-slate-800">{receipt.reason || "—"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-slate-50/50 space-y-2.5">
                <div className="font-semibold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  Thanh toán & Chứng từ
                </div>
                <div>
                  <span className="text-muted-foreground block">Phương thức thanh toán:</span>
                  <span className="font-semibold text-slate-900">{receipt.paymentMethodName || "—"}</span>
                </div>
                {(receipt.bankName || receipt.bankAccountNumber) && (
                  <div>
                    <span className="text-muted-foreground block">Ngân hàng nhận:</span>
                    <span className="font-medium text-slate-800">
                      {receipt.bankName} - {receipt.bankAccountNumber}
                    </span>
                  </div>
                )}
                {receipt.financeAccountCode && (
                  <div>
                    <span className="text-muted-foreground block">Quỹ tiền mặt:</span>
                    <span className="font-medium text-slate-800">{receipt.financeAccountCode}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-muted-foreground block">Ngày chứng từ:</span>
                    <span className="font-medium">{formatDate(receipt.voucherDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ngày hạch toán:</span>
                    <span className="font-medium">{formatDate(receipt.postingDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional info if available */}
            {(receipt.orderCode || receipt.invoiceNumber || receipt.notes) && (
              <div className="p-3 rounded-lg border text-xs space-y-2">
                {receipt.orderCode && (
                  <div>
                    <span className="text-muted-foreground">Đơn hàng liên quan: </span>
                    <span className="font-semibold text-slate-800">{receipt.orderCode}</span>
                  </div>
                )}
                {receipt.invoiceNumber && (
                  <div>
                    <span className="text-muted-foreground">Số hóa đơn: </span>
                    <span className="font-semibold text-slate-800">{receipt.invoiceNumber}</span>
                  </div>
                )}
                {receipt.notes && (
                  <div>
                    <span className="text-muted-foreground block">Ghi chú:</span>
                    <p className="text-slate-700 bg-white p-2 rounded border mt-0.5 whitespace-pre-wrap">
                      {receipt.notes}
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
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApproveAndPost}
                  disabled={approveMutation.isPending || postMutation.isPending || isProcessingAction}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isProcessingAction || approveMutation.isPending || postMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  Duyệt & Ghi sổ
                </Button>
              </>
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
              onClick={() => receipt?.id && exportToPDF(receipt.id)}
              disabled={isExportingPDF || !receipt?.id}
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
              onClick={() => receipt?.id && exportToPDF(receipt.id)}
              disabled={isExportingPDF || !receipt?.id}
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
