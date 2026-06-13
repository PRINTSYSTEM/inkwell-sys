import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Plus,
  Loader2,
  AlertCircle,
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
  useCashPayments,
  useExportCashPaymentsExcel,
  useExportCashPaymentPDF,
} from "@/hooks/use-cash";
import { usePaymentMethods, useExpenseCategories } from "@/hooks/use-expense";
import { useActiveVendors } from "@/hooks/use-vendor";
import {
  formatCurrency,
  getPaymentMethodLabel,
} from "@/lib/status-utils";
import { toast } from "sonner";
import { CreateCashPaymentDialog } from "@/components/vendors/CreateCashPaymentDialog";


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
  const [expenseCategoryFilter, setExpenseCategoryFilter] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  const { data: vendorsData } = useActiveVendors();

  // Cash fund functionality removed - field no longer exists in schema

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
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
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

  const { mutate: exportToExcel, isPending: isExporting } =
    useExportCashPaymentsExcel();

  const { mutate: exportToPDF, isPending: isExportingPDF } =
    useExportCashPaymentPDF();

  const handleExportExcel = async () => {
    await exportToExcel({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
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
  };

  const handleViewDetails = (id: number | undefined) => {
    if (id) {
      navigate(`/accounting/cash-payments/${id}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Phiếu chi | Print Production ERP</title>
        <meta name="description" content="Quản lý phiếu chi trong hệ thống" />
      </Helmet>

      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="flex-shrink-0 px-6 py-3 border-b bg-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Phiếu chi</h1>
              <p className="text-xs text-muted-foreground">
                Quản lý và theo dõi các phiếu chi
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phiếu chi
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
                  placeholder="Tìm kiếm theo mã phiếu, người nhận, lý do..."
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
              <Select
                value={vendorFilter || "all"}
                onValueChange={(value) =>
                  setVendorFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả NCC</SelectItem>
                  {vendorsData?.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      {vendor.name || vendor.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={expenseCategoryFilter}
                onValueChange={setExpenseCategoryFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
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
                  <TableHead className="w-[140px] font-semibold">Số phiếu</TableHead>
                  <TableHead className="w-[120px] font-semibold">Ngày chứng từ</TableHead>
                  <TableHead className="w-[120px] font-semibold">Ngày hạch toán</TableHead>
                  <TableHead className="font-semibold">Người nhận</TableHead>
                  <TableHead className="font-semibold">Khoản mục chi</TableHead>
                  <TableHead className="text-right font-semibold">Số tiền</TableHead>
                  <TableHead className="font-semibold">Phương thức</TableHead>
                  <TableHead className="font-semibold">Mã tài khoản</TableHead>
                  <TableHead className="font-semibold">Tham chiếu</TableHead>
                  <TableHead className="text-center font-semibold">Trạng thái</TableHead>
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
                ) : !paymentsData?.items || paymentsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy phiếu chi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentsData.items.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewDetails(payment.id)}
                    >
                      <TableCell className="font-semibold font-mono text-sm">
                        {payment.code || `#${payment.id}`}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {payment.voucherDate
                          ? formatDate(payment.voucherDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {payment.postingDate
                          ? formatDate(payment.postingDate)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm">
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
                        <div className="text-sm font-medium">
                          {payment.expenseCategoryName || "—"}
                        </div>
                        {payment.reason && (
                          <div className="text-xs text-muted-foreground">
                            {payment.reason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sm">
                        {payment.amount ? formatCurrency(payment.amount) : "—"}
                      </TableCell>
                      <TableCell>
                        {payment.paymentMethodName || payment.paymentMethodId ? (
                          <Badge variant="secondary" className="text-xs font-medium">
                            {getPaymentMethodLabel(
                              payment.paymentMethodName,
                              payment.paymentMethodName
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
                          {payment.orderCode && (
                            <div className="text-xs font-medium">
                              <span className="text-muted-foreground">Đơn:</span>{" "}
                              <span className="font-mono">
                                {payment.orderCode}
                              </span>
                            </div>
                          )}
                          {payment.vendorName && (
                            <div className="text-xs font-medium">
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
                                handleViewDetails(payment.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                exportToPDF(payment.id);
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
          {paymentsData && paymentsData.totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
              <p className="text-xs text-muted-foreground">
                Trang {currentPage} / {paymentsData.totalPages} (
                {paymentsData.total} phiếu chi)
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
                  {currentPage} / {paymentsData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(paymentsData.totalPages, p + 1)
                    )
                  }
                  disabled={currentPage === paymentsData.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateCashPaymentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
