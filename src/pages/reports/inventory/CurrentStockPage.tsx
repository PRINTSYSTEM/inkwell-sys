import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
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
import { useCurrentStock } from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";

export default function CurrentStockPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: stockData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCurrentStock({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
  });

  const totalItems = stockData?.items?.length || 0;
  const totalQuantity = stockData?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const totalValue = stockData?.items?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;

  return (
    <>
      <Helmet>
        <title>Tồn kho hiện tại | Print Production ERP</title>
        <meta
          name="description"
          content="Xem tồn kho hiện tại của các vật tư"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tồn kho hiện tại
            </h1>
            <p className="text-muted-foreground">
              Xem tồn kho hiện tại của các vật tư trong kho
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng số mặt hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng số lượng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng giá trị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã, tên vật tư..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã vật tư</TableHead>
                <TableHead>Tên vật tư</TableHead>
                <TableHead>Loại thiết kế</TableHead>
                <TableHead className="text-right">Số lượng tồn</TableHead>
                <TableHead className="text-right">Đã đặt</TableHead>
                <TableHead className="text-right">Có sẵn</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
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
              ) : !stockData?.items || stockData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu tồn kho nào.
                  </TableCell>
                </TableRow>
              ) : (
                stockData.items.map((item) => (
                  <TableRow key={item.materialTypeCode || item.materialTypeId}>
                    <TableCell className="font-medium font-mono text-sm">
                      {item.materialTypeCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.materialTypeName || "—"}
                    </TableCell>
                    <TableCell>
                      {item.designTypeName || item.designTypeCode || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.currentQuantity !== undefined
                        ? item.currentQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.reservedQuantity !== undefined
                        ? item.reservedQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-600">
                      {item.availableQuantity !== undefined
                        ? item.availableQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.unitPrice !== undefined
                        ? formatCurrency(item.unitPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {item.totalValue !== undefined
                        ? formatCurrency(item.totalValue)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {stockData && stockData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {stockData.totalPages} (
              {stockData.total} mặt hàng)
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
                {currentPage} / {stockData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(stockData.totalPages, p + 1))
                }
                disabled={currentPage === stockData.totalPages || isLoading}
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

