import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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

export default function ExpenseByTimePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Get more items for grouping

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
    status: "posted", // Only posted payments
  });

  // Group payments by date
  const groupedByDate = paymentsData?.items?.reduce((acc, payment) => {
    if (!payment.postingDate) return acc;
    const date = format(new Date(payment.postingDate), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = {
        date,
        count: 0,
        totalAmount: 0,
        payments: [],
      };
    }
    acc[date].count += 1;
    acc[date].totalAmount += payment.amount || 0;
    acc[date].payments.push(payment);
    return acc;
  }, {} as Record<string, { date: string; count: number; totalAmount: number; payments: CashPaymentResponse[] }>) || {};

  const groupedData = Object.values(groupedByDate).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalExpense = groupedData.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );
  const totalCount = groupedData.reduce((sum, item) => sum + item.count, 0);

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleDateClick = (date: string) => {
    // Navigate to expense detail filtered by date
    navigate(`/reports/expense/by-category?fromDate=${date}&toDate=${date}`);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  return (
    <>
      <Helmet>
        <title>Chi phí theo thời gian | Print Production ERP</title>
        <meta
          name="description"
          content="Báo cáo chi phí theo thời gian"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Chi phí theo thời gian
            </h1>
            <p className="text-muted-foreground">
              Tổng hợp chi phí theo ngày/tuần/tháng
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng chi phí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số phiếu chi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
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
                <TableHead className="w-[140px]">Ngày</TableHead>
                <TableHead className="text-right">Số phiếu</TableHead>
                <TableHead className="text-right">Tổng chi phí</TableHead>
                <TableHead className="text-right">Chi phí trung bình</TableHead>
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
                    key={item.date}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleDateClick(item.date)}
                  >
                    <TableCell className="font-medium">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.count}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-red-600">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.count > 0
                        ? formatCurrency(item.totalAmount / item.count)
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

