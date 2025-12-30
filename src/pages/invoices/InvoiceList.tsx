import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { useInvoices, useExportInvoice } from "@/hooks/use-invoice";
import { formatCurrency } from "@/lib/status-utils";
import { CreateInvoiceFromLinesDialog } from "@/components/accounting";
import { Plus } from "lucide-react";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
};

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateFromLinesDialogOpen, setIsCreateFromLinesDialogOpen] =
    useState(false);
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

  // Filter invoices client-side for search
  const filteredInvoices = useMemo(() => {
    if (!invoicesData?.items) return [];
    if (!searchQuery) {
      return invoicesData.items.filter((invoice) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
          invoice.buyerName?.toLowerCase().includes(searchLower) ||
          invoice.buyerCompanyName?.toLowerCase().includes(searchLower) ||
          invoice.buyerTaxCode?.toLowerCase().includes(searchLower)
        );
      });
    }
    return invoicesData.items;
  }, [invoicesData?.items, searchQuery]);

  const handleViewDetails = (invoiceId: number | undefined) => {
    if (invoiceId) {
      navigate(`/invoices/${invoiceId}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh sách hóa đơn</h1>
        <p className="text-muted-foreground">
          Quản lý và xem tất cả hóa đơn đã tạo
        </p>
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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[140px]">Số hóa đơn</TableHead>
              <TableHead>Người mua</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Ngày xuất</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy hóa đơn nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="group">
                  <TableCell className="font-medium font-mono text-sm">
                    {invoice.invoiceNumber || `#${invoice.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {invoice.buyerCompanyName || invoice.buyerName || "—"}
                      </div>
                      {invoice.buyerTaxCode && (
                        <div className="text-xs text-muted-foreground">
                          MST: {invoice.buyerTaxCode}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
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
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {invoice.issuedAt
                      ? formatDate(invoice.issuedAt)
                      : formatDate(invoice.createdAt)}
                  </TableCell>
                  <TableCell>
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

      {/* Pagination */}
      {invoicesData && invoicesData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {currentPage} / {invoicesData.totalPages} (
            {invoicesData.total} hóa đơn)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {invoicesData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(invoicesData.totalPages, p + 1))
              }
              disabled={currentPage === invoicesData.totalPages || isLoading}
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
