import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
  Building2,
  Phone,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle,
  History,
  Calendar,
  FileSpreadsheet,
  MoreVertical,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCustomers,
  useExportDebtComparison,
  useCustomerDebtHistory,
  useCustomerMonthlyDebt,
  useCustomerDebtSummary,
} from "@/hooks/use-customer";
import { useExportDebt } from "@/hooks/use-accounting";
import { formatCurrency } from "@/lib/status-utils";
import { DebtStatusBadge } from "@/components/accounting/StatusBadges";

export default function AccountingDebtReport() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const pageSize = 10;
  const [exportingId, setExportingId] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const previousTotalPagesRef = useRef<number | null>(null);

  // Debt history dialog state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [showDebtHistoryDialog, setShowDebtHistoryDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [debtHistoryDateRange, setDebtHistoryDateRange] = useState<
    DateRange | undefined
  >(undefined);

  // Monthly debt state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Export debt by month state
  const [exportMonth, setExportMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [exportYear, setExportYear] = useState<number>(
    new Date().getFullYear()
  );

  // Export debt by date range state
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined);

  // Export debt by quarter state
  const [exportQuarter, setExportQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [exportQuarterYear, setExportQuarterYear] = useState<number>(new Date().getFullYear());

  // Export tab state
  const [exportTab, setExportTab] = useState<string>("month");

  // Fetch customers
  const { data: customersData, isLoading } = useCustomers({
    pageNumber,
    pageSize,
    search: searchTerm || "",
    debtStatus: filterStatus !== "all" ? filterStatus : "",
  });

  // Export debt comparison hook
  const { mutate: exportDebtComparison, loading: exporting } =
    useExportDebtComparison();

  // Debt history hook
  const { data: debtHistory, isLoading: loadingDebtHistory } =
    useCustomerDebtHistory(
      selectedCustomerId,
      debtHistoryDateRange?.from && debtHistoryDateRange?.to
        ? {
            startDate: format(
              debtHistoryDateRange.from,
              "yyyy-MM-dd'T'00:00:00.000'Z'"
            ),
            endDate: format(
              debtHistoryDateRange.to,
              "yyyy-MM-dd'T'23:59:59.999'Z'"
            ),
          }
        : undefined,
      showDebtHistoryDialog && !!selectedCustomerId
    );

  // Monthly debt hook
  const { data: monthlyDebt, isLoading: loadingMonthlyDebt } =
    useCustomerMonthlyDebt(
      selectedCustomerId,
      {
        year: selectedYear,
        month: selectedMonth,
      },
      showDebtHistoryDialog && !!selectedCustomerId
    );

  // Debt summary hook
  const { data: debtSummary, isLoading: loadingDebtSummary } =
    useCustomerDebtSummary(
      selectedCustomerId,
      debtHistoryDateRange?.from && debtHistoryDateRange?.to
        ? {
            startDate: format(
              debtHistoryDateRange.from,
              "yyyy-MM-dd'T'00:00:00.000'Z'"
            ),
            endDate: format(
              debtHistoryDateRange.to,
              "yyyy-MM-dd'T'23:59:59.999'Z'"
            ),
          }
        : undefined,
      showDebtHistoryDialog && !!selectedCustomerId
    );

  // Export debt hook
  const { mutate: exportDebt, loading: exportingDebt } = useExportDebt();

  const customers = useMemo(
    () => customersData?.items ?? [],
    [customersData?.items]
  );
  const totalCount = customersData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Sync pageInput with pageNumber
  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  // Auto-adjust pageNumber if it exceeds totalPages
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
      !!customersData &&
      pageNumber > totalPages &&
      totalPages > 0 &&
      (previousTotalPagesRef.current === null || totalPages < previousTotalPagesRef.current)
    ) {
      setPageNumber(totalPages);
    }
    
    // Update previous totalPages ref only when we have valid data
    if (!isLoading && !!customersData && totalPages > 0) {
      previousTotalPagesRef.current = totalPages;
    }
  }, [pageNumber, totalPages, isLoading, customersData]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pageNumber]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageNumber(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber((prev) => prev + 1);
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
      setPageNumber(page);
    } else {
      setPageInput(pageNumber.toString());
    }
  };

  const handleCustomerClick = (customerId: number | undefined) => {
    if (customerId) {
      navigate(`/customers/${customerId}`);
    }
  };

  const handleViewDebtHistory = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setShowDebtHistoryDialog(true);
    // Set default date range to current month
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDebtHistoryDateRange({
      from: firstDay,
      to: lastDay,
    });
  };

  const handleExportDebtComparison = async (customerId: number) => {
    setExportingId(customerId);
    try {
      await exportDebtComparison(customerId);
    } catch {
      // Error handled in hook
    } finally {
      setExportingId(null);
    }
  };

  // Calculate stats
  const stats = {
    totalCustomers: totalCount,
    goodStatus: customers.filter((c) => c.debtStatus === "good").length,
    warningStatus: customers.filter((c) => c.debtStatus === "warning").length,
    blockedStatus: customers.filter((c) => c.debtStatus === "blocked").length,
    totalCurrentDebt: customers.reduce(
      (sum, c) => sum + (c.currentDebt ?? 0),
      0
    ),
    totalMaxDebt: customers.reduce((sum, c) => sum + (c.maxDebt ?? 0), 0),
  };

  // Update date range when month/year changes
  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    setDebtHistoryDateRange({
      from: firstDay,
      to: lastDay,
    });
  };

  const handleExportDebtByMonth = () => {
    const firstDay = new Date(exportYear, exportMonth - 1, 1);
    const lastDay = new Date(exportYear, exportMonth, 0);
    exportDebt({
      startDate: format(firstDay, "yyyy-MM-dd'T'00:00:00.000'Z'"),
      endDate: format(lastDay, "yyyy-MM-dd'T'23:59:59.999'Z'"),
      year: exportYear,
      month: exportMonth,
    });
  };

  const handleExportDebtByQuarter = () => {
    const startMonth = (exportQuarter - 1) * 3;
    const firstDay = new Date(exportQuarterYear, startMonth, 1);
    const lastDay = new Date(exportQuarterYear, startMonth + 3, 0);
    exportDebt({
      startDate: format(firstDay, "yyyy-MM-dd'T'00:00:00.000'Z'"),
      endDate: format(lastDay, "yyyy-MM-dd'T'23:59:59.999'Z'"),
    });
  };

  const handleExportDebtByDate = () => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }
    exportDebt({
      startDate: format(exportDateRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'"),
      endDate: format(exportDateRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'"),
    });
  };

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Removed getDebtStatusBadge - use DebtStatusBadge from StatusBadges instead

  const getDebtRatioColor = (ratio: number) => {
    if (ratio > 100) return "text-red-600";
    if (ratio > 80) return "text-yellow-600";
    return "text-green-600";
  };

  const getDebtBarColor = (ratio: number) => {
    if (ratio > 100) return "bg-red-500";
    if (ratio > 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 -mt-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Báo cáo Công nợ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi và quản lý công nợ khách hàng
          </p>
        </div>
        <Button onClick={() => setShowExportDialog(true)} className="h-9">
          <Download className="h-4 w-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tổng KH
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none">
                {stats.totalCustomers}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tình trạng tốt
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-green-600">
                {stats.goodStatus}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Cần theo dõi
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-yellow-600">
                {stats.warningStatus}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Bị chặn
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-red-600">
                {stats.blockedStatus}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Tổng quan công nợ</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2.5 bg-red-50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">
                Tổng công nợ hiện tại
              </p>
              <p className="text-base sm:text-lg font-bold text-red-600 mt-1.5 leading-none">
                {formatCurrency(stats.totalCurrentDebt)}
              </p>
            </div>
            <div className="text-center p-2.5 bg-muted/50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">
                Tổng hạn mức cho phép
              </p>
              <p className="text-base sm:text-lg font-bold mt-1.5 leading-none">
                {formatCurrency(stats.totalMaxDebt)}
              </p>
            </div>
            <div className="text-center p-2.5 bg-blue-50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">Tỷ lệ sử dụng</p>
              <p className="text-base sm:text-lg font-bold text-blue-600 mt-1.5 leading-none">
                {stats.totalMaxDebt > 0
                  ? Math.round(
                      (stats.totalCurrentDebt / stats.totalMaxDebt) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Debt Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Filter toolbar */}
          <div className="flex gap-3 items-center p-3 border-b border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                className="pl-9 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                variant={filterStatus === "all" ? "default" : "ghost"}
                size="sm"
                className="h-9 text-sm"
                onClick={() => setFilterStatus("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={filterStatus === "warning" ? "default" : "ghost"}
                size="sm"
                className="h-9 text-sm"
                onClick={() => setFilterStatus("warning")}
              >
                Cảnh báo
              </Button>
              <Button
                variant={filterStatus === "blocked" ? "default" : "ghost"}
                size="sm"
                className="h-9 text-sm"
                onClick={() => setFilterStatus("blocked")}
              >
                Bị chặn
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Không có khách hàng nào</p>
            </div>
          ) : (
            <>
              <div
                ref={tableContainerRef}
                className="overflow-x-auto"
              >
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold text-slate-700">Khách hàng</TableHead>
                      <TableHead className="font-semibold text-slate-700">Liên hệ</TableHead>
                      <TableHead className="font-semibold text-slate-700">Công nợ hiện tại</TableHead>
                      <TableHead className="font-semibold text-slate-700">Hạn mức</TableHead>
                      <TableHead className="font-semibold text-slate-700">Tỷ lệ</TableHead>
                      <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {customers.map((customer) => {
                        const debtRatio =
                          customer.maxDebt && customer.maxDebt > 0
                            ? ((customer.currentDebt ?? 0) / customer.maxDebt) *
                              100
                            : 0;

                        return (
                          <TableRow
                            key={customer.id}
                            className="h-14 cursor-pointer hover:bg-muted/50"
                            onClick={() => handleCustomerClick(customer.id)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-semibold text-sm">
                                  {customer.name ?? ""}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.code ?? ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {customer.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-semibold">
                                    {customer.phone}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-bold text-sm ${
                                  (customer.currentDebt ?? 0) >
                                  (customer.maxDebt ?? 0)
                                    ? "text-red-600"
                                    : ""
                                }`}
                              >
                                {formatCurrency(customer.currentDebt ?? 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-sm">
                                {formatCurrency(customer.maxDebt ?? 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold text-sm ${getDebtRatioColor(
                                    debtRatio
                                  )}`}
                                >
                                  {Math.round(debtRatio)}%
                                </span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getDebtBarColor(
                                      debtRatio
                                    )}`}
                                    style={{
                                      width: `${Math.min(debtRatio, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DebtStatusBadge status={customer.debtStatus ?? undefined} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60">
                  <p className="text-sm text-slate-500">
                    Hiển thị <strong>{(pageNumber - 1) * pageSize + 1}</strong> – <strong>{Math.min(pageNumber * pageSize, totalCount)}</strong> trong <strong>{totalCount}</strong> khách hàng
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={pageNumber === 1 || isLoading}
                      className="h-8"
                    >
                      Trước
                    </Button>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-muted-foreground">Trang</span>
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
                      <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pageNumber === totalPages || isLoading}
                      className="h-8"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Debt Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Xuất báo cáo công nợ
            </DialogTitle>
            <DialogDescription>
              Chọn khoảng thời gian hoặc theo tháng/quý để xuất file excel báo cáo công nợ.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={exportTab} onValueChange={setExportTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="date">Theo ngày</TabsTrigger>
              <TabsTrigger value="month">Theo tháng</TabsTrigger>
              <TabsTrigger value="quarter">Theo quý</TabsTrigger>
            </TabsList>

            <TabsContent value="date" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Khoảng thời gian</Label>
                <DateRangePicker
                  value={exportDateRange}
                  onValueChange={setExportDateRange}
                  placeholder="Từ ngày - Đến ngày"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleExportDebtByDate}
                  disabled={exportingDebt}
                >
                  {exportingDebt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Xuất Excel
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Báo cáo công nợ từ ngày bắt đầu đến ngày kết thúc đã chọn (bao gồm nợ và thanh toán).
              </p>
            </TabsContent>

            <TabsContent value="month" className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Tháng</Label>
                  <Select
                    value={exportMonth.toString()}
                    onValueChange={(v) => setExportMonth(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <SelectItem key={month} value={month.toString()}>
                            Tháng {month}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Năm</Label>
                  <Select
                    value={exportYear.toString()}
                    onValueChange={(v) => setExportYear(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - 2 + i
                      ).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleExportDebtByMonth}
                  disabled={exportingDebt}
                >
                  {exportingDebt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Xuất Excel
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Báo cáo công nợ từ ngày 1 đến ngày cuối tháng (bao gồm nợ và thanh toán).
              </p>
            </TabsContent>

            <TabsContent value="quarter" className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Quý</Label>
                  <Select
                    value={exportQuarter.toString()}
                    onValueChange={(v) => setExportQuarter(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((quarter) => (
                        <SelectItem key={quarter} value={quarter.toString()}>
                          Quý {quarter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Năm</Label>
                  <Select
                    value={exportQuarterYear.toString()}
                    onValueChange={(v) => setExportQuarterYear(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - 2 + i
                      ).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleExportDebtByQuarter}
                  disabled={exportingDebt}
                >
                  {exportingDebt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Xuất Excel
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Báo cáo công nợ trong suốt 3 tháng của quý đã chọn (bao gồm nợ và thanh toán).
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

        {/* Debt History Dialog */}
        <Dialog
          open={showDebtHistoryDialog}
          onOpenChange={setShowDebtHistoryDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Lịch sử công nợ - {selectedCustomer?.name || ""}
              </DialogTitle>
              <DialogDescription>
                Xem chi tiết lịch sử công nợ và thanh toán của khách hàng
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Monthly Debt Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Công nợ đầu tháng {selectedMonth}/{selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMonthlyDebt ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : monthlyDebt ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Công nợ đầu kỳ
                        </p>
                        <p className="text-xl font-bold">
                          {formatCurrency(monthlyDebt.openingDebt ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Phát sinh trong tháng
                        </p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(monthlyDebt.changeInMonth ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Công nợ cuối kỳ
                        </p>
                        <p className="text-xl font-bold">
                          {formatCurrency(monthlyDebt.closingDebt ?? 0)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có dữ liệu công nợ cho tháng này
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Date Range Selector */}
              <div className="space-y-2">
                <Label>Chọn khoảng thời gian</Label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <DateRangePicker
                      value={debtHistoryDateRange}
                      onValueChange={setDebtHistoryDateRange}
                      placeholder="Chọn từ ngày đến ngày"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(v) =>
                        handleMonthYearChange(parseInt(v), selectedYear)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <SelectItem key={month} value={month.toString()}>
                              Tháng {month}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(v) =>
                        handleMonthYearChange(selectedMonth, parseInt(v))
                      }
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 5 },
                          (_, i) => new Date().getFullYear() - 2 + i
                        ).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Debt Summary */}
              {debtHistoryDateRange?.from && debtHistoryDateRange?.to && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Tổng hợp công nợ từ{" "}
                      {format(debtHistoryDateRange.from, "dd/MM/yyyy", {
                        locale: vi,
                      })}{" "}
                      đến{" "}
                      {format(debtHistoryDateRange.to, "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingDebtSummary ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : debtSummary ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Công nợ đầu kỳ
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency((debtSummary.openingDebt as number | undefined) ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Tổng phát sinh
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency((debtSummary.totalDebtIncurred as number | undefined) ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Tổng thanh toán
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(
                              (debtSummary.totalPaymentReceived as number | undefined) ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Công nợ cuối kỳ
                          </p>
                          <p className="text-xl font-bold">
                            {formatCurrency((debtSummary.closingDebt as number | undefined) ?? 0)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Debt History Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Chi tiết lịch sử công nợ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDebtHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : debtHistory &&
                    debtHistory.items &&
                    debtHistory.items.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Đơn hàng</TableHead>
                            <TableHead>Công nợ trước</TableHead>
                            <TableHead>Thay đổi</TableHead>
                            <TableHead>Công nợ sau</TableHead>
                            <TableHead>Ghi chú</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debtHistory.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.createdAt
                                  ? format(
                                      new Date(item.createdAt),
                                      "dd/MM/yyyy HH:mm",
                                      { locale: vi }
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.changeType === "payment"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {(item.changeType as string | null) || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.orderCode || "—"}</TableCell>
                              <TableCell>
                                {formatCurrency(item.previousDebt ?? 0)}
                              </TableCell>
                              <TableCell
                                className={
                                  (item.changeAmount ?? 0) > 0
                                    ? "text-red-600 font-medium"
                                    : "text-green-600 font-medium"
                                }
                              >
                                {(item.changeAmount ?? 0) > 0 ? "+" : ""}
                                {formatCurrency(item.changeAmount ?? 0)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(item.newDebt ?? 0)}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.note || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Chưa có lịch sử công nợ trong khoảng thời gian này
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
