import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
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
  PaymentStatusBadge,
  CustomerTypeBadge,
  PaymentUpdateModal,
} from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import { useConfirmDeposit } from "@/hooks/use-accounting";
import type { OrderResponse } from "@/Schema";
import { StatusBadge } from "../ui/status-badge";
import { ENTITY_CONFIG } from "@/config/entities.config";

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
  customer: OrderResponse["customer"]
): "company" | "retail" {
  return customer?.companyName ? "company" : "retail";
}

export function PaymentList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const itemsPerPage = 10;

  // Fetch orders from API
  const { data, isLoading, isError, error, refetch } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    filterType: "payment",
  });

  const confirmDepositMutation = useConfirmDeposit();

  // Filter orders client-side (search and payment status)
  const filteredOrders = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter((order) => {
      const paymentStatus = derivePaymentStatus(
        order.totalAmount,
        order.depositAmount
      );

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

      const matchesPaymentStatus =
        paymentStatusFilter === "all" || paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesPaymentStatus;
    });
  }, [data?.items, searchQuery, paymentStatusFilter]);

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
    navigate(`/accounting/orders/${order.id}?tab=payment`);
  };

  const handleUpdatePayment = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (
    orderId: string | number,
    amount: number,
    note: string
  ) => {
    try {
      await confirmDepositMutation.mutate(Number(orderId), amount);
      setIsPaymentModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error confirming deposit:", error);
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
        paymentStatus: derivePaymentStatus(
          selectedOrder.totalAmount,
          selectedOrder.depositAmount
        ),
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
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Trạng thái TT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="not_paid">Chưa thanh toán</SelectItem>
              <SelectItem value="deposited">Đã nhận cọc</SelectItem>
              <SelectItem value="fully_paid">Đã thanh toán đủ</SelectItem>
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
              <TableHead className="text-right">Đã TT</TableHead>
              <TableHead className="text-right">Còn lại</TableHead>
              <TableHead className="text-center">Trạng thái đơn</TableHead>
              <TableHead className="text-center">Thanh toán</TableHead>
              <TableHead className="text-center">Ngày giao</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const remainingAmount = order.totalAmount - order.depositAmount;
                const paymentStatus = derivePaymentStatus(
                  order.totalAmount,
                  order.depositAmount
                );
                const customerType = deriveCustomerType(order.customer);

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
                    <TableCell className="text-right tabular-nums text-success">
                      {formatCurrency(order.depositAmount)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        remainingAmount > 0
                          ? "text-destructive"
                          : "text-success"
                      }`}
                    >
                      {formatCurrency(remainingAmount)}
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
                      <PaymentStatusBadge status={paymentStatus} />
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
                          <DropdownMenuItem
                            onClick={() => handleUpdatePayment(order)}
                            disabled={paymentStatus === "fully_paid"}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Cập nhật thanh toán
                          </DropdownMenuItem>
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
      <PaymentUpdateModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        order={selectedOrderForModal}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}
