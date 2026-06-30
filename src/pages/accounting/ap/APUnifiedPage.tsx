import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAPSummary, useAPSummaryReport, useAPDetail, useExportAPSummary, useExportAPDetailLedger } from "@/hooks/use-ar-ap";
import { APCreatePaymentDialog } from "./APCreatePaymentDialog";
import { formatCurrency } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { APVendorExportButton } from "./APVendorExportButton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function APUnifiedPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedVendors, setExpandedVendors] = useState<Set<number>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Map<number, any>>(new Map());
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const itemsPerPage = 1000;
  const isReport = true;

  const {
    data: apReportData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAPSummaryReport({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    searchTerm: searchQuery || undefined,
  });

  const apData = apReportData;

  const filteredAPItems = useMemo(() => {
    if (!apData?.items) return [];
    return apData.items.filter((item: any) => {
      return (
        (item.openingDebit ?? 0) !== 0 ||
        (item.openingCredit ?? 0) !== 0 ||
        (item.periodDebit ?? 0) !== 0 ||
        (item.periodCredit ?? 0) !== 0 ||
        (item.closingDebit ?? 0) !== 0 ||
        (item.closingCredit ?? 0) !== 0
      );
    });
  }, [apData?.items]);

  const { mutate: exportSummary, loading: isExportingSummary } = useExportAPSummary();

  const handleExportExcel = async () => {
    await exportSummary({
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      searchTerm: searchQuery || undefined,
    });
  };

  const toggleVendor = (vendorId: number) => {
    const newExpanded = new Set(expandedVendors);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedVendors(newExpanded);
  };

  const handleSelectOrder = (order: any, vendor: any) => {
    const newSelected = new Map(selectedOrders);
    
    if (newSelected.has(order.documentId)) {
      newSelected.delete(order.documentId);
    } else {
      // Check if selecting order from a different vendor
      const existingEntries = Array.from(newSelected.values());
      if (existingEntries.length > 0 && existingEntries[0].vendorId !== vendor.vendorId) {
        toast.warning("Chỉ có thể chọn các đơn hàng của cùng một nhà cung cấp để tạo phiếu chi.");
        return;
      }

      newSelected.set(order.documentId, {
        ...order,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName
      });
    }
    setSelectedOrders(newSelected);
  };

  const reportTotals = (apReportData?.items?.reduce(
    (acc, item) => ({
      openingDebit: acc.openingDebit + (item.openingDebit || 0),
      openingCredit: acc.openingCredit + (item.openingCredit || 0),
      periodDebit: acc.periodDebit + (item.periodDebit || 0),
      periodCredit: acc.periodCredit + (item.periodCredit || 0),
      closingDebit: acc.closingDebit + (item.closingDebit || 0),
      closingCredit: acc.closingCredit + (item.closingCredit || 0),
    }),
    { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 }
  ) || { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="shadow-sm border-blue-100 bg-blue-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Dư đầu kỳ (Nợ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(reportTotals.openingDebit)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-100 bg-blue-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Dư đầu kỳ (Có)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(reportTotals.openingCredit)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-orange-100 bg-orange-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-orange-600 uppercase tracking-wider">
                Phát sinh (Nợ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-orange-700">
                {formatCurrency(reportTotals.periodDebit)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-orange-100 bg-orange-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-orange-600 uppercase tracking-wider">
                Phát sinh (Có)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-orange-700">
                {formatCurrency(reportTotals.periodCredit)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 bg-slate-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Dư cuối kỳ (Nợ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(reportTotals.closingDebit)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 bg-slate-50/30">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Dư cuối kỳ (Có)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(reportTotals.closingCredit)}
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-background rounded-xl border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b bg-muted/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã, tên nhà cung cấp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <DateRangePicker 
              value={dateRange} 
              onValueChange={setDateRange}
              className="w-[280px]"
            />
            
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingSummary}
              className="h-9"
            >
              {isExportingSummary ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất Excel
            </Button>
            {selectedOrders.size > 0 && (
              <Button
                variant="default"
                size="sm"
                className="h-9 bg-orange-600 hover:bg-orange-700"
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu chi ({selectedOrders.size})
              </Button>
            )}
          </div>
        </div>

        <APCreatePaymentDialog 
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          selectedOrders={selectedOrders}
          onSuccess={() => {
            setSelectedOrders(new Map());
            refetch();
          }}
        />

        {/* Error Alert */}
        {isError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">Mã NCC</TableHead>
                <TableHead>Tên nhà cung cấp</TableHead>
                {!isReport ? (
                  <>
                    <TableHead className="text-right">Dư đầu kỳ</TableHead>
                    <TableHead className="text-right">Phát sinh</TableHead>
                    <TableHead className="text-right">Thanh toán</TableHead>
                    <TableHead className="text-right">Dư cuối kỳ</TableHead>
                    <TableHead className="text-right">Quá hạn</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">Đầu kỳ (Nợ)</TableHead>
                    <TableHead className="text-right">Đầu kỳ (Có)</TableHead>
                    <TableHead className="text-right">Phát sinh (Nợ)</TableHead>
                    <TableHead className="text-right">Phát sinh (Có)</TableHead>
                    <TableHead className="text-right">Cuối kỳ (Nợ)</TableHead>
                    <TableHead className="text-right">Cuối kỳ (Có)</TableHead>
                  </>
                )}
                <TableHead className="text-center w-[80px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isReport ? 10 : 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filteredAPItems || filteredAPItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isReport ? 10 : 9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mb-2 opacity-20" />
                      <p>Không tìm thấy dữ liệu công nợ trong khoảng thời gian này</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAPItems.map((item: any) => {
                  const isExpanded = item.vendorId ? expandedVendors.has(item.vendorId) : false;
                  return (
                    <>
                      <TableRow 
                        key={item.vendorId}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/30",
                          isExpanded && "bg-muted/20 border-b-0"
                        )}
                        onClick={() => item.vendorId && toggleVendor(item.vendorId)}
                      >
                        <TableCell className="text-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium font-mono text-xs">
                          {item.vendorCode || "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {item.vendorName || "—"}
                        </TableCell>
                        {!isReport ? (
                          <>
                            <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                              {item.openingBalance !== undefined ? formatCurrency(item.openingBalance) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-orange-600 font-medium">
                              {item.increase !== undefined ? formatCurrency(item.increase) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-green-600 font-medium">
                              {item.decrease !== undefined ? formatCurrency(item.decrease) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums text-sm">
                              {item.closingBalance !== undefined ? formatCurrency(item.closingBalance) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.overdue !== undefined && item.overdue > 0 ? (
                                <Badge variant="destructive" className="font-medium">
                                  {formatCurrency(item.overdue)}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                              {item.openingDebit !== undefined ? formatCurrency(item.openingDebit) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                              {item.openingCredit !== undefined ? formatCurrency(item.openingCredit) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-orange-600 font-medium">
                              {item.periodDebit !== undefined ? formatCurrency(item.periodDebit) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-green-600 font-medium">
                              {item.periodCredit !== undefined ? formatCurrency(item.periodCredit) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums text-sm">
                              {item.closingDebit !== undefined ? formatCurrency(item.closingDebit) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums text-sm">
                              {item.closingCredit !== undefined ? formatCurrency(item.closingCredit) : "—"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-center">
                          {(item.vendorId || (item as any).id) && (
                            <APVendorExportButton 
                              vendorId={item.vendorId || (item as any).id} 
                              vendorName={item.vendorName || ""} 
                              defaultDateRange={dateRange}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && item.vendorId && (
                        <>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-0">
                            <TableHead className="w-[40px] text-center">
                              {/* Select All can be added here */}
                            </TableHead>
                            <TableHead colSpan={2} className="pl-12 font-bold text-[10px] uppercase text-muted-foreground">
                              Số chứng từ / Loại
                            </TableHead>
                            <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground">
                              Ngày CT
                            </TableHead>
                            <TableHead className="text-center font-bold text-[10px] uppercase text-muted-foreground">
                              Hạn trả
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Số tiền mua
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Đã trả
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Còn nợ
                            </TableHead>
                            <TableHead colSpan={isReport ? 3 : 2}></TableHead>
                          </TableRow>
                          <VendorDetailRow 
                            vendorId={item.vendorId}
                            vendorName={item.vendorName || ""}
                            dateRange={dateRange}
                            selectedOrders={selectedOrders}
                            onSelectOrder={(order) => handleSelectOrder(order, item)}
                            colSpan={isReport ? 10 : 9}
                          />
                        </>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Container */}
        {apData && filteredAPItems.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {filteredAPItems.length} nhà cung cấp
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-medium bg-background border px-3 py-1.5 rounded-md min-w-[80px] text-center">
                Trang {currentPage} / {apData.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.min(apData.totalPages, p + 1))}
                disabled={currentPage === apData.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component render chi tiết giao dịch khi mở rộng dòng
function VendorDetailRow({
  vendorId,
  vendorName,
  dateRange,
  selectedOrders,
  onSelectOrder,
  colSpan = 9,
}: {
  vendorId: number;
  vendorName: string;
  dateRange: DateRange | undefined;
  selectedOrders: Map<number, any>;
  onSelectOrder: (order: any) => void;
  colSpan?: number;
}) {
  const navigate = useNavigate();

  const { data: detailData, isLoading: isLoadingDetail } = useAPDetail({
    vendorId: vendorId,
    fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    pageSize: 50, // Lấy nhiều record hơn khi xem chi tiết
  });

  const handleOrderClick = (documentId: number | null | undefined) => {
    if (documentId) {
      // Giả sử chuyển hướng đến trang chi tiết hóa đơn mua hàng/đơn hàng
      navigate(`/accounting/ap-orders/${documentId}`);
    }
  };

  const unpaidItems = useMemo(() => {
    if (!detailData?.items) return [];
    return detailData.items.filter((detail: any) => (detail.outstanding ?? 0) > 0);
  }, [detailData?.items]);

  if (isLoadingDetail) {
    return (
      <TableRow className="bg-muted/10">
        <TableCell colSpan={colSpan}>
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Đang tải chi tiết giao dịch...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (unpaidItems.length === 0) {
    return (
      <TableRow className="bg-muted/10">
        <TableCell colSpan={colSpan} className="text-center py-4 text-xs text-muted-foreground italic">
          Không có giao dịch chưa thanh toán trong kỳ
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {unpaidItems.map((detail, index) => (
        <TableRow
          key={detail.documentId || index}
          className={cn(
            "bg-muted/5 hover:bg-muted/15 cursor-pointer border-l-2",
            selectedOrders.has(detail.documentId) ? "border-l-orange-500 bg-orange-50/10" : "border-l-primary/30"
          )}
          onClick={() => handleOrderClick(detail.documentId)}
        >
          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
            {detail.documentId && (
              <Checkbox 
                checked={selectedOrders.has(detail.documentId)}
                onCheckedChange={() => onSelectOrder(detail)}
              />
            )}
          </TableCell>
          <TableCell colSpan={2} className="pl-12 py-3">
            <div className="flex flex-col space-y-2">
              <div>
                <span className="font-bold text-sm text-primary/80">{detail.documentNumber || "—"}</span>
                <span className="text-[10px] text-muted-foreground uppercase ml-2">({detail.documentType || "Hóa đơn"})</span>
              </div>
              {detail.items && detail.items.length > 0 && (
                <div className="max-w-md mt-1 border rounded-lg overflow-hidden bg-background/50 shadow-sm">
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
                      {detail.items.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/10">
                          <TableCell className="text-[11px] font-mono py-1 px-2">{item.code || "—"}</TableCell>
                          <TableCell className="text-[11px] font-medium py-1 px-2 max-w-[120px] truncate" title={item.name || ""}>{item.name || "—"}</TableCell>
                          <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums">{item.quantity ?? 0}</TableCell>
                          <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums text-muted-foreground">{formatCurrency(item.unitPrice ?? 0)}</TableCell>
                          <TableCell className="text-[11px] py-1 px-2 text-right tabular-nums font-semibold">{formatCurrency(item.totalAmount ?? 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="text-center text-xs font-medium">
            {detail.documentDate ? formatDate(detail.documentDate) : "—"}
          </TableCell>
          <TableCell className="text-center text-xs font-medium">
            {detail.dueDate ? formatDate(detail.dueDate) : "—"}
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums text-xs">
            {detail.amountDue !== undefined ? formatCurrency(detail.amountDue) : "—"}
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums text-xs text-green-600">
            {detail.amountPaid !== undefined ? formatCurrency(detail.amountPaid) : "—"}
          </TableCell>
          <TableCell className="text-right">
            {detail.outstanding !== undefined && detail.outstanding > 0 ? (
              <Badge variant="outline" className="text-[10px] h-5 bg-background font-bold border-red-200 text-red-600">
                {formatCurrency(detail.outstanding)}
              </Badge>
            ) : (
              "—"
            )}
          </TableCell>
          <TableCell colSpan={colSpan - 8}></TableCell>
        </TableRow>
      ))}
    </>
  );
}
