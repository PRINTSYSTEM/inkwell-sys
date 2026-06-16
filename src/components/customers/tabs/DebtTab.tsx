import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import {
  useCustomerMonthlyDebt,
  useCustomerDebtHistory,
  useCustomerStatistics,
} from "@/hooks/use-customer";
import type { CustomerMonthlyDebtResponse } from "@/Schema/customer.schema";

interface ParsedNote {
  productCode?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  voucherCode?: string;
  displayDescription: string;
}

const parseNote = (note: string | null | undefined): ParsedNote => {
  const defaultResult: ParsedNote = {
    displayDescription: note || "",
  };

  if (!note) return defaultResult;

  try {
    if (note.trim().startsWith("{") && note.trim().endsWith("}")) {
      const parsed = JSON.parse(note);
      return {
        productCode: parsed.productCode || parsed.sku || parsed.itemCode || undefined,
        productName: parsed.productName || parsed.itemName || parsed.name || undefined,
        quantity: parsed.quantity || parsed.qty || undefined,
        unitPrice: parsed.unitPrice || parsed.price || undefined,
        totalAmount: parsed.totalAmount || parsed.total || undefined,
        voucherCode: parsed.voucherCode || parsed.voucher || parsed.code || undefined,
        displayDescription: parsed.productName || parsed.itemName || parsed.name || parsed.description || note,
      };
    }
  } catch (e) {
    // ignore
  }

  if (note.includes("|")) {
    const parts = note.split("|").map((p) => p.trim());
    if (parts.length >= 5) {
      const possibleCode = parts[0];
      const possibleName = parts[1];
      const possibleQty = parseFloat(parts[2].replace(/,/g, ""));
      const possiblePrice = parseFloat(parts[3].replace(/,/g, ""));
      const possibleTotal = parseFloat(parts[4].replace(/,/g, ""));
      const possibleVoucher = parts[5] || undefined;

      if (possibleCode && possibleName && !isNaN(possibleQty) && !isNaN(possiblePrice)) {
        return {
          productCode: possibleCode,
          productName: possibleName,
          quantity: possibleQty,
          unitPrice: possiblePrice,
          totalAmount: possibleTotal,
          voucherCode: possibleVoucher,
          displayDescription: possibleName,
        };
      }
    }

    const result: Partial<ParsedNote> = {};
    parts.forEach((part) => {
      const lower = part.toLowerCase();
      if (
        lower.includes("mã hàng") ||
        lower.includes("ma hang") ||
        lower.includes("mã sp") ||
        lower.includes("sku")
      ) {
        result.productCode = part.split(":")[1]?.trim();
      } else if (lower.includes("tên") || lower.includes("ten")) {
        result.productName = part.split(":")[1]?.trim();
      } else if (
        lower.includes("số lượng") ||
        lower.includes("so luong") ||
        lower.includes("sl")
      ) {
        const valStr = part.split(":")[1]?.trim() || "";
        result.quantity = parseFloat(valStr.replace(/,/g, "")) || undefined;
      } else if (
        lower.includes("đơn giá") ||
        lower.includes("don gia") ||
        lower.includes("đg")
      ) {
        const valStr = part.split(":")[1]?.trim() || "";
        result.unitPrice = parseFloat(valStr.replace(/,/g, "")) || undefined;
      } else if (
        lower.includes("thành tiền") ||
        lower.includes("thanh tien") ||
        lower.includes("tt")
      ) {
        const valStr = part.split(":")[1]?.trim() || "";
        result.totalAmount = parseFloat(valStr.replace(/,/g, "")) || undefined;
      } else if (
        lower.includes("số phiếu") ||
        lower.includes("so phieu") ||
        lower.includes("phiếu") ||
        lower.includes("phieu")
      ) {
        result.voucherCode = part.split(":")[1]?.trim();
      }
    });

    if (result.productCode || result.productName) {
      return {
        productCode: result.productCode,
        productName: result.productName,
        quantity: result.quantity,
        unitPrice: result.unitPrice,
        totalAmount: result.totalAmount,
        voucherCode: result.voucherCode,
        displayDescription: result.productName || note,
      };
    }
  }

  const separators = [",", ";"];
  for (const sep of separators) {
    if (note.includes(sep)) {
      const parts = note.split(sep).map((p) => p.trim());
      const result: Partial<ParsedNote> = {};
      parts.forEach((part) => {
        const lower = part.toLowerCase();
        if (
          lower.includes("mã hàng") ||
          lower.includes("ma hang") ||
          lower.includes("mã sp") ||
          lower.includes("sku")
        ) {
          result.productCode = part.split(":")[1]?.trim();
        } else if (lower.includes("tên") || lower.includes("ten")) {
          result.productName = part.split(":")[1]?.trim();
        } else if (
          lower.includes("số lượng") ||
          lower.includes("so luong") ||
          lower.includes("sl")
        ) {
          const valStr = part.split(":")[1]?.trim() || "";
          result.quantity = parseFloat(valStr.replace(/,/g, "")) || undefined;
        } else if (
          lower.includes("đơn giá") ||
          lower.includes("don gia") ||
          lower.includes("đg")
        ) {
          const valStr = part.split(":")[1]?.trim() || "";
          result.unitPrice = parseFloat(valStr.replace(/,/g, "")) || undefined;
        } else if (
          lower.includes("thành tiền") ||
          lower.includes("thanh tien") ||
          lower.includes("tt")
        ) {
          const valStr = part.split(":")[1]?.trim() || "";
          result.totalAmount = parseFloat(valStr.replace(/,/g, "")) || undefined;
        } else if (
          lower.includes("số phiếu") ||
          lower.includes("so phieu") ||
          lower.includes("phiếu") ||
          lower.includes("phieu")
        ) {
          result.voucherCode = part.split(":")[1]?.trim();
        }
      });
      if (result.productCode || result.productName) {
        return {
          productCode: result.productCode,
          productName: result.productName,
          quantity: result.quantity,
          unitPrice: result.unitPrice,
          totalAmount: result.totalAmount,
          voucherCode: result.voucherCode,
          displayDescription: result.productName || note,
        };
      }
    }
  }

  return defaultResult;
};

interface DebtTabProps {
  customerId: number;
  isActive?: boolean;
}

export function DebtTab({ customerId, isActive = true }: DebtTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "12m" | "custom">(
    "6m"
  );

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === "custom") {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      return {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };
    }
    const months = dateRange === "3m" ? 3 : dateRange === "6m" ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: customerStats, isLoading: isLoadingStats } =
    useCustomerStatistics(customerId, isActive);

  const { data: debtHistoryData, isLoading: isLoadingHistory } =
    useCustomerDebtHistory(
      customerId,
      {
        filterType: "payment",
        startDate,
        endDate,
      },
      isActive
    );

  const { data: monthlyDebtData, isLoading: isLoadingMonthly } =
    useCustomerMonthlyDebt(
      customerId,
      {}, // Remove hardcoded current year to show all available monthly data
      isActive
    );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const Amount = ({ value, className = "" }: { value: number | null | undefined, className?: string }) => {
    const val = value ?? 0;
    return (
      <span className={`${val < 0 ? "text-destructive" : ""} ${className}`}>
        {formatCurrency(val)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Handle monthlyDebtData - could be array or single object
  // Note: API might return array when month is not specified, but schema says single object
  // Handle both cases for safety
  const monthlyDebtArray: CustomerMonthlyDebtResponse[] = useMemo(() => {
    const arr = Array.isArray(monthlyDebtData)
      ? monthlyDebtData
      : monthlyDebtData
      ? [monthlyDebtData]
      : [];

    // Sort by year and month descending (newest first)
    return [...arr].sort((a, b) => {
      if (a.year !== b.year) return (b.year ?? 0) - (a.year ?? 0);
      return (b.month ?? 0) - (a.month ?? 0);
    });
  }, [monthlyDebtData]);

  // Use customer statistics for the top summary cards if available
  // otherwise fallback to calculations from monthly debt
  const closingBalance =
    customerStats?.currentDebt ??
    (monthlyDebtArray.length > 0
      ? Number(
          monthlyDebtArray[monthlyDebtArray.length - 1].closingDebt ??
            monthlyDebtArray[monthlyDebtArray.length - 1].closingBalance ??
            0
        )
      : 0);

  const totalIncrease =
    customerStats?.totalOrderAmount ??
    monthlyDebtArray.reduce((sum: number, m: CustomerMonthlyDebtResponse) => {
      const changeInMonth = m.changeInMonth ?? 0;
      return sum + (changeInMonth > 0 ? changeInMonth : 0);
    }, 0);

  const totalDecrease =
    customerStats?.totalPaidAmount ??
    monthlyDebtArray.reduce((sum: number, m: CustomerMonthlyDebtResponse) => {
      const changeInMonth = m.changeInMonth ?? 0;
      return sum + (changeInMonth < 0 ? Math.abs(changeInMonth) : 0);
    }, 0);

  const formatRawNumber = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedHistoryItems = useMemo(() => {
    if (!debtHistoryData?.items) return [];
    return [...debtHistoryData.items].sort(
      (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    );
  }, [debtHistoryData]);

  const openingBalance = useMemo(() => {
    if (sortedHistoryItems.length === 0) return 0;
    return sortedHistoryItems[0].previousDebt ?? 0;
  }, [sortedHistoryItems]);

  const totalThanhTien = useMemo(() => {
    return sortedHistoryItems.reduce(
      (sum, item) => sum + (item.changeAmount && item.changeAmount > 0 ? item.changeAmount : 0),
      0
    );
  }, [sortedHistoryItems]);

  const totalDaThanhToan = useMemo(() => {
    return sortedHistoryItems.reduce(
      (sum, item) => sum + (item.changeAmount && item.changeAmount < 0 ? Math.abs(item.changeAmount) : 0),
      0
    );
  }, [sortedHistoryItems]);

  const computedClosingBalance = useMemo(() => {
    if (sortedHistoryItems.length === 0) return 0;
    return sortedHistoryItems[sortedHistoryItems.length - 1].newDebt ?? 0;
  }, [sortedHistoryItems]);

  const isLoading = isLoadingMonthly || isLoadingHistory || isLoadingStats;

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Lịch sử thanh toán</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => {
                setSelectedYear(parseInt(val));
                setDateRange("custom");
              }}
            >
              <SelectTrigger className="h-7 w-[80px] text-xs">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => {
                setSelectedMonth(parseInt(val));
                setDateRange("custom");
              }}
            >
              <SelectTrigger className="h-7 w-[90px] text-xs">
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
          </div>

          <div className="flex items-center gap-1">
            {(["3m", "6m", "12m"] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setDateRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Số dư cuối kỳ</p>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-semibold">
                <Amount value={closingBalance} />
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-success/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <p className="text-[11px] text-muted-foreground">Tăng</p>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-semibold text-success">
                {formatCurrency(totalIncrease)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 bg-destructive/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <p className="text-[11px] text-muted-foreground">Giảm</p>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(totalDecrease)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Debt History Table */}
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardHeader className="py-3 px-4 flex-shrink-0">
            <CardTitle className="text-sm font-medium">
              Lịch sử công nợ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 [&>div]:max-h-full [&>div]:overflow-y-auto">
              {isLoadingHistory ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-auto max-w-full">
                  <Table className="min-w-[1250px] border-collapse border border-slate-200">
                    <TableHeader className="sticky top-0 bg-slate-100 z-10 border-b">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-center py-2 h-9 w-[50px] bg-slate-100">STT</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-center py-2 h-9 w-[90px] bg-slate-100">NGÀY</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-center py-2 h-9 w-[110px] bg-slate-100">MÃ ĐƠN HÀNG</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-center py-2 h-9 w-[110px] bg-slate-100">MÃ HÀNG</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-left py-2 h-9 min-w-[200px] bg-slate-100">TÊN HÀNG HÓA</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-right py-2 h-9 w-[80px] bg-slate-100">SỐ LƯỢNG</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-right py-2 h-9 w-[95px] bg-slate-100">ĐƠN GIÁ</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-right py-2 h-9 w-[110px] bg-slate-100">THÀNH TIỀN</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-right py-2 h-9 w-[135px] bg-slate-100">SỐ TIỀN ĐÃ THANH TOÁN</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-center py-2 h-9 w-[100px] bg-slate-100">SỐ PHIẾU</TableHead>
                        <TableHead className="text-[11px] font-bold text-slate-700 border text-left py-2 h-9 min-w-[180px] bg-slate-100">GHI CHÚ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* SỐ DƯ ĐẦU KỲ */}
                      {!isLoadingHistory && (
                        <TableRow className="bg-slate-50 font-bold border">
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs text-slate-800">SỐ DƯ ĐẦU KỲ</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs font-mono text-slate-800">
                            {openingBalance === 0 ? "0" : formatRawNumber(openingBalance)}
                          </TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs">—</TableCell>
                        </TableRow>
                      )}

                      {/* SỐ PHÁT SINH */}
                      {!isLoadingHistory && sortedHistoryItems.length > 0 && (
                        <TableRow className="bg-slate-50 font-bold border">
                          <TableCell className="border text-center py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-center py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-center py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-center py-1.5 text-xs">—</TableCell>
                          <TableCell className="border py-1.5 text-xs text-slate-800">SỐ PHÁT SINH</TableCell>
                          <TableCell className="border text-right py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-right py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-right py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-right py-1.5 text-xs">—</TableCell>
                          <TableCell className="border text-center py-1.5 text-xs">—</TableCell>
                          <TableCell className="border py-1.5 text-xs">—</TableCell>
                        </TableRow>
                      )}

                      {/* List items */}
                      {sortedHistoryItems.map((item, idx) => {
                        const parsed = parseNote(item.note);
                        
                        const stt = idx + 1;
                        const dateStr = item.createdAt ? formatDate(item.createdAt) : "-";
                        const productCodeStr = parsed.productCode || "-";
                        const productNameStr = parsed.productName || parsed.displayDescription || "-";
                        
                        const qtyStr = parsed.quantity !== undefined ? formatRawNumber(parsed.quantity) : "-";
                        const priceStr = parsed.unitPrice !== undefined ? formatRawNumber(parsed.unitPrice) : "-";
                        
                        let thanhTienStr = "-";
                        let daThanhToanStr = "-";

                        const changeAmt = item.changeAmount ?? 0;
                        if (changeAmt > 0) {
                          thanhTienStr = formatRawNumber(changeAmt);
                        } else if (changeAmt < 0) {
                          daThanhToanStr = formatRawNumber(Math.abs(changeAmt));
                        }

                        const sophieuStr = item.paymentCode || item.cashReceiptCode || parsed.voucherCode || "-";
                        const ghichuStr = `Trước: ${formatRawNumber(item.previousDebt ?? 0)} → Sau: ${formatRawNumber(item.newDebt ?? 0)}`;

                        return (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50 border">
                            <TableCell className="border text-center py-2 text-xs font-mono">{stt}</TableCell>
                            <TableCell className="border text-center py-2 text-xs">{dateStr}</TableCell>
                            <TableCell className="border text-center py-2 text-xs font-mono">{item.orderCode || "-"}</TableCell>
                            <TableCell className="border text-center py-2 text-xs font-mono">{productCodeStr}</TableCell>
                            <TableCell className="border py-2 text-xs text-slate-800">{productNameStr}</TableCell>
                            <TableCell className="border text-right py-2 text-xs font-mono">{qtyStr}</TableCell>
                            <TableCell className="border text-right py-2 text-xs font-mono">{priceStr}</TableCell>
                            <TableCell className="border text-right py-2 text-xs font-mono">{thanhTienStr}</TableCell>
                            <TableCell className="border text-right py-2 text-xs font-mono">{daThanhToanStr}</TableCell>
                            <TableCell className="border text-center py-2 text-xs font-mono">{sophieuStr}</TableCell>
                            <TableCell className="border py-2 text-xs text-slate-500">{ghichuStr}</TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Empty state */}
                      {!sortedHistoryItems.length && !isLoadingHistory && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <p className="text-sm font-semibold">Chưa có lịch sử công nợ</p>
                              <p className="text-xs">
                                Dữ liệu sẽ hiển thị khi có giao dịch công nợ trong khoảng thời gian đã chọn
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* CỘNG PHÁT SINH */}
                      {!isLoadingHistory && sortedHistoryItems.length > 0 && (
                        <TableRow className="bg-slate-50 font-bold border">
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs text-slate-800">CỘNG PHÁT SINH</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs font-mono text-slate-800">
                            {formatRawNumber(totalThanhTien)}
                          </TableCell>
                          <TableCell className="border text-right py-2 text-xs font-mono text-slate-800">
                            {formatRawNumber(totalDaThanhToan)}
                          </TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs">—</TableCell>
                        </TableRow>
                      )}

                      {/* SỐ DƯ CUỐI KỲ */}
                      {!isLoadingHistory && (
                        <TableRow className="bg-slate-50 font-bold border">
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs text-slate-800">SỐ DƯ CUỐI KỲ</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs">—</TableCell>
                          <TableCell className="border text-right py-2 text-xs font-mono text-slate-800">
                            {computedClosingBalance >= 0 ? formatRawNumber(computedClosingBalance) : "—"}
                          </TableCell>
                          <TableCell className="border text-right py-2 text-xs font-mono text-slate-800">
                            {computedClosingBalance < 0 ? formatRawNumber(Math.abs(computedClosingBalance)) : "—"}
                          </TableCell>
                          <TableCell className="border text-center py-2 text-xs">—</TableCell>
                          <TableCell className="border py-2 text-xs">—</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
