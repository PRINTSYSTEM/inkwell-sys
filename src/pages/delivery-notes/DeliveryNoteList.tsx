import { useState, useMemo } from "react";
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
  Package,
  Users,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Plus,
  X,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { StatusBadge } from "@/components/ui/status-badge";
import { useAvailableOrderDetailsForDelivery } from "@/hooks/use-delivery-note";
import {
  useDeliveryNotes,
  useCreateDeliveryNote,
} from "@/hooks/use-delivery-note";
import { orderStatusLabels } from "@/lib/status-utils";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDeliveryNoteStatusLabel = (
  status: string | null | undefined,
): string => {
  if (!status) return "—";
  const statusLower = status.toLowerCase();

  if (statusLower === "draft" || statusLower.includes("draft")) {
    return "Lưu nháp";
  }
  if (
    statusLower.includes("success") ||
    statusLower.includes("completed") ||
    statusLower === "delivered"
  ) {
    return "Đã giao";
  }
  if (statusLower.includes("fail") || statusLower.includes("failed")) {
    return "Thất bại";
  }
  if (statusLower === "pending" || statusLower.includes("pending")) {
    return "Chờ giao";
  }
  if (statusLower === "delivering" || statusLower.includes("delivering")) {
    return "Đang giao";
  }
  return status;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
};

// ============================================================================
// ORDER CARD COMPONENT
// ============================================================================

interface OrderCardProps {
  order: {
    id?: number;
    code?: string | null;
    customer?: {
      name?: string | null;
      companyName?: string | null;
      phone?: string | null;
    } | null;
    status?: string | null;
    orderDetails?: Array<unknown>;
    deliveryAddress?: string | null;
    recipientAddress?: string | null;
    deliveryDate?: string | null;
    totalAmount?: number | null;
  };
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}

function OrderCard({ order, isSelected, onToggle, onClick }: OrderCardProps) {
  const itemCount = order.orderDetails?.length || 0;

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked !== isSelected) {
                    onToggle();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="border-slate-300 dark:border-slate-700"
              />
              <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-50">
                {order.code}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                  {order.customer?.companyName ||
                    order.customer?.name ||
                    "Không có tên"}
                </div>
                {order.customer?.phone && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer.phone}
                  </div>
                )}
              </div>

              {(order.deliveryAddress || order.recipientAddress) && (
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {order.deliveryAddress || order.recipientAddress}
                  </span>
                </div>
              )}

              {order.deliveryDate && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(order.deliveryDate)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusBadge
              status={order.status || ""}
              label={orderStatusLabels[order.status || ""]}
            />
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="font-semibold bg-slate-100 dark:bg-slate-800"
              >
                <Package className="h-3 w-3 mr-1" />
                {itemCount} SP
              </Badge>
            </div>
            {order.totalAmount && (
              <div className="text-sm font-bold text-primary mt-1">
                {formatCurrency(order.totalAmount)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DELIVERY NOTE CARD COMPONENT
// ============================================================================

interface DeliveryNoteCardProps {
  deliveryNote: {
    id?: number;
    code?: string | null;
    orders?: Array<{
      orderId?: number;
      orderCode?: string | null;
      customerName?: string | null;
      totalAmount?: number;
    }>;
    recipientName?: string | null;
    recipientPhone?: string | null;
    status?: string | null;
    createdAt?: string | null;
  };
  onClick: () => void;
}

function DeliveryNoteCard({ deliveryNote, onClick }: DeliveryNoteCardProps) {
  const totalAmount =
    deliveryNote.orders?.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    ) || 0;

  const customers =
    deliveryNote.orders
      ?.map((order) => order.customerName)
      .filter((name): name is string => !!name) || [];
  const uniqueCustomers = Array.from(new Set(customers));

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-lg text-slate-900 dark:text-slate-50 mb-3">
              {deliveryNote.code || `#${deliveryNote.id}`}
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Đơn hàng
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {deliveryNote.orders?.length || 0} đơn hàng
                </div>
                {deliveryNote.orders && deliveryNote.orders.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {deliveryNote.orders.slice(0, 2).map((order) => (
                      <div
                        key={order.orderId}
                        className="text-xs font-mono text-slate-500 dark:text-slate-400"
                      >
                        {order.orderCode}
                      </div>
                    ))}
                    {deliveryNote.orders.length > 2 && (
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        +{deliveryNote.orders.length - 2} đơn hàng khác
                      </div>
                    )}
                  </div>
                )}
              </div>

              {uniqueCustomers.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Khách hàng
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {uniqueCustomers[0]}
                  </div>
                  {uniqueCustomers.length > 1 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      +{uniqueCustomers.length - 1} khách hàng khác
                    </div>
                  )}
                </div>
              )}

              {deliveryNote.recipientName && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Người nhận
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {deliveryNote.recipientName}
                  </div>
                  {deliveryNote.recipientPhone && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {deliveryNote.recipientPhone}
                    </div>
                  )}
                </div>
              )}

              {deliveryNote.createdAt && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(deliveryNote.createdAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusBadge
              status={deliveryNote.status || null}
              label={getDeliveryNoteStatusLabel(deliveryNote.status)}
            />
            {totalAmount > 0 && (
              <div className="text-lg font-bold text-primary mt-2">
                {formatCurrency(totalAmount)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DeliveryNoteListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"orders" | "delivery-notes">(
    "orders",
  );

  // Orders state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set(),
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Delivery notes state
  const [deliveryNoteStatusFilter, setDeliveryNoteStatusFilter] =
    useState<string>("all");
  const [deliveryNotePage, setDeliveryNotePage] = useState(1);

  const itemsPerPage = 10;

  // Data fetching for available order details
  const {
    data: orderDetailsData,
    isLoading: orderDetailsLoading,
    isError: orderDetailsError,
    error: orderDetailsErrorObj,
    refetch: refetchOrderDetails,
  } = useAvailableOrderDetailsForDelivery({});

  const {
    data: deliveryNotesData,
    isLoading: deliveryNotesLoading,
    isError: deliveryNotesError,
    error: deliveryNotesErrorObj,
    refetch: refetchDeliveryNotes,
  } = useDeliveryNotes({
    pageNumber: deliveryNotePage,
    pageSize: itemsPerPage,
    status:
      deliveryNoteStatusFilter === "all" ? undefined : deliveryNoteStatusFilter,
  });

  const createDeliveryNoteMutation = useCreateDeliveryNote();

  // Filter order details
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orderDetailsData)) return [];
    return orderDetailsData.filter((od) => {
      const matchesSearch =
        !searchQuery ||
        od.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        od.designCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        od.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [orderDetailsData, searchQuery]);

  const pagedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // We map selectedOrderIds to quantities to allow input, but initially just a Set
  const selectedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.orderDetailId && selectedOrderIds.has(o.orderDetailId));
  }, [filteredOrders, selectedOrderIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, order) => sum + (order.remainingToDeliver || 0) * (order.unitPrice || 0),
      0,
    );
  }, [selectedOrders]);

  // Handlers
  const handleToggleOrder = (orderDetailId: number) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      const isAdding = !newSet.has(orderDetailId);

      const od = Array.isArray(orderDetailsData) ? orderDetailsData.find((o: any) => o.orderDetailId === orderDetailId) : null;
      const filterText = od?.customerName;

      if (isAdding) {
        newSet.add(orderDetailId);

        if (prev.size === 0 && !searchQuery && filterText) {
          setSearchQuery(filterText);
        }
      } else {
        newSet.delete(orderDetailId);

        if (newSet.size === 0 && filterText && searchQuery === filterText) {
          setSearchQuery("");
        }
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(
        new Set(
          filteredOrders.map((o) => o.orderDetailId).filter((id): id is number => !!id),
        ),
      );
    }
  };

  const handleCreateDeliveryNote = () => {
    if (selectedOrderIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    
    // Initialize default quantities
    const qtys: Record<number, number> = {};
    selectedOrders.forEach(od => {
      qtys[od.orderDetailId!] = od.remainingToDeliver || 0;
    });
    setDeliveryQtys(qtys);

    setIsCreateDialogOpen(true);
  };

  // Quantity state map for selected details
  const [deliveryQtys, setDeliveryQtys] = useState<Record<number, number>>({});

  const handleConfirmCreate = async () => {
    if (selectedOrderIds.size === 0) return;

    try {
      await createDeliveryNoteMutation.mutateAsync({
        lines: selectedOrders.map(od => ({
          orderDetailId: od.orderDetailId!,
          deliveryQty: deliveryQtys[od.orderDetailId!] || od.remainingToDeliver || 0
        })),
        notes: notes || undefined,
      });
      setSelectedOrderIds(new Set());
      setDeliveryQtys({});
      setNotes("");
      setIsCreateDialogOpen(false);
      refetchOrderDetails();
      refetchDeliveryNotes();
      setViewMode("delivery-notes");
      toast.success("Tạo phiếu giao hàng thành công");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleViewDeliveryNote = (id: number | undefined) => {
    if (id) {
      navigate(`/delivery-notes/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Phiếu giao hàng
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Quản lý đơn hàng và phiếu giao hàng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "orders" ? "default" : "outline"}
                onClick={() => setViewMode("orders")}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Tạo Phiếu Giao Hàng
              </Button>
              <Button
                variant={viewMode === "delivery-notes" ? "default" : "outline"}
                onClick={() => setViewMode("delivery-notes")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Phiếu giao hàng đã tạo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {viewMode === "orders" ? (
          <OrdersView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            orderDetailsLoading={orderDetailsLoading}
            orderDetailsError={orderDetailsError}
            orderDetailsErrorObj={orderDetailsErrorObj}
            refetchOrderDetails={refetchOrderDetails}
            filteredOrders={filteredOrders}
            pagedOrders={pagedOrders}
            totalPages={totalPages}
            selectedOrderIds={selectedOrderIds}
            handleToggleOrder={handleToggleOrder}
            handleSelectAll={handleSelectAll}
            selectedOrders={selectedOrders}
            totalSelectedAmount={totalSelectedAmount}
            handleCreateDeliveryNote={handleCreateDeliveryNote}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            navigate={navigate}
          />
        ) : (
          <DeliveryNotesView
            deliveryNoteStatusFilter={deliveryNoteStatusFilter}
            setDeliveryNoteStatusFilter={setDeliveryNoteStatusFilter}
            deliveryNotesData={deliveryNotesData}
            deliveryNotesLoading={deliveryNotesLoading}
            deliveryNotesError={deliveryNotesError}
            deliveryNotesErrorObj={deliveryNotesErrorObj}
            refetchDeliveryNotes={refetchDeliveryNotes}
            deliveryNotePage={deliveryNotePage}
            setDeliveryNotePage={setDeliveryNotePage}
            handleViewDeliveryNote={handleViewDeliveryNote}
          />
        )}
      </div>

      {/* Create Dialog */}
      <CreateDeliveryNoteDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedOrders={selectedOrders}
        deliveryQtys={deliveryQtys}
        setDeliveryQtys={setDeliveryQtys}
        notes={notes}
        setNotes={setNotes}
        onCreate={handleConfirmCreate}
        isPending={createDeliveryNoteMutation.isPending}
      />
    </div>
  );
}

// ============================================================================
// ORDERS VIEW COMPONENT
// ============================================================================

interface OrdersViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  orderDetailsLoading: boolean;
  orderDetailsError: boolean;
  orderDetailsErrorObj: unknown;
  refetchOrderDetails: () => void;
  filteredOrders: Array<any>;
  pagedOrders: Array<any>;
  totalPages: number;
  selectedOrderIds: Set<number>;
  handleToggleOrder: (id: number) => void;
  handleSelectAll: () => void;
  selectedOrders: Array<any>;
  totalSelectedAmount: number;
  handleCreateDeliveryNote: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  navigate: (path: string) => void;
}

function OrdersView({
  searchQuery,
  setSearchQuery,
  orderDetailsLoading,
  orderDetailsError,
  orderDetailsErrorObj,
  refetchOrderDetails,
  filteredOrders,
  pagedOrders,
  totalPages,
  selectedOrderIds,
  handleToggleOrder,
  handleSelectAll,
  selectedOrders,
  totalSelectedAmount,
  handleCreateDeliveryNote,
  currentPage,
  setCurrentPage,
  navigate,
}: OrdersViewProps) {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo mã đơn, tên khách, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 border-slate-300 dark:border-slate-700"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchOrderDetails()}
              disabled={orderDetailsLoading}
              className="h-11 w-11 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${orderDetailsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {orderDetailsError && (
        <Alert
          variant="destructive"
          className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {orderDetailsErrorObj instanceof Error
              ? orderDetailsErrorObj.message
              : "Không thể tải dữ liệu. Vui lòng thử lại."}
          </AlertDescription>
        </Alert>
      )}

      {/* Selection Bar */}
      {selectedOrderIds.size > 0 && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Đã chọn {selectedOrderIds.size} đơn hàng
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tổng:{" "}
                    <span className="font-bold text-primary">
                      {formatCurrency(totalSelectedAmount)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll()}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Bỏ chọn tất cả
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateDeliveryNote}
                  className="gap-2 h-9 font-semibold"
                >
                  <Truck className="h-4 w-4" />
                  Tạo phiếu giao hàng ({selectedOrderIds.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrderIds.size === filteredOrders.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300 dark:border-slate-700"
                  />
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Mã hàng / Đơn hàng
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Sản phẩm
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Khách hàng
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                  Số lượng (Tổng)
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                  Đã giao
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                  Cần giao
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderDetailsLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-200 dark:border-slate-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Không tìm thấy chi tiết đơn hàng nào
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedOrders.map((od) => {
                  const isSelected = od.orderDetailId ? selectedOrderIds.has(od.orderDetailId) : false;

                  return (
                    <TableRow
                      key={od.orderDetailId}
                      className={`cursor-pointer transition-all duration-150 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                        isSelected ? "bg-primary/5 border-primary/20" : ""
                      }`}
                      onClick={() => navigate(`/accounting/orders/${od.orderId}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked !== isSelected && od.orderDetailId) {
                              handleToggleOrder(od.orderDetailId);
                            }
                          }}
                          className="border-slate-300 dark:border-slate-700"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold text-sm text-slate-900 dark:text-slate-50">
                          {od.designCode}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {od.orderCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-900 dark:text-slate-50 font-semibold line-clamp-2">
                          {od.designName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="text-sm text-slate-900 dark:text-slate-50 font-semibold hover:bg-slate-100 p-1 -m-1 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (od.customerName) setSearchQuery(od.customerName);
                          }}
                        >
                          {od.customerName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {new Intl.NumberFormat('vi-VN').format(od.netQtyTotal || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat('vi-VN').format(od.deliveredQtyTotal || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {new Intl.NumberFormat('vi-VN').format(od.remainingToDeliver || 0)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {!orderDetailsLoading &&
        filteredOrders.length > 0 &&
        orderDetailsDataTyped &&
        orderDetailsDataTyped.totalPages &&
        orderDetailsDataTyped.totalPages > 0 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Trang {currentPage} / {orderDetailsDataTyped.totalPages} •{" "}
                  <span className="text-slate-900 dark:text-slate-50">
                    {orderDetailsDataTyped.total}
                  </span>{" "}
                  đơn hàng
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                    }}
                    disabled={currentPage === 1 || orderDetailsLoading}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {currentPage} / {orderDetailsDataTyped.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.min(
                        orderDetailsDataTyped.totalPages || 1,
                        currentPage + 1,
                      );
                      setCurrentPage(newPage);
                    }}
                    disabled={
                      currentPage === (orderDetailsDataTyped.totalPages || 1) ||
                      orderDetailsLoading
                    }
                    className="h-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// ============================================================================
// DELIVERY NOTES VIEW COMPONENT
// ============================================================================

interface DeliveryNotesViewProps {
  deliveryNoteStatusFilter: string;
  setDeliveryNoteStatusFilter: (filter: string) => void;
  deliveryNotesData: unknown;
  deliveryNotesLoading: boolean;
  deliveryNotesError: boolean;
  deliveryNotesErrorObj: unknown;
  refetchDeliveryNotes: () => void;
  deliveryNotePage: number;
  setDeliveryNotePage: (page: number) => void;
  handleViewDeliveryNote: (id: number | undefined) => void;
}

function DeliveryNotesView({
  deliveryNoteStatusFilter,
  setDeliveryNoteStatusFilter,
  deliveryNotesLoading,
  deliveryNotesError,
  deliveryNotesErrorObj,
  refetchDeliveryNotes,
  deliveryNotePage,
  setDeliveryNotePage,
  deliveryNotesData,
  handleViewDeliveryNote,
}: DeliveryNotesViewProps) {
  const deliveryNotesDataTyped = deliveryNotesData as
    | {
        items?: Array<{
          id?: number;
          code?: string | null;
          orders?: Array<{
            orderId?: number;
            orderCode?: string | null;
            customerName?: string | null;
            totalAmount?: number;
          }>;
          recipientName?: string | null;
          recipientPhone?: string | null;
          status?: string | null;
          createdAt?: string | null;
        }>;
        totalPages?: number;
        total?: number;
      }
    | undefined;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={deliveryNoteStatusFilter}
              onValueChange={setDeliveryNoteStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-11 border-slate-300 dark:border-slate-700">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ giao</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchDeliveryNotes()}
              disabled={deliveryNotesLoading}
              className="h-11 w-11 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${deliveryNotesLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {deliveryNotesError && (
        <Alert
          variant="destructive"
          className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Lỗi kết nối</AlertTitle>
          <AlertDescription>
            {deliveryNotesErrorObj instanceof Error
              ? deliveryNotesErrorObj.message
              : "Không thể tải dữ liệu. Vui lòng thử lại."}
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Notes Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                <TableHead className="w-[140px] font-semibold text-slate-700 dark:text-slate-300">
                  Mã phiếu
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Đơn hàng
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Khách hàng
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Người nhận
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  Ngày tạo
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryNotesLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-slate-200 dark:border-slate-800"
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !deliveryNotesDataTyped?.items ||
                deliveryNotesDataTyped.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Không tìm thấy phiếu giao hàng nào
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Thử thay đổi bộ lọc hoặc tạo phiếu mới từ đơn hàng
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                deliveryNotesDataTyped.items.map((deliveryNote) => {
                  const totalAmount =
                    deliveryNote.orders?.reduce(
                      (sum, order) => sum + (order.totalAmount || 0),
                      0,
                    ) || 0;

                  const customers =
                    deliveryNote.orders
                      ?.map((order) => order.customerName)
                      .filter((name): name is string => !!name) || [];
                  const uniqueCustomers = Array.from(new Set(customers));

                  return (
                    <TableRow
                      key={deliveryNote.id}
                      className="cursor-pointer transition-all duration-150 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      onClick={() => handleViewDeliveryNote(deliveryNote.id)}
                    >
                      <TableCell>
                        <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                          {deliveryNote.code || `#${deliveryNote.id}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-slate-400" />
                            {deliveryNote.orders?.length || 0} đơn hàng
                          </div>
                          <div className="space-y-0.5">
                            {deliveryNote.orders?.slice(0, 2).map((order) => (
                              <div
                                key={order.orderId}
                                className="text-xs text-slate-500 dark:text-slate-400 font-mono"
                              >
                                {order.orderCode}
                              </div>
                            ))}
                            {deliveryNote.orders &&
                              deliveryNote.orders.length > 2 && (
                                <div className="text-xs text-slate-400 dark:text-slate-500">
                                  +{deliveryNote.orders.length - 2} đơn hàng
                                  khác
                                </div>
                              )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {uniqueCustomers.length > 0 ? (
                            <>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                {uniqueCustomers[0]}
                              </div>
                              {uniqueCustomers.length > 1 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  +{uniqueCustomers.length - 1} khách hàng khác
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              —
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {deliveryNote.recipientName || "—"}
                          </div>
                          {deliveryNote.recipientPhone && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {deliveryNote.recipientPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          status={deliveryNote.status || null}
                          label={getDeliveryNoteStatusLabel(
                            deliveryNote.status,
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(deliveryNote.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {!deliveryNotesLoading &&
        deliveryNotesDataTyped?.items &&
        deliveryNotesDataTyped.items.length > 0 && (
          <>
            {/* Pagination */}
            {deliveryNotesDataTyped.totalPages &&
              deliveryNotesDataTyped.totalPages > 0 && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Trang {deliveryNotePage} /{" "}
                        {deliveryNotesDataTyped.totalPages} •{" "}
                        <span className="text-slate-900 dark:text-slate-50">
                          {deliveryNotesDataTyped.total}
                        </span>{" "}
                        phiếu giao hàng
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.max(1, deliveryNotePage - 1);
                            setDeliveryNotePage(newPage);
                          }}
                          disabled={
                            deliveryNotePage === 1 || deliveryNotesLoading
                          }
                          className="h-9"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {deliveryNotePage} /{" "}
                            {deliveryNotesDataTyped.totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.min(
                              deliveryNotesDataTyped.totalPages || 1,
                              deliveryNotePage + 1,
                            );
                            setDeliveryNotePage(newPage);
                          }}
                          disabled={
                            deliveryNotePage ===
                              (deliveryNotesDataTyped.totalPages || 1) ||
                            deliveryNotesLoading
                          }
                          className="h-9"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </>
        )}
    </div>
  );
}

// ============================================================================
// CREATE DIALOG COMPONENT
// ============================================================================

interface CreateDeliveryNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: Array<any>;
  deliveryQtys: Record<number, number>;
  setDeliveryQtys: (qtys: any) => void;
  notes: string;
  setNotes: (notes: string) => void;
  onCreate: () => void;
  isPending: boolean;
}

function CreateDeliveryNoteDialog({
  isOpen,
  onOpenChange,
  selectedOrders,
  deliveryQtys,
  setDeliveryQtys,
  notes,
  setNotes,
  onCreate,
  isPending,
}: CreateDeliveryNoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Tạo phiếu giao hàng cho {selectedOrders.length} đơn hàng
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Nhập thông tin giao hàng cho các đơn hàng đã chọn.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4 mb-4">
          <div className="space-y-3">
            {selectedOrders.map((od) => (
              <Card
                key={od.orderDetailId}
                className="border-slate-200 dark:border-slate-800"
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                          {od.designCode} <span className="text-slate-400 font-sans text-xs">({od.orderCode})</span>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                          {od.designName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Tối đa giao: <span className="font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(od.remainingToDeliver || 0)}</span>
                        </div>
                      </div>
                      <div className="w-[120px] flex-shrink-0">
                        <Label className="text-xs text-slate-500 mb-1 block">Số lượng giao</Label>
                        <Input
                          type="number"
                          min="1"
                          max={od.remainingToDeliver || 1}
                          value={deliveryQtys[od.orderDetailId] || ''}
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 0;
                            if (val > (od.remainingToDeliver || 0)) val = od.remainingToDeliver || 0;
                            setDeliveryQtys((prev: any) => ({...prev, [od.orderDetailId]: val}));
                          }}
                          className="h-8 text-right font-semibold text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Ghi chú chung
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú (tùy chọn)"
              rows={3}
              className="resize-none border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="border-slate-300 dark:border-slate-700"
          >
            Hủy
          </Button>
          <Button
            onClick={onCreate}
            disabled={isPending}
            className="gap-2 font-semibold"
          >
            <Truck className="h-4 w-4" />
            {isPending ? "Đang tạo..." : "Xác nhận tạo phiếu giao hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
