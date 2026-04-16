import React, { useState, useMemo } from "react";
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
  Navigation,
  Phone,
  FileText,
  Plus,
  X,
  Star,
  Trash2,
  BookOpen,
  ChevronDown,
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
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultCustomerAddress,
} from "@/hooks/use-customer";
import { useOrdersForAccounting } from "@/hooks/use-order";
import { orderStatusLabels } from "@/lib/status-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  // Per-line selected address id map: orderDetailId -> customerAddressId
  const [selectedAddressIds, setSelectedAddressIds] = useState<Record<number, number | null>>({});

  // Delivery notes state
  const [deliveryNoteStatusFilter, setDeliveryNoteStatusFilter] =
    useState<string>("all");
  const [deliveryNotePage, setDeliveryNotePage] = useState(1);

  const itemsPerPage = 10;

  // Selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [selectedOrderDetailIds, setSelectedOrderDetailIds] = useState<Set<number>>(new Set());

  // Data fetching for orders (for-accounting)
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch: refetchOrders,
  } = useOrdersForAccounting({
    pageNumber: currentPage,
    pageSize: itemsPerPage,
    customerName: searchQuery || undefined,
  });

  // Data fetching for available order details for the active customer
  const {
    data: orderDetailsData,
    isLoading: orderDetailsLoading,
    isError: orderDetailsError,
    error: orderDetailsErrorObj,
    refetch: refetchOrderDetails,
  } = useAvailableOrderDetailsForDelivery(
    { customerId: selectedCustomerId ?? undefined },
    { enabled: !!selectedCustomerId }
  );

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

  // Selected details derived from fetched details data
  const selectedOrders = useMemo(() => {
    if (!Array.isArray(orderDetailsData)) return [];
    return orderDetailsData.filter(
      (od) => od.orderDetailId != null && selectedOrderDetailIds.has(od.orderDetailId)
    );
  }, [orderDetailsData, selectedOrderDetailIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, item) => sum + (item.remainingToDeliver || 0) * (item.unitPrice || 0),
      0,
    );
  }, [selectedOrders]);

  const ordersList = ordersData?.items || [];
  const totalPages = ordersData?.totalPages || 0;

  // Handlers
  const handleSelectCustomer = (customerId: number, customerName: string) => {
    if (selectedCustomerId === customerId) return;
    
    // Clear selections if switching customer
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setSelectedOrderDetailIds(new Set());
    setDeliveryQtys({});
  };

  const handleToggleOrderDetail = (orderDetailId: number) => {
    setSelectedOrderDetailIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderDetailId)) {
        newSet.delete(orderDetailId);
      } else {
        newSet.add(orderDetailId);
      }
      return newSet;
    });
  };

  const handleSelectAllDetails = () => {
    if (!Array.isArray(orderDetailsData)) return;
    
    if (selectedOrderDetailIds.size === orderDetailsData.length) {
      setSelectedOrderDetailIds(new Set());
    } else {
      const allIds = orderDetailsData
        .map((od) => od.orderDetailId)
        .filter((id): id is number => id != null);
      setSelectedOrderDetailIds(new Set(allIds));
    }
  };

  const handleCreateDeliveryNote = () => {
    if (selectedOrderDetailIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    
    // Initialize default quantities and reset address selections
    const qtys: Record<number, number> = {};
    selectedOrders.forEach(od => {
      if (od.orderDetailId != null) {
        qtys[od.orderDetailId] = od.remainingToDeliver || 0;
      }
    });
    setDeliveryQtys(qtys);
    setSelectedAddressIds({});

    setIsCreateDialogOpen(true);
  };

  // Quantity state map for selected details
  const [deliveryQtys, setDeliveryQtys] = useState<Record<number, number>>({});

  const handleConfirmCreate = async () => {
    if (selectedOrderDetailIds.size === 0) return;

    try {
      await createDeliveryNoteMutation.mutateAsync({
        lines: selectedOrders.map(od => ({
          orderDetailId: od.orderDetailId!,
          deliveryQty: deliveryQtys[od.orderDetailId!] || od.remainingToDeliver || 0,
          customerAddressId: selectedAddressIds[od.orderDetailId!] ?? undefined,
        })),
        notes: notes || undefined,
      });
      setSelectedOrderDetailIds(new Set());
      setDeliveryQtys({});
      setSelectedAddressIds({});
      setNotes("");
      setIsCreateDialogOpen(false);
      refetchOrderDetails();
      refetchDeliveryNotes();
      setViewMode("delivery-notes");
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
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersErrorObj={ordersErrorObj}
            refetchOrders={refetchOrders}
            ordersList={ordersList}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedCustomerId={selectedCustomerId}
            handleSelectCustomer={handleSelectCustomer}
            selectedCustomerName={selectedCustomerName}
            orderDetailsData={orderDetailsData}
            orderDetailsLoading={orderDetailsLoading}
            refetchOrderDetails={refetchOrderDetails}
            selectedOrderDetailIds={selectedOrderDetailIds}
            handleToggleOrderDetail={handleToggleOrderDetail}
            handleSelectAllDetails={handleSelectAllDetails}
            selectedOrders={selectedOrders}
            totalSelectedAmount={totalSelectedAmount}
            handleCreateDeliveryNote={handleCreateDeliveryNote}
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
        selectedAddressIds={selectedAddressIds}
        setSelectedAddressIds={setSelectedAddressIds}
        customerId={selectedCustomerId}
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
  ordersLoading: boolean;
  ordersError: boolean;
  ordersErrorObj: unknown;
  refetchOrders: () => void;
  ordersList: Array<any>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedCustomerId: number | null;
  handleSelectCustomer: (id: number, name: string) => void;
  selectedCustomerName: string;
  orderDetailsData: Array<any> | undefined;
  orderDetailsLoading: boolean;
  refetchOrderDetails: () => void;
  selectedOrderDetailIds: Set<number>;
  handleToggleOrderDetail: (id: number) => void;
  handleSelectAllDetails: () => void;
  selectedOrders: Array<any>;
  totalSelectedAmount: number;
  handleCreateDeliveryNote: () => void;
}

function OrdersView({
  searchQuery,
  setSearchQuery,
  ordersLoading,
  ordersError,
  ordersErrorObj,
  refetchOrders,
  ordersList,
  totalPages,
  currentPage,
  setCurrentPage,
  selectedCustomerId,
  handleSelectCustomer,
  selectedCustomerName,
  orderDetailsData,
  orderDetailsLoading,
  refetchOrderDetails,
  selectedOrderDetailIds,
  handleToggleOrderDetail,
  handleSelectAllDetails,
  selectedOrders,
  totalSelectedAmount,
  handleCreateDeliveryNote,
}: OrdersViewProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Search Bar for Orders */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tìm khách hàng & Đơn hàng
          </span>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Nhập tên khách hàng, mã đơn hàng để tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 border-slate-300 dark:border-slate-700"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchOrders()}
              disabled={ordersLoading}
              className="h-11 w-11 border-slate-300 dark:border-slate-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {ordersError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {ordersErrorObj instanceof Error ? ordersErrorObj.message : "Có lỗi xảy ra khi tải danh sách đơn hàng"}
          </AlertDescription>
        </Alert>
      )}

      {/* Customer / Order Selection Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Orders List */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Danh sách đơn hàng
            </h3>
            {ordersLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {ordersList.map((order) => {
                const isSelected = selectedCustomerId === order.customerId;
                return (
                  <Card
                    key={order.id}
                    className={`group cursor-pointer transition-all border-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                    onClick={() => handleSelectCustomer(order.customerId, order.customerName || `Khách hàng #${order.customerId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-50">
                              {order.orderCode}
                            </span>
                            <StatusBadge
                              status={order.status || ""}
                              label={orderStatusLabels[order.status || ""]}
                              className="scale-75 origin-left"
                            />
                          </div>
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate flex items-center gap-2">
                            {order.customerName}
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                              ID: {order.customerId}
                            </span>
                          </div>
                          {order.deliveryAddress && (
                            <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {order.deliveryAddress}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                           <div className="text-sm font-bold text-primary">
                             {formatCurrency(order.totalAmount || 0)}
                           </div>
                           <div className="text-[10px] text-slate-400 mt-1">
                             {formatDate(order.createdAt)}
                           </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!ordersLoading && ordersList.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  Không tìm thấy đơn hàng nào
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Internal Pagination for orders */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold text-slate-500">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Right: Item Selection for Active Customer */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[600px] bg-slate-50/30">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Sản phẩm khả dụng {selectedCustomerId && ` - ${selectedCustomerName}`}
            </h3>
            {selectedCustomerId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchOrderDetails()}
                disabled={orderDetailsLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${orderDetailsLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
          
          <div className="flex-1 p-4 flex flex-col gap-4">
            {!selectedCustomerId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Plus className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">Vui lòng chọn một đơn hàng / khách hàng ở bên trái</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Chọn sản phẩm từ danh sách</Label>
                  <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isDropdownOpen}
                        className="w-full justify-between h-12 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        disabled={orderDetailsLoading || !orderDetailsData}
                      >
                        <span className="truncate">
                          {orderDetailsLoading ? "Đang tải sản phẩm..." : 
                           (orderDetailsData?.length === 0 ? "Khách hàng không còn sản phẩm chờ giao" : "Bấm để chọn thêm sản phẩm...")}
                        </span>
                        <ChevronRight className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm sản phẩm (mã hàng, tên)..." />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>Không tìm thấy sản phẩm nào.</CommandEmpty>
                          <CommandGroup>
                            {orderDetailsData?.map((item) => {
                              const isChecked = selectedOrderDetailIds.has(item.orderDetailId!);
                              return (
                                <CommandItem
                                  key={item.orderDetailId}
                                  value={`${item.designCode} ${item.designName} ${item.orderCode}`}
                                  onSelect={() => {
                                    handleToggleOrderDetail(item.orderDetailId!);
                                  }}
                                  className="flex items-start gap-3 py-3 cursor-pointer"
                                >
                                  <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isChecked ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                                    {isChecked && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-xs">{item.designCode}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">({item.orderCode})</span>
                                    </div>
                                    <div className="text-sm font-medium truncate">{item.designName}</div>
                                    <div className="text-[10px] text-primary font-bold mt-1">
                                      Còn lại: {new Intl.NumberFormat('vi-VN').format(item.remainingToDeliver || 0)} SP
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-slate-500">Sản phẩm đã chọn ({selectedOrderDetailIds.size})</Label>
                    {selectedOrderDetailIds.size > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleSelectAllDetails} className="h-6 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0">
                        Xóa tất cả
                      </Button>
                    )}
                  </div>
                  
                  <ScrollArea className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white/50 dark:bg-slate-900/50">
                    <div className="p-3 space-y-2">
                      {selectedOrders.map((item) => (
                        <div 
                          key={item.orderDetailId} 
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md group shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-slate-50">{item.designCode}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.orderCode}</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-700 truncate">{item.designName}</div>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary bg-primary/5">
                                 {new Intl.NumberFormat('vi-VN').format(item.remainingToDeliver || 0)} SP cần giao
                               </Badge>
                               <span className="text-[10px] text-slate-400 font-bold">×</span>
                               <span className="text-[10px] text-slate-500 font-medium">{formatCurrency(item.unitPrice || 0)}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleToggleOrderDetail(item.orderDetailId!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {selectedOrderDetailIds.size === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs italic">
                          Chưa có sản phẩm nào được chọn
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {selectedOrderDetailIds.size > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-end justify-between">
                       <div className="text-xs text-slate-500 font-medium">Tổng giá trị</div>
                       <div className="text-xl font-black text-primary tracking-tight">
                         {formatCurrency(totalSelectedAmount)}
                       </div>
                    </div>
                    <Button 
                      className="w-full h-12 gap-2 text-md font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-100"
                      onClick={handleCreateDeliveryNote}
                    >
                      <Truck className="h-5 w-5" />
                      Tạo phiếu giao hàng
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
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
// ADDRESS BOOK MANAGER COMPONENT
// ============================================================================

interface AddressBookManagerProps {
  customerId: number;
  onSelect?: (addressId: number | null) => void;
  selectedId?: number | null;
  compact?: boolean;
}

function AddressBookManager({
  customerId,
  onSelect,
  selectedId,
  compact = false,
}: AddressBookManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientPhone, setNewRecipientPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);

  const { data: addresses, isLoading } = useCustomerAddresses(customerId, true);
  const createMutation = useCreateCustomerAddress(customerId);
  const deleteMutation = useDeleteCustomerAddress(customerId);
  const setDefaultMutation = useSetDefaultCustomerAddress(customerId);

  const handleCreate = async () => {
    if (!newLabel.trim() || !newRecipientName.trim() || !newAddress.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    await createMutation.mutateAsync({
      label: newLabel,
      recipientName: newRecipientName,
      recipientPhone: newRecipientPhone || undefined,
      address: newAddress,
      isDefault: newIsDefault,
    });
    setNewLabel("");
    setNewRecipientName("");
    setNewRecipientPhone("");
    setNewAddress("");
    setNewIsDefault(false);
    setShowForm(false);
  };

  if (compact) {
    // Compact mode: just a dropdown selector, no CRUD
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Navigation className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-500">Địa chỉ giao</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : !addresses || addresses.length === 0 ? (
          <div className="text-xs text-slate-400 italic">Chưa có địa chỉ trong sổ</div>
        ) : (
          <Select
            value={selectedId != null ? String(selectedId) : "__none__"}
            onValueChange={(val) => {
              if (onSelect) {
                onSelect(val === "__none__" ? null : Number(val));
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Chọn địa chỉ (tùy chọn)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-slate-400 text-xs">Không chỉ định</span>
              </SelectItem>
              {addresses.map((addr) => (
                <SelectItem key={addr.id} value={String(addr.id)}>
                  <div className="flex items-center gap-1.5">
                    {addr.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    <span className="text-xs font-medium">{addr.label}</span>
                    <span className="text-xs text-slate-400">{addr.recipientName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedId != null && addresses && (() => {
          const sel = addresses.find(a => a.id === selectedId);
          return sel ? (
            <div className="text-[10px] text-slate-500 flex items-start gap-1 bg-primary/5 rounded px-1.5 py-1 border border-primary/20">
              <MapPin className="h-2.5 w-2.5 mt-0.5 text-primary flex-shrink-0" />
              <span className="line-clamp-1">{sel.address}</span>
              {sel.recipientPhone && <span className="text-slate-400 shrink-0">• {sel.recipientPhone}</span>}
            </div>
          ) : null;
        })()}
      </div>
    );
  }

  // Full CRUD mode
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Sổ địa chỉ ({addresses?.length || 0})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Thêm địa chỉ
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Nhãn *</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="VD: Kho Q7 - Chị Lan"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Tên người nhận *</Label>
                <Input
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="Họ tên người nhận"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Số điện thoại</Label>
                <Input
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  placeholder="0901 234 567"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-1.5 pb-1">
                  <Checkbox
                    id="isDefault"
                    checked={newIsDefault}
                    onCheckedChange={(v) => setNewIsDefault(!!v)}
                  />
                  <Label htmlFor="isDefault" className="text-xs text-slate-500 cursor-pointer">Mặc định</Label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Địa chỉ *</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Số nhà, đường, quận, thành phố..."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="h-7 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                {createMutation.isPending ? "Đang lưu..." : "Lưu địa chỉ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          Chưa có địa chỉ nào. Bấm "Thêm địa chỉ" để tạo.
        </div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer group ${
                selectedId === addr.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              onClick={() => onSelect && onSelect(selectedId === addr.id ? null : addr.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {addr.isDefault && (
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {addr.label}
                  </span>
                  {selectedId === addr.id && (
                    <Badge className="h-4 text-[9px] px-1 py-0 ml-auto bg-primary">Đã chọn</Badge>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {addr.recipientName}
                  {addr.recipientPhone && (
                    <span className="ml-1.5 text-slate-400">• {addr.recipientPhone}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 flex items-start gap-0.5 mt-0.5">
                  <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{addr.address}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    title="Đặt làm mặc định"
                    onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(addr.id); }}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-50"
                  title="Xóa địa chỉ"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(addr.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
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
  selectedAddressIds: Record<number, number | null>;
  setSelectedAddressIds: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  customerId: number | null;
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
  selectedAddressIds,
  setSelectedAddressIds,
  customerId,
  notes,
  setNotes,
  onCreate,
  isPending,
}: CreateDeliveryNoteDialogProps) {
  const [showAddressBook, setShowAddressBook] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] border-slate-200 dark:border-slate-800 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Tạo phiếu giao hàng ({selectedOrders.length} sản phẩm)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Xác nhận số lượng và chọn địa chỉ giao cho từng sản phẩm.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-2">
            {/* Per-line items */}
            <div className="space-y-3">
              {selectedOrders.map((od) => (
                <Card
                  key={od.orderDetailId}
                  className="border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-3">
                      {/* Header row: name + qty input */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                            {od.designCode}{" "}
                            <span className="text-slate-400 font-sans text-xs">({od.orderCode})</span>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">
                            {od.designName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Tối đa:{" "}
                            <span className="font-bold text-primary">
                              {new Intl.NumberFormat("vi-VN").format(od.remainingToDeliver || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="w-[110px] flex-shrink-0">
                          <Label className="text-xs text-slate-500 mb-1 block">Số lượng giao</Label>
                          <Input
                            type="number"
                            min="1"
                            max={od.remainingToDeliver || 1}
                            value={deliveryQtys[od.orderDetailId] || ""}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 0;
                              if (val > (od.remainingToDeliver || 0)) val = od.remainingToDeliver || 0;
                              setDeliveryQtys((prev: any) => ({
                                ...prev,
                                [od.orderDetailId]: val,
                              }));
                            }}
                            className="h-8 text-right font-semibold text-primary"
                          />
                        </div>
                      </div>

                      {/* Per-line address selector */}
                      {customerId && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                          <AddressBookManager
                            customerId={customerId}
                            compact
                            selectedId={selectedAddressIds[od.orderDetailId] ?? null}
                            onSelect={(addrId) =>
                              setSelectedAddressIds((prev) => ({
                                ...prev,
                                [od.orderDetailId]: addrId,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Address Book Manager (expandable) */}
            {customerId && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  onClick={() => setShowAddressBook(!showAddressBook)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Quản lý sổ địa chỉ
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      showAddressBook ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showAddressBook && (
                  <div className="p-4 bg-white dark:bg-slate-900">
                    <AddressBookManager customerId={customerId} />
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label
                htmlFor="delivery-notes"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Ghi chú chung
              </Label>
              <Textarea
                id="delivery-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                rows={2}
                className="resize-none border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 flex-shrink-0 pt-2 border-t border-slate-200 dark:border-slate-800">
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
