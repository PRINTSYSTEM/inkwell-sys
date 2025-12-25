import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useInvoice, useExportInvoice } from "@/hooks/use-invoice";
import { formatCurrency } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
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

  const handleExportPDF = async () => {
    if (!invoice?.id) return;
    try {
      await exportInvoiceMutation.mutateAsync(invoice.id);
    } catch (error) {
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
          <h1 className="text-xl font-semibold">Không tìm thấy hóa đơn</h1>
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
        <Link to="/accounting" className="w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
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
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {invoice.issuedAt ? formatDate(invoice.issuedAt) : formatDateTime(invoice.createdAt)}
              </span>
              {invoice.createdBy && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {invoice.createdBy.fullName || "—"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Xuất PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          {invoice.items && invoice.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết hóa đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead className="text-center">ĐVT</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.sortOrder || index + 1}</TableCell>
                        <TableCell>{item.description || "—"}</TableCell>
                        <TableCell className="text-center">{item.unit || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.quantity || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.unitPrice ? formatCurrency(item.unitPrice) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {item.amount ? formatCurrency(item.amount) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Orders */}
          {invoice.orders && invoice.orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Danh sách đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium font-mono">
                          {order.orderCode || `#${order.orderId}`}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {order.amount ? formatCurrency(order.amount) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller Info */}
          {(invoice.sellerName ||
            invoice.sellerTaxCode ||
            invoice.sellerAddress ||
            invoice.sellerPhone ||
            invoice.sellerBankAccount) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Thông tin người bán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.sellerName && (
                  <div>
                    <div className="text-sm font-medium">{invoice.sellerName}</div>
                  </div>
                )}
                {invoice.sellerTaxCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span>MST: {invoice.sellerTaxCode}</span>
                  </div>
                )}
                {invoice.sellerAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{invoice.sellerAddress}</span>
                  </div>
                )}
                {invoice.sellerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{invoice.sellerPhone}</span>
                  </div>
                )}
                {invoice.sellerBankAccount && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Tài khoản:</div>
                    <div className="font-medium">{invoice.sellerBankAccount}</div>
                    {invoice.sellerBankName && (
                      <div className="text-xs text-muted-foreground">
                        {invoice.sellerBankName}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Buyer Info */}
          {(invoice.buyerName ||
            invoice.buyerCompanyName ||
            invoice.buyerTaxCode ||
            invoice.buyerAddress ||
            invoice.buyerEmail ||
            invoice.buyerBankAccount) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin người mua
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.buyerCompanyName && (
                  <div>
                    <div className="text-sm font-medium">{invoice.buyerCompanyName}</div>
                  </div>
                )}
                {invoice.buyerName && (
                  <div className="text-sm">
                    <div className="font-medium">{invoice.buyerName}</div>
                  </div>
                )}
                {invoice.buyerTaxCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span>MST: {invoice.buyerTaxCode}</span>
                  </div>
                )}
                {invoice.buyerAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{invoice.buyerAddress}</span>
                  </div>
                )}
                {invoice.buyerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{invoice.buyerEmail}</span>
                  </div>
                )}
                {invoice.buyerBankAccount && (
                  <div className="text-sm">
                    <div className="text-muted-foreground">Tài khoản:</div>
                    <div className="font-medium">{invoice.buyerBankAccount}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng kết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng tiền hàng:</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              {invoice.taxRate && invoice.taxRate > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      VAT ({((invoice.taxRate || 0) * 100).toFixed(0)}%):
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Tổng thanh toán:</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
              {invoice.paymentMethod && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <div className="text-muted-foreground">Phương thức thanh toán:</div>
                    <div className="font-medium">{invoice.paymentMethod}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

