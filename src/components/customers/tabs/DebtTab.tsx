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

  const isLoading = isLoadingMonthly || isLoadingHistory || isLoadingStats;

  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-1 gap-4">
        {/* Debt History Table */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">
              Lịch sử công nợ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              {isLoadingHistory ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Ngày</TableHead>
                      <TableHead className="text-xs h-8">Mã</TableHead>
                      <TableHead className="text-xs h-8">Loại</TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Thay đổi
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Số dư
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtHistoryData?.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs py-2">
                          {item.createdAt ? formatDate(item.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="text-xs py-2 font-mono">
                          {item.orderCode || "-"}
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {item.changeType === "payment" ? "TT" : "HĐ"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-xs py-2 text-right ${
                            (item.changeAmount ?? 0) > 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {(item.changeAmount ?? 0) > 0 ? "+" : ""}
                          {formatCurrency(item.changeAmount ?? 0)}
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right font-medium">
                          <Amount value={item.newDebt ?? 0} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!debtHistoryData?.items?.length && !isLoadingHistory && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <p className="text-sm">Chưa có lịch sử công nợ</p>
                            <p className="text-xs">
                              Dữ liệu sẽ hiển thị khi có giao dịch công nợ
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
