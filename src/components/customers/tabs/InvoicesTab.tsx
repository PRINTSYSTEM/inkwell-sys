import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateInvoiceFromLinesDialog } from "@/components/accounting/CreateInvoiceFromLinesDialog";
import { InvoiceDetailDialog } from "@/components/invoices/InvoiceDetailDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [inputPage, setInputPage] = useState(String(page));
  const pageSize = 10;
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

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

  const handlePageInputSubmit = () => {
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && data) {
      const validPage = Math.max(1, Math.min(data.totalPages, p));
      setPage(validPage);
      setInputPage(String(validPage));
    } else {
      setInputPage(String(page));
    }
  };

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
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[520px] overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Số HĐ</TableHead>
                  <TableHead className="text-xs">Ngày tạo</TableHead>
                  <TableHead className="text-xs">Trạng thái</TableHead>
                  <TableHead className="text-xs text-right">VAT 8%</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((invoice) => {
                  const invoiceId = invoice.id || 0;
                  const vatAmount = invoice.vatAmount ?? invoice.taxAmount ?? 0;
                  const invoiceDate = invoice.issuedAt && !invoice.issuedAt.startsWith("0001-01-01")
                    ? formatDate(invoice.issuedAt)
                    : (invoice.createdAt ? formatDate(invoice.createdAt) : "-");

                  return (
                    <TableRow
                      key={invoiceId}
                      className="hover:bg-muted/50 cursor-pointer text-xs"
                      onClick={() => {
                        setSelectedInvoiceId(invoiceId);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-mono font-bold text-slate-900 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                          {invoice.invoiceNumber || `HĐ #${invoiceId}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoiceDate}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-stone-100">
                        {vatAmount > 0 ? formatCurrency(vatAmount) : "0"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoiceId(invoiceId);
                            setIsDetailDialogOpen(true);
                          }}
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
                      colSpan={5}
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

      {/* Pagination - Input page box style */}
      {data && (data.totalPages > 1 || data.total > 0) && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Trang <span className="font-bold text-stone-900 dark:text-stone-100">{page}</span> /{" "}
            {data.totalPages || 1} • Hiển thị{" "}
            <span className="font-bold text-stone-900 dark:text-stone-100">{data.total}</span> hóa đơn
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0 border-stone-200"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
              <input
                type="number"
                min={1}
                max={data.totalPages || 1}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageInputSubmit();
                }}
                onBlur={handlePageInputSubmit}
                className="w-10 h-6 text-center font-bold text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Nhập số trang và nhấn Enter để chuyển nhanh"
              />
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                / {data.totalPages || 1}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= (data.totalPages || 1)}
              className="h-8 w-8 p-0 border-stone-200"
              title="Trang tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateInvoiceFromLinesDialog
        open={isCreateInvoiceOpen}
        onOpenChange={setIsCreateInvoiceOpen}
        customerId={customerId}
        onInvoiceCreated={(id) => {
          setSelectedInvoiceId(id);
          setIsDetailDialogOpen(true);
        }}
      />

      <InvoiceDetailDialog
        invoiceId={selectedInvoiceId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
