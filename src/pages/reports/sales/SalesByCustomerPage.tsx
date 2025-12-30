import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
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
import { useSalesByCustomer } from "@/hooks/use-sales-report";
import { formatCurrency } from "@/lib/status-utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SalesByCustomerPage() {
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
  } = useSalesByCustomer({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
  });

  const totalRevenue = salesData?.items?.reduce((sum, item) => sum + (item.totalRevenue || 0), 0) || 0;
  const totalOrders = salesData?.items?.reduce((sum, item) => sum + (item.orderCount || 0), 0) || 0;

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleCustomerClick = (customerId: number | null | undefined) => {
    if (customerId) {
      // Navigate to order drill-down page with customer filter
      navigate(`/reports/sales/orders-by-customer?customerId=${customerId}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Doanh số theo khách hàng | Print Production ERP</title>
        <meta
          name="description"
          content="Báo cáo doanh số theo khách hàng"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Doanh số theo khách hàng
            </h1>
            <p className="text-muted-foreground">
              Báo cáo doanh số theo từng khách hàng
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
              placeholder="Tìm kiếm theo mã, tên khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Tổng số đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã KH</TableHead>
                <TableHead>Tên khách hàng</TableHead>
                <TableHead className="text-right">Số đơn hàng</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Giá trị trung bình</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !salesData?.items || salesData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu doanh số nào.
                  </TableCell>
                </TableRow>
              ) : (
                salesData.items.map((item) => (
                  <TableRow
                    key={item.customerId}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCustomerClick(item.customerId)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {item.customerCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.customerName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.orderCount !== undefined
                        ? item.orderCount.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {item.totalRevenue !== undefined
                        ? formatCurrency(item.totalRevenue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.totalRevenue !== undefined && item.orderCount !== undefined && item.orderCount > 0
                        ? formatCurrency(item.totalRevenue / item.orderCount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomerClick(item.customerId);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {salesData && salesData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {salesData.totalPages} (
              {salesData.total} khách hàng)
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

