import { useState } from "react";
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
  useCustomerDebtHistory,
  useCustomerMonthlyDebt,
} from "@/hooks/use-customer";

type DebtFilterType = "payment" | "invoice";

interface DebtTabProps {
  customerId: number;
  isActive?: boolean;
}

export function DebtTab({ customerId, isActive = true }: DebtTabProps) {
  const [filterType, setFilterType] = useState<DebtFilterType>("payment");
  const [dateRange, setDateRange] = useState<"3m" | "6m" | "12m" | "custom">(
    "6m"
  );

  const getDateRange = () => {
    const now = new Date();
    const months = dateRange === "3m" ? 3 : dateRange === "6m" ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    };
  };

  const { startDate, endDate } = getDateRange();

  const { data: debtHistoryData, isLoading: isLoadingHistory } =
    useCustomerDebtHistory(
      customerId,
      {
        filterType,
        startDate,
        endDate,
      },
      isActive
    );

  const { data: monthlyDebtData, isLoading: isLoadingMonthly } =
    useCustomerMonthlyDebt(
      customerId,
      {
        year: new Date().getFullYear(),
      },
      isActive
    );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Handle monthlyDebtData - could be array or single object
  // Note: API might return array when month is not specified, but schema says single object
  // Handle both cases for safety
  const monthlyDebtArray: any[] = Array.isArray(monthlyDebtData)
    ? monthlyDebtData
    : monthlyDebtData
    ? [monthlyDebtData]
    : [];

  // Calculate summary stats from monthlyDebtArray
  const totalIncrease = monthlyDebtArray.reduce((sum: number, m: any) => {
    const changeInMonth = m.changeInMonth ?? 0;
    return sum + (changeInMonth > 0 ? changeInMonth : 0);
  }, 0);
  const totalDecrease = monthlyDebtArray.reduce((sum: number, m: any) => {
    const changeInMonth = m.changeInMonth ?? 0;
    return sum + (changeInMonth < 0 ? Math.abs(changeInMonth) : 0);
  }, 0);
  const lastItem = monthlyDebtArray[monthlyDebtArray.length - 1];
  const closingBalance = lastItem
    ? lastItem.closingDebt ?? lastItem.closingBalance ?? 0
    : 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <Button
              variant={filterType === "payment" ? "default" : "ghost"}
              size="sm"
              className={`h-7 text-xs ${
                filterType === "payment"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "hover:bg-muted-foreground/10"
              }`}
              onClick={() => setFilterType("payment")}
            >
              Thanh toán
            </Button>
            <Button
              variant={filterType === "invoice" ? "default" : "ghost"}
              size="sm"
              className={`h-7 text-xs ${
                filterType === "invoice"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "hover:bg-muted-foreground/10"
              }`}
              onClick={() => setFilterType("invoice")}
            >
              Hóa đơn
            </Button>
          </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-muted/50">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Số dư cuối kỳ</p>
            <p className="text-lg font-semibold">
              {formatCurrency(closingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-success/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <p className="text-[11px] text-muted-foreground">Tăng</p>
            </div>
            <p className="text-lg font-semibold text-success">
              {formatCurrency(totalIncrease)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-destructive/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <p className="text-[11px] text-muted-foreground">Giảm</p>
            </div>
            <p className="text-lg font-semibold text-destructive">
              {formatCurrency(totalDecrease)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Debt Table */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">
              Công nợ theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[280px] overflow-auto">
              {isLoadingMonthly ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs h-8">Tháng</TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Đầu kỳ
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Tăng
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Giảm
                      </TableHead>
                      <TableHead className="text-xs h-8 text-right">
                        Cuối kỳ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyDebtArray.map((item: any) => {
                      const changeInMonth = item.changeInMonth ?? 0;
                      const increase = changeInMonth > 0 ? changeInMonth : 0;
                      const decrease =
                        changeInMonth < 0 ? Math.abs(changeInMonth) : 0;
                      return (
                        <TableRow key={item.month || item.id}>
                          <TableCell className="text-xs py-2">
                            {item.month ? `Tháng ${item.month}` : "-"}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right">
                            {formatCurrency(
                              item.openingDebt ?? item.openingBalance ?? 0
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right text-success">
                            +{formatCurrency(increase)}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right text-destructive">
                            -{formatCurrency(decrease)}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-right font-medium">
                            {formatCurrency(
                              item.closingDebt ?? item.closingBalance ?? 0
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!monthlyDebtArray.length && !isLoadingMonthly && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <p className="text-sm">
                              Chưa có dữ liệu công nợ theo tháng
                            </p>
                            <p className="text-xs">
                              Dữ liệu sẽ hiển thị khi có giao dịch trong năm
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

        {/* Debt History Table */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">
              Lịch sử công nợ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[280px] overflow-auto">
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
                          {formatCurrency(item.newDebt ?? 0)}
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
