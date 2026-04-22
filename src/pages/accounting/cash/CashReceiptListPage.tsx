import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
  Download,
  FileText,
  Eye,
  MoreHorizontal,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCashReceipts,
  useExportCashReceiptsExcel,
  useExportCashReceiptPDF,
} from "@/hooks/use-cash";
import { usePaymentMethods } from "@/hooks/use-expense";
import { useCustomers } from "@/hooks/use-customer";
import { formatCurrency, getPaymentMethodLabel } from "@/lib/status-utils";
import { toast } from "sonner";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentMethodsData } = usePaymentMethods({
    pageNumber: 1,
    pageSize: 100,
    isActive: true,
  });

  const { data: customersData } = useCustomers({
    page: 1,
    size: 1000,
  });

  // Cash fund functionality removed - field no longer exists in schema

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
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    customerId: customerFilter
      ? Number.parseInt(customerFilter, 10)
      : undefined,
    paymentMethodId:
      paymentMethodFilter && paymentMethodFilter !== "all"
        ? Number.parseInt(paymentMethodFilter, 10)
        : undefined,
  });

  const { mutate: exportToExcel, isPending: isExporting } =
    useExportCashReceiptsExcel();

  const { mutate: exportToPDF, isPending: isExportingPDF } =
    useExportCashReceiptPDF();

  const handleExportExcel = async () => {
    await exportToExcel({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      customerId: customerFilter
        ? Number.parseInt(customerFilter, 10)
        : undefined,
      paymentMethodId:
        paymentMethodFilter && paymentMethodFilter !== "all"
          ? Number.parseInt(paymentMethodFilter, 10)
          : undefined,
    });
  };

  const handleViewDetails = (id: number | undefined, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (id) {
      navigate(`/accounting/cash-receipts/${id}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Phiếu thu | Print Production ERP</title>
        <meta name="description" content="Quản lý phiếu thu trong hệ thống" />
      </Helmet>

      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="flex-shrink-0 px-6 py-3 border-b bg-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Phiếu thu</h1>
              <p className="text-xs text-muted-foreground">
                Quản lý và theo dõi các phiếu thu
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/accounting/cash-receipts/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phiếu thu
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="flex-shrink-0 px-6 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi kết nối</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Không thể tải dữ liệu. Vui lòng thử lại."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Filters - Compact */}
        <div className="flex-shrink-0 px-6 py-2 space-y-2 border-b bg-background">
          <div className="flex flex-col gap-2">
            {/* First row: Search and Date Range */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã phiếu, người nộp, lý do..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="flex-shrink-0">
                <DateRangePicker
                  value={dateRange}
                  onValueChange={setDateRange}
                />
              </div>
            </div>
            {/* Second row: Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                  <Filter className="h-3 w-3 mr-2" />
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
                value={customerFilter || "all"}
                onValueChange={(value) =>
                  setCustomerFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khách hàng</SelectItem>
                  {customersData?.items?.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name ??
                        customer.companyName ??
                        customer.code ??
                        ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {paymentMethodsData?.items?.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {getPaymentMethodLabel(
                        method.code || method.name,
                        method.name
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  title="Xuất Excel"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table - Expanded to fill space */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto border-t">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                  <TableHead className="w-[140px] font-semibold">
                    Số phiếu
                  </TableHead>
                  <TableHead className="w-[120px] font-semibold">
                    Ngày chứng từ
                  </TableHead>
                  <TableHead className="w-[120px] font-semibold">
                    Ngày hạch toán
                  </TableHead>
                  <TableHead className="font-semibold">Người nộp</TableHead>
                  <TableHead className="font-semibold">Lý do thu</TableHead>
                  <TableHead className="text-right font-semibold">
                    Số tiền
                  </TableHead>
                  <TableHead className="font-semibold">Phương thức</TableHead>
                  <TableHead className="font-semibold">Mã tài khoản</TableHead>
                  <TableHead className="font-semibold">Tham chiếu</TableHead>
                  <TableHead className="text-center font-semibold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !receiptsData?.items || receiptsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy phiếu thu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  receiptsData.items.map((receipt) => (
                    <TableRow
                      key={receipt.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetails(receipt.id)}
                    >
                      <TableCell className="font-semibold font-mono text-sm">
                        {receipt.code || `#${receipt.id}`}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {receipt.voucherDate
                          ? formatDate(receipt.voucherDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {receipt.postingDate
                          ? formatDate(receipt.postingDate)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm">
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
                        <div className="text-sm font-medium">
                          {receipt.reason || "—"}
                        </div>
                        {receipt.expenseCategoryName && (
                          <div className="text-xs text-muted-foreground">
                            {receipt.expenseCategoryName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sm">
                        {receipt.amount ? formatCurrency(receipt.amount) : "—"}
                      </TableCell>
                      <TableCell>
                        {receipt.paymentMethodName ||
                        receipt.paymentMethodId ? (
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                          >
                            {getPaymentMethodLabel(
                              receipt.paymentMethodName,
                              receipt.paymentMethodName
                            )}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {"—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {receipt.orderCode && (
                            <div className="text-xs font-medium">
                              <span className="text-muted-foreground">
                                Đơn:
                              </span>{" "}
                              <span className="font-mono">
                                {receipt.orderCode}
                              </span>
                            </div>
                          )}
                          {receipt.invoiceNumber && (
                            <div className="text-xs font-medium">
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
                              className="h-8 w-8 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(receipt.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                exportToPDF(receipt.id!);
                              }}
                              className="cursor-pointer"
                              disabled={isExportingPDF}
                            >
                              {isExportingPDF ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                              )}
                              Xuất PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - Compact */}
          {receiptsData && receiptsData.totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
              <p className="text-xs text-muted-foreground">
                Trang {currentPage} / {receiptsData.totalPages} (
                {receiptsData.total} phiếu thu)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2">
                  {currentPage} / {receiptsData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(receiptsData.totalPages, p + 1)
                    )
                  }
                  disabled={
                    currentPage === receiptsData.totalPages || isLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
