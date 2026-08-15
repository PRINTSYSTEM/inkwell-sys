import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Download,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  FileCheck,
  Edit,
  X,
  ExternalLink,
  Package,
  Receipt,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Ã¢â‚¬â€";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Ã¢â‚¬â€";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number.parseInt(id || "0", 10);

  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useInvoice(invoiceId || null, !!invoiceId);

  const exportInvoiceMutation = useExportInvoice();
  const voidInvoiceMutation = useVoidInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();
  const navigate = useNavigate();

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isUpdateEInvoiceDialogOpen, setIsUpdateEInvoiceDialogOpen] =
    useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const orderIds = useMemo(() => {
    if (!invoice?.orders) return [];
    return Array.from(
      new Set(invoice.orders.map((o) => o.orderId).filter(Boolean)),
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
  function InfoItem({
    label,
    value,
    className,
  }: {
    label: string;
    value?: React.ReactNode;
    className?: string;
  }) {
    if (!value) return null;

    return (
      <div className={cn("min-w-0", className)}>
        <div className="text-[11px] leading-4 text-muted-foreground">
          {label}
        </div>
        <div className="font-semibold leading-5 break-words">{value}</div>
      </div>
    );
  }

  function MoneyRow({
    label,
    value,
    className,
  }: {
    label: string;
    value: React.ReactNode;
    className?: string;
  }) {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <span className="text-muted-foreground">{label}:</span>
        <span className="w-32 text-right font-semibold tabular-nums">
          {value}
        </span>
      </div>
    );
  }
  const convertMmToCmDimensions = (dims: string | null | undefined): string => {
    if (!dims) return "";
    const clean = dims.replace(/^\(|\)$/g, "").trim();
    if (!clean) return "";

    const lowerClean = clean.toLowerCase();
    const hasCm = lowerClean.includes("cm");
    const hasDecimals = clean.split(/[xX*]/).some(part => part.includes("."));

    if (hasCm || hasDecimals) {
      const cleanNoCm = clean.replace(/cm/gi, "").trim();
      return `(${cleanNoCm}cm)`;
    }

    const parts = clean.split(/[xX*]/);
    const convertedParts = parts.map(part => {
      const trimmed = part.trim();
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        return (num / 10).toString().replace(/\.0$/, "");
      }
      return trimmed;
    });

    return `(${convertedParts.join("x")}cm)`;
  };

  const getFormattedDimensions = (design: any) => {
    if (!design) return "";
    
    if (design.dimensions) {
      return convertMmToCmDimensions(design.dimensions);
    }

    const parts: number[] = [];
    if (design.length) parts.push(design.length);
    if (design.width) parts.push(design.width);
    if (design.height) parts.push(design.height);

    if (parts.length > 0) {
      const cmParts = parts.map((num) =>
        (num / 10).toString().replace(/\.0$/, ""),
      );
      return `(${cmParts.join("x")}cm)`;
    }
    return "";
  };

  const getFormattedDescription = (item: any) => {
    const desc = item.description || "";
    
    let sizeStr = "";
    if (item.dimensions) {
      sizeStr = convertMmToCmDimensions(item.dimensions);
    }

    if (!sizeStr && item.orderDetailId) {
      const detail = orderDetailsMap.get(item.orderDetailId);
      if (detail && detail.design) {
        sizeStr = getFormattedDimensions(detail.design);
      }
    }

    if (!sizeStr) return desc;

    const detail = item.orderDetailId ? orderDetailsMap.get(item.orderDetailId) : null;
    const code = detail?.design?.code;
    if (code) {
      const escCode = code.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const codeRegex = new RegExp(`\\s*\\(${escCode}\\)`);
      if (codeRegex.test(desc)) {
        return desc.replace(codeRegex, ` ${sizeStr} (${code})`);
      }
    }

    const genericCodeRegex = /\s*(\([A-Za-z0-9-]+\))$/;
    if (genericCodeRegex.test(desc)) {
      return desc.replace(genericCodeRegex, ` ${sizeStr} $1`);
    }

    return `${desc} ${sizeStr}`;
  };

  const handleExportPDF = async () => {
    if (!invoice?.id) return;
    try {
      await exportInvoiceMutation.mutateAsync(invoice.id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceId);
      setIsDeleteDialogOpen(false);
      navigate("/accounting/invoice");
    } catch (e) {
      // Error is handled by the hook
    }
  };

 if (isLoading) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Đang tải hóa đơn...</p>
      </div>
    </div>
  );
}

if (isError || !invoice) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />

        <h1 className="text-xl font-semibold">
          Không tìm thấy hóa đơn
        </h1>

        <p className="text-muted-foreground">
          Hóa đơn không tồn tại hoặc đã bị xóa
        </p>

        <Link to="/accounting">
          <Button>Quay lại</Button>
        </Link>
      </div>
    </div>
  );
}

  const totalAmount = invoice.totalAmount || 0;
  const taxAmount = invoice.taxAmount || 0;
  const grandTotal = invoice.grandTotal || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/accounting/invoice" className="w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              Hóa đơn {invoice.invoiceNumber || `#${invoice.id}`}
            </h1>
            {invoice.status && (
              <StatusBadge
                status={invoice.status}
                label={invoice.statusName || invoice.status}
              />
            )}
            <span className="text-xs text-muted-foreground border-l pl-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/75" />
              {invoice.issuedAt && !invoice.issuedAt.startsWith("0001-01-01")
                ? formatDate(invoice.issuedAt)
                : formatDateTime(invoice.createdAt)}
            </span>
            {invoice.createdBy && (
              <span className="text-xs text-muted-foreground border-l pl-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                {invoice.createdBy.fullName || "Ã¢â‚¬â€"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {invoice.status !== "issued" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsIssueDialogOpen(true)}
                className="gap-2"
              >
                <FileCheck className="w-4 h-4" />
                Phát hành
              </Button>
            )}
            {invoice.status !== "void" && invoice.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVoidDialogOpen(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
                Hủy hóa đơn
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa Hóa đơn
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto space-y-3">
        {/* Compact Parties Bar */}
        {(invoice.sellerName ||
          invoice.sellerTaxCode ||
          invoice.sellerAddress ||
          invoice.buyerName ||
          invoice.buyerCompanyName ||
          invoice.buyerAddress) && (
          <Card>
            <CardContent className="px-4 py-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 font-bold text-emerald-800">
                    <Building2 className="h-4 w-4" />
                    Người bán
                  </div>

                  <div className="font-semibold truncate">
                    {invoice.sellerName || "â€”"}
                  </div>

                  <div className="mt-0.5 text-xs text-muted-foreground truncate">
                    {invoice.sellerAddress && (
                      <>
                        <span className="mx-2">Địa chỉ</span>
                        {invoice.sellerAddress}
                      </>
                    )}
                  </div>
                </div>

                <div className="min-w-0 lg:border-l lg:pl-4">
                  <div className="mb-1 flex items-center gap-2 font-bold text-emerald-800">
                    <User className="h-4 w-4" />
                    Người mua
                  </div>

                  <div className="font-semibold truncate">
                    {invoice.buyerCompanyName || invoice.buyerName || "â€”"}
                  </div>

                  <div className="mt-0.5 text-xs text-muted-foreground truncate">
                    Địa chỉ: {invoice.buyerAddress || "Chưa có địa chỉ"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Table */}
        {invoice.items && invoice.items.length > 0 && (
          <Card>
            <CardContent className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-center w-16">ĐVT</TableHead>
                    <TableHead className="text-right w-20">SL</TableHead>
                    <TableHead className="text-right w-28">Đơn giá</TableHead>
                    <TableHead className="text-right w-28">
                      Thành tiền
                    </TableHead>
                    <TableHead className="text-right w-24">
                      VAT{" "}
                      {invoice.taxRate
                        ? `${(invoice.taxRate * 100).toFixed(0)}%`
                        : "8%"}
                    </TableHead>
                    <TableHead className="text-right w-28">Tổng cộng</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {invoice.items.map((item, index) => {
                    const unitPriceValue = item.unitPrice;
                    const numericValue =
                      typeof unitPriceValue === "number"
                        ? unitPriceValue
                        : Number(unitPriceValue);

                    const isValidPrice =
                      unitPriceValue != null &&
                      numericValue !== 0 &&
                      !Number.isNaN(numericValue);

                    const lineAmount =
                      item.amountAfterDiscount || item.amount || 0;

                    const vatAmount =
                      (item as any).vatAmount !== undefined &&
                      (item as any).vatAmount !== null
                        ? (item as any).vatAmount
                        : lineAmount * (invoice.taxRate || 0);

                    const grandTotalVal =
                      (item as any).grandTotal !== undefined &&
                      (item as any).grandTotal !== null
                        ? (item as any).grandTotal
                        : lineAmount + vatAmount;

                    return (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">
                          {item.sortOrder || index + 1}
                        </TableCell>

                        <TableCell>
                          <div className="font-medium whitespace-pre-wrap leading-snug">
                            {getFormattedDescription(item)}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {item.unit || "Ã¢â‚¬â€"}
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-medium">
                          {item.quantity
                            ? item.quantity.toLocaleString("vi-VN")
                            : "Ã¢â‚¬â€"}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {isValidPrice
                            ? formatCurrency(numericValue)
                            : "Ã¢â‚¬â€"}
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(lineAmount)}
                          {item.discountPercent && item.discountPercent > 0 && (
                            <div className="text-[10px] text-orange-600 font-normal">
                              GiÃ¡ÂºÂ£m {item.discountPercent}%
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(vatAmount)}
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-bold">
                          {formatCurrency(grandTotalVal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Orders */}
        {invoice.orders && invoice.orders.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                <Package className="w-4.5 h-4.5" />
                Danh sách đơn hàng ({invoice.orders.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 py-3 border-t">
              {invoice.orders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium font-mono">
                        {order.orderCode || `Đơn #${order.orderId}`}
                      </div>

                      {order.orderId && (
                        <Link
                          to={`/accounting/orders/${order.orderId}`}
                          className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Xem chi tiết
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-medium tabular-nums">
                    {order.amount ? formatCurrency(order.amount) : "Ã¢â‚¬â€"}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base text-emerald-800">
                Ghi chú
              </CardTitle>
            </CardHeader>

            <CardContent className="py-3 border-t">
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <IssueInvoiceDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        invoiceId={invoiceId}
        currentInvoiceNumber={invoice.invoiceNumber}
      />

      <UpdateEInvoiceDialog
        open={isUpdateEInvoiceDialogOpen}
        onOpenChange={setIsUpdateEInvoiceDialogOpen}
        invoiceId={invoiceId}
        invoice={invoice}
      />

      {/* Void Invoice Dialog */}
      {isVoidDialogOpen && (
        <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <X className="w-5 h-5" />
                HÃ¡Â»Â§y Hóa đơn
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn hủy Hóa đơn này? Hành động này không thể
                hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVoidDialogOpen(false)}
                disabled={voidInvoiceMutation.isPending}
              >
                HÃ¡Â»Â§y
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await voidInvoiceMutation.mutateAsync({
                      id: invoiceId,
                    });
                    setIsVoidDialogOpen(false);
                  } catch (error) {
                    // Error is handled by the hook
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
                Bạn có chắc chắn muốn xóa Hóa đơn này khỏi hệ thống? Hành động
                này không thể hoàn tác.{" "}
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
    </div>
  );
}
