import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Package,
  CreditCard,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Truck,
  Hash,
  Mail,
  Receipt,
  Loader2,
  Edit,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  OrderStatusBadge,
  PaymentStatusBadge,
  InvoiceStatusBadge,
  CustomerTypeBadge,
  OrderAccountingUpdateDialog,
} from "@/components/accounting";
import {
  useOrder,
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
  useGenerateOrderExcel,
  useExportOrderPDF,
} from "@/hooks/use-order";
import { useConfirmDeposit, useApproveDebt } from "@/hooks/use-accounting";

// Helper to derive payment status from amounts
function derivePaymentStatus(
  totalAmount: number,
  depositAmount: number
): "not_paid" | "deposited" | "fully_paid" {
  if (depositAmount <= 0) return "not_paid";
  if (depositAmount >= totalAmount) return "fully_paid";
  return "deposited";
}

// Helper to derive customer type
function deriveCustomerType(
  companyName: string | null | undefined
): "company" | "retail" {
  return companyName ? "company" : "retail";
}

// Helper to check if order has been delivered
function hasBeenDelivered(status: string | null | undefined): boolean {
  return status === "delivering" || status === "completed";
}

// Helper to derive invoice status (simplified - in real app this would come from backend)
function deriveInvoiceStatus(order: {
  totalAmount?: number | null;
  depositAmount?: number | null;
  status?: string | null;
}): "issued" | "not_issued" {
  // Consider invoice issued if fully paid and completed
  const totalAmount = order.totalAmount || 0;
  const depositAmount = order.depositAmount || 0;
  if (
    depositAmount >= totalAmount &&
    totalAmount > 0 &&
    order.status === "completed"
  ) {
    return "issued";
  }
  return "not_issued";
}

export default function AccountingOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch order from API
  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useOrder(Number(id || "0"));

  // Modal state
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Mutations
  const exportInvoiceMutation = useExportOrderInvoice();
  const exportDeliveryNoteMutation = useExportOrderDeliveryNote();
  const generateExcelMutation = useGenerateOrderExcel();
  const exportPDFMutation = useExportOrderPDF();
  const confirmDepositMutation = useConfirmDeposit();
  const approveDebtMutation = useApproveDebt();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleExportExcel = () => {
    if (order) {
      generateExcelMutation.mutate(order.id);
    }
  };

  const handleExportInvoice = () => {
    if (order) {
      exportInvoiceMutation.mutate(order.id);
    }
  };

  const handleExportDeliveryNote = () => {
    if (order) {
      exportDeliveryNoteMutation.mutate(order.id);
    }
  };

  const handleExportPDF = () => {
    if (order) {
      exportPDFMutation.mutate(order.id);
    }
  };

  const handleUpdatePayment = () => {
    if (!order) return;

    const isCompany = !!order.customer?.companyName;

    if (isCompany) {
      // Khách công ty: duyệt công nợ
      approveDebtMutation.mutate(order.id);
    } else {
      // Khách lẻ: cập nhật thanh toán (confirm deposit)
      // Cần có dialog để nhập số tiền cọc, tạm thời gọi với depositAmount = totalAmount
      confirmDepositMutation.mutate(order.id, order.totalAmount);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !order) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">
                Không thể tải đơn hàng
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error
                  ? error.message
                  : "Đã xảy ra lỗi khi tải dữ liệu"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingAmount = order.totalAmount - order.depositAmount;
  const paymentProgress =
    order.totalAmount > 0 ? (order.depositAmount / order.totalAmount) * 100 : 0;
  const paymentStatus = derivePaymentStatus(
    order.totalAmount,
    order.depositAmount
  );
  const invoiceStatus = deriveInvoiceStatus(order);
  const customerType = deriveCustomerType(order.customer?.companyName);

  return (
    <>
      <Helmet>
        <title>Chi tiết đơn hàng {order.code} | Kế toán</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold font-mono">
                      {order.code}
                    </h1>
                    <OrderStatusBadge
                      status={order.status || ""}
                      statusType={order.statusType || ""}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tạo lúc {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUpdateDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Cập nhật thông tin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={generateExcelMutation.loading}
                >
                  {generateExcelMutation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Xuất Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exportPDFMutation.loading}
                >
                  {exportPDFMutation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Xuất PDF
                </Button>
                {/* {remainingAmount > 0 && ( */}
                <Button
                  size="sm"
                  onClick={handleUpdatePayment}
                  disabled={
                    confirmDepositMutation.loading ||
                    approveDebtMutation.loading
                  }
                >
                  {confirmDepositMutation.loading ||
                  approveDebtMutation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {order.customer?.companyName
                    ? "Duyệt công nợ"
                    : "Cập nhật thanh toán"}
                </Button>
                {/* )} */}
                {invoiceStatus === "not_issued" &&
                  hasBeenDelivered(order.status) && (
                    <Button
                      size="sm"
                      onClick={handleExportInvoice}
                      disabled={exportInvoiceMutation.loading}
                    >
                      {exportInvoiceMutation.loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Xuất hóa đơn
                    </Button>
                  )}
                {invoiceStatus === "issued" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDeliveryNote}
                    disabled={exportDeliveryNoteMutation.loading}
                  >
                    {exportDeliveryNoteMutation.loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Xuất phiếu giao hàng
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Summary Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Tổng quan thanh toán
                    </CardTitle>
                    <PaymentStatusBadge status={paymentStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        Tổng giá trị
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-success/10">
                      <p className="text-sm text-muted-foreground mb-1">
                        Đã thanh toán
                      </p>
                      <p className="text-xl font-bold tabular-nums text-success">
                        {formatCurrency(order.depositAmount)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-destructive/10">
                      <p className="text-sm text-muted-foreground mb-1">
                        Còn lại
                      </p>
                      <p
                        className={`text-xl font-bold tabular-nums ${
                          remainingAmount > 0
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(remainingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tiến độ thanh toán
                      </span>
                      <span className="font-medium">
                        {paymentProgress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={paymentProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Sản phẩm trong đơn
                    <Badge variant="secondary" className="ml-2">
                      {order.orderDetails?.length || 0} sản phẩm
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-[60px]">Ảnh</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.orderDetails?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="w-12 h-12 rounded-md bg-muted overflow-hidden">
                              {item.design?.designImageUrl ? (
                                <img
                                  src={item.design.designImageUrl}
                                  alt={item.design?.designName || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {item.design?.designName || "—"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">
                                  {item.design?.code}
                                </span>
                                {item.design?.dimensions && (
                                  <>
                                    <span>•</span>
                                    <span>{item.design.dimensions}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex gap-1.5 mt-1">
                                {item.design?.designType?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.design.designType.name}
                                  </Badge>
                                )}
                                {item.design?.materialType?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.design.materialType.name}
                                  </Badge>
                                )}
                              </div>
                              {item.requirements && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Yêu cầu: {item.requirements}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium tabular-nums">
                            {item.quantity.toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.unitPrice || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(item.totalPrice || 0)}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            Không có sản phẩm nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Notes */}
              {order.note && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Ghi chú đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                      {order.note}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Thông tin khách hàng
                    </CardTitle>
                    <CustomerTypeBadge type={customerType} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.customer?.companyName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Công ty</p>
                        <p className="font-medium">
                          {order.customer.companyName}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Liên hệ</p>
                      <p className="font-medium">
                        {order.customer?.name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Điện thoại
                      </p>
                      <p className="font-medium font-mono">
                        {order.customer?.phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Mã khách hàng
                      </p>
                      <p className="font-medium font-mono">
                        {order.customer?.code || "—"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tình trạng nợ
                      </span>
                      <Badge
                        variant={
                          order.customer?.debtStatus === "good"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {order.customer?.debtStatus === "good"
                          ? "Tốt"
                          : "Có nợ"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nợ hiện tại</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(order.customer?.currentDebt || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hạn mức nợ</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(order.customer?.maxDebt || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ngày giao dự kiến
                      </p>
                      <p className="font-medium">
                        {formatDateTime(order.deliveryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Địa chỉ giao hàng
                      </p>
                      <p className="font-medium">
                        {order.deliveryAddress || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Thông tin hóa đơn
                    </CardTitle>
                    <InvoiceStatusBadge status={invoiceStatus} />
                  </div>
                </CardHeader>
                <CardContent>
                  {invoiceStatus === "not_issued" ? (
                    hasBeenDelivered(order.status) ? (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Chưa xuất hóa đơn cho đơn hàng này
                        </p>
                        <Button
                          className="mt-4"
                          size="sm"
                          onClick={handleExportInvoice}
                          disabled={exportInvoiceMutation.loading}
                        >
                          {exportInvoiceMutation.loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          Xuất hóa đơn
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Chỉ có thể xuất hóa đơn sau khi đơn hàng đã giao hàng
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Đã xuất hóa đơn
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleExportInvoice}
                          disabled={exportInvoiceMutation.loading}
                        >
                          {exportInvoiceMutation.loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Tải xuống
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleExportDeliveryNote}
                          disabled={exportDeliveryNoteMutation.loading}
                        >
                          {exportDeliveryNoteMutation.loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Phiếu giao
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Update Order Dialog */}
      <OrderAccountingUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        order={order}
        onSuccess={() => {
          // Order detail will be refetched automatically via query invalidation
        }}
      />
    </>
  );
}
