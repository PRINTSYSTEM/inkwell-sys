import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ExternalLink,
  Printer,
  Truck,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  InvoiceStatusBadge,
  CustomerTypeBadge,
  InvoiceConfirmDialog,
  type InvoiceStatus,
} from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import {
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
} from "@/hooks/use-order";
import { useCreateAccountingForOrder } from "@/hooks/use-accounting";
import { useCreateInvoice } from "@/hooks/use-invoice";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { OrderResponse } from "@/Schema";

type OrderWithInvoiceStatus = OrderResponse & {
  invoiceStatus?: "not_issued" | "issued";
};
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { StatusBadge } from "../ui/status-badge";

// Helper to derive customer type
function deriveCustomerType(
  customer: OrderResponse["customer"]
): "company" | "retail" {
  return customer?.companyName ? "company" : "retail";
}

// For invoice list, we check if order can have invoice issued
// Allow invoice even if not fully paid - only require delivery
function canIssueInvoice(order: OrderResponse): boolean {
  // Must have delivery note (status is delivering, completed, or delivered)
  // Giao hàng xong mới được xuất hóa đơn
  return (
    order.status === "delivering" ||
    order.status === "completed" ||
    order.status === "delivered"
  );
}

// Check if customer information is complete for invoice issuance
function isCustomerInfoComplete(order: OrderResponse): boolean {
  const customer = order.customer;
  if (!customer) return false;

  const customerName = typeof customer.name === "string" ? customer.name : "";
  const customerPhone =
    typeof customer.phone === "string" ? customer.phone : "";
  const customerAddress =
    typeof customer.address === "string" ? customer.address : "";
  const customerEmail =
    typeof customer.email === "string" ? customer.email : "";
  const customerCompanyName =
    typeof customer.companyName === "string" ? customer.companyName : "";
  // taxCode may not exist in CustomerSummaryResponse (used in OrderResponse)
  const customerTaxCode =
    "taxCode" in customer && typeof customer.taxCode === "string"
      ? customer.taxCode
      : "";

  const isCompany = !!customerCompanyName;

  // Required fields: name, phone, address, email
  if (
    !customerName.trim() ||
    !customerPhone.trim() ||
    !customerAddress.trim() ||
    !customerEmail.trim()
  ) {
    return false;
  }

  // For company: also need taxCode (if field exists)
  if (isCompany && "taxCode" in customer && !customerTaxCode.trim()) {
    return false;
  }

  return true;
}

// Get reason why invoice cannot be issued
function getInvoiceDisableReason(
  order: OrderResponse,
  canInvoice: boolean,
  customerInfoComplete: boolean,
  invoiceStatus: string
): string | null {
  // Check if invoice already issued
  if (invoiceStatus === "issued") {
    return "Đã xuất hóa đơn";
  }

  // Check if order has been delivered (must deliver before issuing invoice)
  const hasDelivery =
    order.status === "delivering" ||
    order.status === "completed" ||
    order.status === "delivered";
  if (!hasDelivery) {
    return "Phải giao hàng trước khi xuất hóa đơn";
  }

  // Check if customer information is complete
  if (!customerInfoComplete) {
    const customer = order.customer;
    const missingFields: string[] = [];

    if (!customer?.name?.trim()) missingFields.push("Tên khách hàng");
    if (!customer?.phone?.trim()) missingFields.push("Số điện thoại");
    if (!customer?.address?.trim()) missingFields.push("Địa chỉ");
    if (!customer?.email?.trim()) missingFields.push("Email");

    // Check taxCode only if field exists (may not be in CustomerSummaryResponse)
    if (customer?.companyName && "taxCode" in customer) {
      const taxCode =
        typeof customer.taxCode === "string" ? customer.taxCode : "";
      if (!taxCode.trim()) {
        missingFields.push("Mã số thuế");
      }
    }

    return `Thiếu thông tin khách hàng: ${missingFields.join(", ")}`;
  }

  // All conditions met - invoice can be issued
  return null;
}

// Generate invoice number from order code(s)
// Format: "INV{orderCode}" - uses first order's code if multiple orders
function generateInvoiceNumber(
  selectedOrderIds: Set<number>,
  orders: OrderResponse[]
): string {
  if (selectedOrderIds.size === 0) {
    return "INV000";
  }

  // Find first selected order
  const firstOrderId = Array.from(selectedOrderIds)[0];
  const firstOrder = orders.find((o) => o.id === firstOrderId);

  if (!firstOrder || !firstOrder.code) {
    return "INV000";
  }

  // Format: INV{orderCode}
  return `INV${firstOrder.code}`;
}

export function InvoiceList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null
  );
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] =
    useState(false);

  const itemsPerPage = 10;

  // Fetch orders from API - filter for invoice orders
  const { data, isLoading, isError, error, refetch } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    filterType: "invoice",
  });

  const exportInvoiceMutation = useExportOrderInvoice();
  const exportDeliveryNoteMutation = useExportOrderDeliveryNote();
  const createAccountingMutation = useCreateAccountingForOrder();
  const createInvoiceMutation = useCreateInvoice();

  // Filter orders client-side
  const filteredOrders = useMemo(() => {
    if (!data?.items) return [];

    // Filter only orders that can have invoices (fully paid)
    return data.items.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.companyName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.phone?.includes(searchQuery);

      // For demo purposes, we'll show all orders but highlight which can have invoices
      return matchesSearch;
    });
  }, [data?.items, searchQuery]);

  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const handleViewDetails = (order: OrderResponse) => {
    navigate(`/accounting/orders/${order.id}?tab=invoice`);
  };

  const handleCreateInvoice = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceConfirm = async (orderId: string | number) => {
    try {
      await createAccountingMutation.mutate(Number(orderId));
      setIsInvoiceDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error creating accounting:", error);
    }
  };

  const handleExportInvoice = async (order: OrderResponse) => {
    if (!order.id) return;
    try {
      await exportInvoiceMutation.mutate(order.id);
    } catch (error) {
      console.error("Error exporting invoice:", error);
    }
  };

  const handleExportDeliveryNote = async (order: OrderResponse) => {
    if (!order.id) return;
    try {
      await exportDeliveryNoteMutation.mutate(order.id);
    } catch (error) {
      console.error("Error exporting delivery note:", error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Handle checkbox selection - only allow selecting orders from the same customer
  const handleToggleOrder = (orderId: number) => {
    const orderToToggle = filteredOrders.find((o) => o.id === orderId);
    if (!orderToToggle) return;

    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(orderId)) {
        // Deselecting - always allowed
        newSet.delete(orderId);
      } else {
        // Selecting - check if same customer
        if (prev.size === 0) {
          // First selection - always allowed
          newSet.add(orderId);
        } else {
          // Check if all selected orders have the same customer
          const firstSelectedOrder = filteredOrders.find(
            (o) => o.id && prev.has(o.id)
          );

          if (!firstSelectedOrder) {
            newSet.add(orderId);
            return newSet;
          }

          // Compare customer IDs
          const firstCustomerId = firstSelectedOrder.customer?.id;
          const newCustomerId = orderToToggle.customer?.id;

          if (
            firstCustomerId &&
            newCustomerId &&
            firstCustomerId === newCustomerId
          ) {
            // Same customer - allow selection
            newSet.add(orderId);
          } else {
            // Different customer - show error
            toast.error(
              "Chỉ có thể chọn các hóa đơn cùng một khách hàng. Vui lòng bỏ chọn các hóa đơn hiện tại trước."
            );
          }
        }
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      // Only select orders from the same customer
      // If there are already selected orders, only select from that customer
      if (selectedOrderIds.size > 0) {
        const firstSelectedOrder = filteredOrders.find(
          (o) => o.id && selectedOrderIds.has(o.id)
        );
        if (firstSelectedOrder?.customer?.id) {
          const customerId = firstSelectedOrder.customer.id;
          const sameCustomerOrders = filteredOrders
            .filter((o) => o.customer?.id === customerId && o.id)
            .map((o) => o.id!)
            .filter((id): id is number => !!id);
          setSelectedOrderIds(new Set(sameCustomerOrders));
        }
      } else {
        // No selection yet - select all orders from the first customer on the page
        if (filteredOrders.length > 0 && filteredOrders[0].customer?.id) {
          const firstCustomerId = filteredOrders[0].customer.id;
          const sameCustomerOrders = filteredOrders
            .filter((o) => o.customer?.id === firstCustomerId && o.id)
            .map((o) => o.id!)
            .filter((id): id is number => !!id);
          setSelectedOrderIds(new Set(sameCustomerOrders));
        }
      }
    }
  };

  // Handle create invoice from selected orders
  const handleCreateInvoiceFromSelected = () => {
    if (selectedOrderIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }

    // Check if all selected orders have the same customer
    const selectedOrders = filteredOrders.filter(
      (o) => o.id && selectedOrderIds.has(o.id)
    );
    if (selectedOrders.length === 0) {
      toast.error("Không tìm thấy đơn hàng đã chọn");
      return;
    }

    const firstCustomerId = selectedOrders[0].customer?.id;
    const allSameCustomer = selectedOrders.every(
      (o) => o.customer?.id === firstCustomerId
    );

    if (!allSameCustomer) {
      toast.error(
        "Chỉ có thể xuất hóa đơn cho các đơn hàng cùng một khách hàng"
      );
      return;
    }

    // Check if all selected orders have complete customer info
    const incompleteOrders = selectedOrders.filter(
      (o) => !isCustomerInfoComplete(o)
    );

    if (incompleteOrders.length > 0) {
      toast.error(
        `Có ${incompleteOrders.length} đơn hàng thiếu thông tin khách hàng. Vui lòng cập nhật trước khi xuất hóa đơn.`
      );
      return;
    }

    setIsCreateInvoiceDialogOpen(true);
  };

  const handleConfirmCreateInvoice = async () => {
    if (selectedOrderIds.size === 0) return;

    try {
      // Generate invoice number from first order's code
      const invoiceNumber = generateInvoiceNumber(
        selectedOrderIds,
        filteredOrders
      );

      const result = await createInvoiceMutation.mutateAsync({
        orderIds: Array.from(selectedOrderIds),
        invoiceNumber: invoiceNumber,
        taxRate: 0.08,
        notes: "",
      });

      // Clear selection and close dialog
      setSelectedOrderIds(new Set());
      setIsCreateInvoiceDialogOpen(false);

      // Navigate to invoice detail page
      if (result?.id) {
        navigate(`/invoices/${result.id}`);
      } else {
        // If no ID returned, just refetch
        refetch();
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Get selected orders for display
  const selectedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.id && selectedOrderIds.has(o.id));
  }, [filteredOrders, selectedOrderIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
  }, [selectedOrders]);

  // Convert API order to modal format
  const selectedOrderForModal = selectedOrder
    ? {
        id: selectedOrder.id,
        code: selectedOrder.code || "",
        status: selectedOrder.status || "",
        statusType: selectedOrder.statusType || "",
        totalAmount: selectedOrder.totalAmount,
        depositAmount: selectedOrder.depositAmount,
        deliveryDate: selectedOrder.deliveryDate || "",
        note: selectedOrder.note || "",
        createdAt: selectedOrder.createdAt,
        updatedAt: selectedOrder.updatedAt,
        customer: {
          id: selectedOrder.customer?.id || 0,
          name: selectedOrder.customer?.name || "",
          companyName: selectedOrder.customer?.companyName || null,
          phone: selectedOrder.customer?.phone || "",
          type: deriveCustomerType(selectedOrder.customer) as
            | "company"
            | "retail",
        },
        paymentStatus: "fully_paid" as const,
        invoiceStatus: canIssueInvoice(selectedOrder)
          ? ("not_issued" as const)
          : ("not_issued" as const),
      }
    : null;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={invoiceStatusFilter}
                onValueChange={setInvoiceStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái HĐ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="not_issued">Chưa xuất</SelectItem>
                  <SelectItem value="issued">Đã xuất</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedOrderIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  Đã chọn {selectedOrderIds.size} đơn hàng
                </span>
                <Badge variant="secondary">
                  Tổng: {formatCurrency(totalSelectedAmount)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderIds(new Set())}
                >
                  Bỏ chọn
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateInvoiceFromSelected}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Xuất hóa đơn ({selectedOrderIds.size})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrderIds.size === filteredOrders.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[140px]">Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-center">Trạng thái đơn</TableHead>
                <TableHead className="text-center">Hóa đơn</TableHead>
                <TableHead className="text-center">Ngày giao</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const customerType = deriveCustomerType(order.customer);
                  const canInvoice = canIssueInvoice(order);
                  const customerInfoComplete = isCustomerInfoComplete(order);
                  // Invoice status: check if invoice has been issued
                  // Use order.invoiceStatus if available, otherwise default to "not_issued"
                  const orderWithInvoice = order as OrderWithInvoiceStatus;
                  const invoiceStatus: InvoiceStatus =
                    (orderWithInvoice.invoiceStatus as InvoiceStatus) ||
                    "not_issued";
                  const isSelected = order.id
                    ? selectedOrderIds.has(order.id)
                    : false;
                  const isCheckboxDisabled =
                    !customerInfoComplete ||
                    !canInvoice ||
                    invoiceStatus === "issued";
                  const disableReason = getInvoiceDisableReason(
                    order,
                    canInvoice,
                    customerInfoComplete,
                    invoiceStatus
                  );

                  return (
                    <TableRow
                      key={order.id}
                      className={`group ${isSelected ? "bg-muted/50" : ""}`}
                    >
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-block">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  order.id && handleToggleOrder(order.id)
                                }
                                disabled={isCheckboxDisabled}
                              />
                            </div>
                          </TooltipTrigger>
                          {isCheckboxDisabled && disableReason && (
                            <TooltipContent>
                              <p className="max-w-xs">{disableReason}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium font-mono text-sm">
                        {order.code}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TruncatedText
                              text={
                                order.customer?.companyName ||
                                order.customer?.name ||
                                "—"
                              }
                              className="font-medium text-sm"
                            />
                            {!customerInfoComplete &&
                              invoiceStatus === "not_issued" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-3 w-3 text-warning" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Thiếu thông tin khách hàng</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {order.customer?.phone || "—"}
                            </span>
                            <CustomerTypeBadge type={customerType} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
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
                      </TableCell>
                      <TableCell className="text-center">
                        <InvoiceStatusBadge status={invoiceStatus} />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDate(order.deliveryDate)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoiceStatus === "not_issued" ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <DropdownMenuItem
                                      onClick={() => handleCreateInvoice(order)}
                                      disabled={
                                        !canInvoice || !customerInfoComplete
                                      }
                                      className="w-full"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Xuất hóa đơn
                                    </DropdownMenuItem>
                                  </div>
                                </TooltipTrigger>
                                {(!canInvoice || !customerInfoComplete) &&
                                  disableReason && (
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        {disableReason}
                                      </p>
                                    </TooltipContent>
                                  )}
                              </Tooltip>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleExportInvoice(order)}
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  In / Xuất Excel
                                </DropdownMenuItem>
                                {order.status === "completed" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleExportDeliveryNote(order)
                                      }
                                    >
                                      <Truck className="h-4 w-4 mr-2" />
                                      Xuất phiếu giao hàng
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages} ({totalItems} đơn hàng)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Modals */}
        <InvoiceConfirmDialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
          order={selectedOrderForModal}
          onConfirm={handleInvoiceConfirm}
        />

        {/* Create Invoice Dialog */}
        <Dialog
          open={isCreateInvoiceDialogOpen}
          onOpenChange={setIsCreateInvoiceDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Xuất hóa đơn cho {selectedOrderIds.size} đơn hàng
              </DialogTitle>
              <DialogDescription>
                Xác nhận xuất hóa đơn cho các đơn hàng đã chọn. Tất cả đơn hàng
                sẽ được gộp vào một hóa đơn.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {selectedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.code}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.customer?.companyName ||
                          order.customer?.name ||
                          "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatCurrency(order.totalAmount || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-t">
              <span className="font-medium">Tổng cộng:</span>
              <span className="text-lg font-bold">
                {formatCurrency(totalSelectedAmount)}
              </span>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateInvoiceDialogOpen(false)}
                disabled={createInvoiceMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmCreateInvoice}
                disabled={createInvoiceMutation.isPending}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {createInvoiceMutation.isPending
                  ? "Đang tạo..."
                  : "Xác nhận xuất hóa đơn"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
