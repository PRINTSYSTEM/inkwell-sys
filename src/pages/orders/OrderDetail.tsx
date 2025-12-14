import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Package,
  Factory,
  Download,
  Printer,
  Clock,
  Phone,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  ImageIcon,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { OrderFlowDiagram } from "@/components/orders/order-flow-diagram";
import { DepositDialog } from "@/components/orders/deposit-dialog";
import { InvoiceDialog } from "@/components/orders/invoice-dialog";
import { EditOrderSheet } from "@/components/orders/edit-order-sheet";
import { StatusUpdateDialog } from "@/components/orders/status-update-dialog";
import { PrintOrderDialog } from "@/components/orders/print-order-dialog";

import {
  orderStatusLabels,
  designStatusLabels,
  orderDetailItemStatusLabels,
  customerTypeLabels,
  proofingStatusLabels,
  productionStatusLabels,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/status-utils";

import type {
  ProductionResponse,
  UserRole,
  ProofingOrderResponse,
} from "@/Schema";
import { useAuth, useOrder, useGenerateDesignExcel } from "@/hooks";
import { ROLE } from "@/constants";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || "0", 10);
  const { user } = useAuth();

  const role = user?.role as UserRole;

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // Excel download
  const [downloadingDesignId, setDownloadingDesignId] = useState<number | null>(
    null
  );
  const { mutate: generateExcel } = useGenerateDesignExcel();

  const handleDownloadExcel = async (designId: number) => {
    if (!designId) return;
    setDownloadingDesignId(designId);
    try {
      await generateExcel(designId);
    } finally {
      setDownloadingDesignId(null);
    }
  };

  // ===== FETCH ORDER =====
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useOrder(orderId || null, !!orderId);

  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;
  const canViewDesigner =
    role === ROLE.DESIGN || role === ROLE.DESIGN_LEAD || role === ROLE.ADMIN;

  // ===== PROOFING & PRODUCTION =====
  // Note: ProofingOrderListParams không có orderId để filter
  // Các proofing orders liên quan sẽ cần được fetch từ API riêng hoặc
  // thông qua orderDetails -> design -> proofingOrders
  // Tạm thời để trống, sẽ implement khi có API phù hợp
  const relatedProofing: ProofingOrderResponse[] = [];
  const relatedProductions: ProductionResponse[] = [];

  // ===== LOADING =====
  if (orderLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (orderError || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">Không tìm thấy đơn hàng</h1>
          <p className="text-muted-foreground">
            Đơn hàng không tồn tại hoặc đã bị xóa
          </p>
          <Link to="/orders">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ===== DERIVED STATE =====
  const customerType = order.customer?.companyName ? "company" : "retail";
  const hasDeposit = (order.depositAmount || 0) > 0;
  const remainingAmount = (order.totalAmount || 0) - (order.depositAmount || 0);
  const orderDetailsCount = order.orderDetails?.length || 0;

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4">
        {/* Back button */}
        <Link to="/orders" className="w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
        </Link>

        {/* Header content */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {order.code}
              </h1>
              <StatusBadge
                status={order.status}
                label={orderStatusLabels[order.status || ""] || "N/A"}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDateTime(order.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {order.creator?.fullName || "—"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setPrintDialogOpen(true)}
            >
              <Printer className="w-4 h-4" />
              In đơn
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              Cập nhật trạng thái
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditSheetOpen(true)}>
                  Chỉnh sửa đơn hàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDepositDialogOpen(true)}>
                  Cập nhật đặt cọc
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInvoiceDialogOpen(true)}>
                  Xuất hóa đơn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sản phẩm</p>
                <p className="text-xl font-bold">{orderDetailsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {canViewPrice && (
          <>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng tiền</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(order.totalAmount || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Đã cọc</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.depositAmount || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950 dark:to-rose-900/50 border-rose-200 dark:border-rose-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Còn lại</p>
                    <p className="text-lg font-bold text-rose-600">
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!canViewPrice && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày giao</p>
                  <p className="text-lg font-bold">
                    {order.deliveryDate ? formatDate(order.deliveryDate) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== FLOW DIAGRAM ===== */}
      <Card>
        <CardContent className="p-4">
          <OrderFlowDiagram
            currentStatus={order.status}
            customerType={customerType}
            hasDeposit={hasDeposit}
          />
        </CardContent>
      </Card>

      {/* ===== MAIN CONTENT ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left - Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* ===== CHI TIẾT SẢN PHẨM ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Chi tiết sản phẩm
                {orderDetailsCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {orderDetailsCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.orderDetails && order.orderDetails.length > 0 ? (
                <div className="space-y-3">
                  {order.orderDetails.map((orderDetail, index) => {
                    const design = orderDetail.design;
                    return (
                      <div
                        key={orderDetail.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* Thumbnail */}
                          <div className="sm:w-32 h-32 sm:h-auto bg-muted flex-shrink-0">
                            {design?.designImageUrl ? (
                              <img
                                src={design.designImageUrl}
                                alt={design.designName || "Design"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                  <p className="font-semibold text-primary hover:underline">
                                    {design?.code || "—"}
                                  </p>
                                  <StatusBadge
                                    status={orderDetail.status}
                                    label={
                                      orderDetailItemStatusLabels[
                                        orderDetail.status || ""
                                      ] ||
                                      orderDetail.status ||
                                      "N/A"
                                    }
                                  />
                                </div>
                                <h4 className="font-medium">
                                  {design?.designName || "Chưa đặt tên"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {design?.designType?.name} •{" "}
                                  {design?.materialType?.name}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {design?.id && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          disabled={
                                            downloadingDesignId === design.id
                                          }
                                          onClick={() =>
                                            handleDownloadExcel(design.id)
                                          }
                                        >
                                          {downloadingDesignId === design.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Download className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Tải file Excel
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <Link to={`/design/detail/${design?.id}`}>
                                  <Button variant="ghost" size="icon">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* Details grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Kích thước
                                </p>
                                <p className="font-medium">
                                  {design?.dimensions ||
                                    (design?.width && design?.height
                                      ? `${design.width}x${design.height} cm`
                                      : "—")}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Số lượng
                                </p>
                                <p className="font-medium">
                                  {orderDetail.quantity?.toLocaleString()}
                                </p>
                              </div>
                              {canViewPrice && (
                                <>
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Đơn giá
                                    </p>
                                    <p className="font-medium">
                                      {formatCurrency(
                                        orderDetail.unitPrice || 0
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Thành tiền
                                    </p>
                                    <p className="font-semibold text-primary">
                                      {formatCurrency(
                                        orderDetail.totalPrice || 0
                                      )}
                                    </p>
                                  </div>
                                </>
                              )}
                              {canViewDesigner && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground text-xs">
                                    Designer
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {design?.designer?.fullName
                                          ?.charAt(0)
                                          ?.toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {design?.designer?.fullName || "—"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Requirements */}
                            {(orderDetail.requirements ||
                              orderDetail.additionalNotes) && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                                {orderDetail.requirements && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Yêu cầu:{" "}
                                    </span>
                                    {orderDetail.requirements}
                                  </div>
                                )}
                                {orderDetail.additionalNotes && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Ghi chú:{" "}
                                    </span>
                                    {orderDetail.additionalNotes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Chưa có sản phẩm nào trong đơn hàng
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== BÌNH BÀI ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Lệnh bình bài
                {relatedProofing.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {relatedProofing.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedProofing.length > 0 ? (
                <div className="space-y-3">
                  {relatedProofing.map((proof: ProofingOrderResponse) => (
                    <div
                      key={proof.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{proof.code}</span>
                            <StatusBadge
                              status={proof.status}
                              label={
                                proofingStatusLabels[proof.status || ""] ||
                                "N/A"
                              }
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {proof.materialType?.name} •{" "}
                            {proof.totalQuantity?.toLocaleString()} sản phẩm
                          </p>
                        </div>
                        <Link to={`/proofing/${proof.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            Xem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Chưa có lệnh bình bài nào
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== SẢN XUẤT ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="w-4 h-4 text-primary" />
                Lệnh sản xuất
                {relatedProductions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {relatedProductions.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedProductions.length > 0 ? (
                <div className="space-y-3">
                  {relatedProductions.map((prod) => (
                    <div
                      key={prod.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">SP-{prod.id}</span>
                            <StatusBadge
                              status={prod.status}
                              label={
                                productionStatusLabels[prod.status || ""] ||
                                "N/A"
                              }
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Phụ trách: {prod.productionLead?.fullName || "—"}
                          </p>
                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${prod.progressPercent || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {prod.progressPercent || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {prod.completedAt
                            ? `Hoàn thành: ${formatDate(prod.completedAt)}`
                            : prod.startedAt
                            ? `Bắt đầu: ${formatDate(prod.startedAt)}`
                            : "Chưa bắt đầu"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Factory className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Chưa có lệnh sản xuất nào
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {customerType === "company" ? (
                  <Building2 className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {order.customer?.name?.charAt(0)?.toUpperCase() || "K"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {order.customer?.name}
                  </p>
                  {order.customer?.companyName && (
                    <p className="text-sm text-muted-foreground truncate">
                      {order.customer.companyName}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {customerTypeLabels[customerType]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-20">Mã KH:</span>
                  <span className="font-medium">{order.customer?.code}</span>
                </div>
                {order.customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                {order.customer?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {order.customer.address}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày giao:</span>
                  <span className="font-medium">
                    {order.deliveryDate ? formatDate(order.deliveryDate) : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phụ trách:</span>
                  <span className="font-medium">
                    {order.assignedUser?.fullName || "—"}
                  </span>
                </div>

                {order.deliveryAddress && (
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      Địa chỉ giao hàng:
                    </p>
                    <p className="text-sm">{order.deliveryAddress}</p>
                  </div>
                )}

                {order.note && (
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      Ghi chú:
                    </p>
                    <p className="text-sm bg-muted/50 p-2 rounded-md">
                      {order.note}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary - only for allowed roles */}
          {canViewPrice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(order.totalAmount || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đã cọc:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(order.depositAmount || 0)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Còn lại:</span>
                  <span
                    className={`font-bold text-lg ${
                      remainingAmount > 0 ? "text-rose-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setDepositDialogOpen(true)}
                >
                  Cập nhật thanh toán
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== DIALOGS ===== */}
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        orderId={order.id}
        totalAmount={order.totalAmount || 0}
        currentDeposit={order.depositAmount || 0}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        orderId={order.id}
      />

      <EditOrderSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        order={order}
      />

      <StatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        orderId={order.id}
        currentStatus={
          (order.status || "pending") as
            | "pending"
            | "waiting_for_proofing"
            | "proofed"
            | "waiting_for_production"
            | "in_production"
            | "completed"
            | "invoice_issued"
            | "cancelled"
        }
      />

      <PrintOrderDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        orderId={order.id}
      />
    </div>
  );
}
