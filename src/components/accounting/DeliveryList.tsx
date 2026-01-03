import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  Truck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CustomerTypeBadge } from "@/components/accounting";
import { useOrdersForAccounting } from "@/hooks/use-order";
import { useCreateDeliveryNote } from "@/hooks/use-delivery-note";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { OrderResponse } from "@/Schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { StatusBadge } from "../ui/status-badge";

// Helper to derive customer type
function deriveCustomerType(
  customer: OrderResponse["customer"]
): "company" | "retail" {
  return customer?.companyName ? "company" : "retail";
}

// Check if order is ready for delivery (production completed)
function isReadyForDelivery(order: OrderResponse): boolean {
  return order.status === "production_completed";
}

// Check if order already has delivery note (status is delivering or completed)
function hasDeliveryNote(order: OrderResponse): boolean {
  return order.status === "delivering" || order.status === "completed";
}

export function DeliveryList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] =
    useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [isCreateDeliveryDialogOpen, setIsCreateDeliveryDialogOpen] =
    useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  // Fetch orders from API - filter for production completed orders
  const { data, isLoading, isError, error, refetch } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    filterType: "delivery", // Assuming this filter exists, or we'll filter client-side
  });

  const createDeliveryNoteMutation = useCreateDeliveryNote();

  // Filter orders client-side - only show production_completed orders
  const filteredOrders = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter((order) => {
      // Only show orders that are ready for delivery (production_completed)
      // or already delivering/completed (to show delivery status)
      const isReady = isReadyForDelivery(order);
      const hasDelivery = hasDeliveryNote(order);

      if (!isReady && !hasDelivery) return false;

      const matchesSearch =
        !searchQuery ||
        order.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.companyName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        order.customer?.phone?.includes(searchQuery);

      // Filter by delivery status
      const matchesStatus =
        deliveryStatusFilter === "all" ||
        (deliveryStatusFilter === "ready" && isReady) ||
        (deliveryStatusFilter === "delivering" &&
          order.status === "delivering") ||
        (deliveryStatusFilter === "delivered" && order.status === "completed");

      return matchesSearch && matchesStatus;
    });
  }, [data?.items, searchQuery, deliveryStatusFilter]);

  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const handleOrderClick = (order: OrderResponse) => {
    navigate(`/accounting/orders/${order.id}?tab=delivery`);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Handle checkbox selection - only allow selecting orders from the same customer
  const handleToggleOrder = (orderId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const orderToToggle = filteredOrders.find((o) => o.id === orderId);
    if (!orderToToggle) return;

    // Only allow selecting orders that are ready for delivery (not already delivered)
    if (!isReadyForDelivery(orderToToggle)) {
      toast.error(
        "Chỉ có thể chọn các đơn hàng đã hoàn thành sản xuất và chưa giao hàng"
      );
      return;
    }

    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(orderId)) {
        // Deselecting - always allowed
        newSet.delete(orderId);
      } else {
        // Selecting - check if same customer
        if (prev.size === 0) {
          // First selection - always allowed
          newSet.add(orderId);
        } else {
          // Check if all selected orders have the same customer
          const firstSelectedOrder = filteredOrders.find(
            (o) => o.id && prev.has(o.id)
          );

          if (!firstSelectedOrder) {
            newSet.add(orderId);
            return newSet;
          }

          // Compare customer IDs
          const firstCustomerId = firstSelectedOrder.customer?.id;
          const newCustomerId = orderToToggle.customer?.id;

          if (
            firstCustomerId &&
            newCustomerId &&
            firstCustomerId === newCustomerId
          ) {
            // Same customer - allow selection
            newSet.add(orderId);
          } else {
            // Different customer - show error
            toast.error(
              "Chỉ có thể chọn các đơn hàng cùng một khách hàng. Vui lòng bỏ chọn các đơn hàng hiện tại trước."
            );
          }
        }
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      // Only select orders from the same customer that are ready for delivery
      // If there are already selected orders, only select from that customer
      if (selectedOrderIds.size > 0) {
        const firstSelectedOrder = filteredOrders.find(
          (o) => o.id && selectedOrderIds.has(o.id)
        );
        if (firstSelectedOrder?.customer?.id) {
          const customerId = firstSelectedOrder.customer.id;
          const sameCustomerOrders = filteredOrders
            .filter(
              (o) =>
                o.customer?.id === customerId && o.id && isReadyForDelivery(o)
            )
            .map((o) => o.id!)
            .filter((id): id is number => !!id);
          setSelectedOrderIds(new Set(sameCustomerOrders));
        }
      } else {
        // No selection yet - select all orders from the first customer on the page that are ready
        if (filteredOrders.length > 0 && filteredOrders[0].customer?.id) {
          const firstCustomerId = filteredOrders[0].customer.id;
          const sameCustomerOrders = filteredOrders
            .filter(
              (o) =>
                o.customer?.id === firstCustomerId &&
                o.id &&
                isReadyForDelivery(o)
            )
            .map((o) => o.id!)
            .filter((id): id is number => !!id);
          setSelectedOrderIds(new Set(sameCustomerOrders));
        }
      }
    }
  };

  // Handle create delivery note from selected orders
  const handleCreateDeliveryNoteFromSelected = () => {
    if (selectedOrderIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }

    // Check if all selected orders have the same customer
    const selectedOrders = filteredOrders.filter(
      (o) => o.id && selectedOrderIds.has(o.id)
    );
    if (selectedOrders.length === 0) {
      toast.error("Không tìm thấy đơn hàng đã chọn");
      return;
    }

    const firstCustomerId = selectedOrders[0].customer?.id;
    const allSameCustomer = selectedOrders.every(
      (o) => o.customer?.id === firstCustomerId
    );

    if (!allSameCustomer) {
      toast.error(
        "Chỉ có thể xuất phiếu giao hàng cho các đơn hàng cùng một khách hàng"
      );
      return;
    }

    // Check if all selected orders are ready for delivery
    const notReadyOrders = selectedOrders.filter((o) => !isReadyForDelivery(o));
    if (notReadyOrders.length > 0) {
      toast.error(
        "Chỉ có thể xuất phiếu giao hàng cho các đơn hàng đã hoàn thành sản xuất"
      );
      return;
    }

    setIsCreateDeliveryDialogOpen(true);
  };

  const handleConfirmCreateDeliveryNote = async () => {
    if (selectedOrderIds.size === 0) return;

    try {
      await createDeliveryNoteMutation.mutateAsync({
        orderIds: Array.from(selectedOrderIds),
      });
      setSelectedOrderIds(new Set());
      setIsCreateDeliveryDialogOpen(false);
      refetch();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Get selected orders for display
  const selectedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.id && selectedOrderIds.has(o.id));
  }, [filteredOrders, selectedOrderIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
  }, [selectedOrders]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-hidden">
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

        {/* Filters and Actions */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={deliveryStatusFilter}
                onValueChange={setDeliveryStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ready">Sẵn sàng giao</SelectItem>
                  <SelectItem value="delivering">Đang giao</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedOrderIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  Đã chọn {selectedOrderIds.size} đơn hàng
                </span>
                <Badge variant="secondary">
                  Tổng: {formatCurrency(totalSelectedAmount)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderIds(new Set())}
                >
                  Bỏ chọn
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateDeliveryNoteFromSelected}
                  className="gap-2"
                >
                  <Truck className="h-4 w-4" />
                  Xuất phiếu giao hàng ({selectedOrderIds.size})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            ref={tableContainerRef}
            className="flex-1 overflow-auto rounded-lg border"
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="bg-muted/50 h-10">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredOrders.length > 0 &&
                        selectedOrderIds.size ===
                          filteredOrders.filter((o) => isReadyForDelivery(o))
                            .length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[140px] font-bold text-sm">
                    Mã đơn
                  </TableHead>
                  <TableHead className="font-bold text-sm">Khách hàng</TableHead>
                  <TableHead className="text-right font-bold text-sm">
                    Tổng tiền
                  </TableHead>
                  <TableHead className="text-center font-bold text-sm">
                    Trạng thái đơn
                  </TableHead>
                  <TableHead className="text-center font-bold text-sm">
                    Trạng thái giao hàng
                  </TableHead>
                  <TableHead className="text-center font-bold text-sm">
                    Ngày giao dự kiến
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="h-14">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy đơn hàng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const customerType = deriveCustomerType(order.customer);
                    const isReady = isReadyForDelivery(order);
                    const hasDelivery = hasDeliveryNote(order);
                    const isSelected = order.id
                      ? selectedOrderIds.has(order.id)
                      : false;
                    const canSelect = isReady && !hasDelivery;

                    return (
                      <TableRow
                        key={order.id}
                        className={`h-14 cursor-pointer hover:bg-muted/50 ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                        onClick={() => handleOrderClick(order)}
                      >
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-block">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => {
                                    if (order.id) {
                                      handleToggleOrder(order.id);
                                    }
                                  }}
                                  disabled={!canSelect}
                                />
                              </div>
                            </TooltipTrigger>
                            {!canSelect && (
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {hasDelivery
                                    ? "Đơn hàng đã có phiếu giao hàng"
                                    : "Chỉ có thể chọn đơn hàng đã hoàn thành sản xuất"}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell className="font-bold font-mono text-sm">
                          {order.code}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm">
                                {order.customer?.companyName ||
                                  order.customer?.name ||
                                  "—"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {order.customer?.phone || "—"}
                              </span>
                              <CustomerTypeBadge type={customerType} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-sm">
                          {formatCurrency(order.totalAmount || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge
                            status={
                              order.status as keyof typeof ENTITY_CONFIG.orderStatuses.values
                            }
                            label={
                              ENTITY_CONFIG.orderStatuses.values[
                                order.status as keyof typeof ENTITY_CONFIG.orderStatuses.values
                              ]
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {hasDelivery ? (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800 border-green-200"
                            >
                              {order.status === "delivering"
                                ? "Đang giao"
                                : "Đã giao"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200"
                            >
                              Chờ giao
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
              <span className="font-bold text-foreground">{totalItems}</span>{" "}
              đơn hàng
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

        {/* Create Delivery Note Dialog */}
        <Dialog
          open={isCreateDeliveryDialogOpen}
          onOpenChange={setIsCreateDeliveryDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Xuất phiếu giao hàng cho {selectedOrderIds.size} đơn hàng
              </DialogTitle>
              <DialogDescription>
                Xác nhận xuất phiếu giao hàng cho các đơn hàng đã chọn. Tất cả
                đơn hàng sẽ được gộp vào một phiếu giao hàng.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {selectedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.code}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.customer?.companyName ||
                          order.customer?.name ||
                          "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatCurrency(order.totalAmount || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-t">
              <span className="font-medium">Tổng cộng:</span>
              <span className="text-lg font-bold">
                {formatCurrency(totalSelectedAmount)}
              </span>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDeliveryDialogOpen(false)}
                disabled={createDeliveryNoteMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmCreateDeliveryNote}
                disabled={createDeliveryNoteMutation.isPending}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                {createDeliveryNoteMutation.isPending
                  ? "Đang tạo..."
                  : "Xác nhận xuất phiếu giao hàng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
