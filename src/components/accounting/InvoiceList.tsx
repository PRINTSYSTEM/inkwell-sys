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
  OrderStatusBadge,
  InvoiceStatusBadge,
  CustomerTypeBadge,
  InvoiceConfirmDialog,
} from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import {
  useExportOrderInvoice,
  useExportOrderDeliveryNote,
} from "@/hooks/use-order";
import { useCreateAccountingForOrder } from "@/hooks/use-accounting";
import type { OrderResponse } from "@/Schema";

// Helper to derive customer type
function deriveCustomerType(
  customer: OrderResponse["customer"]
): "company" | "retail" {
  return customer?.companyName ? "company" : "retail";
}

// For invoice list, we check if order is complete (fully paid) to determine if invoice can be issued
// In a real app, this would come from backend accounting data
function canIssueInvoice(order: OrderResponse): boolean {
  return order.depositAmount >= order.totalAmount && order.totalAmount > 0;
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

  const itemsPerPage = 10;

  // Fetch orders from API - filter for completed/paid orders
  const { data, isLoading, isError, error, refetch } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    filterType: "invoice",
  });

  const exportInvoiceMutation = useExportOrderInvoice();
  const exportDeliveryNoteMutation = useExportOrderDeliveryNote();
  const createAccountingMutation = useCreateAccountingForOrder();

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

      {/* Filters */}
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

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
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
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const customerType = deriveCustomerType(order.customer);
                const canInvoice = canIssueInvoice(order);
                // For demo: consider invoice issued if order is fully paid and completed
                const invoiceStatus =
                  canInvoice && order.status === "completed"
                    ? "issued"
                    : "not_issued";

                return (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-medium font-mono text-sm">
                      {order.code}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {order.customer?.companyName ||
                            order.customer?.name ||
                            "—"}
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
                      <OrderStatusBadge
                        status={order.status || ""}
                        statusType={order.statusType || ""}
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
                            <DropdownMenuItem
                              onClick={() => handleCreateInvoice(order)}
                              disabled={!canInvoice}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Xuất hóa đơn
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleExportInvoice(order)}
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                In / Xuất PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleExportDeliveryNote(order)}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Xuất phiếu giao hàng
                              </DropdownMenuItem>
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
    </div>
  );
}
