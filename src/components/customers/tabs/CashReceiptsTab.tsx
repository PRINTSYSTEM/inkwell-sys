import { useState, useEffect } from "react";
import { Search, ExternalLink, Receipt, ChevronLeft, ChevronRight, Plus, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCashReceiptDialog } from "@/components/customers/CreateCashReceiptDialog";
import { CashReceiptDetailDialog } from "@/components/accounting/CashReceiptDetailDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCashReceipts } from "@/hooks/use-cash";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/status-utils";

interface CashReceiptsTabProps {
  customerId: number;
  isActive?: boolean;
}

const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <StatusBadge status="unknown" label="—" />;

  const statusLower = status.toLowerCase();
  if (statusLower.includes("draft") || statusLower === "draft") {
    return <StatusBadge status="draft" label="Nháp" />;
  }
  if (statusLower.includes("approved") || statusLower === "approved") {
    return <StatusBadge status="approved" label="Đã duyệt" />;
  }
  if (statusLower.includes("posted") || statusLower === "posted") {
    return <StatusBadge status="posted" label="Đã hạch toán" />;
  }
  if (statusLower.includes("cancelled") || statusLower === "cancelled") {
    return <StatusBadge status="cancelled" label="Đã hủy" />;
  }
  return <StatusBadge status={status} label={status} />;
};

export function CashReceiptsTab({ customerId, isActive = true }: CashReceiptsTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(String(page));
  const pageSize = 10;
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  const { data, isLoading } = useCashReceipts(
    {
      pageNumber: page,
      pageSize: pageSize,
      customerId: customerId,
      q: search || undefined,
      sortColumn: "VoucherDate",
      sortOrder: "desc",
    } as any,
  );

  const handlePageInputSubmit = () => {
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && data) {
      const validPage = Math.max(1, Math.min(data.totalPages || 1, p));
      setPage(validPage);
      setInputPage(String(validPage));
    } else {
      setInputPage(String(page));
    }
  };

  const receiptsList = data?.items || [];
  const rawTotal = (data as any)?.totalCount ?? (data as any)?.total ?? receiptsList.length;
  const totalCount: number = typeof rawTotal === "number" ? rawTotal : Number(rawTotal || 0);
  const totalPages: number = data?.totalPages || Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Filters & Actions Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm số phiếu, người nộp, lý do..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9 text-sm bg-background"
          />
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-9 text-xs font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo phiếu thu
        </Button>
      </div>

      {/* Receipts Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="max-h-[520px] overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table className="[&_td]:py-2.5 [&_td]:px-3 [&_th]:py-2.5 [&_th]:px-3">
              <TableHeader className="sticky top-0 bg-slate-50 dark:bg-stone-900 border-b z-10">
                <TableRow>
                  <TableHead className="text-xs font-bold w-[120px]">Số phiếu</TableHead>
                  <TableHead className="text-xs font-bold w-[110px]">Ngày CT</TableHead>
                  <TableHead className="text-xs font-bold min-w-[140px]">Người nộp</TableHead>
                  <TableHead className="text-xs font-bold min-w-[160px]">Lý do thu</TableHead>
                  <TableHead className="text-xs font-bold w-[130px]">Phương thức</TableHead>
                  <TableHead className="text-xs font-bold text-right w-[130px]">Số tiền</TableHead>
                  <TableHead className="text-xs font-bold w-[120px]">Trạng thái</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptsList.map((receipt) => {
                  const receiptId = receipt.id || 0;
                  const formattedDate = receipt.voucherDate ? formatDate(receipt.voucherDate) : "—";

                  return (
                    <TableRow
                      key={receiptId}
                      className="hover:bg-slate-50/70 dark:hover:bg-stone-850/50 cursor-pointer text-xs"
                      onClick={() => {
                        setSelectedReceiptId(receiptId);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-mono font-bold text-slate-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{receipt.code || `#${receiptId}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-stone-300">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-stone-100">
                        {receipt.payerName || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-stone-300 truncate max-w-[200px]">
                        {receipt.reason || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-stone-300">
                        {receipt.paymentMethodName || "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(receipt.amount || 0)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptId(receiptId);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500 hover:text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!receiptsList.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-12"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-8 w-8 opacity-20 text-emerald-600" />
                        <p className="font-medium">Chưa có phiếu thu nào cho khách hàng này</p>
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
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-600 dark:text-stone-400 font-medium">
            Trang <span className="font-bold text-slate-900 dark:text-stone-100">{page}</span> /{" "}
            {totalPages} • Hiển thị{" "}
            <span className="font-bold text-slate-900 dark:text-stone-100">{totalCount}</span> phiếu thu
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-stone-800 rounded-lg border border-slate-200 dark:border-stone-700">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageInputSubmit();
                }}
                onBlur={handlePageInputSubmit}
                className="w-10 h-6 text-center font-bold text-xs bg-white dark:bg-stone-900 border border-slate-300 dark:border-stone-600 rounded text-slate-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Nhập số trang và nhấn Enter để chuyển nhanh"
              />
              <span className="text-xs font-bold text-slate-500 dark:text-stone-400">
                / {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
              title="Trang tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateCashReceiptDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        customerId={customerId}
        onSuccess={(id) => {
          setSelectedReceiptId(id);
          setIsDetailDialogOpen(true);
        }}
      />

      <CashReceiptDetailDialog
        receiptId={selectedReceiptId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  );
}
