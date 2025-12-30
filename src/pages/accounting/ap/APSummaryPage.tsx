import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
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
import { useAPSummary } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function APSummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: apData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAPSummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
  });

  const totalDebt = apData?.items?.reduce((sum, item) => sum + (item.totalDebt || 0), 0) || 0;
  const totalCurrentDebt = apData?.items?.reduce((sum, item) => sum + (item.currentDebt || 0), 0) || 0;
  const totalOverdueDebt = apData?.items?.reduce((sum, item) => sum + (item.overdueDebt || 0), 0) || 0;

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const handleVendorClick = (vendorId: number | null | undefined) => {
    if (vendorId) {
      navigate(`/accounting/ap?tab=detail&vendorId=${vendorId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
        <Button variant="outline" onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-2" />
          Xuất Excel
        </Button>
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
              placeholder="Tìm kiếm theo mã, tên nhà cung cấp..."
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
                Tổng công nợ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalDebt)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Công nợ hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCurrentDebt)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Công nợ quá hạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalOverdueDebt)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã NCC</TableHead>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead className="text-right">Tổng công nợ</TableHead>
                <TableHead className="text-right">Công nợ hiện tại</TableHead>
                <TableHead className="text-right">Công nợ quá hạn</TableHead>
                <TableHead className="text-center">Thanh toán gần nhất</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="w-[60px]"></TableHead>
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
              ) : !apData?.items || apData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu công nợ nào.
                  </TableCell>
                </TableRow>
              ) : (
                apData.items.map((item) => (
                  <TableRow
                    key={item.vendorId}
                    className="group cursor-pointer hover:bg-muted/50"
                    onClick={() => handleVendorClick(item.vendorId)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {item.vendorCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.vendorName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.totalDebt !== undefined
                        ? formatCurrency(item.totalDebt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.currentDebt !== undefined
                        ? formatCurrency(item.currentDebt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-destructive">
                      {item.overdueDebt !== undefined && item.overdueDebt > 0 ? (
                        <Badge variant="destructive">
                          {formatCurrency(item.overdueDebt)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {item.lastPaymentDate
                        ? formatDate(item.lastPaymentDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {item.lastPaymentAmount !== undefined
                        ? formatCurrency(item.lastPaymentAmount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVendorClick(item.vendorId);
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
        {apData && apData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {apData.totalPages} (
              {apData.total} nhà cung cấp)
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
                {currentPage} / {apData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(apData.totalPages, p + 1))
                }
                disabled={currentPage === apData.totalPages || isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}

