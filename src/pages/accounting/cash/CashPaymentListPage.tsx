import { useState } from "react";
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
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

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
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  useCashPayments,
  useDeleteCashPayment,
  useApproveCashPayment,
  useCancelCashPayment,
  usePostCashPayment,
} from "@/hooks/use-cash";
import { usePaymentMethods, useExpenseCategories } from "@/hooks/use-expense";
import { formatCurrency } from "@/lib/status-utils";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes("draft") || statusLower === "draft") {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return <StatusBadge status="approved" label="Đã duyệt" />;
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return <StatusBadge status="posted" label="Đã hạch toán" />;
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
};

export default function CashPaymentListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const { data: expenseCategoriesData } = useExpenseCategories({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const {
    data: paymentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashPayments({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to
      ? dateRange.to.toISOString()
      : undefined,
    vendorId: vendorFilter ? Number.parseInt(vendorFilter, 10) : undefined,
    paymentMethodId:
      paymentMethodFilter && paymentMethodFilter !== "all"
        ? Number.parseInt(paymentMethodFilter, 10)
        : undefined,
    expenseCategoryId:
      expenseCategoryFilter && expenseCategoryFilter !== "all"
        ? Number.parseInt(expenseCategoryFilter, 10)
        : undefined,
  });

  const deletePaymentMutation = useDeleteCashPayment();
  const approvePaymentMutation = useApproveCashPayment();
  const cancelPaymentMutation = useCancelCashPayment();
  const postPaymentMutation = usePostCashPayment();

  const handleViewDetails = (id: number | undefined) => {
    if (id) {
      navigate(`/accounting/cash-payments/${id}`);
    }
  };

  const handleApprove = async (id: number | undefined) => {
    if (!id) return;
    try {
      await approvePaymentMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCancel = async (id: number | undefined) => {
    if (!id) return;
    try {
      await cancelPaymentMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePost = async (id: number | undefined) => {
    if (!id) return;
    try {
      await postPaymentMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu chi này?")) {
      try {
        await deletePaymentMutation.mutateAsync(id);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const canEdit = (status: string | null | undefined) => {
    if (!status) return true;
    const statusLower = status.toLowerCase();
    return statusLower === "draft" || statusLower.includes("draft");
  };

  const canApprove = (status: string | null | undefined) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === "draft" || statusLower.includes("draft");
  };

  const canPost = (status: string | null | undefined) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === "approved" || statusLower.includes("approved");
  };

  const canCancel = (status: string | null | undefined) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return (
      statusLower === "draft" ||
      statusLower === "approved" ||
      statusLower.includes("draft") ||
      statusLower.includes("approved")
    );
  };

  return (
    <>
      <Helmet>
        <title>Phiếu chi | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý phiếu chi trong hệ thống"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Phiếu chi</h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các phiếu chi
            </p>
          </div>
          <Button onClick={() => navigate("/accounting/cash-payments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu chi
          </Button>
        </div>

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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã phiếu, người nhận, lý do..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="posted">Đã hạch toán</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {paymentMethodsData?.items?.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {method.name || method.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={expenseCategoryFilter}
              onValueChange={setExpenseCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Khoản mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {expenseCategoriesData?.items?.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name || category.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button variant="outline" size="icon" title="Xuất Excel">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Số phiếu</TableHead>
                <TableHead className="w-[120px]">Ngày chứng từ</TableHead>
                <TableHead className="w-[120px]">Ngày hạch toán</TableHead>
                <TableHead>Người nhận</TableHead>
                <TableHead>Khoản mục chi</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Tham chiếu</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !paymentsData?.items || paymentsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy phiếu chi nào.
                  </TableCell>
                </TableRow>
              ) : (
                paymentsData.items.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(payment.id)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {payment.code || `#${payment.id}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.voucherDate
                        ? formatDate(payment.voucherDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.postingDate
                        ? formatDate(payment.postingDate)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {payment.receiverName || "—"}
                        </div>
                        {payment.vendorName && (
                          <div className="text-xs text-muted-foreground">
                            NCC: {payment.vendorName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.expenseCategoryName || "—"}
                      </div>
                      {payment.reason && (
                        <div className="text-xs text-muted-foreground">
                          {payment.reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {payment.amount ? formatCurrency(payment.amount) : "—"}
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethodName ? (
                        <Badge variant="secondary" className="text-xs">
                          {payment.paymentMethodName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {payment.orderCode && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Đơn:</span>{" "}
                            <span className="font-mono">{payment.orderCode}</span>
                          </div>
                        )}
                        {payment.vendorName && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">NCC:</span>{" "}
                            {payment.vendorName}
                          </div>
                        )}
                        {!payment.orderCode && !payment.vendorName && "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(payment.status)}
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
                            onClick={() => handleViewDetails(payment.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {canEdit(payment.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/accounting/cash-payments/${payment.id}/edit`
                                  )
                                }
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(payment.id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </>
                          )}
                          {canApprove(payment.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleApprove(payment.id)}
                                disabled={approvePaymentMutation.isPending}
                              >
                                {approvePaymentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Duyệt
                              </DropdownMenuItem>
                            </>
                          )}
                          {canPost(payment.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePost(payment.id)}
                                disabled={postPaymentMutation.isPending}
                              >
                                {postPaymentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Clock className="h-4 w-4 mr-2" />
                                )}
                                Hạch toán
                              </DropdownMenuItem>
                            </>
                          )}
                          {canCancel(payment.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancel(payment.id)}
                                disabled={cancelPaymentMutation.isPending}
                                className="text-destructive"
                              >
                                {cancelPaymentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Hủy
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {paymentsData && paymentsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {paymentsData.totalPages} (
              {paymentsData.total} phiếu chi)
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
                {currentPage} / {paymentsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(paymentsData.totalPages, p + 1))
                }
                disabled={currentPage === paymentsData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

