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
import { useCashBook } from "@/hooks/use-cash";
import { useBankAccounts, useBankLedger } from "@/hooks/use-bank";
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
  const [bookType, setBookType] = useState<"cash" | "bank">("cash");
  const [bankAccountId, setBankAccountId] = useState<string>("all");

  const { data: bankAccountsData } = useBankAccounts({ pageNumber: 1, pageSize: 100 });
  const bankAccounts = bankAccountsData?.items || [];

  const {
    data: cashBookData,
    isLoading: isCashLoading,
    isError: isCashError,
    error: cashError,
    refetch: refetchCash,
  } = useCashBook({
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
  });

  const {
    data: bankLedgerData,
    isLoading: isBankLoading,
    isError: isBankError,
    error: bankError,
    refetch: refetchBank,
  } = useBankLedger({
    fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
    toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    bankAccountId: bankAccountId !== "all" ? Number(bankAccountId) : undefined,
  });

  const displayData = bookType === "cash" ? cashBookData : bankLedgerData;
  const isLoading = bookType === "cash" ? isCashLoading : isBankLoading;
  const isError = bookType === "cash" ? isCashError : isBankError;
  const error = bookType === "cash" ? cashError : bankError;
  const refetch = bookType === "cash" ? refetchCash : refetchBank;

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
          <div className="w-full sm:w-[200px]">
            <Select
              value={bookType}
              onValueChange={(v: "cash" | "bank") => setBookType(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loại sổ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tiền mặt (111)</SelectItem>
                <SelectItem value="bank">Ngân hàng (112)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bookType === "bank" && (
            <div className="w-full sm:w-[300px]">
              <Select
                value={bankAccountId}
                onValueChange={setBankAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tài khoản</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id?.toString() || ""}>
                      {account.bankName} - {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1">
            <DateRangePicker value={dateRange} onValueChange={setDateRange} />
          </div>
        </div>

        {/* Summary Cards */}
        {displayData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bookType === "cash" ? "Quỹ" : "Tài khoản"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">
                  {bookType === "cash" 
                    ? (displayData.cashFundName || "Tiền mặt") 
                    : (bankAccountId === "all" ? "Tất cả ngân hàng" : bankAccounts.find(a => a.id?.toString() === bankAccountId)?.bankName || "Tài khoản")}
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
                  {displayData.openingBalance !== undefined
                    ? formatCurrency(displayData.openingBalance)
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bookType === "cash" ? "Tổng thu" : "Tổng Nợ (Tăng)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {((displayData as any).totalReceipt ?? (displayData as any).totalDebit) !== undefined
                    ? formatCurrency((displayData as any).totalReceipt ?? (displayData as any).totalDebit)
                    : "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bookType === "cash" ? "Tổng chi" : "Tổng Có (Giảm)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {((displayData as any).totalPayment ?? (displayData as any).totalCredit) !== undefined
                    ? formatCurrency((displayData as any).totalPayment ?? (displayData as any).totalCredit)
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Closing Balance */}
        {displayData && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold">Số dư cuối kỳ</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-3xl font-bold text-primary">
                {displayData.closingBalance !== undefined
                  ? formatCurrency(displayData.closingBalance)
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
                <TableHead className="text-right">{bookType === "cash" ? "Thu" : "Nợ (Tăng)"}</TableHead>
                <TableHead className="text-right">{bookType === "cash" ? "Chi" : "Có (Giảm)"}</TableHead>
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
              ) : !displayData?.entries ||
                displayData.entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có giao dịch nào trong khoảng thời gian này.
                  </TableCell>
                </TableRow>
              ) : (
                displayData.entries.map((entry: any, index: number) => (
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
                      {((entry as any).receiptAmount ?? (entry as any).debitAmount) !== undefined &&
                      ((entry as any).receiptAmount ?? (entry as any).debitAmount) > 0
                        ? formatCurrency((entry as any).receiptAmount ?? (entry as any).debitAmount)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-600">
                      {((entry as any).paymentAmount ?? (entry as any).creditAmount) !== undefined &&
                      ((entry as any).paymentAmount ?? (entry as any).creditAmount) > 0
                        ? formatCurrency((entry as any).paymentAmount ?? (entry as any).creditAmount)
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
