import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCashPayments } from "@/hooks/use-cash";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import type { CashPaymentResponse } from "@/Schema/accounting.schema";

export default function ExpenseByCategoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    data: paymentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashPayments({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
    status: "posted",
  });

  // Group payments by expense category
  const groupedByCategory = paymentsData?.items?.reduce((acc, payment) => {
    const categoryId = payment.expenseCategoryId || "unknown";
    const categoryName = payment.expenseCategoryName || "Không phân loại";
    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId: String(categoryId),
        categoryName,
        count: 0,
        totalAmount: 0,
        payments: [],
      };
    }
    acc[categoryId].count += 1;
    acc[categoryId].totalAmount += payment.amount || 0;
    acc[categoryId].payments.push(payment);
    return acc;
  }, {} as Record<string | number, { categoryId: string; categoryName: string; count: number; totalAmount: number; payments: CashPaymentResponse[] }>) || {};

  const groupedData = Object.values(groupedByCategory).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  const totalExpense = groupedData.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId !== "unknown") {
      navigate(
        `/accounting/cash-payments?expenseCategoryId=${categoryId}&fromDate=${dateRange?.from?.toISOString()}&toDate=${dateRange?.to?.toISOString()}`
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Chi phí theo khoản mục | Print Production ERP</title>
        <meta
          name="description"
          content="Báo cáo chi phí theo khoản mục"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Chi phí theo khoản mục
            </h1>
            <p className="text-muted-foreground">
              Tổng hợp chi phí theo từng khoản mục chi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng chi phí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo khoản mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Khoản mục chi</TableHead>
                <TableHead className="text-right">Số phiếu</TableHead>
                <TableHead className="text-right">Tổng chi phí</TableHead>
                <TableHead className="text-right">Tỷ lệ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groupedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu chi phí nào.
                  </TableCell>
                </TableRow>
              ) : (
                groupedData.map((item) => (
                  <TableRow
                    key={item.categoryId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCategoryClick(item.categoryId)}
                  >
                    <TableCell className="font-medium">
                      {item.categoryName}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.count}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-red-600">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {totalExpense > 0
                        ? `${((item.totalAmount / totalExpense) * 100).toFixed(2)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

