import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAPSummary, useAPDetail, useExportAPSummary, useExportAPDetailLedger } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function APUnifiedPage() {
  const navigate = useNavigate();
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [summaryPage, setSummaryPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch summary data (list of vendors)
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: errorSummary,
    refetch: refetchSummary,
  } = useAPSummary({
    pageNumber: summaryPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
  });

  // Fetch detail data (transactions for selected vendor)
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: errorDetail,
    refetch: refetchDetail,
  } = useAPDetail({
    pageNumber: detailPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from
      ? dateRange.from.toISOString()
      : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    vendorId: selectedVendorId || undefined,
    search: searchQuery || undefined,
  });

  const totalDebt =
    summaryData?.items?.reduce(
      (sum, item) => sum + (item.closingBalance || 0),
      0
    ) || 0;
  const totalCurrentDebt =
    summaryData?.items?.reduce(
      (sum, item) =>
        sum + ((item.closingBalance || 0) - (item.overdue || 0)),
      0
    ) || 0;
  const totalOverdueDebt =
    summaryData?.items?.reduce((sum, item) => sum + (item.overdue || 0), 0) ||
    0;

  const { mutate: exportSummary, loading: isExportingSummary } = useExportAPSummary();
  const { mutate: exportDetail, loading: isExportingDetail } = useExportAPDetailLedger();

  const handleExportExcel = async () => {
    if (selectedVendorId) {
      await exportDetail(selectedVendorId, {
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });
    } else {
      await exportSummary({
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
        search: searchQuery || undefined,
      });
    }
  };

  const handleVendorClick = (vendorId: number | null | undefined, vendorName?: string) => {
    if (vendorId) {
      setSelectedVendorId(vendorId);
      setSelectedVendorName(vendorName || "");
      setDetailPage(1); // Reset detail page when selecting new vendor
    }
  };

  const handleClearSelection = () => {
    setSelectedVendorId(null);
    setSelectedVendorName("");
    setDetailPage(1);
  };

  const handleOrderClick = (orderId: number | null | undefined) => {
    if (orderId) {
      navigate(`/accounting/orders/${orderId}`);
    }
  };

  const handleRefetch = () => {
    refetchSummary();
    if (selectedVendorId) {
      refetchDetail();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleRefetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExportExcel}
          disabled={isExportingSummary || isExportingDetail}
        >
          {isExportingSummary || isExportingDetail ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Xuất Excel
        </Button>
      </div>

      {/* Error Alerts */}
      {isErrorSummary && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {errorSummary instanceof Error
              ? errorSummary.message
              : "Không thể tải dữ liệu tổng hợp. Vui lòng thử lại."}
          </AlertDescription>
        </Alert>
      )}
      {isErrorDetail && selectedVendorId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {errorDetail instanceof Error
              ? errorDetail.message
              : "Không thể tải dữ liệu chi tiết. Vui lòng thử lại."}
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSummaryPage(1);
              setDetailPage(1);
            }}
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

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        {/* Left Column: Vendor Summary List */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Danh sách nhà cung cấp</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-lg border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Mã NCC</TableHead>
                    <TableHead>Tên nhà cung cấp</TableHead>
                    <TableHead className="text-right">Công nợ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSummary ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !summaryData?.items || summaryData.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Không tìm thấy nhà cung cấp nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryData.items.map((item) => (
                      <TableRow
                        key={item.vendorId}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedVendorId === item.vendorId &&
                            "bg-primary/10 hover:bg-primary/20"
                        )}
                        onClick={() =>
                          handleVendorClick(item.vendorId, item.vendorName || undefined)
                        }
                      >
                        <TableCell className="font-medium font-mono text-sm">
                          {item.vendorCode || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.vendorName || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
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

            {/* Summary Pagination */}
            {summaryData && summaryData.totalPages > 1 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {summaryPage} / {summaryData.totalPages} (
                    {summaryData.total} nhà cung cấp)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSummaryPage((p) => Math.max(1, p - 1))
                      }
                      disabled={summaryPage === 1 || isLoadingSummary}
                    >
                      <RefreshCw className="h-4 w-4 rotate-180" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {summaryPage} / {summaryData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSummaryPage((p) =>
                          Math.min(summaryData.totalPages, p + 1)
                        )
                      }
                      disabled={
                        summaryPage === summaryData.totalPages ||
                        isLoadingSummary
                      }
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Transaction Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedVendorId
                  ? `Chi tiết công nợ${selectedVendorName ? ` - ${selectedVendorName}` : ""}`
                  : "Chi tiết giao dịch"}
              </CardTitle>
              {selectedVendorId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedVendorId && (
              <p className="text-sm text-muted-foreground mt-1">
                Chọn một nhà cung cấp ở cột trái để xem chi tiết
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!selectedVendorId ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <Eye className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">
                  Chọn nhà cung cấp để xem chi tiết
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click vào một nhà cung cấp ở danh sách bên trái để xem các
                  giao dịch chi tiết
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border-t">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px]">Mã đơn</TableHead>
                        <TableHead className="w-[120px]">Mã HĐ</TableHead>
                        <TableHead className="text-center">Ngày HĐ</TableHead>
                        <TableHead className="text-center">
                          Hạn thanh toán
                        </TableHead>
                        <TableHead className="text-right">Số tiền HĐ</TableHead>
                        <TableHead className="text-right">
                          Đã thanh toán
                        </TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingDetail ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : !detailData?.items || detailData.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Không tìm thấy giao dịch nào cho nhà cung cấp này.
                          </TableCell>
                        </TableRow>
                      ) : (
                        detailData.items.map((item) => (
                          <TableRow
                            key={item.documentId || item.vendorId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleOrderClick(item.documentId)}
                          >
                            <TableCell className="font-mono text-sm font-medium">
                              {item.documentNumber || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.documentNumber || "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {item.documentDate
                                ? formatDate(item.documentDate)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {item.dueDate ? formatDate(item.dueDate) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {item.amountDue !== undefined
                                ? formatCurrency(item.amountDue)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-green-600">
                              {item.amountPaid !== undefined
                                ? formatCurrency(item.amountPaid)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {item.outstanding !== undefined
                                ? formatCurrency(item.outstanding)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.overdueDays && item.overdueDays > 0 ? (
                                <Badge variant="destructive">
                                  Quá hạn {item.overdueDays} ngày
                                </Badge>
                              ) : (
                                <Badge variant="default">Bình thường</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Detail Pagination */}
                {detailData && detailData.totalPages > 1 && (
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Trang {detailPage} / {detailData.totalPages} (
                        {detailData.total} giao dịch)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                          disabled={detailPage === 1 || isLoadingDetail}
                        >
                          <RefreshCw className="h-4 w-4 rotate-180" />
                        </Button>
                        <span className="text-sm font-medium px-2">
                          {detailPage} / {detailData.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDetailPage((p) =>
                              Math.min(detailData.totalPages, p + 1)
                            )
                          }
                          disabled={
                            detailPage === detailData.totalPages ||
                            isLoadingDetail
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










