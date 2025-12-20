import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import {
  Plus,
  Search,
  Filter,
  Building2,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Download,
  RefreshCw,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
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

  const orders = data?.items ?? [];
  const totalOrders = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Client-side search filter (since API doesn't support search parameter)
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const searchLower = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const customer = order.customer;
      const customerName =
        customer && typeof customer === "object" && "name" in customer
          ? (customer.name as string)
          : "";
      const customerCompanyName =
        customer && typeof customer === "object" && "companyName" in customer
          ? (customer.companyName as string)
          : "";
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
      totalRevenue: allOrders.reduce(
        (sum, o) =>
          sum + (typeof o.totalAmount === "number" ? o.totalAmount : 0),
        0
      ),
    };
  }, [orders, totalOrders]);

  // Permissions
  const isAccounting = role === ROLE.ACCOUNTING;
  const canCreateOrder = !isAccounting;
  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Đơn hàng</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý và theo dõi tất cả đơn hàng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Xuất file
            </Button>
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
        <Card className="border-0 shadow-sm mb-6">
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
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Mã đơn</TableHead>
                <TableHead className="font-semibold">Khách hàng</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold text-center">
                  Thiết kế
                </TableHead>
                <TableHead className="font-semibold">Ngày giao</TableHead>
                {canViewPrice && (
                  <>
                    <TableHead className="font-semibold text-right">
                      Tổng tiền
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Còn lại
                    </TableHead>
                  </>
                )}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading */}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
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
                  <TableCell colSpan={9} className="h-32 text-center">
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
                  const customer = order.customer;
                  const customerCompanyName =
                    customer &&
                    typeof customer === "object" &&
                    "companyName" in customer
                      ? (customer.companyName as string)
                      : null;
                  const isCompany = !!customerCompanyName;
                  const totalAmount =
                    typeof order.totalAmount === "number"
                      ? order.totalAmount
                      : 0;
                  const depositAmount =
                    typeof order.depositAmount === "number"
                      ? order.depositAmount
                      : 0;
                  const remaining = totalAmount - depositAmount;

                  return (
                    <TableRow key={order.id} className="group">
                      <TableCell>
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.code || `ORD-${order.id}`}
                        </Link>
                        {order.createdAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(order.createdAt)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {isCompany ? (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {customer &&
                              typeof customer === "object" &&
                              "name" in customer
                                ? (customer.name as string)
                                : "-"}
                            </p>
                            {customerCompanyName && (
                              <p className="text-xs text-muted-foreground">
                                {customerCompanyName}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={order.status}
                          label={orderStatusLabels[order.status || ""] || "N/A"}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {order.orderDetails?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(order.deliveryDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {canViewPrice && (
                        <>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(totalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                remaining > 0
                                  ? "text-amber-600 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {formatCurrency(remaining)}
                            </span>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/orders/${order.id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {/* Empty */}
              {!isLoading && !isError && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canViewPrice ? 9 : 7}
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

          {/* Pagination */}
          {!isLoading && !isError && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t px-4 py-3 gap-4">
              <div className="text-sm text-muted-foreground">
                {searchTerm.trim() ? (
                  <>
                    Hiển thị {filteredOrders.length} / {totalOrders} đơn hàng
                    (đã lọc theo từ khóa)
                  </>
                ) : (
                  <>
                    Hiển thị{" "}
                    {orders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{" "}
                    {Math.min(currentPage * pageSize, totalOrders)} /{" "}
                    {totalOrders} đơn hàng
                  </>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Số lượng mỗi trang:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
