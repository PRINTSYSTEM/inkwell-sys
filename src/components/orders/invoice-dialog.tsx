// src/components/orders/invoice-dialog.tsx
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInvoicesByOrder, useCreateInvoice } from "@/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/status-utils";
import { ExternalLink, FileText, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type InvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  isCustomerInfoComplete?: boolean;
};

export function InvoiceDialog({
  open,
  onOpenChange,
  orderId,
  isCustomerInfoComplete = true,
}: InvoiceDialogProps) {
  const { data: invoices, isLoading, refetch } = useInvoicesByOrder(
    orderId,
    open
  );
  const createInvoice = useCreateInvoice();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleCreateInvoice = async () => {
    try {
      await createInvoice.mutateAsync({
        orderIds: [orderId],
      });
      await refetch();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    if (createInvoice.isPending) return;
    onOpenChange(false);
  };

  // API returns InvoiceResponsePaginate, extract items
  const invoicesList = invoices?.items ?? [];
  const isPending = createInvoice.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Hóa đơn đơn hàng #{orderId}</DialogTitle>
          <DialogDescription>
            Xem danh sách hóa đơn đã xuất hoặc tạo hóa đơn mới cho đơn hàng này.
            Một đơn hàng có thể xuất nhiều hóa đơn.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Đang tải...
              </p>
            ) : invoicesList.length > 0 ? (
              invoicesList.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">
                          {invoice.invoiceNumber || `HĐ-${invoice.id}`}
                        </h4>
                        {invoice.status && (
                          <Badge variant="secondary" className="text-xs">
                            {invoice.statusName || invoice.status}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tổng tiền: </span>
                          <span className="font-medium">
                            {formatCurrency(invoice.grandTotal || invoice.totalAmount || 0)}
                          </span>
                        </div>
                        {invoice.issuedAt && (
                          <div>
                            <span className="text-muted-foreground">Ngày xuất: </span>
                            <span className="font-medium">
                              {formatDateTime(invoice.issuedAt)}
                            </span>
                          </div>
                        )}
                        {invoice.createdBy && (
                          <div>
                            <span className="text-muted-foreground">Người tạo: </span>
                            <span className="font-medium">
                              {invoice.createdBy.fullName}
                            </span>
                          </div>
                        )}
                      </div>
                      {invoice.notes && (
                        <p className="text-sm text-muted-foreground">
                          {invoice.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {invoice.pdfUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Mở PDF
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <FileText className="w-4 h-4 mr-2" />
                          Chưa có PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Chưa có hóa đơn nào cho đơn hàng này.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Đóng
          </Button>
          <Button
            onClick={handleCreateInvoice}
            disabled={isPending || !isCustomerInfoComplete}
            className="gap-2"
            title={
              !isCustomerInfoComplete
                ? "Thông tin khách hàng chưa đầy đủ. Vui lòng cập nhật trước khi xuất hóa đơn."
                : undefined
            }
          >
            <Plus className="w-4 h-4" />
            {isPending
              ? "Đang tạo..."
              : !isCustomerInfoComplete
              ? "Thông tin KH chưa đầy đủ"
              : "Tạo hóa đơn mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
