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
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Calendar,
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
  useCashReceipts,
  useDeleteCashReceipt,
  useApproveCashReceipt,
  useCancelCashReceipt,
  usePostCashReceipt,
} from "@/hooks/use-cash";
import { usePaymentMethods } from "@/hooks/use-expense";
import { formatCurrency } from "@/lib/status-utils";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
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

export default function CashReceiptListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const {
    data: receiptsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashReceipts({
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
    customerId: customerFilter ? Number.parseInt(customerFilter, 10) : undefined,
    paymentMethodId:
      paymentMethodFilter && paymentMethodFilter !== "all"
        ? Number.parseInt(paymentMethodFilter, 10)
        : undefined,
  });

  const deleteReceiptMutation = useDeleteCashReceipt();
  const approveReceiptMutation = useApproveCashReceipt();
  const cancelReceiptMutation = useCancelCashReceipt();
  const postReceiptMutation = usePostCashReceipt();

  const handleViewDetails = (id: number | undefined) => {
    if (id) {
      navigate(`/accounting/cash-receipts/${id}`);
    }
  };

  const handleApprove = async (id: number | undefined) => {
    if (!id) return;
    try {
      await approveReceiptMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCancel = async (id: number | undefined) => {
    if (!id) return;
    try {
      await cancelReceiptMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePost = async (id: number | undefined) => {
    if (!id) return;
    try {
      await postReceiptMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu thu này?")) {
      try {
        await deleteReceiptMutation.mutateAsync(id);
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
        <title>Phiếu thu | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý phiếu thu trong hệ thống"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Phiếu thu</h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các phiếu thu
            </p>
          </div>
          <Button onClick={() => navigate("/accounting/cash-receipts/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu thu
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
                placeholder="Tìm kiếm theo mã phiếu, người nộp, lý do..."
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
                <TableHead>Người nộp</TableHead>
                <TableHead>Lý do thu</TableHead>
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
              ) : !receiptsData?.items || receiptsData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy phiếu thu nào.
                  </TableCell>
                </TableRow>
              ) : (
                receiptsData.items.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(receipt.id)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {receipt.code || `#${receipt.id}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {receipt.voucherDate
                        ? formatDate(receipt.voucherDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {receipt.postingDate
                        ? formatDate(receipt.postingDate)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {receipt.payerName || "—"}
                        </div>
                        {receipt.customerName && (
                          <div className="text-xs text-muted-foreground">
                            KH: {receipt.customerName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{receipt.reason || "—"}</div>
                      {receipt.expenseCategoryName && (
                        <div className="text-xs text-muted-foreground">
                          {receipt.expenseCategoryName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {receipt.amount ? formatCurrency(receipt.amount) : "—"}
                    </TableCell>
                    <TableCell>
                      {receipt.paymentMethodName ? (
                        <Badge variant="secondary" className="text-xs">
                          {receipt.paymentMethodName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {receipt.orderCode && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Đơn:</span>{" "}
                            <span className="font-mono">{receipt.orderCode}</span>
                          </div>
                        )}
                        {receipt.invoiceNumber && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">HĐ:</span>{" "}
                            <span className="font-mono">
                              {receipt.invoiceNumber}
                            </span>
                          </div>
                        )}
                        {!receipt.orderCode && !receipt.invoiceNumber && "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(receipt.status)}
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
                            onClick={() => handleViewDetails(receipt.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {canEdit(receipt.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/accounting/cash-receipts/${receipt.id}/edit`
                                  )
                                }
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(receipt.id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </>
                          )}
                          {canApprove(receipt.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleApprove(receipt.id)}
                                disabled={approveReceiptMutation.isPending}
                              >
                                {approveReceiptMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Duyệt
                              </DropdownMenuItem>
                            </>
                          )}
                          {canPost(receipt.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePost(receipt.id)}
                                disabled={postReceiptMutation.isPending}
                              >
                                {postReceiptMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Clock className="h-4 w-4 mr-2" />
                                )}
                                Hạch toán
                              </DropdownMenuItem>
                            </>
                          )}
                          {canCancel(receipt.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancel(receipt.id)}
                                disabled={cancelReceiptMutation.isPending}
                                className="text-destructive"
                              >
                                {cancelReceiptMutation.isPending ? (
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
        {receiptsData && receiptsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {receiptsData.totalPages} (
              {receiptsData.total} phiếu thu)
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
                {currentPage} / {receiptsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(receiptsData.totalPages, p + 1))
                }
                disabled={currentPage === receiptsData.totalPages || isLoading}
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

