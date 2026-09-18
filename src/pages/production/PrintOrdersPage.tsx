import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Printer,
  Search,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  User,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  Sparkles,
  History,
  Layers,
  PlusCircle,
  MinusCircle,
  Calendar,
  Eye,
  X,
  Move,
  Filter,
  Inbox,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { PrintOrderHistoryModal } from "@/components/production/PrintOrderHistoryModal";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import { LazyImage } from "@/components/ui/lazy-image";
import { formatImageUrl, cn } from "@/lib/utils";
import {
  usePrintOrders,
  usePrintOrderCounts,
  useStartPrintOrder,
  usePausePrintOrder,
  useCompletePrintOrder,
  useReturnPrintOrder,
  useReorderPrintOrders,
  useEnqueuePrintOrders,
  useDequeuePrintOrder,
} from "@/hooks/use-print-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import type { PrintOrderResponse } from "@/Schema/print-order.schema";

const getDesignTypeBadgeStyle = (typeName?: string, typeCode?: string) => {
  const code = (typeCode || typeName || "").toLowerCase();
  if (code.includes("nhãn") || code.includes("label") || code.includes("paper") || code === "n") {
    return "bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-full px-3 py-0.5 text-[11px]";
  }
  if (code.includes("hộp") || code.includes("box") || code === "h") {
    return "bg-sky-100 text-sky-700 border border-sky-200 font-semibold rounded-full px-3 py-0.5 text-[11px]";
  }
  if (code.includes("túi") || code.includes("bag") || code.includes("pe") || code === "t") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-full px-3 py-0.5 text-[11px]";
  }
  if (code.includes("decal") || code.includes("sticker") || code === "d") {
    return "bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-full px-3 py-0.5 text-[11px]";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-full px-3 py-0.5 text-[11px]";
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const isMidnight =
      typeof dateStr === "string" &&
      (dateStr.includes("T00:00:00") ||
        dateStr.endsWith(" 00:00:00") ||
        (d.getHours() === 0 && d.getMinutes() === 0));
    return isMidnight
      ? format(d, "dd/MM/yyyy", { locale: vi })
      : format(d, "HH:mm - dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

const formatImpositionDate = (item: PrintOrderResponse) => {
  const rawDate =
    item.productionOrder?.proofingOrder?.completedAt ||
    item.impositionCompletedAt ||
    item.impositionDate ||
    item.productionOrder?.proofingOrder?.updatedAt ||
    item.productionOrder?.createdAt ||
    item.dispatchedAt ||
    (item as any).createdAt;

  if (!rawDate) return "Chưa xác định ngày";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "Chưa xác định ngày";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "Chưa xác định ngày";
  }
};

const formatCompletedDate = (item: PrintOrderResponse) => {
  const rawDate = item.completedAt || item.updatedAt || (item as any).createdAt;
  if (!rawDate) return "Chưa xác định ngày";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "Chưa xác định ngày";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "Chưa xác định ngày";
  }
};

const formatDispatchedDate = (item: PrintOrderResponse) => {
  const rawDate = item.scheduledPrintDate || item.dispatchedAt || item.createdAt;
  if (!rawDate) return "Chưa xác định ngày";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "Chưa xác định ngày";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "Chưa xác định ngày";
  }
};

export default function PrintOrdersPage() {
  // Main view tab: "processing" (waiting + printing), "completed"
  const [viewTab, setViewTab] = useState<"processing" | "completed">("processing");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Read-Only Proofing Detail Modal State
  const [viewingProofingOrderId, setViewingProofingOrderId] = useState<number | null>(null);

  // Unqueued Section Filters, Search & Collapsible Groups
  const [notQueuedDateFilter, setNotQueuedDateFilter] = useState<string>("all");
  const [notQueuedSearchQuery, setNotQueuedSearchQuery] = useState<string>("");
  const [collapsedDateGroups, setCollapsedDateGroups] = useState<Record<string, boolean>>({});

  const toggleDateGroupCollapse = (dateLabel: string) => {
    setCollapsedDateGroups((prev) => ({
      ...prev,
      [dateLabel]: !prev[dateLabel],
    }));
  };

  // Completed Orders Date Range Filter ("YYYY-MM-DD")
  const [completedFromDate, setCompletedFromDate] = useState<string>("");
  const [completedToDate, setCompletedToDate] = useState<string>("");

  // Drag and Drop State for Queued Items
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // Quick Move Position Dialog State
  const [quickMoveItem, setQuickMoveItem] = useState<PrintOrderResponse | null>(null);
  const [quickMovePositionInput, setQuickMovePositionInput] = useState<string>("");

  // Selection for bulk enqueue ("Chưa in" section)
  const [selectedNotQueuedIds, setSelectedNotQueuedIds] = useState<number[]>([]);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningItem, setReturningItem] = useState<PrintOrderResponse | null>(null);
  const [returnReason, setReturnReason] = useState("");

  // Pause dialog state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pausingItem, setPausingItem] = useState<PrintOrderResponse | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPrintOrderId, setHistoryPrintOrderId] = useState<number | null>(null);
  const [historyProofingCode, setHistoryProofingCode] = useState<string | undefined>(undefined);

  // Queries & Mutations
  const { data: counts } = usePrintOrderCounts();
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  // Compute fromDate & toDate for BE search when in completed tab
  const { fromDateParam, toDateParam } = useMemo(() => {
    if (viewTab === "completed") {
      return {
        fromDateParam: completedFromDate ? `${completedFromDate}T00:00:00` : undefined,
        toDateParam: completedToDate ? `${completedToDate}T23:59:59` : undefined,
      };
    }
    return { fromDateParam: undefined, toDateParam: undefined };
  }, [viewTab, completedFromDate, completedToDate]);

  const {
    data: printOrdersData,
    isLoading,
    refetch,
  } = usePrintOrders({
    pageNumber: 1,
    pageSize: 300,
    tab: viewTab,
    designTypeId: selectedDesignTypeId,
    search: searchQuery.trim() || undefined,
    fromDate: fromDateParam,
    toDate: toDateParam,
  });

  // Fetch unfiltered list for current viewTab to maintain stable Design Type counts
  const { data: unfilteredPrintOrdersData } = usePrintOrders({
    pageNumber: 1,
    pageSize: 300,
    tab: viewTab,
    designTypeId: undefined,
    search: searchQuery.trim() || undefined,
    fromDate: fromDateParam,
    toDate: toDateParam,
  });

  const startMutation = useStartPrintOrder();
  const pauseMutation = usePausePrintOrder();
  const completeMutation = useCompletePrintOrder();
  const returnMutation = useReturnPrintOrder();
  const reorderMutation = useReorderPrintOrders();
  const enqueueMutation = useEnqueuePrintOrders();
  const dequeueMutation = useDequeuePrintOrder();

  const printOrdersList = printOrdersData?.items || [];
  const unfilteredList = unfilteredPrintOrdersData?.items || printOrdersList;

  // Group completed items by completion date
  const groupedCompletedByDate = useMemo(() => {
    if (viewTab !== "completed") return [];

    const groups: Record<string, PrintOrderResponse[]> = {};

    printOrdersList.forEach((item) => {
      const dateLabel = formatCompletedDate(item);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(item);
    });

    const sortedDateKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Chưa xác định ngày") return 1;
      if (b === "Chưa xác định ngày") return -1;
      return b.localeCompare(a);
    });

    return sortedDateKeys.map((dateKey) => ({
      dateLabel: dateKey,
      items: groups[dateKey],
    }));
  }, [printOrdersList, viewTab]);

  // Group items by queue status when in "processing" tab
  const printingItems = useMemo(() => {
    return printOrdersList.filter((item) => item.status === "printing");
  }, [printOrdersList]);

  const queuedItems = useMemo(() => {
    return printOrdersList
      .filter((item) => item.status === "waiting" && (item.sortOrder ?? 0) > 0)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [printOrdersList]);

  const notQueuedItems = useMemo(() => {
    return printOrdersList.filter(
      (item) => item.status === "waiting" && (!item.sortOrder || item.sortOrder === 0)
    );
  }, [printOrdersList]);

  // Available distinct dates for unqueued items date filter (Grouped by Dispatched Date)
  const availableNotQueuedDates = useMemo(() => {
    const setOfDates = new Set<string>();
    notQueuedItems.forEach((item) => {
      const d = formatDispatchedDate(item);
      if (d) setOfDates.add(d);
    });
    return Array.from(setOfDates).sort((a, b) => {
      if (a === "Chưa xác định ngày") return 1;
      if (b === "Chưa xác định ngày") return -1;
      return b.localeCompare(a);
    });
  }, [notQueuedItems]);

  // Filter unqueued items by date & local search query
  const filteredNotQueuedItems = useMemo(() => {
    return notQueuedItems.filter((item) => {
      // Local search query filter
      if (notQueuedSearchQuery.trim()) {
        const q = notQueuedSearchQuery.trim().toLowerCase();
        const po = item.productionOrder;
        const proofingCode = (po?.proofingOrderCode || `PO-${item.productionOrderId}`).toLowerCase();
        const materialName = (item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || "").toLowerCase();
        const dispatchedBy = (item.dispatchedByName || "").toLowerCase();

        const matches =
          proofingCode.includes(q) ||
          materialName.includes(q) ||
          dispatchedBy.includes(q);

        if (!matches) return false;
      }

      // Date filter (Dispatched Date)
      if (notQueuedDateFilter && notQueuedDateFilter !== "all") {
        const dateLabel = formatDispatchedDate(item);
        if (dateLabel !== notQueuedDateFilter) return false;
      }

      return true;
    });
  }, [notQueuedItems, notQueuedSearchQuery, notQueuedDateFilter]);

  // Group filtered unqueued items by Dispatched Date (Today first, then descending by date)
  const groupedNotQueuedByDate = useMemo(() => {
    const groups: Record<string, PrintOrderResponse[]> = {};

    filteredNotQueuedItems.forEach((item) => {
      const dateLabel = formatDispatchedDate(item);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(item);
    });

    const todayLabel = format(new Date(), "dd/MM/yyyy", { locale: vi });

    const parseDateKey = (dateStr: string): number => {
      if (!dateStr || dateStr === "Chưa xác định ngày") return 0;
      try {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        }
      } catch {}
      return 0;
    };

    const sortedDateKeys = Object.keys(groups).sort((a, b) => {
      if (a === todayLabel) return -1;
      if (b === todayLabel) return 1;
      if (a === "Chưa xác định ngày") return 1;
      if (b === "Chưa xác định ngày") return -1;
      return parseDateKey(b) - parseDateKey(a);
    });

    return sortedDateKeys.map((dateKey) => ({
      dateLabel: dateKey,
      items: groups[dateKey],
    }));
  }, [filteredNotQueuedItems]);

  const isMachinePrinting = printingItems.length > 0;

  // Handlers for Queueing
  const handleEnqueueSelected = () => {
    if (selectedNotQueuedIds.length === 0) return;
    enqueueMutation.mutate(
      { printOrderIds: selectedNotQueuedIds },
      {
        onSuccess: () => {
          setSelectedNotQueuedIds([]);
          refetch();
        },
      }
    );
  };

  const handleEnqueueSingle = (id: number) => {
    enqueueMutation.mutate(
      { printOrderIds: [id] },
      {
        onSuccess: () => {
          setSelectedNotQueuedIds((prev) => prev.filter((i) => i !== id));
          refetch();
        },
      }
    );
  };

  const handleDequeueSingle = (id: number) => {
    dequeueMutation.mutate(id, { onSuccess: () => refetch() });
  };

  const handleToggleSelectNotQueued = (id: number) => {
    setSelectedNotQueuedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllNotQueuedSelected =
    filteredNotQueuedItems.length > 0 &&
    filteredNotQueuedItems.every((item) => selectedNotQueuedIds.includes(item.id));

  const handleToggleSelectAllNotQueued = () => {
    if (isAllNotQueuedSelected) {
      setSelectedNotQueuedIds([]);
    } else {
      setSelectedNotQueuedIds(filteredNotQueuedItems.map((item) => item.id));
    }
  };

  // --- REORDER HANDLERS FOR QUEUED ITEMS ---

  // HTML5 Drag-and-Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (draggedItemId && draggedItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverItemId(null);
    if (!draggedItemId || draggedItemId === targetId) return;

    const sourceIndex = queuedItems.findIndex((i) => i.id === draggedItemId);
    const targetIndex = queuedItems.findIndex((i) => i.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reorderedGroup = [...queuedItems];
    const [moved] = reorderedGroup.splice(sourceIndex, 1);
    reorderedGroup.splice(targetIndex, 0, moved);

    setDraggedItemId(null);
    const reorderedIds = reorderedGroup.map((i) => i.id);
    reorderMutation.mutate({ printOrderIds: reorderedIds }, { onSuccess: () => refetch() });
  };

  // Reorder Step Up / Down
  const handleMoveQueue = (item: PrintOrderResponse, direction: "up" | "down") => {
    const currentIndex = queuedItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= queuedItems.length) return;

    const reorderedGroup = [...queuedItems];
    const [moved] = reorderedGroup.splice(currentIndex, 1);
    reorderedGroup.splice(newIndex, 0, moved);

    const reorderedIds = reorderedGroup.map((i) => i.id);
    reorderMutation.mutate({ printOrderIds: reorderedIds }, { onSuccess: () => refetch() });
  };

  // Move to Top (#1)
  const handleMoveToTop = (item: PrintOrderResponse) => {
    const currentIndex = queuedItems.findIndex((i) => i.id === item.id);
    if (currentIndex <= 0) return;
    const reorderedGroup = [...queuedItems];
    const [moved] = reorderedGroup.splice(currentIndex, 1);
    reorderedGroup.unshift(moved);
    const reorderedIds = reorderedGroup.map((i) => i.id);
    reorderMutation.mutate({ printOrderIds: reorderedIds }, { onSuccess: () => refetch() });
  };

  // Move to Bottom
  const handleMoveToBottom = (item: PrintOrderResponse) => {
    const currentIndex = queuedItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1 || currentIndex === queuedItems.length - 1) return;
    const reorderedGroup = [...queuedItems];
    const [moved] = reorderedGroup.splice(currentIndex, 1);
    reorderedGroup.push(moved);
    const reorderedIds = reorderedGroup.map((i) => i.id);
    reorderMutation.mutate({ printOrderIds: reorderedIds }, { onSuccess: () => refetch() });
  };

  // Open Quick Move Dialog
  const handleOpenQuickMove = (item: PrintOrderResponse) => {
    const currentIndex = queuedItems.findIndex((i) => i.id === item.id);
    setQuickMoveItem(item);
    setQuickMovePositionInput(String(currentIndex + 1));
  };

  const handleConfirmQuickMove = () => {
    if (!quickMoveItem) return;
    const pos = parseInt(quickMovePositionInput, 10);
    if (isNaN(pos) || pos < 1) return;

    const targetIndex = Math.max(0, Math.min(queuedItems.length - 1, pos - 1));
    const currentIndex = queuedItems.findIndex((i) => i.id === quickMoveItem.id);
    if (currentIndex === -1 || currentIndex === targetIndex) {
      setQuickMoveItem(null);
      return;
    }

    const reorderedGroup = [...queuedItems];
    const [moved] = reorderedGroup.splice(currentIndex, 1);
    reorderedGroup.splice(targetIndex, 0, moved);

    setQuickMoveItem(null);
    const reorderedIds = reorderedGroup.map((i) => i.id);
    reorderMutation.mutate({ printOrderIds: reorderedIds }, { onSuccess: () => refetch() });
  };

  // Open Proofing Detail Modal
  const handleOpenProofingDetail = (item: PrintOrderResponse) => {
    const proofingOrderId = item.productionOrder?.proofingOrderId || item.productionOrder?.proofingOrder?.id;
    if (proofingOrderId) {
      setViewingProofingOrderId(proofingOrderId);
    }
  };

  const handleStart = (id: number) => {
    startMutation.mutate(id, { onSuccess: () => refetch() });
  };

  const handleDirectComplete = (id: number) => {
    completeMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  const handleOpenPauseDialog = (item: PrintOrderResponse) => {
    setPausingItem(item);
    setPauseReason("");
    setPauseDialogOpen(true);
  };

  const handleConfirmPause = () => {
    if (!pausingItem || !pauseReason.trim()) return;
    pauseMutation.mutate(
      {
        id: pausingItem.id,
        data: { reason: pauseReason.trim() },
      },
      {
        onSuccess: () => {
          setPauseDialogOpen(false);
          setPausingItem(null);
          setPauseReason("");
          refetch();
        },
      }
    );
  };

  const handleOpenReturnDialog = (item: PrintOrderResponse) => {
    setReturningItem(item);
    const existingReason =
      item.returnReason ||
      item.productionOrder?.returnReason ||
      (item as any)?.lastReturnReason ||
      "";
    setReturnReason(existingReason);
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!returningItem || !returnReason.trim()) return;
    returnMutation.mutate(
      {
        id: returningItem.id,
        data: { reason: returnReason.trim() },
      },
      {
        onSuccess: () => {
          setReturnDialogOpen(false);
          setReturningItem(null);
          setReturnReason("");
          refetch();
        },
      }
    );
  };

  const handleOpenHistory = (item: PrintOrderResponse) => {
    const code = item.productionOrder?.proofingOrderCode || `PO-${item.productionOrderId}`;
    setHistoryPrintOrderId(item.id);
    setHistoryProofingCode(code);
    setHistoryModalOpen(true);
  };

  // Tab badge totals
  const processingTotalCount =
    (counts?.notQueued ?? 0) + (counts?.queued ?? 0) + (counts?.printing ?? 0);

  return (
    <div className="space-y-4 p-5 max-w-[1650px] mx-auto pb-24 font-sans text-xs">
      {/* UNIFIED COMPACT HEADER & TOOLBAR CARD (MATCHING PRODUCTION DISPATCH STYLE) */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* TOP ROW: Title + 2 Main Navigation Tabs (Left) + Refresh Button (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          {/* Left: Title & 2 Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 leading-tight">Lệnh In</h1>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-1">
              <button
                onClick={() => setViewTab("processing")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  viewTab === "processing"
                    ? "bg-white text-[#93631F] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Lệnh in đang xử lý</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    viewTab === "processing" ? "bg-[#93631F]/10 text-[#93631F]" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {processingTotalCount}
                </span>
              </button>

              <button
                onClick={() => setViewTab("completed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                  viewTab === "completed"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Lệnh in hoàn thành</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    viewTab === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {counts?.completed || counts?.completedToday || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Refresh Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Làm mới
            </Button>
          </div>
        </div>

        {/* BOTTOM ROW: Design Type Filters (Matched with ProductionDispatch style) + Date Range + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Design Type Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1">LOẠI BÀI</span>
            <Button
              variant={selectedDesignTypeId === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDesignTypeId(undefined)}
              className={cn(
                "h-7 text-[11px] font-bold rounded-lg px-2 py-0 cursor-pointer transition-all",
                selectedDesignTypeId === undefined
                  ? "bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs"
                  : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              Tất cả ({unfilteredList.length})
            </Button>
            {designTypes.map((dt) => {
              const count = unfilteredList.filter(
                (item) => (item.designTypeId || item.productionOrder?.designType?.id) === dt.id
              ).length;

              return (
                <Button
                  key={dt.id}
                  variant={selectedDesignTypeId === dt.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDesignTypeId(dt.id)}
                  className={cn(
                    "h-7 text-[11px] font-semibold rounded-lg px-2 py-0 cursor-pointer transition-all",
                    selectedDesignTypeId === dt.id
                      ? "bg-[#93631F] hover:bg-[#7a521a] text-white font-bold shadow-2xs"
                      : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                  )}
                >
                  {dt.name} ({count})
                </Button>
              );
            })}
          </div>

          {/* Right Controls: Date Range (if completed) + Search Input */}
          <div className="flex flex-wrap items-center gap-2">
            {viewTab === "completed" && (
              <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-300/80 rounded-lg p-0.5 px-2.5 shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span className="text-[10.5px] font-bold text-emerald-900">Hoàn thành:</span>
                <DatePicker
                  value={completedFromDate}
                  onChange={(val) => setCompletedFromDate(val)}
                  placeholder="Từ ngày..."
                  className="h-7 text-[11px] w-32 border-emerald-300 bg-white shadow-2xs"
                  allowClear={true}
                />
                <span className="text-[10px] text-slate-400">→</span>
                <DatePicker
                  value={completedToDate}
                  onChange={(val) => setCompletedToDate(val)}
                  placeholder="Đến ngày..."
                  className="h-7 text-[11px] w-32 border-emerald-300 bg-white shadow-2xs"
                  allowClear={true}
                />

                <div className="flex items-center gap-1 border-l border-emerald-200 pl-1.5 ml-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = format(new Date(), "yyyy-MM-dd");
                      setCompletedFromDate(today);
                      setCompletedToDate(today);
                    }}
                    className={cn(
                      "h-6 text-[10.5px] font-bold px-2 rounded-md cursor-pointer transition-colors",
                      completedFromDate === format(new Date(), "yyyy-MM-dd") && completedToDate === format(new Date(), "yyyy-MM-dd")
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-emerald-800 hover:bg-emerald-100"
                    )}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const d7 = new Date();
                      d7.setDate(today.getDate() - 6);
                      setCompletedFromDate(format(d7, "yyyy-MM-dd"));
                      setCompletedToDate(format(today, "yyyy-MM-dd"));
                    }}
                    className="h-6 text-[10.5px] font-bold text-emerald-800 hover:bg-emerald-100 px-2 rounded-md cursor-pointer"
                  >
                    7 ngày
                  </Button>
                  {(completedFromDate || completedToDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCompletedFromDate("");
                        setCompletedToDate("");
                      }}
                      className="h-6 text-[10.5px] font-bold text-rose-700 hover:bg-rose-100 px-1.5 rounded-md cursor-pointer flex items-center gap-1"
                      title="Xóa lọc khoảng ngày"
                    >
                      <X className="h-3 w-3" /> Xóa
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Global Search (Matched with ProductionDispatch style) */}
            <div className="relative w-56 md:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm mã bài, tên bài, chất liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 h-7 text-[11px] rounded-lg border-slate-200 bg-white shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Render */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-7 w-7 text-[#93631F] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách lệnh in...</p>
        </div>
      ) : viewTab === "completed" ? (
        /* COMPLETED TAB VIEW - GROUPED BY COMPLETION DATE */
        <div className="space-y-3">
          {printOrdersList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              {completedFromDate || completedToDate
                ? "Không tìm thấy lệnh in nào hoàn thành trong khoảng ngày đã chọn."
                : "Chưa có lệnh in nào hoàn thành."}
            </div>
          ) : (
            groupedCompletedByDate.map((group) => (
              <div key={group.dateLabel} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                {/* Completion Date Group Header */}
                <div className="p-2 px-3.5 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between font-bold text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Ngày hoàn thành: <strong>{group.dateLabel}</strong></span>
                    <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0">
                      {group.items.length} bài
                    </Badge>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase">
                      <TableHead className="w-12 text-center py-2">#</TableHead>
                      <TableHead className="w-12 text-center py-2">Ảnh</TableHead>
                      <TableHead className="w-[160px] py-2">Mã Bình bài</TableHead>
                      <TableHead className="w-[140px] py-2">Loại bài</TableHead>
                      <TableHead className="w-[130px] text-right py-2">Số lượng</TableHead>
                      <TableHead className="w-[160px] py-2">Trạng thái</TableHead>
                      <TableHead className="w-[180px] py-2">Thời gian hoàn thành</TableHead>
                      <TableHead className="w-[150px] text-right py-2 pr-4">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item, index) => {
                      const po = item.productionOrder;
                      const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                      const images = po?.proofingOrderImages || [];
                      const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                      const thumbnail = formatImageUrl(rawThumbnail);
                      const fullImage = formatImageUrl(images[0]?.imageUrl || rawThumbnail);
                      const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;

                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <TableCell className="text-center font-mono font-medium text-slate-400">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center">
                            <div
                              onClick={() => fullImage && setViewingImageUrl(fullImage)}
                              className={cn(
                                "h-8 w-8 bg-slate-100 rounded border border-slate-200 mx-auto overflow-hidden transition-all",
                                fullImage && "cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-emerald-500/80 shadow-2xs"
                              )}
                              title={fullImage ? "Bấm để xem ảnh phóng to" : undefined}
                            >
                              {thumbnail ? (
                                <LazyImage src={thumbnail} fallbackSrc={fullImage} alt={proofingCode} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-slate-900">
                            <button
                              onClick={() => handleOpenProofingDetail(item)}
                              className="text-blue-600 hover:underline cursor-pointer font-bold flex items-center gap-1"
                              title="Xem chi tiết bình bài"
                            >
                              {proofingCode} <Eye className="h-3 w-3 text-blue-500" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getDesignTypeBadgeStyle(po?.designType?.code)}>
                              {po?.designType?.name || "Hộp"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {totalQty.toLocaleString("vi-VN")} tờ
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hoàn thành
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-slate-600">
                            {formatDateTime(item.completedAt)}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenHistory(item)}
                              className="h-7 text-[10.5px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              <History className="h-3 w-3 mr-1 text-slate-500" /> Lịch sử
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </div>
      ) : (
        /* PROCESSING TAB VIEW (3 QUEUE SECTIONS) */
        <div className="space-y-4">
          {/* SECTION 1: ĐANG IN (Active Printing Jobs) */}
          {printingItems.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-amber-500/10 rounded-2xl border border-amber-300/80 shadow-2xs p-4 space-y-3">
              <div className="flex items-center justify-between font-bold text-[#93631F] px-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <Printer className="h-4 w-4 text-amber-700" />
                  <span className="font-extrabold text-amber-950">Đang In Tại Xưởng ({printingItems.length} bài)</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Máy in đang hoạt động
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {printingItems.map((item) => {
                  const po = item.productionOrder;
                  const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                  const images = po?.proofingOrderImages || [];
                  const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                  const thumbnail = formatImageUrl(rawThumbnail);
                  const fullImage = formatImageUrl(images[0]?.imageUrl || rawThumbnail);
                  const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;
                  const materialName = item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || "—";
                  const paperSizeName = po?.proofingOrder?.paperSize?.name || (po?.proofingOrder as any)?.customPaperSize || "";

                  const returnReason = item.returnReason || po?.returnReason || (po as any)?.lastReturnReason;
                  const returnType = item.returnType || (po as any)?.returnType;
                  const returnTypeDisplayName = item.returnTypeDisplayName || (po as any)?.returnTypeDisplayName;
                  const isRedispatchedReturned = !!(returnReason || item.returnedAt || (po as any)?.returnedAt || returnType);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "bg-white p-3 px-4 rounded-xl border transition-all space-y-2 shadow-2xs hover:shadow-md",
                        isRedispatchedReturned
                          ? "border-rose-300 border-l-4 border-l-rose-500 bg-rose-50/20"
                          : "border-amber-300/90"
                      )}
                    >
                      {/* Top Row: Code + Design Type Badge + Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenProofingDetail(item)}
                          className="font-mono text-base font-black text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                          title="Bấm để xem chi tiết bài bình"
                        >
                          <span>{proofingCode}</span>
                          <Eye className="h-4 w-4 text-blue-500 opacity-80" />
                        </button>

                        {po?.designType?.name && (
                          <Badge variant="outline" className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", getDesignTypeBadgeStyle(po?.designType?.code))}>
                            {po.designType.name}
                          </Badge>
                        )}

                        {isRedispatchedReturned && (
                          <Badge
                            className="bg-sky-50 text-sky-800 border-sky-300 font-bold text-[9.5px] px-1.5 py-0 flex items-center gap-1 shadow-2xs"
                            title={returnReason ? `Lý do xử lý/trả về trước đó: ${returnReason}` : "Bài đã được Điều lệnh chỉnh sửa & điều lại"}
                          >
                            <RotateCcw className="h-2.5 w-2.5 text-sky-600 shrink-0" />
                            {returnTypeDisplayName || (returnType === "dispatch" ? "Điều lại từ trả về" : "Trả về in lại")}
                          </Badge>
                        )}

                        {(item.isPendingMaterials || item.expectedPaperDate || item.expectedMaterialAt) && (
                          <Badge
                            className="bg-amber-100 text-amber-950 border-amber-300 font-extrabold text-[9.5px] px-1.5 py-0.5 flex items-center gap-1 shadow-2xs"
                          >
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                            Chờ NL
                          </Badge>
                        )}
                      </div>

                      {/* Main Content Row: Image + Details on Left, Action Buttons on Right */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
                        {/* Left: Image & Material Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
                          {/* Thumbnail Image */}
                          <div
                            onClick={() => fullImage && setViewingImageUrl(fullImage)}
                            className={cn(
                              "h-12 w-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 transition-all",
                              fullImage && "cursor-pointer hover:opacity-85 hover:ring-2 hover:ring-amber-500/80 shadow-2xs"
                            )}
                            title={fullImage ? "Bấm để xem ảnh phóng to" : undefined}
                          >
                            {thumbnail ? (
                              <LazyImage src={thumbnail} fallbackSrc={fullImage} alt={proofingCode} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Material & Time Details */}
                          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-slate-900 leading-tight">
                            <span className="font-bold text-slate-900 text-sm">
                              {materialName}
                            </span>
                            {paperSizeName && (
                              <span className="text-slate-600 font-medium text-xs">
                                • Khổ: <strong className="text-slate-900 font-mono">{paperSizeName}</strong>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 bg-amber-100/90 text-amber-900 font-mono font-black text-xs px-2 py-0.5 rounded border border-amber-200">
                              {totalQty.toLocaleString("vi-VN")} tờ
                            </span>

                            {item.startedAt && (
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>Bắt đầu lúc: <strong className="text-slate-700">{formatDateTime(item.startedAt)}</strong></span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Action Buttons Row */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {/* 1. Lịch sử */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenHistory(item)}
                            className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-lg px-3 cursor-pointer shadow-2xs"
                            title="Xem lịch sử sản xuất"
                          >
                            <History className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Lịch sử
                          </Button>

                          {/* 2. Đang in Status */}
                          <Badge className="bg-amber-500 text-white font-extrabold text-xs px-3 py-1.5 shadow-2xs flex items-center gap-1.5 animate-pulse rounded-lg">
                            <Sparkles className="h-3.5 w-3.5 fill-current" /> Đang in...
                          </Badge>

                          {/* 3. Tạm dừng */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPauseDialog(item)}
                            disabled={pauseMutation.isPending}
                            className="h-8 text-xs font-bold text-amber-800 bg-amber-50/90 border-amber-300 hover:bg-amber-100 rounded-lg px-3 cursor-pointer shadow-2xs"
                            title="Tạm dừng lệnh in này và đưa xuống cuối hàng chờ"
                          >
                            <Pause className="h-3.5 w-3.5 mr-1 text-amber-600" /> Tạm dừng
                          </Button>

                          {/* 4. Hoàn thành */}
                          <Button
                            size="sm"
                            onClick={() => handleDirectComplete(item.id)}
                            disabled={completeMutation.isPending}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-lg shadow-2xs cursor-pointer transition-all"
                          >
                            {completeMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Hoàn thành
                          </Button>

                          {/* 5. Trả về */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReturnDialog(item)}
                            disabled={returnMutation.isPending}
                            className="h-8 text-xs font-semibold text-rose-700 bg-rose-50/80 border-rose-200 hover:bg-rose-100 rounded-lg px-3 cursor-pointer shadow-2xs"
                            title="Trả về bộ phận Bình bài để xử lý"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1 text-rose-600" /> Trả về
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: HÀNG CHỜ IN (Bài Chờ In) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 px-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between font-bold text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="font-extrabold text-sm text-slate-900">Bài Chờ In</span>
                <Badge className="bg-blue-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                  {queuedItems.length} bài
                </Badge>
              </div>
              <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                <GripVertical className="h-3.5 w-3.5 text-slate-400 inline" />
                <span>Kéo biểu tượng <strong>⠿</strong> để đổi thứ tự, hoặc bấm số <strong>#X</strong> / nút <strong>LT⇈</strong> lên đầu</span>
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <TableHead className="w-10 text-center py-2.5">
                    <Checkbox className="h-3.5 w-3.5 text-blue-600" />
                  </TableHead>
                  <TableHead className="w-14 text-center py-2.5">Thứ tự</TableHead>
                  <TableHead className="w-12 text-center py-2.5">Ảnh</TableHead>
                  <TableHead className="w-[160px] py-2.5">Mã bình bài</TableHead>
                  <TableHead className="w-[110px] py-2.5">Loại bài</TableHead>
                  <TableHead className="w-[200px] py-2.5">Chất liệu & Quy cách</TableHead>
                  <TableHead className="w-[110px] text-right py-2.5">Số lượng</TableHead>
                  <TableHead className="w-[150px] py-2.5">Thời gian</TableHead>
                  <TableHead className="w-[150px] py-2.5">Trạng thái</TableHead>
                  <TableHead className="w-[220px] text-center py-2.5 pr-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                        <div className="p-3 bg-slate-100/80 text-slate-400 rounded-2xl">
                          <Inbox className="h-7 w-7" />
                        </div>
                        <p className="font-bold text-slate-700 text-xs">Chưa có bài nào trong hàng chờ in.</p>
                        <p className="text-[11px] text-slate-400 font-normal">
                          Vui lòng chọn bài từ danh sách "Bài Chưa In" bên dưới để thêm vào hàng chờ.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  queuedItems.map((item, index) => {
                    const po = item.productionOrder;
                    const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                    const images = po?.proofingOrderImages || [];
                    const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                    const thumbnail = formatImageUrl(rawThumbnail);
                    const fullImage = formatImageUrl(images[0]?.imageUrl || rawThumbnail);
                    const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;

                    // Machine Queue Badge Status
                    const isPaused = item.isPaused === true;
                    let statusBadge = null;
                    if (isPaused) {
                      statusBadge = (
                        <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs">
                          <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse shrink-0" /> Tạm dừng
                        </Badge>
                      );
                    } else if (index === 0) {
                      if (!isMachinePrinting) {
                        statusBadge = (
                          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs">
                            <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" /> Sắp in (#1)
                          </Badge>
                        );
                      } else {
                        statusBadge = (
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs">
                            <Printer className="h-3.5 w-3.5 text-blue-600 animate-pulse shrink-0" /> Đang in (#1)
                          </Badge>
                        );
                      }
                    } else {
                      statusBadge = (
                        <Badge className="bg-slate-50 text-slate-600 border border-slate-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Chờ in (#{index + 1})
                        </Badge>
                      );
                    }

                    const isDragged = draggedItemId === item.id;
                    const isOver = dragOverItemId === item.id;

                    const returnReason = item.returnReason || po?.returnReason || (po as any)?.lastReturnReason;
                    const returnType = item.returnType || (po as any)?.returnType;
                    const returnTypeDisplayName = item.returnTypeDisplayName || (po as any)?.returnTypeDisplayName;
                    const isRedispatchedReturned = !!(returnReason || item.returnedAt || (po as any)?.returnedAt || returnType);

                    return (
                      <TableRow
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDrop={(e) => handleDrop(e, item.id)}
                        className={cn(
                          "transition-colors border-b border-slate-100 hover:bg-slate-50/70",
                          isDragged && "opacity-40 bg-slate-100",
                          isOver && "border-t-2 border-t-amber-500 bg-amber-50/60"
                        )}
                      >
                        {/* Checkbox */}
                        <TableCell className="text-center py-2 px-2">
                          <Checkbox className="h-3.5 w-3.5 text-blue-600" />
                        </TableCell>

                        {/* Order Position Badge (#1, #2) */}
                        <TableCell className="text-center py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickMove(item)}
                              className="font-mono font-bold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 px-2 py-0.5 rounded border border-slate-200 text-xs cursor-pointer"
                              title="Bấm để nhập trực tiếp vị trí mong muốn (#X)"
                            >
                              #{index + 1}
                            </button>
                            {index > 0 && (
                              <button
                                onClick={() => handleMoveToTop(item)}
                                disabled={reorderMutation.isPending}
                                className="p-0.5 text-amber-700 hover:bg-amber-100 rounded cursor-pointer disabled:opacity-30"
                                title="Đẩy ngay lên vị trí số 1 (Lên đầu)"
                              >
                                <ChevronsUp className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Thumbnail */}
                        <TableCell className="text-center py-2 px-1">
                          <div
                            onClick={() => fullImage && setViewingImageUrl(fullImage)}
                            className={cn(
                              "h-9 w-9 bg-slate-100 rounded border border-slate-200 mx-auto overflow-hidden transition-all",
                              fullImage && "cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-500/80 shadow-2xs"
                            )}
                            title={fullImage ? "Bấm để xem ảnh phóng to" : undefined}
                          >
                            {thumbnail ? (
                              <LazyImage src={thumbnail} fallbackSrc={fullImage} alt={proofingCode} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Mã Bình bài */}
                        <TableCell className="py-2 px-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenProofingDetail(item)}
                                className="font-mono text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                title="Xem chi tiết bình bài"
                              >
                                <span>{proofingCode}</span>
                              </button>
                              <button
                                onClick={() => handleOpenProofingDetail(item)}
                                className="text-blue-500 hover:text-blue-700 p-0.5 rounded"
                                title="Xem chi tiết bình bài"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-200 font-medium text-[10.5px] rounded-full px-2.5 py-0.5 w-fit inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                              <span>Dự kiến in: {item.scheduledPrintDate ? formatDateTime(item.scheduledPrintDate) : "00:00 - " + formatImpositionDate(item)}</span>
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Loại bài */}
                        <TableCell className="py-2 px-2">
                          <span className={getDesignTypeBadgeStyle(po?.designType?.name, po?.designType?.code)}>
                            {po?.designType?.name || "Hộp"}
                          </span>
                        </TableCell>

                        {/* Chất liệu & Quy cách */}
                        <TableCell className="py-2 px-2">
                          <div className="flex flex-col text-slate-900 leading-tight gap-0.5">
                            <span className="font-bold text-xs text-slate-900">
                              {item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || "Giấy"}
                              {item.basisWeight ? ` ${item.basisWeight}g` : ""}
                            </span>
                            <span className="text-[11px] text-slate-500">Khổ: <strong className="text-slate-700 font-mono font-medium">{item.paperSizeName || "100×100"}</strong></span>
                          </div>
                        </TableCell>

                        {/* Số lượng */}
                        <TableCell className="text-right py-2 px-2 font-mono font-bold text-slate-900 text-xs">
                          {totalQty.toLocaleString("vi-VN")} tờ
                        </TableCell>

                        {/* Thời gian */}
                        <TableCell className="py-2 px-2 font-mono text-[11.5px] text-slate-600">
                          {formatDateTime(item.dispatchedAt)}
                        </TableCell>

                        {/* Trạng thái */}
                        <TableCell className="py-2 px-2">
                          {statusBadge}
                        </TableCell>

                        {/* Thao tác */}
                        <TableCell className="text-center py-2 px-2 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleStart(item.id)}
                              disabled={startMutation.isPending}
                              className="h-8 text-xs font-bold bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Bắt đầu in"
                            >
                              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                              {isPaused ? "In tiếp" : "Bắt đầu"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenHistory(item)}
                              className="h-8 text-xs font-semibold text-slate-700 bg-white border-slate-300 hover:bg-slate-50 rounded-lg px-3 flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" /> Lịch sử
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-600 bg-white border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-center"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-md z-50">
                                <DropdownMenuItem
                                  onClick={() => handleDequeueSingle(item.id)}
                                  className="text-xs font-semibold cursor-pointer text-slate-700 hover:bg-slate-100"
                                >
                                  <MinusCircle className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Bỏ hàng chờ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenReturnDialog(item)}
                                  className="text-xs font-semibold cursor-pointer text-rose-700 hover:bg-rose-50"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-rose-600" /> Trả về Điều lệnh
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* SECTION 3: BÀI ĐÃ ĐIỀU LỆNH — CHƯA VÀO HÀNG CHỜ (Bài Chưa In) */}
          <div className="space-y-3">
            {/* Table Container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Card Header Toolbar */}
              <div className="p-3 px-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 font-bold text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-amber-600" />
                  <span className="font-extrabold text-sm text-slate-900">Bài Chưa In</span>
                  <Badge className="bg-slate-700 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                    {notQueuedItems.length} bài
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  {/* Radix Date Filter */}
                  <Select value={notQueuedDateFilter} onValueChange={setNotQueuedDateFilter}>
                    <SelectTrigger className="h-7 text-[11px] font-bold bg-[#FEFBF6] border border-amber-300 text-amber-900 rounded-lg px-2.5 shadow-2xs hover:bg-amber-100/60 w-auto min-w-[160px] cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span className="text-slate-800 font-bold">Ngày điều lệnh: </span>
                        <SelectValue placeholder="Tất cả ngày" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-md z-50">
                      <SelectItem value="all" className="text-xs font-semibold cursor-pointer">
                        Tất cả ngày ({notQueuedItems.length} bài)
                      </SelectItem>
                      {availableNotQueuedDates.map((dateStr) => (
                        <SelectItem key={dateStr} value={dateStr} className="text-xs cursor-pointer">
                          Ngày {dateStr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search Input */}
                  <div className="relative w-44 md:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Tìm mã bài, mã bình..."
                      value={notQueuedSearchQuery}
                      onChange={(e) => setNotQueuedSearchQuery(e.target.value)}
                      className="pl-8 pr-7 h-7 text-[11px] bg-white rounded-lg border-slate-200"
                    />
                    {notQueuedSearchQuery && (
                      <button
                        onClick={() => setNotQueuedSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Bulk Enqueue Button */}
                  {selectedNotQueuedIds.length > 0 && (
                    <Button
                      onClick={handleEnqueueSelected}
                      disabled={enqueueMutation.isPending}
                      className="h-7 text-xs font-bold bg-[#854d0e] hover:bg-[#713f12] text-white px-3 rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      {enqueueMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      )}
                      Thêm hàng chờ ({selectedNotQueuedIds.length})
                    </Button>
                  )}
                </div>
              </div>

              {filteredNotQueuedItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  {notQueuedSearchQuery || notQueuedDateFilter !== "all"
                    ? "Không tìm thấy bài in phù hợp với bộ lọc."
                    : "Tất cả các bài điều lệnh đã được đưa vào hàng chờ in."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <TableHead className="w-10 text-center py-2.5">
                        <Checkbox
                          checked={isAllNotQueuedSelected}
                          onCheckedChange={handleToggleSelectAllNotQueued}
                          className="h-3.5 w-3.5 text-[#854d0e]"
                        />
                      </TableHead>
                      <TableHead className="w-12 text-center py-2.5">#</TableHead>
                      <TableHead className="w-12 text-center py-2.5">Ảnh</TableHead>
                      <TableHead className="w-[160px] py-2.5">Mã bình bài</TableHead>
                      <TableHead className="w-[110px] py-2.5">Loại bài</TableHead>
                      <TableHead className="w-[200px] py-2.5">Chất liệu & Quy cách</TableHead>
                      <TableHead className="w-[110px] text-right py-2.5">Số lượng</TableHead>
                      <TableHead className="w-[150px] py-2.5">Thời gian</TableHead>
                      <TableHead className="w-[160px] py-2.5">Trạng thái</TableHead>
                      <TableHead className="w-[220px] text-center py-2.5 pr-4">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedNotQueuedByDate.map((group) => {
                      const isCollapsed = !!collapsedDateGroups[group.dateLabel];
                      return (
                        <React.Fragment key={group.dateLabel}>
                          {/* Collapsible Date Banner Row */}
                          <TableRow
                            onClick={() => toggleDateGroupCollapse(group.dateLabel)}
                            className="bg-[#fffbeb] hover:bg-amber-100/70 border-y border-amber-200/90 select-none cursor-pointer transition-colors"
                          >
                            <TableCell colSpan={10} className="py-2 px-4 font-extrabold text-xs text-amber-950">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="p-0.5 text-amber-800 hover:bg-amber-200/60 rounded"
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-amber-900" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-amber-900" />
                                  )}
                                </button>
                                <span>Ngày điều lệnh: <strong className="text-amber-950 font-bold">{group.dateLabel}</strong></span>
                                <Badge className="bg-[#854d0e] text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                                  {group.items.length} bài
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Date Group Items (hidden if collapsed) */}
                          {!isCollapsed &&
                            group.items.map((item, index) => {
                              const isSelected = selectedNotQueuedIds.includes(item.id);
                              const po = item.productionOrder;
                              const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                              const images = po?.proofingOrderImages || [];
                              const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                              const thumbnail = formatImageUrl(rawThumbnail);
                              const fullImage = formatImageUrl(images[0]?.imageUrl || rawThumbnail);
                              const totalQty = po?.proofingOrder?.totalQuantity || po?.items?.[0]?.inputQty || 0;

                              const returnReason = item.returnReason || po?.returnReason || (po as any)?.lastReturnReason;
                              const returnType = item.returnType || (po as any)?.returnType;
                              const isRedispatchedReturned = !!(returnReason || item.returnedAt || (po as any)?.returnedAt || returnType);

                              const isPendingMaterial = !!(item.isPendingMaterials || item.expectedPaperDate || item.expectedMaterialAt);
                              const materialDate = item.expectedPaperDate || item.expectedMaterialAt;

                              let unqueuedStatusBadge = null;
                              if (isPendingMaterial) {
                                unqueuedStatusBadge = (
                                  <div className="flex flex-col gap-0.5">
                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 w-fit">
                                      <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" /> Chờ nguyên liệu
                                    </Badge>
                                    {materialDate && (
                                      <span className="text-[10.5px] text-amber-800 font-medium pl-1">
                                        Dự kiến: {formatDateTime(materialDate)}
                                      </span>
                                    )}
                                  </div>
                                );
                              } else if (item.scheduledPrintDate) {
                                unqueuedStatusBadge = (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 w-fit">
                                    <Calendar className="h-3 w-3 text-blue-600 shrink-0" />
                                    <span>Lịch in: {formatDateTime(item.scheduledPrintDate)}</span>
                                  </Badge>
                                );
                              } else {
                                unqueuedStatusBadge = (
                                  <Badge className="bg-slate-50 text-slate-600 border border-slate-200 font-medium text-xs rounded-full px-3 py-1 inline-flex items-center gap-1.5 w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span> Chưa xếp lịch
                                  </Badge>
                                );
                              }

                              return (
                                <TableRow
                                  key={item.id}
                                  onClick={() => handleToggleSelectNotQueued(item.id)}
                                  className={cn(
                                    "cursor-pointer transition-colors border-b border-slate-100 hover:bg-slate-50/70",
                                    isSelected && "bg-amber-50/40 hover:bg-amber-50/60"
                                  )}
                                >
                                  {/* Checkbox */}
                                  <TableCell className="text-center py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleSelectNotQueued(item.id)}
                                      className="h-3.5 w-3.5 text-[#854d0e]"
                                    />
                                  </TableCell>

                                  {/* Index */}
                                  <TableCell className="text-center py-2 px-2 font-bold text-slate-700 text-xs">
                                    {index + 1}
                                  </TableCell>

                                  {/* Thumbnail */}
                                  <TableCell className="text-center py-2 px-1" onClick={(e) => e.stopPropagation()}>
                                    <div
                                      onClick={() => fullImage && setViewingImageUrl(fullImage)}
                                      className={cn(
                                        "h-9 w-9 bg-slate-100 rounded border border-slate-200 mx-auto overflow-hidden transition-all",
                                        fullImage && "cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-amber-500/80 shadow-2xs"
                                      )}
                                      title={fullImage ? "Bấm để xem ảnh phóng to" : undefined}
                                    >
                                      {thumbnail ? (
                                        <LazyImage src={thumbnail} fallbackSrc={fullImage} alt={proofingCode} className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                          <ImageIcon className="h-3.5 w-3.5" />
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Mã bình bài */}
                                  <TableCell className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenProofingDetail(item)}
                                          className="font-mono text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                          title="Xem chi tiết bình bài"
                                        >
                                          <span>{proofingCode}</span>
                                        </button>
                                        <button
                                          onClick={() => handleOpenProofingDetail(item)}
                                          className="text-blue-500 hover:text-blue-700 p-0.5 rounded"
                                          title="Xem chi tiết bình bài"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      {/* Sub-badge under code */}
                                      {isRedispatchedReturned && (
                                        <Badge className="bg-sky-50 text-sky-700 border border-sky-200 font-medium text-[10.5px] rounded-full px-2.5 py-0.5 w-fit inline-flex items-center gap-1">
                                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span> Điều lệnh đã chỉnh sửa
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Loại bài */}
                                  <TableCell className="py-2 px-2">
                                    <span className={getDesignTypeBadgeStyle(po?.designType?.name, po?.designType?.code)}>
                                      {po?.designType?.name || "Hộp"}
                                    </span>
                                  </TableCell>

                                  {/* Chất liệu & Quy cách */}
                                  <TableCell className="py-2 px-2">
                                    <div className="flex flex-col text-slate-900 leading-tight gap-0.5">
                                      <span className="font-bold text-xs text-slate-900">
                                        {item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || "Giấy"}
                                        {item.basisWeight ? ` ${item.basisWeight}g` : ""}
                                      </span>
                                      <span className="text-[11px] text-slate-500">Khổ: <strong className="text-slate-700 font-mono font-medium">{item.paperSizeName || "100×100"}</strong></span>
                                    </div>
                                  </TableCell>

                                  {/* Số lượng */}
                                  <TableCell className="text-right py-2 px-2 font-mono font-bold text-slate-900 text-xs">
                                    {totalQty.toLocaleString("vi-VN")} tờ
                                  </TableCell>

                                  {/* Thời gian */}
                                  <TableCell className="py-2 px-2 font-mono text-[11.5px] text-slate-600">
                                    {formatDateTime(item.dispatchedAt)}
                                  </TableCell>

                                  {/* Trạng thái */}
                                  <TableCell className="py-2 px-2">
                                    {unqueuedStatusBadge}
                                  </TableCell>

                                  {/* Thao tác */}
                                  <TableCell className="text-center py-2 px-2 pr-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() => handleEnqueueSingle(item.id)}
                                        disabled={enqueueMutation.isPending}
                                        className="h-8 text-xs font-bold bg-[#854d0e] hover:bg-[#713f12] text-white rounded-lg px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        title="Thêm vào hàng chờ in"
                                      >
                                        <PlusCircle className="h-3.5 w-3.5 shrink-0" /> Thêm hàng chờ
                                      </Button>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenProofingDetail(item)}
                                        className="h-8 text-xs font-semibold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 rounded-lg px-3 flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="h-3.5 w-3.5 text-sky-600 shrink-0" /> Chi tiết
                                      </Button>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-slate-600 bg-white border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-center"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-md z-50">
                                          <DropdownMenuItem
                                            onClick={() => handleOpenHistory(item)}
                                            className="text-xs font-semibold cursor-pointer text-slate-700 hover:bg-slate-100"
                                          >
                                            <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Lịch sử
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleOpenReturnDialog(item)}
                                            className="text-xs font-semibold cursor-pointer text-rose-700 hover:bg-rose-50"
                                          >
                                            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-rose-600" /> Trả về Điều lệnh
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: NHẬP TRỰC TIẾP VỊ TRÍ HÀNG CHỜ (#X) */}
      <Dialog open={!!quickMoveItem} onOpenChange={(open) => !open && setQuickMoveItem(null)}>
        <DialogContent className="max-w-xs bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2 text-sm">
              <Move className="h-4 w-4 text-[#93631F]" /> Chuyển vị trí thứ tự in
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Nhập số thứ tự vị trí mong muốn trong hàng chờ in (từ 1 đến {queuedItems.length}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Vị trí mới: #</span>
              <Input
                type="number"
                min={1}
                max={queuedItems.length}
                value={quickMovePositionInput}
                onChange={(e) => setQuickMovePositionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmQuickMove();
                }}
                className="w-24 h-8 font-mono font-bold text-sm text-center"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickMoveItem(null)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmQuickMove}
              disabled={reorderMutation.isPending}
              className="bg-[#93631F] hover:bg-[#7a521a] text-white font-bold text-xs cursor-pointer"
            >
              {reorderMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Xác nhận chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: TẠM DỪNG IN */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-purple-800 flex items-center gap-2">
              <Pause className="h-5 w-5" /> Tạm dừng lệnh in
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lệnh in này sẽ được tạm dừng và chuyển xuống cuối hàng chờ Chờ in. Thời gian KPI bắt đầu in được giữ nguyên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="pauseReason" className="text-xs font-bold text-slate-700 block">
              Lý do tạm dừng in <span className="text-purple-600">*</span>
            </label>
            <Textarea
              id="pauseReason"
              rows={4}
              maxLength={1000}
              placeholder="Nhập chi tiết lý do tạm dừng in (vd: hỏng kẽm giữa chừng, hết giấy phụ, máy cần bảo dưỡng...)"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              className="text-xs bg-white"
            />
            <div className="text-[10px] text-slate-400 text-right">
              {pauseReason.length}/1000 ký tự
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPauseDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPause}
              disabled={!pauseReason.trim() || pauseMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
            >
              {pauseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Xác nhận Tạm dừng In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: TRẢ VỀ ĐIỀU LỆNH (TỪ MÀN THỢ IN) */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-rose-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Trả về bộ phận Điều lệnh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lệnh in này sẽ được chuyển về bộ phận Điều lệnh để xử lý. Bài <strong>GIỮ NGUYÊN Lệnh sản xuất</strong> và lịch sử.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="returnReason" className="text-xs font-bold text-slate-700 block">
              Lý do trả về bộ phận Điều lệnh <span className="text-rose-500">*</span>
            </label>
            <Textarea
              id="returnReason"
              rows={4}
              maxLength={1000}
              placeholder="Nhập chi tiết lý do trả về cho Điều lệnh (ví dụ: giấy dơ không ăn mực, kẽm bị xước cần xuất lại...)"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="text-xs bg-white"
            />
            <div className="text-[10px] text-slate-400 text-right">
              {returnReason.length}/1000 ký tự
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReturn}
              disabled={!returnReason.trim() || returnMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
            >
              {returnMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Xác nhận Trả về Điều lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* READ-ONLY PROOFING DETAIL MODAL */}
      <ReadOnlyProofingDetailModal
        proofingOrderId={viewingProofingOrderId}
        open={!!viewingProofingOrderId}
        onOpenChange={(open) => !open && setViewingProofingOrderId(null)}
      />

      {/* Production History Timeline Modal */}
      <PrintOrderHistoryModal
        isOpen={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        printOrderId={historyPrintOrderId}
        proofingCode={historyProofingCode}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </div>
  );
}
