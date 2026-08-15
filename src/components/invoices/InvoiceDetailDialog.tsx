import { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Building2,
  Edit,
  X,
  FileCheck,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useInvoice,
  useExportInvoice,
  useVoidInvoice,
  useDeleteInvoice,
} from "@/hooks/use-invoice";
import { useOrder } from "@/hooks/use-order";
import { formatCurrency } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  IssueInvoiceDialog,
  UpdateEInvoiceDialog,
} from "@/components/accounting";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

interface InvoiceDetailDialogProps {
  invoiceId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceDeleted?: () => void;
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
  onInvoiceDeleted,
}: InvoiceDetailDialogProps) {
  const {
    data: invoice,
    isLoading,
    isError,
  } = useInvoice(invoiceId, open && !!invoiceId);

  const exportInvoiceMutation = useExportInvoice();
  const voidInvoiceMutation = useVoidInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isUpdateEInvoiceDialogOpen, setIsUpdateEInvoiceDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const orderIds = useMemo(() => {
    if (!invoice?.orders) return [];
    return Array.from(
      new Set(invoice.orders.map((o) => o.orderId).filter(Boolean))
    );
  }, [invoice?.orders]);

  const orderId1 = orderIds[0] || null;
  const orderId2 = orderIds[1] || null;
  const { data: order1 } = useOrder(orderId1, !!orderId1);
  const { data: order2 } = useOrder(orderId2, !!orderId2);

  const orderDetailsMap = useMemo(() => {
    const map = new Map<number, any>();
    const addOrder = (order: any) => {
      if (!order?.orderDetails) return;
      for (const d of order.orderDetails) {
        if (d.id) {
          map.set(d.id, d);
        }
      }
    };
    addOrder(order1);
    addOrder(order2);
    return map;
  }, [order1, order2]);

  const getFormattedDescription = (item: any) => {
    let desc = item.productName || item.description || "—";

    if (item.designCode && !desc.includes(item.designCode)) {
      desc += ` (${item.designCode})`;
    }

    if (item.orderDetailId) {
      const detail = orderDetailsMap.get(item.orderDetailId);
      if (detail && detail.length && detail.width) {
        const sizeStr = `(${detail.length}x${detail.width}cm)`;
        if (!desc.includes(sizeStr)) {
          desc += ` ${sizeStr}`;
        }
      }
    }

    return desc;
  };

  const handleExportExcel = async () => {
    if (!invoice?.id) return;
    try {
      await exportInvoiceMutation.mutateAsync(invoice.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceId) return;
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      if (onInvoiceDeleted) onInvoiceDeleted();
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground text-sm">Đang tải chi tiết hóa đơn...</p>
              </div>
            </div>
          ) : isError || !invoice ? (
            <div className="py-12 flex items-center justify-center">
              <div className="text-center space-y-4">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
                <h2 className="text-lg font-semibold">Không tìm thấy hóa đơn</h2>
                <p className="text-xs text-muted-foreground">
                  Hóa đơn không tồn tại hoặc đã bị xóa.
                </p>
                <Button size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground">
                      Hóa đơn {invoice.invoiceNumber || `#${invoice.id}`}
                    </h2>
                    {invoice.status && (
                      <StatusBadge
                        status={invoice.status}
                        label={invoice.statusName || invoice.status}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {invoice.issuedAt && !invoice.issuedAt.startsWith("0001-01-01")
                        ? formatDate(invoice.issuedAt)
                        : formatDateTime(invoice.createdAt)}
                    </span>
                    {invoice.createdBy && (
                      <span className="flex items-center gap-1 border-l pl-3">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {invoice.createdBy.fullName || "—"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {invoice.status !== "issued" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsIssueDialogOpen(true)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Phát hành
                    </Button>
                  )}
                  {invoice.status !== "void" && invoice.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVoidDialogOpen(true)}
                      className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                      Hủy hóa đơn
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exportInvoiceMutation.isPending}
                    className="h-8 text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                  >
                    {exportInvoiceMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    Xuất Excel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa Hóa đơn
                  </Button>
                </div>
              </div>

              {/* Seller & Buyer Box */}
              {(invoice.sellerName || invoice.buyerName || invoice.buyerCompanyName || invoice.buyerAddress) && (
                <Card className="border bg-slate-50/50 dark:bg-stone-900/50 shadow-2xs">
                  <CardContent className="px-4 py-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <Building2 className="h-3.5 w-3.5" />
                          Người bán
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-stone-100">
                          {invoice.sellerName || "—"}
                        </div>
                        {invoice.sellerAddress && (
                          <div className="mt-0.5 text-muted-foreground truncate">
                            Địa chỉ: {invoice.sellerAddress}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 md:border-l md:pl-4">
                        <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <User className="h-3.5 w-3.5" />
                          Người mua
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-stone-100">
                          {invoice.buyerCompanyName || invoice.buyerName || "—"}
                        </div>
                        <div className="mt-0.5 text-muted-foreground truncate">
                          Địa chỉ: {invoice.buyerAddress || "Chưa có địa chỉ"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items Table */}
              {invoice.items && invoice.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
                    <TableHeader className="bg-slate-50 dark:bg-stone-850 border-b">
                      <TableRow>
                        <TableHead className="w-10 text-xs font-bold">STT</TableHead>
                        <TableHead className="text-xs font-bold">Tên sản phẩm</TableHead>
                        <TableHead className="text-center w-16 text-xs font-bold">ĐVT</TableHead>
                        <TableHead className="text-right w-20 text-xs font-bold">SL</TableHead>
                        <TableHead className="text-right w-24 text-xs font-bold">Đơn giá</TableHead>
                        <TableHead className="text-right w-24 text-xs font-bold">Thành tiền</TableHead>
                        <TableHead className="text-right w-20 text-xs font-bold">
                          VAT {invoice.taxRate ? `${(invoice.taxRate * 100).toFixed(0)}%` : "8%"}
                        </TableHead>
                        <TableHead className="text-right w-28 text-xs font-bold">Tổng cộng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => {
                        const unitPriceValue = item.unitPrice;
                        const numericValue = typeof unitPriceValue === "number" ? unitPriceValue : Number(unitPriceValue);
                        const isValidPrice = unitPriceValue != null && numericValue !== 0 && !Number.isNaN(numericValue);
                        const lineAmount = item.amountAfterDiscount || item.amount || 0;
                        const vatAmount = (item as any).vatAmount !== undefined && (item as any).vatAmount !== null
                          ? (item as any).vatAmount
                          : lineAmount * (invoice.taxRate || 0);
                        const grandTotalVal = (item as any).grandTotal !== undefined && (item as any).grandTotal !== null
                          ? (item as any).grandTotal
                          : lineAmount + vatAmount;

                        return (
                          <TableRow key={item.id || index} className="text-xs">
                            <TableCell className="font-medium text-slate-500">
                              {item.sortOrder || index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900 dark:text-stone-100">
                              {getFormattedDescription(item)}
                            </TableCell>
                            <TableCell className="text-center text-slate-600 dark:text-stone-300">
                              {item.unit || "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-bold text-slate-800 dark:text-stone-200">
                              {item.quantity ? item.quantity.toLocaleString("vi-VN") : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-slate-700 dark:text-stone-300">
                              {isValidPrice ? formatCurrency(numericValue) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-slate-800 dark:text-stone-200">
                              {formatCurrency(lineAmount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-slate-600 dark:text-stone-400">
                              {formatCurrency(vatAmount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-extrabold text-slate-900 dark:text-stone-50">
                              {formatCurrency(grandTotalVal)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Total Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs bg-slate-50/70 dark:bg-stone-900/60 p-3 rounded-lg border">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{formatCurrency(invoice.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Tiền thuế VAT:</span>
                    <span className="font-semibold">{formatCurrency(invoice.taxAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-stone-50 border-t pt-1.5">
                    <span>Tổng cộng:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(invoice.grandTotal || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub dialogs */}
      {invoice && (
        <>
          <IssueInvoiceDialog
            open={isIssueDialogOpen}
            onOpenChange={setIsIssueDialogOpen}
            invoiceId={invoice.id}
            currentInvoiceNumber={invoice.invoiceNumber}
          />

          <UpdateEInvoiceDialog
            open={isUpdateEInvoiceDialogOpen}
            onOpenChange={setIsUpdateEInvoiceDialogOpen}
            invoiceId={invoice.id}
            invoice={invoice}
          />

          {/* Void Invoice Dialog */}
          {isVoidDialogOpen && (
            <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <X className="w-5 h-5" />
                    Hủy Hóa đơn
                  </DialogTitle>
                  <DialogDescription>
                    Bạn có chắc chắn muốn hủy Hóa đơn này? Hành động này không thể hoàn tác.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsVoidDialogOpen(false)}
                    disabled={voidInvoiceMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await voidInvoiceMutation.mutateAsync({ id: invoice.id });
                        setIsVoidDialogOpen(false);
                      } catch (error) {
                        // Error handled by hook
                      }
                    }}
                    disabled={voidInvoiceMutation.isPending}
                  >
                    {voidInvoiceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      "Xác nhận hủy"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Invoice Dialog */}
          {isDeleteDialogOpen && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Xóa Hóa đơn
                  </DialogTitle>
                  <DialogDescription>
                    Bạn có chắc chắn muốn xóa Hóa đơn này khỏi hệ thống? Hành động này không thể hoàn tác.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteInvoice}
                    disabled={deleteInvoiceMutation.isPending}
                  >
                    {deleteInvoiceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      "Xác nhận xóa"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </>
  );
}
