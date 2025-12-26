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
  Mail,
  AlertTriangle,
  Hash,
  Edit,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OrderFlowDiagram } from "@/components/orders/order-flow-diagram";
import { DepositDialog } from "@/components/orders/deposit-dialog";
import { InvoiceDialog } from "@/components/orders/invoice-dialog";
import { EditOrderSheet } from "@/components/orders/edit-order-sheet";
import { StatusUpdateDialog } from "@/components/orders/status-update-dialog";
import { PrintOrderDialog } from "@/components/orders/print-order-dialog";
import { CustomerUpdateDialog } from "@/components/orders/customer-update-dialog";

import {
  orderStatusLabels,
  designStatusLabels,
  orderDetailItemStatusLabels,
  orderDetailDerivedStatusLabels,
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
import {
  useAuth,
  useOrder,
  useUpdateOrder,
  useGenerateDesignExcel,
  useProofingOrdersByOrder,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE } from "@/constants";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const role = user?.role as UserRole;

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [customerUpdateDialogOpen, setCustomerUpdateDialogOpen] =
    useState(false);
  const [recipientUpdateDialogOpen, setRecipientUpdateDialogOpen] =
    useState(false);

  // ===== FETCH ORDER =====
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useOrder(orderId || null, !!orderId);

  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;
  const canViewDesigner =
    role === ROLE.DESIGN || role === ROLE.DESIGN_LEAD || role === ROLE.ADMIN;

  const canExportExcel =
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.ADMIN ||
    role === ROLE.ACCOUNTING;

  const canUpdateRecipient =
    role === ROLE.ACCOUNTING ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.ADMIN;

  const { mutate: updateOrder, isPending: isUpdatingOrder } = useUpdateOrder();

  // ===== PROOFING & PRODUCTION =====
  // Note: ProofingOrderListParams không có orderId để filter
  // Các proofing orders liên quan sẽ cần được fetch từ API riêng hoặc
  // thông qua orderDetails -> design -> proofingOrders
  // Tạm thời để trống, sẽ implement khi có API phù hợp

  const { data: relatedProofingOrders } = useProofingOrdersByOrder(orderId);
  const relatedProofing: ProofingOrderResponse[] = relatedProofingOrders ?? [];
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
  // Use customer from order response
  const customer = order.customer;
  const hasDeposit = (order.depositAmount || 0) > 0;
  const remainingAmount = (order.totalAmount || 0) - (order.depositAmount || 0);
  const orderDetailsCount = order.orderDetails?.length || 0;

  // ===== CHECK CUSTOMER INFO COMPLETENESS =====
  // Use missingFields from backend if available, otherwise check manually
  // Thông tin cần thiết để xuất hóa đơn:
  // - name (tên khách hàng) - bắt buộc
  // - phone (số điện thoại) - bắt buộc
  // - address (địa chỉ) - bắt buộc
  // - email (email) - bắt buộc cho company, không bắt buộc cho retail
  // - taxCode (mã số thuế) - bắt buộc cho company nếu field tồn tại
  const customerName = typeof customer?.name === "string" ? customer.name : "";
  const customerPhone =
    typeof customer?.phone === "string" ? customer.phone : "";
  const customerAddress =
    typeof customer?.address === "string" ? customer.address : "";
  const customerEmail =
    typeof customer?.email === "string" ? customer.email : "";
  const customerCompanyName =
    typeof customer?.companyName === "string" ? customer.companyName : "";
  // taxCode may not exist in CustomerSummaryResponse (used in OrderResponse)
  const customerTaxCode =
    "taxCode" in customer && typeof customer.taxCode === "string"
      ? customer.taxCode
      : "";

  const isCompany = !!customerCompanyName;
  const customerType = isCompany ? "company" : "retail";

  // Use missingFields from backend if available
  let missingFields: string[] = [];
  if (order.missingFields && Array.isArray(order.missingFields)) {
    missingFields = order.missingFields;
  } else {
    // Fallback: check manually
    if (!customerName.trim()) missingFields.push("Tên khách hàng");
    if (!customerPhone.trim()) missingFields.push("Số điện thoại");
    if (!customerAddress.trim()) missingFields.push("Địa chỉ");

    // Email: required for company, optional for retail
    if (isCompany && !customerEmail.trim()) {
      missingFields.push("Email");
    }

    // TaxCode: required for company if field exists
    if (isCompany && "taxCode" in customer && !customerTaxCode.trim()) {
      missingFields.push("Mã số thuế");
    }
  }

  const isCustomerInfoComplete = missingFields.length === 0;

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
              variant="default"
              size="sm"
              className="gap-2"
              onClick={() => setEditSheetOpen(true)}
            >
              <FileText className="w-4 h-4" />
              Chỉnh sửa đơn hàng
            </Button>

            {canExportExcel && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setPrintDialogOpen(true)}
              >
                <Printer className="w-4 h-4" />
                In đơn
              </Button>
            )}

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
                <DropdownMenuItem onClick={() => setDepositDialogOpen(true)}>
                  Cập nhật đặt cọc
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInvoiceDialogOpen(true)}
                  disabled={!isCustomerInfoComplete}
                >
                  Xuất hóa đơn
                  {!isCustomerInfoComplete && " (Thiếu thông tin KH)"}
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

                    // Xác định status và label dựa trên isCutOver
                    const isCutOver = orderDetail.isCutOver ?? false;
                    const statusValue = isCutOver
                      ? orderDetail.status
                      : orderDetail.derivedStatus;
                    const statusLabel = isCutOver
                      ? orderDetailItemStatusLabels[orderDetail.status || ""] ||
                        orderDetail.status ||
                        "N/A"
                      : orderDetailDerivedStatusLabels[
                          orderDetail.derivedStatus || ""
                        ] ||
                        orderDetail.derivedStatus ||
                        "N/A";

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
                                    status={statusValue || ""}
                                    label={statusLabel}
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
                              {design?.laminationType && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Cán màn
                                  </p>
                                  <p className="font-medium">
                                    {design.laminationType === "bóng"
                                      ? "Bóng"
                                      : design.laminationType === "mờ"
                                        ? "Mờ"
                                        : typeof design.laminationType ===
                                            "string"
                                          ? design.laminationType
                                          : "—"}
                                  </p>
                                </div>
                              )}
                              {design?.sidesClassification && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Mặt cắt
                                  </p>
                                  <p className="font-medium">
                                    {design.sidesClassification || "—"}
                                  </p>
                                </div>
                              )}
                              {design?.processClassification && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Quy trình SX
                                  </p>
                                  <p className="font-medium">
                                    {design.processClassification || "—"}
                                  </p>
                                </div>
                              )}
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
              {/* Warning banner if customer info is incomplete */}
              {!isCustomerInfoComplete && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Thông tin khách hàng chưa đầy đủ
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Cần cập nhật để có thể xuất hóa đơn:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1.5 list-disc list-inside space-y-0.5">
                        {missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs h-7"
                        onClick={() => setCustomerUpdateDialogOpen(true)}
                      >
                        Cập nhật thông tin khách hàng
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {customerName.charAt(0)?.toUpperCase() || "K"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {customerName || "Chưa có tên"}
                  </p>
                  {customer?.companyName && (
                    <p className="text-sm text-muted-foreground truncate">
                      {typeof customer.companyName === "string"
                        ? customer.companyName
                        : ""}
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
                  <span className="font-medium">
                    {typeof customer?.code === "string" ? customer.code : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customerPhone || "Chưa có"}</span>
                </div>
                {customerEmail ? (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customerEmail}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Chưa có email</span>
                  </div>
                )}
                {customerType === "company" &&
                  "taxCode" in customer &&
                  customer.taxCode &&
                  typeof customer.taxCode === "string" &&
                  customer.taxCode.trim() && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.taxCode}</span>
                    </div>
                  )}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">
                    {customerAddress || "Chưa có địa chỉ"}
                  </span>
                </div>
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
                    {order.assignedUser?.fullName ||
                      order.creator?.fullName ||
                      "—"}
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

                {/* Recipient Info */}
                {(order.recipientName ||
                  order.recipientPhone ||
                  order.recipientAddress) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-muted-foreground text-xs font-medium">
                        Người nhận:
                      </p>
                      {canUpdateRecipient && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => setRecipientUpdateDialogOpen(true)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Sửa
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      {order.recipientName && (
                        <p>
                          <span className="text-muted-foreground">Tên: </span>
                          {order.recipientName}
                        </p>
                      )}
                      {order.recipientPhone && (
                        <p>
                          <span className="text-muted-foreground">
                            Điện thoại:{" "}
                          </span>
                          {order.recipientPhone}
                        </p>
                      )}
                      {order.recipientAddress && (
                        <p>
                          <span className="text-muted-foreground">
                            Địa chỉ:{" "}
                          </span>
                          {order.recipientAddress}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {canUpdateRecipient &&
                  !order.recipientName &&
                  !order.recipientPhone &&
                  !order.recipientAddress && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                        onClick={() => setRecipientUpdateDialogOpen(true)}
                      >
                        <User className="w-3 h-3" />
                        Thêm thông tin người nhận
                      </Button>
                    </div>
                  )}

                {order.note && (
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      Ghi chú:
                    </p>
                    <p className="text-sm bg-muted/50 p-2 rounded-md whitespace-pre-wrap">
                      {order.note}
                    </p>
                  </div>
                )}

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setEditSheetOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  Chỉnh sửa thông tin
                </Button>
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
        isCustomerInfoComplete={isCustomerInfoComplete}
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

      <CustomerUpdateDialog
        open={customerUpdateDialogOpen}
        onOpenChange={setCustomerUpdateDialogOpen}
        customer={customer || null}
        onSuccess={() => {
          // Invalidate order query to refetch with updated customer info
          queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
        }}
      />

      {/* Recipient Update Dialog */}
      <Dialog
        open={recipientUpdateDialogOpen}
        onOpenChange={setRecipientUpdateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin người nhận</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người nhận hàng (nếu khác với khách hàng)
            </DialogDescription>
          </DialogHeader>
          <RecipientUpdateForm
            order={order}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
              setRecipientUpdateDialogOpen(false);
            }}
            onCancel={() => setRecipientUpdateDialogOpen(false)}
            isUpdating={isUpdatingOrder}
            updateOrder={updateOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Recipient Update Form Component
function RecipientUpdateForm({
  order,
  onSuccess,
  onCancel,
  isUpdating,
  updateOrder,
}: {
  order: {
    id?: number;
    recipientName?: string | null;
    recipientPhone?: string | null;
    recipientAddress?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
  isUpdating: boolean;
  updateOrder: (params: {
    id: number;
    data: import("@/Schema").UpdateOrderRequest;
  }) => void;
}) {
  const [recipientName, setRecipientName] = useState(order.recipientName || "");
  const [recipientPhone, setRecipientPhone] = useState(
    order.recipientPhone || ""
  );
  const [recipientAddress, setRecipientAddress] = useState(
    order.recipientAddress || ""
  );

  const handleSubmit = () => {
    if (!order.id) return;
    updateOrder({
      id: order.id,
      data: {
        recipientName: recipientName.trim() || null,
        recipientPhone: recipientPhone.trim() || null,
        recipientAddress: recipientAddress.trim() || null,
      },
    });
    onSuccess();
  };

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="recipientName">Tên người nhận</Label>
          <Input
            id="recipientName"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nhập tên người nhận"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipientPhone">Số điện thoại</Label>
          <Input
            id="recipientPhone"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipientAddress">Địa chỉ</Label>
          <Input
            id="recipientAddress"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Nhập địa chỉ người nhận"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={isUpdating}>
          {isUpdating ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogFooter>
    </>
  );
}
