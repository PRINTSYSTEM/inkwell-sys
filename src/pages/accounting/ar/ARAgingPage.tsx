import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
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
import { Label } from "@/components/ui/label";
import { useARAging } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";

export default function ARAgingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARAging({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    asOfDate: asOfDate ? `${asOfDate}T00:00:00+07:00` : undefined,
    search: searchQuery || undefined,
  });

  const totalCurrent = arData?.items?.reduce((sum, item) => sum + (item.current || 0), 0) || 0;
  const totalDays30 = arData?.items?.reduce((sum, item) => sum + (item.days30 || 0), 0) || 0;
  const totalDays60 = arData?.items?.reduce((sum, item) => sum + (item.days60 || 0), 0) || 0;
  const totalDays90 = arData?.items?.reduce((sum, item) => sum + (item.days90 || 0), 0) || 0;
  const totalOver90 = arData?.items?.reduce((sum, item) => sum + (item.over90 || 0), 0) || 0;
  const grandTotal = arData?.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  return (
    <>
      <Helmet>
        <title>Công nợ phải thu - Phân tích tuổi nợ | Print Production ERP</title>
        <meta
          name="description"
          content="Phân tích tuổi nợ phải thu"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Công nợ phải thu - Phân tích tuổi nợ
            </h1>
            <p className="text-muted-foreground">
              Phân tích công nợ phải thu theo tuổi nợ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline">
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
          <div className="flex items-center gap-2">
            <Label htmlFor="asOfDate" className="whitespace-nowrap">
              Tính đến ngày:
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                0-30 ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCurrency(totalCurrent)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                31-60 ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCurrency(totalDays30)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                61-90 ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(totalDays60)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                91-120 ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(totalDays90)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Trên 120 ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">
                {formatCurrency(totalOver90)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Tổng cộng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {formatCurrency(grandTotal)}
              </div>
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
                <TableHead className="text-right">0-30 ngày</TableHead>
                <TableHead className="text-right">31-60 ngày</TableHead>
                <TableHead className="text-right">61-90 ngày</TableHead>
                <TableHead className="text-right">91-120 ngày</TableHead>
                <TableHead className="text-right">Trên 120 ngày</TableHead>
                <TableHead className="text-right">Tổng cộng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !arData?.items || arData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu công nợ nào.
                  </TableCell>
                </TableRow>
              ) : (
                arData.items.map((item) => (
                  <TableRow key={item.customerId}>
                    <TableCell className="font-mono text-sm">
                      {item.customerCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.customerName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.current !== undefined && item.current > 0
                        ? formatCurrency(item.current)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.days30 !== undefined && item.days30 > 0
                        ? formatCurrency(item.days30)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-orange-600">
                      {item.days60 !== undefined && item.days60 > 0
                        ? formatCurrency(item.days60)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      {item.days90 !== undefined && item.days90 > 0
                        ? formatCurrency(item.days90)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-destructive">
                      {item.over90 !== undefined && item.over90 > 0
                        ? formatCurrency(item.over90)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {item.total !== undefined
                        ? formatCurrency(item.total)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {arData && arData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {arData.totalPages} (
              {arData.total} khách hàng)
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
                {currentPage} / {arData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(arData.totalPages, p + 1))
                }
                disabled={currentPage === arData.totalPages || isLoading}
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

