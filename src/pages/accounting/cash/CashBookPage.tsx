import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RefreshCw, Download, Loader2, AlertCircle, Landmark, DollarSign, CreditCard } from "lucide-react";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BankAccountListPage from "../bank/BankAccountListPage";
import ExpenseCategoryListPage from "../expense/ExpenseCategoryListPage";
import PaymentMethodListPage from "../payment-method/PaymentMethodListPage";
import { useCashBook } from "@/hooks/use-cash";
import { useBankAccounts, useBankLedger } from "@/hooks/use-bank";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import { useEffect } from "react";

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
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [bankAccountsOpen, setBankAccountsOpen] = useState(false);
  const [expenseCategoriesOpen, setExpenseCategoriesOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

  const { data: bankAccountsData } = useBankAccounts({ pageNumber: 1, pageSize: 100 });
  const bankAccounts = bankAccountsData?.items || [];

  // Set default bank account if none selected and accounts are loaded
  useEffect(() => {
    if (bookType === "bank" && !bankAccountId && bankAccounts.length > 0) {
      setBankAccountId(bankAccounts[0].id?.toString() || "");
    }
  }, [bookType, bankAccounts, bankAccountId]);

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
    bankAccountId: bankAccountId ? Number(bankAccountId) : undefined,
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setBankAccountsOpen(true)}>
              <Landmark className="h-4 w-4 mr-2" />
              Tài khoản ngân hàng
            </Button>
            <Button variant="outline" onClick={() => setExpenseCategoriesOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Danh mục chi phí
            </Button>
            <Button variant="outline" onClick={() => setPaymentMethodsOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Phương thức thanh toán
            </Button>
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

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
          <Tabs 
            value={bookType} 
            onValueChange={(v) => setBookType(v as "cash" | "bank")}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/50">
              <TabsTrigger value="cash" className="text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Tiền mặt (111)
              </TabsTrigger>
              <TabsTrigger value="bank" className="text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Ngân hàng (112)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {bookType === "bank" && (
              <div className="w-full sm:w-[250px]">
                <Select
                  value={bankAccountId}
                  onValueChange={setBankAccountId}
                >
                  <SelectTrigger className="h-10 bg-background border-muted-foreground/20 focus:ring-primary/20">
                    <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id?.toString() || ""}>
                        {account.bankName} - {account.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full sm:w-[300px]">
              <DateRangePicker 
                value={dateRange} 
                onValueChange={setDateRange}
                className="h-10 bg-background border-muted-foreground/20"
              />
            </div>
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
                    ? ((displayData.cashFundName as string | undefined) || "Tiền mặt")
                    : (bankAccounts.find(a => a.id?.toString() === bankAccountId)?.bankName || "Tài khoản")}
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

      <Dialog open={bankAccountsOpen} onOpenChange={setBankAccountsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <BankAccountListPage />
        </DialogContent>
      </Dialog>

      <Dialog open={expenseCategoriesOpen} onOpenChange={setExpenseCategoriesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <ExpenseCategoryListPage />
        </DialogContent>
      </Dialog>

      <Dialog open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <PaymentMethodListPage />
        </DialogContent>
      </Dialog>
    </>
  );
}
