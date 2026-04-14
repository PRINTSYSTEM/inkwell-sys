import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
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
  PaymentStatusBadge,
  InvoiceStatusBadge,
  CustomerTypeBadge,
  DebtStatusBadge,
} from "@/components/accounting";
import {
  useOrder,
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
  useGenerateOrderExcel,
  useExportOrderPDF,
  useUpdateOrderForAccounting,
} from "@/hooks/use-order";
import { useConfirmDeposit, useApproveDebt, useCreateAccountingForOrder } from "@/hooks/use-accounting";
import { useCreateInvoice, useInvoicesByOrder } from "@/hooks/use-invoice";
import { useCreateCashReceipt, useCashReceipts } from "@/hooks/use-cash";
import { useBankAccounts } from "@/hooks/use-bank";
import type {
  UpdateOrderForAccountingRequest,
  UpdateOrderDetailForAccountingRequest,
  CreateInvoiceRequest,
  CreateCashReceiptRequest,
} from "@/Schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Search } from "lucide-react";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { usePaymentMethods } from "@/hooks/use-expense";

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
  return (
    status === "delivering" || status === "completed" || status === "delivered"
  );
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

// Helper to check if customer information is complete for invoice
function isCustomerInfoComplete(order: {
  customerName?: string | null;
  customerTaxCode?: string | null;
  customerAddress?: string | null;
}): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  if (!order.customerName || order.customerName.trim() === "") {
    missingFields.push("Tên khách hàng");
  }

  if (!order.customerTaxCode || order.customerTaxCode.trim() === "") {
    missingFields.push("Mã số thuế");
  }

  if (!order.customerAddress || order.customerAddress.trim() === "") {
    missingFields.push("Địa chỉ");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
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
    refetch: refetchOrder,
  } = useOrder(Number(id || "0"));

  // Fetch invoices for this order
  const { data: invoicesData } = useInvoicesByOrder(
    order?.id || null,
    undefined,
    !!order?.id
  );

  // Fetch cash receipts for this order's customer to check if receipt exists
  const { data: cashReceiptsData } = useCashReceipts(
    order?.customerId
      ? {
          pageNumber: 1,
          pageSize: 100,
          customerId: order.customerId,
        }
      : undefined
  );

  // Check if order has cash receipt
  const hasCashReceipt =
    cashReceiptsData?.items?.some((receipt) => receipt.orderId === order?.id) ||
    false;

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  // Card-level editing states
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cardEditValues, setCardEditValues] = useState<
    Record<string, string | number | null>
  >({});

  // Check if selected payment method is Bank Transfer
  const isBankTransfer = useMemo(() => {
    if (!cardEditValues.paymentMethodId) return false;
    const method = paymentMethodsData?.items?.find(
      (m: any) => m.id?.toString() === cardEditValues.paymentMethodId?.toString()
    );
    return method?.name?.toLowerCase().includes("chuyển khoản") || false;
  }, [cardEditValues.paymentMethodId, paymentMethodsData]);

  // Fetch bank accounts when bank transfer is selected
  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } = useBankAccounts(
    isBankTransfer ? { pageNumber: 1, pageSize: 100 } : undefined
  );
  // Order detail editing states
  const [editingOrderDetailId, setEditingOrderDetailId] = useState<
    number | null
  >(null);
  const [orderDetailEditValues, setOrderDetailEditValues] = useState<
    Record<string, string | number | null>
  >({});
  // Deposit dialog state
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");

  // Mutations
  const exportInvoiceMutation = useExportOrderInvoice();
  const exportDeliveryNoteMutation = useExportOrderDeliveryNote();
  const generateExcelMutation = useGenerateOrderExcel();
  const exportPDFMutation = useExportOrderPDF();
  const confirmDepositMutation = useConfirmDeposit();
  const approveDebtMutation = useApproveDebt();
  const createAccountingMutation = useCreateAccountingForOrder();
  const { mutate: updateOrderForAccounting, loading: isUpdatingForAccounting } =
    useUpdateOrderForAccounting();
  const createInvoiceMutation = useCreateInvoice();
  const createCashReceiptMutation = useCreateCashReceipt();

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

  // Helper to start editing an orderDetail item
  const startEditingOrderDetail = (orderDetail: {
    id: number;
    quantity: number;
    unitPrice?: number | null;
  }) => {
    setEditingOrderDetailId(orderDetail.id);
    setOrderDetailEditValues({
      quantity: orderDetail.quantity.toString(),
      unitPrice: orderDetail.unitPrice?.toString() || "",
    });
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

    const orderDetailsUpdates: UpdateOrderDetailForAccountingRequest[] = [
      {
        orderDetailId: orderDetail.id,
        quantity:
          orderDetailEditValues.quantity === "" ||
          orderDetailEditValues.quantity === null
            ? null
            : Number(orderDetailEditValues.quantity),
        unitPrice:
          orderDetailEditValues.unitPrice === "" ||
          orderDetailEditValues.unitPrice === null
            ? null
            : Number(orderDetailEditValues.unitPrice),
      },
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
      // Phương thức thanh toán
      payload.paymentMethodId =
        cardEditValues.paymentMethodId === "" ||
        cardEditValues.paymentMethodId === null
          ? null
          : Number(cardEditValues.paymentMethodId);
      // Note: cashFundId không có trong UpdateOrderForAccountingRequest schema
      // Nếu cần thêm vào schema sau này, uncomment dòng dưới:
      // payload.cashFundId = cardEditValues.cashFundId === "" || cardEditValues.cashFundId === null ? null : Number(cardEditValues.cashFundId);
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

    if (cardName === "paymentInfo") {
      if (
        payload.depositAmount &&
        payload.depositAmount > 0 &&
        !payload.paymentMethodId
      ) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn phương thức thanh toán",
        });
        return;
      }

      if (isBankTransfer && !cardEditValues.bankAccountId) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn tài khoản ngân hàng",
        });
        return;
      }
    }

    try {
      await updateOrderForAccounting(
        order.id,
        payload as UpdateOrderForAccountingRequest
      );

      // Nếu là paymentInfo và có số tiền cọc, tự động tạo phiếu thu
      if (cardName === "paymentInfo") {
        const depositAmount =
          cardEditValues.depositAmount === "" ||
          cardEditValues.depositAmount === null
            ? null
            : Number(cardEditValues.depositAmount);
        const paymentMethodId =
          cardEditValues.paymentMethodId === "" ||
          cardEditValues.paymentMethodId === null
            ? null
            : Number(cardEditValues.paymentMethodId);
        const bankAccountId = cardEditValues.bankAccountId ? Number(cardEditValues.bankAccountId) : null;

        // Chỉ tạo phiếu thu nếu có số tiền (không cần đủ số tiền) và phương thức thanh toán
        if (depositAmount && depositAmount > 0 && paymentMethodId) {
          const now = new Date();
          const voucherDate = now.toISOString();
          const postingDate = now.toISOString();

          // Xác định payerName: ưu tiên customerCompanyName, nếu không có thì dùng customerName
          let payerName = "";
          if (order.customer?.type === "company") {
            payerName = order.customer?.companyName?.trim() || order.customer?.name?.trim() || "";
          } else {
            payerName = order.customer?.name?.trim() || "";
          }
          payerName = payerName || "Khách hàng ẩn danh";

          const cashReceiptRequest: any = {
            voucherDate,
            postingDate,
            payerName,
            amount: depositAmount,
            paymentMethodId,
            orderId: order.id,
            customerId: order.customerId || null,
            bankAccountId: bankAccountId || null,
            expenseCategoryId: null,
            reason: null,
            notes: order.note || null,
          };

          try {
            await createCashReceiptMutation.mutateAsync(cashReceiptRequest);
            // Refetch order và cash receipts để cập nhật UI (ẩn nút sửa)
            await refetchOrder();
          } catch (error) {
            // Error is handled by the hook, nhưng không block việc đóng edit mode
            console.error("Error creating cash receipt:", error);
          }
        }

        // Tự động cộng công nợ (tạo bản ghi kế toán) cho khách lẻ vì không có nút bấm
        if (order.customer?.type === "retail" && order.isDebtApproved === false) {
          try {
            await createAccountingMutation.mutate(order.id);
            await refetchOrder();
          } catch (error) {
            console.error("Error creating accounting record for retail customer:", error);
          }
        }
      }

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

  const handleExportInvoice = async () => {
    if (!order) return;

    try {
      // Check if invoice already exists for this order
      const hasInvoice = invoicesData?.items && invoicesData.items.length > 0;

      // If no invoice exists, create one first
      if (!hasInvoice) {
        const invoiceData: CreateInvoiceRequest = {
          orderIds: [order.id],
          invoiceNumber: "1",
          taxRate: 0.08,
          notes: order.note || null,
        };

        await createInvoiceMutation.mutateAsync(invoiceData);
      }

      // Then export the invoice
      await exportInvoiceMutation.mutate(order.id);
    } catch (error) {
      // Error is handled by the mutation hooks
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

    const isCompany = order.customer?.type === "company";

    if (order.customer?.type === "retail") {
      // Khách lẻ: mở dialog để nhập số tiền cọc
      setDepositAmount("");
      setIsDepositDialogOpen(true);
    } else {
      // Khách công ty: cộng công nợ
      approveDebtMutation.mutate(order.id);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!order) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập số tiền cọc hợp lệ",
      });
      return;
    }

    if (amount > order.totalAmount) {
      toast.error("Lỗi", {
        description: "Số tiền cọc không được vượt quá tổng tiền đơn hàng",
      });
      return;
    }

    try {
      // Bước 1: Cọc tiền với paymentMethodId = 2
      await updateOrderForAccounting(order.id, {
        depositAmount: amount,
        paymentMethodId: 2,
      } as UpdateOrderForAccountingRequest);

      // Bước 2: Cộng công nợ vào hệ thống
      await approveDebtMutation.mutate(order.id);

      setIsDepositDialogOpen(false);
      setDepositAmount("");
    } catch (error) {
      // Error is handled by the mutation hooks
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
  const customerType = order.customer?.type;

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
  const isDebtOverLimit =
    order.customer?.currentDebt &&
    order.customer?.maxDebt &&
    order.customer.currentDebt > order.customer.maxDebt;

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
                    <span className="text-sm text-muted-foreground">
                      Trạng thái hiện tại:
                    </span>{" "}
                    <StatusBadge
                      status={
                        order.status as keyof typeof ENTITY_CONFIG.orderStatuses.values
                      }
                      label={
                        ENTITY_CONFIG.orderStatuses.values[
                          order.status as keyof typeof ENTITY_CONFIG.orderStatuses.values
                        ]
                      }
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
                {order.isDebtApproved === false && order.customer?.type !== "retail" && (
                    <Button
                      size="sm"
                      onClick={() => approveDebtMutation.mutate(order.id)}
                      disabled={approveDebtMutation.loading}
                    >
                      {approveDebtMutation.loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Cộng công nợ
                    </Button>
                )}
                {invoiceStatus === "not_issued" &&
                  hasBeenDelivered(order.status) && (() => {
                    const customerInfoCheck = isCustomerInfoComplete(order);
                    const isDisabled =
                      !customerInfoCheck.isValid ||
                      exportInvoiceMutation.loading;
                    const disableReason = customerInfoCheck.missingFields.length > 0
                      ? `Vui lòng điền đầy đủ thông tin khách hàng: ${customerInfoCheck.missingFields.join(", ")}`
                      : "";

                    const button = (
                      <Button
                        size="sm"
                        onClick={handleExportInvoice}
                        disabled={isDisabled}
                      >
                        {exportInvoiceMutation.loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Xuất hóa đơn
                      </Button>
                    );

                    if (isDisabled && disableReason) {
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block">
                                {button}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{disableReason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return button;
                  })()}
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
                    Chuyển sang đang giao hàng
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
                    Chuyển thành đã giao hàng
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
                      ) : !hasCashReceipt ? (
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
                              paymentMethodId:
                                order.paymentMethodId?.toString() || "",
                              // cashFundId: "", // Removed - field no longer exists in schema
                            })
                          }
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Sửa
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCard === "paymentInfo" ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>
                          Số tiền <span className="text-destructive">*</span>
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
                          placeholder="Nhập số tiền"
                          className="text-lg font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Phương thức thanh toán{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={
                            cardEditValues.paymentMethodId?.toString() || "all"
                          }
                          onValueChange={(value) =>
                            setCardEditValues({
                              ...cardEditValues,
                              paymentMethodId: value === "all" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn phương thức thanh toán" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Không chọn</SelectItem>
                            {paymentMethodsData?.items?.map((method) => (
                              <SelectItem
                                key={method.id}
                                value={method.id?.toString() || ""}
                              >
                                {method.description ||
                                  method.name ||
                                  method.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isBankTransfer && (
                        <div className="space-y-2">
                          <Label>
                            Tài khoản thanh toán <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={cardEditValues.bankAccountId?.toString() || ""}
                            onValueChange={(val) =>
                              setCardEditValues({
                                ...cardEditValues,
                                bankAccountId: val,
                              })
                            }
                            disabled={isLoadingBankAccounts}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingBankAccounts ? "Đang tải..." : "Chọn tài khoản nhận tiền"} />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccountsData?.items?.map((acc: any) => (
                                <SelectItem key={acc.id} value={acc.id?.toString() || ""}>
                                  {acc.bankName ? `${acc.bankName} - ` : ""}{acc.accountNumber} ({acc.accountName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                        <div
                          className={`text-center p-4 rounded-lg ${
                            remainingAmount > 0 && isPaymentDueOverdue
                              ? "bg-red-100 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700"
                              : remainingAmount > 0
                                ? "bg-destructive/10"
                                : "bg-success/10"
                          }`}
                        >
                          <p
                            className={`text-sm mb-1 ${
                              remainingAmount > 0 && isPaymentDueOverdue
                                ? "text-red-700 dark:text-red-300 font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            Còn lại
                            {remainingAmount > 0 &&
                              isPaymentDueOverdue &&
                              " (Quá hạn)"}
                          </p>
                          <p
                            className={`text-xl font-bold tabular-nums ${
                              remainingAmount > 0 && isPaymentDueOverdue
                                ? "text-red-700 dark:text-red-400"
                                : remainingAmount > 0
                                  ? "text-destructive"
                                  : "text-success"
                            }`}
                          >
                            {formatCurrency(remainingAmount)}
                            {remainingAmount > 0 && isPaymentDueOverdue && (
                              <span className="block text-xs mt-1 bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                ⚠️ Đã quá hạn thanh toán
                              </span>
                            )}
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
                        <div
                          className={`pt-2 border-t ${isPaymentDueOverdue ? "bg-red-50 dark:bg-red-950/20 -mx-4 px-4 py-2 rounded" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar
                              className={`h-4 w-4 flex-shrink-0 ${
                                isPaymentDueOverdue
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div className="flex-1">
                              <span
                                className={`text-xs ${
                                  isPaymentDueOverdue
                                    ? "text-red-700 dark:text-red-300 font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Hạn thanh toán:{" "}
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  isPaymentDueOverdue
                                    ? "text-red-900 dark:text-red-100"
                                    : ""
                                }`}
                              >
                                {formatDateTime(order.paymentDueDate)}
                                {isPaymentDueOverdue && (
                                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-semibold">
                                    ĐÃ QUÁ HẠN
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Date Warning */}
                      {isDeliveryDatePassed && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                                ⚠️ Đã quá ngày giao hàng dự kiến
                              </p>
                              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                Ngày giao: {formatDateTime(order.deliveryDate)}{" "}
                                - Cần xử lý gấp
                              </p>
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
                        <TableHead className="text-center">
                          Người thiết kế
                        </TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
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
                          <TableCell className="text-center">
                            <div className="text-xs">
                              {item.design?.designer?.fullName ? (
                                <p className="font-medium">
                                  {item.design.designer.fullName}
                                </p>
                              ) : order.assignedUser?.fullName ? (
                                <p className="font-medium">
                                  {order.assignedUser.fullName}
                                </p>
                              ) : (
                                <p className="text-muted-foreground">—</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {editingOrderDetailId === item.id ? (
                              <Input
                                type="number"
                                min="1"
                                value={orderDetailEditValues.quantity || ""}
                                onChange={(e) =>
                                  setOrderDetailEditValues({
                                    ...orderDetailEditValues,
                                    quantity: e.target.value,
                                  })
                                }
                                className="w-20 text-center font-medium tabular-nums"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">
                                {item.quantity.toLocaleString("vi-VN")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingOrderDetailId === item.id ? (
                              <Input
                                type="number"
                                min="0"
                                step="1000"
                                value={orderDetailEditValues.unitPrice || ""}
                                onChange={(e) =>
                                  setOrderDetailEditValues({
                                    ...orderDetailEditValues,
                                    unitPrice: e.target.value,
                                  })
                                }
                                className="w-32 text-right tabular-nums"
                              />
                            ) : (
                              <span className="tabular-nums">
                                {formatCurrency(item.unitPrice || 0)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {editingOrderDetailId === item.id
                              ? formatCurrency(
                                  (Number(orderDetailEditValues.quantity) ||
                                    0) *
                                    (Number(orderDetailEditValues.unitPrice) ||
                                      0)
                                )
                              : formatCurrency(item.totalPrice || 0)}
                          </TableCell>
                          <TableCell>
                            {editingOrderDetailId === item.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleSaveOrderDetail(item.id)}
                                  disabled={isUpdatingForAccounting}
                                >
                                  {isUpdatingForAccounting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
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
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.id && item.quantity) {
                                    startEditingOrderDetail({
                                      id: item.id,
                                      quantity: item.quantity,
                                      unitPrice: item.unitPrice,
                                    });
                                  }
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell
                            colSpan={7}
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
                              customerName: order.customerName || "",
                              customerCompanyName:
                                order.customerCompanyName || "",
                              customerPhone: order.customerPhone || "",
                              customerEmail: order.customerEmail || "",
                              customerTaxCode: order.customerTaxCode || "",
                              customerAddress: order.customerAddress || "",
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
                      {customerType === "company" && (
                        <div className="space-y-2">
                          <Label>Mã số thuế</Label>
                          <Input
                            value={cardEditValues.customerTaxCode || ""}
                            onChange={(e) =>
                              setCardEditValues({
                                ...cardEditValues,
                                customerTaxCode: e.target.value,
                              })
                            }
                            placeholder="Nhập mã số thuế"
                          />
                        </div>
                      )}
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
                      {order.customerCompanyName && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Công ty
                            </p>
                            <p className="font-medium">
                              {order.customerCompanyName}
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
                            {order.customerName || "—"}
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
                            {order.customerPhone || "—"}
                          </p>
                        </div>
                      </div>
                      {order.customerEmail && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Email
                            </p>
                            <p className="font-medium">{order.customerEmail}</p>
                          </div>
                        </div>
                      )}
                      {order.customer?.code && (
                        <div className="flex items-start gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Mã khách hàng
                            </p>
                            <p className="font-medium font-mono">
                              {order.customer.code ?? ""}
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Hiển thị mã số thuế cho khách hàng công ty */}
                      {customerType === "company" && (
                        <div className="flex items-start gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Mã số thuế
                            </p>
                            <p className="font-medium font-mono">
                              {order.customerTaxCode || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.customerAddress && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Địa chỉ
                            </p>
                            <p className="font-medium">
                              {order.customerAddress}
                            </p>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Critical warning if debt over limit */}
                      {isDebtOverLimit && (
                        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-700 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                                🚨 Công nợ vượt hạn mức
                              </p>
                              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                Khách hàng đang nợ{" "}
                                {formatCurrency(
                                  order.customer?.currentDebt || 0
                                )}
                                , vượt quá hạn mức cho phép{" "}
                                {formatCurrency(order.customer?.maxDebt || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-lg space-y-2 ${
                          isDebtOverLimit
                            ? "bg-red-50/50 dark:bg-red-950/10 border-2 border-red-200 dark:border-red-900"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Trạng thái nợ
                          </span>
                          <DebtStatusBadge
                            status={order.customer?.debtStatus || null}
                            className="text-xs"
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Nợ hiện tại
                          </span>
                          <span
                            className={`font-medium tabular-nums ${
                              isDebtOverLimit
                                ? "text-red-700 dark:text-red-400 font-bold"
                                : ""
                            }`}
                          >
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
                        <Calendar
                          className={`h-4 w-4 mt-0.5 ${
                            isDeliveryDatePassed
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm ${
                              isDeliveryDatePassed
                                ? "text-orange-700 dark:text-orange-300 font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            Ngày giao dự kiến
                            {isDeliveryDatePassed && " (Đã quá hạn)"}
                          </p>
                          <p
                            className={`font-medium ${
                              isDeliveryDatePassed
                                ? "text-orange-900 dark:text-orange-100"
                                : ""
                            }`}
                          >
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
                      <div
                        className={`rounded-lg p-3 border-2 ${
                          isDeliveryDatePassed
                            ? "bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700"
                            : "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isDeliveryDatePassed ? (
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p
                              className={`text-xs font-semibold ${
                                isDeliveryDatePassed
                                  ? "text-red-900 dark:text-red-100"
                                  : "text-amber-900 dark:text-amber-100"
                              }`}
                            >
                              {isDeliveryDatePassed ? "🚨 " : "⚠️ "}
                              Thiếu thông tin người nhận
                              {isDeliveryDatePassed && " - Đã quá ngày giao!"}
                            </p>
                            <ul
                              className={`text-xs mt-1 list-disc list-inside space-y-0.5 ${
                                isDeliveryDatePassed
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-amber-700 dark:text-amber-300"
                              }`}
                            >
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
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhận cọc đơn hàng</DialogTitle>
            <DialogDescription>
              Nhập số tiền cọc cho đơn hàng {order?.code}
            </DialogDescription>
          </DialogHeader>

          {order && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng tiền</span>
                  <span className="font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đã cọc</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(order.depositAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">Còn lại</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(order.totalAmount - order.depositAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">
                  Số tiền cọc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  step={1000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Nhập số tiền cọc"
                  className="text-lg font-medium"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDepositDialogOpen(false);
                setDepositAmount("");
              }}
              disabled={confirmDepositMutation.loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              disabled={
                confirmDepositMutation.loading ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0
              }
            >
              {confirmDepositMutation.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận nhận cọc"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
