import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
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
  Pencil,
  Check,
  X,
} from "lucide-react";
import UpdateStockInPricesDialog from "./components/UpdateStockInPricesDialog";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { useUpdateStockInPrices } from "@/hooks/use-stock";

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
import { useAPDetail, useAPDetailLedger, useExportAPDetailLedger, useAPReconciliation, useExportAPReconciliation } from "@/hooks/use-ar-ap";
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
    case "Settlement":
      return "Tất toán công nợ (ngoài hệ thống)";
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
  const [activeDetailTab, setActiveDetailTab] = useState<"ledger" | "reconciliation">("ledger");
  const [selectedStockInId, setSelectedStockInId] = useState<number | null>(null);
  const [isEditPricesOpen, setIsEditPricesOpen] = useState(false);
  const [isSearchingStockIn, setIsSearchingStockIn] = useState<string | null>(null);
  const [editingReconRow, setEditingReconRow] = useState<{
    index: number;
    documentNumber: string;
    stockInId: number;
    stockInItemId: number;
    quantity: number;
    unitPrice: number;
    lineAmount: number;
  } | null>(null);

  const queryClient = useQueryClient();
  const { mutateAsync: updatePricesAsync, isPending: isUpdatingPrices } = useUpdateStockInPrices();

  const handleReconStockInEdit = async (index: number, row: any) => {
    const documentNumber = row.documentNumber;
    if (!documentNumber) return;
    setIsSearchingStockIn(documentNumber);
    try {
      const docType = row.documentType || "";
      const isStockIn = docType === "StockIn" || docType === "Nhập hàng";

      if (isStockIn) {
        const response = await apiRequest.get<{ items: Array<{ id: number; code: string }> }>("/stock-ins", {
          params: { search: documentNumber }
        });
        const stockInSummary = response.data?.items?.find(item => item.code === documentNumber);
        if (!stockInSummary) {
          toast.error(`Không tìm thấy phiếu nhập kho với mã ${documentNumber}`);
          return;
        }

        const detailResponse = await apiRequest.get<any>(`/stock-ins/${stockInSummary.id}`);
        const stockInDetail = detailResponse.data;
        if (!stockInDetail) {
          toast.error("Không tải được chi tiết phiếu nhập kho.");
          return;
        }

        // Match item
        const itemsList = stockInDetail.items || [];
        let matchedItem = itemsList.find((i: any) => 
          i.itemName?.trim().toLowerCase() === row.description?.trim().toLowerCase()
        );
        if (!matchedItem) {
          matchedItem = itemsList.find((i: any) => 
            i.itemCode?.trim().toLowerCase() === row.spec1?.trim().toLowerCase()
          );
        }
        const rowQty = row.quantity !== undefined && row.quantity !== null 
          ? row.quantity 
          : (row.amount && row.unitPrice ? row.amount / row.unitPrice : 0);
        if (!matchedItem) {
          matchedItem = itemsList.find((i: any) => 
            Math.abs((i.quantity || 0) - rowQty) < 0.01
          );
        }
        const finalItem = matchedItem || itemsList[0];
        if (!finalItem) {
          toast.error("Phiếu nhập kho này không chứa mặt hàng nào.");
          return;
        }

        setEditingReconRow({
          index,
          documentNumber,
          stockInId: stockInSummary.id,
          stockInItemId: finalItem.id,
          quantity: rowQty,
          unitPrice: row.unitPrice ?? 0,
          lineAmount: row.amount ?? 0,
        });
      } else {
        // For Plate, Printing, Die
        const id = Number(documentNumber);
        if (isNaN(id)) {
          toast.error(`Mã chứng từ ${documentNumber} không hợp lệ để chỉnh sửa.`);
          return;
        }

        const rowQty = row.quantity !== undefined && row.quantity !== null 
          ? row.quantity 
          : (row.amount && row.unitPrice ? row.amount / row.unitPrice : 1);

        setEditingReconRow({
          index,
          documentNumber,
          stockInId: id, // Target record ID stored in stockInId
          stockInItemId: 0,
          quantity: rowQty,
          unitPrice: row.unitPrice ?? 0,
          lineAmount: row.amount ?? 0,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải thông tin chứng từ!");
    } finally {
      setIsSearchingStockIn(null);
    }
  };

  const handleReconSave = async () => {
    if (!editingReconRow) return;
    const toastId = toast.loading("Đang cập nhật đơn giá...");
    
    const row = reconData?.rows?.[editingReconRow.index];
    if (!row) {
      toast.error("Không tìm thấy dòng dữ liệu đang sửa.", { id: toastId });
      return;
    }
    const docType = row.documentType || "";
    const isStockIn = docType === "StockIn" || docType === "Nhập hàng";
    const isPlate = docType === "PlateExport" || docType === "Xuất kẽm";
    const isPrinting = docType === "PrintingExport" || docType === "In gia công";
    const isDie = docType === "DieExport" || docType === "Xuất khuôn";

    try {
      if (isStockIn) {
        await updatePricesAsync({
          id: editingReconRow.stockInId,
          data: {
            stockInId: editingReconRow.stockInId,
            items: [
              {
                stockInItemId: editingReconRow.stockInItemId,
                unitPrice: editingReconRow.unitPrice,
                lineAmount: editingReconRow.lineAmount,
              }
            ]
          }
        });
      } else if (isPlate) {
        const res = await apiRequest.get(`/plate-exports/${editingReconRow.stockInId}`);
        await apiRequest.put(`/plate-exports/${editingReconRow.stockInId}`, {
          ...res.data,
          unitPrice: editingReconRow.unitPrice,
        });
        queryClient.invalidateQueries({ queryKey: ["plate-exports"] });
      } else if (isPrinting) {
        const res = await apiRequest.get(`/outsource-orders/${editingReconRow.stockInId}`);
        await apiRequest.put(`/outsource-orders/${editingReconRow.stockInId}`, {
          ...res.data,
          outsourceCost: editingReconRow.unitPrice,
        });
        queryClient.invalidateQueries({ queryKey: ["outsource-orders"] });
      } else if (isDie) {
        await apiRequest.put(`/dies/${editingReconRow.stockInId}`, {
          price: editingReconRow.unitPrice,
        });
        queryClient.invalidateQueries({ queryKey: ["dies"] });
      }

      // Invalidate AP reports to refresh table data
      queryClient.invalidateQueries({ queryKey: ["ap-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });

      toast.success("Cập nhật đơn giá thành công!", { id: toastId });
      setEditingReconRow(null);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật đơn giá: " + (error instanceof Error ? error.message : "Vui lòng thử lại."), { id: toastId });
    }
  };

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

  // Fetch Reconciliation data (API #4)
  const {
    data: reconData,
    isLoading: isLoadingRecon,
    isError: isErrorRecon,
    error: errorRecon,
    refetch: refetchRecon,
  } = useAPReconciliation(
    vendorId || null,
    {
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    },
    activeDetailTab === "reconciliation" && !!vendorId
  );

  const specHeaders = useMemo(() => reconData?.specHeaders ?? [], [reconData]);
  const activeSpecs = useMemo(() => {
    return specHeaders
      .map((header, originalIdx) => ({ header, originalIdx }))
      .filter(
        (item) =>
          item.header &&
          item.header.trim() !== "" &&
          !item.header.toLowerCase().includes("m²") &&
          !item.header.toLowerCase().includes("m2") &&
          !item.header.toLowerCase().includes("số lượng") &&
          !item.header.toLowerCase().includes("so luong")
      );
  }, [specHeaders]);

  const { mutate: exportLedger, loading: isExportingLedger } = useExportAPDetailLedger();
  const { mutate: exportRecon, loading: isExportingRecon } = useExportAPReconciliation();

  const isExporting = isExportingLedger || isExportingRecon;

  const handleExportExcel = async () => {
    if (vendorId) {
      if (activeDetailTab === "reconciliation") {
        await exportRecon(vendorId, {
          fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          vendorName: vendorName !== "Nhà cung cấp" ? vendorName : undefined,
        });
      } else {
        await exportLedger(vendorId, {
          fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          vendorName: vendorName !== "Nhà cung cấp" ? vendorName : undefined,
        });
      }
    }
  };

  const handleBack = () => {
    navigate("/accounting/ap?tab=debt");
  };

  const refetchAll = () => {
    refetchLedger();
    refetchDetail();
    refetchRecon();
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
            {activeDetailTab === "reconciliation" ? "Xuất bảng đối chiếu" : "Xuất sổ chi tiết"}
          </Button>
        </div>
      </div>

      <Tabs value={activeDetailTab} onValueChange={(v) => setActiveDetailTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ledger">Sổ chi tiết (Sổ cái)</TabsTrigger>
          <TabsTrigger value="reconciliation">Bảng đối chiếu công nợ</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-6 mt-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-blue-100 bg-blue-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Tổng phát sinh mua
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(totalAmountDue)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-green-100 bg-green-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Tổng đã trả
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(totalAmountPaid)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-orange-100 bg-orange-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                  Còn phải trả (Còn nợ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-orange-700">
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
                      <TableHead className="text-center w-[80px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDetail ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !detailData?.items || detailData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground italic text-sm">
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
                            <TableCell className="text-sm font-semibold py-1.5">
                              <div>{translateDocType(item.documentType)}</div>
                              {item.items && item.items.length > 0 && (
                                <div className="max-w-md mt-1 border rounded-lg overflow-hidden bg-background/50 shadow-sm font-normal">
                                  <Table>
                                    <TableHeader className="bg-muted/40">
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[9px] font-bold uppercase h-6 py-0.5 px-1">Mã vật tư</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase h-6 py-0.5 px-1">Tên vật tư</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase h-6 py-0.5 px-1 text-right">SL</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase h-6 py-0.5 px-1 text-right">Đơn giá</TableHead>
                                        <TableHead className="text-[9px] font-bold uppercase h-6 py-0.5 px-1 text-right">Thành tiền</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {item.items.map((goodsItem, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/10">
                                          <TableCell className="text-[10px] font-mono py-0.5 px-1">{goodsItem.code || "—"}</TableCell>
                                          <TableCell className="text-[10px] font-medium py-0.5 px-1 max-w-[120px] truncate" title={goodsItem.name || ""}>{goodsItem.name || "—"}</TableCell>
                                          <TableCell className="text-[10px] py-0.5 px-1 text-right tabular-nums">{goodsItem.quantity ?? 0}</TableCell>
                                          <TableCell className="text-[10px] py-0.5 px-1 text-right tabular-nums text-muted-foreground">{formatCurrency(goodsItem.unitPrice ?? 0)}</TableCell>
                                          <TableCell className="text-[10px] py-0.5 px-1 text-right tabular-nums font-semibold">{formatCurrency(goodsItem.totalAmount ?? 0)}</TableCell>
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
                            <TableCell className="text-center">
                              {item.documentType === "StockIn" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:text-primary-dark"
                                  onClick={() => {
                                    if (item.documentId) {
                                      setSelectedStockInId(item.documentId);
                                      setIsEditPricesOpen(true);
                                    }
                                  }}
                                  title="Chỉnh sửa đơn giá / thành tiền"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
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
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6 mt-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-blue-100 bg-blue-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Dư đầu kỳ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(reconData?.openingBalance ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-orange-100 bg-orange-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                  Phát sinh tăng (Nợ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-orange-700">
                  {formatCurrency(reconData?.totalDebit ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-green-100 bg-green-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Phát sinh giảm (Có)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(reconData?.totalCredit ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100 bg-slate-50/20">
              <CardHeader className="p-2.5 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Dư cuối kỳ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 pt-0">
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(reconData?.closingBalance ?? 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reconciliation Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-muted/20 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Bảng đối chiếu công nợ nhà cung cấp
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isErrorRecon && (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi tải bảng đối chiếu</AlertTitle>
                    <AlertDescription>
                      {errorRecon instanceof Error ? errorRecon.message : "Vui lòng thử lại."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="w-[110px] text-center">Ngày</TableHead>
                        <TableHead className="w-[120px]">Số chứng từ</TableHead>
                        <TableHead className="w-[100px]">Loại</TableHead>
                        <TableHead className="min-w-[150px]">Tên hàng/Diễn giải</TableHead>
                        
                        {/* Dynamic Spec Headers */}
                        {activeSpecs.map((spec, idx) => (
                          <TableHead key={idx} className="w-[90px]">{spec.header}</TableHead>
                        ))}

                        <TableHead className="text-right w-[80px]">Số lượng</TableHead>
                        <TableHead className="w-[60px] text-center">ĐVT</TableHead>
                        <TableHead className="text-right w-[100px]">Đơn giá</TableHead>
                        <TableHead className="text-right w-[110px]">Thành tiền</TableHead>
                        <TableHead className="text-right w-[80px]">VAT</TableHead>
                        <TableHead className="text-right w-[110px]">Thanh toán</TableHead>
                        <TableHead className="text-right w-[130px]">Dư sau GD</TableHead>
                        <TableHead className="text-center w-[85px]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingRecon ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 12 + activeSpecs.length }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : !reconData?.rows || reconData.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={12 + activeSpecs.length} className="h-24 text-center text-muted-foreground italic text-sm">
                            Không phát sinh đối chiếu nào trong kỳ đã chọn
                          </TableCell>
                        </TableRow>
                      ) : (
                        reconData.rows.map((row, index) => (
                          <TableRow key={index} className="hover:bg-muted/10">
                            <TableCell className="text-center font-medium text-xs text-muted-foreground">
                              {row.date ? formatDate(row.date) : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-primary">
                              {row.documentNumber || "—"}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {row.documentType || "—"}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {row.description || "—"}
                            </TableCell>

                            {/* Dynamic Spec Cells */}
                            {activeSpecs.map((spec, idx) => {
                              const val = spec.originalIdx === 0 ? row.spec1 : spec.originalIdx === 1 ? row.spec2 : row.spec3;
                              return (
                                <TableCell key={idx} className="text-xs text-slate-600">
                                  {val ?? "—"}
                                </TableCell>
                              );
                            })}

                            <TableCell className="text-right text-xs font-semibold tabular-nums">
                              {(() => {
                                const qtyVal = row.quantity !== undefined && row.quantity !== null 
                                  ? row.quantity 
                                  : (row.amount && row.unitPrice ? row.amount / row.unitPrice : null);
                                  return qtyVal !== null ? qtyVal.toLocaleString() : "—";
                              })()}
                            </TableCell>
                            <TableCell className="text-center text-xs text-slate-600">
                              {row.unit || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-xs">
                              {editingReconRow?.index === index ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={editingReconRow.unitPrice}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    setEditingReconRow({
                                      ...editingReconRow,
                                      unitPrice: price,
                                      lineAmount: Math.round(editingReconRow.quantity * price),
                                    });
                                  }}
                                  className="h-8 text-right text-xs font-mono font-bold border-slate-200 focus-visible:ring-primary/40 bg-white w-[110px] ml-auto"
                                />
                              ) : (
                                row.unitPrice !== null && row.unitPrice !== undefined ? formatCurrency(row.unitPrice) : "—"
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-xs">
                              {editingReconRow?.index === index ? (
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={editingReconRow.lineAmount}
                                  onChange={(e) => {
                                    const amount = parseFloat(e.target.value) || 0;
                                    setEditingReconRow({
                                      ...editingReconRow,
                                      lineAmount: amount,
                                    });
                                  }}
                                  className="h-8 text-right text-xs font-mono font-bold border-slate-200 focus-visible:ring-primary/40 bg-white w-[120px] ml-auto"
                                />
                              ) : (
                                row.amount !== null && row.amount !== undefined ? formatCurrency(row.amount) : "—"
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-xs text-muted-foreground">
                              {row.vat !== null && row.vat !== undefined ? formatCurrency(row.vat) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-green-600 text-xs">
                              {row.payment !== null && row.payment !== undefined ? formatCurrency(row.payment) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums text-xs">
                              {row.balanceAfter !== null && row.balanceAfter !== undefined ? formatCurrency(row.balanceAfter) : "—"}
                            </TableCell>
                            <TableCell className="text-center py-1">
                              {editingReconRow?.index === index ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={handleReconSave}
                                    disabled={isUpdatingPrices}
                                    title="Lưu thay đổi"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setEditingReconRow(null)}
                                    disabled={isUpdatingPrices}
                                    title="Hủy bỏ"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                (row.documentType === "StockIn" || row.documentType === "Nhập hàng" || row.documentType === "PlateExport" || row.documentType === "Xuất kẽm" || row.documentType === "PrintingExport" || row.documentType === "In gia công" || row.documentType === "DieExport" || row.documentType === "Xuất khuôn") && row.documentNumber && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:text-primary-dark"
                                    disabled={isSearchingStockIn === row.documentNumber}
                                    onClick={() => handleReconStockInEdit(index, row)}
                                    title="Chỉnh sửa đơn giá / thành tiền trực tiếp"
                                  >
                                    {isSearchingStockIn === row.documentNumber ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                      <Pencil className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UpdateStockInPricesDialog
        stockInId={selectedStockInId}
        open={isEditPricesOpen}
        onOpenChange={setIsEditPricesOpen}
      />
    </div>
  );
}
