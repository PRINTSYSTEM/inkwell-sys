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
    accountCode: "111",
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

      <div className="h-full flex flex-col space-y-2.5 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sổ quỹ</h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-muted-foreground text-xs">
                Xem sổ quỹ tiền mặt theo quỹ và khoảng thời gian
              </p>
              {bookType === "cash" && (displayData as any)?.accountCode && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100/80 dark:border-emerald-900/40">
                  TK hạch toán: {(displayData as any).accountCode} - {(displayData as any).accountName}
                </span>
              )}
              {bookType === "bank" && (displayData as any)?.bankNumber && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-100/80 dark:border-blue-900/40">
                  Tài khoản: {(displayData as any).bankNumber} - {(displayData as any).bankAccountName}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBankAccountsOpen(true)} className="h-8 text-xs font-semibold">
              <Landmark className="h-3.5 w-3.5 mr-1.5" />
              Tài khoản ngân hàng
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpenseCategoriesOpen(true)} className="h-8 text-xs font-semibold">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              Danh mục chi phí
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPaymentMethodsOpen(true)} className="h-8 text-xs font-semibold">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Phương thức thanh toán
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Làm mới
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-8 text-xs font-semibold">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="shrink-0 py-2 text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs font-semibold">Lỗi kết nối</AlertTitle>
            <AlertDescription className="text-xs">
              {error instanceof Error
                ? error.message
                : "Không thể tải dữ liệu. Vui lòng thử lại."}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters & Tabs */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/60 p-2 rounded-xl border border-slate-200/50 shadow-sm">
          <Tabs 
            value={bookType} 
            onValueChange={(v) => setBookType(v as "cash" | "bank")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full sm:w-auto grid-cols-2 h-8 p-0.5 bg-slate-200/60">
              <TabsTrigger value="cash" className="text-xs font-semibold px-3 py-1 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Tiền mặt (111)
              </TabsTrigger>
              <TabsTrigger value="bank" className="text-xs font-semibold px-3 py-1 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Ngân hàng (112)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {bookType === "bank" && (
              <div className="w-full sm:w-[220px]">
                <Select
                  value={bankAccountId}
                  onValueChange={setBankAccountId}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
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

            <div className="w-full sm:w-[260px] [&_button]:h-8 [&_button]:text-xs [&_button]:rounded-lg [&_button]:border-slate-200">
              <DateRangePicker 
                value={dateRange} 
                onValueChange={setDateRange}
              />
            </div>
          </div>
        </div>

        {/* 4 Summary Cards in 1 Compact Row */}
        {displayData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
            <div className="rounded-lg border bg-card p-2.5 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground">Số dư đầu kỳ</p>
              <p className="text-base font-bold mt-0.5">
                {displayData.openingBalance !== undefined
                  ? formatCurrency(displayData.openingBalance)
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-2.5 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {bookType === "cash" ? "Tổng thu" : "Tổng Nợ (Tăng)"}
              </p>
              <p className="text-base font-bold text-emerald-600 mt-0.5">
                {((displayData as any).totalReceipt ?? (displayData as any).totalDebit) !== undefined
                  ? formatCurrency((displayData as any).totalReceipt ?? (displayData as any).totalDebit)
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-2.5 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {bookType === "cash" ? "Tổng chi" : "Tổng Có (Giảm)"}
              </p>
              <p className="text-base font-bold text-red-600 mt-0.5">
                {((displayData as any).totalPayment ?? (displayData as any).totalCredit) !== undefined
                  ? formatCurrency((displayData as any).totalPayment ?? (displayData as any).totalCredit)
                  : "—"}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-2.5 shadow-sm bg-amber-50/40 border-amber-200/60">
              <p className="text-[11px] font-semibold text-amber-900">Số dư cuối kỳ</p>
              <p className="text-base font-bold text-amber-700 mt-0.5">
                {displayData.closingBalance !== undefined
                  ? formatCurrency(displayData.closingBalance)
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="flex-1 min-h-0 flex flex-col border rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm">
                <TableRow className="border-b border-slate-200/60 h-9">
                  <TableHead className="w-[110px] font-semibold text-xs text-slate-700">Ngày</TableHead>
                  <TableHead className="w-[120px] font-semibold text-xs text-slate-700">Số chứng từ</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Diễn giải</TableHead>
                  <TableHead className="font-semibold text-xs text-slate-700">Đối tượng</TableHead>
                  <TableHead className="text-right font-semibold text-xs text-slate-700">{bookType === "cash" ? "Thu" : "Nợ (Tăng)"}</TableHead>
                  <TableHead className="text-right font-semibold text-xs text-slate-700">{bookType === "cash" ? "Chi" : "Có (Giảm)"}</TableHead>
                  <TableHead className="text-right font-semibold text-xs text-slate-700">Số dư</TableHead>
                  <TableHead className="w-[120px] font-semibold text-xs text-slate-700">Tham chiếu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-9">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-2">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !displayData?.entries ||
                  displayData.entries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground font-semibold text-xs"
                    >
                      Không có giao dịch nào trong khoảng thời gian này.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.entries.map((entry: any, index: number) => (
                    <TableRow
                      key={index}
                      className="h-10 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs"
                      onClick={() =>
                        handleVoucherClick(entry.voucherType, entry.voucherId)
                      }
                    >
                      <TableCell className="text-xs text-slate-600">
                        {entry.date ? formatDate(entry.date) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {entry.voucherCode || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{entry.description || "—"}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">{entry.objectName || "—"}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-emerald-600">
                        {((entry as any).receiptAmount ?? (entry as any).debitAmount) !== undefined &&
                        ((entry as any).receiptAmount ?? (entry as any).debitAmount) > 0
                          ? formatCurrency((entry as any).receiptAmount ?? (entry as any).debitAmount)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-red-600">
                        {((entry as any).paymentAmount ?? (entry as any).creditAmount) !== undefined &&
                        ((entry as any).paymentAmount ?? (entry as any).creditAmount) > 0
                          ? formatCurrency((entry as any).paymentAmount ?? (entry as any).creditAmount)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-slate-800">
                        {entry.runningBalance !== undefined
                          ? formatCurrency(entry.runningBalance)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.reference || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
