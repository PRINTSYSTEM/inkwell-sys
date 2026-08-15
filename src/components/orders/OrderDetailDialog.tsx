import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertCircle,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useOrder } from "@/hooks/use-order";
import { formatCurrency, orderStatusLabels } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

interface OrderDetailDialogProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: OrderDetailDialogProps) {
  const {
    data: order,
    isLoading,
    isError,
  } = useOrder(orderId, open && !!orderId);

  const customerName =
    order?.customer?.companyName ||
    (order?.customer as any)?.fullName ||
    (order?.customer as any)?.name ||
    (order as any)?.customerName ||
    "—";
  const customerPhone = order?.customer?.phone || (order as any)?.customerPhone || "";
  const customerAddress = order?.customer?.address || (order as any)?.deliveryAddress || "";
  const customerTaxCode = order?.customer?.taxCode || "";

  const totalAmount = (() => {
    if (!order?.orderDetails?.length) return order?.totalAmount ?? 0;
    const calc = order.orderDetails.reduce((sum: number, d: any) => {
      const qty = d.netQtyTotal ?? d.quantity ?? 0;
      return sum + qty * (d.unitPrice ?? 0);
    }, 0);
    return calc > 0 ? calc : (order.totalAmount ?? 0);
  })();

  const paidAmount = order?.paidAmount ?? order?.depositAmount ?? 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  const invoiceNo =
    order?.invoiceNumber ||
    (order as any)?.invoiceCode ||
    (order as any)?.invoiceNo ||
    (order as any)?.invoice?.invoiceNumber ||
    (order as any)?.invoice?.invoiceCode ||
    (order as any)?.invoices?.[0]?.invoiceNumber ||
    (order as any)?.invoices?.[0]?.invoiceCode ||
    ((order as any)?.invoiceId ? `HĐ #${(order as any)?.invoiceId}` : null);

  const orderNotes =
    (order as any)?.notes ||
    (order as any)?.note ||
    (order as any)?.additionalNotes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground text-sm">Đang tải thông tin đơn hàng...</p>
            </div>
          </div>
        ) : isError || !order ? (
          <div className="py-12 flex items-center justify-center">
            <div className="text-center space-y-4">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <h2 className="text-lg font-semibold">Không tìm thấy đơn hàng</h2>
              <p className="text-xs text-muted-foreground">
                Đơn hàng không tồn tại hoặc đã bị xóa.
              </p>
              <Button size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">
                    Đơn hàng {String(order.orderCode || `#${order.id}`)}
                  </h2>
                  {order.status && (
                    <StatusBadge
                      status={order.status}
                      label={String(orderStatusLabels[order.status] || (order as any).statusName || order.status || "")}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {order.createdAt ? String(formatDateTime(order.createdAt)) : "—"}
                  </span>
                  {invoiceNo && (
                    <span className="flex items-center gap-1 border-l pl-3 font-mono font-medium text-emerald-700 dark:text-emerald-400">
                      <FileText className="w-3.5 h-3.5" />
                      HĐ: {String(invoiceNo)}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs shrink-0"
              >
                Đóng
              </Button>
            </div>

            {/* Customer & Payment Info Card */}
            <Card className="border bg-slate-50/50 dark:bg-stone-900/50 shadow-2xs">
              <CardContent className="px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Customer Info */}
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Building2 className="h-3.5 w-3.5" />
                      Thông tin khách hàng
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-stone-100 text-sm">
                      {customerName}
                    </div>
                    {customerTaxCode && (
                      <div className="text-muted-foreground mt-0.5">MST: {customerTaxCode}</div>
                    )}
                    {customerPhone && (
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />
                        {customerPhone}
                      </div>
                    )}
                    {customerAddress && (
                      <div className="flex items-start gap-1 text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="truncate">{customerAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Overview */}
                  <div className="min-w-0 md:border-l md:pl-4 space-y-1">
                    <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      Thanh toán & Công nợ
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tổng tiền hàng:</span>
                      <span className="font-bold text-slate-900 dark:text-stone-100">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Đã thanh toán:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Còn nợ:</span>
                      <span className={remainingDebt > 0 ? "text-red-600 font-extrabold" : "text-slate-500"}>
                        {remainingDebt > 0 ? formatCurrency(remainingDebt) : "0 ₫"}
                      </span>
                    </div>
                    {order.paymentDueDate && (
                      <div className="text-[11px] text-muted-foreground pt-0.5">
                        Hạn thanh toán: <span className="font-semibold">{formatDate(order.paymentDueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items Table */}
            {order.orderDetails && order.orderDetails.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 border-b flex items-center gap-2 font-bold text-xs">
                  <Package className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  Danh sách sản phẩm ({order.orderDetails.length})
                </div>
                <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
                  <TableHeader className="bg-slate-50 dark:bg-stone-850 border-b">
                    <TableRow>
                      <TableHead className="w-10 text-xs font-bold">STT</TableHead>
                      <TableHead className="text-xs font-bold">Tên sản phẩm / Mã bài</TableHead>
                      <TableHead className="text-center w-24 text-xs font-bold">Kích thước</TableHead>
                      <TableHead className="text-right w-20 text-xs font-bold">SL</TableHead>
                      <TableHead className="text-right w-24 text-xs font-bold">Đơn giá</TableHead>
                      <TableHead className="text-right w-28 text-xs font-bold">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderDetails.map((item: any, index: number) => {
                      const qty = item.netQtyTotal ?? item.quantity ?? 0;
                      const price = item.unitPrice ?? 0;
                      const lineTotal = qty * price;
                      const length = item.length ?? item.design?.length;
                      const width = item.width ?? item.design?.width;
                      const sizeStr = length && width ? `${length} x ${width} cm` : "—";
                      const productName =
                        item.designName ||
                        item.design?.designName ||
                        item.design?.name ||
                        item.productName ||
                        item.name ||
                        item.description ||
                        (item.designCode ? `Bài ${item.designCode}` : null) ||
                        item.productCode ||
                        `Sản phẩm #${index + 1}`;

                      return (
                        <TableRow key={item.id || index} className="text-xs">
                          <TableCell className="font-medium text-slate-500">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-stone-100">
                            <div>{productName}</div>
                            {item.designCode && (
                              <div className="text-[11px] text-red-600 font-semibold font-mono">
                                Bài {item.designCode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-slate-600 dark:text-stone-300">
                            {sizeStr}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-bold text-red-600">
                            {qty.toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-slate-700 dark:text-stone-300">
                            {price > 0 ? formatCurrency(price) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-extrabold text-slate-900 dark:text-stone-50">
                            {formatCurrency(lineTotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Notes */}
            {orderNotes && (
              <div className="text-xs bg-muted/30 p-3 rounded-lg border">
                <span className="font-bold text-slate-700 dark:text-stone-300">Ghi chú: </span>
                <span className="text-muted-foreground whitespace-pre-wrap">{String(orderNotes)}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
