import { useState } from "react";
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
import { useARSummary, useARDetail, useExportARSummary } from "@/hooks/use-ar-ap";
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
  const itemsPerPage = 10;

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

  const { mutate: exportSummary, isPending: isExporting } = useExportARSummary();

  const handleExportExcel = async () => {
    await exportSummary({
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

  const totals = arData?.items?.reduce(
    (acc, item) => ({
      opening: acc.opening + (item.openingBalance || 0),
      increase: acc.increase + (item.increase || 0),
      decrease: acc.decrease + (item.decrease || 0),
      closing: acc.closing + (item.closingBalance || 0),
      overdue: acc.overdue + (item.overdue || 0),
    }),
    { opening: 0, increase: 0, decrease: 0, closing: 0, overdue: 0 }
  ) || { opening: 0, increase: 0, decrease: 0, closing: 0, overdue: 0 };

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
                <TableHead className="text-right w-[150px]">Quá hạn</TableHead>
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
              ) : !arData?.items || arData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mb-2 opacity-20" />
                      <p>Không tìm thấy dữ liệu công nợ trong khoảng thời gian này</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                arData.items.map((item) => {
                  const isExpanded = item.customerId ? expandedCustomers.has(item.customerId) : false;
                  return (
                    <>
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
                      </TableRow>
                      {isExpanded && item.customerId && (
                        <>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-0">
                            <TableHead className="w-[40px] text-center">
                              {/* Select All checkbox can be added here if needed */}
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
                              VAT
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Phải thu
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Đã thu
                            </TableHead>
                            <TableHead className="text-right font-bold text-[10px] uppercase text-muted-foreground">
                              Còn lại
                            </TableHead>
                          </TableRow>
                          <CustomerDetailRow 
                            customerId={item.customerId}
                            customerName={item.customerName || item.companyName || ""}
                            dateRange={dateRange}
                            selectedOrders={selectedOrders}
                            onSelectOrder={(order) => handleSelectOrder(order, item)}
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
        {arData && arData.totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hiển thị {arData.items?.length || 0} / {arData.total} khách hàng
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

  const { data: detailData, isLoading: isLoadingDetail } = useARDetail({
    customerId: customerId,
    fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  });

  const handleOrderClick = (documentId: number | null | undefined) => {
    if (documentId) {
      navigate(`/accounting/orders/${documentId}`);
    }
  };

  if (isLoadingDetail) {
    return (
      <TableRow className="bg-muted/10">
        <TableCell colSpan={9}>
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Đang tải chi tiết giao dịch...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!detailData?.items || detailData.items.length === 0) {
    return (
      <TableRow className="bg-muted/10">
        <TableCell colSpan={9} className="text-center py-4 text-xs text-muted-foreground italic">
          Không có giao dịch chi tiết trong kỳ
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {detailData.items.map((detail, index) => (
        <TableRow
          key={detail.documentId || index}
          className={cn(
            "bg-muted/5 hover:bg-muted/15 cursor-pointer border-l-2",
            selectedOrders.has(detail.documentId) ? "border-l-green-500 bg-green-50/10" : "border-l-primary/30"
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
          <TableCell colSpan={2} className="pl-12">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary/80">{detail.documentNumber || "—"}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{detail.documentType || "Hóa đơn"}</span>
            </div>
          </TableCell>
          <TableCell className="text-center text-xs font-medium">
            {detail.documentDate ? formatDate(detail.documentDate) : "—"}
          </TableCell>
          <TableCell className="text-center text-xs font-medium">
            {detail.dueDate ? formatDate(detail.dueDate) : "—"}
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums text-[10px] text-muted-foreground">
            {(detail as any).vatAmount !== undefined && (detail as any).vatAmount > 0 ? formatCurrency((detail as any).vatAmount) : "—"}
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
        </TableRow>
      ))}
    </>
  );
}
