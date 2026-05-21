import { useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  RefreshCw,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Maximize2,
  Layers,
  Boxes,
  Tag,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useMaterial } from "@/hooks/use-material";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useStockCard, useExportStockCard, useInventoryHistory } from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function StockCardPage() {
  const navigate = useNavigate();
  const { itemCode } = useParams<{ itemCode: string }>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const materialId = itemCode ? parseInt(itemCode, 10) : null;
  const isNumericId = materialId !== null && !isNaN(materialId);
  const { data: materialDetail, isLoading: isLoadingMaterial } = useMaterial(
    isNumericId ? materialId : null,
    isNumericId
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: stockCardData,
    isLoading: isLoadingStockCard,
    isError: isErrorStockCard,
    error: errorStockCard,
    refetch,
  } = useStockCard(
    itemCode || "",
    {
      fromDate: dateRange?.from
        ? dateRange.from.toISOString()
        : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    }
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useInventoryHistory({
    pageNumber: currentPage,
    pageSize: 10,
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    itemCode: itemCode,
    itemType: "material",
    transactionType: transactionType === "all" ? undefined : transactionType,
    search: searchQuery || undefined,
  });

  const isLoading = isLoadingStockCard || isLoadingHistory || isLoadingMaterial;
  const isError = isErrorStockCard || isErrorHistory;
  const error = errorStockCard || errorHistory;

  const exportMutation = useExportStockCard();

  const handleExportExcel = async () => {
    if (!itemCode) return;
    exportMutation.mutate({
      itemCode,
      params: {
        fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      },
    });
  };

  const handleVoucherClick = (
    voucherType: string | null | undefined,
    voucherId: number | undefined
  ) => {
    if (!voucherId) return;

    const voucherTypeLower = voucherType?.toLowerCase() || "";
    if (
      voucherTypeLower.includes("stockin") ||
      voucherTypeLower === "stockin" ||
      voucherTypeLower.includes("nhap")
    ) {
      navigate(`/stock/stock-ins/${voucherId}`);
    } else if (
      voucherTypeLower.includes("stockout") ||
      voucherTypeLower === "stockout" ||
      voucherTypeLower.includes("xuat")
    ) {
      navigate(`/stock/stock-outs/${voucherId}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Thẻ kho | Print Production ERP</title>
        <meta name="description" content="Xem thẻ kho chi tiết" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/reports/inventory/current-stock")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  Thẻ kho: {stockCardData?.itemName || "—"}
                </h1>
                <Badge variant="outline" className="font-mono">{itemCode}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Kho: {stockCardData?.warehouse || "—"} | Đơn vị: {stockCardData?.unit || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onValueChange={(val) => {
                setDateRange(val);
                setCurrentPage(1);
              }}
              className="w-[280px]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetch();
                refetchHistory();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={exportMutation.isPending || !itemCode}
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Material Detail Specifications Card */}
        {materialDetail && (
          <Card className="shadow-sm border border-muted bg-gradient-to-r from-blue-600/[0.02] to-indigo-600/[0.02]">
            <CardHeader className="p-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Thông số kỹ thuật & Chi tiết vật tư
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tên vật tư
                </span>
                <p className="text-sm font-semibold text-foreground">{materialDetail.name || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Loại chất liệu
                </span>
                <div>
                  <Badge variant="secondary" className="font-medium mt-0.5 text-xs py-0">
                    {materialDetail.materialTypeName || "—"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" /> Kích thước (LxWxH)
                </span>
                <p className="text-sm font-semibold font-mono text-foreground">
                  {materialDetail.length || "—"}
                  {materialDetail.width ? `x${materialDetail.width}` : ""}
                  {materialDetail.height ? `x${materialDetail.height}` : ""}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Người tạo / Ngày tạo
                </span>
                <p className="text-xs font-medium text-foreground">
                  {materialDetail.createdBy || "—"} - {materialDetail.createdAt ? new Date(materialDetail.createdAt).toLocaleDateString("vi-VN") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Summary Stats */}
        {stockCardData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 p-3 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground uppercase">Đầu kỳ</p>
              <p className="text-lg font-bold">
                {stockCardData.openingBalance?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Tổng nhập</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {stockCardData.entries?.reduce((sum, e) => sum + (e.inQuantity || 0), 0).toLocaleString() || "0"}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Tổng xuất</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {stockCardData.entries?.reduce((sum, e) => sum + (e.outQuantity || 0), 0).toLocaleString() || "0"}
              </p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
              <p className="text-xs font-medium text-primary uppercase">Cuối kỳ</p>
              <p className="text-lg font-bold text-primary">
                {stockCardData.closingBalance?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã chứng từ, diễn giải..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-md"
            />
          </div>

          <Select
            value={transactionType}
            onValueChange={(val) => {
              setTransactionType(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] rounded-md">
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giao dịch</SelectItem>
              <SelectItem value="StockIn">Nhập kho</SelectItem>
              <SelectItem value="StockOut">Xuất kho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Ngày</TableHead>
                <TableHead className="w-[140px]">Số chứng từ</TableHead>
                <TableHead>Diễn giải</TableHead>
                <TableHead className="text-right">Nhập</TableHead>
                <TableHead className="text-right">Xuất</TableHead>
                <TableHead className="text-right">Tồn</TableHead>
                <TableHead>Tham chiếu</TableHead>
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
              ) : !historyData?.items || historyData.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có giao dịch nào trong khoảng thời gian này.
                  </TableCell>
                </TableRow>
              ) : (
                historyData.items.map((entry, index) => (
                  <TableRow
                    key={index}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      handleVoucherClick(entry.voucherType, entry.voucherId)
                    }
                  >
                    <TableCell className="text-sm">
                      {entry.date ? formatDate(entry.date) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {entry.voucherCode || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{entry.notes || "—"}</div>
                        {entry.voucherType && (
                          <div className="text-xs text-muted-foreground">
                            {entry.voucherType === "StockIn"
                              ? "Phiếu nhập"
                              : entry.voucherType === "StockOut"
                                ? "Phiếu xuất"
                                : entry.voucherType}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-600">
                      {entry.inQuantity !== undefined && entry.inQuantity > 0
                        ? entry.inQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      {entry.outQuantity !== undefined && entry.outQuantity > 0
                        ? entry.outQuantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {entry.balance !== undefined
                        ? entry.balance.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.reference || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {historyData && historyData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {currentPage} / {historyData.totalPages} (
              {historyData.total} giao dịch)
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
                {currentPage} / {historyData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(historyData.totalPages, p + 1)
                  )
                }
                disabled={currentPage === historyData.totalPages || isLoading}
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

