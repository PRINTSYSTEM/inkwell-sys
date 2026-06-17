import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useDebounce } from "use-debounce";
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
  ExternalLink,
} from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useProductionOrders } from "@/hooks/use-production";

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
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
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
  deliveryAddress?: string | null;
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
  const hasFailed = lines.some((l) => ["failed", "returned", "cancelled"].includes(l.status || ""));

  if (note.status === "cancelled" && (hasDelivered || hasReschedule)) {
    return "partial";
  }

  if (hasReschedule) return "failed_reschedule";
  if (hasDelivered && hasFailed) return "partial";
  if (hasDelivered) return "completed";
  if (hasFailed) return "failed";

  return note.status;
};

const getRemainingQty = (detail: any) => {
  return Math.max(0, detail.remainingToDeliver ?? 0);
};

interface ProofingCodeProps {
  code: string;
}

function ProofingCodeWithProductions({ code }: ProofingCodeProps) {
  const match = code.match(/\d+/);
  const proofingOrderId = match ? parseInt(match[0], 10) : null;

  const { data: productionsResp, isLoading } = useProductionOrders(
    proofingOrderId ? { proofingOrderId, pageSize: 50 } : undefined
  );

  const productions = useMemo(() => {
    if (!productionsResp) return [];
    if (Array.isArray(productionsResp)) return productionsResp;
    if (typeof productionsResp === "object" && "items" in productionsResp) {
      return (productionsResp.items || []) as any[];
    }
    return [];
  }, [productionsResp]);

  if (!proofingOrderId) {
    return <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">{code}</span>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <Link
          to={`/productions?search=${code}`}
          className="font-extrabold text-amber-600 dark:text-amber-400 font-mono hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {code}
          <ExternalLink className="h-3.5 w-3.5 inline opacity-70" />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg rounded-lg text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="font-bold text-xs text-stone-500 uppercase tracking-wider">
            Lệnh sản xuất liên quan ({code})
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-stone-400 text-xs py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải lệnh sản xuất...
            </div>
          ) : productions.length === 0 ? (
            <div className="text-stone-400 text-xs py-1 italic">
              Chưa có lệnh sản xuất nào cho bài này
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto pr-1">
              {productions.map((prod: any) => (
                <div key={prod.id} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-stone-500">Mã lệnh:</span>
                    <Link
                      to={`/productions/${prod.id}`}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      PO{String(prod.id).padStart(4, '0')}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Người phụ trách:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {prod.productionLeadName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Tiến độ / SL sản xuất:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {prod.progressPercent || 0}% ({prod.producedQty || 0} tờ)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Trạng thái:</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {prod.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleImageClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImageUrl(url);
  };

  const [viewMode, setViewMode] = useState<"orders" | "delivery-notes">(
    "delivery-notes",
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
  const [deliveryNoteSearchQuery, setDeliveryNoteSearchQuery] = useState("");
  const [debouncedDeliveryNoteSearchQuery] = useDebounce(deliveryNoteSearchQuery, 300);
  const [deliveryNotePage, setDeliveryNotePage] = useState(1);

  // Reset page when search or status filters change to avoid page offset issues
  useEffect(() => {
    setDeliveryNotePage(1);
  }, [debouncedDeliveryNoteSearchQuery, deliveryNoteStatusFilter]);

  // Query background notes to calculate stats and perform client-side search/pagination
  const {
    data: allNotesData,
    isLoading: deliveryNotesLoading,
    isError: deliveryNotesError,
    error: deliveryNotesErrorObj,
    refetch: refetchDeliveryNotes,
  } = useDeliveryNotes({ pageSize: 200 });

  const stats = useMemo(() => {
    const items = allNotesData?.items || [];
    const total = allNotesData?.total || items.length;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayCount = items.filter(note => note.createdAt && note.createdAt.startsWith(todayStr)).length;
    const deliveredCount = items.filter(note => getDisplayStatus(note) === "completed").length;
    const pendingCount = items.filter(note => ["pending", "in_transit", "ready_to_ship", "handed_over", "confirmed"].includes(getDisplayStatus(note) || "")).length;
    const failedCount = items.filter(note => ["failed", "failed_reschedule", "cancelled", "returned", "partial"].includes(getDisplayStatus(note) || "")).length;
    const successRate = total > 0 ? Math.round((deliveredCount / total) * 100) : 0;

    return {
      total,
      todayCount,
      deliveredCount,
      successRate,
      pendingCount,
      failedCount,
    };
  }, [allNotesData]);

  const itemsPerPage = 10;

  // Selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [selectedOrderDetailIds, setSelectedOrderDetailIds] = useState<Set<number>>(new Set());
  const [deliveryQtys, setDeliveryQtys] = useState<Record<number, number>>({});
  const [lineNotes, setLineNotes] = useState<Record<number, string>>({});

  const { data: customerAddresses } = useCustomerAddresses(
    selectedCustomerId,
    !!selectedCustomerId
  );

  // Auto-populate default address in Create dialog
  useEffect(() => {
    if (isCreateDialogOpen && customerAddresses && !selectedAddressId) {
      const defaultAddr = customerAddresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (customerAddresses.length > 0) {
        setSelectedAddressId(customerAddresses[0].id);
      }
    }
  }, [isCreateDialogOpen, customerAddresses, selectedAddressId, setSelectedAddressId]);

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
            deliveryAddress: order.deliveryAddress,
          });
        }
      });
    });
    return results;
  }, [allOrders, selectedOrderDetailIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedOrders.reduce(
      (sum, item) => sum + getRemainingQty(item) * (item.unitPrice || 0),
      0,
    );
  }, [selectedOrders]);

  // Client-side filtering, sorting, and pagination
  const filteredAndSortedNotes = useMemo(() => {
    const items = allNotesData?.items || [];
    let result = [...items];

    // 1. Filter by status
    if (deliveryNoteStatusFilter !== "all") {
      result = result.filter(note => getDisplayStatus(note) === deliveryNoteStatusFilter);
    }

    // 2. Filter by search query (code, id, customer name, order code, design name/code, recipient name/phone)
    if (debouncedDeliveryNoteSearchQuery.trim() !== "") {
      const q = debouncedDeliveryNoteSearchQuery.toLowerCase();
      result = result.filter(note => {
        const matchCode = String(note.code || "").toLowerCase().includes(q);
        const matchId = String(note.id || "").includes(q);
        const matchOrders = (note.orders || []).some(order => 
          String(order.customerName || "").toLowerCase().includes(q) ||
          String(order.orderCode || "").toLowerCase().includes(q)
        );
        const matchLines = (note.lines || []).some(line => 
          String(line.designName || "").toLowerCase().includes(q) ||
          String(line.designCode || "").toLowerCase().includes(q)
        );
        const matchRecipient = 
          String(note.recipientName || "").toLowerCase().includes(q) ||
          String(note.recipientPhone || "").toLowerCase().includes(q);

        return matchCode || matchId || matchOrders || matchLines || matchRecipient;
      });
    }

    // 3. Sort (priority: pending first, then undelivered, then others; newer first)
    const priority = (note: any) => {
      if (!note) return 3;
      if (String(note.status) === "pending") return 0;
      const lines = note.lines || [];
      const hasDelivered = lines.some((l: any) => l && l.status === "delivered");
      if (!hasDelivered) return 1;
      return 2;
    };

    result.sort((a: any, b: any) => {
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da; // newer first
    });

    return result;
  }, [allNotesData, deliveryNoteStatusFilter, debouncedDeliveryNoteSearchQuery]);

  const paginatedNotesList = useMemo(() => {
    const start = (deliveryNotePage - 1) * itemsPerPage;
    return filteredAndSortedNotes.slice(start, start + itemsPerPage);
  }, [filteredAndSortedNotes, deliveryNotePage]);

  const deliveryNotesData = useMemo(() => {
    return {
      items: paginatedNotesList,
      totalPages: Math.ceil(filteredAndSortedNotes.length / itemsPerPage),
      total: filteredAndSortedNotes.length,
    };
  }, [paginatedNotesList, filteredAndSortedNotes.length]);

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
    // Only select items that are not completed, failed, reschedule failed, or cancelled
    const selectableIds = items
      .filter(
        (i: any) => {
          const status = getDisplayStatus(i);
          return (
            status !== "completed" &&
            status !== "failed" &&
            status !== "failed_reschedule" &&
            status !== "cancelled"
          );
        }
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

  const handleToggleOrderDetail = (orderDetailId: number | number[]) => {
    if (orderDetailId === -1) {
      setSelectedOrderDetailIds(new Set());
      setSelectedCustomerId(null);
      setSelectedCustomerName("");
      return;
    }

    const findCustomerOfDetail = (id: number) => {
      const order = availableOrdersRaw.find((o) =>
        (o.details || []).some((d) => d.orderDetailId === id)
      );
      return order ? { id: order.customerId, name: order.customerName } : null;
    };

    const firstId = Array.isArray(orderDetailId) ? orderDetailId[0] : orderDetailId;
    if (firstId == null) return;

    const targetCustomer = findCustomerOfDetail(firstId);
    if (!targetCustomer) return;

    // Check if we are selecting new items
    let isSelecting = false;
    if (Array.isArray(orderDetailId)) {
      const allSelected = orderDetailId.every(id => selectedOrderDetailIds.has(id));
      if (!allSelected) isSelecting = true;
    } else {
      if (!selectedOrderDetailIds.has(orderDetailId)) isSelecting = true;
    }

    if (isSelecting && selectedOrderDetailIds.size > 0) {
      const currentActiveId = Array.from(selectedOrderDetailIds)[0];
      const activeCustomer = findCustomerOfDetail(currentActiveId);
      if (activeCustomer && activeCustomer.id !== targetCustomer.id) {
        toast.error("Phiếu giao hàng phải được tạo cho cùng 1 khách hàng. Không thể chọn sản phẩm của khách hàng khác!");
        return;
      }
    }

    setSelectedOrderDetailIds((prev) => {
      const newSet = new Set(prev);
      if (Array.isArray(orderDetailId)) {
        const allSelected = orderDetailId.every(id => newSet.has(id));
        if (allSelected) {
          orderDetailId.forEach(id => newSet.delete(id));
        } else {
          orderDetailId.forEach(id => newSet.add(id));
        }
      } else {
        if (newSet.has(orderDetailId)) {
          newSet.delete(orderDetailId);
        } else {
          newSet.add(orderDetailId);
        }
      }

      // Sync customer ID state
      if (newSet.size === 0) {
        setSelectedCustomerId(null);
        setSelectedCustomerName("");
      } else {
        setSelectedCustomerId(targetCustomer.id ?? null);
        setSelectedCustomerName(targetCustomer.name || "");
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

    const res = await recreateMutation.mutateAsync(payload);
    setIsRecreateDialogOpen(false);
    setRecreateNoteId(null);
    if (res && res.id) {
      navigate(`/delivery-notes/${res.id}`);
    }
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
        qtys[od.orderDetailId] = getRemainingQty(od);
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
      if (res && res.id) {
        navigate(`/delivery-notes/${res.id}`);
      }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Phiếu giao hàng
          </h1>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Notes */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tổng phiếu
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-stone-900 dark:text-stone-50">
                {stats.total}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 leading-none truncate">
                30 ngày gần nhất
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Created Today */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tạo hôm nay
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-stone-900 dark:text-stone-50">
                {stats.todayCount}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 leading-none truncate">
                {format(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivered (Success) */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Đã giao
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-emerald-600 dark:text-emerald-400">
                {stats.deliveredCount}
              </p>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 leading-none truncate">
                {stats.successRate}% thành công
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending / Transit */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <RefreshCw className="h-3.5 w-3.5 text-stone-600 dark:text-stone-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Chờ / Đang giao
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-stone-900 dark:text-stone-50">
                {stats.pendingCount}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 leading-none truncate">
                Cần xử lý
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-destructive/10 dark:bg-red-950/20 flex items-center justify-center shrink-0">
              <X className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Thất bại
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-destructive">
                {stats.failedCount}
              </p>
              <p className="text-[9px] sm:text-[10px] text-destructive font-medium mt-1 leading-none truncate">
                Cần hẹn lại / hủy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as "orders" | "delivery-notes")}
      >
        <TabsList className="flex bg-stone-100/80 dark:bg-stone-900/80 p-1 rounded-full w-fit mb-6">
          <TabsTrigger
            value="delivery-notes"
            className="rounded-full px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm text-stone-500 hover:text-stone-900 dark:data-[state=active]:bg-stone-800 dark:data-[state=active]:text-stone-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Phiếu đã tạo
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-full px-6 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm text-stone-500 hover:text-stone-900 dark:data-[state=active]:bg-stone-800 dark:data-[state=active]:text-stone-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu
          </TabsTrigger>
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
            onImageClick={handleImageClick}
            selectedCustomerId={selectedCustomerId}
          />
        </TabsContent>

        <TabsContent value="delivery-notes" className="mt-6">
          <DeliveryNotesView
            deliveryNoteStatusFilter={deliveryNoteStatusFilter}
            setDeliveryNoteStatusFilter={setDeliveryNoteStatusFilter}
            deliveryNoteSearchQuery={deliveryNoteSearchQuery}
            setDeliveryNoteSearchQuery={setDeliveryNoteSearchQuery}
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
            onImageClick={handleImageClick}
            debouncedSearchQuery={debouncedDeliveryNoteSearchQuery}
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
        onImageClick={handleImageClick}
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
        customerName={recreateNoteDataTyped?.orders?.[0]?.customerName || ""}
        notes={recreateNotes}
        setNotes={setRecreateNotes}
        onConfirm={handleConfirmedRecreate}
        isPending={recreateMutation.isPending}
        onImageClick={handleImageClick}
      />

      {previewImageUrl && (
        <ImageViewerDialog
          open={!!previewImageUrl}
          onOpenChange={(open) => !open && setPreviewImageUrl(null)}
          imageUrl={previewImageUrl}
          title="Xem ảnh thiết kế"
        />
      )}
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
  handleToggleOrderDetail: (id: number | number[]) => void;
  selectedOrders: Array<SelectedOrderDetail>;
  totalSelectedAmount: number;
  handleCreateDeliveryNote: () => void;
  onImageClick: (url: string, e: React.MouseEvent) => void;
  selectedCustomerId: number | null;
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
  onImageClick,
  selectedCustomerId,
}: OrdersViewProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  // Auto-expand all orders when the list loads or changes
  useEffect(() => {
    if (ordersList.length > 0) {
      setExpandedOrders(new Set(ordersList.map((o) => o.orderId).filter((id): id is number => id != null)));
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

  const selectedOrdersCount = useMemo(() => {
    return new Set(selectedOrders.map(o => o.orderId)).size;
  }, [selectedOrders]);

  return (
    <div className="space-y-4 pb-24">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-850 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Tìm đơn hàng, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm border-stone-200 dark:border-stone-800 bg-transparent rounded-lg focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchOrders()}
          disabled={ordersLoading}
          className="h-10 border-stone-200 dark:border-stone-800 font-semibold w-full md:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Error Alert */}
      {ordersError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {ordersErrorObj instanceof Error ? ordersErrorObj.message : "Có lỗi xảy ra khi tải danh sách đơn hàng"}
          </AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {ordersLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden p-5 space-y-4 bg-white dark:bg-stone-900">
              <div className="flex justify-between items-center"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-8 w-1/4" /></div>
              <Skeleton className="h-12 w-full" />
            </Card>
          ))
        ) : ordersList.length === 0 ? (
          <Card className="border border-stone-200/80 dark:border-stone-800 rounded-xl p-12 text-center bg-white dark:bg-stone-900 shadow-xs">
            <div className="flex flex-col items-center gap-3">
              <Package className="h-10 w-10 text-stone-300 dark:text-stone-700" />
              <p className="text-stone-500 font-semibold">Không tìm thấy đơn hàng nào khả dụng</p>
              <p className="text-stone-400 text-xs mt-0.5">Tất cả đơn hàng đã được giao hoặc không trùng khớp với tìm kiếm</p>
            </div>
          </Card>
        ) : (
          ordersList.map((order) => {
            if (order.orderId == null) return null;
            const isExpanded = expandedOrders.has(order.orderId);
            
            const detailIds = (order.details || []).map((d) => d.orderDetailId).filter((id): id is number => id != null);
            const selectedCount = detailIds.filter((id) => selectedOrderDetailIds.has(id)).length;
            const isAllSelected = detailIds.length > 0 && selectedCount === detailIds.length;
            const isSomeSelected = selectedCount > 0 && selectedCount < detailIds.length;

            const totalOrderQty = (order.details || []).reduce((sum, d) => sum + (d.remainingToDeliver || d.orderedQty || 0), 0);
            const isDifferentCustomer = selectedCustomerId !== null && order.customerId !== selectedCustomerId;

            return (
              <div
                key={order.orderId}
                className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                  isDifferentCustomer ? "opacity-60" : ""
                }`}
              >
                {/* Card Header */}
                <div
                  onClick={() => toggleOrder(order.orderId!)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/40 dark:hover:bg-stone-900/60"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={() => handleToggleOrderDetail(detailIds)}
                        disabled={isDifferentCustomer}
                        className="rounded"
                      />
                    </div>
                    <div className="text-stone-400 hover:text-stone-600">
                      {isExpanded ? (
                        <ChevronDown className="h-4.5 w-4.5" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 dark:text-stone-50 font-mono text-sm">
                          {order.orderCode}
                        </span>
                        <Badge variant="outline" className={`h-5 text-[10px] font-bold px-2 ${getStatusColorClass(order.status)}`}>
                          {orderStatusLabels[order.status || ""] || order.status}
                        </Badge>
                        <span className="text-[11px] text-stone-400">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                        <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="text-stone-400 mr-1 shrink-0">Khách hàng :</span>
                        <span className="truncate font-semibold text-stone-850 dark:text-stone-200">{order.customerName}</span>
                      </div>
                      {order.deliveryAddress && (
                        <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          <span className="text-stone-400 mr-1 shrink-0">Địa chỉ giao hàng :</span>
                          <span className="truncate text-stone-700 dark:text-stone-300" title={order.deliveryAddress}>{order.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">


                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOrderDetail(detailIds);
                        }}
                        disabled={isDifferentCustomer}
                        className="text-xs font-semibold h-8 border-stone-200 dark:border-stone-850 hover:bg-stone-50 text-stone-700 dark:text-stone-300"
                      >
                        Chọn tất cả sản phẩm
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Card Collapsible Content */}
                {isExpanded && order.details && order.details.length > 0 && (
                  <div className="border-t border-stone-100 dark:border-stone-850 bg-stone-50/10 dark:bg-stone-900/30 overflow-auto">
                    <Table>
                      <TableHeader className="bg-stone-50/30 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
                        <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                          <TableHead className="w-12 pl-4"></TableHead>
                          <TableHead className="w-12">Hình</TableHead>
                          <TableHead className="w-[120px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Mã thiết kế</TableHead>
                          <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Tên sản phẩm</TableHead>
                          <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider w-40">Mã bài</TableHead>
                          <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider w-24">Số lượng</TableHead>
                          <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider pr-4 w-32">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.details.map((detail) => {
                          if (detail.orderDetailId == null) return null;
                          const isChecked = selectedOrderDetailIds.has(detail.orderDetailId);
                          return (
                            <TableRow
                              key={detail.orderDetailId}
                              onClick={() => {
                                if (isDifferentCustomer) {
                                  toast.error("Phiếu giao hàng phải được tạo cho cùng 1 khách hàng. Không thể chọn sản phẩm của khách hàng khác!");
                                  return;
                                }
                                handleToggleOrderDetail(detail.orderDetailId!);
                              }}
                              className={`cursor-pointer border-stone-100 dark:border-stone-850 transition-colors ${
                                isDifferentCustomer ? "cursor-not-allowed" : ""
                              } ${
                                isChecked
                                  ? "bg-primary/[0.03] dark:bg-primary/[0.02] hover:bg-primary/[0.05] dark:hover:bg-primary/[0.03]"
                                  : "hover:bg-stone-50/50 dark:hover:bg-stone-950/30"
                              }`}
                            >
                              <TableCell className="pl-4 w-12" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => handleToggleOrderDetail(detail.orderDetailId!)}
                                  disabled={isDifferentCustomer}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell className="w-12">
                                <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 border flex items-center justify-center overflow-hidden relative">
                                  {detail.designImageUrl ? (
                                    <img
                                      src={detail.designImageUrl}
                                      alt={detail.designCode || "Thiết kế"}
                                      className="h-full w-full object-cover cursor-zoom-in"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onImageClick(detail.designImageUrl!, e);
                                      }}
                                    />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-stone-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px] font-mono font-black text-[11px] uppercase text-stone-800 dark:text-stone-200">
                                {detail.designCode}
                              </TableCell>
                              <TableCell className="text-[11px] text-stone-500 font-medium truncate max-w-[200px] md:max-w-[300px]">
                                {detail.designName}
                              </TableCell>
                              <TableCell className="text-right font-extrabold text-amber-600 dark:text-amber-400 text-xs tabular-nums w-40">
                                {detail.proofingOrderCodes && detail.proofingOrderCodes.length > 0 ? (
                                  <div className="flex flex-col items-end gap-1">
                                    {detail.proofingOrderCodes.map((code) => (
                                      <ProofingCodeWithProductions key={code} code={code} />
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-stone-400 font-normal">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums w-24">
                                {new Intl.NumberFormat('vi-VN').format(getRemainingQty(detail) ?? 0)}
                              </TableCell>
                              <TableCell className="text-right font-extrabold text-stone-800 dark:text-stone-200 text-xs pr-4 w-32 tabular-nums">
                                {formatCurrency(detail.unitPrice ? (detail.orderedQty ?? 0) * detail.unitPrice : 0)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-900 flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">
             Trang {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 border-stone-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-semibold bg-stone-50 border px-3 py-1.5 rounded-md min-w-[80px] text-center">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 border-stone-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Selection Action Bar */}
      {selectedOrderDetailIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl bg-white dark:bg-stone-900 border border-stone-250 dark:border-stone-800 shadow-xl rounded-full px-6 py-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom-6 fade-in duration-300">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm text-stone-600 dark:text-stone-400 font-medium">
              Đã chọn <strong className="text-primary font-bold">{selectedOrderDetailIds.size}</strong> sản phẩm từ <strong className="text-stone-800 dark:text-stone-250 font-bold">{selectedOrdersCount}</strong> đơn
            </span>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <span className="text-sm font-black text-primary tabular-nums">
              {formatCurrency(totalSelectedAmount)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleOrderDetail(-1)}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-bold text-xs hover:bg-transparent h-9 px-3 rounded-full"
            >
              Bỏ chọn
            </Button>
            <Button
              onClick={handleCreateDeliveryNote}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-full px-5 py-2.5 h-9 shadow-sm"
            >
              Tạo phiếu giao hàng ({selectedOrderDetailIds.size})
            </Button>
          </div>
        </div>
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
  deliveryNoteSearchQuery: string;
  setDeliveryNoteSearchQuery: (query: string) => void;
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
  onImageClick: (url: string, e: React.MouseEvent) => void;
  debouncedSearchQuery: string;
}

function DeliveryNotesView({
  deliveryNoteStatusFilter,
  setDeliveryNoteStatusFilter,
  deliveryNoteSearchQuery,
  setDeliveryNoteSearchQuery,
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
  onImageClick,
  debouncedSearchQuery,
}: DeliveryNotesViewProps) {
  const itemsPerPage = 10;
  const deliveryNotesDataTyped = deliveryNotesData as
    | {
        items?: Array<{
          id?: number;
          code?: string | null;
          lines?: any[];
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

  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());

  const toggleNote = (noteId: number) => {
    const next = new Set(expandedNoteIds);
    if (next.has(noteId)) {
      next.delete(noteId);
    } else {
      next.add(noteId);
    }
    setExpandedNoteIds(next);
  };

  // Auto-expand all found delivery notes only when searching is active
  useEffect(() => {
    if (debouncedSearchQuery.trim() !== "") {
      const visibleIds = sortedDeliveryNotes
        .map((n) => n.id)
        .filter((id): id is number => id != null);
      setExpandedNoteIds(new Set(visibleIds));
    } else {
      setExpandedNoteIds(new Set());
    }
  }, [debouncedSearchQuery, sortedDeliveryNotes]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-850 shadow-sm">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Nhập mã phiếu để xem nhanh, hoặc tìm khách hàng..."
              value={deliveryNoteSearchQuery}
              onChange={(e) => setDeliveryNoteSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-stone-200 dark:border-stone-800 bg-transparent rounded-lg focus-visible:ring-primary focus-visible:border-primary w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={deliveryNoteStatusFilter}
              onValueChange={setDeliveryNoteStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px] h-10 border-stone-200 dark:border-stone-800 rounded-lg">
                <Filter className="h-4 w-4 mr-2 text-stone-400" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(deliveryNoteStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="30-days">
              <SelectTrigger className="w-full md:w-[180px] h-10 border-stone-200 dark:border-stone-800 rounded-lg">
                <Calendar className="h-4 w-4 mr-2 text-stone-400" />
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30-days">30 ngày gần nhất</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="yesterday">Hôm qua</SelectItem>
                <SelectItem value="this-week">Tuần này</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchDeliveryNotes()}
              disabled={deliveryNotesLoading}
              className="h-10 w-10 border-stone-200 dark:border-stone-800 rounded-lg animate-none"
            >
              <RefreshCw
                className={`h-4 w-4 ${deliveryNotesLoading ? "animate-spin" : ""}`}
              />
            </Button>
            
            <Button
              variant="outline"
              className="h-10 border-stone-200 dark:border-stone-800 rounded-lg gap-2 text-sm font-semibold hidden md:flex text-stone-700 hover:text-stone-900"
            >
              <FileText className="h-4 w-4 text-stone-550" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {selectedNoteIds.size > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-stone-150">
            <span className="text-xs text-stone-500 font-medium">
              Đã chọn <strong className="text-primary">{selectedNoteIds.size}</strong> phiếu
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearSelection()}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-bold text-xs h-9 px-3 hover:bg-transparent"
            >
              Bỏ chọn
            </Button>
            <Button
              size="sm"
              onClick={handleBulkStartShipping}
              disabled={bulkLoading}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-lg px-4 h-9 shadow-sm"
            >
              {bulkLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Bắt đầu giao
            </Button>
          </div>
        )}
      </div>

      {/* Info label below Toolbar */}
      <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
        <div>
          Hiển thị{" "}
          <span className="font-bold text-stone-850 dark:text-stone-200">
            {deliveryNotesDataTyped?.items && deliveryNotesDataTyped.items.length > 0 
              ? `${(deliveryNotePage - 1) * itemsPerPage + 1}–${Math.min(deliveryNotePage * itemsPerPage, deliveryNotesDataTyped.total || 0)}` 
              : "0"}
          </span>{" "}
          / <span className="font-bold text-stone-850 dark:text-stone-200">{deliveryNotesDataTyped?.total || 0}</span> phiếu
        </div>
        <div className="flex items-center gap-1">
          <span>Sắp xếp:</span>
          <span className="font-bold text-stone-850 dark:text-stone-200">Mới nhất</span>
        </div>
      </div>

      {/* Error Alert */}
      {deliveryNotesError && (
        <Alert
          variant="destructive"
          className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 rounded-xl"
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
      <Card className="border-stone-200 dark:border-stone-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-stone-900">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-stone-50/75 dark:bg-stone-900/95 backdrop-blur-sm z-10 border-b border-stone-200 dark:border-stone-800">
              <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                <TableHead className="w-12 pl-6"></TableHead>
                <TableHead className="w-[150px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Mã phiếu
                </TableHead>
                <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Số lượng mã hàng
                </TableHead>
                <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Khách hàng
                </TableHead>
                <TableHead className="text-center font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">
                  Ngày tạo
                </TableHead>
                <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider pr-6 w-[120px]">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryNotesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-stone-100 dark:border-stone-850"
                  >
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-6" : j === 6 ? "pr-6" : ""}>
                        <Skeleton className="h-9 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !deliveryNotesDataTyped?.items ||
                sortedDeliveryNotes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-40 text-center border-stone-100 dark:border-stone-800"
                  >
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <FileText className="h-10 w-10 text-stone-300 dark:text-stone-700" />
                      <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">
                        Không tìm thấy phiếu giao hàng nào
                      </p>
                      <p className="text-xs text-stone-450 dark:text-stone-500">
                        Thử thay đổi bộ lọc hoặc tìm kiếm theo từ khóa khác
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedDeliveryNotes.map((deliveryNote) => {
                  if (deliveryNote.id == null) return null;
                  const status = getDisplayStatus(deliveryNote);
                  const isSelectable = ["pending", "ready_to_ship", "confirmed", "handed_over"].includes(status || "");
                  const isSelected = selectedNoteIds.has(deliveryNote.id as number);

                  const customers =
                    deliveryNote.orders
                      ?.map((order) => order.customerName)
                      .filter((name): name is string => !!name) || [];
                  const uniqueCustomers = Array.from(new Set(customers));
                  const isExpanded = expandedNoteIds.has(deliveryNote.id as number);

                  return (
                    <React.Fragment key={deliveryNote.id}>
                      <TableRow
                        className={`cursor-pointer transition-all duration-150 border-stone-100 dark:border-stone-850 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 ${
                          updatingIds.has(deliveryNote.id as number) ? "opacity-70" : ""
                        }`}
                        onClick={() => handleViewDeliveryNote(deliveryNote.id)}
                      >
                        <TableCell className="pl-6 w-12" onClick={(e) => {
                          if (isSelectable) {
                            e.stopPropagation();
                            handleToggleSelectNote(deliveryNote.id);
                          }
                        }}>
                          <div className="flex items-center justify-center w-6 h-6">
                            {isSelectable ? (
                              <div className="relative group/check">
                                <div className={isSelected ? "block" : "hidden group-hover/check:block"}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleSelectNote(deliveryNote.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className={isSelected ? "hidden" : "block group-hover/check:hidden"}>
                                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/50 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              ["failed", "failed_reschedule", "cancelled", "returned"].includes(status || "") ? (
                                <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 flex items-center justify-center">
                                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/50 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNote(deliveryNote.id!);
                              }}
                              className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-850"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="font-bold font-mono text-sm text-stone-900 dark:text-stone-50">
                              {deliveryNote.code || `#${deliveryNote.id}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                            <Package className="h-4 w-4 text-stone-400" />
                            x{deliveryNote.lines?.length ?? 0} mã hàng
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-stone-700 dark:text-stone-300 font-medium">
                            <User className="h-4 w-4 text-stone-400" />
                            {uniqueCustomers[0] || "—"}
                            {uniqueCustomers.length > 1 && (
                              <span className="text-xs text-stone-400 font-normal">
                                (+{uniqueCustomers.length - 1} khách khác)
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {updatingIds.has(deliveryNote.id as number) ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                          ) : (
                            <StatusBadge
                              status={status || null}
                              label={getDeliveryNoteStatusLabel(status)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                            <Calendar className="h-3.5 w-3.5 text-stone-400" />
                            {formatDate(deliveryNote.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            {deliveryNote.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-lg"
                                onClick={() => handleOpenRecreate(deliveryNote.id!)}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Giao lại
                              </Button>
                            )}
                            <Button
                              variant="link"
                              className="text-xs font-bold text-primary p-0 hover:no-underline"
                              onClick={() => handleViewDeliveryNote(deliveryNote.id)}
                            >
                              Chi tiết &gt;
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && deliveryNote.lines && deliveryNote.lines.length > 0 && (
                        <TableRow className="bg-stone-50/10 dark:bg-stone-900/30 hover:bg-transparent">
                          <TableCell colSpan={7} className="p-0">
                            <div className="border-t border-stone-150 dark:border-stone-850 p-4">
                              <Table>
                                <TableHeader className="bg-stone-50/30 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
                                  <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                                    <TableHead className="w-12 pl-4"></TableHead>
                                    <TableHead className="w-12">Hình</TableHead>
                                    <TableHead className="w-[120px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Mã thiết kế</TableHead>
                                    <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Tên sản phẩm</TableHead>
                                    <TableHead className="text-right font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider w-24">Số lượng giao</TableHead>
                                    <TableHead className="text-center font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider w-36">Trạng thái dòng</TableHead>
                                    <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider pr-4 w-48">Ghi chú dòng</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {deliveryNote.lines.map((line: any, index: number) => (
                                    <TableRow
                                      key={line.orderDetailId ?? index}
                                      className="hover:bg-stone-50/50 dark:hover:bg-stone-950/30 border-stone-100 dark:border-stone-850"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <TableCell className="pl-4 w-12">
                                        <span className="text-stone-400 text-xs">{index + 1}</span>
                                      </TableCell>
                                      <TableCell className="w-12">
                                        <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 border flex items-center justify-center overflow-hidden relative">
                                          {line.designImageUrl ? (
                                            <img
                                              src={line.designImageUrl}
                                              alt={line.designCode || "Thiết kế"}
                                              className="h-full w-full object-cover cursor-zoom-in"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onImageClick(line.designImageUrl!, e);
                                              }}
                                            />
                                          ) : (
                                            <ImageIcon className="h-4 w-4 text-stone-400" />
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="w-[120px] font-mono font-black text-[11px] uppercase text-stone-800 dark:text-stone-200">
                                        {line.designCode || "—"}
                                      </TableCell>
                                      <TableCell className="text-[11px] text-stone-500 font-medium truncate max-w-[200px] md:max-w-[300px]">
                                        {line.designName || "—"}
                                      </TableCell>
                                      <TableCell className="text-right text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums w-24">
                                        {new Intl.NumberFormat('vi-VN').format(line.deliveryQty ?? 0)}
                                      </TableCell>
                                      <TableCell className="text-center w-36">
                                        <StatusBadge
                                          status={line.status || ""}
                                          label={deliveryLineStatusLabels[line.status || ""] || line.status}
                                        />
                                      </TableCell>
                                      <TableCell className="text-xs text-stone-500 font-medium pr-4 w-48 truncate max-w-[150px]" title={line.note || ""}>
                                        {line.note || "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
  onImageClick: (url: string, e: React.MouseEvent) => void;
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
  onImageClick,
}: CreateDeliveryNoteDialogProps) {
  const [showAddressBook, setShowAddressBook] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[96vw] h-[85vh] max-h-[900px] overflow-hidden border-stone-200 dark:border-stone-850 flex flex-col bg-white dark:bg-stone-900">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-stone-900 dark:text-stone-50">
            Tạo phiếu giao hàng ({selectedOrders.length} sản phẩm)
          </DialogTitle>
          <DialogDescription className="text-sm text-stone-500 dark:text-stone-400">
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
                        <div className="h-10 w-10 rounded-md bg-muted/50 border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {od.designImageUrl ? (
                            <img
                              src={od.designImageUrl}
                              alt={od.designCode || "Thiết kế"}
                              className="h-full w-full object-cover cursor-zoom-in"
                              onClick={(e) => onImageClick(od.designImageUrl!, e)}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold font-mono text-sm text-slate-900 dark:text-slate-50">
                            {od.designCode}{" "}
                            <span className="text-slate-400 font-sans text-xs">({od.orderCode})</span>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">
                            {od.designName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>
                              Tối đa:{" "}
                              <span className="font-bold text-primary">
                                {new Intl.NumberFormat("vi-VN").format(getRemainingQty(od) || 0)}
                              </span>
                            </span>
                            {od.proofingOrderCodes && od.proofingOrderCodes.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="text-slate-400 font-medium">| Mã bài:</span>
                                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                                  {od.proofingOrderCodes.join(", ")}
                                </span>
                              </span>
                            )}
                          </div>
                          {od.deliveryAddress && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                              <span className="truncate" title={od.deliveryAddress}>Địa chỉ giao: {od.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-[110px] flex-shrink-0">
                          <Label className="text-xs text-slate-500 mb-1 block">Số lượng giao</Label>
                          <Input
                            type="number"
                            min="1"
                            max={getRemainingQty(od) || 1}
                            value={deliveryQtys[od.orderDetailId] || ""}
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 0;
                              const maxVal = getRemainingQty(od);
                              if (val > maxVal) val = maxVal;
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
          <div className="md:col-span-5 flex flex-col min-h-0 space-y-4">
            <div className="space-y-1 flex-shrink-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Khách hàng :
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 border border-slate-200 dark:border-slate-800">
                {selectedOrders[0]?.customerName || "—"}
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-shrink-0">
                Địa chỉ giao hàng :
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
  customerName: string;
  notes: string;
  setNotes: (notes: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  onImageClick: (url: string, e: React.MouseEvent) => void;
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
  customerName,
  notes,
  setNotes,
  onConfirm,
  isPending,
  onImageClick,
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
                        <div className="h-10 w-10 rounded-md bg-muted/50 border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {item.designImageUrl ? (
                            <img
                              src={item.designImageUrl}
                              alt={item.designCode || "Thiết kế"}
                              className="h-full w-full object-cover cursor-zoom-in"
                              onClick={(e) => onImageClick(item.designImageUrl!, e)}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
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
          <div className="md:col-span-5 flex flex-col min-h-0 space-y-4">
            <div className="space-y-1 flex-shrink-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Khách hàng :
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-800/50 rounded-md px-3 py-2 border border-slate-200 dark:border-slate-800">
                {customerName || "—"}
              </div>
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-shrink-0">
                Địa chỉ giao hàng :
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
