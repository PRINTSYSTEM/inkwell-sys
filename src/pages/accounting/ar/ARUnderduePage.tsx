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
  Calendar,
} from "lucide-react";
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
import { useARUnderdue } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function ARUnderduePage() {
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
  } = useARUnderdue({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: asOfDate ? new Date(asOfDate).toISOString() : undefined,
    toDate: asOfDate ? new Date(asOfDate).toISOString() : undefined,
    searchTerm: searchQuery || "",
  });

  const totalDebt = arData?.items?.reduce((sum, item) => sum + (item.outstandingAmount || 0), 0) || 0;
  const totalCustomers = arData?.total || 0;

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
              placeholder="Tìm kiếm theo mã, tên khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="asOfDate" className="text-sm whitespace-nowrap">
              Tính đến ngày:
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="h-9 w-[160px]"
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
        <div className="grid grid-cols-2 gap-3">
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Tổng công nợ trước hạn
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalDebt)}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Số khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {totalCustomers}
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
                <TableHead className="w-[140px] font-semibold">Số hóa đơn</TableHead>
                <TableHead className="font-semibold">Tên khách hàng</TableHead>
                <TableHead className="text-center font-semibold">Ngày đến hạn</TableHead>
                <TableHead className="text-right font-semibold">Số tiền</TableHead>
                <TableHead className="text-center font-semibold">Số ngày còn lại</TableHead>
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
                    Không tìm thấy công nợ trước hạn nào.
                  </TableCell>
                </TableRow>
              ) : (
                arData.items.map((item, index) => {
                  const daysRemaining = item.daysUntilDue !== undefined ? item.daysUntilDue : null;
                  return (
                    <TableRow key={item.invoiceId || index}>
                      <TableCell className="font-semibold font-mono text-sm">
                        {item.invoiceNumber || "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {item.customerName || "—"}
                      </TableCell>
                      <TableCell className="text-center font-semibold tabular-nums text-sm">
                        {item.dueDate ? formatDate(item.dueDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-sm">
                        {item.outstandingAmount !== undefined ? formatCurrency(item.outstandingAmount) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {daysRemaining !== null ? (
                          <Badge variant="outline" className="font-medium">
                            {daysRemaining > 0 ? `${daysRemaining} ngày` : "Đã đến hạn"}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Compact */}
        {arData && arData.totalPages > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t bg-background">
            <p className="text-xs text-muted-foreground">
              Trang {currentPage} / {arData.totalPages} ({arData.total} khách hàng)
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
