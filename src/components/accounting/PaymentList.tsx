import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
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
  const [pageInput, setPageInput] = useState<string>("1");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

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

  const handleOrderClick = (order: OrderResponse) => {
    navigate(`/accounting/orders/${order.id}?tab=payment`);
  };

  const handleUpdatePayment = (order: OrderResponse, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="h-full flex flex-col overflow-hidden">
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
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto rounded-lg border"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="bg-muted/50 h-10">
                <TableHead className="w-[140px] font-bold text-sm">
                  Mã đơn
                </TableHead>
                <TableHead className="font-bold text-sm">Khách hàng</TableHead>
                <TableHead className="text-right font-bold text-sm">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-right font-bold text-sm">
                  Đã TT
                </TableHead>
                <TableHead className="text-right font-bold text-sm">
                  Còn lại
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Trạng thái đơn
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Thanh toán
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Ngày giao
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="h-14">
                    {Array.from({ length: 8 }).map((_, j) => (
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
                  const remainingAmount = order.totalAmount - order.depositAmount;
                  const paymentStatus = derivePaymentStatus(
                    order.totalAmount,
                    order.depositAmount
                  );
                  const customerType = deriveCustomerType(order.customer);

                  return (
                    <TableRow
                      key={order.id}
                      className="h-14 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-bold font-mono text-sm">
                        {order.code}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
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
                      <TableCell className="text-right font-bold tabular-nums text-sm">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sm text-success">
                        {formatCurrency(order.depositAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold tabular-nums text-sm ${
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
                      <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                        {formatDate(order.deliveryDate)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between shrink-0 pt-4 border-t">
          <p className="text-sm font-semibold text-muted-foreground">
            Hiển thị{" "}
            <span className="font-bold text-foreground">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>
            {" - "}
            <span className="font-bold text-foreground">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-bold text-foreground">{totalItems}</span>{" "}
            đơn hàng
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-muted-foreground">
                Trang
              </span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-14 h-8 text-center text-sm font-bold"
                disabled={isLoading}
              />
              <span className="text-sm font-semibold text-muted-foreground">
                / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-8"
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
