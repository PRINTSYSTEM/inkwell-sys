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
import { useLowStock } from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";

export default function LowStockPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: lowStockData,
    isLoading,
    isError,
    error,
    refetch,
  } = useLowStock({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
  });

  return (
    <>
      <Helmet>
        <title>Hàng tồn kho thấp | Print Production ERP</title>
        <meta
          name="description"
          content="Danh sách hàng tồn kho thấp cần nhập thêm"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hàng tồn kho thấp
            </h1>
            <p className="text-muted-foreground">
              Danh sách hàng tồn kho thấp cần nhập thêm
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
                <TableHead className="text-right">Số lượng tối thiểu</TableHead>
                <TableHead className="text-right">Thiếu</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
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
              ) : !lowStockData?.items || lowStockData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có hàng tồn kho thấp nào.
                  </TableCell>
                </TableRow>
              ) : (
                lowStockData.items.map((item) => {
                  const shortage = (item.minimumQuantity || 0) - (item.currentQuantity || 0);
                  return (
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
                        {item.minimumQuantity !== undefined
                          ? item.minimumQuantity.toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-destructive">
                        {shortage > 0 ? shortage.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.unitPrice !== undefined
                          ? formatCurrency(item.unitPrice)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {shortage > 0 ? (
                          <Badge variant="destructive">Cần nhập</Badge>
                        ) : (
                          <Badge variant="default">Đủ</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {lowStockData && lowStockData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {lowStockData.totalPages} (
              {lowStockData.total} mặt hàng)
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
                {currentPage} / {lowStockData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(lowStockData.totalPages, p + 1))
                }
                disabled={currentPage === lowStockData.totalPages || isLoading}
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

