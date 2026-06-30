import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Loader2,
  AlertCircle,
  FileText,
  TrendingDown,
  CircleDollarSign,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAPDetail, useAPDetailLedger, useExportAPDetailLedger } from "@/hooks/use-ar-ap";
import { formatCurrency } from "@/lib/status-utils";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const translateDocType = (docType: string | null | undefined) => {
  if (!docType) return "Hóa đơn";
  switch (docType) {
    case "StockIn":
      return "Nhập kho vật tư";
    case "StockIn_Labor":
      return "Nhân công nhập kho";
    case "PlateExport":
      return "Xuất kẽm";
    case "PrintingExport":
      return "In gia công";
    case "DieExport":
      return "Xuất khuôn";
    default:
      return docType;
  }
};

export default function APDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get("vendorId")
    ? Number(searchParams.get("vendorId"))
    : undefined;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90), // default to 90 days range for ledger
    to: new Date(),
  });

  const [paymentTab, setPaymentTab] = useState<"unpaid" | "all">("unpaid");

  // Fetch Ledger data (API #3)
  const {
    data: ledgerData,
    isLoading: isLoadingLedger,
    isError: isErrorLedger,
    error: errorLedger,
    refetch: refetchLedger,
  } = useAPDetailLedger(
    vendorId || null,
    {
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      pageSize: 100, // retrieve more entries for detail ledger
    },
    !!vendorId
  );

  // Fetch detailed bills/documents (API #2)
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: errorDetail,
    refetch: refetchDetail,
  } = useAPDetail({
    vendorId: vendorId,
    paymentStatus: paymentTab,
    fromDate: "2024-01-01", // wider date range to capture all outstanding debt
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    pageSize: 50,
  });

  const { mutate: exportLedger, loading: isExporting } = useExportAPDetailLedger();

  const handleExportExcel = async () => {
    if (vendorId) {
      await exportLedger(vendorId, {
        fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      });
    }
  };

  const handleBack = () => {
    navigate("/accounting/ap?tab=debt");
  };

  const refetchAll = () => {
    refetchLedger();
    refetchDetail();
  };

  if (!vendorId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy NCC</AlertTitle>
          <AlertDescription>
            Vui lòng chọn một nhà cung cấp từ màn hình tổng hợp để xem chi tiết.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  // Find vendor name from the responses to display in header
  const vendorName =
    ledgerData?.items?.[0]?.documentType !== undefined
      ? "Nhà cung cấp"
      : detailData?.items?.[0]?.vendorName || "Nhà cung cấp";

  // Calculate totals for summary cards from outstanding data
  const unpaidItems = detailData?.items ?? [];
  const totalOutstanding = unpaidItems.reduce((sum, item) => sum + (item.outstanding || 0), 0);
  const totalAmountDue = unpaidItems.reduce((sum, item) => sum + (item.amountDue || 0), 0);
  const totalAmountPaid = unpaidItems.reduce((sum, item) => sum + (item.amountPaid || 0), 0);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Chi tiết công nợ NCC | Print Production ERP</title>
      </Helmet>

      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              SỔ CÔNG NỢ: <span className="text-primary">{vendorName}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Chi tiết giao dịch phát sinh và chứng từ công nợ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onValueChange={setDateRange} className="w-[280px]" />
          <Button variant="outline" size="icon" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="default" onClick={handleExportExcel} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Xuất sổ chi tiết
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Tổng phát sinh mua
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(totalAmountDue)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 bg-green-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Tổng đã trả
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(totalAmountPaid)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-100 bg-orange-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
              Còn phải trả (Còn nợ)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-orange-700">
              {formatCurrency(totalOutstanding)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Ledger Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            Sổ chi tiết tài khoản công nợ (Sổ cái)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isErrorLedger && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi tải sổ cái</AlertTitle>
                <AlertDescription>
                  {errorLedger instanceof Error ? errorLedger.message : "Vui lòng thử lại."}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="w-[120px] text-center">Ngày</TableHead>
                  <TableHead className="w-[140px]">Số CT</TableHead>
                  <TableHead>Diễn giải</TableHead>
                  <TableHead className="text-right w-[140px]">Nợ (Tăng nợ)</TableHead>
                  <TableHead className="text-right w-[140px]">Có (Giảm nợ)</TableHead>
                  <TableHead className="text-right w-[160px]">Số dư</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLedger ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !ledgerData?.items || ledgerData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic text-sm">
                      Không phát sinh giao dịch nào trong kỳ đã chọn
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerData.items.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/10">
                      <TableCell className="text-center font-medium text-xs text-muted-foreground">
                        {row.date ? formatDate(row.date) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {row.documentNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {row.documentType || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red-600 text-xs">
                        {row.debit && row.debit > 0 ? formatCurrency(row.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-green-600 text-xs">
                        {row.credit && row.credit > 0 ? formatCurrency(row.credit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-xs">
                        {row.balanceAfter !== undefined ? formatCurrency(row.balanceAfter) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document details below */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0 bg-muted/20 border-b flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 pt-2">
            <FileText className="h-4 w-4 text-primary" />
            Chi tiết các chứng từ mua hàng
          </CardTitle>
          <Tabs value={paymentTab} onValueChange={(v) => setPaymentTab(v as any)} className="w-auto">
            <TabsList className="h-8 py-1 bg-muted/10 border">
              <TabsTrigger value="unpaid" className="text-xs h-6">Còn nợ</TabsTrigger>
              <TabsTrigger value="all" className="text-xs h-6">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isErrorDetail && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi tải chứng từ</AlertTitle>
                <AlertDescription>
                  {errorDetail instanceof Error ? errorDetail.message : "Vui lòng thử lại sau."}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead>Số chứng từ</TableHead>
                  <TableHead>Loại chứng từ</TableHead>
                  <TableHead className="text-center">Ngày CT</TableHead>
                  <TableHead className="text-center">Hạn trả</TableHead>
                  <TableHead className="text-right">Số tiền mua</TableHead>
                  <TableHead className="text-right">Đã trả</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                  <TableHead className="text-center">Quá hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDetail ? (
                  Array.from({ length: 4 }).map((_, i) => (
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
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic text-sm">
                      Không tìm thấy chứng từ công nợ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  detailData.items.map((item, index) => {
                    const isOverdue = item.overdueDays !== undefined && item.overdueDays > 0;
                    return (
                      <TableRow key={item.documentId || index} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs font-bold text-slate-700">
                          {item.documentNumber || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-semibold py-3">
                          <div>{translateDocType(item.documentType)}</div>
                          {item.items && item.items.length > 0 && (
                            <div className="max-w-md mt-1 border rounded-lg overflow-hidden bg-background/50 shadow-sm font-normal">
                              <Table>
                                <TableHeader className="bg-muted/40">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] font-bold uppercase h-7 py-1 px-2">Mã vật tư</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase h-7 py-1 px-2">Tên vật tư</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase h-7 py-1 px-2 text-right">SL</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase h-7 py-1 px-2 text-right">Đơn giá</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase h-7 py-1 px-2 text-right">Thành tiền</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {item.items.map((goodsItem, idx) => (
                                    <TableRow key={idx} className="hover:bg-muted/10">
                                      <TableCell className="text-[11px] font-mono py-1 px-2">{goodsItem.code || "—"}</TableCell>
                                      <TableCell className="text-[11px] font-medium py-1 px-2 max-w-[120px] truncate" title={goodsItem.name || ""}>{goodsItem.name || "—"}</TableCell>
                                      <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums">{goodsItem.quantity ?? 0}</TableCell>
                                      <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums text-muted-foreground">{formatCurrency(goodsItem.unitPrice ?? 0)}</TableCell>
                                      <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums font-semibold">{formatCurrency(goodsItem.totalAmount ?? 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs">
                          {item.documentDate ? formatDate(item.documentDate) : "—"}
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs">
                          {item.dueDate ? formatDate(item.dueDate) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-xs">
                          {item.amountDue !== undefined ? formatCurrency(item.amountDue) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-green-600 text-xs">
                          {item.amountPaid !== undefined ? formatCurrency(item.amountPaid) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-xs">
                          {item.outstanding !== undefined ? formatCurrency(item.outstanding) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {isOverdue ? (
                            <Badge variant="destructive" className="font-medium text-[10px]">
                              Quá hạn {item.overdueDays} ngày
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-medium text-[10px] text-green-600 border-green-200 bg-green-50/20">
                              Chưa đến hạn
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
