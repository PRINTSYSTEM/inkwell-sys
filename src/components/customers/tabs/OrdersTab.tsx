import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useCustomerOrders } from "@/hooks/use-customer";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  orderStatusLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";

interface OrdersTabProps {
  customerId: number;
  isActive?: boolean;
}

const ORDER_STATUSES = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed_for_printing", label: "Đã xác nhận" },
  { value: "waiting_for_deposit", label: "Chờ đặt cọc" },
  { value: "deposit_received", label: "Đã nhận cọc" },
  { value: "in_production", label: "Đang sản xuất" },
  { value: "production_completed", label: "Hoàn thành SX" },
  { value: "invoice_issued", label: "Đã xuất HĐ" },
  { value: "delivering", label: "Đang giao" },
  { value: "waiting_for_redelivery", label: "Chờ giao lại" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export function OrdersTab({ customerId, isActive = true }: OrdersTabProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(String(page));
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  const handleOpenOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderDialogOpen(true);
  };

  const { data, isLoading } = useCustomerOrders({
    customerId,
    pageNumber: page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
    enabled: isActive,
  });

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
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
                  <TableHead className="text-xs">Mã đơn</TableHead>
                  <TableHead className="text-xs">Trạng thái</TableHead>
                  <TableHead className="text-xs text-right">Thanh toán</TableHead>
                  <TableHead className="text-xs text-right">Tổng cộng trước VAT</TableHead>
                  <TableHead className="text-xs text-right">Tổng cộng sau VAT</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((order) => {
                  const orderId = order.orderId || 0;
                  const totalBeforeVat = order.totalAmount ?? 0;
                  const totalAfterVat = Math.round(totalBeforeVat * 1.08);

                  return (
                    <TableRow
                      key={orderId}
                      className="hover:bg-muted/50 cursor-pointer text-xs"
                      onClick={() => handleOpenOrder(orderId)}
                    >
                      <TableCell className="font-mono font-bold text-slate-900 dark:text-stone-100">
                        {order.orderCode || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={order.status || ""}
                          label={
                            orderStatusLabels[order.status || ""] ||
                            order.statusName ||
                            order.status ||
                            "N/A"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-green-600 font-medium">
                        {formatCurrency(order.paidAmount || order.depositAmount || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-slate-700 dark:text-stone-300">
                        {totalBeforeVat > 0 ? formatCurrency(totalBeforeVat) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-slate-900 dark:text-stone-100">
                        {totalBeforeVat > 0 ? formatCurrency(totalAfterVat) : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrder(orderId);
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
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                    >
                      Chưa có đơn hàng nào
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
            <span className="font-bold text-stone-900 dark:text-stone-100">{data.total}</span> đơn hàng
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

      <OrderDetailDialog
        orderId={selectedOrderId}
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
      />
    </div>
  );
}
