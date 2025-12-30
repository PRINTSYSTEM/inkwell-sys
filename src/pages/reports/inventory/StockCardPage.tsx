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
import { useStockCard } from "@/hooks/use-inventory-report";
import { formatCurrency } from "@/lib/status-utils";
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

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/reports/inventory/current-stock")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Thẻ kho - {itemCode || "—"}
              </h1>
              <p className="text-muted-foreground">
                Chi tiết nhập xuất tồn của vật tư
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
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

        {/* Item Info */}
        {stockCardData && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin vật tư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã vật tư</p>
                  <p className="font-medium">{stockCardData.materialTypeCode || itemCode || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tên vật tư</p>
                  <p className="font-medium">{stockCardData.materialTypeName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại thiết kế</p>
                  <p className="font-medium">{stockCardData.designTypeName || stockCardData.designTypeCode || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
        </div>

        {/* Summary */}
        {stockCardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Số dư đầu kỳ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stockCardData.openingBalance !== undefined
                    ? stockCardData.openingBalance.toLocaleString()
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng nhập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stockCardData.totalIn !== undefined
                    ? stockCardData.totalIn.toLocaleString()
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng xuất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stockCardData.totalOut !== undefined
                    ? stockCardData.totalOut.toLocaleString()
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Closing Balance */}
        {stockCardData && (
          <Card>
            <CardHeader>
              <CardTitle>Số dư cuối kỳ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stockCardData.closingBalance !== undefined
                  ? stockCardData.closingBalance.toLocaleString()
                  : "—"}
              </div>
            </CardContent>
          </Card>
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
                        <div>{entry.description || "—"}</div>
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
                      {entry.quantity !== undefined && entry.quantity > 0 && entry.transactionType === "in"
                        ? entry.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      {entry.quantity !== undefined && entry.quantity > 0 && entry.transactionType === "out"
                        ? entry.quantity.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {entry.runningBalance !== undefined
                        ? entry.runningBalance.toLocaleString()
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

