import { useState, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Search,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from "lucide-react";
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
import { useARSummary } from "@/hooks/use-ar-ap";
import { useArLedgerSummary } from "@/hooks/use-ar-ledger";
import { useExportDebt } from "@/hooks/use-accounting";
import { useExportDebtComparison } from "@/hooks/use-customer";
import { ARCreateReceiptDialog } from "./ARCreateReceiptDialog";
import { formatCurrency } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

export default function ARSummaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Map<number, any>>(new Map());
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const itemsPerPage = 1000;

  const {
    data: arData,
    isLoading,
    isError,
    error,
    refetch,
  } = useARSummary({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    searchTerm: searchQuery || undefined,
  });

  const filteredARItems = useMemo(() => {
    if (!arData?.items) return [];
    return arData.items.filter((item: any) => {
      return (
        (item.openingBalance ?? 0) !== 0 ||
        (item.increase ?? 0) !== 0 ||
        (item.decrease ?? 0) !== 0 ||
        (item.closingBalance ?? 0) !== 0
      );
    });
  }, [arData?.items]);

  const { mutate: exportDebt, loading: isExporting } = useExportDebt();
  const { mutate: exportCustomerDebt } = useExportDebtComparison();
  const [exportingCustomerId, setExportingCustomerId] = useState<number | null>(null);

  const handleExportCustomerDebtExcel = async (customerId: number | undefined) => {
    if (!customerId) return;
    setExportingCustomerId(customerId);
    try {
      await exportCustomerDebt(customerId);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingCustomerId(null);
    }
  };

  const handleExportExcel = async () => {
    await exportDebt({
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      searchTerm: searchQuery || undefined,
    });
  };

  const toggleCustomer = (customerId: number) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const handleSelectOrder = (order: any, customer: any) => {
    const newSelected = new Map(selectedOrders);
    
    if (newSelected.has(order.documentId)) {
      newSelected.delete(order.documentId);
    } else {
      // Check if selecting order from a different customer
      const existingEntries = Array.from(newSelected.values());
      if (existingEntries.length > 0 && existingEntries[0].customerId !== customer.customerId) {
        toast.warning("Chỉ có thể chọn các đơn hàng của cùng một khách hàng để tạo phiếu thu.");
        return;
      }

      newSelected.set(order.documentId, {
        ...order,
        customerId: customer.customerId,
        customerName: customer.customerName || customer.companyName
      });
    }
    setSelectedOrders(newSelected);
  };

  const totals = (arData?.items?.reduce(
    (acc, item) => ({
      opening: (acc as any).opening + (item.openingBalance || 0),
      increase: (acc as any).increase + (item.increase || 0),
      decrease: (acc as any).decrease + (item.decrease || 0),
      closing: (acc as any).closing + (item.closingBalance || 0),
      overdue: (acc as any).overdue + (item.overdue || 0),
    }),
    { opening: 0, increase: 0, decrease: 0, closing: 0, overdue: 0 } as any
  ) || { opening: 0, increase: 0, decrease: 0, closing: 0, overdue: 0 }) as {
    opening: number; increase: number; decrease: number; closing: number; overdue: number;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Dư đầu kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-blue-700">
              {formatCurrency(totals.opening)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-100 bg-orange-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-orange-600 uppercase tracking-wider">
              Phát sinh
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-orange-700">
              {formatCurrency(totals.increase)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 bg-green-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-green-600 uppercase tracking-wider">
              Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(totals.decrease)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-slate-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Dư cuối kỳ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(totals.closing)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-100 bg-red-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wider">
              Quá hạn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-lg font-bold text-red-700">
              {formatCurrency(totals.overdue)}
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
              <input
                type="text"
                placeholder="Tìm mã, tên khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              className="h-9"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? (
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
                className="h-9 bg-green-600 hover:bg-green-700"
                onClick={() => setIsReceiptDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu thu ({selectedOrders.size})
              </Button>
            )}
          </div>
        </div>

        <ARCreateReceiptDialog 
          open={isReceiptDialogOpen}
          onOpenChange={setIsReceiptDialogOpen}
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
                  <TableHead className="w-[120px]">Mã KH</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead className="text-right">Dư đầu kỳ</TableHead>
                  <TableHead className="text-right">Phát sinh</TableHead>
                  <TableHead className="text-right">Thanh toán</TableHead>
                  <TableHead className="text-right">Dư cuối kỳ</TableHead>
                  <TableHead className="text-center w-[80px]">Thao tác</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filteredARItems || filteredARItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mb-2 opacity-20" />
                      <p>Không tìm thấy dữ liệu công nợ trong khoảng thời gian này</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredARItems.map((item, index) => {
                  const isExpanded = item.customerId ? expandedCustomers.has(item.customerId) : false;
                  return (
                    <Fragment key={item.customerId ?? index}>
                      <TableRow 
                        key={item.customerId}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/30",
                          isExpanded && "bg-muted/20 border-b-0"
                        )}
                        onClick={() => item.customerId && toggleCustomer(item.customerId)}
                      >
                        <TableCell className="text-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium font-mono text-xs">
                          {item.customerCode || "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {item.customerName || item.companyName || "—"}
                        </TableCell>
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
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg cursor-pointer"
                            onClick={() => handleExportCustomerDebtExcel(item.customerId)}
                            disabled={exportingCustomerId === item.customerId}
                            title="Xuất Excel đối chiếu công nợ"
                          >
                            {exportingCustomerId === item.customerId ? (
                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && item.customerId && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0 select-none">
                          <TableCell colSpan={8} className="p-3 pl-8 md:pl-12 bg-stone-50/50 dark:bg-stone-900/10">
                            <CustomerDetailRow 
                              customerId={item.customerId}
                              customerName={item.customerName || item.companyName || ""}
                              dateRange={dateRange}
                              selectedOrders={selectedOrders}
                              onSelectOrder={(order) => handleSelectOrder(order, item)}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Container */}
        {arData && filteredARItems.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {filteredARItems.length} khách hàng
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
                Trang {currentPage} / {arData.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.min(arData.totalPages, p + 1))}
                disabled={currentPage === arData.totalPages || isLoading}
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
function CustomerDetailRow({
  customerId,
  customerName,
  dateRange,
  selectedOrders,
  onSelectOrder,
}: {
  customerId: number;
  customerName: string;
  dateRange: DateRange | undefined;
  selectedOrders: Map<number, any>;
  onSelectOrder: (order: any) => void;
}) {
  const navigate = useNavigate();

  const { data: ledgerSummary, isLoading: isLoadingDetail } = useArLedgerSummary(customerId);

  const handleOrderClick = (documentId: number | null | undefined) => {
    if (documentId) {
      navigate(`/accounting/orders/${documentId}`);
    }
  };

  const unpaidItems = useMemo(() => {
    // ledgerSummary.details is an array of ArLedgerResponse
    if (!ledgerSummary?.details) return [];
    return (ledgerSummary.details || []).filter((d: any) => (d.remainingAmount ?? 0) > 0);
  }, [ledgerSummary?.details]);
  // Flatten items so that each item becomes a row in the ledger
  const flatRows = useMemo(() => {
    const rows: Array<{
      key: string;
      detail: any;
      item?: any;
    }> = [];

    // Each ledger row represents a delivered line; normalize to { detail, item }
    unpaidItems.forEach((detail: any) => {
      rows.push({
        key: `${detail.orderId || detail.deliveryNoteId || detail.id}`,
        detail,
        item: {
          code: detail.designCode || detail.deliveryNoteLineId || detail.id,
          name: detail.designName || detail.materialTypeName || "—",
          quantity: detail.deliveredQuantity,
          unitPrice: detail.unitPriceSnapshot,
          totalAmount: detail.lineAmount,
        },
      });
    });

    return rows;
  }, [unpaidItems]);

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground bg-background rounded-lg border border-inner">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs">Đang tải sổ chi tiết công nợ...</span>
      </div>
    );
  }

  if (unpaidItems.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground italic bg-background rounded-lg border border-dashed border-stone-200 dark:border-stone-800">
        Không có giao dịch chưa thanh toán trong kỳ
      </div>
    );
  }


  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-background shadow-sm select-none">
      <Table>
        <TableHeader className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[45px] text-center">Chọn</TableHead>
            <TableHead className="w-[45px] text-center">STT</TableHead>
            <TableHead className="w-[90px] text-center font-bold text-[10px] uppercase tracking-wider">Ngày</TableHead>
            <TableHead className="w-[110px] font-bold text-[10px] uppercase tracking-wider">Mã đơn hàng</TableHead>
            <TableHead className="w-[110px] font-bold text-[10px] uppercase tracking-wider">Mã hàng</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-wider">Tên hàng hóa</TableHead>
            <TableHead className="w-[85px] text-right font-bold text-[10px] uppercase tracking-wider">Số lượng</TableHead>
            <TableHead className="w-[95px] text-right font-bold text-[10px] uppercase tracking-wider">Đơn giá</TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[10px] uppercase tracking-wider">Thành tiền</TableHead>
            <TableHead className="w-[115px] text-right font-bold text-[10px] uppercase tracking-wider text-green-700">Đã thanh toán</TableHead>
            <TableHead className="w-[115px] text-right font-bold text-[10px] uppercase tracking-wider text-red-750">Còn lại</TableHead>
            <TableHead className="w-[100px] font-bold text-[10px] uppercase tracking-wider">Số phiếu</TableHead>
            <TableHead className="w-[110px] font-bold text-[10px] uppercase tracking-wider">Ghi chú</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-stone-100 dark:divide-stone-900">
          {flatRows.map((row, index) => {
            const { detail, item } = row;
            const docKey = detail.orderId ?? detail.deliveryNoteId ?? detail.id;
            const isSelected = selectedOrders.has(docKey);

            const totalAmount = item?.totalAmount ?? detail.lineAmount ?? 0;
            const paid = detail.paidAmount ?? 0;
            const outstanding = detail.remainingAmount ?? 0;

            const orderCode = detail.orderCode ?? "—";
            const deliveryNoteCode = detail.deliveryNoteCode ?? "—";

            return (
              <TableRow
                key={row.key}
                className={cn(
                  "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer",
                  isSelected && "bg-green-50/10 dark:bg-green-950/5 hover:bg-green-50/15"
                )}
                onClick={() => handleOrderClick(detail.documentId)}
              >
                <TableCell className="text-center py-2.5" onClick={(e) => e.stopPropagation()}>
                  {docKey && (
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => onSelectOrder({
                        documentId: docKey,
                        documentNumber: orderCode !== "—" ? orderCode : deliveryNoteCode,
                        outstanding: outstanding,
                      })}
                    />
                  )}
                </TableCell>
                <TableCell className="text-center py-2.5 text-xs text-stone-400 font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="text-center py-2.5 text-xs text-stone-500 font-medium">
                  {detail.documentDate ? formatDate(detail.documentDate) : "—"}
                </TableCell>
                <TableCell className="py-2.5 font-mono text-xs font-bold text-primary/80">
                  {orderCode}
                </TableCell>
                <TableCell className="py-2.5 font-mono text-xs font-semibold text-stone-600 dark:text-stone-400">
                  {item?.code || "—"}
                </TableCell>
                <TableCell className="py-2.5 text-xs font-medium text-stone-800 dark:text-stone-200">
                  {item?.name || "—"}
                </TableCell>
                <TableCell className="text-right py-2.5 text-xs font-medium tabular-nums">
                  {item?.quantity !== undefined ? item.quantity.toLocaleString("vi-VN") : "—"}
                </TableCell>
                <TableCell className="text-right py-2.5 text-xs font-medium text-stone-500 tabular-nums">
                  {item?.unitPrice !== undefined ? formatCurrency(item.unitPrice) : "—"}
                </TableCell>
                <TableCell className="text-right py-2.5 text-xs font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatCurrency(totalAmount)}
                </TableCell>
                <TableCell className="text-right py-2.5 text-xs font-medium text-green-750 tabular-nums">
                  {paid > 0 ? formatCurrency(paid) : "0"}
                </TableCell>
                <TableCell className="text-right py-2.5">
                  {outstanding > 0 ? (
                    <Badge variant="outline" className="text-xs font-bold border-red-200 text-red-650 bg-red-50/50 hover:bg-red-50/50">
                      {formatCurrency(outstanding)}
                    </Badge>
                  ) : (
                    "0"
                  )}
                </TableCell>
                <TableCell className="py-2.5 font-mono text-xs font-bold text-stone-500">
                  {deliveryNoteCode}
                </TableCell>
                <TableCell className="py-2.5 text-xs text-stone-500 max-w-[150px] truncate" title={detail.notes || ""}>
                  {detail.notes || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
