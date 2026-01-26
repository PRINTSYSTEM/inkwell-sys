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
  ChevronDown,
  ChevronUp,
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
import { useARSummary, useARDetail } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function ARSummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(
    new Set()
  );
  const itemsPerPage = 10;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARSummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    search: searchQuery || undefined,
  });

  const totalClosingBalance =
    arData?.items?.reduce((sum, item) => sum + (item.closingBalance || 0), 0) ||
    0;
  const totalIncrease =
    arData?.items?.reduce((sum, item) => sum + (item.increase || 0), 0) || 0;
  const totalOverdue =
    arData?.items?.reduce((sum, item) => sum + (item.overdue || 0), 0) || 0;

  const handleExportExcel = async () => {
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  const toggleExpand = (customerId: number | null | undefined) => {
    if (!customerId) return;
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
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
                Số dư cuối kỳ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold">
                {formatCurrency(totalClosingBalance)}
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
                {formatCurrency(
                  arData?.items?.reduce(
                    (sum, item) => sum + (item.decrease || 0),
                    0
                  ) || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="py-2">
            <CardHeader className="pb-1 px-4 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Công nợ quá hạn
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <div className="text-lg font-bold text-destructive">
                {formatCurrency(totalOverdue)}
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[140px] font-semibold">Mã KH</TableHead>
                <TableHead className="font-semibold">Tên khách hàng</TableHead>
                <TableHead className="text-right font-semibold">
                  Số dư đầu kỳ
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Phát sinh
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Thanh toán
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Số dư cuối kỳ
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Quá hạn
                </TableHead>
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
                arData.items.map((item) => {
                  const isExpanded = expandedCustomers.has(
                    item.customerId || 0
                  );
                  return (
                    <>
                      <TableRow
                        key={item.customerId}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpand(item.customerId)}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.customerId);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-semibold font-mono text-sm">
                          {item.customerCode || "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {item.customerName || item.companyName || "—"}
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
                        <TableCell className="text-right">
                          {item.overdue !== undefined && item.overdue > 0 ? (
                            <Badge
                              variant="destructive"
                              className="font-medium"
                            >
                              {formatCurrency(item.overdue)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && item.customerId && (
                        <>
                          {/* Header row for detail columns */}
                          <TableRow className="bg-muted/30">
                            <TableHead></TableHead>
                            <TableHead
                              colSpan={2}
                              className="pl-8 font-semibold text-xs"
                            >
                              Số chứng từ
                            </TableHead>
                            <TableHead className="text-center font-semibold text-xs">
                              Ngày chứng từ
                            </TableHead>
                            <TableHead className="text-center font-semibold text-xs">
                              Hạn thanh toán
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs">
                              Số tiền phải thu
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs">
                              Đã thanh toán
                            </TableHead>
                            <TableHead className="text-right font-semibold text-xs">
                              Còn lại
                            </TableHead>
                          </TableRow>
                          <CustomerDetailRow
                            customerId={item.customerId}
                            dateRange={dateRange}
                          />
                        </>
                      )}
                    </>
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

// Component to render expanded customer detail
function CustomerDetailRow({
  customerId,
  dateRange,
}: {
  customerId: number;
  dateRange: DateRange | undefined;
}) {
  const navigate = useNavigate();

  const { data: detailData, isLoading: isLoadingDetail } = useARDetail({
    customerId: customerId,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
  });

  const handleOrderClick = (documentId: number | null | undefined) => {
    if (documentId) {
      navigate(`/accounting/orders/${documentId}`);
    }
  };

  if (isLoadingDetail) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/20">
          <div className="flex items-center gap-2 px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Đang tải chi tiết công nợ...
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!detailData?.items || detailData.items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-muted/20">
          <div className="px-4 py-2 text-sm text-muted-foreground">
            Không có chi tiết công nợ
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {detailData.items.map((detail, index) => (
        <TableRow
          key={detail.documentId || index}
          className="bg-muted/20 hover:bg-muted/30 cursor-pointer"
          onClick={() => handleOrderClick(detail.documentId)}
        >
          <TableCell></TableCell>
          <TableCell colSpan={2} className="pl-8">
            <div className="space-y-1">
              <div className="font-semibold text-sm">
                {detail.documentNumber || "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {detail.documentType || "—"}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-center text-sm font-medium">
            {detail.documentDate ? formatDate(detail.documentDate) : "—"}
          </TableCell>
          <TableCell className="text-center text-sm font-medium">
            {detail.dueDate ? formatDate(detail.dueDate) : "—"}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums text-sm">
            {detail.amountDue !== undefined
              ? formatCurrency(detail.amountDue)
              : "—"}
          </TableCell>
          <TableCell className="text-right font-semibold tabular-nums text-sm text-green-600">
            {detail.amountPaid !== undefined
              ? formatCurrency(detail.amountPaid)
              : "—"}
          </TableCell>
          <TableCell className="text-right">
            {detail.outstanding !== undefined && detail.outstanding > 0 ? (
              <Badge variant="outline" className="font-medium">
                {formatCurrency(detail.outstanding)}
              </Badge>
            ) : (
              "—"
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
