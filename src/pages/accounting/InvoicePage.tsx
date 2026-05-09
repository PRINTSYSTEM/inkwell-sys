import { Helmet } from "react-helmet-async";
import { useMemo, useState, useRef, useEffect } from "react";
import { FileText, CheckCircle } from "lucide-react";
import { InvoiceList } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import type { OrderResponse } from "@/Schema/order.schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { useInvoices, useExportInvoice } from "@/hooks/use-invoice";
import { formatCurrency } from "@/lib/status-utils";
import { CreateInvoiceFromLinesDialog } from "@/components/accounting";
import { ROUTE_PATHS } from "@/constants";

// Helper to calculate summary stats from orders
const calculateInvoiceStats = (orders: OrderResponse[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoice = {
    notIssued: 0,
    issuedToday: 0,
  };

  orders.forEach((order) => {
    // Invoice stats
    if (order.invoiceStatus === "not_issued") {
      invoice.notIssued++;
    } else if (order.invoiceStatus === "issued" && order.updatedAt) {
      try {
        const updatedDate = new Date(order.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        if (updatedDate.getTime() === today.getTime()) {
          invoice.issuedToday++;
        }
      } catch (e) {
        // Invalid date, skip
      }
    }
  });

  return invoice;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

// Component for "Hóa đơn đã tạo" tab
function CreatedInvoicesTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [isCreateFromLinesDialogOpen, setIsCreateFromLinesDialogOpen] =
    useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoices({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const exportInvoiceMutation = useExportInvoice();

  // Use items directly from API (search is handled server-side)
  const invoices = invoicesData?.items || [];

  const totalPages = invoicesData?.totalPages || 1;
  const totalItems = invoicesData?.total || 0;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when data is actually loaded (not undefined) to avoid resetting during data fetch
  useEffect(() => {
    if (invoicesData && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, invoicesData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [searchQuery, statusFilter]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleViewDetails = (invoiceId: number | undefined) => {
    if (invoiceId) {
      navigate(`${ROUTE_PATHS.ACCOUNTING.INVOICE}/${invoiceId}`);
    }
  };

  const handleExportPDF = async (invoiceId: number | undefined) => {
    if (!invoiceId) return;
    try {
      await exportInvoiceMutation.mutateAsync(invoiceId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRowClick = (invoiceId: number | undefined) => {
    if (invoiceId) {
      navigate(`${ROUTE_PATHS.ACCOUNTING.INVOICE}/${invoiceId}`);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive" className="mb-3">
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
      <div className="flex flex-col sm:flex-row gap-3 shrink-0 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo số HĐ, tên khách, MST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateFromLinesDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo từ dòng hàng
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="issued">Đã xuất</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto rounded-lg border"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="bg-muted/50 h-11">
                <TableHead className="w-[140px] font-bold text-sm">
                  Số hóa đơn
                </TableHead>
                <TableHead className="font-bold text-sm">Người mua</TableHead>
                <TableHead className="text-right font-bold text-sm">
                  Tổng tiền
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center font-bold text-sm">
                  Ngày xuất
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={6} rows={10} rowHeight="h-12" />
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground font-semibold"
                  >
                    Không tìm thấy hóa đơn nào.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="h-12 cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => handleRowClick(invoice.id)}
                  >
                    <TableCell className="font-bold font-mono text-sm">
                      {invoice.invoiceNumber || `#${invoice.id}`}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-sm">
                          {invoice.buyerCompanyName || invoice.buyerName || "—"}
                        </div>
                        {invoice.buyerTaxCode && (
                          <div className="text-xs text-muted-foreground font-medium">
                            MST: {invoice.buyerTaxCode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-sm">
                      {invoice.grandTotal
                        ? formatCurrency(invoice.grandTotal)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {invoice.status ? (
                        <StatusBadge
                          status={invoice.status}
                          label={invoice.statusName || invoice.status}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm font-bold text-muted-foreground">
                      {invoice.issuedAt
                        ? formatDate(invoice.issuedAt)
                        : formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(invoice.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExportPDF(invoice.id)}
                            disabled={exportInvoiceMutation.isPending}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {exportInvoiceMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xuất...
                              </>
                            ) : (
                              "Xuất Excel"
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between shrink-0 pt-4 border-t">
          <p className="text-sm font-semibold text-muted-foreground">
            Hiển thị{" "}
            <span className="font-bold text-foreground">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>
            {" - "}
            <span className="font-bold text-foreground">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-bold text-foreground">{totalItems}</span> hóa
            đơn
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-muted-foreground">
                Trang
              </span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-14 h-8 text-center text-sm font-bold"
                disabled={isLoading}
              />
              <span className="text-sm font-semibold text-muted-foreground">
                / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Invoice From Lines Dialog */}
      <CreateInvoiceFromLinesDialog
        open={isCreateFromLinesDialogOpen}
        onOpenChange={setIsCreateFromLinesDialogOpen}
      />
    </div>
  );
}

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState("orders");

  // Build params for API
  const ordersParams = useMemo(() => {
    return {
      pageNumber: 1,
      pageSize: 100, // Get all orders for stats calculation
      filterType: "invoice",
      status: "",
      orderCode: "",
      designCode: "",
      customerName: "",
      sortColumn: "",
      sortOrder: "",
    };
  }, []);

  // Fetch all orders for accounting to calculate summary stats
  const { data: allOrdersData } = useOrdersForAccounting(ordersParams);

  // Calculate summary stats from orders
  const summaryStats = useMemo(() => {
    if (!allOrdersData?.items) {
      return {
        notIssued: 0,
        issuedToday: 0,
      };
    }
    return calculateInvoiceStats(allOrdersData.items);
  }, [allOrdersData]);

  return (
    <>
      <Helmet>
        <title>Hóa đơn | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý xuất hóa đơn cho đơn hàng in ấn"
        />
      </Helmet>

      <div className="h-full flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {/* Header */}
          <div className="mb-3 shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý xuất hóa đơn cho đơn hàng
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mb-3 shrink-0">
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <FileText className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chưa xuất HĐ</p>
                  <p className="text-xl font-bold">{summaryStats.notIssued}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Xuất hôm nay</p>
                  <p className="text-xl font-bold">
                    {summaryStats.issuedToday}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <TabsList className="w-fit mb-3 shrink-0">
                <TabsTrigger value="orders" className="text-sm">
                  Đơn hàng
                </TabsTrigger>
                <TabsTrigger value="invoices" className="text-sm">
                  Hóa đơn đã tạo
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="orders"
                className="flex-1 mt-0 min-h-0 overflow-hidden"
              >
                <InvoiceList />
              </TabsContent>

              <TabsContent
                value="invoices"
                className="flex-1 mt-0 min-h-0 overflow-hidden"
              >
                <CreatedInvoicesTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
