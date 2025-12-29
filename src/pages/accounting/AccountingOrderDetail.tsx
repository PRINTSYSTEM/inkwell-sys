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
} from "@/components/accounting";
import {
  useOrder,
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
  useGenerateOrderExcel,
  useExportOrderPDF,
  useUpdateOrderForAccounting,
} from "@/hooks/use-order";
import { useConfirmDeposit, useApproveDebt } from "@/hooks/use-accounting";
import type { UpdateOrderForAccountingRequest } from "@/Schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

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

  // Card-level editing states
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardEditValues, setCardEditValues] = useState<
    Record<string, string | number | null>
  >({});

  // Mutations
  const exportInvoiceMutation = useExportOrderInvoice();
  const exportDeliveryNoteMutation = useExportOrderDeliveryNote();
  const generateExcelMutation = useGenerateOrderExcel();
  const exportPDFMutation = useExportOrderPDF();
  const confirmDepositMutation = useConfirmDeposit();
  const approveDebtMutation = useApproveDebt();
  const { mutate: updateOrderForAccounting, loading: isUpdatingForAccounting } =
    useUpdateOrderForAccounting();

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

  // Helper to format date for input
  const formatDateTimeForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  // Helper to start editing a card
  const startEditingCard = (
    cardName: string,
    initialValues: Record<string, string | number | null>
  ) => {
    setEditingCard(cardName);
    setCardEditValues(initialValues);
  };

  // Helper to cancel editing a card
  const cancelEditingCard = () => {
    setEditingCard(null);
    setCardEditValues({});
  };

  // Helper to save card changes
  const handleSaveCard = async (cardName: string) => {
    if (!order) return;

    const payload: Partial<UpdateOrderForAccountingRequest> = {};

    // Convert values based on card type
    if (cardName === "customerInfo") {
      payload.customerName =
        cardEditValues.customerName === "" ||
        cardEditValues.customerName === null
          ? null
          : String(cardEditValues.customerName).trim();
      payload.customerCompanyName =
        cardEditValues.customerCompanyName === "" ||
        cardEditValues.customerCompanyName === null
          ? null
          : String(cardEditValues.customerCompanyName).trim();
      payload.customerPhone =
        cardEditValues.customerPhone === "" ||
        cardEditValues.customerPhone === null
          ? null
          : String(cardEditValues.customerPhone).trim();
      payload.customerEmail =
        cardEditValues.customerEmail === "" ||
        cardEditValues.customerEmail === null
          ? null
          : String(cardEditValues.customerEmail).trim();
      payload.customerTaxCode =
        cardEditValues.customerTaxCode === "" ||
        cardEditValues.customerTaxCode === null
          ? null
          : String(cardEditValues.customerTaxCode).trim();
      payload.customerAddress =
        cardEditValues.customerAddress === "" ||
        cardEditValues.customerAddress === null
          ? null
          : String(cardEditValues.customerAddress).trim();
    } else if (cardName === "orderInfo") {
      payload.deliveryDate =
        cardEditValues.deliveryDate === "" ||
        cardEditValues.deliveryDate === null
          ? null
          : new Date(cardEditValues.deliveryDate).toISOString();
      payload.deliveryAddress =
        cardEditValues.deliveryAddress === "" ||
        cardEditValues.deliveryAddress === null
          ? null
          : String(cardEditValues.deliveryAddress).trim();
      payload.note =
        cardEditValues.note === "" || cardEditValues.note === null
          ? null
          : String(cardEditValues.note).trim();
    } else if (cardName === "paymentInfo") {
      payload.totalAmount =
        cardEditValues.totalAmount === "" || cardEditValues.totalAmount === null
          ? null
          : Number(cardEditValues.totalAmount);
      payload.depositAmount =
        cardEditValues.depositAmount === "" ||
        cardEditValues.depositAmount === null
          ? null
          : Number(cardEditValues.depositAmount);
      payload.paymentDueDate =
        cardEditValues.paymentDueDate === "" ||
        cardEditValues.paymentDueDate === null
          ? null
          : new Date(cardEditValues.paymentDueDate).toISOString();
    } else if (cardName === "recipientInfo") {
      payload.recipientName =
        cardEditValues.recipientName === "" ||
        cardEditValues.recipientName === null
          ? null
          : String(cardEditValues.recipientName).trim();
      payload.recipientPhone =
        cardEditValues.recipientPhone === "" ||
        cardEditValues.recipientPhone === null
          ? null
          : String(cardEditValues.recipientPhone).trim();
      payload.recipientAddress =
        cardEditValues.recipientAddress === "" ||
        cardEditValues.recipientAddress === null
          ? null
          : String(cardEditValues.recipientAddress).trim();
    }

    try {
      await updateOrderForAccounting(
        order.id,
        payload as UpdateOrderForAccountingRequest
      );
      setEditingCard(null);
      setCardEditValues({});
    } catch (error) {
      // Keep editing mode on error
    }
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

  const handleUpdateStatusToDelivering = async () => {
    if (!order) return;

    try {
      await updateOrderForAccounting(order.id, {
        status: "delivering",
      } as UpdateOrderForAccountingRequest);
    } catch (error) {
      // Error is already handled by the mutation hook
    }
  };

  const handleUpdateStatusToCompleted = async () => {
    if (!order) return;

    try {
      await updateOrderForAccounting(order.id, {
        status: "delivered",
      } as UpdateOrderForAccountingRequest);
    } catch (error) {
      // Error is already handled by the mutation hook
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
                  onClick={handleExportExcel}
                  disabled={generateExcelMutation.loading}
                >
                  {generateExcelMutation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Xuất Excel Báo Giá
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
                  Xuất PDF Đơn Hàng
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
                {order.status === "production_completed" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleUpdateStatusToDelivering}
                    disabled={isUpdatingForAccounting}
                  >
                    {isUpdatingForAccounting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Đổi trạng thái thành đang giao hàng
                  </Button>
                )}
                {order.status === "delivering" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleUpdateStatusToCompleted}
                    disabled={isUpdatingForAccounting}
                  >
                    {isUpdatingForAccounting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Đổi trạng thái thành đã giao hàng
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
                    <div className="flex items-center gap-2">
                      <PaymentStatusBadge status={paymentStatus} />
                      {editingCard === "paymentInfo" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveCard("paymentInfo")}
                            disabled={isUpdatingForAccounting}
                          >
                            {isUpdatingForAccounting ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              "Lưu"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingCard}
                            disabled={isUpdatingForAccounting}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startEditingCard("paymentInfo", {
                              totalAmount: order.totalAmount?.toString() || "",
                              depositAmount:
                                order.depositAmount?.toString() || "",
                              paymentDueDate: formatDateTimeForInput(
                                order.paymentDueDate
                              ),
                            })
                          }
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCard === "paymentInfo" ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tổng tiền</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={cardEditValues.totalAmount || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              totalAmount: e.target.value,
                            })
                          }
                          placeholder="Nhập tổng tiền"
                          className="text-lg font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Đã cọc</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={cardEditValues.depositAmount || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              depositAmount: e.target.value,
                            })
                          }
                          placeholder="Nhập số tiền đã cọc"
                          className="text-lg font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hạn thanh toán</Label>
                        <Input
                          type="datetime-local"
                          value={cardEditValues.paymentDueDate || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              paymentDueDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
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

                      {order.paymentDueDate && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs text-muted-foreground">
                                Hạn thanh toán:{" "}
                              </span>
                              <span className="text-sm font-medium">
                                {formatDateTime(order.paymentDueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                    <div className="flex items-center gap-2">
                      <CustomerTypeBadge type={customerType} />
                      {editingCard === "customerInfo" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveCard("customerInfo")}
                            disabled={isUpdatingForAccounting}
                          >
                            {isUpdatingForAccounting ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              "Lưu"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingCard}
                            disabled={isUpdatingForAccounting}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            startEditingCard("customerInfo", {
                              customerName: order.customer?.name || "",
                              customerCompanyName:
                                order.customer?.companyName || "",
                              customerPhone: order.customer?.phone || "",
                              customerEmail: order.customer?.email || "",
                              customerTaxCode:
                                (order.customer as { taxCode?: string })
                                  ?.taxCode || "",
                              customerAddress: order.customer?.address || "",
                            })
                          }
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCard === "customerInfo" ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tên khách hàng *</Label>
                        <Input
                          value={cardEditValues.customerName || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              customerName: e.target.value,
                            })
                          }
                          placeholder="Nhập tên khách hàng"
                        />
                      </div>
                      {customerType === "company" && (
                        <div className="space-y-2">
                          <Label>Tên công ty</Label>
                          <Input
                            value={cardEditValues.customerCompanyName || ""}
                            onChange={(e) =>
                              setCardEditValues({
                                ...cardEditValues,
                                customerCompanyName: e.target.value,
                              })
                            }
                            placeholder="Nhập tên công ty"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Số điện thoại *</Label>
                        <Input
                          value={cardEditValues.customerPhone || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              customerPhone: e.target.value,
                            })
                          }
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email {customerType === "company" && "*"}</Label>
                        <Input
                          type="email"
                          value={cardEditValues.customerEmail || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              customerEmail: e.target.value,
                            })
                          }
                          placeholder="Nhập email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Địa chỉ *</Label>
                        <Textarea
                          value={cardEditValues.customerAddress || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              customerAddress: e.target.value,
                            })
                          }
                          placeholder="Nhập địa chỉ"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      {order.customer?.companyName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Công ty
                            </p>
                            <p className="font-medium">
                              {order.customer.companyName}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Liên hệ
                          </p>
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
                          <span className="text-muted-foreground">
                            Nợ hiện tại
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(order.customer?.currentDebt || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Hạn mức nợ
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(order.customer?.maxDebt || 0)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Thông tin giao hàng
                    </CardTitle>
                    {editingCard === "orderInfo" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveCard("orderInfo")}
                          disabled={isUpdatingForAccounting}
                        >
                          {isUpdatingForAccounting ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            "Lưu"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingCard}
                          disabled={isUpdatingForAccounting}
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startEditingCard("orderInfo", {
                            deliveryDate: formatDateTimeForInput(
                              order.deliveryDate
                            ),
                            deliveryAddress: order.deliveryAddress || "",
                            note: order.note || "",
                          })
                        }
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCard === "orderInfo" ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ngày giao</Label>
                        <Input
                          type="datetime-local"
                          value={cardEditValues.deliveryDate || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              deliveryDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Địa chỉ giao hàng</Label>
                        <Textarea
                          value={cardEditValues.deliveryAddress || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              deliveryAddress: e.target.value,
                            })
                          }
                          placeholder="Nhập địa chỉ giao hàng"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <Textarea
                          value={cardEditValues.note || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              note: e.target.value,
                            })
                          }
                          placeholder="Nhập ghi chú"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
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
                      {order.note && (
                        <div className="pt-2">
                          <p className="text-muted-foreground text-xs mb-1">
                            Ghi chú:
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {order.note}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recipient Info Card - Only visible to accounting */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Thông tin nhận hàng
                    </CardTitle>
                    {editingCard === "recipientInfo" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveCard("recipientInfo")}
                          disabled={isUpdatingForAccounting}
                        >
                          {isUpdatingForAccounting ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            "Lưu"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingCard}
                          disabled={isUpdatingForAccounting}
                        >
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startEditingCard("recipientInfo", {
                            recipientName: order.recipientName || "",
                            recipientPhone: order.recipientPhone || "",
                            recipientAddress: order.recipientAddress || "",
                          })
                        }
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Warning if missing info */}
                  {(!order.recipientName ||
                    !order.recipientPhone ||
                    !order.recipientAddress) &&
                    editingCard !== "recipientInfo" && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                              Thiếu thông tin người nhận
                            </p>
                            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside space-y-0.5">
                              {!order.recipientName && <li>Tên người nhận</li>}
                              {!order.recipientPhone && <li>Số điện thoại</li>}
                              {!order.recipientAddress && <li>Địa chỉ</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                  {editingCard === "recipientInfo" ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tên người nhận</Label>
                        <Input
                          value={cardEditValues.recipientName || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              recipientName: e.target.value,
                            })
                          }
                          placeholder="Nhập tên người nhận"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số điện thoại</Label>
                        <Input
                          value={cardEditValues.recipientPhone || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              recipientPhone: e.target.value,
                            })
                          }
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Địa chỉ</Label>
                        <Textarea
                          value={cardEditValues.recipientAddress || ""}
                          onChange={(e) =>
                            setCardEditValues({
                              ...cardEditValues,
                              recipientAddress: e.target.value,
                            })
                          }
                          placeholder="Nhập địa chỉ người nhận"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Tên người nhận
                          {!order.recipientName && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-sm font-medium">
                          {order.recipientName || (
                            <span className="text-muted-foreground italic">
                              Chưa có thông tin
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Số điện thoại
                          {!order.recipientPhone && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-sm font-medium">
                          {order.recipientPhone || (
                            <span className="text-muted-foreground italic">
                              Chưa có thông tin
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Địa chỉ
                          {!order.recipientAddress && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-sm font-medium">
                          {order.recipientAddress || (
                            <span className="text-muted-foreground italic">
                              Chưa có thông tin
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
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
    </>
  );
}
