import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Loader2, Scale } from "lucide-react";
import {
  useCustomerDebtStatement,
  useCustomerDebtStatementByRange,
  useExportDebtComparison,
} from "@/hooks/use-customer";
import { useCustomerOpeningBalances } from "@/hooks/use-opening-balance";
import { EditOpeningBalanceDialog } from "@/pages/accounting/opening-balances/components/EditOpeningBalanceDialog";

interface DebtTabProps {
  customerId: number;
  isActive?: boolean;
}

export function DebtTab({ customerId, isActive = true }: DebtTabProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "date_range">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const getFormattedDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getFormattedDate(d);
  });
  const [toDate, setToDate] = useState<string>(() => getFormattedDate(new Date()));

  const [isEditOpeningOpen, setIsEditOpeningOpen] = useState(false);

  const { data: customerOpeningBalances } = useCustomerOpeningBalances();
  const openingBalance = customerOpeningBalances?.find(
    (item) => item.customerId === customerId
  );

  const { data: monthlyData, isLoading: isLoadingMonthly } = useCustomerDebtStatement(
    customerId,
    {
      month: selectedMonth,
      year: selectedYear,
    },
    isActive && viewMode === "monthly",
  );

  const { data: rangeData, isLoading: isLoadingRange } = useCustomerDebtStatementByRange(
    customerId,
    {
      fromDate,
      toDate,
    },
    isActive && viewMode === "date_range",
  );

  const statementData = viewMode === "monthly" ? monthlyData : rangeData;
  const isLoading = viewMode === "monthly" ? isLoadingMonthly : isLoadingRange;

  const { mutate: exportDebtComparison, loading: exporting } =
    useExportDebtComparison();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRawNumber = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const beginningBalance = statementData?.beginningBalance ?? 0;
  const totalIncrease = statementData?.totalIncrease ?? 0;
  const totalDecrease = statementData?.totalDecrease ?? 0;
  const endingBalance = statementData?.endingBalance ?? 0;
  const items = statementData?.items || [];

  const handleExport = () => {
    exportDebtComparison(customerId, { month: selectedMonth, year: selectedYear });
  };

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Lịch sử thanh toán</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Select
              value={viewMode}
              onValueChange={(val) => setViewMode(val as "monthly" | "date_range")}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs font-semibold">
                <SelectValue placeholder="Phương thức xem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Xem theo tháng</SelectItem>
                <SelectItem value="date_range">Xem theo khoảng ngày</SelectItem>
              </SelectContent>
            </Select>

            {viewMode === "monthly" && (
              <>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val))}
                >
                  <SelectTrigger className="h-8 w-[95px] text-xs">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        Năm {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val))}
                >
                  <SelectTrigger className="h-8 w-[95px] text-xs">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        Tháng {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {viewMode === "date_range" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-[125px] text-xs bg-background"
                />
                <span className="text-xs text-muted-foreground font-medium">đến</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-[125px] text-xs bg-background"
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold border-blue-200 hover:bg-blue-50 hover:text-blue-750 text-blue-600 dark:border-blue-900 dark:hover:bg-blue-950/20"
              onClick={() => setIsEditOpeningOpen(true)}
            >
              <Scale className="h-3.5 w-3.5 mr-1" />
              Thiết lập số dư đầu kỳ
            </Button>

            {viewMode === "monthly" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-emerald-600 dark:border-emerald-900 dark:hover:bg-emerald-950/20"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                )}
                Xuất Excel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="border-0 bg-slate-50 dark:bg-stone-900 shadow-xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">
              Số dư đầu kỳ
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-bold text-slate-900 dark:text-stone-50 mt-0.5">
                {formatCurrency(beginningBalance)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-emerald-600">
              Phát sinh tăng
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-bold text-emerald-600 mt-0.5">
                {formatCurrency(totalIncrease)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50/50 dark:bg-red-950/10 shadow-xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-red-600">
              Phát sinh giảm (Thanh toán)
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-bold text-red-600 mt-0.5">
                {formatCurrency(totalDecrease)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-slate-50 dark:bg-stone-900 shadow-xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">
              Số dư cuối kỳ
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-bold text-slate-900 dark:text-stone-50 mt-0.5">
                {formatCurrency(endingBalance)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 min-h-0 flex flex-col">
        <Card className="flex-1 min-h-0 flex flex-col border border-slate-200/80 dark:border-stone-850 shadow-sm overflow-hidden bg-white dark:bg-stone-900">
          <CardHeader className="py-3 px-4 flex-shrink-0 border-b border-slate-100 dark:border-stone-850">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-stone-50">
              Chi tiết công nợ phải thu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="w-full">
                  <Table className="min-w-[1300px] border-collapse">
                    <TableHeader className="sticky top-0 bg-slate-50 dark:bg-stone-900 border-b border-slate-200 dark:border-stone-800 z-10">
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
                      {items.map((item, idx) => {
                        const stt = idx + 1;
                        const dateStr = item.date ? formatDate(item.date) : "—";
                        const invoiceDateStr = item.invoiceDate
                          ? formatDate(item.invoiceDate)
                          : "—";

                        const qtyStr =
                          item.quantity != null
                            ? formatRawNumber(item.quantity)
                            : "—";
                        const priceStr =
                          item.unitPrice != null
                            ? formatRawNumber(item.unitPrice)
                            : "—";

                        const increaseAmtStr =
                          item.increaseAmount && item.increaseAmount > 0
                            ? formatRawNumber(item.increaseAmount)
                            : "—";
                        const decreaseAmtStr =
                          item.decreaseAmount && item.decreaseAmount > 0
                            ? formatRawNumber(item.decreaseAmount)
                            : "—";
                        const runningBalStr =
                          item.runningBalance != null
                            ? formatRawNumber(item.runningBalance)
                            : "—";

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
                              {item.description || "—"}
                            </TableCell>
                            <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-slate-750 dark:text-stone-350">
                              {qtyStr}
                            </TableCell>
                            <TableCell className="border border-slate-200 dark:border-stone-800 text-right py-2.5 text-xs font-mono text-slate-750 dark:text-stone-350">
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
                      })}

                      {/* Empty state */}
                      {!items.length && (
                        <TableRow>
                          <TableCell
                            colSpan={12}
                            className="text-center py-12 border border-slate-200 dark:border-stone-800"
                          >
                            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                              <p className="text-sm font-semibold">
                                {viewMode === "monthly"
                                  ? "Chưa có lịch sử công nợ trong tháng"
                                  : "Chưa có lịch sử công nợ trong khoảng ngày đã chọn"}
                              </p>
                              <p className="text-xs">
                                {viewMode === "monthly"
                                  ? "Dữ liệu sẽ hiển thị khi có phát sinh giao hàng, VAT hoặc thanh toán trong tháng đã chọn"
                                  : "Dữ liệu sẽ hiển thị khi có phát sinh giao hàng, VAT hoặc thanh toán trong khoảng ngày đã chọn"}
                              </p>
                            </div>
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <EditOpeningBalanceDialog
        open={isEditOpeningOpen}
        onOpenChange={setIsEditOpeningOpen}
        type="customer"
        item={openingBalance || { customerId }}
      />
    </div>
  );
}
