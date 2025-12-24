import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useCustomers,
  useExportDebtComparison,
  useCustomerDebtHistory,
  useCustomerMonthlyDebt,
  useCustomerDebtSummary,
} from "@/hooks/use-customer";
import { useExportDebt } from "@/hooks/use-accounting";
import { formatCurrency } from "@/lib/status-utils";

export default function AccountingDebtReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Debt history dialog state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [showDebtHistoryDialog, setShowDebtHistoryDialog] = useState(false);
  const [debtHistoryDateRange, setDebtHistoryDateRange] =
    useState<DateRange | undefined>(undefined);

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

  const customers = useMemo(() => customersData?.items ?? [], [customersData?.items]);
  const totalCount = customersData?.total ?? 0;

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

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const getDebtStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;

    const config: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" }
    > = {
      good: { label: "Tốt", variant: "default" },
      warning: { label: "Cảnh báo", variant: "secondary" },
      blocked: { label: "Bị chặn", variant: "destructive" },
    };

    const { label, variant } = config[status] ?? {
      label: status,
      variant: "default" as const,
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo Công nợ</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý công nợ khách hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng KH</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">khách hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tình trạng tốt
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.goodStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.goodStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần theo dõi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.warningStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.warningStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị chặn</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.blockedStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.blockedStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tổng quan công nợ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Tổng công nợ hiện tại
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalCurrentDebt)}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Tổng hạn mức cho phép
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalMaxDebt)}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Tỷ lệ sử dụng</p>
              <p className="text-2xl font-bold text-blue-600">
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
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết công nợ khách hàng</CardTitle>
          <div className="flex gap-4 items-center mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={filterStatus === "warning" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("warning")}
              >
                Cảnh báo
              </Button>
              <Button
                variant={filterStatus === "blocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("blocked")}
              >
                Bị chặn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Không có khách hàng nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Công nợ hiện tại</TableHead>
                      <TableHead>Hạn mức</TableHead>
                      <TableHead>Tỷ lệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
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
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {customer.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {customer.phone}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                (customer.currentDebt ?? 0) >
                                (customer.maxDebt ?? 0)
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {formatCurrency(customer.currentDebt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(customer.maxDebt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${getDebtRatioColor(
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
                            {getDebtStatusBadge(customer.debtStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    exporting && exportingId === customer.id
                                  }
                                >
                                  {exporting && exportingId === customer.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleViewDebtHistory(customer.id!)
                                  }
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Xem lịch sử công nợ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExportDebtComparison(customer.id!)
                                  }
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Xuất đối chiếu công nợ
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {customers.length} / {totalCount} khách hàng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={customers.length < pageSize}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Debt by Month Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Xuất công nợ theo tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Tháng</Label>
              <Select
                value={exportMonth.toString()}
                onValueChange={(v) => setExportMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      Tháng {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Năm</Label>
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
          <p className="text-sm text-muted-foreground mt-2">
            Xuất báo cáo công nợ từ ngày 1 đến ngày cuối tháng (bao gồm nợ và
            thanh toán)
          </p>
        </CardContent>
      </Card>

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
                          {formatCurrency(debtSummary.openingDebt ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tổng phát sinh
                        </p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(debtSummary.totalDebtIncurred ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tổng thanh toán
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(debtSummary.totalPaymentReceived ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Công nợ cuối kỳ
                        </p>
                        <p className="text-xl font-bold">
                          {formatCurrency(debtSummary.closingDebt ?? 0)}
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
                <CardTitle className="text-lg">Chi tiết lịch sử công nợ</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDebtHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : debtHistory && debtHistory.length > 0 ? (
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
                        {debtHistory.map((item) => (
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
                                {item.changeTypeDisplay || item.changeType || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.orderCode || "—"}
                            </TableCell>
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
