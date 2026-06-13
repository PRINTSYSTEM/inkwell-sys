import { Helmet } from "react-helmet-async";
import { useMemo, useState, useRef, useEffect } from "react";
import { FileText, CheckCircle } from "lucide-react";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
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
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { useInvoices, useExportInvoice } from "@/hooks/use-invoice";
import { formatCurrency } from "@/lib/status-utils";
import { CreateInvoiceFromLinesDialog } from "@/components/accounting";
import { ROUTE_PATHS } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

// Component for "Hóa đơn đã tạo" tab
function CreatedInvoicesTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [isCreateFromLinesDialogOpen, setIsCreateFromLinesDialogOpen] =
    useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoices({
    PageNumber: currentPage,
    PageSize: itemsPerPage,
    Status: statusFilter === "all" ? undefined : statusFilter,
    Search: searchQuery || undefined,
    SortColumn: "CreatedAt",
    SortOrder: "desc",
  });

  const exportInvoiceMutation = useExportInvoice();

  // Use items directly from API (search is handled server-side)
  const invoices = invoicesData?.items || [];

  const totalPages = invoicesData?.totalPages || 1;
  const totalItems = invoicesData?.total || 0;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when data is actually loaded (not undefined) to avoid resetting during data fetch
  useEffect(() => {
    if (invoicesData && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, invoicesData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery, statusFilter]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

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

  const handleViewDetails = (invoiceId: number | undefined) => {
    if (invoiceId) {
      navigate(`${ROUTE_PATHS.ACCOUNTING.INVOICE}/${invoiceId}`);
    }
  };

  const handleExportPDF = async (invoiceId: number | undefined) => {
    if (!invoiceId) return;
    try {
      await exportInvoiceMutation.mutateAsync(invoiceId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRowClick = (invoiceId: number | undefined) => {
    if (invoiceId) {
      navigate(`${ROUTE_PATHS.ACCOUNTING.INVOICE}/${invoiceId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {isError && (
        <Alert
          variant="destructive"
          className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 rounded-xl"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu. Vui lòng thử lại."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-850 shadow-sm">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Tìm kiếm theo số HĐ, tên khách, MST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-stone-200 dark:border-stone-800 bg-transparent rounded-lg focus-visible:ring-primary focus-visible:border-primary w-full"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => setIsCreateFromLinesDialogOpen(true)}
              className="h-10 font-semibold gap-2 w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              Xuất hóa đơn
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-10 border-stone-200 dark:border-stone-800 rounded-lg">
                <Filter className="h-4 w-4 mr-2 text-stone-400" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
                <SelectItem value="issued">Đã xuất</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-stone-200 dark:border-stone-800 rounded-lg"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Info label below Toolbar */}
      <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
        <div>
          Hiển thị{" "}
          <span className="font-bold text-stone-850 dark:text-stone-200">
            {totalItems > 0 
              ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)}` 
              : "0"}
          </span>{" "}
          / <span className="font-bold text-stone-850 dark:text-stone-200">{totalItems}</span> hóa đơn
        </div>
        <div className="flex items-center gap-1">
          <span>Sắp xếp:</span>
          <span className="font-bold text-stone-850 dark:text-stone-200">Mới nhất</span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-stone-200 dark:border-stone-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-stone-900">
        <div
          ref={tableContainerRef}
          className="overflow-auto"
        >
          <Table>
            <TableHeader className="sticky top-0 bg-stone-50/75 dark:bg-stone-900/95 backdrop-blur-sm z-10 border-b border-stone-200 dark:border-stone-800">
              <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                <TableHead className="w-[140px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider pl-6">
                  Số hóa đơn
                </TableHead>
                <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Người mua</TableHead>
                <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-center font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Ngày xuất
                </TableHead>
                <TableHead className="w-[60px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-stone-100 dark:border-stone-850"
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-6" : j === 5 ? "pr-6" : ""}>
                        <Skeleton className="h-9 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-40 text-center border-stone-100 dark:border-stone-800"
                  >
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <FileText className="h-10 w-10 text-stone-300 dark:text-stone-700" />
                      <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">
                        Không tìm thấy hóa đơn nào
                      </p>
                      <p className="text-xs text-stone-450 dark:text-stone-500">
                        Thử thay đổi bộ lọc hoặc tìm kiếm theo từ khóa khác
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer border-stone-100 dark:border-stone-850 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 transition-colors group"
                    onClick={() => handleRowClick(invoice.id)}
                  >
                    <TableCell className="font-bold font-mono text-sm pl-6 text-stone-900 dark:text-stone-50">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-stone-900 dark:text-stone-50">
                          {invoice.buyerCompanyName || invoice.buyerName || "—"}
                        </div>
                        {invoice.buyerTaxCode && (
                          <div className="text-xs text-muted-foreground font-medium">
                            MST: {invoice.buyerTaxCode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-sm text-stone-900 dark:text-stone-50">
                      {invoice.grandTotal
                        ? formatCurrency(invoice.grandTotal)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {invoice.status ? (
                        <StatusBadge
                          status={invoice.status}
                          label={invoice.statusName || invoice.status}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold text-stone-600 dark:text-stone-300">
                      {invoice.issuedAt && !invoice.issuedAt.startsWith("0001-01-01")
                        ? formatDate(invoice.issuedAt)
                        : formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(invoice.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExportPDF(invoice.id)}
                            disabled={exportInvoiceMutation.isPending}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {exportInvoiceMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xuất...
                              </>
                            ) : (
                              "Xuất Excel"
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900 flex items-center justify-between flex-wrap gap-4 shadow-xs mt-3">
          <div className="text-xs text-stone-500 font-medium">
             Hiển thị <span className="font-bold text-stone-850 dark:text-stone-200">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong tổng số <span className="font-bold text-stone-850 dark:text-stone-200">{totalItems}</span> hóa đơn
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0 border-stone-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-semibold bg-stone-50 border px-3 py-1.5 rounded-md min-w-[80px] text-center dark:bg-stone-800 dark:border-stone-700">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0 border-stone-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Invoice From Lines Dialog */}
      <CreateInvoiceFromLinesDialog
        open={isCreateFromLinesDialogOpen}
        onOpenChange={setIsCreateFromLinesDialogOpen}
      />
    </div>
  );
}

export default function InvoicePage() {
  // Fetch not issued orders for stats
  const { data: notIssuedOrders } = useOrdersForAccounting({
    pageNumber: 1,
    pageSize: 1,
    filterType: "invoice",
    status: "not_issued",
  });

  // Calculate start and end of today in ISO string
  const { startOfTodayStr, endOfTodayStr } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return {
      startOfTodayStr: start.toISOString(),
      endOfTodayStr: end.toISOString(),
    };
  }, []);

  // Fetch issued invoices today for stats
  const { data: issuedTodayInvoices } = useInvoices({
    pageNumber: 1,
    pageSize: 1,
    status: "issued",
    FromDate: startOfTodayStr,
    ToDate: endOfTodayStr,
    // Add camelCase versions to ensure compatibility with useInvoices hook normalizer
    fromDate: startOfTodayStr,
    toDate: endOfTodayStr,
  } as any);

  // Summary stats
  const summaryStats = useMemo(() => {
    return {
      notIssued: notIssuedOrders?.total || 0,
      issuedToday: issuedTodayInvoices?.total || 0,
    };
  }, [notIssuedOrders?.total, issuedTodayInvoices?.total]);

  return (
    <>
      <Helmet>
        <title>Hóa đơn | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý xuất hóa đơn cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hóa đơn
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Theo dõi tình trạng hóa đơn, xuất hóa đơn và quản lý công nợ.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                  Chưa xuất HĐ
                </p>
                <p className="text-base sm:text-xl font-bold mt-1 leading-none text-stone-900 dark:text-stone-50">
                  {summaryStats.notIssued}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 leading-none truncate">
                  Cần xuất hóa đơn
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
            <CardContent className="p-3 flex items-center gap-3 flex-row">
              <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                  Xuất hôm nay
                </p>
                <p className="text-base sm:text-xl font-bold mt-1 leading-none text-stone-900 dark:text-stone-50">
                  {summaryStats.issuedToday}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 leading-none truncate">
                  Đã hoàn tất
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <CreatedInvoicesTab />
      </div>
    </>
  );
}
