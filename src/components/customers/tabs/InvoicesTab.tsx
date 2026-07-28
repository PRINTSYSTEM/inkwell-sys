import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, Package, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateInvoiceFromLinesDialog } from "@/components/accounting/CreateInvoiceFromLinesDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useInvoices } from "@/hooks/use-invoice";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  invoiceStatusLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";

interface InvoicesTabProps {
  customerId: number;
  isActive?: boolean;
}

export function InvoicesTab({ customerId, isActive = true }: InvoicesTabProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useInvoices(
    {
      PageNumber: page,
      PageSize: pageSize,
      CustomerId: customerId,
      Search: search || undefined,
      SortColumn: "CreatedAt",
      SortOrder: "desc",
    },
    isActive
  );

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm số hoá đơn, mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Button 
          onClick={() => setIsCreateInvoiceOpen(true)}
          className="h-9 text-xs font-semibold cursor-pointer"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Xuất hóa đơn
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="max-h-[400px] overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Số HĐ</TableHead>
                  <TableHead className="text-xs">Mã đơn</TableHead>
                  <TableHead className="text-xs">Ngày tạo</TableHead>
                  <TableHead className="text-xs">Trạng thái</TableHead>
                  <TableHead className="text-xs text-right">Tổng tiền</TableHead>
                  <TableHead className="text-xs text-right">Đã trả</TableHead>
                  <TableHead className="text-xs text-right">Còn lại</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((invoice) => {
                  const invoiceId = invoice.id || 0;
                  const totalAmount = invoice.grandTotal ?? 0;
                  const paidAmount = invoice.paidAmount ?? 0;
                  const remainingAmount = invoice.remainingDebt ?? (totalAmount - paidAmount);
                  const orderCodes = invoice.orders?.map((o) => o.orderCode).filter(Boolean).join(", ") || "-";
                  const invoiceDate = invoice.issuedAt && !invoice.issuedAt.startsWith("0001-01-01")
                    ? formatDate(invoice.issuedAt)
                    : (invoice.createdAt ? formatDate(invoice.createdAt) : "-");

                  return (
                    <TableRow
                      key={invoiceId}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/accounting/invoice/${invoiceId}`)}
                    >
                      <TableCell className="text-xs font-mono font-medium">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3 w-3 text-muted-foreground" />
                          {invoice.invoiceNumber || `HĐ #${invoiceId}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {orderCodes}
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoiceDate}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge
                          status={invoice.status || ""}
                          label={
                            invoiceStatusLabels[invoice.status || ""] ||
                            invoice.statusName ||
                            invoice.status ||
                            "N/A"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums">
                        {formatCurrency(totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-green-600">
                        {formatCurrency(paidAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums text-amber-600">
                        {remainingAmount > 0
                          ? formatCurrency(remainingAmount)
                          : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigate(`/accounting/invoice/${invoiceId}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-12"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 opacity-20" />
                        <p>Chưa có hoá đơn nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, data.total)} / {data.total}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={page === pageNum}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  className={
                    page === data.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <CreateInvoiceFromLinesDialog
        open={isCreateInvoiceOpen}
        onOpenChange={setIsCreateInvoiceOpen}
        customerId={customerId}
      />
    </div>
  );
}
