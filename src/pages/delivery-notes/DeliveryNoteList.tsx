import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  History,
  CheckSquare,
} from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useProductionOrders } from "@/hooks/use-production";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
  useDeliveryNoteStats,
  useBulkCompleteDeliveryNotes,
} from "@/hooks/use-delivery-note";
import { useCreateStockOutForDelivery } from "@/hooks/use-stock";
import { useDesign } from "@/hooks/use-design";
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
import { QCInspectionView } from "./QCInspectionView";
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

import { apiRequest } from "@/lib/http";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export type SelectedOrderDetail = OrderDetailForDeliveryResponse & {
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
  if (lines.length === 0) return note.status;

  const statuses = lines.map((l) => (l.status || "").toLowerCase());
  const terminalStatuses = ["delivered", "failed_reschedule", "cancelled", "returned", "failed"];
  const allHaveResult = statuses.every((s) => terminalStatuses.includes(s));

  if (!allHaveResult) {
    return note.status;
  }

  const allDelivered = lines.every((l) => l.status === "delivered");
  if (allDelivered) return "completed";

  const hasReschedule = lines.some((l) => l.status === "failed_reschedule");
  if (hasReschedule) return "failed_reschedule";

  return "cancelled";
};

const getRemainingQty = (detail: any) => {
  return Math.max(0, detail.remainingToDeliver ?? 0);
};

function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  const trimmedQuery = query?.trim() || "";
  if (!trimmedQuery) return <>{text}</>;

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={idx}
            className="bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 rounded px-0.5 py-0 font-extrabold inline-block"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface ProofingCodeProps {
  code: string;
  query?: string;
}

function ProofingCodeWithProductions({ code, query }: ProofingCodeProps) {
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

  const content = <HighlightText text={code} query={query || ""} />;

  if (!proofingOrderId) {
    return <span className="font-black text-red-600 dark:text-red-400 font-mono text-sm">{content}</span>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <Link
          to={`/delivery-notes?tab=completed-qc&search=${code}`}
          className="font-black text-red-600 dark:text-red-400 font-mono text-sm hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
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

export const getDefaultLineNote = (designName: string | null | undefined): string => {
  if (!designName) return "";
  const lowerName = designName.toLowerCase();
  if (lowerName.includes("nhãn giấy") || lowerName.includes("nhãn")) {
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
    expectedDeliveryDate?: string | null;
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

              {(deliveryNote.expectedDeliveryDate || deliveryNote.createdAt) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium text-stone-600 dark:text-stone-300">
                    Giao: {formatDate(deliveryNote.expectedDeliveryDate ?? deliveryNote.createdAt)}
                  </span>
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

const isNoteInDateRange = (createdAt: string | null | undefined, filter: string) => {
  if (filter === "all") return true;
  if (!createdAt) return false;

  const noteTime = new Date(createdAt).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (filter === "today") {
    return noteTime >= today;
  }
  if (filter === "yesterday") {
    const yesterday = today - 24 * 60 * 60 * 1000;
    return noteTime >= yesterday && noteTime < today;
  }
  if (filter === "this-week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff).getTime();
    return noteTime >= startOfWeek;
  }
  if (filter === "this-month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return noteTime >= startOfMonth;
  }
  if (filter === "30-days") {
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return noteTime >= thirtyDaysAgo;
  }
  return true;
};

const getRecentMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    const value = format(d, "yyyy-MM");
    months.push({ label, value });
  }
  return months;
};

const getDateRangeForFilterValue = (
  value: string,
  customStart?: string,
  customEnd?: string
) => {
  if (value === "all") {
    return { startDate: undefined, endDate: undefined };
  }
  const now = new Date();
  if (value === "today") {
    const todayStr = format(now, "yyyy-MM-dd");
    return {
      startDate: todayStr,
      endDate: todayStr,
    };
  }
  if (value === "yesterday") {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    return {
      startDate: yesterdayStr,
      endDate: yesterdayStr,
    };
  }
  if (value === "7-days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: format(sevenDaysAgo, "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
    };
  }
  if (value === "30-days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: format(thirtyDaysAgo, "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
    };
  }
  if (value === "custom") {
    return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    };
  }

  const parts = value.split("-");
  if (parts.length === 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    if (!isNaN(year) && !isNaN(month)) {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      return {
        startDate: format(startOfMonth, "yyyy-MM-dd"),
        endDate: format(endOfMonth, "yyyy-MM-dd"),
      };
    }
  }

  return { startDate: undefined, endDate: undefined };
};

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

  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<"orders" | "delivery-notes" | "pending-qc" | "completed-qc">(
    () => {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && ["orders", "delivery-notes", "pending-qc", "completed-qc"].includes(tabParam)) {
        sessionStorage.setItem("delivery_note_view_mode", tabParam);
        return tabParam as any;
      }
      const saved = sessionStorage.getItem("delivery_note_view_mode");
      if (saved && ["orders", "delivery-notes", "pending-qc", "completed-qc"].includes(saved)) {
        return saved as any;
      }
      return "delivery-notes";
    }
  );

  // Orders state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = new URLSearchParams(window.location.search).get("ordersPage");
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (!isNaN(p) && p > 0) {
        sessionStorage.setItem("delivery_note_orders_page", String(p));
        return p;
      }
    }
    const saved = sessionStorage.getItem("delivery_note_orders_page");
    if (saved) {
      const p = parseInt(saved, 10);
      if (!isNaN(p) && p > 0) return p;
    }
    return 1;
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [createExpectedDeliveryDate, setCreateExpectedDeliveryDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  // Per-line selected address id map: orderDetailId -> customerAddressId
  const [selectedAddressIds, setSelectedAddressIds] = useState<Record<number, number | null>>({});
  // Single address selection for Create dialog (backend expects one address per delivery note)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Delivery notes state
  const [deliveryNoteStatusFilter, setDeliveryNoteStatusFilter] =
    useState<string>("all");
  const [deliveryNoteSearchQuery, setDeliveryNoteSearchQuery] = useState("");
  const currentMonthValue = useMemo(() => format(new Date(), "yyyy-MM"), []);
  const recentMonths = useMemo(() => getRecentMonths(), []);
  const [deliveryNoteDateFilter, setDeliveryNoteDateFilter] = useState<string>(currentMonthValue);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [debouncedDeliveryNoteSearchQuery] = useDebounce(deliveryNoteSearchQuery, 300);
  const [deliveryNotePage, setDeliveryNotePage] = useState<number>(() => {
    const pageParam = new URLSearchParams(window.location.search).get("page");
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (!isNaN(p) && p > 0) {
        sessionStorage.setItem("delivery_note_page", String(p));
        return p;
      }
    }
    const saved = sessionStorage.getItem("delivery_note_page");
    if (saved) {
      const p = parseInt(saved, 10);
      if (!isNaN(p) && p > 0) return p;
    }
    return 1;
  });

  useEffect(() => {
    sessionStorage.setItem("delivery_note_view_mode", viewMode);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (viewMode === "delivery-notes") {
          next.delete("tab");
        } else {
          next.set("tab", viewMode);
        }
        return next;
      },
      { replace: true }
    );
  }, [viewMode, setSearchParams]);

  useEffect(() => {
    sessionStorage.setItem("delivery_note_page", String(deliveryNotePage));
  }, [deliveryNotePage]);

  useEffect(() => {
    sessionStorage.setItem("delivery_note_orders_page", String(currentPage));
  }, [currentPage]);

  // Reset orders page when orders search query changes to avoid page offset issues
  const isFirstOrdersSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstOrdersSearchRender.current) {
      isFirstOrdersSearchRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset page when search or status filters change to avoid page offset issues
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setDeliveryNotePage(1);
  }, [debouncedDeliveryNoteSearchQuery, deliveryNoteStatusFilter, deliveryNoteDateFilter, customStartDate, customEndDate]);

  const { startDate, endDate } = useMemo(
    () => getDateRangeForFilterValue(deliveryNoteDateFilter, customStartDate, customEndDate),
    [deliveryNoteDateFilter, customStartDate, customEndDate]
  );

  // Query paginated delivery notes from backend
  const {
    data: allNotesData,
    isLoading: deliveryNotesLoading,
    isError: deliveryNotesError,
    error: deliveryNotesErrorObj,
    refetch: refetchDeliveryNotes,
  } = useDeliveryNotes({
    pageNumber: deliveryNotePage,
    pageSize: 10,
    searchTerm: debouncedDeliveryNoteSearchQuery.trim() || undefined,
    status: deliveryNoteStatusFilter !== "all" ? deliveryNoteStatusFilter : undefined,
    startDate,
    endDate,
  });

  // Query delivery notes stats from backend
  const {
    data: statsData,
    refetch: refetchStats,
  } = useDeliveryNoteStats({
    startDate,
    endDate,
  });

  const stats = useMemo(() => {
    const total = statsData?.totalCount ?? 0;
    const todayCount = statsData?.todayCount ?? 0;
    const deliveredCount = statsData?.deliveredCount ?? 0;
    const pendingCount = statsData?.pendingCount ?? 0;
    const failedCount = statsData?.failedCount ?? 0;
    const successRate = total > 0 ? Math.round((deliveredCount / total) * 100) : 0;

    return {
      total,
      todayCount,
      deliveredCount,
      successRate,
      pendingCount,
      failedCount,
    };
  }, [statsData]);

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

  // Group available orders by prepress code (Mã bài)
  const groupedPrepressOrders = useMemo(() => {
    if (!Array.isArray(availableOrdersRaw)) return [];

    const groupsMap = new Map<string, any[]>();

    availableOrdersRaw.forEach((order) => {
      if (!order.details) return;
      order.details.forEach((detail) => {
        const codes = detail.proofingOrderCodes || [];

        if (codes.length === 0) {
          const key = "no_proofing_code";
          if (!groupsMap.has(key)) {
            groupsMap.set(key, []);
          }
          groupsMap.get(key)!.push({
            ...detail,
            orderId: order.orderId,
            orderCode: order.orderCode,
            customerId: order.customerId,
            customerName: order.customerName,
            deliveryAddress: order.deliveryAddress,
            recipientAddress: order.recipientAddress,
            createdAt: order.createdAt,
          });
        } else {
          codes.forEach((code: string) => {
            const key = code.trim().toUpperCase();
            if (!groupsMap.has(key)) {
              groupsMap.set(key, []);
            }
            groupsMap.get(key)!.push({
              ...detail,
              orderId: order.orderId,
              orderCode: order.orderCode,
              customerId: order.customerId,
              customerName: order.customerName,
              deliveryAddress: order.deliveryAddress,
              recipientAddress: order.recipientAddress,
              createdAt: order.createdAt,
            });
          });
        }
      });
    });

    const groups: {
      proofingOrderCode: string;
      displayName: string;
      details: any[];
    }[] = [];

    groupsMap.forEach((details, key) => {
      groups.push({
        proofingOrderCode: key,
        displayName: key === "no_proofing_code" ? "Chưa chia bài (Khác)" : `Bài ${key}`,
        details,
      });
    });

    groups.sort((a, b) => {
      if (a.proofingOrderCode === "no_proofing_code") return 1;
      if (b.proofingOrderCode === "no_proofing_code") return -1;
      return b.proofingOrderCode.localeCompare(a.proofingOrderCode);
    });

    return groups;
  }, [availableOrdersRaw]);

  const filteredGroupedPrepressOrders = useMemo(() => {
    if (!searchQuery.trim()) return groupedPrepressOrders;

    const q = searchQuery.trim().toLowerCase();

    return groupedPrepressOrders
      .map((group) => {
        const matchedDetails = group.details.filter((detail) => {
          return (
            String(group.proofingOrderCode).toLowerCase().includes(q) ||
            String(detail.designCode || "").toLowerCase().includes(q) ||
            String(detail.designName || "").toLowerCase().includes(q) ||
            String(detail.customerName || "").toLowerCase().includes(q) ||
            String(detail.orderCode || "").toLowerCase().includes(q)
          );
        });

        const isGroupCodeMatched = String(group.proofingOrderCode).toLowerCase().includes(q);

        return {
          ...group,
          details: isGroupCodeMatched ? group.details : matchedDetails,
        };
      })
      .filter((group) => group.details.length > 0);
  }, [groupedPrepressOrders, searchQuery]);

  const prepressOrdersList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroupedPrepressOrders.slice(start, start + itemsPerPage);
  }, [filteredGroupedPrepressOrders, currentPage]);

  const prepressTotalPages = Math.ceil(filteredGroupedPrepressOrders.length / itemsPerPage);

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

  const deliveryNotesData = allNotesData;

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

  const bulkCompleteMutation = useBulkCompleteDeliveryNotes();

  const handleBulkComplete = async () => {
    const ids = Array.from(selectedNoteIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    setUpdatingIds(new Set(ids));
    try {
      await bulkCompleteMutation.mutateAsync({
        deliveryNoteIds: ids.map(Number),
      });
      setSelectedNoteIds(new Set());
      refetchDeliveryNotes();
      refetchStats();
    } catch (err: unknown) {
      // Handled in mutation onError
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
      try {
        await apiRequest.put(`/delivery-notes/${res.id}/status`, {
          status: "in_transit",
          cancelReason: null,
          failureReason: null,
          failureType: null,
          affectsDebt: false,
          notes: null,
        });
      } catch (statusErr) {
        console.error("Lỗi tự động cập nhật trạng thái Đang giao:", statusErr);
      }
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

    // Validate: deliveryQty <= remainingToDeliver
    const overLimitItems = selectedOrders.filter((od) => {
      const qty = deliveryQtys[od.orderDetailId] || 0;
      return qty > getRemainingQty(od);
    });
    if (overLimitItems.length > 0) {
      toast.error("Số lượng giao vượt quá số còn lại. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      let expectedDeliveryDateIso: string | undefined = undefined;
      if (createExpectedDeliveryDate) {
        const [year, month, day] = createExpectedDeliveryDate.split("-").map(Number);
        expectedDeliveryDateIso = new Date(year, month - 1, day, 12, 0, 0).toISOString();
      }

      const payload = {
        customerAddressId: selectedAddressId,
        notes: notes || undefined,
        expectedDeliveryDate: expectedDeliveryDateIso,
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
      setCreateExpectedDeliveryDate(format(new Date(), "yyyy-MM-dd"));
      setIsCreateDialogOpen(false);
      refetchOrders();
      refetchDeliveryNotes();
      setViewMode("delivery-notes");
      if (res && res.id) {
        try {
          await apiRequest.put(`/delivery-notes/${res.id}/status`, {
            status: "in_transit",
            cancelReason: null,
            failureReason: null,
            failureType: null,
            affectsDebt: false,
            notes: null,
          });
        } catch (statusErr) {
          console.error("Lỗi tự động cập nhật trạng thái Đang giao:", statusErr);
        }
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
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Phiếu giao hàng
          </h1>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Total Notes */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none">
                  Tổng phiếu:
                </span>
                <span className="text-sm sm:text-base font-bold leading-none text-stone-900 dark:text-stone-50">
                  {stats.total}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium mt-1.5 leading-none truncate">
                30 ngày gần nhất
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Created Today */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none">
                  Tạo hôm nay:
                </span>
                <span className="text-sm sm:text-base font-bold leading-none text-stone-900 dark:text-stone-50">
                  {stats.todayCount}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium mt-1.5 leading-none truncate">
                {format(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivered (Success) */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none">
                  Đã giao:
                </span>
                <span className="text-sm sm:text-base font-bold leading-none text-emerald-600 dark:text-emerald-400">
                  {stats.deliveredCount}
                </span>
              </div>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 leading-none truncate">
                {stats.successRate}% thành công
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending / Transit */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <RefreshCw className="h-3 w-3 text-stone-600 dark:text-stone-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none">
                  Chờ / Đang giao:
                </span>
                <span className="text-sm sm:text-base font-bold leading-none text-stone-900 dark:text-stone-50">
                  {stats.pendingCount}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium mt-1.5 leading-none truncate">
                Cần xử lý
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="border-0 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-2.5 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-destructive/10 dark:bg-red-950/20 flex items-center justify-center shrink-0">
              <X className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none">
                  Thất bại:
                </span>
                <span className="text-sm sm:text-base font-bold leading-none text-destructive">
                  {stats.failedCount}
                </span>
              </div>
              <p className="text-[9px] text-destructive font-medium mt-1.5 leading-none truncate">
                Cần hẹn lại / hủy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as any)}
      >
        <TabsList className="flex gap-2.5 bg-transparent p-0 w-fit mb-2.5">
          <TabsTrigger
            value="delivery-notes"
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 shadow-xs"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Phiếu đã tạo
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tạo phiếu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-2.5">
          <OrdersView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersErrorObj={ordersErrorObj}
            refetchOrders={refetchOrders}
            ordersList={prepressOrdersList}
            totalPages={prepressTotalPages}
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

        <TabsContent value="delivery-notes" className="mt-2.5">
          <DeliveryNotesView
            deliveryNoteStatusFilter={deliveryNoteStatusFilter}
            setDeliveryNoteStatusFilter={setDeliveryNoteStatusFilter}
            deliveryNoteSearchQuery={deliveryNoteSearchQuery}
            setDeliveryNoteSearchQuery={setDeliveryNoteSearchQuery}
            deliveryNoteDateFilter={deliveryNoteDateFilter}
            setDeliveryNoteDateFilter={setDeliveryNoteDateFilter}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            deliveryNotesData={deliveryNotesData}
            deliveryNotesLoading={deliveryNotesLoading}
            deliveryNotesError={deliveryNotesError}
            deliveryNotesErrorObj={deliveryNotesErrorObj}
            refetchDeliveryNotes={refetchDeliveryNotes}
            refetchStats={refetchStats}
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
            handleBulkComplete={handleBulkComplete}
            updatingIds={updatingIds}
            onImageClick={handleImageClick}
            allNotesForStats={allNotesData}
          />
        </TabsContent>

        <TabsContent value="pending-qc" className="mt-6">
          <QCInspectionView tab="pending_qc" />
        </TabsContent>

        <TabsContent value="completed-qc" className="mt-6">
          <QCInspectionView tab="completed" />
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
        expectedDeliveryDate={createExpectedDeliveryDate}
        setExpectedDeliveryDate={setCreateExpectedDeliveryDate}
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
  ordersList: Array<any>;
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
  const queryClient = useQueryClient();
  const [expandedPrepressOrders, setExpandedPrepressOrders] = useState<Set<string>>(new Set());
  const [orderInputPage, setOrderInputPage] = useState<string>(String(currentPage));

  useEffect(() => {
    setOrderInputPage(String(currentPage));
  }, [currentPage]);

  const handleOrderPageInputSubmit = () => {
    let p = parseInt(orderInputPage, 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setOrderInputPage(String(p));
    if (p !== currentPage) {
      setCurrentPage(p);
    }
  };

  // Auto-expand all prepress orders when the list loads or changes
  useEffect(() => {
    if (ordersList.length > 0) {
      setExpandedPrepressOrders(new Set(ordersList.map((o) => o.proofingOrderCode)));
    }
  }, [ordersList]);
  const toggleOrder = (code: string) => {
    const next = new Set(expandedPrepressOrders);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setExpandedPrepressOrders(next);
  };

  const selectedOrdersCount = useMemo(() => {
    return new Set(selectedOrders.map(o => o.orderId)).size;
  }, [selectedOrders]);

  return (
    <div className="space-y-2 pb-24">
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
          onClick={() => {
            queryClient.invalidateQueries();
            refetchOrders();
          }}
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
          ordersList.map((group) => {
            if (!group.proofingOrderCode) return null;
            const isExpanded = expandedPrepressOrders.has(group.proofingOrderCode);

            // Determine target customer and detail IDs that belong to the target customer
            const targetCustomerId = selectedCustomerId !== null
              ? selectedCustomerId
              : (group.details[0]?.customerId ?? null);

            const targetCustomerDetailIds = group.details
              .filter((d: any) => d.customerId === targetCustomerId)
              .map((d: any) => d.orderDetailId)
              .filter((id: any): id is number => id != null);

            const selectedCount = targetCustomerDetailIds.filter((id: number) => selectedOrderDetailIds.has(id)).length;
            const isAllSelected = targetCustomerDetailIds.length > 0 && selectedCount === targetCustomerDetailIds.length;
            const isHeaderCheckboxDisabled = selectedCustomerId !== null && targetCustomerDetailIds.length === 0;

            const uniqueCustomerNames = Array.from(new Set(group.details.map((d: any) => d.customerName).filter(Boolean)));
            const uniqueAddresses = Array.from(new Set(group.details.map((d: any) => d.deliveryAddress).filter(Boolean)));

            return (
              <div
                key={group.proofingOrderCode}
                className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden shadow-xs transition-all duration-200 mb-3 ${
                  isHeaderCheckboxDisabled ? "opacity-60" : ""
                }`}
              >
                {/* Card Header */}
                <div
                  onClick={() => toggleOrder(group.proofingOrderCode)}
                  className="py-1.5 px-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-850"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={() => handleToggleOrderDetail(targetCustomerDetailIds)}
                        disabled={isHeaderCheckboxDisabled}
                        className="rounded"
                      />
                    </div>
                    <div className="text-black dark:text-white hover:text-stone-700">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const nameStr = group.displayName || "";
                          const isBai = nameStr.toLowerCase().startsWith("bài");
                          const numPart = isBai ? nameStr.slice(4).trim() : nameStr;
                          return (
                            <span className="font-extrabold font-mono text-xs text-black dark:text-white flex items-center">
                              {isBai && <span>Bài&nbsp;</span>}
                              <span className="text-sm font-black text-red-600 dark:text-red-400">
                                <HighlightText text={numPart} query={searchQuery} />
                              </span>
                            </span>
                          );
                        })()}
                        <Badge variant="outline" className="h-4 text-[9px] font-bold px-1.5 py-0 border-stone-400 text-black dark:text-white">
                          {group.details.length} thiết kế
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOrderDetail(targetCustomerDetailIds);
                        }}
                        disabled={isHeaderCheckboxDisabled}
                        className="text-xs font-bold h-7 px-2.5 border-stone-400 dark:border-stone-600 hover:bg-stone-100 text-black dark:text-white"
                      >
                        Chọn sản phẩm trong bài
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Card Collapsible Content */}
                {isExpanded && group.details && group.details.length > 0 && (
                  <div className="bg-white dark:bg-stone-900 overflow-auto">
                    <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3">
                      <TableHeader className="bg-white dark:bg-stone-900 border-b border-stone-300 dark:border-stone-700">
                        <TableRow className="hover:bg-transparent border-stone-300 dark:border-stone-700">
                          <TableHead className="w-12 pl-4"></TableHead>
                          <TableHead className="w-12 text-black dark:text-white font-extrabold">Hình</TableHead>
                          <TableHead className="w-[120px] font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Mã thiết kế</TableHead>
                          <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Tên sản phẩm</TableHead>
                          <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Khách hàng</TableHead>
                          <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider min-w-[180px]">Địa chỉ giao</TableHead>
                          <TableHead className="text-right font-extrabold text-black dark:text-white text-xs uppercase tracking-wider w-28">Đơn hàng</TableHead>
                          <TableHead className="text-right font-extrabold text-black dark:text-white text-xs uppercase tracking-wider w-24">Số lượng</TableHead>
                          <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider min-w-[140px]">Lịch sử giao</TableHead>
                          <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider min-w-[130px] pr-4">Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.details.map((detail: any) => {
                          if (detail.orderDetailId == null) return null;
                          const isDetailDifferentCustomer = selectedCustomerId !== null && detail.customerId !== selectedCustomerId;
                          const isChecked = selectedOrderDetailIds.has(detail.orderDetailId);
                          return (
                            <TableRow
                              key={detail.orderDetailId}
                              onClick={() => {
                                if (isDetailDifferentCustomer) {
                                  toast.error("Phiếu giao hàng phải được tạo cho cùng 1 khách hàng. Không thể chọn sản phẩm của khách hàng khác!");
                                  return;
                                }
                                handleToggleOrderDetail(detail.orderDetailId!);
                              }}
                              className={`cursor-pointer border-b border-stone-200/70 dark:border-stone-800/80 last:border-b-0 transition-colors ${
                                isDetailDifferentCustomer ? "cursor-not-allowed" : ""
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
                                  disabled={isDetailDifferentCustomer}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell className="w-12">
                                <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-850 border flex items-center justify-center overflow-hidden relative">
                                  {detail.designImageUrl || detail.designThumbnailUrl ? (
                                    <img
                                      src={detail.designThumbnailUrl || detail.designImageUrl || ""}
                                      alt={detail.designCode || "Thiết kế"}
                                      className="h-full w-full object-cover cursor-zoom-in"
                                      loading="lazy"
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
                              <TableCell className="w-[120px] font-mono font-extrabold text-[11px] uppercase text-black dark:text-white">
                                <HighlightText text={detail.designCode} query={searchQuery} />
                              </TableCell>
                              <TableCell className="text-xs font-bold text-black dark:text-white text-left">
                                <div className="whitespace-normal break-words">
                                  <HighlightText text={detail.designName} query={searchQuery} />
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-black dark:text-white font-bold text-left whitespace-normal break-words min-w-[140px] max-w-[220px]">
                                <HighlightText text={detail.customerName} query={searchQuery} />
                              </TableCell>
                              <TableCell className="text-xs text-black dark:text-white font-medium whitespace-normal break-words min-w-[180px] max-w-[280px]">
                                <HighlightText text={detail.deliveryAddress} query={searchQuery} />
                              </TableCell>
                              <TableCell className="text-right text-xs font-bold text-black dark:text-white w-28">
                                <span className="font-mono font-bold text-black dark:text-white">
                                  <HighlightText text={detail.orderCode} query={searchQuery} />
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-xs font-black text-red-600 dark:text-red-400 tabular-nums w-24">
                                {new Intl.NumberFormat('vi-VN').format(getRemainingQty(detail) ?? 0)}
                              </TableCell>
                              <TableCell className="text-xs text-left min-w-[140px] max-w-[240px]">
                                {detail.deliveryHistory && detail.deliveryHistory.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                    {detail.deliveryHistory.map((hist: any) => {
                                      const isDelivered = hist.status === "completed" || hist.status === "delivered";
                                      const isTransit = hist.status === "in_transit" || hist.status === "shipping";
                                      const statusColor = isDelivered
                                        ? "bg-white text-emerald-700 border-emerald-500 dark:bg-stone-900 dark:text-emerald-400"
                                        : isTransit
                                          ? "bg-white text-sky-700 border-sky-500 dark:bg-stone-900 dark:text-sky-400"
                                          : "bg-white text-amber-700 border-amber-500 dark:bg-stone-900 dark:text-amber-400";
                                      return (
                                        <HoverCard key={hist.deliveryNoteId}>
                                          <HoverCardTrigger asChild>
                                            <Link
                                              to={`/delivery-notes/${hist.deliveryNoteId}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="inline-flex items-center"
                                            >
                                              <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0.5 font-mono font-bold cursor-pointer border ${statusColor}`}
                                              >
                                                {isTransit && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse inline-block" />}
                                                {hist.deliveryNoteCode || hist.displayCode || `#${hist.deliveryNoteId}`} (<span className="text-red-600 dark:text-red-400 font-black">{new Intl.NumberFormat("vi-VN").format(hist.deliveryQty)}</span>)
                                              </Badge>
                                            </Link>
                                          </HoverCardTrigger>
                                          <HoverCardContent className="w-80 p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                                            <div className="space-y-2">
                                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                                <span>Phiếu giao: {hist.deliveryNoteCode}</span>
                                                <Badge className={isDelivered ? "bg-emerald-500 hover:bg-emerald-600" : isTransit ? "bg-sky-500 hover:bg-sky-600" : "bg-amber-500 hover:bg-amber-600"}>
                                                  {hist.statusName}
                                                </Badge>
                                              </div>
                                              <div className="grid grid-cols-2 gap-y-1.5 text-stone-600 dark:text-stone-400">
                                                <div>Số lượng giao:</div>
                                                <div className="font-semibold text-right text-red-600 dark:text-red-400 font-black">{new Intl.NumberFormat("vi-VN").format(hist.deliveryQty)} cái</div>
                                                <div>Thực tế đã nhận:</div>
                                                <div className="font-semibold text-right text-stone-900 dark:text-stone-100">{hist.actualDeliveredQty != null ? `${new Intl.NumberFormat("vi-VN").format(hist.actualDeliveredQty)} cái` : "—"}</div>
                                                <div>Ngày giao:</div>
                                                <div className="text-right font-medium">{formatDate(hist.expectedDeliveryDate || hist.deliveryDate || hist.expectedDate || hist.createdAt)}</div>
                                              </div>
                                              {hist.note && (
                                                <div className="border-t border-stone-100 dark:border-stone-800 pt-2 mt-2 text-stone-500 italic">
                                                  Ghi chú: {hist.note}
                                                </div>
                                              )}
                                            </div>
                                          </HoverCardContent>
                                        </HoverCard>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-stone-400 text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-left min-w-[130px] max-w-[200px] pr-4">
                                {detail.designNotes ? (
                                  <div className="text-[10px] text-stone-900 dark:text-stone-100 font-mono bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded px-1.5 py-0.5 whitespace-pre-wrap">
                                    <HighlightText text={detail.designNotes} query={searchQuery} />
                                  </div>
                                ) : (
                                  <span className="text-stone-400 text-xs">—</span>
                                )}
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

      {/* Sticky Bottom Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 z-30 mt-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-4 shadow-lg">
          <div className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Trang <span className="font-bold text-stone-900 dark:text-stone-100">{currentPage}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 border-stone-200"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={orderInputPage}
                onChange={(e) => setOrderInputPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOrderPageInputSubmit();
                }}
                onBlur={handleOrderPageInputSubmit}
                className="w-10 h-6 text-center font-bold text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Nhập số trang và nhấn Enter để chuyển nhanh"
              />
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                / {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 border-stone-200"
              title="Trang tiếp theo"
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
  deliveryNoteDateFilter: string;
  setDeliveryNoteDateFilter: (filter: string) => void;
  customStartDate?: string;
  setCustomStartDate?: (val: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (val: string) => void;
  deliveryNotesData: unknown;
  deliveryNotesLoading: boolean;
  deliveryNotesError: boolean;
  deliveryNotesErrorObj: unknown;
  refetchDeliveryNotes: () => void;
  refetchStats: () => void;
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
  handleBulkComplete: () => void;
  updatingIds: Set<number>;
  onImageClick: (url: string, e: React.MouseEvent) => void;
  allNotesForStats: unknown;
}

function DeliveryNotesView({
  deliveryNoteStatusFilter,
  setDeliveryNoteStatusFilter,
  deliveryNoteSearchQuery,
  setDeliveryNoteSearchQuery,
  deliveryNoteDateFilter,
  setDeliveryNoteDateFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  deliveryNotesLoading,
  deliveryNotesError,
  deliveryNotesErrorObj,
  refetchDeliveryNotes,
  refetchStats,
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
  handleBulkComplete,
  updatingIds,
  onImageClick,
  allNotesForStats,
}: DeliveryNotesViewProps) {
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());
  const [noteInputPage, setNoteInputPage] = useState<string>(String(deliveryNotePage));

  useEffect(() => {
    setNoteInputPage(String(deliveryNotePage));
  }, [deliveryNotePage]);

  const handleNotePageInputSubmit = () => {
    const totalPages = deliveryNotesDataTyped?.totalPages || 1;
    let p = parseInt(noteInputPage, 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setNoteInputPage(String(p));
    if (p !== deliveryNotePage) {
      setDeliveryNotePage(p);
    }
  };
  const recentMonths = useMemo(() => getRecentMonths(), []);
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
          expectedDeliveryDate?: string | null;
        }>;
        totalPages?: number;
        total?: number;
      }
    | undefined;

  const { searchedNotes, isLocalSearch } = useMemo(() => {
    return {
      searchedNotes: deliveryNotesDataTyped?.items || [],
      isLocalSearch: false,
    };
  }, [deliveryNotesDataTyped]);

  // Sort delivery notes: purely chronologically by expectedDeliveryDate ?? createdAt (newer first), falling back to id desc
  const sortedDeliveryNotes = useMemo(() => {
    const items = searchedNotes.slice();
    items.sort((a: any, b: any) => {
      const dateA = a?.expectedDeliveryDate ?? a?.createdAt;
      const dateB = b?.expectedDeliveryDate ?? b?.createdAt;
      const da = dateA ? new Date(dateA).getTime() : 0;
      const db = dateB ? new Date(dateB).getTime() : 0;
      if (da !== db) return db - da; // newer first

      const idA = a?.id ?? 0;
      const idB = b?.id ?? 0;
      return idB - idA; // larger ID first (fallback)
    });
    return items;
  }, [searchedNotes]);

  useEffect(() => {
    if (deliveryNoteSearchQuery.trim()) {
      const ids = searchedNotes
        .map((n) => n.id)
        .filter((id): id is number => typeof id === "number");
      setExpandedNoteIds(new Set(ids));
    } else {
      setExpandedNoteIds(new Set());
    }
  }, [deliveryNoteSearchQuery, searchedNotes]);

  const toggleNoteExpansion = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const dateFilterLabel = useMemo(() => {
    if (deliveryNoteDateFilter === "today") return "Hôm nay";
    if (deliveryNoteDateFilter === "yesterday") return "Hôm qua";
    if (deliveryNoteDateFilter === "7-days") return "7 ngày qua";
    if (deliveryNoteDateFilter === "30-days") return "30 ngày qua";
    if (deliveryNoteDateFilter === "all") return "Tất cả thời gian";
    if (deliveryNoteDateFilter === "custom") {
      if (customStartDate && customEndDate) {
        if (customStartDate === customEndDate) {
          try {
            return format(new Date(customStartDate), "dd/MM/yyyy");
          } catch {
            return customStartDate;
          }
        }
        try {
          return `${format(new Date(customStartDate), "dd/MM")} - ${format(new Date(customEndDate), "dd/MM/yy")}`;
        } catch {
          return `${customStartDate} - ${customEndDate}`;
        }
      }
      if (customStartDate) {
        try {
          return `Từ ${format(new Date(customStartDate), "dd/MM/yy")}`;
        } catch {
          return `Từ ${customStartDate}`;
        }
      }
      if (customEndDate) {
        try {
          return `Đến ${format(new Date(customEndDate), "dd/MM/yy")}`;
        } catch {
          return `Đến ${customEndDate}`;
        }
      }
      return "Tùy chọn ngày";
    }

    // Month format YYYY-MM
    const parts = deliveryNoteDateFilter.split("-");
    if (parts.length === 2) {
      const m = parseInt(parts[1], 10);
      const y = parts[0];
      if (!isNaN(m)) {
        return `Tháng ${m}/${y}`;
      }
    }
    return "Thời gian";
  }, [deliveryNoteDateFilter, customStartDate, customEndDate]);

  return (
    <div className="space-y-2">
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Nhập mã phiếu để xem nhanh, hoặc tìm khách hàng..."
              value={deliveryNoteSearchQuery}
              onChange={(e) => setDeliveryNoteSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm border-stone-200 dark:border-stone-800 bg-transparent rounded-lg focus-visible:ring-primary focus-visible:border-primary w-full"
            />
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <Select
              value={deliveryNoteStatusFilter}
              onValueChange={setDeliveryNoteStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-10 border-stone-200 dark:border-stone-800 rounded-lg text-xs font-medium">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-stone-400 shrink-0" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(deliveryNoteStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-10 border-stone-200 dark:border-stone-800 rounded-lg px-3 gap-2 text-xs justify-between min-w-[155px] max-w-[210px] bg-background hover:bg-stone-50 dark:hover:bg-stone-850 ${
                    deliveryNoteDateFilter !== "all" ? "text-stone-800 dark:text-stone-100 font-semibold" : "text-stone-600 dark:text-stone-400 font-normal"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">{dateFilterLabel}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[330px] p-3.5 space-y-3 rounded-xl shadow-lg border-stone-200 dark:border-stone-800">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Mốc thời gian nhanh
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Hôm nay", value: "today" },
                      { label: "Hôm qua", value: "yesterday" },
                      { label: "7 ngày qua", value: "7-days" },
                      { label: "30 ngày qua", value: "30-days" },
                      { label: "Tháng này", value: recentMonths[0]?.value || "current" },
                      { label: "Tất cả", value: "all" },
                    ].map((preset) => {
                      const isSelected = deliveryNoteDateFilter === preset.value;
                      return (
                        <Button
                          key={preset.value}
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setDeliveryNoteDateFilter(preset.value);
                            setIsDatePopoverOpen(false);
                          }}
                          className={`h-7 text-xs ${isSelected ? "font-bold shadow-xs" : "font-normal text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
                        >
                          {preset.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {recentMonths.length > 1 && (
                  <div className="border-t border-stone-100 dark:border-stone-800 pt-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Các tháng trước
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {recentMonths.slice(1, 4).map((m) => {
                        const isSelected = deliveryNoteDateFilter === m.value;
                        return (
                          <Button
                            key={m.value}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => {
                              setDeliveryNoteDateFilter(m.value);
                              setIsDatePopoverOpen(false);
                            }}
                            className={`h-7 text-xs ${isSelected ? "font-bold shadow-xs" : "font-normal text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
                          >
                            {m.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-stone-100 dark:border-stone-800 pt-2.5 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Khoảng ngày tùy chọn
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-stone-500 mb-0.5 block">Từ ngày</span>
                      <DatePicker
                        value={customStartDate || ""}
                        onChange={(val) => {
                          setCustomStartDate?.(val);
                          if (deliveryNoteDateFilter !== "custom") {
                            setDeliveryNoteDateFilter("custom");
                          }
                        }}
                        className="h-7 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 mb-0.5 block">Đến ngày</span>
                      <DatePicker
                        value={customEndDate || ""}
                        onChange={(val) => {
                          setCustomEndDate?.(val);
                          if (deliveryNoteDateFilter !== "custom") {
                            setDeliveryNoteDateFilter("custom");
                          }
                        }}
                        className="h-7 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    {(customStartDate || customEndDate || deliveryNoteDateFilter === "custom") ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomStartDate?.("");
                          setCustomEndDate?.("");
                          setDeliveryNoteDateFilter("today");
                        }}
                        className="h-7 px-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                      >
                        Đặt lại
                      </Button>
                    ) : <div />}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (customStartDate || customEndDate) {
                          setDeliveryNoteDateFilter("custom");
                        }
                        setIsDatePopoverOpen(false);
                      }}
                      className="h-7 px-3 text-xs font-semibold"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetchDeliveryNotes();
                refetchStats();
              }}
              disabled={deliveryNotesLoading}
              className="h-10 w-10 border-stone-200 dark:border-stone-800 rounded-lg animate-none shrink-0"
              title="Tải lại dữ liệu"
            >
              <RefreshCw
                className={`h-4 w-4 ${deliveryNotesLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {selectedNoteIds.size > 0 && (
          <div className="flex items-center gap-3 w-full border-t pt-2.5 mt-2.5 border-stone-150 dark:border-stone-800">
            <span className="text-xs text-stone-500 font-medium">
              Đã chọn <strong className="text-primary">{selectedNoteIds.size}</strong> phiếu
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearSelection()}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-bold text-xs h-8 px-2 hover:bg-transparent"
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
            <Button
              size="sm"
              onClick={handleBulkComplete}
              disabled={bulkLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg px-4 h-9 shadow-sm"
            >
              {bulkLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Giao thành công
            </Button>
          </div>
        )}
      </div>

      {/* Info label below Toolbar */}
      <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
        <div className="flex items-center gap-3">
          <div>
            Hiển thị{" "}
            <span className="font-bold text-stone-850 dark:text-stone-200">
              {isLocalSearch ? (
                searchedNotes.length > 0 ? `1–${searchedNotes.length}` : "0"
              ) : (
                deliveryNotesDataTyped?.items && deliveryNotesDataTyped.items.length > 0 
                  ? `${(deliveryNotePage - 1) * itemsPerPage + 1}–${Math.min(deliveryNotePage * itemsPerPage, deliveryNotesDataTyped.total || 0)}` 
                  : "0"
              )}
            </span>{" "}
            / <span className="font-bold text-stone-850 dark:text-stone-200">{isLocalSearch ? searchedNotes.length : (deliveryNotesDataTyped?.total || 0)}</span> phiếu
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllVisible}
            className="h-7 text-xs px-2.5 font-medium border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
            Chọn tất cả phiếu trên trang
          </Button>
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
          <Table className="[&_td]:py-2.5 [&_td]:px-3 [&_th]:py-2.5 [&_th]:px-3">
            <TableHeader className="sticky top-0 bg-stone-50/75 dark:bg-stone-900/95 backdrop-blur-sm z-10 border-b border-stone-200 dark:border-stone-800">
              <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                <TableHead className="w-12 pl-6">
                  {sortedDeliveryNotes.some((n) => {
                    const status = getDisplayStatus(n);
                    return status !== "completed" && status !== "failed" && status !== "failed_reschedule" && status !== "cancelled";
                  }) && (
                    <Checkbox
                      checked={
                        sortedDeliveryNotes
                          .filter((n) => {
                            const status = getDisplayStatus(n);
                            return status !== "completed" && status !== "failed" && status !== "failed_reschedule" && status !== "cancelled";
                          })
                          .every((n) => n.id != null && selectedNoteIds.has(n.id))
                      }
                      onCheckedChange={() => handleSelectAllVisible()}
                      title="Chọn tất cả phiếu trên trang"
                      aria-label="Chọn tất cả"
                    />
                  )}
                </TableHead>
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
                  Ngày giao hàng
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
                ) : !searchedNotes ||
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
                  const isSelectable = status !== "completed" && status !== "failed" && status !== "failed_reschedule" && status !== "cancelled";
                  const isSelected = selectedNoteIds.has(deliveryNote.id as number);

                  const customers =
                    ((deliveryNote as any).orders || [])
                      .map((order: any) => order.customerName as string)
                      .filter(Boolean);
                  const uniqueCustomers = Array.from(new Set(customers)) as string[];

                  const isExpanded = expandedNoteIds.has(deliveryNote.id as number);

                  return (
                    <React.Fragment key={deliveryNote.id}>
                      <TableRow
                        className={`cursor-pointer transition-all duration-150 border-stone-100 dark:border-stone-850 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 ${
                          updatingIds.has(deliveryNote.id as number) ? "opacity-70" : ""
                        } ${isExpanded ? "bg-stone-50/40 dark:bg-stone-900/60" : ""}`}
                        onClick={(e) => {
                          if (deliveryNote.id) {
                            toggleNoteExpansion(deliveryNote.id, e);
                          }
                        }}
                      >
                        <TableCell
                          className="pl-6 w-12"
                          onClick={(e) => {
                            if (isSelectable && deliveryNote.id) {
                              e.stopPropagation();
                              handleToggleSelectNote(deliveryNote.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-center w-6 h-6">
                            {isSelectable ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelectNote(deliveryNote.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              ["failed", "failed_reschedule", "cancelled", "returned"].includes(status || "") ? (
                                <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 flex items-center justify-center">
                                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 flex items-center justify-center opacity-60">
                                  <Check className="h-3 w-3 text-stone-500 dark:text-stone-400" />
                                </div>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-stone-400 hover:text-stone-600 shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="font-bold font-mono text-sm text-stone-900 dark:text-stone-50">
                              <HighlightText text={deliveryNote.code || `#${deliveryNote.id}`} query={deliveryNoteSearchQuery} />
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
                            <HighlightText text={uniqueCustomers[0]} query={deliveryNoteSearchQuery} />
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
                            {formatDate((deliveryNote as any).expectedDeliveryDate ?? deliveryNote.createdAt)}
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
                              size="sm"
                              className="h-7 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-lg transition-all flex items-center gap-1"
                              onClick={() => handleViewDeliveryNote(deliveryNote.id)}
                            >
                              Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-stone-50/10 dark:bg-stone-900/30 border-t-0 hover:bg-transparent">
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-3 py-1.5 border-t border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-auto">
                              <Table className="[&_td]:py-1 [&_td]:px-2.5 [&_th]:py-1 [&_th]:px-2.5">
                                <TableHeader className="bg-white dark:bg-stone-900 border-b border-stone-300 dark:border-stone-700">
                                  <TableRow className="hover:bg-transparent border-stone-300 dark:border-stone-700">
                                    <TableHead className="w-12 pl-4 text-black dark:text-white font-extrabold">Hình</TableHead>
                                    <TableHead className="w-[120px] font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Mã thiết kế</TableHead>
                                    <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Tên sản phẩm</TableHead>
                                    <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Khách hàng</TableHead>
                                    <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider text-center">Trạng thái</TableHead>
                                    <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider">Mã bài</TableHead>
                                    <TableHead className="text-right font-extrabold text-black dark:text-white text-xs uppercase tracking-wider w-28">Đơn hàng</TableHead>
                                    <TableHead className="text-right font-extrabold text-black dark:text-white text-xs uppercase tracking-wider w-24">SL giao</TableHead>
                                    <TableHead className="font-extrabold text-black dark:text-white text-xs uppercase tracking-wider min-w-[130px] pr-4">Ghi chú</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {deliveryNote.lines && deliveryNote.lines.length > 0 ? (
                                    deliveryNote.lines.map((line: any, idx: number) => {
                                      const lineCustomerName = ((deliveryNote as any).orders || []).find((o: any) => o.orderCode === line.orderCode)?.customerName || uniqueCustomers[0] || "—";
                                      return (
                                        <TableRow
                                          key={line.id || idx}
                                          className="border-b border-stone-200/70 dark:border-stone-800/80 last:border-b-0 hover:bg-stone-50/50 dark:hover:bg-stone-950/20"
                                        >
                                          <TableCell className="pl-4 w-12" onClick={(e) => e.stopPropagation()}>
                                            <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-stone-800 border flex items-center justify-center overflow-hidden relative">
                                              {line.designImageUrl || line.designThumbnailUrl ? (
                                                <img
                                                  src={line.designThumbnailUrl || line.designImageUrl || ""}
                                                  alt={line.designCode || "Thiết kế"}
                                                  className="h-full w-full object-cover cursor-zoom-in"
                                                  loading="lazy"
                                                  onClick={(e) => onImageClick(line.designImageUrl!, e)}
                                                />
                                              ) : (
                                                <ImageIcon className="h-4 w-4 text-stone-400" />
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="w-[120px] font-mono font-extrabold text-[11px] uppercase text-black dark:text-white">
                                            <HighlightText text={line.designCode} query={deliveryNoteSearchQuery} />
                                          </TableCell>
                                          <TableCell className="text-xs font-bold text-black dark:text-white text-left">
                                            <div className="whitespace-normal break-words">
                                              <HighlightText text={line.designName} query={deliveryNoteSearchQuery} />
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-xs text-black dark:text-white font-bold text-left whitespace-normal break-words min-w-[140px] max-w-[220px]">
                                            <HighlightText text={lineCustomerName} query={deliveryNoteSearchQuery} />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            {line.status ? (
                                              <StatusBadge
                                                status={line.status}
                                                label={deliveryLineStatusLabels[line.status] || line.status}
                                              />
                                            ) : (
                                              <span className="text-muted-foreground text-[11px]">—</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-xs font-bold text-black dark:text-white">
                                            {line.proofingOrderCodes && line.proofingOrderCodes.length > 0 ? (
                                              <div className="flex flex-wrap gap-1">
                                                {line.proofingOrderCodes.map((code: string) => (
                                                  <ProofingCodeWithProductions key={code} code={code} query={deliveryNoteSearchQuery} />
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-stone-400">—</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right text-xs font-bold text-black dark:text-white w-28">
                                            <span className="font-mono font-bold text-black dark:text-white">
                                              <HighlightText text={line.orderCode} query={deliveryNoteSearchQuery} />
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right text-xs font-black text-red-600 dark:text-red-400 tabular-nums w-24">
                                            {new Intl.NumberFormat('vi-VN').format(line.deliveryQty ?? 0)}
                                          </TableCell>
                                          <TableCell className="text-xs text-left min-w-[130px] max-w-[200px] pr-4">
                                            {(line as any).designNotes ? (
                                              <div className="text-[10px] text-stone-900 dark:text-stone-100 font-mono bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded px-1.5 py-0.5 whitespace-pre-wrap">
                                                <HighlightText text={(line as any).designNotes} query={deliveryNoteSearchQuery} />
                                              </div>
                                            ) : (
                                              <span className="text-stone-400 text-xs">—</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={9} className="text-center py-4 text-stone-400 text-xs italic">
                                        Không có chi tiết sản phẩm nào
                                      </TableCell>
                                    </TableRow>
                                  )}
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
        !isLocalSearch &&
        deliveryNotesDataTyped?.items &&
        deliveryNotesDataTyped.items.length > 0 && (
          <>
            {/* Sticky Bottom Pagination */}
            {deliveryNotesDataTyped.totalPages &&
              deliveryNotesDataTyped.totalPages > 0 && (
                <div className="sticky bottom-0 z-30 mt-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex items-center justify-between flex-wrap gap-4 shadow-lg">
                  <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400">
                    Trang <span className="font-bold text-stone-900 dark:text-stone-100">{deliveryNotePage}</span> /{" "}
                    {deliveryNotesDataTyped.totalPages} • Hiển thị{" "}
                    <span className="font-bold text-stone-900 dark:text-stone-100">
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
                      className="h-8 w-8 p-0"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                      <input
                        type="number"
                        min={1}
                        max={deliveryNotesDataTyped.totalPages || 1}
                        value={noteInputPage}
                        onChange={(e) => setNoteInputPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNotePageInputSubmit();
                        }}
                        onBlur={handleNotePageInputSubmit}
                        className="w-10 h-6 text-center font-bold text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Nhập số trang và nhấn Enter để chuyển nhanh"
                      />
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                        / {deliveryNotesDataTyped.totalPages}
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
                      className="h-8 w-8 p-0"
                      title="Trang tiếp theo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

export function AddressBookManager({
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

// ============================================================================
// SELECTED ORDER CARD COMPONENT (WITH DESIGN TYPE AUTO-NOTE POPULATING)
// ============================================================================

interface SelectedOrderCardProps {
  od: SelectedOrderDetail;
  deliveryQtys: Record<number, number>;
  setDeliveryQtys: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  lineNotes: Record<number, string>;
  setLineNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  getRemainingQty: (od: SelectedOrderDetail) => number;
  onImageClick: (url: string, e: React.MouseEvent) => void;
}

export function SelectedOrderCard({
  od,
  deliveryQtys,
  setDeliveryQtys,
  lineNotes,
  setLineNotes,
  getRemainingQty,
  onImageClick,
}: SelectedOrderCardProps) {
  const { data: design } = useDesign(od.designId, !!od.designId);

  React.useEffect(() => {
    if (design && od.orderDetailId != null) {
      const currentNote = lineNotes[od.orderDetailId];
      if (!currentNote) {
        const typeName = design.designType?.name || "";
        const defaultNote = getDefaultLineNote(typeName || od.designName);
        if (defaultNote) {
          setLineNotes((prev) => {
            if (prev[od.orderDetailId]) return prev;
            return {
              ...prev,
              [od.orderDetailId]: defaultNote,
            };
          });
        }
      }
    }
  }, [design, od.orderDetailId, lineNotes, setLineNotes, od.designName]);

  return (
    <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-3">
          {/* Header row: name + qty input */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-muted/50 border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {od.designImageUrl || od.designThumbnailUrl ? (
                <img
                  src={od.designThumbnailUrl || od.designImageUrl || ""}
                  alt={od.designCode || "Thiết kế"}
                  className="h-full w-full object-cover cursor-zoom-in"
                  loading="lazy"
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
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {od.orderedQty != null && (
                  <span>
                    Đơn hàng:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Intl.NumberFormat("vi-VN").format(od.orderedQty)}
                    </span>
                  </span>
                )}
                {od.deliveredQtyTotal != null && od.deliveredQtyTotal > 0 && (
                  <span>
                    Đã giao:{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat("vi-VN").format(od.deliveredQtyTotal)}
                    </span>
                  </span>
                )}
                <span>
                  Còn lại:{" "}
                  <span className="font-bold text-primary">
                    {new Intl.NumberFormat("vi-VN").format(getRemainingQty(od) || 0)}
                  </span>
                </span>
                {(od as any).maxDeliveryQty !== undefined && (
                  <span className="ml-2 pl-2 border-l border-slate-200">
                    Tồn kho khả dụng:{" "}
                    <span className="font-bold text-amber-600">
                      {new Intl.NumberFormat("vi-VN").format((od as any).maxDeliveryQty)}
                    </span>
                  </span>
                )}
                {od.proofingOrderCodes && od.proofingOrderCodes.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400 font-medium">| Mã bài:</span>
                    <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                      {od.proofingOrderCodes.join(", ")}
                    </span>
                  </span>
                )}
              </div>
              {((od as any).designNotes || design?.notes) && (
                <div className="mt-1.5 rounded bg-amber-50/80 dark:bg-amber-950/30 p-1.5 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 whitespace-pre-wrap font-mono">
                  <span className="font-bold font-sans text-amber-800 dark:text-amber-300">Ghi chú thiết kế: </span>
                  {((od as any).designNotes || design?.notes)}
                </div>
              )}
              {od.deliveryAddress && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span className="break-words leading-relaxed" title={od.deliveryAddress}>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Địa chỉ giao: </span>
                    {od.deliveryAddress}
                  </span>
                </div>
              )}
              {od.deliveryHistory && od.deliveryHistory.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 items-center bg-stone-50/70 dark:bg-stone-900/60 border border-stone-150 dark:border-stone-850/80 rounded-lg px-2.5 py-1.5 w-fit" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                    <History className="h-3.5 w-3.5 text-stone-450 dark:text-stone-500" />
                    <span>Lịch sử giao:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {od.deliveryHistory.map((hist: any) => {
                      const isDelivered = hist.status === "completed" || hist.status === "delivered";
                      const isTransit = hist.status === "in_transit" || hist.status === "shipping";
                      const statusColor = isDelivered
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 hover:bg-emerald-100/50"
                        : isTransit
                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50 hover:bg-sky-100/50"
                          : "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/50 dark:text-stone-400 dark:border-stone-800 hover:bg-stone-100/50";
                      return (
                        <HoverCard key={hist.deliveryNoteId}>
                          <HoverCardTrigger asChild>
                            <Link
                              to={`/delivery-notes/${hist.deliveryNoteId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center"
                            >
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 font-mono font-bold cursor-pointer transition-all duration-150 hover:scale-105 border ${statusColor}`}
                              >
                                {isTransit && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse inline-block" />}
                                Phiếu #{hist.displayCode || hist.deliveryNoteCode} ({new Intl.NumberFormat("vi-VN").format(hist.deliveryQty)} cái)
                              </Badge>
                            </Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                <span>Phiếu giao: {hist.deliveryNoteCode}</span>
                                <Badge className={isDelivered ? "bg-emerald-500 hover:bg-emerald-600" : isTransit ? "bg-sky-500 hover:bg-sky-600" : "bg-amber-500 hover:bg-amber-600"}>
                                  {hist.statusName}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-y-1.5 text-stone-600 dark:text-stone-400">
                                <div>Số lượng giao:</div>
                                <div className="font-semibold text-right text-stone-900 dark:text-stone-100">{new Intl.NumberFormat("vi-VN").format(hist.deliveryQty)} cái</div>
                                <div>Thực tế đã nhận:</div>
                                <div className="font-semibold text-right text-stone-900 dark:text-stone-100">{hist.actualDeliveredQty != null ? `${new Intl.NumberFormat("vi-VN").format(hist.actualDeliveredQty)} cái` : "—"}</div>
                                <div>Ngày giao:</div>
                                <div className="text-right font-medium">{formatDate(hist.expectedDeliveryDate || hist.deliveryDate || hist.expectedDate || hist.createdAt)}</div>
                              </div>
                              {hist.note && (
                                <div className="border-t border-stone-100 dark:border-stone-800 pt-2 mt-2 text-stone-500 italic">
                                  Ghi chú: {hist.note}
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="w-[110px] flex-shrink-0">
              <Label className="text-xs text-slate-500 mb-1 block">Số lượng giao</Label>
              <Input
                type="number"
                min="1"
                max={((od as any).maxDeliveryQty !== undefined ? Math.min(getRemainingQty(od) || 0, (od as any).maxDeliveryQty) : getRemainingQty(od)) || 1}
                value={deliveryQtys[od.orderDetailId] || ""}
                onChange={(e) => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val)) val = 0;
                  let maxVal = getRemainingQty(od) || 0;
                  if ((od as any).maxDeliveryQty !== undefined) {
                    maxVal = Math.min(maxVal, (od as any).maxDeliveryQty);
                  }
                  if (val > maxVal) val = maxVal;
                  setDeliveryQtys((prev) => ({
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
  );
}


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
  expectedDeliveryDate?: string;
  setExpectedDeliveryDate?: (date: string) => void;
  onCreate: () => void;
  isPending: boolean;
  onImageClick: (url: string, e: React.MouseEvent) => void;
}

export function CreateDeliveryNoteDialog({
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
  expectedDeliveryDate,
  setExpectedDeliveryDate,
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
                <SelectedOrderCard
                  key={od.orderDetailId}
                  od={od}
                  deliveryQtys={deliveryQtys}
                  setDeliveryQtys={setDeliveryQtys}
                  lineNotes={lineNotes}
                  setLineNotes={setLineNotes}
                  getRemainingQty={getRemainingQty}
                  onImageClick={onImageClick}
                />
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

            <div className="space-y-1 flex-shrink-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ngày giao hàng dự kiến :
              </div>
              <DatePicker
                value={expectedDeliveryDate || ""}
                onChange={(val) => setExpectedDeliveryDate?.(val)}
                className="w-full h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg"
              />
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
                          {item.designImageUrl || item.designThumbnailUrl ? (
                            <img
                              src={item.designThumbnailUrl || item.designImageUrl || ""}
                              alt={item.designCode || "Thiết kế"}
                              className="h-full w-full object-cover cursor-zoom-in"
                              loading="lazy"
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
                          {(item as any).designNotes && (
                            <div className="mt-1 rounded bg-amber-50/80 dark:bg-amber-950/30 p-1.5 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 whitespace-pre-wrap font-mono">
                              <span className="font-bold font-sans text-amber-800 dark:text-amber-300">Ghi chú thiết kế: </span>
                              {(item as any).designNotes}
                            </div>
                          )}
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
