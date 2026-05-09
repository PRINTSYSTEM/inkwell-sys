import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";

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
    asOfDate: asOfDate ? new Date(asOfDate).toISOString() : undefined,
    search: searchQuery || undefined,
  });

  const totalCurrent = arData?.items?.reduce((sum, item) => sum + (item.notDue || 0), 0) || 0;
  const totalDays30 = arData?.items?.reduce((sum, item) => sum + (item.days0_30 || 0), 0) || 0;
  const totalDays60 = arData?.items?.reduce((sum, item) => sum + (item.days31_60 || 0), 0) || 0;
  const totalDays90 = arData?.items?.reduce((sum, item) => sum + (item.days61_90 || 0), 0) || 0;
  const totalOver90 = arData?.items?.reduce((sum, item) => sum + (item.daysOver90 || 0), 0) || 0;
  const grandTotal = arData?.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleCustomerClick = (customerId: number | null | undefined) => {
    if (customerId) {
      navigate(`/accounting/ar?tab=detail&customerId=${customerId}`);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
              placeholder="Tìm kiếm theo mã, tên khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="asOfDate" className="whitespace-nowrap text-sm">
              Tính đến ngày:
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-[180px] h-9 text-sm"
            />
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                0-30 ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalCurrent)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                31-60 ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalDays30)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                61-90 ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totalDays60)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                91-120 ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(totalDays90)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Trên 120 ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-destructive">
                {formatCurrency(totalOver90)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Tổng cộng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(grandTotal)}
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
                <TableHead className="w-[140px] font-semibold">Mã KH</TableHead>
                <TableHead className="font-semibold">Tên khách hàng</TableHead>
                <TableHead className="text-right font-semibold">0-30 ngày</TableHead>
                <TableHead className="text-right font-semibold">31-60 ngày</TableHead>
                <TableHead className="text-right font-semibold">61-90 ngày</TableHead>
                <TableHead className="text-right font-semibold">91-120 ngày</TableHead>
                <TableHead className="text-right font-semibold">Trên 120 ngày</TableHead>
                <TableHead className="text-right font-semibold">Tổng cộng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
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
                  <TableRow
                    key={item.customerId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleCustomerClick(item.customerId)}
                  >
                    <TableCell className="font-semibold font-mono text-sm">
                      {item.customerCode || "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.customerName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {item.notDue !== undefined && item.notDue > 0
                        ? formatCurrency(item.notDue)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {item.days0_30 !== undefined && item.days0_30 > 0
                        ? formatCurrency(item.days0_30)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm text-orange-600">
                      {item.days31_60 !== undefined && item.days31_60 > 0
                        ? formatCurrency(item.days31_60)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm text-red-600">
                      {item.days61_90 !== undefined && item.days61_90 > 0
                        ? formatCurrency(item.days61_90)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm text-destructive">
                      {item.daysOver90 !== undefined && item.daysOver90 > 0
                        ? formatCurrency(item.daysOver90)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
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

        {/* Pagination - Compact */}
        {arData && arData.totalPages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage} / {arData.totalPages} ({arData.total} khách
              hàng)
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

