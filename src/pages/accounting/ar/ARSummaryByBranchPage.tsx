import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
import { useARSummaryByBranch } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

export default function ARSummaryByBranchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARSummaryByBranch({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
  });

  const totalOpening = arData?.items?.reduce((sum, item) => sum + (item.openingBalance || 0), 0) || 0;
  const totalIncrease = arData?.items?.reduce((sum, item) => sum + (item.increase || 0), 0) || 0;
  const totalDecrease = arData?.items?.reduce((sum, item) => sum + (item.decrease || 0), 0) || 0;
  const totalClosing = arData?.items?.reduce((sum, item) => sum + (item.closingBalance || 0), 0) || 0;

  const handleExportExcel = async () => {
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  return (
    <div className="h-auto flex flex-col overflow-hidden">
      {/* Error Alert */}
      {isError && (
        <div className="flex-shrink-0 px-6 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Filters - Compact */}
      <div className="flex-shrink-0 px-6 py-2 space-y-2 border-b bg-background">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên chi nhánh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex-shrink-0">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleExportExcel}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      <div className="flex-shrink-0 px-6 py-2 border-b bg-background">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Số dư đầu kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalOpening)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Tăng trong kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalIncrease)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Giảm trong kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(totalDecrease)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Số dư cuối kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalClosing)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table - Expanded to fill space */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto border-t">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="font-semibold">Tên chi nhánh</TableHead>
                <TableHead className="text-right font-semibold">Số dư đầu kỳ</TableHead>
                <TableHead className="text-right font-semibold">Tăng trong kỳ</TableHead>
                <TableHead className="text-right font-semibold">Giảm trong kỳ</TableHead>
                <TableHead className="text-right font-semibold">Số dư cuối kỳ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !arData?.items || arData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu công nợ theo chi nhánh nào.
                  </TableCell>
                </TableRow>
              ) : (
                arData.items.map((item, index) => (
                  <TableRow key={item.branchId || index}>
                    <TableCell className="font-semibold text-sm">
                      {item.branchName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {item.openingBalance !== undefined
                        ? formatCurrency(item.openingBalance)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm text-green-600">
                      {item.increase !== undefined
                        ? formatCurrency(item.increase)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm text-blue-600">
                      {item.decrease !== undefined
                        ? formatCurrency(item.decrease)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {item.closingBalance !== undefined
                        ? formatCurrency(item.closingBalance)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Compact */}
        {arData && arData.totalPages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage} / {arData.totalPages} ({arData.total} chi nhánh)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2">
                {currentPage} / {arData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(arData.totalPages, p + 1))
                }
                disabled={currentPage === arData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
