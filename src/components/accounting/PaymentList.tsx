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
  CheckCircle2,
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
import { useApproveDebt } from "@/hooks/use-accounting";
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
  order: OrderResponse
): "company" | "retail" {
  const companyName = order.customerCompanyName || order.customer?.companyName;
  if (companyName) return "company";
  return (order.customer?.type as "company" | "retail") || "retail";
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
  const paymentLabel = isSale ? "Báo giá" : "Trạng thái TT";
  const paymentStatusLabel = isSale ? "Trạng thái Báo giá" : "Trạng thái TT";
  const orderCodeFromUrl = searchParams.get("orderCode");

  const [searchQuery, setSearchQuery] = useState(orderCodeFromUrl || "");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const { mutate: approveDebt, loading: isApproving } = useApproveDebt();

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
  const apiPageSize = clientSideMode ? 1000 : itemsPerPage;

  // Build params for API
  const listParams = useMemo(() => {
    return {
      pageNumber: clientSideMode ? 1 : currentPage,
      pageSize: apiPageSize,
      filterType: listFilterType ?? "payment",
      status: "",
      orderCode: debouncedSearchQuery || "",
      designCode: "",
      customerName: "",
      sortColumn: "",
      sortOrder: "",
    };
  }, [clientSideMode, clientSideMode ? null : currentPage, apiPageSize, debouncedSearchQuery, listFilterType]);

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
      // In Báo giá mode (clientSideMode), exclude quotes that are already marked as isDebtApproved = true
      if (clientSideMode && order.isDebtApproved) {
        return false;
      }
      const paymentStatus = derivePaymentStatus(order.totalAmount, order.depositAmount);
      return paymentStatusFilter === "all" || paymentStatus === paymentStatusFilter;
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
    <div className="h-full flex-1 min-h-0 flex flex-col overflow-hidden space-y-2.5">
      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive" className="shrink-0 py-2 text-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Lỗi kết nối</AlertTitle>
          <AlertDescription className="text-xs">
            {error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu. Vui lòng thử lại."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={paymentStatusFilter}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-2" />
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
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
        <div
          ref={tableContainerRef}
          className="flex-1 min-h-0 overflow-auto"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm">
              <TableRow className="border-b border-slate-200/60 h-10">
                <TableHead className="w-[120px] font-semibold text-xs text-slate-700">
                  Mã đơn
                </TableHead>
                <TableHead className="font-semibold text-xs text-slate-700">Khách hàng</TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-700">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-700">
                  Đã TT
                </TableHead>
                <TableHead className="text-right font-semibold text-xs text-slate-700">
                  Còn lại
                </TableHead>
                <TableHead className="text-center font-semibold text-xs text-slate-700">
                  Trạng thái đơn
                </TableHead>
                <TableHead className="text-center font-semibold text-xs text-slate-700">
                  {paymentLabel}
                </TableHead>
                <TableHead className="text-center font-semibold text-xs text-slate-700">
                  Ngày tạo
                </TableHead>
                <TableHead className="w-[120px] text-right font-semibold text-xs text-slate-700">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="h-10">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className="py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground font-semibold text-xs"
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
                  const customerType = deriveCustomerType(order);

                  return (
                    <TableRow
                      key={order.id}
                      className="h-11 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell className="font-bold font-mono text-xs">
                        {order.code}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs">
                            {order.customerCompanyName ||
                              order.customerName ||
                              order.customer?.companyName ||
                              order.customer?.name ||
                              "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {order.customerPhone ||
                                order.customer?.phone ||
                                "—"}
                            </span>
                            <CustomerTypeBadge type={customerType} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-xs">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-xs text-emerald-600">
                        {formatCurrency(order.depositAmount)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold tabular-nums text-xs ${
                          remainingAmount > 0
                            ? "text-red-600"
                            : "text-emerald-600"
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
                      <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {order.isDebtApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Đã báo giá
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveDebt(order.id);
                            }}
                            disabled={isApproving}
                            className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs gap-1 cursor-pointer rounded-md"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đã báo giá
                          </Button>
                        )}
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
        <div className="shrink-0 flex items-center justify-between pt-2 border-t text-xs font-medium text-muted-foreground">
          <p>
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
              className="h-7 text-xs px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center space-x-1">
              <span>Trang</span>
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
                className="w-12 h-7 text-center text-xs font-bold p-1"
                disabled={isLoading}
              />
              <span>/ {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-7 text-xs px-2"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
