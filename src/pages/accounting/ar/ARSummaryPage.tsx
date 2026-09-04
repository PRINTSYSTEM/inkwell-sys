import { useState, useMemo, Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  Search,
  RefreshCw,
  Download,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Scale,
} from "lucide-react";
import { ROUTE_PATHS } from "@/constants/route.constant";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useARSummary } from "@/hooks/use-ar-ap";
import { useExportDebt } from "@/hooks/use-accounting";
import {
  useExportDebtComparison,
  useCustomerDebtStatement,
  useCustomerDebtStatementByRange,
} from "@/hooks/use-customer";
import { ARCreateReceiptDialog } from "./ARCreateReceiptDialog";
import { formatCurrency } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DebtStatementItem } from "@/Schema/customer.schema";

const formatRawNumber = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateStr = (dateString?: string | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export default function ARSummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Map<number, any>>(new Map());
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [rowTotals, setRowTotals] = useState<
    Record<number, { opening: number; increase: number; decrease: number; closing: number }>
  >({});
  const itemsPerPage = 1000;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARSummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    searchTerm: searchQuery || undefined,
  });

  const filteredARItems = useMemo(() => {
    if (!arData?.items) return [];
    return arData.items.filter((item: any) => {
      return (
        (item.openingBalance ?? 0) !== 0 ||
        (item.increase ?? 0) !== 0 ||
        (item.decrease ?? 0) !== 0 ||
        (item.closingBalance ?? 0) !== 0
      );
    });
  }, [arData?.items]);

  const { mutate: exportDebt, loading: isExporting } = useExportDebt();
  const { mutate: exportCustomerDebt } = useExportDebtComparison();
  const [exportingCustomerId, setExportingCustomerId] = useState<number | null>(null);

  const handleExportCustomerDebtExcel = async (customerId: number | undefined) => {
    if (!customerId) return;
    setExportingCustomerId(customerId);
    try {
      const month = dateRange?.from ? dateRange.from.getMonth() + 1 : new Date().getMonth() + 1;
      const year = dateRange?.from ? dateRange.from.getFullYear() : new Date().getFullYear();
      await exportCustomerDebt(customerId, { month, year });
    } catch (err) {
      console.error(err);
    } finally {
      setExportingCustomerId(null);
    }
  };

  const handleExportExcel = async () => {
    await exportDebt({
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      searchTerm: searchQuery || undefined,
    });
  };

  const toggleCustomer = (customerId: number) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleSelectOrder = (order: any, customer: any) => {
    const newSelected = new Map(selectedOrders);

    if (newSelected.has(order.documentId)) {
      newSelected.delete(order.documentId);
    } else {
      const existingEntries = Array.from(newSelected.values());
      if (existingEntries.length > 0 && existingEntries[0].customerId !== customer.customerId) {
        toast.warning("Chỉ có thể chọn các đơn hàng của cùng một khách hàng để tạo phiếu thu.");
        return;
      }

      newSelected.set(order.documentId, {
        ...order,
        customerId: customer.customerId,
        customerName: customer.customerName || customer.companyName,
      });
    }
    setSelectedOrders(newSelected);
  };

  const handleRowDataLoaded = (
    customerId: number,
    totals: { opening: number; increase: number; decrease: number; closing: number }
  ) => {
    setRowTotals((prev) => {
      const current = prev[customerId];
      if (
        current &&
        current.opening === totals.opening &&
        current.increase === totals.increase &&
        current.decrease === totals.decrease &&
        current.closing === totals.closing
      ) {
        return prev;
      }
      return { ...prev, [customerId]: totals };
    });
  };

  const totals = useMemo(() => {
    if (!filteredARItems || filteredARItems.length === 0) {
      return { opening: 0, increase: 0, decrease: 0, closing: 0, overdue: 0 };
    }

    let opening = 0;
    let increase = 0;
    let decrease = 0;
    let closing = 0;
    let overdue = 0;

    filteredARItems.forEach((item: any) => {
      const cId = item.customerId;
      if (cId && rowTotals[cId]) {
        opening += rowTotals[cId].opening;
        increase += rowTotals[cId].increase;
        decrease += rowTotals[cId].decrease;
        closing += rowTotals[cId].closing;
      } else {
        opening += item.openingBalance || 0;
        increase += item.increase || 0;
        decrease += item.decrease || 0;
        closing += item.closingBalance || 0;
      }
      overdue += item.overdue || 0;
    });

    return { opening, increase, decrease, closing, overdue };
  }, [filteredARItems, rowTotals]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Dư đầu kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-blue-700">
              {formatCurrency(totals.opening)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-100 bg-orange-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-orange-600 uppercase tracking-wider">
              Phát sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-orange-700">
              {formatCurrency(totals.increase)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 bg-green-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-green-600 uppercase tracking-wider">
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(totals.decrease)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-slate-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Dư cuối kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(totals.closing)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-100 bg-red-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wider">
              Quá hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-red-700">
              {formatCurrency(totals.overdue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background rounded-xl border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b bg-muted/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm mã, tên khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              className="w-[280px]"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTE_PATHS.ACCOUNTING.OPENING_BALANCES)}
              className="h-9 border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-blue-600 dark:border-blue-900 dark:hover:bg-blue-950/20"
            >
              <Scale className="h-4 w-4 mr-2" />
              Số dư đầu kỳ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-9"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất Excel
            </Button>
            {selectedOrders.size > 0 && (
              <Button
                variant="default"
                size="sm"
                className="h-9 bg-green-600 hover:bg-green-700"
                onClick={() => setIsReceiptDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu thu ({selectedOrders.size})
              </Button>
            )}
          </div>
        </div>

        <ARCreateReceiptDialog
          open={isReceiptDialogOpen}
          onOpenChange={setIsReceiptDialogOpen}
          selectedOrders={selectedOrders}
          onSuccess={() => {
            setSelectedOrders(new Map());
            refetch();
          }}
        />

        {/* Error Alert */}
        {isError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">Mã KH</TableHead>
                <TableHead>Tên khách hàng</TableHead>
                <TableHead className="text-right">Dư đầu kỳ</TableHead>
                <TableHead className="text-right">Phát sinh</TableHead>
                <TableHead className="text-right">Thanh toán</TableHead>
                <TableHead className="text-right">Dư cuối kỳ</TableHead>
                <TableHead className="text-center w-[80px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filteredARItems || filteredARItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mb-2 opacity-20" />
                      <p>Không tìm thấy dữ liệu công nợ trong khoảng thời gian này</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredARItems.map((item: any, index: number) => {
                  const isExpanded = item.customerId ? expandedCustomers.has(item.customerId) : false;
                  return (
                    <ARCustomerRow
                      key={item.customerId ?? index}
                      item={item}
                      dateRange={dateRange}
                      isExpanded={isExpanded}
                      onToggle={() => item.customerId && toggleCustomer(item.customerId)}
                      onExportExcel={handleExportCustomerDebtExcel}
                      isExporting={exportingCustomerId === item.customerId}
                      selectedOrders={selectedOrders}
                      onSelectOrder={(order) => handleSelectOrder(order, item)}
                      onRowDataLoaded={handleRowDataLoaded}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Container */}
        {arData && filteredARItems.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {filteredARItems.length} khách hàng
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
              <div className="text-xs font-medium bg-background border px-3 py-1.5 rounded-md min-w-[80px] text-center">
                Trang {currentPage} / {arData.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.min(arData.totalPages, p + 1))}
                disabled={currentPage === arData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component render 1 dòng khách hàng + tự tải Debt Statement để chuẩn hóa 100% với Tab Công Nợ
function ARCustomerRow({
  item,
  dateRange,
  isExpanded,
  onToggle,
  onExportExcel,
  isExporting,
  selectedOrders,
  onSelectOrder,
  onRowDataLoaded,
}: {
  item: any;
  dateRange: DateRange | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onExportExcel: (customerId: number | undefined) => void;
  isExporting: boolean;
  selectedOrders: Map<number, any>;
  onSelectOrder: (order: any) => void;
  onRowDataLoaded: (
    customerId: number,
    totals: { opening: number; increase: number; decrease: number; closing: number }
  ) => void;
}) {
  const navigate = useNavigate();
  const customerId = item.customerId;

  const isRangeMode = Boolean(dateRange?.from && dateRange?.to);

  const fromDateStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const toDateStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  const selectedMonth = dateRange?.from ? dateRange.from.getMonth() + 1 : new Date().getMonth() + 1;
  const selectedYear = dateRange?.from ? dateRange.from.getFullYear() : new Date().getFullYear();

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const { data: rangeData, isLoading: isLoadingRange } = useCustomerDebtStatementByRange(
    customerId,
    { fromDate: fromDateStr, toDate: toDateStr },
    Boolean(customerId && isRangeMode)
  );

  const { data: prevMonthlyData, isLoading: isLoadingPrevMonthly } = useCustomerDebtStatement(
    customerId,
    { month: prevMonth, year: prevYear },
    Boolean(customerId && !isRangeMode)
  );

  const { data: monthlyData, isLoading: isLoadingMonthly } = useCustomerDebtStatement(
    customerId,
    { month: selectedMonth, year: selectedYear },
    Boolean(customerId && !isRangeMode)
  );

  const statementData = isRangeMode ? rangeData : monthlyData;
  const isLoadingStatement = isRangeMode
    ? isLoadingRange
    : isLoadingMonthly || isLoadingPrevMonthly;

  const beginningBalance =
    !isRangeMode && prevMonthlyData?.endingBalance !== undefined
      ? prevMonthlyData.endingBalance
      : statementData?.beginningBalance ?? item.openingBalance ?? 0;

  const totalIncrease = statementData?.totalIncrease ?? item.increase ?? 0;
  const totalDecrease = statementData?.totalDecrease ?? item.decrease ?? 0;
  const endingBalance = beginningBalance + totalIncrease - totalDecrease;

  useEffect(() => {
    if (customerId && !isLoadingStatement) {
      onRowDataLoaded(customerId, {
        opening: beginningBalance,
        increase: totalIncrease,
        decrease: totalDecrease,
        closing: endingBalance,
      });
    }
  }, [
    customerId,
    isLoadingStatement,
    beginningBalance,
    totalIncrease,
    totalDecrease,
    endingBalance,
  ]);

  const handleCompanyNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customerId) {
      navigate(`/customers/${customerId}`);
    }
  };

  return (
    <Fragment>
      <TableRow
        className={cn(
          "cursor-pointer transition-colors hover:bg-muted/30",
          isExpanded && "bg-muted/20 border-b-0"
        )}
        onClick={onToggle}
      >
        <TableCell className="text-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium font-mono text-xs">
          {item.customerCode || "—"}
        </TableCell>
        <TableCell className="font-semibold text-sm">
          <span
            onClick={handleCompanyNameClick}
            className="hover:underline text-primary hover:text-primary/80 cursor-pointer transition-colors"
            title="Xem chi tiết khách hàng"
          >
            {item.customerName || item.companyName || "—"}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
          {isLoadingStatement ? (
            <Skeleton className="h-4 w-16 ml-auto" />
          ) : (
            formatCurrency(beginningBalance)
          )}
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm text-orange-600 font-medium">
          {isLoadingStatement ? (
            <Skeleton className="h-4 w-16 ml-auto" />
          ) : (
            formatCurrency(totalIncrease)
          )}
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm text-green-600 font-medium">
          {isLoadingStatement ? (
            <Skeleton className="h-4 w-16 ml-auto" />
          ) : (
            formatCurrency(totalDecrease)
          )}
        </TableCell>
        <TableCell className="text-right font-bold tabular-nums text-sm">
          {isLoadingStatement ? (
            <Skeleton className="h-4 w-16 ml-auto" />
          ) : (
            formatCurrency(endingBalance)
          )}
        </TableCell>
        <TableCell className="text-right">
          {item.overdue !== undefined && item.overdue > 0 ? (
            <Badge variant="destructive" className="font-medium">
              {formatCurrency(item.overdue)}
            </Badge>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg cursor-pointer"
            onClick={() => onExportExcel(customerId)}
            disabled={isExporting}
            title="Xuất Excel đối chiếu công nợ"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && customerId && (
        <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0 select-none">
          <TableCell colSpan={9} className="p-3 pl-8 md:pl-12 bg-stone-50/50 dark:bg-stone-900/10">
            <CustomerDetailRow
              statementItems={statementData?.items}
              beginningBalance={beginningBalance}
              totalIncrease={totalIncrease}
              totalDecrease={totalDecrease}
              endingBalance={endingBalance}
              isLoadingDetail={isLoadingStatement}
              selectedOrders={selectedOrders}
              onSelectOrder={onSelectOrder}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

// Component render chi tiết công nợ phải thu giống hệt 100% giao diện bảng trong Tab Công nợ khách hàng
function CustomerDetailRow({
  statementItems,
  beginningBalance,
  totalIncrease,
  totalDecrease,
  endingBalance,
  isLoadingDetail,
  selectedOrders,
  onSelectOrder,
}: {
  statementItems: DebtStatementItem[] | undefined;
  beginningBalance: number;
  totalIncrease: number;
  totalDecrease: number;
  endingBalance: number;
  isLoadingDetail: boolean;
  selectedOrders: Map<number, any>;
  onSelectOrder: (order: any) => void;
}) {
  const items = useMemo(() => {
    const rawItems = statementItems || [];
    if (!rawItems.length) return [];

    const result: typeof rawItems = [];

    for (const item of rawItems) {
      const dec = item.decreaseAmount && item.decreaseAmount > 0 ? item.decreaseAmount : 0;

      const itemReceiptId = item.cashReceiptId ?? (item as any).receiptId ?? null;
      const voucherCode = item.voucherCode ?? (item as any).receiptCode ?? null;

      const prevItem = result.length > 0 ? result[result.length - 1] : null;
      const prevReceiptId = prevItem
        ? prevItem.cashReceiptId ?? (prevItem as any).receiptId ?? null
        : null;
      const prevVoucherCode = prevItem
        ? prevItem.voucherCode ?? (prevItem as any).receiptCode ?? null
        : null;

      const isSameReceiptGroup =
        prevItem &&
        ((itemReceiptId !== null && prevReceiptId !== null && itemReceiptId === prevReceiptId) ||
          (voucherCode !== null && prevVoucherCode !== null && voucherCode === prevVoucherCode));

      if (isSameReceiptGroup && prevItem) {
        const lastIdx = result.length - 1;
        result[lastIdx] = {
          ...prevItem,
          decreaseAmount: (prevItem.decreaseAmount || 0) + dec,
        };
      } else {
        result.push({ ...item });
      }
    }

    return result;
  }, [statementItems]);

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground bg-background rounded-lg border border-inner">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs">Đang tải sổ chi tiết công nợ...</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-900 shadow-xs">
      <div className="py-2 px-3 border-b border-slate-100 dark:border-stone-800 bg-slate-50 dark:bg-stone-900">
        <span className="text-xs font-bold text-slate-800 dark:text-stone-100 uppercase tracking-wider">
          Chi tiết công nợ phải thu
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px] border-collapse">
          <TableHeader className="bg-slate-50 dark:bg-stone-900 border-b border-slate-200 dark:border-stone-800">
            <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-stone-800">
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-center py-2 h-9 w-[50px] bg-slate-50 dark:bg-stone-900">
                STT
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-center py-2 h-9 w-[90px] bg-slate-50 dark:bg-stone-900">
                NGÀY
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-center py-2 h-9 w-[110px] bg-slate-50 dark:bg-stone-900">
                SỐ PHIẾU GH
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-center py-2 h-9 w-[100px] bg-slate-50 dark:bg-stone-900">
                NGÀY HĐ
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-center py-2 h-9 w-[100px] bg-slate-50 dark:bg-stone-900">
                SỐ HÓA ĐƠN
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-left py-2 h-9 min-w-[220px] bg-slate-50 dark:bg-stone-900">
                DIỄN GIẢI
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-right py-2 h-9 w-[80px] bg-slate-50 dark:bg-stone-900">
                SỐ LƯỢNG
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-right py-2 h-9 w-[95px] bg-slate-50 dark:bg-stone-900">
                ĐƠN GIÁ
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-right py-2 h-9 w-[115px] bg-slate-50 dark:bg-stone-900">
                THÀNH TIỀN
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-right py-2 h-9 w-[115px] bg-slate-50 dark:bg-stone-900">
                THANH TOÁN
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-right py-2 h-9 w-[130px] bg-slate-50 dark:bg-stone-900">
                TỒN NỢ LŨY KẾ
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-600 dark:text-stone-300 border border-slate-200 dark:border-stone-800 text-left py-2 h-9 min-w-[150px] bg-slate-50 dark:bg-stone-900">
                GHI CHÚ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* SỐ DƯ ĐẦU KỲ */}
            <TableRow className="bg-slate-50/70 dark:bg-stone-900/40 font-bold border-b border-slate-200 dark:border-stone-800 hover:bg-slate-50/70">
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-900 dark:text-stone-100 font-semibold">
                SỐ DƯ ĐẦU KỲ
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-semibold font-mono text-slate-900 dark:text-stone-100">
                {formatRawNumber(beginningBalance)}
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-400">
                —
              </TableCell>
            </TableRow>

            {/* List items */}
            {(() => {
              let runningAcc = beginningBalance;
              return items.map((item, idx) => {
                const stt = idx + 1;
                const dateStr = formatDateStr(item.date);
                const invoiceDateStr = formatDateStr(item.invoiceDate);

                const qtyStr =
                  item.quantity != null ? formatRawNumber(item.quantity) : "—";
                const priceStr =
                  item.unitPrice != null ? formatRawNumber(item.unitPrice) : "—";

                const inc =
                  item.increaseAmount && item.increaseAmount > 0
                    ? item.increaseAmount
                    : 0;
                const dec =
                  item.decreaseAmount && item.decreaseAmount > 0
                    ? item.decreaseAmount
                    : 0;
                runningAcc = runningAcc + inc - dec;

                const increaseAmtStr = inc > 0 ? formatRawNumber(inc) : "—";
                const decreaseAmtStr = dec > 0 ? formatRawNumber(dec) : "—";
                const runningBalStr = formatRawNumber(runningAcc);

                return (
                  <TableRow
                    key={item.id || idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-stone-850/30 border-b border-slate-100 dark:border-stone-850"
                  >
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-500">
                      {stt}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-700 dark:text-stone-300">
                      {dateStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-700 dark:text-stone-300">
                      {item.deliveryNoteCode || "—"}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-700 dark:text-stone-300">
                      {invoiceDateStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-700 dark:text-stone-300">
                      {item.invoiceCode || "—"}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-800 dark:text-stone-200">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.description || "—"}</span>
                        {item.voucherCode && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {item.voucherCode}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-slate-750 dark:text-stone-350">
                      {qtyStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-slate-800 text-right py-2.5 text-xs font-mono text-slate-750 dark:text-stone-350">
                      {priceStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-emerald-600 font-medium">
                      {increaseAmtStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-red-600 font-medium">
                      {decreaseAmtStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-slate-900 dark:text-stone-100 font-medium">
                      {runningBalStr}
                    </TableCell>
                    <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-500 dark:text-stone-400 max-w-[200px] truncate">
                      {item.notes || "—"}
                    </TableCell>
                  </TableRow>
                );
              });
            })()}

            {/* Empty state */}
            {!items.length && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-10 border border-slate-200 dark:border-stone-800 text-muted-foreground text-xs italic"
                >
                  Chưa có lịch sử công nợ trong khoảng thời gian đã chọn
                </TableCell>
              </TableRow>
            )}

            {/* CỘNG PHÁT SINH */}
            <TableRow className="bg-slate-50/70 dark:bg-stone-900/40 font-bold border-b border-slate-200 dark:border-stone-800 hover:bg-slate-50/70">
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-900 dark:text-stone-100 font-semibold">
                CỘNG PHÁT SINH TRONG KỲ
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-semibold font-mono text-emerald-600">
                {formatRawNumber(totalIncrease)}
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-semibold font-mono text-red-600">
                {formatRawNumber(totalDecrease)}
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-400">
                —
              </TableCell>
            </TableRow>

            {/* SỐ DƯ CUỐI KỲ */}
            <TableRow className="bg-slate-50/70 dark:bg-stone-900/40 font-bold border-b border-slate-200 dark:border-stone-800 hover:bg-slate-50/70">
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs font-mono text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-900 dark:text-stone-100 font-semibold">
                SỐ DƯ CUỐI KỲ
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-center py-2.5 text-xs text-slate-400">
                —
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-semibold font-mono text-slate-900 dark:text-stone-100">
                {formatRawNumber(endingBalance)}
              </TableCell>
              <TableCell className="border border-slate-200 dark:border-stone-800 py-2.5 text-xs text-slate-400">
                —
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

