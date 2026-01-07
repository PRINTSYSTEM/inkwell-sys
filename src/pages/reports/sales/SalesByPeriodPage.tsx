import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
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
import { useSalesByPeriod } from "@/hooks/use-sales-report";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SalesByPeriodPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: salesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSalesByPeriod({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
  });

  const totalRevenue = salesData?.items?.reduce((sum, item) => sum + (item.grossRevenue || 0), 0) || 0;
  const totalNetRevenue = salesData?.items?.reduce((sum, item) => sum + (item.netRevenue || 0), 0) || 0;
  const totalDiscount = salesData?.items?.reduce((sum, item) => sum + (item.discount || 0), 0) || 0;

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handlePeriodClick = (period: string | null | undefined) => {
    if (period) {
      // Navigate to order drill-down page with period filter
      navigate(`/reports/sales/orders-by-period?period=${encodeURIComponent(period)}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Doanh số theo kỳ | Print Production ERP</title>
        <meta
          name="description"
          content="Báo cáo doanh số theo kỳ thời gian"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Doanh số theo kỳ
            </h1>
            <p className="text-muted-foreground">
              Báo cáo doanh số theo kỳ thời gian
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng giảm giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalDiscount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doanh thu ròng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalNetRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Kỳ</TableHead>
                <TableHead className="text-right">Số đơn hàng</TableHead>
                <TableHead className="text-right">Doanh thu gộp</TableHead>
                <TableHead className="text-right">Giảm giá</TableHead>
                <TableHead className="text-right">Trả hàng</TableHead>
                <TableHead className="text-right">Doanh thu ròng</TableHead>
                <TableHead className="text-right">Số khách hàng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !salesData?.items || salesData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu doanh số nào.
                  </TableCell>
                </TableRow>
              ) : (
                salesData.items.map((item) => {
                  return (
                    <TableRow
                      key={item.period}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlePeriodClick(item.period)}
                    >
                      <TableCell className="font-medium">
                        {item.period || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.orderCount !== undefined
                          ? item.orderCount.toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.grossRevenue !== undefined
                          ? formatCurrency(item.grossRevenue)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.discount !== undefined
                          ? formatCurrency(item.discount)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.returns !== undefined
                          ? formatCurrency(item.returns)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-green-600">
                        {item.netRevenue !== undefined
                          ? formatCurrency(item.netRevenue)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.customerCount !== undefined
                          ? item.customerCount.toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {salesData && salesData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {salesData.totalPages} (
              {salesData.total} kỳ)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <RefreshCw className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {salesData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(salesData.totalPages, p + 1))
                }
                disabled={currentPage === salesData.totalPages || isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

