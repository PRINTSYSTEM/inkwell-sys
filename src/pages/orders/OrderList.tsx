import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import {
  Plus,
  Search,
  Filter,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  orderStatusLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";
import type { OrderListParams, UserRole, OrderResponse } from "@/Schema";
import { useAuth } from "@/hooks";
import { useOrdersByRole } from "@/hooks/use-order";
import { ROLE } from "@/constants";

export default function OrderList() {
  const { user } = useAuth();
  const role = user?.role as UserRole;
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pageInput, setPageInput] = useState<string>("");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
    setPageInput("1");
  };

  // Build params for API
  const listParams: OrderListParams = useMemo(() => {
    const params: OrderListParams = {
      pageNumber: currentPage,
      pageSize: pageSize,
      status: statusFilter === "all" ? "" : statusFilter,
      startDate: "",
      endDate: "",
    };

    // Add date range if selected
    if (dateRange && dateRange.from) {
      // Set time to start of day
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      params.startDate = startDate.toISOString();
    }

    if (dateRange && dateRange.to) {
      // Set time to end of day
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      params.endDate = endDate.toISOString();
    }

    return params;
  }, [statusFilter, dateRange, currentPage, pageSize]);

  // Call API
  const { data, isLoading, isError, error } = useOrdersByRole(role, listParams);

  const orders = useMemo(() => data?.items ?? [], [data?.items]);
  const totalOrders = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [totalPages, currentPage]);

  // Client-side search filter (since API doesn't support search parameter)
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const searchLower = searchTerm.toLowerCase();
    return orders.filter((order) => {
      // Use nested customer object if available, otherwise fall back to flat fields
      const orderResponse = order as OrderResponse;
      const customerName =
        orderResponse.customer?.name || orderResponse.customerName || "";
      const customerCompanyName =
        orderResponse.customer?.companyName ||
        orderResponse.customerCompanyName ||
        "";
      return (
        order.code?.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        customerCompanyName.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, searchTerm]);

  // Calculate stats from orders
  const stats = useMemo(() => {
    const allOrders = orders; // Use all orders from API for stats
    return {
      total: totalOrders,
      pending: allOrders.filter((o) => o.status === "pending").length,
      inProgress: allOrders.filter((o) =>
        ["designing", "production", "in_progress"].includes(o.status || "")
      ).length,
      completed: allOrders.filter((o) => o.status === "completed").length,
      totalRevenue: allOrders.reduce((sum, o) => {
        const order = o as OrderResponse;
        return sum + ((order.totalAmount as number | undefined) ?? 0);
      }, 0),
    };
  }, [orders, totalOrders]);

  // Pagination handlers
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

  const handleOrderClick = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  // Permissions
  const isAccounting = role === ROLE.ACCOUNTING;
  const canCreateOrder = !isAccounting;
  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Đơn hàng</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý và theo dõi tất cả đơn hàng
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canCreateOrder && (
              <Link to="/orders/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo đơn mới
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-0 shadow-sm mb-4 shrink-0">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã đơn, tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {Object.entries(orderStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DateRangePicker
                  value={dateRange}
                  onValueChange={(range) => {
                    setDateRange(range);
                    handleFilterChange();
                  }}
                  placeholder="Chọn khoảng thời gian"
                  showClear
                  className="w-[240px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-sm">
          <div ref={tableContainerRef} className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-10 font-bold text-sm">
                    Mã đơn
                  </TableHead>
                  <TableHead className="h-10 font-bold text-sm">
                    Khách hàng
                  </TableHead>
                  <TableHead className="h-10 font-bold text-sm">
                    Trạng thái
                  </TableHead>
                  <TableHead className="h-10 font-bold text-sm text-center">
                    Thiết kế
                  </TableHead>
                  <TableHead className="h-10 font-bold text-sm">
                    Ngày giao
                  </TableHead>
                  {canViewPrice && (
                    <>
                      <TableHead className="h-10 font-bold text-sm text-right">
                        Tổng tiền
                      </TableHead>
                      <TableHead className="h-10 font-bold text-sm text-right">
                        Còn lại
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Loading */}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={canViewPrice ? 7 : 5}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                          Đang tải danh sách đơn hàng...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Error */}
                {isError && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={canViewPrice ? 7 : 5}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <p className="text-destructive">
                          Lỗi khi tải đơn hàng:{" "}
                          {error instanceof Error
                            ? error.message
                            : "Vui lòng thử lại sau."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Data */}
                {!isLoading &&
                  !isError &&
                  filteredOrders.map((order) => {
                    // Use OrderResponse type which includes customer object
                    const orderResponse = order as OrderResponse;

                    // Use nested customer object if available, otherwise fall back to flat fields
                    const customerName =
                      orderResponse.customer?.name ||
                      orderResponse.customerName ||
                      null;
                    const customerCompanyName =
                      orderResponse.customer?.companyName ||
                      orderResponse.customerCompanyName ||
                      null;
                    const isCompany = !!customerCompanyName;
                    const totalAmount =
                      (orderResponse.totalAmount as number | undefined) ?? 0;
                    const depositAmount =
                      (orderResponse.depositAmount as number | undefined) ?? 0;
                    const remaining = totalAmount - depositAmount;

                    return (
                      <TableRow
                        key={order.id}
                        className="h-14 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <TableCell className="py-3">
                          <div className="font-bold text-sm text-primary">
                            {order.code || `ORD-${order.id}`}
                          </div>
                          {order.createdAt && (
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                              {formatDate(order.createdAt)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                              {isCompany ? (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <TruncatedText
                                text={customerName || "-"}
                                className="font-semibold text-sm"
                              />
                              {customerCompanyName && (
                                <TruncatedText
                                  text={customerCompanyName}
                                  className="text-xs font-medium text-muted-foreground"
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge
                            status={order.status}
                            label={
                              orderStatusLabels[order.status || ""] || "N/A"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                            {order.orderDetails?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          {order.deliveryDate ? (
                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatDate(order.deliveryDate)}
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        {canViewPrice && (
                          <>
                            <TableCell className="text-right py-3 font-bold text-sm">
                              {formatCurrency(totalAmount)}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <span
                                className={`text-sm font-bold ${
                                  remaining > 0
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatCurrency(remaining)}
                              </span>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}

                {/* Empty */}
                {!isLoading && !isError && filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canViewPrice ? 7 : 5}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchTerm.trim()
                            ? "Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm"
                            : "Không có đơn hàng nào"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && !isError && totalOrders > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 shrink-0 bg-background">
              <div className="text-sm font-medium text-muted-foreground">
                {searchTerm.trim() ? (
                  <>
                    Hiển thị {filteredOrders.length} / {totalOrders} đơn hàng
                    (đã lọc theo từ khóa)
                  </>
                ) : (
                  <>
                    Hiển thị{" "}
                    <span className="font-bold text-foreground">
                      {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                    </span>
                    {" - "}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * pageSize, totalOrders)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-bold text-foreground">
                      {totalOrders}
                    </span>{" "}
                    đơn hàng
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Trang trước</span>
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-muted-foreground">
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
                    className="w-14 h-8 text-center text-sm font-semibold"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
