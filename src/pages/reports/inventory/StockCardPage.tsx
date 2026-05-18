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
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
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
import { useStockCard, useExportStockCard } from "@/hooks/use-inventory-report";
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

  const {
    data: stockCardData,
    isLoading,
    isError,
    error,
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
            <DateRangePicker value={dateRange} onValueChange={setDateRange} className="w-[280px]" />
            <Button variant="outline" size="icon" onClick={() => refetch()}>
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
              ) : !stockCardData?.entries || stockCardData.entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có giao dịch nào trong khoảng thời gian này.
                  </TableCell>
                </TableRow>
              ) : (
                stockCardData.entries.map((entry, index) => (
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
      </div>
    </>
  );
}

