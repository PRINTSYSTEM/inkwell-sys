import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { format } from "date-fns";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  ChevronsUpDown,
  History,
  FileCheck,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  UpdateOrderRequest,
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
  useCustomers,
  customerApi,
  useOrders,
  orderCrudApi,
  useProductionOrdersByOrder,
  useCancelOrder,
} from "@/hooks";
import { useExportOrderPDF } from "@/hooks/use-order";
import { useSharedAddresses } from "@/hooks/use-shared-address";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE, ROUTE_PATHS } from "@/constants";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { toast } from "sonner";
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const role = user?.role as UserRole;

  const { data: sharedAddressesData } = useSharedAddresses({
    pageNumber: 1,
    pageSize: 1000,
  });
  const sharedAddresses = sharedAddressesData?.items || [];

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [addDesignDialogOpen, setAddDesignDialogOpen] = useState(false);
  const [assignDesignerDialogOpen, setAssignDesignerDialogOpen] =
    useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  // Card-level editing states
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardEditValues, setCardEditValues] = useState<any>({});

  // OrderDetail item-level editing states
  const [editingOrderDetailId, setEditingOrderDetailId] = useState<
    number | null
  >(null);
  const [orderDetailEditValues, setOrderDetailEditValues] = useState<
    Record<string, string | number | null>
  >({});
  // Customer search logic (by Customers)
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const { data: searchCustomersData, isLoading: loadingSearchCustomers } =
    useCustomers({
      pageNumber: 1,
      pageSize: 20,
      search: customerSearchText,
    });
  const searchCustomersList = searchCustomersData?.items || [];

  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // ===== FETCH ORDER =====
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch,
  } = useOrder(orderId || null, !!orderId);

  const { mutate: cancelOrder, loading: isCancellingOrder } = useCancelOrder();

  const [hasInitiatedCancel, setHasInitiatedCancel] = useState(false);

  // Reset cancellation state when navigating to a different order
  useEffect(() => {
    setHasInitiatedCancel(false);
  }, [orderId]);

  // Automatically cancel order if product details count becomes 0
  useEffect(() => {
    if (
      order &&
      order.status !== "cancelled" &&
      (!order.orderDetails || order.orderDetails.length === 0) &&
      !isCancellingOrder &&
      !hasInitiatedCancel
    ) {
      setHasInitiatedCancel(true);
      cancelOrder(order.id, { reason: "Không có sản phẩm" });
    }
  }, [order, cancelOrder, isCancellingOrder, hasInitiatedCancel]);

  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;
  const canViewDesigner =
    role === ROLE.DESIGN ||
    role === ROLE.DESIGN_LEAD ||
    role === ROLE.ADMIN ||
    role === ROLE.SALE;

  const canExportExcel =
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.ADMIN ||
    role === ROLE.SALE ||
    role === ROLE.ACCOUNTING;

  const canUpdateRecipient =
    role === ROLE.ACCOUNTING ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.SALE ||
    role === ROLE.ADMIN;

  const canUpdateOrderForAccounting =
    role === ROLE.ACCOUNTING ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.SALE ||
    role === ROLE.ADMIN;

  // Can view payment step in flow diagram: ACCOUNTING, ACCOUNTING_LEAD, or ADMIN
  const canViewPayment =
    role === ROLE.ACCOUNTING ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.SALE ||
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

  // Can edit quantity - designer roles can edit quantity only
  const canEditQuantity =
    role === ROLE.DESIGN ||
    role === ROLE.DESIGN_LEAD ||
    canUpdateOrderForAccounting;

  // Can edit order detail - accounting can edit all fields, designer can only edit quantity
  const canEditOrderDetail = canUpdateOrderForAccounting || canEditQuantity;

  // Check if current user is designer (not accounting/admin)
  const isDesignerRole = role === ROLE.DESIGN || role === ROLE.DESIGN_LEAD;

  const { mutateAsync: updateOrder, isPending: isUpdatingOrder } =
    useUpdateOrder();
  const { execute: updateOrderForAccounting, loading: isUpdatingForAccounting } =
    useUpdateOrderForAccounting();
  const { mutate: addDesignToOrder, loading: isAddingDesign } =
    useAddDesignToOrder();
  const { mutate: removeOrderDetail, loading: isRemovingDetail } =
    useRemoveOrderDetail();
  const exportPDFMutation = useExportOrderPDF();

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
    initialValues: Record<string, string | number | null>,
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
    orderDetail: OrderDetailResponse,
  ) => {
    setEditingOrderDetailId(orderDetailId);

    // Designer can only edit quantity
    if (isDesignerRole) {
      setOrderDetailEditValues({
        quantity: orderDetail.quantity?.toString() || "",
      });
      return;
    }

    // Accounting roles: If order is restricted (from waiting_for_proofing onwards), only allow editing unitPrice and address
    if (isOrderRestricted) {
      setOrderDetailEditValues({
        unitPrice: orderDetail.unitPrice?.toString() || "",
        sharedAddressId: (orderDetail as any).sharedAddressId,
      });
    } else {
      setOrderDetailEditValues({
        quantity: orderDetail.quantity?.toString() || "",
        unitPrice: orderDetail.unitPrice?.toString() || "",
        requirements: orderDetail.requirements || "",
        additionalNotes: orderDetail.additionalNotes || "",
        sharedAddressId: (orderDetail as any).sharedAddressId,
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
      (od) => od.id === orderDetailId,
    );
    if (!orderDetail) return;

    const updateData: UpdateOrderDetailForAccountingRequest = {
      orderDetailId: orderDetail.id,
    };

    // Designer can only update quantity
    if (isDesignerRole) {
      updateData.quantity =
        orderDetailEditValues.quantity === "" ||
        orderDetailEditValues.quantity === null
          ? null
          : Number(orderDetailEditValues.quantity);
    } else {
      // Accounting roles: If order is restricted (from waiting_for_proofing onwards), only update unitPrice
      if (isOrderRestricted) {
        updateData.unitPrice =
          orderDetailEditValues.unitPrice === "" ||
          orderDetailEditValues.unitPrice === null
            ? null
            : Number(orderDetailEditValues.unitPrice);
      } else {
        // Include all fields if order is NOT restricted
        updateData.unitPrice =
          orderDetailEditValues.unitPrice === "" ||
          orderDetailEditValues.unitPrice === null
            ? null
            : Number(orderDetailEditValues.unitPrice);
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
      
      // Address can be updated regardless of restriction status
      if (orderDetailEditValues.sharedAddressId !== undefined) {
        (updateData as any).sharedAddressId = orderDetailEditValues.sharedAddressId;
      }
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
    [order, updateOrder],
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

      // Send customerId if it was changed
      if (cardEditValues.customerId) {
        (payload as any).customerId = Number(cardEditValues.customerId);
      }
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
            (od) => od.id === Number(detailId),
          );
          if (!orderDetail) continue;

          let existingUpdate = orderDetailsUpdates.find(
            (u) => u.orderDetailId === orderDetail.id,
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
      if (
        cardName === "customerInfo" ||
        cardName === "orderInfo" ||
        cardName === "recipientInfo"
      ) {
        await updateOrder({
          id: order.id,
          data: payload as UpdateOrderRequest,
        });
      } else {
        await updateOrderForAccounting(
          order.id,
          payload as UpdateOrderForAccountingRequest,
        );
      }

      // Cập nhật thông tin khách hàng vào danh mục khách hàng master
      if (cardName === "customerInfo" && cardEditValues.customerId) {
        try {
          await customerApi.update(Number(cardEditValues.customerId), {
            name: String(cardEditValues.customerName || ""),
            companyName: String(cardEditValues.customerCompanyName || ""),
            phone: String(cardEditValues.customerPhone || ""),
            email: String(cardEditValues.customerEmail || ""),
            taxCode: String(cardEditValues.customerTaxCode || ""),
            address: String(cardEditValues.customerAddress || ""),
          });
        } catch (customerError) {
          console.error(
            "Failed to update customer master data:",
            customerError,
          );
          toast.warning(
            "Lưu danh mục khách hàng thất bại, đơn hàng vẫn được lưu.",
          );
        }
      }

      // Close editing mode early for better responsiveness
      setEditingCard(null);
      setCardEditValues({});
      setIsChangingCustomer(false);

      // Refresh data in background
      await refetch();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Lưu thông tin thất bại. Vui lòng thử lại.");
    }
  };

  // ===== PROOFING & PRODUCTION =====
  // Note: ProofingOrderListParams không có orderId để filter
  // Các proofing orders liên quan sẽ cần được fetch từ API riêng hoặc
  // thông qua orderDetails -> design -> proofingOrders
  // Tạm thời để trống, sẽ implement khi có API phù hợp

  const { data: relatedProofingOrders } = useProofingOrdersByOrder(orderId);

  const relatedProofing: ProofingOrderResponse[] = relatedProofingOrders ?? [];

  const { data: productionOrdersData, isLoading: isLoadingProductions } =
    useProductionOrdersByOrder(orderId, { pageSize: 50 });
  const relatedProductions = productionOrdersData?.items ?? [];

  // Fetch users for assignedToUserId select
  const { data: usersData } = useUsers({ pageSize: 100 });
  const users = usersData?.items || [];

  // Fetch designers for designer assignment
  const {
    data: designersData,
    isLoading: isLoadingDesigners,
    isFetching: isFetchingDesigners,
  } = useUsers({ role: "design", pageSize: 100 });
  // Memoize designers array to prevent unnecessary re-renders
  const designers = useMemo(
    () => designersData?.items || [],
    [designersData?.items],
  );

  // Check if any design in order is confirmed for printing (locked)
  const hasDesignConfirmedForPrinting = useMemo(() => {
    return (
      order?.orderDetails?.some(
        (od) =>
          od.design?.status === "confirmed_for_printing" ||
          od.derivedStatus === "confirmed_for_printing",
      ) || false
    );
  }, [order?.orderDetails]);

  // Can change designer only if no design is confirmed for printing - MEMOIZED
  const canChangeDesignerForOrder = useMemo(
    () => canChangeDesigner && !hasDesignConfirmedForPrinting,
    [canChangeDesigner, hasDesignConfirmedForPrinting],
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
  const customerName = order.customerName || "";
  const customerPhone = order.customerPhone || "";
  const customerAddress = order.customerAddress || "";
  const customerEmail = order.customerEmail || "";
  const customerCompanyName = order.customerCompanyName || "";
  const customerTaxCode = order.customerTaxCode || "";

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

  // Check for warnings and critical issues
  const now = new Date();
  const isPaymentDueOverdue = order.paymentDueDate
    ? new Date(order.paymentDueDate) < now
    : false;
  const isDeliveryDatePassed =
    order.deliveryDate &&
    order.status !== "completed" &&
    order.status !== "delivered"
      ? new Date(order.deliveryDate) < now
      : false;
  const isDebtOverLimit = Boolean(
    order.customer?.currentDebt &&
    order.customer?.maxDebt &&
    order.customer.currentDebt > order.customer.maxDebt,
  );

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
              <span className="text-sm text-muted-foreground">
                Trạng thái hiện tại:
              </span>{" "}
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
            {(role === ROLE.SALE ||
              role === ROLE.ADMIN ||
              role === ROLE.MANAGER) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  navigate(`/accounting/orders/${order.id}?tab=payment`)
                }
              >
                Báo giá
              </Button>
            )}
            {canExportExcel && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => order && exportPDFMutation.mutate(order.id)}
                disabled={exportPDFMutation.loading}
              >
                {exportPDFMutation.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                In đơn
              </Button>
            )}
            {order.status !== "cancelled" &&
              (role === ROLE.SALE ||
                role === ROLE.ADMIN ||
                role === ROLE.MANAGER) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Hủy đơn
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
            canViewPayment={canViewPayment}
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
                        className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative ${
                          editingOrderDetailId !== orderDetail.id && design?.id
                            ? "cursor-pointer"
                            : ""
                        }`}
                        onClick={() => {
                          // Only navigate if not editing this orderDetail and design exists
                          if (
                            editingOrderDetailId !== orderDetail.id &&
                            design?.id
                          ) {
                            navigate(`/design/detail/${design.id}`);
                          }
                        }}
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
                                  <span className="text-sm text-muted-foreground">
                                    Trạng thái hiện tại:
                                  </span>{" "}
                                  <StatusBadge
                                    status={statusValue || ""}
                                    label={
                                      designStatusLabels[design?.status || ""]
                                    }
                                  />
                                </div>
                                <h4 className="font-medium break-all">
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSaveOrderDetail(
                                            orderDetail.id!,
                                          );
                                        }}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelEditingOrderDetail();
                                        }}
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingOrderDetail(
                                            orderDetail.id!,
                                            orderDetail,
                                          );
                                        }}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Sửa
                                      </Button>
                                      {canAddRemoveProducts && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              confirm(
                                                "Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?",
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
                                  {design.width
                                    ? `${design.length} x ${design.width} x ${design.height}`
                                    : `${design.length} x ${design.height} `}{" "}
                                  mm
                                </p>
                              </div>
                              {/* Số lượng */}
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Số lượng
                                </p>
                                {editingOrderDetailId === orderDetail.id &&
                                (isDesignerRole || !isOrderRestricted) ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={
                                      orderDetailEditValues.quantity !==
                                      undefined
                                        ? orderDetailEditValues.quantity
                                        : orderDetail.quantity?.toString() || ""
                                    }
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setOrderDetailEditValues({
                                        ...orderDetailEditValues,
                                        quantity: e.target.value,
                                      });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 text-sm w-24"
                                  />
                                ) : (
                                  <p className="font-medium">
                                    {orderDetail.quantity?.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              {(() => {
                                const specs =
                                  design?.specification ||
                                  (design as any)?.specifications;
                                const hasSpecs =
                                  (Array.isArray(specs) && specs.length > 0) ||
                                  (typeof specs === "string" &&
                                    specs.trim().length > 0);

                                if (hasSpecs) {
                                  return (
                                    <div className="col-span-2">
                                      <p className="text-muted-foreground text-xs">
                                        Quy cách đầy đủ
                                      </p>
                                      <p className="font-medium text-amber-600">
                                        {Array.isArray(specs)
                                          ? specs.join(", ")
                                          : specs}
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <>
                                    {design?.laminationType && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">
                                          Cán màng
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
                                          Mặt in
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
                                          Quy cách sản xuất
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
                                  </>
                                );
                              })()}
                              {design?.adhesiveOffset != null &&
                                typeof design.adhesiveOffset === "number" &&
                                design.adhesiveOffset > 0 && (
                                  <>
                                    <div>
                                      <p className="text-muted-foreground text-xs">
                                        Mép dán
                                      </p>
                                      <p className="font-medium">
                                        {design.adhesiveOffset} mm
                                      </p>
                                    </div>
                                  </>
                                )}
                              {canViewPrice && (
                                <>
                                  {/* Đơn giá */}
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Đơn giá
                                    </p>
                                    {editingOrderDetailId === orderDetail.id &&
                                    !isDesignerRole ? (
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
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            unitPrice: e.target.value,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 text-sm w-32"
                                      />
                                    ) : (
                                      <p className="font-medium">
                                        {formatCurrency(
                                          orderDetail.unitPrice || 0,
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
                                        orderDetail.totalPrice || 0,
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

                            {/* Requirements & Address */}
                            {(editingOrderDetailId === orderDetail.id ||
                              (orderDetail as any).sharedAddressId ||
                              orderDetail.requirements ||
                              orderDetail.additionalNotes) && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-3">
                                {editingOrderDetailId === orderDetail.id &&
                                !isDesignerRole && (
                                  <div className="space-y-2">
                                    <Label className="text-xs">Địa chỉ giao hàng</Label>
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <Select
                                        value={orderDetailEditValues.sharedAddressId ? orderDetailEditValues.sharedAddressId.toString() : "0"}
                                        onValueChange={(v) => {
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            sharedAddressId: v && v !== "0" ? Number(v) : null,
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="h-9 text-sm bg-background">
                                          <SelectValue placeholder="Chọn địa chỉ giao hàng..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">Không chọn</SelectItem>
                                          {sharedAddresses.map((sa: any) => (
                                            <SelectItem key={sa.id} value={sa.id.toString()} className="text-sm">
                                              {sa.label} {sa.address ? `- ${sa.address}` : ""}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                                
                                {editingOrderDetailId !== orderDetail.id && (orderDetail as any).sharedAddressId && (
                                  <div>
                                    <span className="text-muted-foreground">Địa chỉ giao hàng: </span>
                                    <span className="font-medium">
                                      {sharedAddresses.find(sa => sa.id === (orderDetail as any).sharedAddressId)?.label || "Đã chọn địa chỉ"}
                                      {sharedAddresses.find(sa => sa.id === (orderDetail as any).sharedAddressId)?.address 
                                        ? ` - ${sharedAddresses.find(sa => sa.id === (orderDetail as any).sharedAddressId)?.address}` 
                                        : ""}
                                    </span>
                                  </div>
                                )}

                                {editingOrderDetailId === orderDetail.id &&
                                !isDesignerRole &&
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
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            requirements: e.target.value,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
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
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setOrderDetailEditValues({
                                            ...orderDetailEditValues,
                                            additionalNotes: e.target.value,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
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
                Mã bài
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
                                <span className="text-sm text-muted-foreground">
                                  Trạng thái hiện tại:
                                </span>{" "}
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
                                    Khuôn:{" "}
                                    {proof.dieExports[0].die?.vendorName ||
                                      "N/A"}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-1 text-xs h-5 px-1.5"
                                  >
                                    {proof.dieExports.length} khuôn
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
                    Chưa có mã bài nào
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
              {isLoadingProductions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : relatedProductions.length > 0 ? (
                <div className="space-y-3">
                  {relatedProductions.map((prod) => (
                    <div
                      key={prod.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-primary">
                                SP-{prod.id}
                              </span>
                              {prod.proofingOrderCode && (
                                <Badge variant="outline" className="font-mono bg-muted/50 text-xs h-6">
                                  {prod.proofingOrderCode}
                                </Badge>
                              )}
                            </div>
                            <StatusBadge
                              status={prod.status}
                              className="h-7 text-xs px-3"
                              label={
                                productionStatusLabels[prod.status || ""] ||
                                "N/A"
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-[100px]">
                                Mã bình bài:
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {prod.proofingOrderCode || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-[100px]">
                                Phụ trách:
                              </span>
                              <span className="font-bold text-foreground">
                                {prod.productionLeadName || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-[100px]">
                                Đã sản xuất:
                              </span>
                              <span className="font-bold text-emerald-600 text-base">
                                {prod.producedQty?.toLocaleString() || "0"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground min-w-[100px]">
                                Khách hàng:
                              </span>
                              <span className="font-bold text-foreground truncate max-w-[200px]">
                                {prod.customerName || "—"}
                              </span>
                            </div>
                          </div>

                          {/* Production Steps Process Flow - Compact but Readable */}
                          {prod.steps && prod.steps.length > 0 && (
                            <div className="pt-4 mt-2 border-t border-dashed">
                              <div className="relative flex items-center justify-between w-full px-2">
                                {/* Connection line background */}
                                <div className="absolute top-[12px] left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0 mx-8" />

                                {prod.steps
                                  .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
                                  .map((step, index) => {
                                    const isCompleted = step.status === "completed" || step.status === "done";
                                    const isCurrent = step.status === "in_progress";

                                    return (
                                      <div key={step.id} className="relative z-10 flex flex-col items-center">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                  isCompleted
                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                                    : isCurrent
                                                      ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                                      : "bg-background border-muted-foreground/30 text-muted-foreground"
                                                }`}
                                              >
                                                {isCompleted ? (
                                                  <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                  <span className="text-[10px] font-bold">{index + 1}</span>
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <div className="space-y-1 p-1">
                                                <p className="font-bold text-xs">{step.stepTypeName}</p>
                                                <p className="text-[10px]">
                                                  Trạng thái:{" "}
                                                  {isCompleted ? "Đã xong" : isCurrent ? "Đang làm" : "Chờ"}
                                                </p>
                                                {step.assignedToName && (
                                                  <p className="text-[10px] opacity-80 italic">
                                                    Phụ trách: {step.assignedToName}
                                                  </p>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <span
                                          className={`mt-1.5 text-[11px] font-bold whitespace-nowrap px-1 ${
                                            isCurrent ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                                          }`}
                                        >
                                          {step.stepTypeName}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                Tiến độ sản xuất:
                              </span>
                              <span className="font-bold">
                                {prod.progressPercent || 0}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden border border-muted-foreground/10">
                                <div
                                  className="bg-primary h-full rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${prod.progressPercent || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between self-stretch py-1">
                          <div className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                            {prod.completedAt
                              ? "Đã hoàn thành"
                              : prod.startedAt
                                ? "Đang thực hiện"
                                : "Chưa bắt đầu"}
                          </div>
                          <div className="text-right text-sm font-semibold">
                            {prod.completedAt
                              ? formatDate(prod.completedAt)
                              : prod.startedAt
                                ? formatDate(prod.startedAt)
                                : "—"}
                          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <CardTitle className="text-base flex items-center gap-2 shrink-0">
                  {customerType === "company" ? (
                    <Building2 className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  Khách hàng
                </CardTitle>
                {editingCard === "customerInfo" ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        handleSaveCard("customerInfo");
                        setIsChangingCustomer(false);
                      }}
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
                      onClick={() => {
                        cancelEditingCard();
                        setIsChangingCustomer(false);
                      }}
                      disabled={isUpdatingForAccounting}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
                          customerId: customer?.id, // Keep current customer ID
                        })
                      }
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Cập nhật thông tin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsChangingCustomer(true);
                        startEditingCard("customerInfo", {
                          customerName: customerName || "",
                          customerCompanyName: customer?.companyName || "",
                          customerPhone: customerPhone || "",
                          customerEmail: customerEmail || "",
                          customerTaxCode: customerTaxCode || "",
                          customerAddress: customerAddress || "",
                          customerId: customer?.id,
                        });
                      }}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Thay đổi khách hàng
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning banner if customer info is incomplete */}
              {!isCustomerInfoComplete && editingCard !== "customerInfo" && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        ⚠️ Thông tin khách hàng chưa đầy đủ
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

              {/* Critical warning if debt over limit */}
              {isDebtOverLimit && editingCard !== "customerInfo" && (
                <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                        🚨 Công nợ vượt hạn mức
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Khách hàng đang nợ{" "}
                        <span className="font-bold text-destructive">
                          {formatCurrency(-(Math.abs(order.customer?.currentDebt || 0)))}
                        </span>
                        , vượt quá hạn mức cho phép{" "}
                        {formatCurrency(order.customer?.maxDebt || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {editingCard === "customerInfo" ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {isChangingCustomer && (
                    <div className="space-y-2">
                      <Label className="text-primary font-semibold">
                        Tìm khách hàng để thay đổi
                      </Label>
                      <Popover
                        open={customerComboOpen}
                        onOpenChange={setCustomerComboOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-background h-10 px-3 text-sm border-2 border-primary/30"
                          >
                            <span className="truncate text-left text-primary font-medium">
                              {customerSearchText ||
                                "Tìm theo tên, mã, số điện thoại..."}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[350px] p-0 bg-popover shadow-xl border-primary/20"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Tìm tên, mã, SĐT khách hàng..."
                              className="h-10 text-sm"
                              value={customerSearchText}
                              onValueChange={setCustomerSearchText}
                            />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty className="p-4 text-center text-sm">
                                {loadingSearchCustomers
                                  ? "Đang tải..."
                                  : "Không tìm thấy khách hàng này"}
                              </CommandEmpty>
                              <CommandGroup>
                                {searchCustomersList.map((c: any) => (
                                  <CommandItem
                                    key={c.id}
                                    onSelect={() => {
                                      setCustomerComboOpen(false);
                                      setIsChangingCustomer(false);
                                      setCustomerSearchText("");
                                      setCardEditValues({
                                        ...cardEditValues,
                                        customerId: c.id,
                                        customerName: c.name || "",
                                        customerCompanyName:
                                          c.companyName || "",
                                        customerPhone: c.phone || "",
                                        customerEmail: c.email || "",
                                        customerTaxCode: c.taxCode || "",
                                        customerAddress: c.address || "",
                                      });
                                      toast.info(
                                        `Đã chọn khách hàng ${c.name}`,
                                      );
                                    }}
                                    className="py-3 text-sm border-b last:border-0"
                                  >
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-primary">
                                          {c.name}
                                        </span>
                                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">
                                          {c.code}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {c.phone && <span>{c.phone}</span>}
                                        {c.companyName && (
                                          <span className="truncate max-w-[200px] border-l pl-2">
                                            {c.companyName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Separator className="my-4" />
                    </div>
                  )}

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
                  {(customerType === "company" ||
                    cardEditValues.customerCompanyName) && (
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
                    <Label>
                      Email{" "}
                      {(customerType === "company" ||
                        cardEditValues.customerCompanyName) &&
                        "*"}
                    </Label>
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
                      {customerCompanyName && (
                        <div className="flex items-center gap-2 group mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {customerCompanyName}
                          </p>
                        </div>
                      )}
                      <StatusBadge
                        status={customerType}
                        label={customerTypeLabels[customerType] || customerType}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">Mã KH:</span>
                      <span className="font-medium">
                        {customer?.code || "—"}
                      </span>
                    </div>
                    {customerTaxCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-20">MST:</span>
                        <span className="font-medium">{customerTaxCode}</span>
                      </div>
                    )}
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

      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Nhập lý do để xác nhận hủy đơn hàng này. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lý do hủy</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
              }}
              disabled={isCancellingOrder}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await cancelOrder(order.id, { reason: cancelReason.trim() || "Không" });
                  setCancelDialogOpen(false);
                  setCancelReason("");
                  await refetch();
                } catch {
                  // error is handled by hook
                }
              }}
              disabled={isCancellingOrder}
            >
              {isCancellingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                "Xác nhận hủy"
              )}
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
  const { data: designsData } = useDesigns({ pageNumber: 1, pageSize: 100 });

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
