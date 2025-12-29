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
import { Badge } from "@/components/ui/badge";
import { useSlowMoving } from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";

export default function SlowMovingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: slowMovingData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSlowMoving({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
  });

  return (
    <>
      <Helmet>
        <title>Hàng chậm luân chuyển | Print Production ERP</title>
        <meta
          name="description"
          content="Danh sách hàng chậm luân chuyển"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hàng chậm luân chuyển
            </h1>
            <p className="text-muted-foreground">
              Danh sách hàng chậm luân chuyển trong kho
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
                <TableHead className="text-right">Số lượng tồn</TableHead>
                <TableHead className="text-right">Số ngày không bán</TableHead>
                <TableHead className="text-right">Giá trị tồn</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
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
              ) : !slowMovingData?.items || slowMovingData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có hàng chậm luân chuyển nào.
                  </TableCell>
                </TableRow>
              ) : (
                slowMovingData.items.map((item) => (
                  <TableRow key={item.materialTypeCode || item.materialTypeId}>
                    <TableCell className="font-medium font-mono text-sm">
                      {item.materialTypeCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.materialTypeName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.currentQuantity !== undefined
                        ? item.currentQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.daysSinceLastOut !== undefined
                        ? `${item.daysSinceLastOut} ngày`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.stockValue !== undefined
                        ? formatCurrency(item.stockValue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.daysSinceLastOut !== undefined && item.daysSinceLastOut > 90 ? (
                        <Badge variant="destructive">Rất chậm</Badge>
                      ) : item.daysSinceLastOut !== undefined && item.daysSinceLastOut > 60 ? (
                        <Badge variant="default">Chậm</Badge>
                      ) : (
                        <Badge variant="secondary">Bình thường</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {slowMovingData && slowMovingData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {slowMovingData.totalPages} (
              {slowMovingData.total} mặt hàng)
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
                {currentPage} / {slowMovingData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(slowMovingData.totalPages, p + 1))
                }
                disabled={currentPage === slowMovingData.totalPages || isLoading}
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

