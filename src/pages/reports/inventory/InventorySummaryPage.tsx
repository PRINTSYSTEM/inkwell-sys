import { useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
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

import {
  useInventorySummary,
  useExportInventorySummary,
  useExportInventorySummaryPDF,
} from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

export default function InventorySummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useInventorySummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    search: searchQuery || undefined,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    itemType: "product",
  });

  const exportMutation = useExportInventorySummary();
  const exportPdfMutation = useExportInventorySummaryPDF();

  const handleExportExcel = async () => {
    exportMutation.mutate({
      search: searchQuery || undefined,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      itemType: "product",
    });
  };

  const handleExportPdf = async () => {
    exportPdfMutation.mutate({
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      itemType: "product",
    });
  };

  const handleItemClick = (itemCode: string | null | undefined) => {
    if (itemCode) {
      navigate(`/reports/inventory/stock-card/${itemCode}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Tồn kho thành phẩm | Print Production ERP</title>
        <meta
          name="description"
          content="Tồn kho thành phẩm theo nhóm vật tư"
        />
      </Helmet>

      <div className="pt-0 -mt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tồn kho thành phẩm
            </h1>
            <p className="text-muted-foreground">
              Tồn kho thành phẩm theo nhóm vật tư
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPdf}
              disabled={exportPdfMutation.isPending}
            >
              {exportPdfMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Xuất PDF
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
              placeholder="Tìm kiếm theo mã hàng, tên hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DateRangePicker value={dateRange} onValueChange={setDateRange} />
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Mã hàng</TableHead>
                <TableHead>Tên hàng</TableHead>
                <TableHead className="text-right">Đầu kỳ</TableHead>
                <TableHead className="text-right">Nhập</TableHead>
                <TableHead className="text-right">Xuất</TableHead>
                <TableHead className="text-right">Cuối kỳ</TableHead>
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
              ) : !summaryData?.items || summaryData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không tìm thấy dữ liệu tổng hợp nào.
                  </TableCell>
                </TableRow>
              ) : (
                summaryData.items.map((item) => (
                  <TableRow
                    key={item.itemCode || item.materialTypeCode || item.materialTypeId || item.categoryId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleItemClick(item.itemCode || item.materialTypeCode)}
                  >
                    <TableCell className="font-medium font-mono text-sm">
                      {item.itemCode || item.materialTypeCode || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {item.itemName || item.materialTypeName || "—"}
                        </div>
                        {item.unit && (
                          <div className="text-xs text-muted-foreground">
                            ĐVT: {item.unit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      <div>
                        {item.openingQuantity !== undefined
                          ? item.openingQuantity.toLocaleString("vi-VN")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {item.openingValue !== undefined
                          ? formatCurrency(item.openingValue)
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-600">
                      <div>
                        {item.inQuantity !== undefined
                          ? item.inQuantity.toLocaleString("vi-VN")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {item.inValue !== undefined
                          ? formatCurrency(item.inValue)
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      <div>
                        {item.outQuantity !== undefined
                          ? item.outQuantity.toLocaleString("vi-VN")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {item.outValue !== undefined
                          ? formatCurrency(item.outValue)
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      <div>
                        {item.closingQuantity !== undefined
                          ? item.closingQuantity.toLocaleString("vi-VN")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {item.closingValue !== undefined
                          ? formatCurrency(item.closingValue)
                          : "—"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {summaryData && summaryData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {summaryData.totalPages} (
              {summaryData.total} nhóm)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {summaryData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(summaryData.totalPages, p + 1))
                }
                disabled={currentPage === summaryData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

