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
  User,
  Image as ImageIcon,
  Edit2,
  Loader2,
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
import {
  useDeliveryNotes,
  useCreateDeliveryNote,
  useAvailableOrdersForDelivery,
  useRecreateDeliveryNote,
  useUpdateDeliveryNoteStatus,
  useDeliveryNote,
} from "@/hooks/use-delivery-note";
import type {
  OrderForDeliveryResponse,
  OrderDetailForDeliveryResponse,
  DeliveryNoteResponse,
  DeliveryNoteLineResponse,
} from "@/Schema/delivery-note.schema";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultCustomerAddress,
} from "@/hooks/use-customer";
// import { useOrdersForAccounting } from "@/hooks/use-order";
import { 
  orderStatusLabels, 
  deliveryNoteStatusLabels, 
  deliveryLineStatusLabels,
  orderDetailItemStatusLabels,
  getStatusColorClass,
} from "@/lib/status-utils";
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

type SelectedOrderDetail = OrderDetailForDeliveryResponse & {
  orderCode?: string | null;
  customerName?: string | null;
  orderId?: number;
  customerId?: number;
};

const getDeliveryNoteStatusLabel = (
  status: string | null | undefined,
): string => {
  if (!status) return "—";
  return deliveryNoteStatusLabels[status] || status;
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
  const updateStatusMutation = useUpdateDeliveryNoteStatus(); // No change
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
            {/* Quick actions: only show Start Shipping when allowed */}
            {deliveryNote.id && ["confirmed", "ready_to_ship", "handed_over", "pending"].includes(String(deliveryNote.status || "").toLowerCase()) && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!deliveryNote.id) return;
                    updateStatusMutation.mutate({
                      id: Number(deliveryNote.id),
                      data: {
                        status: "in_transit",
                        cancelReason: null,
                        failureReason: null,
                        failureType: null,
                        affectsDebt: false,
                        notes: null,
                      },
                    });
                  }}
                  disabled={Boolean((updateStatusMutation as any).isPending ?? updateStatusMutation.isPending)}
                >
                  Bắt đầu giao
                </Button>
              </div>
            )}
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
  const updateStatusMutation = useUpdateDeliveryNoteStatus();
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
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
  const [deliveryQtys, setDeliveryQtys] = useState<Record<number, number>>({});

  // Data fetching for all available orders
  const {
    data: allOrders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch: refetchOrders,
  } = useAvailableOrdersForDelivery();

  // Mapping available orders for list display
  const availableOrdersRaw = useMemo(() => {
    return (allOrders ?? []) as OrderForDeliveryResponse[];
  }, [allOrders]);

  // Client-side filtering and pagination for available orders
  const filteredAvailableOrders = useMemo(() => {
    let filtered = [...availableOrdersRaw];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        String(order.code || "").toLowerCase().includes(q) ||
        String(order.customerName || "").toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [availableOrdersRaw, searchQuery]);

  const ordersList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAvailableOrders.slice(start, start + itemsPerPage);
  }, [filteredAvailableOrders, currentPage]);

  const totalPages = Math.ceil(filteredAvailableOrders.length / itemsPerPage);

  // Derive selected orders from the entire pool of available orders
  const selectedOrders = useMemo(() => {
    if (!allOrders) return [] as SelectedOrderDetail[];
    const results: SelectedOrderDetail[] = [];
    allOrders.forEach((order: OrderForDeliveryResponse) => {
      (order.details || []).forEach((detail: OrderDetailForDeliveryResponse) => {
        if (detail.orderDetailId != null && selectedOrderDetailIds.has(detail.orderDetailId)) {
          results.push({
            ...(detail as OrderDetailForDeliveryResponse),
            orderCode: order.orderCode,
            customerName: order.customerName,
            orderId: order.orderId,
            customerId: order.customerId,
          });
        }
      });
    });
    return results;
  }, [allOrders, selectedOrderDetailIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, item) => sum + (item.remainingToDeliver || 0) * (item.unitPrice || 0),
      0,
    );
  }, [selectedOrders]);

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

  const handleToggleSelectNote = (noteId?: number) => {
    if (!noteId) return;
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const items = (deliveryNotesData as any)?.items || [];
    const visibleIds = items.map((i) => i.id ?? undefined).filter((id): id is number => typeof id === "number");
    const allSelected = visibleIds.every((id) => selectedNoteIds.has(id));
    if (allSelected) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(visibleIds));
    }
  };

  const handleBulkStartShipping = async () => {
    const ids = Array.from(selectedNoteIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    setUpdatingIds(new Set(ids));
    try {
      await Promise.all(
        ids.map((id) =>
          updateStatusMutation.mutateAsync({
            id: Number(id),
            data: {
              status: "in_transit",
              cancelReason: null,
              failureReason: null,
              failureType: null,
              affectsDebt: false,
              notes: null,
            },
          })
        )
      );
      toast.success(`Đã cập nhật ${ids.length} phiếu sang Đang giao`);
      setSelectedNoteIds(new Set());
      refetchDeliveryNotes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Lỗi khi cập nhật");
    } finally {
      setBulkLoading(false);
      setUpdatingIds(new Set());
    }
  };

  const createDeliveryNoteMutation = useCreateDeliveryNote();



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
    if (orderDetailId === -1) {
      setSelectedOrderDetailIds(new Set());
      return;
    }
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
    // Collect all orderDetailId from available orders
    const allDetails = availableOrdersRaw.flatMap((o) => (o.details || []).map((d) => d.orderDetailId));
    const uniqueIds = Array.from(new Set(allDetails.filter((id) => id != null))) as number[];
    if (selectedOrderDetailIds.size === uniqueIds.length) {
      setSelectedOrderDetailIds(new Set());
    } else {
      setSelectedOrderDetailIds(new Set(uniqueIds));
    }
  };

  const [recreateNoteId, setRecreateNoteId] = useState<number | null>(null);
  const [isRecreateDialogOpen, setIsRecreateDialogOpen] = useState(false);
  const [recreateItems, setRecreateItems] = useState<DeliveryNoteLineResponse[]>([]);
  const [recreateQtys, setRecreateQtys] = useState<Record<number, number>>({});
  const [recreateAddressIds, setRecreateAddressIds] = useState<Record<number, number | null>>({});
  const [recreateNotes, setRecreateNotes] = useState("");
  const [recreateCustomerId, setRecreateCustomerId] = useState<number | null>(null);

  const { data: recreateNoteData } = useDeliveryNote(recreateNoteId, !!recreateNoteId);
  const recreateNoteDataTyped = recreateNoteData as DeliveryNoteResponse | undefined;
  const recreateMutation = useRecreateDeliveryNote();

  const handleOpenRecreate = (id: number) => {
    setRecreateNoteId(id);
    setIsRecreateDialogOpen(true);
  };

  // When recreateNoteData changes, populate the items
  React.useEffect(() => {
    if (recreateNoteData && isRecreateDialogOpen) {
      const failedLines = (recreateNoteDataTyped?.lines?.filter((l) =>
        l.status === "failed" || l.status === "failure" || l.status === "failed_reschedule" || l.status === "returned"
      ) || []) as DeliveryNoteLineResponse[];
      
      setRecreateItems(failedLines);
      
      const qtys: Record<number, number> = {};
      const addrs: Record<number, number | null> = {};
      
      failedLines.forEach((l) => {
        qtys[l.orderDetailId] = l.deliveryQty || 0;
        addrs[l.orderDetailId] = l.customerAddressId || null;
      });
      
      setRecreateQtys(qtys);
      setRecreateAddressIds(addrs);
      setRecreateNotes(recreateNoteData.notes || "");
      
      // Extract customerId from the first line or note data
      const firstLine = failedLines[0];
      let cid: number | null = null;
      if (firstLine && firstLine.customerAddress && typeof firstLine.customerAddress.customerId === 'number') {
        cid = firstLine.customerAddress.customerId;
      } else if (firstLine && typeof (firstLine as any).customerId === 'number') {
        cid = (firstLine as any).customerId;
      } else if (typeof recreateNoteDataTyped?.customerId === 'number') {
        cid = recreateNoteDataTyped.customerId;
      }
      setRecreateCustomerId(cid);
    }
  }, [recreateNoteData, isRecreateDialogOpen]);

  const handleConfirmedRecreate = async () => {
    if (!recreateNoteId) return;
    
    const payload = {
      originalDeliveryNoteId: recreateNoteId,
      lines: recreateItems.map(item => ({
        orderDetailId: item.orderDetailId,
        deliveryQty: recreateQtys[item.orderDetailId] || 0,
        customerAddressId: recreateAddressIds[item.orderDetailId] || undefined,
      })),
      notes: recreateNotes,
    };
    
    await recreateMutation.mutateAsync(payload);
    setIsRecreateDialogOpen(false);
    setRecreateNoteId(null);
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
      refetchOrders();
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
            selectedOrderDetailIds={selectedOrderDetailIds}
            handleToggleOrderDetail={handleToggleOrderDetail}
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
            handleOpenRecreate={handleOpenRecreate}
            selectedNoteIds={selectedNoteIds}
            handleToggleSelectNote={handleToggleSelectNote}
            handleSelectAllVisible={handleSelectAllVisible}
            handleClearSelection={() => setSelectedNoteIds(new Set())}
            bulkLoading={bulkLoading}
            handleBulkStartShipping={handleBulkStartShipping}
            updatingIds={updatingIds}
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

      <RecreateDeliveryNoteDialog
        isOpen={isRecreateDialogOpen}
        onOpenChange={setIsRecreateDialogOpen}
        items={recreateItems}
        qtys={recreateQtys}
        setQtys={setRecreateQtys}
        addressIds={recreateAddressIds}
        setAddressIds={setRecreateAddressIds}
        customerId={recreateCustomerId}
        notes={recreateNotes}
        setNotes={setRecreateNotes}
        onConfirm={handleConfirmedRecreate}
        isPending={recreateMutation.isPending}
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
  ordersList: Array<OrderForDeliveryResponse>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedOrderDetailIds: Set<number>;
  handleToggleOrderDetail: (id: number) => void;
  selectedOrders: Array<SelectedOrderDetail>;
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
  selectedOrderDetailIds,
  handleToggleOrderDetail,
  selectedOrders,
  totalSelectedAmount,
  handleCreateDeliveryNote,
}: OrdersViewProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Filter Bar */}
      <Card className="border-0 shadow-sm shrink-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã đơn, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchOrders()}
              disabled={ordersLoading}
              className="h-10 w-10 border-slate-200"
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

      {/* Selection Summary */}
      {selectedOrderDetailIds.size > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm">
                Đã chọn <span className="font-bold">{selectedOrderDetailIds.size}</span> sản phẩm
              </p>
            </div>
            <div className="h-6 w-px bg-primary/20" />
            <p className="text-sm">
              Tổng cộng: <span className="font-bold text-primary">{formatCurrency(totalSelectedAmount)}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleToggleOrderDetail(-1)}
              className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
             >
               Hủy
             </Button>
             <Button 
              size="sm"
              className="h-9 px-6 font-bold bg-primary hover:bg-primary/90"
              onClick={handleCreateDeliveryNote}
             >
              TIẾP TỤC
              <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-auto border rounded-xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-11 font-bold text-xs uppercase tracking-wider">Đơn hàng</TableHead>
                <TableHead className="h-11 font-bold text-xs uppercase tracking-wider">Khách hàng</TableHead>
                <TableHead className="h-11 font-bold text-xs uppercase tracking-wider text-center">Trạng thái</TableHead>
                <TableHead className="h-11 font-bold text-xs uppercase tracking-wider text-center">Số lượng bài</TableHead>
                <TableHead className="h-11 font-bold text-xs uppercase tracking-wider text-right pr-6">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : ordersList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng nào khả dụng</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                ordersList.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow className="bg-white hover:bg-white border-t border-slate-100">
                      <TableCell className="py-4">
                        <div className="font-bold text-primary text-sm flex flex-col">
                          <span>{order.orderCode}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">{formatDate(order.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                             <User className="h-3.5 w-3.5 text-slate-500" />
                           </div>
                           <span className="text-sm font-semibold text-slate-700">{order.customerName}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          status={order.status || ""}
                          label={orderStatusLabels[order.status || ""]}
                          className="px-3"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black">
                          {order.details?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-black text-slate-900 text-sm">
                        {formatCurrency(order.totalAmount || 0)}
                      </TableCell>
                    </TableRow>
                    {/* Items Sub-table */}
                    {order.details && order.details.length > 0 && (
                      <TableRow key={`details-${order.id}`} className="bg-slate-50/50 hover:bg-slate-50/50 border-0">
                        <TableCell colSpan={5} className="py-0 px-4 pb-4">
                          <div className="rounded-xl overflow-hidden border border-slate-200/60 bg-white/70 shadow-sm">
                            <Table>
                              <TableBody>
                                {order.details.map((detail: OrderDetailForDeliveryResponse) => {
                                  const isChecked = selectedOrderDetailIds.has(detail.orderDetailId);
                                  return (
                                    <TableRow 
                                      key={detail.id} 
                                      className={`border-b last:border-0 border-slate-100/60 cursor-pointer transition-colors ${isChecked ? 'bg-primary/[0.03] hover:bg-primary/[0.05]' : 'hover:bg-slate-50/50'}`}
                                      onClick={() => handleToggleOrderDetail(detail.orderDetailId)}
                                    >
                                      <TableCell className="w-12 pl-6">
                                        <Checkbox 
                                          checked={isChecked}
                                          onCheckedChange={() => handleToggleOrderDetail(detail.orderDetailId)}
                                          className="h-4 w-4 rounded"
                                        />
                                      </TableCell>
                                      <TableCell className="w-[80px]">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                          <ImageIcon className="h-5 w-5 text-slate-300" />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-mono font-black text-xs text-slate-900 uppercase leading-none">{detail.designCode}</span>
                                          <span className="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[300px]">{detail.designName}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="w-[150px]">
                                        <Badge
                                          variant="outline"
                                          className={`h-6 text-[10px] font-bold ${getStatusColorClass(detail.itemStatus)}`}
                                        >
                                          {orderDetailItemStatusLabels[detail.itemStatus as string] || detail.itemStatus || "—"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="w-[120px] text-right pr-6 font-black text-slate-600 text-sm">
                                        x{new Intl.NumberFormat('vi-VN').format(detail.remainingToDeliver || 0)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <div className="text-sm font-medium text-slate-500 font-semibold">
               Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    className="h-8 w-8 p-0 font-bold"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
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
  handleOpenRecreate: (id: number) => void;
  selectedNoteIds: Set<number>;
  handleToggleSelectNote: (id?: number) => void;
  handleSelectAllVisible: () => void;
  handleClearSelection: () => void;
  bulkLoading: boolean;
  handleBulkStartShipping: () => void;
  updatingIds: Set<number>;
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
  handleOpenRecreate,
  selectedNoteIds,
  handleToggleSelectNote,
  handleSelectAllVisible,
  handleClearSelection,
  bulkLoading,
  handleBulkStartShipping,
  updatingIds,
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
            <div className="flex items-center gap-2">
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
                {Object.entries(deliveryNoteStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
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

                  {selectedNoteIds.size > 0 && (
                <div className="ml-2 flex items-center gap-2">
                  <div className="text-sm text-slate-700">Đã chọn <strong>{selectedNoteIds.size}</strong></div>
                  <Button size="sm" onClick={() => handleClearSelection()} variant="outline">Bỏ chọn</Button>
                  <Button size="sm" onClick={handleBulkStartShipping} disabled={bulkLoading}>
                    {bulkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Bắt đầu giao
                  </Button>
                </div>
              )}
            </div>
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
                  <TableHead className="w-10 font-semibold text-slate-700 dark:text-slate-300">
                    <Checkbox
                      checked={
                        !!deliveryNotesDataTyped?.items && deliveryNotesDataTyped.items.length > 0 && deliveryNotesDataTyped.items.every(i => selectedNoteIds.has(i.id as number))
                      }
                      onCheckedChange={() => handleSelectAllVisible()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
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
                <TableHead className="w-[100px] text-right font-semibold text-slate-700 dark:text-slate-300 pr-6">
                  Thao tác
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
                    {Array.from({ length: 8 }).map((_, j) => (
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
                    colSpan={8}
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
                      className={`cursor-pointer transition-all duration-150 border-slate-200 dark:border-slate-800 ${updatingIds.has(deliveryNote.id as number) ? 'opacity-70' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                      onClick={() => handleViewDeliveryNote(deliveryNote.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedNoteIds.has(deliveryNote.id as number)}
                          onCheckedChange={() => handleToggleSelectNote(deliveryNote.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
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
                        {updatingIds.has(deliveryNote.id as number) ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                        ) : (
                          <StatusBadge
                            status={deliveryNote.status || null}
                            label={getDeliveryNoteStatusLabel(
                              deliveryNote.status,
                            )}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(deliveryNote.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         {deliveryNote.status === "failed" && (
                           <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRecreate(deliveryNote.id!);
                            }}
                           >
                             <RefreshCw className="h-3 w-3" />
                             Giao lại
                           </Button>
                         )}
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
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  const { data: addresses, isLoading } = useCustomerAddresses(customerId, true);
  const createMutation = useCreateCustomerAddress(customerId);
  const updateMutation = useUpdateCustomerAddress(customerId);
  const deleteMutation = useDeleteCustomerAddress(customerId);
  const setDefaultMutation = useSetDefaultCustomerAddress(customerId);

  const resetForm = () => {
    setNewLabel("");
    setNewRecipientName("");
    setNewRecipientPhone("");
    setNewAddress("");
    setNewIsDefault(false);
    setEditingAddressId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: { id?: number; label?: string; recipientName?: string; recipientPhone?: string; address?: string; isDefault?: boolean }) => {
    setEditingAddressId(addr.id);
    setNewLabel(addr.label || "");
    setNewRecipientName(addr.recipientName || "");
    setNewRecipientPhone(addr.recipientPhone || "");
    setNewAddress(addr.address || "");
    setNewIsDefault(addr.isDefault || false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!newLabel.trim() || !newAddress.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (Nhãn và Địa chỉ)");
      return;
    }

    try {
      if (editingAddressId) {
        await updateMutation.mutateAsync({
          addressId: editingAddressId,
          data: {
            label: newLabel,
            recipientName: newRecipientName || null,
            recipientPhone: newRecipientPhone || null,
            address: newAddress,
            isDefault: newIsDefault,
            isActive: true
          }
        });
      } else {
        await createMutation.mutateAsync({
          label: newLabel,
          recipientName: newRecipientName || null,
          recipientPhone: newRecipientPhone || null,
          address: newAddress,
          isDefault: newIsDefault,
        });
      }
      resetForm();
    } catch (err) {
      // toast.error handled in mutation hooks
    }
  };

  const renderForm = () => (
    <Card className="border-dashed border-primary/40 bg-primary/5 shadow-inner">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            {editingAddressId ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-slate-500 font-bold">Nhãn địa chỉ *</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="VD: Kho hàng, Văn phòng..."
              className="h-8 text-xs bg-white dark:bg-slate-900"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-slate-500 font-bold">Người nhận</Label>
            <Input
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              placeholder="Họ tên người nhận"
              className="h-8 text-xs bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-slate-500 font-bold">Số điện thoại</Label>
            <Input
              value={newRecipientPhone}
              onChange={(e) => setNewRecipientPhone(e.target.value)}
              placeholder="09xx xxx xxx"
              className="h-8 text-xs bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex items-end pb-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`isDefault-${customerId}-${editingAddressId || 'new'}`}
                checked={newIsDefault}
                onCheckedChange={(v) => setNewIsDefault(!!v)}
              />
              <Label 
                htmlFor={`isDefault-${customerId}-${editingAddressId || 'new'}`} 
                className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Đặt làm mặc định
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-slate-500 font-bold">Địa chỉ chi tiết *</Label>
          <Input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Số nhà, tên đường, phường/xã..."
            className="h-8 text-xs bg-white dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            className="h-7 text-xs border border-slate-200 dark:border-slate-700"
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="h-7 text-xs gap-1 font-bold shadow-sm"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              editingAddressId ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />
            )}
            {editingAddressId ? "CẬP NHẬT" : "LƯU ĐỊA CHỈ"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <Select
                value={selectedId != null ? String(selectedId) : "__none__"}
                onValueChange={(val) => {
                  if (onSelect) {
                    onSelect(val === "__none__" ? null : Number(val));
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 truncate">
                    <Navigation className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Chọn địa chỉ giao..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-slate-400 text-xs italic">Không chọn địa chỉ</span>
                  </SelectItem>
                  {addresses && addresses.map((addr) => (
                    <SelectItem key={addr.id} value={String(addr.id)}>
                      <div className="flex items-center gap-1.5">
                        {addr.isDefault && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        <span className="text-xs font-semibold">{addr.label}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">({addr.address})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
              title="Thêm địa chỉ mới"
              onClick={() => {
                if (showForm && editingAddressId) {
                  resetForm();
                  setShowForm(true);
                } else {
                  setShowForm(!showForm);
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            {selectedId != null && (
               <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-blue-500 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
                title="Sửa địa chỉ này"
                onClick={() => {
                  const addr = addresses?.find(a => a.id === selectedId);
                  if (addr) handleEdit(addr);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {showForm && renderForm()}

        {selectedId != null && !showForm && addresses && (() => {
          const sel = addresses.find(a => a.id === selectedId);
          return sel ? (
            <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2 py-1.5 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1">
              <MapPin className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{sel.recipientName || "Người nhận"}</span>
                  {sel.recipientPhone && <span className="ml-1 text-slate-500 dark:text-slate-400">• {sel.recipientPhone}</span>}
                  {sel.address && <span className="ml-1 italic text-slate-500 dark:text-slate-400">• {sel.address}</span>}
                </p>
              </div>
            </div>
          ) : null;
        })()}
      </div>
    );
  }

  // Full CRUD mode
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Sổ địa chỉ khách hàng
          </h4>
          <Badge variant="outline" className="px-1.5 h-5 text-[10px] font-bold bg-slate-50 dark:bg-slate-800">
            {addresses?.length || 0}
          </Badge>
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="default"
            onClick={() => setShowForm(true)}
            className="h-8 shadow-md gap-1.5 font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            THÊM ĐỊA CHỈ
          </Button>
        )}
      </div>

      {showForm && renderForm()}

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : !addresses || addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
            <MapPin className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-medium">Chưa có địa chỉ nào được lưu</p>
            <p className="text-xs text-slate-400 mt-1">Bấm nút "Thêm địa chỉ" để bắt đầu</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                selectedId === addr.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
              onClick={() => onSelect && onSelect(addr.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-50 truncate">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <Badge variant="secondary" className="h-4 text-[8px] px-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 border-none font-bold">
                      MẶC ĐỊNH
                    </Badge>
                  )}
                  {selectedId === addr.id && (
                    <Badge className="h-4 text-[8px] px-1 bg-primary font-bold">ĐÃ CHỌN</Badge>
                  )}
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <User className="h-3 w-3 text-slate-400" />
                    {addr.recipientName || "Chưa có tên"}
                    {addr.recipientPhone && (
                      <span className="text-slate-400 font-normal">| {addr.recipientPhone}</span>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
                    <span className="leading-relaxed">{addr.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    title="Đặt làm mặc định"
                    onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(addr.id); }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  title="Chỉnh sửa"
                  onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Xóa địa chỉ"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(addr.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREATE DIALOG COMPONENT
// ============================================================================

interface CreateDeliveryNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: Array<SelectedOrderDetail>;
  deliveryQtys: Record<number, number>;
  setDeliveryQtys: React.Dispatch<React.SetStateAction<Record<number, number>>>;
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
                              setDeliveryQtys((prev: Record<number, number>) => ({
                                ...prev,
                                [od.orderDetailId]: val,
                              }));
                            }}
                            className="h-8 text-right font-semibold text-primary"
                          />
                        </div>
                      </div>

                      {/* Per-line address selector */}
                      {od.customerId && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                          <AddressBookManager
                            customerId={od.customerId}
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

// ============================================================================
// RECREATE DIALOG COMPONENT
// ============================================================================

interface RecreateDeliveryNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: DeliveryNoteLineResponse[];
  qtys: Record<number, number>;
  setQtys: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  addressIds: Record<number, number | null>;
  setAddressIds: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  customerId: number | null;
  notes: string;
  setNotes: (notes: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function RecreateDeliveryNoteDialog({
  isOpen,
  onOpenChange,
  items,
  qtys,
  setQtys,
  addressIds,
  setAddressIds,
  customerId,
  notes,
  setNotes,
  onConfirm,
  isPending,
}: RecreateDeliveryNoteDialogProps) {
  const [showAddressBook, setShowAddressBook] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] border-slate-200 dark:border-slate-800 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Tạo lại phiếu giao hàng (Giao lại)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Hệ thống đã tự động lấy danh sách {items.length} mặt hàng giao thất bại. Vui lòng kiểm tra địa chỉ và số lượng trước khi xác nhận.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-2">
            {/* Per-line items */}
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.orderDetailId}
                  className="border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                            {item.designCode}{" "}
                            {item.orderCode && <span className="text-slate-400 font-sans text-xs">({item.orderCode})</span>}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">
                            {item.designName}
                          </div>
                        </div>
                        <div className="w-[110px] flex-shrink-0">
                          <Label className="text-xs text-slate-500 mb-1 block">Số lượng giao</Label>
                          <Input
                            type="number"
                            min="1"
                            value={qtys[item.orderDetailId] || ""}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 0;
                              setQtys((prev: Record<number, number>) => ({
                                ...prev,
                                [item.orderDetailId]: val,
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
                            selectedId={addressIds[item.orderDetailId] ?? null}
                            onSelect={(addrId) =>
                              setAddressIds((prev) => ({
                                ...prev,
                                [item.orderDetailId]: addrId,
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
                      Quản lý sổ địa chỉ của khách
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
                htmlFor="recreate-notes"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Ghi chú giao lại
              </Label>
              <Textarea
                id="recreate-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Khách hẹn giao lại vào chiều nay..."
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
            onClick={onConfirm}
            disabled={isPending || items.length === 0}
            className="gap-2 font-semibold bg-primary hover:bg-primary/90"
          >
            <Truck className="h-4 w-4" />
            {isPending ? "Đang xử lý..." : "XÁC NHẬN GIAO LẠI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
