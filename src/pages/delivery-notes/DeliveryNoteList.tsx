import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Filter,
  Truck,
  ChevronLeft,
  ChevronRight,
  Check,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  useDeliveryNotes,
  useCreateDeliveryNote,
  useAvailableOrdersForDelivery,
  useRecreateDeliveryNote,
  useUpdateDeliveryNoteStatus,
  useDeliveryNote,
} from "@/hooks/use-delivery-note";
import { useCreateStockOutForDelivery } from "@/hooks/use-stock";
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

const getDisplayStatus = (note: { lines?: Array<{ status?: string | null }>; status?: string | null }) => {
  const lines = note.lines || [];

  const hasDelivered = lines.some((l) => l.status === "delivered");
  const hasReschedule = lines.some((l) => l.status === "failed_reschedule");
  const hasFailed = lines.some((l) => l.status === "failed");

  if (note.status === "cancelled" && (hasDelivered || hasReschedule)) {
    return "partial";
  }

  if (hasReschedule) return "failed_reschedule";
  if (hasDelivered && hasFailed) return "partial";
  if (hasDelivered) return "completed";
  if (hasFailed) return "failed";

  return note.status;
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

const getDefaultLineNote = (designName: string | null | undefined): string => {
  if (!designName) return "";
  const lowerName = designName.toLowerCase();
  if (lowerName.includes("nhãn giấy")) {
    return "Xấp 500";
  }
  if (lowerName.includes("decal")) {
    return "Xấp 400";
  }
  if (lowerName.includes("túi")) {
    return "Xấp 100";
  }
  return "";
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
              status={getDisplayStatus(deliveryNote) || null}
              label={getDeliveryNoteStatusLabel(getDisplayStatus(deliveryNote))}
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
  // Single address selection for Create dialog (backend expects one address per delivery note)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

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
  const [lineNotes, setLineNotes] = useState<Record<number, string>>({});

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
    if (!allOrders) return [];
    if (Array.isArray(allOrders)) return allOrders as OrderForDeliveryResponse[];
    if (typeof allOrders === "object" && "items" in (allOrders as any)) {
      return ((allOrders as any).items || []) as OrderForDeliveryResponse[];
    }
    return [] as OrderForDeliveryResponse[];
  }, [allOrders]);

  // Client-side filtering and pagination for available orders
  const filteredAvailableOrders = useMemo(() => {
    if (!Array.isArray(availableOrdersRaw)) return [];
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
    const pool = availableOrdersRaw;
    if (!pool || !Array.isArray(pool)) return [] as SelectedOrderDetail[];
    const results: SelectedOrderDetail[] = [];
    pool.forEach((order: OrderForDeliveryResponse) => {
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
    // Only select items that are not completed and not reschedule failed
    const selectableIds = items
      .filter(
        (i: any) =>
          getDisplayStatus(i) !== "completed" &&
          getDisplayStatus(i) !== "failed_reschedule"
      )
      .map((i: any) => i.id ?? undefined)
      .filter((id: any): id is number => typeof id === "number");
      
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedNoteIds.has(id));
    
    if (allSelected) {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach(id => next.add(id));
        return next;
      });
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
  const { mutateAsync: createStockOutForDelivery } = useCreateStockOutForDelivery();



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
  const [recreateLineNotes, setRecreateLineNotes] = useState<Record<number, string>>({});
  const [recreateAddressIds, setRecreateAddressIds] = useState<Record<number, number | null>>({});
  const [recreateSelectedAddressId, setRecreateSelectedAddressId] = useState<number | null>(null);
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
      const rNotes: Record<number, string> = {};
      
      failedLines.forEach((l) => {
        qtys[l.orderDetailId] = l.deliveryQty || 0;
        addrs[l.orderDetailId] = l.customerAddressId || null;
        rNotes[l.orderDetailId] = l.note || getDefaultLineNote(l.designName);
      });
      
      setRecreateQtys(qtys);
      setRecreateLineNotes(rNotes);
      setRecreateAddressIds(addrs);
      // choose first non-null address as the shared address for recreate
      const firstAddr = Object.values(addrs).find((v) => v != null);
      setRecreateSelectedAddressId(typeof firstAddr === "number" ? firstAddr : null);
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
    if (!recreateSelectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    const lines = recreateItems
      .map((item) => ({
        orderDetailId: item.orderDetailId,
        deliveryQty: recreateQtys[item.orderDetailId] || 0,
        note: recreateLineNotes[item.orderDetailId] || undefined,
      }))
      .filter((l) => l.deliveryQty > 0);

    if (lines.length === 0) {
      toast.error("Vui lòng nhập số lượng giao");
      return;
    }

    const payload = {
      originalDeliveryNoteId: recreateNoteId,
      customerAddressId: recreateSelectedAddressId,
      notes: recreateNotes,
      lines,
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
    const defaultLineNotes: Record<number, string> = {};
    selectedOrders.forEach(od => {
      if (od.orderDetailId != null) {
        qtys[od.orderDetailId] = od.remainingToDeliver || 0;
        defaultLineNotes[od.orderDetailId] = getDefaultLineNote(od.designName);
      }
    });
    setDeliveryQtys(qtys);
    setLineNotes(defaultLineNotes);
    setSelectedAddressIds({});
    // Default customer/address: take from first selected order detail
    const firstSelected = selectedOrders[0];
    const defaultCustomerId = firstSelected?.customerId ?? selectedCustomerId;
    let defaultAddress: number | null = null;
    if (firstSelected && firstSelected.orderDetailId != null) {
      defaultAddress = selectedAddressIds[firstSelected.orderDetailId] ?? null;
    }
    setSelectedCustomerId(defaultCustomerId ?? null);
    setSelectedAddressId(defaultAddress ?? null);

    setIsCreateDialogOpen(true);
  };

  // Quantity state map for selected details


  const handleConfirmCreate = async () => {
    if (selectedOrderDetailIds.size === 0) return;

    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    const lines = selectedOrders
      .map((od) => ({
        orderDetailId: od.orderDetailId,
        deliveryQty: deliveryQtys[od.orderDetailId] || 0,
        note: lineNotes[od.orderDetailId] || undefined,
      }))
      .filter((l) => l.deliveryQty > 0);

    if (lines.length === 0) {
      toast.error("Vui lòng nhập số lượng giao");
      return;
    }

    try {
      const payload = {
        customerAddressId: selectedAddressId,
        notes: notes || undefined,
        lines,
      };

      const res = await createDeliveryNoteMutation.mutateAsync(payload as any);

      // AUTO STOCK OUT FOR DELIVERY
      if (res && res.id) {
        // Find valid selected orders that have deliveryQty > 0
        const validOrders = selectedOrders.filter(
          (od) => od.orderDetailId && (deliveryQtys[od.orderDetailId] || 0) > 0
        );

        const ordersGrouped = validOrders.reduce((acc, od) => {
          if (!od.orderId) return acc;
          if (!acc[od.orderId]) acc[od.orderId] = [];
          acc[od.orderId].push(od);
          return acc;
        }, {} as Record<number, typeof selectedOrders>);

        for (const [orderIdStr, ods] of Object.entries(ordersGrouped)) {
          const orderId = Number(orderIdStr);
          await createStockOutForDelivery({
            deliveryNoteId: res.id,
            customerId: ods[0].customerId || 0,
            orderId: orderId,
            itemType: "product",
            notes: "Xuất kho tự động khi tạo phiếu giao hàng",
            stockOutDate: new Date().toISOString(),
            items: ods.map((od) => ({
              itemName: od.designName || "Thành phẩm",
              itemCode: od.designCode || "SP",
              unit: "Cái",
              quantity: deliveryQtys[od.orderDetailId!] || 0,
              notes: lineNotes[od.orderDetailId!] || "",
              materialId: 0,
              orderDetailId: od.orderDetailId || 0,
            })),
          }).catch((err: any) => console.error("Lỗi xuất kho tự động:", err));
        }
      }

      setSelectedOrderDetailIds(new Set());
      setDeliveryQtys({});
      setLineNotes({});
      setSelectedAddressIds({});
      setSelectedAddressId(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Phiếu giao hàng
        </h1>
        <p className="text-muted-foreground">
          Quản lý đơn hàng và phiếu giao hàng
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as "orders" | "delivery-notes")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Tạo Phiếu Giao Hàng</TabsTrigger>
          <TabsTrigger value="delivery-notes">Phiếu giao hàng đã tạo</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
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
        </TabsContent>

        <TabsContent value="delivery-notes" className="mt-6">
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
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateDeliveryNoteDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedOrders={selectedOrders}
        deliveryQtys={deliveryQtys}
        setDeliveryQtys={setDeliveryQtys}
        lineNotes={lineNotes}
        setLineNotes={setLineNotes}
        selectedAddressId={selectedAddressId}
        setSelectedAddressId={setSelectedAddressId}
        selectedAddressIds={selectedAddressIds}
        setSelectedAddressIds={setSelectedAddressIds}
        customerId={selectedOrders[0]?.customerId ?? selectedCustomerId}
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
        lineNotes={recreateLineNotes}
        setLineNotes={setRecreateLineNotes}
        addressIds={recreateAddressIds}
        setAddressIds={setRecreateAddressIds}
        selectedAddressId={recreateSelectedAddressId}
        setSelectedAddressId={setRecreateSelectedAddressId}
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
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Auto-expand all orders when the list loads or changes
  useEffect(() => {
    if (ordersList.length > 0) {
      setExpandedOrders(new Set(ordersList.map((o) => o.orderId)));
    }
  }, [ordersList]);

  const toggleOrder = (orderId: number) => {
    const next = new Set(expandedOrders);
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
    }
    setExpandedOrders(next);
  };

  return (
    <div className="space-y-4">
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

      {/* Main Content Card */}
      <div className="flex flex-col bg-background rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-muted/5 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            disabled={ordersLoading}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Error Alert */}
        {ordersError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>
                {ordersErrorObj instanceof Error ? ordersErrorObj.message : "Có lỗi xảy ra khi tải danh sách đơn hàng"}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px] font-semibold text-slate-700 dark:text-slate-300">Đơn hàng</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Khách hàng</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Trạng thái</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">Số lượng bài</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : ordersList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-10 w-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">Không tìm thấy đơn hàng nào khả dụng</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                ordersList.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderId);
                  return (
                    <React.Fragment key={order.orderId}>
                      <TableRow
                        className={`cursor-pointer transition-all duration-150 border-slate-200 dark:border-slate-800 ${
                          isExpanded
                            ? "bg-slate-50/80 dark:bg-slate-900/50"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                        onClick={() => toggleOrder(order.orderId)}
                      >
                        <TableCell className="text-center py-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-medium font-mono text-xs">{order.orderCode}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {order.customerName}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge
                            status={order.status || ""}
                            label={orderStatusLabels[order.status || ""]}
                            className="px-3"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {order.details?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-sm">
                          {formatCurrency(order.totalAmount || 0)}
                        </TableCell>
                      </TableRow>

                      {/* Detail rows and sub-headers under expanded parent */}
                      {isExpanded && (
                        <>
                          {/* Detail Rows */}
                          {order.details?.map((detail: OrderDetailForDeliveryResponse) => {
                            const isChecked = selectedOrderDetailIds.has(detail.orderDetailId);
                            return (
                              <TableRow
                                key={detail.orderDetailId}
                                className={`cursor-pointer transition-all duration-150 border-slate-200 dark:border-slate-800 ${
                                  isChecked
                                    ? "bg-primary/[0.04] hover:bg-primary/[0.06]"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                }`}
                                onClick={() => handleToggleOrderDetail(detail.orderDetailId)}
                              >
                                <TableCell />
                                <TableCell colSpan={2} className="pl-12 py-1.5">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() => handleToggleOrderDetail(detail.orderDetailId)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-4 w-4 rounded flex-shrink-0"
                                    />
                                    <div className="h-8 w-8 rounded-lg bg-muted/50 border flex items-center justify-center flex-shrink-0">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-mono font-black text-xs uppercase leading-none">{detail.designCode}</span>
                                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-[280px]">{detail.designName}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-1.5">
                                  <Badge
                                    variant="outline"
                                    className={`h-6 text-[10px] font-bold px-2 ${getStatusColorClass(detail.itemStatus)}`}
                                  >
                                    {orderDetailItemStatusLabels[detail.itemStatus as string] || detail.itemStatus || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center py-1.5 font-bold tabular-nums text-sm">
                                  x{new Intl.NumberFormat('vi-VN').format(detail.remainingToDeliver || 0)}
                                </TableCell>
                                <TableCell />
                              </TableRow>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Spacer between orders if not expanded */}
                      {!isExpanded && (
                        <TableRow className="h-2 bg-transparent hover:bg-transparent border-0 pointer-events-none">
                          <TableCell colSpan={6} className="p-0" />
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs text-muted-foreground">
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
              <div className="text-xs font-medium bg-background border px-3 py-1.5 rounded-md min-w-[80px] text-center">
                Trang {currentPage} / {totalPages}
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

    // Sort delivery notes so items needing action float to top:
    // 1) status === 'pending' (chờ giao hàng)
    // 2) notes with no delivered lines (chưa giao)
    // 3) others
    const sortedDeliveryNotes = useMemo(() => {
      const items = (deliveryNotesDataTyped?.items || []).slice();
      const priority = (note: any) => {
        if (!note) return 3;
        if (String(note.status) === "pending") return 0;
        const lines = note.lines || [];
        const hasDelivered = lines.some((l: any) => l && l.status === "delivered");
        if (!hasDelivered) return 1;
        return 2;
      };

      items.sort((a: any, b: any) => {
        const pa = priority(a);
        const pb = priority(b);
        if (pa !== pb) return pa - pb;
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da; // newer first
      });
      return items;
    }, [deliveryNotesDataTyped]);

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
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-700 dark:text-slate-300">
                    Mã phiếu
                  </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Số lượng mã hàng
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Khách hàng
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
                sortedDeliveryNotes.map((deliveryNote) => {
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
                        {getDisplayStatus(deliveryNote) === "completed" ? (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-500" />
                          </div>
                        ) : getDisplayStatus(deliveryNote) === "failed_reschedule" ? (
                          null
                        ) : (
                          <Checkbox
                            checked={selectedNoteIds.has(deliveryNote.id as number)}
                            onCheckedChange={() => handleToggleSelectNote(deliveryNote.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
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
                            {deliveryNote.lines?.length ?? 0} mã hàng
                          </div>
                          {/* <div className="space-y-0.5">
                            {deliveryNote.lines?.slice(0, 2).map((line: any, idx: number) => (
                              <div
                                key={line?.id ?? idx}
                                className="text-xs text-slate-500 dark:text-slate-400 font-mono"
                              >
                                {line?.designCode || line?.orderCode || "—"}
                              </div>
                            ))}
                            {deliveryNote.lines && deliveryNote.lines.length > 2 && (
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                +{deliveryNote.lines.length - 2} mã hàng khác
                              </div>
                            )}
                          </div> */}
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
                    
                      <TableCell className="text-center">
                        {updatingIds.has(deliveryNote.id as number) ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                        ) : (
                          <StatusBadge
                            status={getDisplayStatus(deliveryNote) || null}
                            label={getDeliveryNoteStatusLabel(getDisplayStatus(deliveryNote))}
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

  const sortedAddresses = useMemo(() => {
    if (!addresses) return [];
    return [...addresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [addresses]);

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
    <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            {editingAddressId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={resetForm}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 font-bold uppercase">Nhãn địa chỉ *</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="VD: Kho hàng, Văn phòng..."
              className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 font-bold uppercase">Người nhận</Label>
            <Input
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              placeholder="Họ tên người nhận"
              className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 font-bold uppercase">Số điện thoại</Label>
            <Input
              value={newRecipientPhone}
              onChange={(e) => setNewRecipientPhone(e.target.value)}
              placeholder="09xx xxx xxx"
              className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none font-medium"
              >
                Đặt làm mặc định
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-slate-500 font-bold uppercase">Địa chỉ chi tiết *</Label>
          <Input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Số nhà, tên đường, phường/xã..."
            className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/85">
          <Button
            variant="outline"
            size="sm"
            onClick={resetForm}
            className="h-8 text-xs border-slate-200"
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="h-8 text-xs font-semibold gap-1"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              editingAddressId ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />
            )}
            {editingAddressId ? "Cập nhật" : "Lưu địa chỉ"}
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
                <SelectContent className="max-w-[500px]">
                  <SelectItem value="__none__">
                    <span className="text-slate-400 text-xs italic">Không chọn địa chỉ</span>
                  </SelectItem>
                  {sortedAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={String(addr.id)}>
                      {/* 1. Layout shown inside the Dropdown Popover (when NOT inside a button/trigger) */}
                      <div className="py-1 text-left max-w-[450px] flex items-center gap-1.5 flex-wrap text-[11px] [button_&]:hidden">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
                          {addr.label}
                          {addr.isDefault && <Star className="inline h-2.5 w-2.5 ml-0.5 text-amber-500 fill-amber-500" />}
                        </span>
                        {(addr.recipientName || addr.recipientPhone) && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-slate-600 dark:text-slate-400 flex-shrink-0">
                              {[addr.recipientName, addr.recipientPhone].filter(Boolean).join(" - ")}
                            </span>
                          </>
                        )}
                        {addr.address && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-slate-500 dark:text-slate-400 break-words">{addr.address}</span>
                          </>
                        )}
                      </div>

                      {/* 2. Layout shown inside the SelectTrigger button (when inside a button/trigger) */}
                      <div className="hidden [button_&]:inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 max-w-full truncate">
                        {addr.isDefault && <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        <span className="font-bold">{addr.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* <Button
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
            </Button> */}
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
            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md px-2 py-1.5 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 flex-wrap">
              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
              {sel.label && (
                <span className="font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
                  {sel.label}
                  {sel.isDefault && <Star className="inline h-2.5 w-2.5 ml-0.5 text-amber-500 fill-amber-500" />}
                </span>
              )}
              {(sel.recipientName || sel.recipientPhone) && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-600 dark:text-slate-400 flex-shrink-0">
                    {[sel.recipientName, sel.recipientPhone].filter(Boolean).join(" - ")}
                  </span>
                </>
              )}
              {sel.address && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500 dark:text-slate-400 break-words">{sel.address}</span>
                </>
              )}
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
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Sổ địa chỉ khách hàng
          </h4>
          <Badge variant="secondary" className="px-1.5 h-4.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800">
            {addresses?.length || 0}
          </Badge>
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="h-7 px-2 text-xs border-primary/30 text-primary hover:bg-primary/5 gap-1 font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            THÊM ĐỊA CHỈ
          </Button>
        )}
      </div>

      {showForm && renderForm()}

      <div className="grid gap-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
        ) : !addresses || addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
            <MapPin className="h-6 w-6 text-slate-300 mb-1.5" />
            <p className="text-xs text-slate-500 font-semibold">Chưa có địa chỉ nào được lưu</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Bấm nút "Thêm địa chỉ" để bắt đầu</p>
          </div>
        ) : (
          sortedAddresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                selectedId === addr.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
              onClick={() => onSelect && onSelect(selectedId === addr.id ? null : addr.id)}
            >
              <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">{addr.label}</span>
                {addr.isDefault && (
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1 rounded font-bold border border-amber-200/50 dark:border-amber-800/50 flex-shrink-0">
                    MẶC ĐỊNH
                  </span>
                )}
                {selectedId === addr.id && (
                  <span className="text-[9px] bg-primary text-primary-foreground px-1 rounded font-bold flex-shrink-0">
                    ĐÃ CHỌN
                  </span>
                )}
                {(addr.recipientName || addr.recipientPhone) && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 flex-shrink-0">·</span>
                    <span className="text-slate-600 dark:text-slate-400 flex-shrink-0">
                      {[addr.recipientName, addr.recipientPhone].filter(Boolean).join(" - ")}
                    </span>
                  </>
                )}
                {addr.address && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 flex-shrink-0">·</span>
                    <span className="text-slate-500 dark:text-slate-400 break-words">{addr.address}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    title="Đặt làm mặc định"
                    onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(addr.id); }}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  title="Chỉnh sửa"
                  onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
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
  lineNotes: Record<number, string>;
  setLineNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  selectedAddressId: number | null;
  setSelectedAddressId: React.Dispatch<React.SetStateAction<number | null>>;
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
  lineNotes,
  setLineNotes,
  selectedAddressId,
  setSelectedAddressId,
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
      <DialogContent className="max-w-7xl w-[96vw] h-[85vh] max-h-[900px] overflow-hidden border-slate-200 dark:border-slate-800 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Tạo phiếu giao hàng ({selectedOrders.length} sản phẩm)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Xác nhận số lượng và chọn địa chỉ giao.
          </DialogDescription>
        </DialogHeader>

        {/* Content area: Horizontal columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 overflow-hidden py-2 px-1">
          {/* Left Column: Products List (7 cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex-shrink-0">
              Danh sách sản phẩm giao hàng
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0">
              {selectedOrders.map((od) => (
                <Card
                  key={od.orderDetailId}
                  className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
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

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Ghi chú mặt hàng</Label>
                        <Input
                          placeholder="Nhập ghi chú riêng cho sản phẩm này..."
                          value={lineNotes[od.orderDetailId] || ""}
                          onChange={(e) => {
                            setLineNotes((prev) => ({
                              ...prev,
                              [od.orderDetailId]: e.target.value,
                            }));
                          }}
                          className="h-8 text-xs bg-slate-50/50 dark:bg-slate-900/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-shrink-0">
              <Label
                htmlFor="delivery-notes"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase"
              >
                Ghi chú chung cho toàn bộ phiếu
              </Label>
              <Textarea
                id="delivery-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú giao nhận chung cho toàn bộ phiếu..."
                rows={3}
                className="w-full resize-none border-slate-200 dark:border-slate-700 focus:border-primary/50 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Right Column: Address Book & Notes (5 cols) */}
          <div className="md:col-span-5 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex-shrink-0">
              Thông tin người nhận & Địa chỉ
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 min-h-0">
              {customerId && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <AddressBookManager
                        customerId={customerId}
                        compact
                        selectedId={selectedAddressId ?? null}
                        onSelect={(id) => setSelectedAddressId(id)}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setShowAddressBook(!showAddressBook)}
                        title="Quản lý sổ địa chỉ"
                      >
                        <Plus className="h-4 w-4 text-primary" />
                      </button>
                    </div>
                  </div>

                  {showAddressBook && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-3.5 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <AddressBookManager
                        customerId={customerId}
                        selectedId={selectedAddressId ?? null}
                        onSelect={(id) => setSelectedAddressId(id)}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

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
  lineNotes: Record<number, string>;
  setLineNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  addressIds: Record<number, number | null>;
  setAddressIds: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  selectedAddressId?: number | null;
  setSelectedAddressId?: React.Dispatch<React.SetStateAction<number | null>>;
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
  lineNotes,
  setLineNotes,
  addressIds,
  setAddressIds,
  selectedAddressId,
  setSelectedAddressId,
  customerId,
  notes,
  setNotes,
  onConfirm,
  isPending,
}: RecreateDeliveryNoteDialogProps) {
  const [showAddressBook, setShowAddressBook] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[96vw] h-[85vh] max-h-[900px] overflow-hidden border-slate-200 dark:border-slate-800 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Tạo lại phiếu giao hàng (Giao lại)
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
            Hệ thống đã tự động lấy danh sách {items.length} mặt hàng giao thất bại. Vui lòng kiểm tra địa chỉ và số lượng trước khi xác nhận.
          </DialogDescription>
        </DialogHeader>

        {/* Content area: Horizontal columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 overflow-hidden py-2 px-1">
          {/* Left Column: Products List (7 cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex-shrink-0">
              Danh sách mặt hàng giao thất bại
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0">
              {items.map((item) => (
                <Card
                  key={item.orderDetailId}
                  className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                            {item.designCode}{" "}
                            {item.orderCode && <span className="text-slate-400 font-sans text-xs">({item.orderCode})</span>}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">
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

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Ghi chú mặt hàng</Label>
                        <Input
                          placeholder="Nhập ghi chú riêng cho sản phẩm này..."
                          value={lineNotes[item.orderDetailId] || ""}
                          onChange={(e) => {
                            setLineNotes((prev) => ({
                              ...prev,
                              [item.orderDetailId]: e.target.value,
                            }));
                          }}
                          className="h-8 text-xs bg-slate-50/50 dark:bg-slate-900/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-shrink-0">
              <Label
                htmlFor="recreate-notes"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase"
              >
                Ghi chú giao lại
              </Label>
              <Textarea
                id="recreate-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Khách hẹn giao lại vào chiều nay..."
                rows={3}
                className="w-full resize-none border-slate-200 dark:border-slate-700 focus:border-primary/50 text-xs bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Right Column: Address Book & Notes (5 cols) */}
          <div className="md:col-span-5 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex-shrink-0">
              Thông tin người nhận & Địa chỉ
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 min-h-0">
              {customerId && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <AddressBookManager
                        customerId={customerId}
                        compact
                        selectedId={selectedAddressId ?? null}
                        onSelect={(id) => setSelectedAddressId && setSelectedAddressId(id)}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setShowAddressBook(!showAddressBook)}
                        title="Quản lý sổ địa chỉ"
                      >
                        <Plus className="h-4 w-4 text-primary" />
                      </button>
                    </div>
                  </div>

                  {showAddressBook && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-3.5 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <AddressBookManager
                        customerId={customerId!}
                        selectedId={selectedAddressId ?? null}
                        onSelect={(id) => setSelectedAddressId && setSelectedAddressId(id)}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

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
