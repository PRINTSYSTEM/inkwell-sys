import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
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

import { PaymentStatusBadge, CustomerTypeBadge } from "@/components/accounting";
import { useOrdersForAccounting, useOrdersForSale } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema";
import { StatusBadge } from "../ui/status-badge";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { useAuth } from "@/hooks/use-auth";
import { ROLE } from "@/constants";

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
  return customer?.type as keyof typeof ENTITY_CONFIG.customerTypes.values;
}

type PaymentListProps = {
  // override API filterType (default: "payment")
  listFilterType?: string;
};

export function PaymentList({ listFilterType }: PaymentListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSale = user?.role === ROLE.SALE || searchParams.get("context") === "sale";
  const paymentLabel = isSale ? "Báo giá" : "Thanh toán";
  const paymentStatusLabel = isSale ? "Trạng thái Báo giá" : "Trạng thái TT";
  const orderCodeFromUrl = searchParams.get("orderCode");

  const [searchQuery, setSearchQuery] = useState(orderCodeFromUrl || "");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Sync search query with URL parameter
  useEffect(() => {
    if (orderCodeFromUrl) {
      setSearchQuery(orderCodeFromUrl);
    }
  }, [orderCodeFromUrl]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const previousTotalPagesRef = useRef<number | null>(null);

  const itemsPerPage = 10;
  // If parent passes an empty string for `listFilterType` (QuotePage) we
  // can't rely on server filtering by `isDebtApproved`, so fetch a larger
  // page and perform client-side filtering + pagination.
  const clientSideMode = listFilterType === "";
  const apiPageSize = clientSideMode ? 200 : itemsPerPage;

  // Build params for API
  const listParams = useMemo(() => {
    return {
      pageNumber: currentPage,
      pageSize: apiPageSize,
      filterType: listFilterType ?? "payment",
      status: "",
      orderCode: debouncedSearchQuery || "",
      designCode: "",
      customerName: "",
      sortColumn: "",
      sortOrder: "",
    };
  }, [currentPage, apiPageSize, debouncedSearchQuery, listFilterType]);

  // Fetch orders from API
  // If parent passed empty string (QuotePage) treat as "sale/quotes" and
  // call the /orders/for-sale endpoint, otherwise use accounting endpoint.
  const hook = clientSideMode ? useOrdersForSale : useOrdersForAccounting;
  const { data, isLoading, isError, error, refetch } = hook(listParams);

  // Filter orders client-side (payment status - API doesn't support payment status filter)
  // When `clientSideMode` is true we filter the full fetched set and then
  // paginate locally so totals/pages reflect only visible (isDebtApproved === false) items.
  const { pagedOrders, filteredTotalItems } = useMemo(() => {
    if (!data?.items) return { pagedOrders: [] as OrderResponse[], filteredTotalItems: 0 };

    const allFiltered = data.items.filter((order) => {
      const paymentStatus = derivePaymentStatus(order.totalAmount, order.depositAmount);
      const matchesPaymentStatus = paymentStatusFilter === "all" || paymentStatus === paymentStatusFilter;
      return matchesPaymentStatus && order.isDebtApproved === false;
    });

    if (clientSideMode) {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return { pagedOrders: allFiltered.slice(start, end), filteredTotalItems: allFiltered.length };
    }

    // Server-driven pagination: data.items corresponds to current page
    return { pagedOrders: allFiltered, filteredTotalItems: data.total ?? allFiltered.length };
  }, [data?.items, paymentStatusFilter, clientSideMode, currentPage, itemsPerPage]);

  const totalItems = clientSideMode ? filteredTotalItems : data?.total || 0;
  const totalPages = clientSideMode ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : data?.totalPages || 1;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when we have valid data (not loading) and totalPages actually decreased
  useEffect(() => {
    // Only adjust if:
    // 1. Not loading (we have valid data)
    // 2. Data exists
    // 3. Current page exceeds total pages
    // 4. Total pages is valid (> 0)
    // 5. Total pages actually decreased from previous value (not just during initial load)
    if (
      !isLoading &&
      !!data &&
      currentPage > totalPages &&
      totalPages > 0 &&
      (previousTotalPagesRef.current === null || totalPages < previousTotalPagesRef.current)
    ) {
      setCurrentPage(totalPages);
    }
    
    // Update previous totalPages ref only when we have valid data
    if (!isLoading && !!data && totalPages > 0) {
      previousTotalPagesRef.current = totalPages;
    }
  }, [currentPage, totalPages, isLoading, data]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentStatusFilter]);

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

  const handleRefresh = () => {
    refetch();
  };

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
              <SelectValue placeholder={paymentStatusLabel} />
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
              <TableRow className="bg-muted/50 h-11">
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
                  {paymentLabel}
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Ngày giao
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="h-12">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground font-semibold"
                  >
                    Không tìm thấy đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((order) => {
                  const remainingAmount =
                    order.totalAmount - order.depositAmount;
                  const paymentStatus = derivePaymentStatus(
                    order.totalAmount,
                    order.depositAmount
                  );
                  const customerType = deriveCustomerType(order.customer);

                  return (
                    <TableRow
                      key={order.id}
                      className="h-12 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-bold font-mono text-sm">
                        {order.code}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-sm">
                            {order.customer?.companyName ||
                              order.customer?.name ||
                              "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              {order.customer?.phone || "—"}
                            </span>
                            <CustomerTypeBadge type={customerType} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-sm">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-sm text-success">
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
                      <TableCell className="text-center text-sm font-bold text-muted-foreground">
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
            <span className="font-bold text-foreground">{totalItems}</span> đơn
            hàng
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
    </div>
  );
}
