import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ExternalLink, ChevronDown, ChevronRight, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCustomerOrders } from "@/hooks/use-customer";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  orderStatusLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";

interface OrdersTabProps {
  customerId: number;
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
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export function OrdersTab({ customerId }: OrdersTabProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const pageSize = 10;

  const toggleExpand = (orderId: number) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const { data, isLoading } = useCustomerOrders({
    customerId,
    pageNumber: page,
    pageSize,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

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
                  <TableHead className="text-xs w-[32px]"></TableHead>
                  <TableHead className="text-xs">Số HĐ</TableHead>
                  <TableHead className="text-xs">Mã đơn</TableHead>
                  <TableHead className="text-xs">Trạng thái</TableHead>
                  <TableHead className="text-xs text-right">Tiền hàng</TableHead>
                  <TableHead className="text-xs text-right">Thanh toán</TableHead>
                  <TableHead className="text-xs text-right">Tổng nợ</TableHead>
                  <TableHead className="text-xs">Hạn thanh toán</TableHead>
                  <TableHead className="text-xs w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((order) => {
                  const orderId = order.orderId || 0;
                  const remainingAmount = order.remainingAmount ?? 0;
                  const paymentDueDate = order.paymentDueDate;
                  const isOverdue = order.isPaymentOverdue;
                  const isExpanded = expandedOrders.has(orderId);
                  const hasDetails = order.details && order.details.length > 0;

                  return (
                    <>
                      <TableRow
                        key={orderId}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="p-1">
                          {hasDetails ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(orderId);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                        </TableCell>
                        <TableCell 
                          className="text-xs font-mono cursor-pointer"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {order.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell 
                          className="text-xs font-mono font-medium cursor-pointer"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {order.orderCode || "-"}
                        </TableCell>
                        <TableCell 
                          className="text-xs cursor-pointer"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          <StatusBadge
                            status={order.status || ""}
                            label={
                              order.statusName ||
                              orderStatusLabels[order.status || ""] ||
                              order.status ||
                              "N/A"
                            }
                          />
                        </TableCell>
                        <TableCell 
                          className="text-xs text-right font-medium tabular-nums cursor-pointer"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {formatCurrency(order.totalAmount || 0)}
                        </TableCell>
                        <TableCell 
                          className="text-xs text-right tabular-nums text-green-600 cursor-pointer"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {formatCurrency(order.paidAmount || order.depositAmount || 0)}
                        </TableCell>
                        <TableCell
                          className={`text-xs text-right font-medium tabular-nums cursor-pointer ${
                            remainingAmount > 0
                              ? isOverdue
                                ? "text-destructive font-semibold"
                                : "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {remainingAmount > 0
                            ? formatCurrency(remainingAmount)
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={`text-xs cursor-pointer ${
                            isOverdue ? "text-destructive font-semibold" : ""
                          }`}
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          {paymentDueDate
                            ? formatDate(paymentDueDate)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${orderId}`);
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasDetails && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0 bg-muted/20">
                            <OrderDetailsSection orderDetails={order.details || []} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {!data?.items?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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
    </div>
  );
}

// Component to display order design details
function OrderDetailsSection({
  orderDetails,
}: {
  orderDetails: Array<{
    id?: number;
    designCode?: string | null;
    designName?: string | null;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    status?: string | null;
  }>;
}) {
  if (!orderDetails || orderDetails.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-muted-foreground">
        Chưa có chi tiết sản phẩm
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Separator className="flex-1" />
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Chi tiết sản phẩm ({orderDetails.length})
          </span>
        </div>
        <Separator className="flex-1" />
      </div>
      <div className="space-y-2">
        {orderDetails.map((detail, index) => {
          return (
            <div
              key={detail.id || index}
              className="rounded-lg border bg-background hover:bg-muted/50 transition-colors p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                    {detail.designCode && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {detail.designCode}
                      </Badge>
                    )}
                    {detail.status && (
                      <StatusBadge
                        status={detail.status}
                        label={orderStatusLabels[detail.status] || detail.status}
                        className="text-[10px] px-1.5 py-0"
                      />
                    )}
                  </div>
                  {detail.designName && (
                    <p className="text-sm font-medium">{detail.designName}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-muted-foreground">Số lượng</p>
                    <p className="font-semibold">
                      {detail.quantity?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-right">
                    <p className="text-muted-foreground">Đơn giá</p>
                    <p className="font-semibold">
                      {formatCurrency(detail.unitPrice || 0)}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-right">
                    <p className="text-muted-foreground">Thành tiền</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(detail.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
