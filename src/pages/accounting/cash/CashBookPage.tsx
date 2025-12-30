import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RefreshCw, Download, Loader2, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCashBook, useCashFunds } from "@/hooks/use-cash";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function CashBookPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [cashFundId, setCashFundId] = useState<number | undefined>(undefined);

  const { data: fundsData } = useCashFunds({ isActive: true });
  const {
    data: cashBookData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashBook({
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    cashFundId: cashFundId,
  });

  const handleVoucherClick = (
    voucherType: string | null | undefined,
    voucherId: number | undefined
  ) => {
    if (!voucherId) return;

    const voucherTypeLower = voucherType?.toLowerCase() || "";
    if (
      voucherTypeLower.includes("receipt") ||
      voucherTypeLower === "receipt"
    ) {
      navigate(`/accounting/cash-receipts/${voucherId}`);
    } else if (
      voucherTypeLower.includes("payment") ||
      voucherTypeLower === "payment"
    ) {
      navigate(`/accounting/cash-payments/${voucherId}`);
    }
  };

  const handleExportExcel = async () => {
    // TODO: Implement export Excel when API endpoint is available
    toast.info("Chức năng xuất Excel đang được phát triển");
  };

  return (
    <>
      <Helmet>
        <title>Sổ quỹ | Print Production ERP</title>
        <meta name="description" content="Xem sổ quỹ tiền mặt" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sổ quỹ</h1>
            <p className="text-muted-foreground">
              Xem sổ quỹ tiền mặt theo quỹ và khoảng thời gian
            </p>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
          <Select
            value={cashFundId?.toString() || "all"}
            onValueChange={(value) =>
              setCashFundId(value === "all" ? undefined : Number(value))
            }
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Chọn quỹ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả quỹ</SelectItem>
              {fundsData?.items
                ?.filter((fund) => fund.id !== undefined && fund.id !== null)
                .map((fund) => (
                  <SelectItem key={fund.id} value={fund.id!.toString()}>
                    {fund.name} ({fund.code})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        {cashBookData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quỹ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {String(cashBookData.cashFundName || "—")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Số dư đầu kỳ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cashBookData.openingBalance !== undefined
                    ? formatCurrency(cashBookData.openingBalance)
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng thu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {cashBookData.totalReceipt !== undefined
                    ? formatCurrency(cashBookData.totalReceipt)
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng chi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {cashBookData.totalPayment !== undefined
                    ? formatCurrency(cashBookData.totalPayment)
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Closing Balance */}
        {cashBookData && (
          <Card>
            <CardHeader>
              <CardTitle>Số dư cuối kỳ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {cashBookData.closingBalance !== undefined
                  ? formatCurrency(cashBookData.closingBalance)
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
                <TableHead>Đối tượng</TableHead>
                <TableHead className="text-right">Thu</TableHead>
                <TableHead className="text-right">Chi</TableHead>
                <TableHead className="text-right">Số dư</TableHead>
                <TableHead>Tham chiếu</TableHead>
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
              ) : !cashBookData?.entries ||
                cashBookData.entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có giao dịch nào trong khoảng thời gian này.
                  </TableCell>
                </TableRow>
              ) : (
                cashBookData.entries.map((entry, index) => (
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
                    <TableCell>{entry.description || "—"}</TableCell>
                    <TableCell>{entry.objectName || "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-600">
                      {entry.receiptAmount !== undefined &&
                      entry.receiptAmount > 0
                        ? formatCurrency(entry.receiptAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      {entry.paymentAmount !== undefined &&
                      entry.paymentAmount > 0
                        ? formatCurrency(entry.paymentAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {entry.runningBalance !== undefined
                        ? formatCurrency(entry.runningBalance)
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
