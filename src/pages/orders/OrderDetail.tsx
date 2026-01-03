import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { format } from "date-fns";
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
  ExternalLink,
  Loader2,
  ImageIcon,
  AlertCircle,
  Mail,
  AlertTriangle,
  Hash,
  Edit,
  DollarSign,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Layers,
  Box,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";

import { OrderFlowDiagram } from "@/components/orders/order-flow-diagram";
import { DepositDialog } from "@/components/orders/deposit-dialog";
import { InvoiceDialog } from "@/components/orders/invoice-dialog";
import { PrintOrderDialog } from "@/components/orders/print-order-dialog";

import {
  orderStatusLabels,
  designStatusLabels,
  orderDetailItemStatusLabels,
  orderDetailDerivedStatusLabels,
  customerTypeLabels,
  proofingStatusLabels,
  productionStatusLabels,
  laminationTypeLabels,
  sidesClassificationLabels,
  processClassificationLabels,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/status-utils";

import type {
  ProductionResponse,
  UserRole,
  ProofingOrderResponse,
  OrderDetailResponse,
  UpdateOrderForAccountingRequest,
  UpdateOrderDetailForAccountingRequest,
} from "@/Schema";
import {
  useAuth,
  useOrder,
  useUpdateOrder,
  useUpdateOrderForAccounting,
  useGenerateDesignExcel,
  useProofingOrdersByOrder,
  useUsers,
  useAddDesignToOrder,
  useRemoveOrderDetail,
  useDesigns,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE } from "@/constants";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { toast } from "sonner";
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const role = user?.role as UserRole;

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [addDesignDialogOpen, setAddDesignDialogOpen] = useState(false);
  const [assignDesignerDialogOpen, setAssignDesignerDialogOpen] =
    useState(false);
  // Card-level editing states
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardEditValues, setCardEditValues] = useState<
    Record<string, string | number | null>
  >({});
  // OrderDetail item-level editing states
  const [editingOrderDetailId, setEditingOrderDetailId] = useState<
    number | null
  >(null);
  const [orderDetailEditValues, setOrderDetailEditValues] = useState<
    Record<string, string | number | null>
  >({});

  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

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

  const canUpdateOrderForAccounting =
    role === ROLE.ACCOUNTING ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.ADMIN;

  // Can change designer: DESIGN_LEAD or ADMIN
  const canChangeDesigner = role === ROLE.DESIGN_LEAD || role === ROLE.ADMIN;

  // Check if user is accounting role (not admin)
  const isAccountingRole =
    role === ROLE.ACCOUNTING || role === ROLE.ACCOUNTING_LEAD;

  // Check if order status is from "waiting_for_proofing" onwards
  // These statuses: waiting_for_proofing, waiting_for_production, in_production,
  // production_completed, invoice_issued, delivering, completed
  const restrictedStatuses = [
    "waiting_for_proofing",
    "waiting_for_production",
    "in_production",
    "production_completed",
    "invoice_issued",
    "delivering",
    "completed",
  ];
  const isOrderRestricted = order?.status
    ? restrictedStatuses.includes(order.status)
    : false;

  // Can add/remove products only if order is NOT in restricted status
  const canAddRemoveProducts =
    canUpdateOrderForAccounting && !isOrderRestricted;

  // Can edit order detail - only unitPrice if restricted, all fields if not
  const canEditOrderDetail = canUpdateOrderForAccounting;

  const { mutate: updateOrder, isPending: isUpdatingOrder } = useUpdateOrder();
  const { mutate: updateOrderForAccounting, loading: isUpdatingForAccounting } =
    useUpdateOrderForAccounting();
  const { mutate: addDesignToOrder, loading: isAddingDesign } =
    useAddDesignToOrder();
  const { mutate: removeOrderDetail, loading: isRemovingDetail } =
    useRemoveOrderDetail();

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

  // Helper to start editing an orderDetail item
  const startEditingOrderDetail = (
    orderDetailId: number,
    orderDetail: OrderDetailResponse
  ) => {
    setEditingOrderDetailId(orderDetailId);
    // If order is restricted (from waiting_for_proofing onwards), only allow editing unitPrice
    if (isOrderRestricted) {
      setOrderDetailEditValues({
        unitPrice: orderDetail.unitPrice?.toString() || "",
      });
    } else {
      setOrderDetailEditValues({
        quantity: orderDetail.quantity?.toString() || "",
        unitPrice: orderDetail.unitPrice?.toString() || "",
        requirements: orderDetail.requirements || "",
        additionalNotes: orderDetail.additionalNotes || "",
      });
    }
  };

  // Helper to cancel editing an orderDetail item
  const cancelEditingOrderDetail = () => {
    setEditingOrderDetailId(null);
    setOrderDetailEditValues({});
  };

  // Helper to save individual orderDetail item
  const handleSaveOrderDetail = async (orderDetailId: number) => {
    if (!order) return;

    const orderDetail = order.orderDetails?.find(
      (od) => od.id === orderDetailId
    );
    if (!orderDetail) return;

    // If order is restricted (from waiting_for_proofing onwards), only update unitPrice
    const updateData: UpdateOrderDetailForAccountingRequest = {
      orderDetailId: orderDetail.id,
      unitPrice:
        orderDetailEditValues.unitPrice === "" ||
        orderDetailEditValues.unitPrice === null
          ? null
          : Number(orderDetailEditValues.unitPrice),
    };

    // Only include other fields if order is NOT restricted
    if (!isOrderRestricted) {
      updateData.quantity =
        orderDetailEditValues.quantity === "" ||
        orderDetailEditValues.quantity === null
          ? null
          : Number(orderDetailEditValues.quantity);
      updateData.requirements =
        orderDetailEditValues.requirements === "" ||
        orderDetailEditValues.requirements === null
          ? null
          : String(orderDetailEditValues.requirements).trim();
      updateData.additionalNotes =
        orderDetailEditValues.additionalNotes === "" ||
        orderDetailEditValues.additionalNotes === null
          ? null
          : String(orderDetailEditValues.additionalNotes).trim();
    }

    const orderDetailsUpdates: UpdateOrderDetailForAccountingRequest[] = [
      updateData,
    ];

    try {
      await updateOrderForAccounting(order.id, {
        orderDetails: orderDetailsUpdates,
      } as UpdateOrderForAccountingRequest);
      setEditingOrderDetailId(null);
      setOrderDetailEditValues({});
    } catch (error) {
      // Keep editing mode on error
    }
  };

  // Helper to change designer
  const handleChangeDesigner = useCallback(
    async (designerId: number | null) => {
      if (!order) return;

      try {
        await updateOrder({
          id: order.id,
          data: { assignedToUserId: designerId },
        });
        toast.success("Thành công", {
          description: "Đã cập nhật designer cho đơn hàng",
        });
        setAssignDesignerDialogOpen(false);
      } catch (error) {
        toast.error("Lỗi", {
          description: "Không thể cập nhật designer",
        });
      }
    },
    [order, updateOrder]
  );

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
      if (!isAccountingRole && cardEditValues.assignedToUserId !== undefined) {
        payload.assignedToUserId =
          cardEditValues.assignedToUserId === "" ||
          cardEditValues.assignedToUserId === null
            ? null
            : Number(cardEditValues.assignedToUserId);
      }
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
    } else if (cardName === "orderDetails") {
      // Handle orderDetails updates
      const orderDetailsUpdates: UpdateOrderDetailForAccountingRequest[] = [];
      for (const key in cardEditValues) {
        if (key.startsWith("orderDetail_")) {
          const [_, detailId, detailField] = key.split("_");
          const orderDetail = order.orderDetails?.find(
            (od) => od.id === Number(detailId)
          );
          if (!orderDetail) continue;

          let existingUpdate = orderDetailsUpdates.find(
            (u) => u.orderDetailId === orderDetail.id
          );
          if (!existingUpdate) {
            existingUpdate = { orderDetailId: orderDetail.id };
            orderDetailsUpdates.push(existingUpdate);
          }

          if (detailField === "quantity" || detailField === "unitPrice") {
            existingUpdate[detailField] =
              cardEditValues[key] === "" || cardEditValues[key] === null
                ? null
                : Number(cardEditValues[key]);
          } else {
            existingUpdate[detailField] =
              cardEditValues[key] === "" || cardEditValues[key] === null
                ? null
                : String(cardEditValues[key]).trim();
          }
        }
      }
      payload.orderDetails = orderDetailsUpdates;
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

  // ===== PROOFING & PRODUCTION =====
  // Note: ProofingOrderListParams không có orderId để filter
  // Các proofing orders liên quan sẽ cần được fetch từ API riêng hoặc
  // thông qua orderDetails -> design -> proofingOrders
  // Tạm thời để trống, sẽ implement khi có API phù hợp

  const { data: relatedProofingOrders } = useProofingOrdersByOrder(orderId);

  const relatedProofing: ProofingOrderResponse[] = relatedProofingOrders ?? [];

  // Extract productions from proofing orders (they are already included in the response)
  const relatedProductions: ProductionResponse[] = relatedProofing
    .flatMap((proof) => proof.productions ?? [])
    .filter(
      (prod): prod is ProductionResponse => prod !== null && prod !== undefined
    );

  // Fetch users for assignedToUserId select
  const { data: usersData } = useUsers({ pageSize: 1000 });
  const users = usersData?.items || [];

  // Fetch designers for designer assignment
  const {
    data: designersData,
    isLoading: isLoadingDesigners,
    isFetching: isFetchingDesigners,
  } = useUsers({ role: "design", pageSize: 1000 });
  // Memoize designers array to prevent unnecessary re-renders
  const designers = useMemo(
    () => designersData?.items || [],
    [designersData?.items]
  );

  // Check if any design in order is confirmed for printing (locked)
  const hasDesignConfirmedForPrinting = useMemo(() => {
    return (
      order?.orderDetails?.some(
        (od) =>
          od.design?.status === "confirmed_for_printing" ||
          od.derivedStatus === "confirmed_for_printing"
      ) || false
    );
  }, [order?.orderDetails]);

  // Can change designer only if no design is confirmed for printing - MEMOIZED
  const canChangeDesignerForOrder = useMemo(
    () => canChangeDesigner && !hasDesignConfirmedForPrinting,
    [canChangeDesigner, hasDesignConfirmedForPrinting]
  );

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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Chi tiết sản phẩm
                  {orderDetailsCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {orderDetailsCount}
                    </Badge>
                  )}
                </CardTitle>
                {canAddRemoveProducts && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddDesignDialogOpen(true)}
                    disabled={isAddingDesign}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                )}
              </div>
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
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => {
                                  if (design.designImageUrl) {
                                    setViewingImage({
                                      url: design.designImageUrl,
                                      title: design.designName || "Design",
                                    });
                                  }
                                }}
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
                              <div className="space-y-1 flex-1">
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
                              {canEditOrderDetail && (
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {editingOrderDetailId === orderDetail.id ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          handleSaveOrderDetail(orderDetail.id!)
                                        }
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
                                        onClick={cancelEditingOrderDetail}
                                        disabled={isUpdatingForAccounting}
                                      >
                                        Hủy
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          startEditingOrderDetail(
                                            orderDetail.id!,
                                            orderDetail
                                          )
                                        }
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Sửa
                                      </Button>
                                      {canAddRemoveProducts && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (
                                              confirm(
                                                "Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?"
                                              )
                                            ) {
                                              removeOrderDetail({
                                                orderId: order.id,
                                                orderDetailId: orderDetail.id!,
                                              });
                                            }
                                          }}
                                          disabled={isRemovingDetail}
                                        >
                                          {isRemovingDetail ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
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
                              {/* Số lượng */}
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Số lượng
                                </p>
                                {editingOrderDetailId === orderDetail.id &&
                                !isOrderRestricted ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={
                                      orderDetailEditValues.quantity !==
                                      undefined
                                        ? orderDetailEditValues.quantity
                                        : orderDetail.quantity?.toString() || ""
                                    }
                                    onChange={(e) =>
                                      setOrderDetailEditValues({
                                        ...orderDetailEditValues,
                                        quantity: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm w-24"
                                  />
                                ) : (
                                  <p className="font-medium">
                                    {orderDetail.quantity?.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              {design?.laminationType && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Cán màn
                                  </p>
                                  <p className="font-medium">
                                    {laminationTypeLabels[
                                      design.laminationType
                                    ] ||
                                      design.laminationType ||
                                      "—"}
                                  </p>
                                </div>
                              )}
                              {design?.sidesClassification && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Mặt cắt
                                  </p>
                                  <p className="font-medium">
                                    {sidesClassificationLabels[
                                      design.sidesClassification
                                    ] ||
                                      design.sidesClassification ||
                                      "—"}
                                  </p>
                                </div>
                              )}
                              {design?.processClassification && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Quy trình SX
                                  </p>
                                  <p className="font-medium">
                                    {processClassificationLabels[
                                      design.processClassification
                                    ] ||
                                      design.processClassification ||
                                      "—"}
                                  </p>
                                </div>
                              )}
                              {canViewPrice && (
                                <>
                                  {/* Đơn giá */}
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Đơn giá
                                    </p>
                                    {editingOrderDetailId === orderDetail.id ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={
                                          orderDetailEditValues.unitPrice !==
                                          undefined
                                            ? orderDetailEditValues.unitPrice
                                            : orderDetail.unitPrice?.toString() ||
                                              ""
                                        }
                                        onChange={(e) =>
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            unitPrice: e.target.value,
                                          })
                                        }
                                        className="h-8 text-sm w-32"
                                      />
                                    ) : (
                                      <p className="font-medium">
                                        {formatCurrency(
                                          orderDetail.unitPrice || 0
                                        )}
                                      </p>
                                    )}
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
                                    Nhân viên thiết kế
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
                            {(editingOrderDetailId === orderDetail.id ||
                              orderDetail.requirements ||
                              orderDetail.additionalNotes) && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                                {editingOrderDetailId === orderDetail.id &&
                                !isOrderRestricted ? (
                                  <>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Yêu cầu</Label>
                                      <Textarea
                                        value={
                                          orderDetailEditValues.requirements !==
                                          undefined
                                            ? orderDetailEditValues.requirements
                                            : orderDetail.requirements || ""
                                        }
                                        onChange={(e) =>
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            requirements: e.target.value,
                                          })
                                        }
                                        placeholder="Nhập yêu cầu"
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Ghi chú</Label>
                                      <Textarea
                                        value={
                                          orderDetailEditValues.additionalNotes !==
                                          undefined
                                            ? orderDetailEditValues.additionalNotes
                                            : orderDetail.additionalNotes || ""
                                        }
                                        onChange={(e) =>
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            additionalNotes: e.target.value,
                                          })
                                        }
                                        placeholder="Nhập ghi chú"
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
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
                                  </>
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
                <div className="space-y-4">
                  {relatedProofing.map((proof: ProofingOrderResponse) => {
                    const isCompleted = proof.status === "completed";
                    const hasProductions =
                      proof.productions && proof.productions.length > 0;
                    const completedProductions =
                      proof.productions?.filter((p) => p.status === "completed")
                        .length || 0;

                    return (
                      <div
                        key={proof.id}
                        className="group relative overflow-hidden border rounded-xl bg-gradient-to-br from-background to-muted/30 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                      >
                        {/* Decorative gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

                        <div className="p-5 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Package className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                      {proof.code}
                                    </h3>
                                    {proof.materialType?.name && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {proof.materialType.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <StatusBadge
                                  status={proof.status}
                                  label={
                                    proofingStatusLabels[proof.status || ""] ||
                                    "N/A"
                                  }
                                />
                              </div>

                              {/* Quick stats */}
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Box className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {proof.totalQuantity?.toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    sản phẩm
                                  </span>
                                </div>
                                {proof.proofingOrderDesigns &&
                                  proof.proofingOrderDesigns.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Palette className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {proof.proofingOrderDesigns.length}
                                      </span>
                                      <span className="text-muted-foreground">
                                        thiết kế
                                      </span>
                                    </div>
                                  )}
                                {hasProductions && (
                                  <div className="flex items-center gap-2">
                                    <Factory className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {proof.productions?.length}
                                    </span>
                                    <span className="text-muted-foreground">
                                      lệnh SX
                                    </span>
                                    {completedProductions > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="ml-1 text-xs border-green-500/50 text-green-700 dark:text-green-400"
                                      >
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {completedProductions} hoàn thành
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <Link to={`/proofing/${proof.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>

                          {/* Export status badges */}
                          {(proof.isPlateExported || proof.isDieExported) && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                              {proof.isPlateExported && proof.plateExport && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Kẽm: {proof.plateExport.vendorName}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-1 text-xs h-5 px-1.5"
                                  >
                                    {proof.plateExport.plateCount} tấm
                                  </Badge>
                                </div>
                              )}
                              {proof.isDieExported && proof.dieExports?.[0] && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                                  <Box className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                    Khuôn: {proof.dieExports[0].vendorName}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-1 text-xs h-5 px-1.5"
                                  >
                                    {proof.dieExports[0].dieCount} khuôn
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Production progress */}
                          {hasProductions &&
                            proof.productions &&
                            proof.productions.length > 0 && (
                              <div className="pt-2 border-t space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Tiến độ sản xuất
                                  </span>
                                  <span className="font-medium">
                                    {completedProductions}/
                                    {proof.productions.length} hoàn thành
                                  </span>
                                </div>
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${
                                        proof.productions.length > 0
                                          ? (completedProductions /
                                              proof.productions.length) *
                                            100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Package className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Chưa có lệnh bình bài nào
                  </p>
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Tạo mã bài từ các thiết kế trong đơn hàng
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {customerType === "company" ? (
                    <Building2 className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  Khách hàng
                </CardTitle>
                {canUpdateOrderForAccounting &&
                  (editingCard === "customerInfo" ? (
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
                          customerName: customerName || "",
                          customerCompanyName: customer?.companyName || "",
                          customerPhone: customerPhone || "",
                          customerEmail: customerEmail || "",
                          customerTaxCode: customerTaxCode || "",
                          customerAddress: customerAddress || "",
                        })
                      }
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Sửa
                    </Button>
                  ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning banner if customer info is incomplete */}
              {!isCustomerInfoComplete && editingCard !== "customerInfo" && (
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
                    </div>
                  </div>
                </div>
              )}

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
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {customerName.charAt(0)?.toUpperCase() || "K"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Customer Name */}
                      <div className="flex items-center gap-2 group">
                        <p className="font-semibold truncate">
                          {customerName || "Chưa có tên"}
                        </p>
                      </div>
                      {/* Customer Company Name */}
                      {customer?.companyName && (
                        <div className="flex items-center gap-2 group mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {typeof customer.companyName === "string"
                              ? customer.companyName
                              : ""}
                          </p>
                        </div>
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
                        {typeof customer?.code === "string"
                          ? customer.code
                          : "—"}
                      </span>
                    </div>
                    {/* Customer Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1">
                        {customerPhone || "Chưa có"}
                      </span>
                    </div>
                    {/* Customer Email */}
                    {customerEmail ? (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">{customerEmail}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="flex-1">Chưa có email</span>
                      </div>
                    )}
                    {/* Customer Address */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground flex-1">
                        {customerAddress || "Chưa có địa chỉ"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  ĐƠN ĐẶT HÀNG
                </CardTitle>
                {canUpdateOrderForAccounting &&
                  (editingCard === "orderInfo" ? (
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
                      onClick={() => {
                        startEditingCard("orderInfo", {
                          deliveryDate: formatDateTimeForInput(
                            order.deliveryDate
                          ),
                          deliveryAddress: order.deliveryAddress || "",
                          note: order.note || "",
                          assignedToUserId:
                            order.assignedTo !== null &&
                            order.assignedTo !== undefined
                              ? order.assignedTo
                              : undefined,
                        });
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Sửa
                    </Button>
                  ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Designer Assignment - Only for DESIGN_LEAD and ADMIN */}
              {canChangeDesignerForOrder && (
                <div className="space-y-2 pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Designer phụ trách
                    </Label>
                    {hasDesignConfirmedForPrinting && (
                      <span className="text-xs text-muted-foreground">
                        (Đã chốt in - không thể thay đổi)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {order.assignedUser ? (
                        <p className="text-sm font-medium">
                          {order.assignedUser.fullName}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Chưa phân công
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignDesignerDialogOpen(true)}
                      disabled={
                        isUpdatingOrder || hasDesignConfirmedForPrinting
                      }
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Phân công
                    </Button>
                  </div>
                </div>
              )}

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
                  {!isAccountingRole && (
                    <div className="space-y-2">
                      <Label>Phụ trách</Label>
                      <Select
                        value={
                          cardEditValues.assignedToUserId?.toString() || "none"
                        }
                        onValueChange={(value) =>
                          setCardEditValues({
                            ...cardEditValues,
                            assignedToUserId:
                              value === "none" ? null : Number(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn người phụ trách" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không có</SelectItem>
                          {users.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id?.toString() || ""}
                            >
                              {user.fullName ||
                                user.username ||
                                `User ${user.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ngày giao:</span>
                    <span className="font-medium">
                      {order.deliveryDate
                        ? formatDate(order.deliveryDate)
                        : "—"}
                    </span>
                  </div>
                  {!isAccountingRole && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phụ trách:</span>
                      <span className="font-medium">
                        {order.assignedUser?.fullName ||
                          order.creator?.fullName ||
                          "—"}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      Địa chỉ giao hàng:
                    </p>
                    <p className="text-sm">
                      {order.deliveryAddress || "Chưa có địa chỉ"}
                    </p>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipient Info Card - Only visible to admin and accounting */}
          {canUpdateRecipient && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Thông tin nhận hàng
                  </CardTitle>
                  {canUpdateRecipient &&
                    (editingCard === "recipientInfo" ? (
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
                    ))}
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
          )}

          {/* Payment Summary - only for allowed roles */}
          {canViewPrice && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Thanh toán
                  </CardTitle>
                  {canUpdateOrderForAccounting &&
                    (editingCard === "paymentInfo" ? (
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
                    ))}
                </div>
              </CardHeader>
              <CardContent>
                {editingCard === "paymentInfo" ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        Tổng tiền
                      </Label>
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
                      <Label className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        Đã cọc
                      </Label>
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
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Hạn thanh toán
                      </Label>
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
                  <div className="space-y-3">
                    {/* Total Amount */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Tổng tiền
                        </span>
                      </div>
                      <span className="text-base font-semibold">
                        {formatCurrency(order.totalAmount || 0)}
                      </span>
                    </div>

                    {/* Deposit Amount */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Đã cọc
                        </span>
                      </div>
                      <span className="text-base font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(order.depositAmount || 0)}
                      </span>
                    </div>

                    {/* Remaining Amount */}
                    <div className="flex items-center justify-between py-2 border-t">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Còn lại
                        </span>
                      </div>
                      <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>

                    {/* Payment Progress Bar */}
                    {order.totalAmount && order.totalAmount > 0 && (
                      <div className="pt-2 border-t">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Tiến độ thanh toán</span>
                            <span>
                              {Math.round(
                                ((order.depositAmount || 0) /
                                  order.totalAmount) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                              style={{
                                width: `${
                                  ((order.depositAmount || 0) /
                                    order.totalAmount) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Due Date */}
                    {order.paymentDueDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ImageViewerDialog
        open={!!viewingImage}
        onOpenChange={(open) => {
          if (!open) setViewingImage(null);
        }}
        imageUrl={viewingImage?.url || ""}
        title={viewingImage?.title || ""}
      />
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

      <PrintOrderDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        orderId={order.id}
      />

      {/* Add Design Dialog */}
      <Dialog open={addDesignDialogOpen} onOpenChange={setAddDesignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm vào đơn hàng</DialogTitle>
            <DialogDescription>
              Chọn thiết kế và số lượng để thêm vào đơn hàng
            </DialogDescription>
          </DialogHeader>
          <AddDesignToOrderForm
            orderId={order.id}
            onSuccess={() => {
              setAddDesignDialogOpen(false);
            }}
            onCancel={() => setAddDesignDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Designer Dialog */}
      <Dialog
        open={assignDesignerDialogOpen}
        onOpenChange={setAssignDesignerDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân công Designer</DialogTitle>
            <DialogDescription>
              Chọn designer phụ trách cho đơn hàng này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Designer phụ trách</Label>
              <Select
                value={order.assignedToUserId?.toString() || "none"}
                onValueChange={(value) => {
                  const designerId = value === "none" ? null : Number(value);
                  handleChangeDesigner(designerId);
                }}
                disabled={isUpdatingOrder || hasDesignConfirmedForPrinting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn designer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa phân công</SelectItem>
                  {designers.map((designer) => (
                    <SelectItem
                      key={designer.id}
                      value={designer.id?.toString() || ""}
                    >
                      {designer.fullName ||
                        designer.username ||
                        `Designer ${designer.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasDesignConfirmedForPrinting && (
              <p className="text-sm text-muted-foreground">
                Đã chốt in - không thể thay đổi designer
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDesignerDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for adding design to order
function AddDesignToOrderForm({
  orderId,
  onSuccess,
  onCancel,
}: {
  orderId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const { mutate: addDesignToOrder, loading: isAdding } = useAddDesignToOrder();
  const { data: designsData } = useDesigns({ pageNumber: 1, pageSize: 1000 });

  const designs = designsData?.items || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignId || !quantity || Number(quantity) < 1) {
      return;
    }

    try {
      await addDesignToOrder({
        id: orderId,
        payload: {
          designId: selectedDesignId,
          quantity: Number(quantity),
        },
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Chọn thiết kế</Label>
        <Select
          value={selectedDesignId?.toString() || ""}
          onValueChange={(value) => setSelectedDesignId(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn thiết kế" />
          </SelectTrigger>
          <SelectContent>
            {designs.map((design) => (
              <SelectItem key={design.id} value={design.id?.toString() || ""}>
                {design.code} - {design.designName || "Chưa đặt tên"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Số lượng</Label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Nhập số lượng"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={!selectedDesignId || isAdding}>
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang thêm...
            </>
          ) : (
            "Thêm"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
