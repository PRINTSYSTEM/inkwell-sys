import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Scissors,
  Search,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Flame,
  ChevronDown,
  Pause,
  History,
  Clock,
  User,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDiesByProofingOrder } from "@/hooks/use-die";
import { formatDieSize } from "@/utils/format-die-size";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";

const getLaminationName = (item: ProductionOrderResponse) => {
  const directName =
    (item as any).laminationTypeName ||
    item.proofingOrder?.laminationTypeName ||
    (item as any).laminationType ||
    item.proofingOrder?.laminationType;

  if (directName && typeof directName === "string" && directName.trim().length > 0) {
    return directName;
  }

  const specsRaw = item.specification || item.proofingOrder?.specification;
  if (Array.isArray(specsRaw)) {
    const found = specsRaw.find((s) => typeof s === "string" && s.toLowerCase().includes("cán"));
    if (found) return found;
  } else if (typeof specsRaw === "string" && specsRaw.toLowerCase().includes("cán")) {
    const parts = specsRaw.split("•").map((p) => p.trim());
    const found = parts.find((p) => p.toLowerCase().includes("cán"));
    if (found) return found;
    return specsRaw;
  }

  return null;
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { formatImageUrl, cn } from "@/lib/utils";
import {
  usePostPrintProductionOrders,
  usePostPrintCounts,
  useUpdateProductionStep,
  useProductionStepHistory,
} from "@/hooks/use-production";
import { useDesignTypeList } from "@/hooks/use-design-type";
import type { ProductionOrderResponse, ProductionStepResponse } from "@/Schema/production.schema";
import { toast } from "sonner";

const getDesignTypeBadgeStyle = (code?: string) => {
  switch (code?.toUpperCase()) {
    case "H":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "N":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "D":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "T":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "HH:mm dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

// Post-Print Process Definitions with multi-keyword matching
const POST_PRINT_PROCESSES = [
  { key: "lamination", label: "CÁN MÀNG", keywords: ["lamination", "cán màng", "cán"] },
  { key: "mounting", label: "BỒI", keywords: ["mounting", "bồi"] },
  { key: "foiling", label: "ÉP KIM", keywords: ["foiling", "pressing", "ép kim", "ép"] },
  { key: "die_cut", label: "BẾ", keywords: ["die_cut", "diecut", "bế"] },
  { key: "cutting", label: "CẮT", keywords: ["cut", "cutting", "cắt"] },
  { key: "gluing", label: "DÁN", keywords: ["glue", "gluing", "dán"] },
];

const findStepForProcess = (steps: ProductionStepResponse[], processKey: string, keywords: string[]) => {
  return (
    steps.find((s) => {
      const typeStr = (s.stepType || "").toLowerCase();
      const nameStr = (s.stepTypeName || "").toLowerCase();

      // If looking for "cutting" (CẮT), reject any step that is die_cut/bế
      if (processKey === "cutting") {
        if (typeStr.includes("die") || typeStr.includes("bế") || nameStr.includes("bế")) {
          return false;
        }
      }

      // If looking for "die_cut" (BẾ), reject any step that is pure cutting without bế
      if (processKey === "die_cut") {
        if ((typeStr === "cut" || typeStr === "cutting" || nameStr === "cắt") && !typeStr.includes("die") && !nameStr.includes("bế")) {
          return false;
        }
      }

      return keywords.some((k) => {
        if (k === "cut") {
          return typeStr === "cut" || typeStr === "cutting" || nameStr === "cắt";
        }
        return typeStr.includes(k) || nameStr.includes(k);
      });
    }) || null
  );
};

const getStepButtonClass = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "done":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 font-bold";
    case "in_progress":
    case "running":
      return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 font-bold animate-pulse";
    case "blocked":
    case "paused":
      return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200 font-extrabold shadow-2xs";
    case "ready":
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 font-medium";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
  }
};

const getStepStatusLabel = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "done":
      return "Hoàn thành";
    case "in_progress":
    case "running":
      return "Đang làm";
    case "blocked":
    case "paused":
      return "Tạm dừng";
    case "ready":
    case "pending":
      return "Sẵn sàng";
    default:
      return "Chờ";
  }
};

// Modal xem nhật ký chuyển trạng thái của Step
function StepHistoryModal({
  stepId,
  stepName,
  isOpen,
  onOpenChange,
}: {
  stepId: number | null;
  stepName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: histories, isLoading } = useProductionStepHistory(stepId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <History className="h-5 w-5 text-[#93631F]" />
            Nhật ký công đoạn {stepName ? `(${stepName})` : ""}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Lịch sử chuyển trạng thái và ghi chú lý do tạm dừng công đoạn này.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 max-h-[60vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 text-[#93631F] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải nhật ký công đoạn...</p>
            </div>
          ) : !histories || histories.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Chưa có ghi nhận nhật ký chuyển trạng thái nào cho công đoạn này.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {histories.map((item) => {
                const h = item as any;
                return (
                  <div key={h.id} className="relative group space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                      <Clock className="h-3 w-3 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {h.eventTypeDisplayName || h.eventType ? (
                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-[#93631F]/10 text-[#93631F] border-[#93631F]/30">
                          {h.eventTypeDisplayName || getStepStatusLabel(h.eventType || h.toStatus || "")}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100">
                            {getStepStatusLabel(h.fromStatus || "")}
                          </Badge>
                          <span className="text-slate-400">→</span>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStepButtonClass(h.toStatus || ""))}>
                            {getStepStatusLabel(h.toStatus || "")}
                          </Badge>
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1 pt-0.5">
                      <User className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{h.userName || "Hệ thống"}</span>
                    </div>

                    {(h.reason || h.note) && (
                      <div className="mt-1 text-[11px] text-purple-900 bg-purple-50 border border-purple-200/80 rounded-lg p-2 font-mono">
                        <span className="font-bold font-sans text-purple-900">Ghi chú / Lý do: </span>
                        {h.reason || h.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== PRODUCTION DIE DETAIL MODAL =====
interface ProductionDieDetailModalProps {
  item: ProductionOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProductionDieDetailModal({
  item,
  open,
  onOpenChange,
}: ProductionDieDetailModalProps) {
  if (!item) return null;

  const proofingOrderId = item.proofingOrderId || item.proofingOrder?.id || null;
  const { data: diesByOrder, isLoading } = useDiesByProofingOrder(proofingOrderId, open);

  const dieFromOrder = item.proofingOrderDies?.[0] || (item as any).dieExport;
  const fetchedDie = diesByOrder?.[0];

  const proofingCode = item.proofingOrderCode || `PO-${item.id}`;
  const images = item.proofingOrderImages || [];
  const rawImage = fetchedDie?.imageUrl || images[0]?.imageUrl || images[0]?.thumbnailUrl;
  const imageUrl = formatImageUrl(typeof rawImage === "string" ? rawImage : null);

  const dieCode = fetchedDie?.code || dieFromOrder?.code || dieFromOrder?.dieCode || proofingCode;
  const dieSize = fetchedDie ? formatDieSize(fetchedDie) : (dieFromOrder?.size || item.paperSizeName || "—");

  const isNewDie = dieFromOrder?.isNewDie ?? (fetchedDie ? false : null);
  const dieTypeLabel = isNewDie === true ? "Tạo khuôn bế mới" : isNewDie === false ? "Sử dụng khuôn bế cũ" : "Sử dụng khuôn bế cũ";

  const isReceived = fetchedDie ? fetchedDie.isUsable !== false : dieFromOrder?.isReceived;
  const statusLabel = isReceived === true ? "Trong kho" : isReceived === false ? "Chờ nhận / Đang gia công" : "Trong kho";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-slate-200 p-5 rounded-2xl shadow-xl">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 bg-[#93631F]/10 text-[#93631F] rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
            Thông tin khuôn bế
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-7 w-7 text-[#93631F] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Đang tải thông tin khuôn...</p>
          </div>
        ) : (
          <div className="space-y-3 py-2 text-xs">
            {/* Large Die Image */}
            <div className="w-full h-52 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={dieCode}
                  className="max-h-full max-w-full object-contain p-1.5"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                  <ImageIcon className="h-10 w-10 stroke-1 opacity-50" />
                  <span className="text-[11px]">Chưa có hình ảnh khuôn</span>
                </div>
              )}
            </div>

            {/* Die Info Card */}
            <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  MÃ KHUÔN:
                </span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {dieCode}
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  KÍCH THƯỚC:
                </span>
                <span className="text-sm font-extrabold text-[#93631F] font-mono">
                  {dieSize}
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TÌNH TRẠNG:
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {statusLabel}
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  LOẠI KHUÔN:
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {dieTypeLabel}
                </span>
              </div>

              {(dieFromOrder?.notes || fetchedDie?.notes) && (
                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    GHI CHÚ:
                  </span>
                  <p className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200">
                    {dieFromOrder?.notes || fetchedDie?.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full font-bold text-xs cursor-pointer"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PostPrintProductionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Pause Dialog State
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseStepId, setPauseStepId] = useState<number | null>(null);
  const [pauseProcName, setPauseProcName] = useState<string>("");
  const [pauseNote, setPauseNote] = useState("");

  // History Dialog State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyStepId, setHistoryStepId] = useState<number | null>(null);
  const [historyStepName, setHistoryStepName] = useState<string>("");

  // Die Detail Modal State
  const [dieModalOpen, setDieModalOpen] = useState(false);
  const [selectedItemForDie, setSelectedItemForDie] = useState<ProductionOrderResponse | null>(null);

  // Proofing Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProofingOrderId, setSelectedProofingOrderId] = useState<number | null>(null);

  // Queries & Mutations
  const { data: counts } = usePostPrintCounts();
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  const {
    data: postPrintData,
    isLoading,
    refetch,
  } = usePostPrintProductionOrders({
    pageNumber: 1,
    pageSize: 200,
    designTypeId: selectedDesignTypeId,
    search: searchQuery.trim() || undefined,
  });

  const updateStepMutation = useUpdateProductionStep();
  const postPrintList = postPrintData?.items || [];

  const getPrintCompletedDateKey = (item: ProductionOrderResponse) => {
    const rawDate = item.printOrderCompletedAt || item.impositionCompletedAt || (item.proofingOrder as any)?.completedAt;
    if (!rawDate) return "Chưa xác định ngày";
    try {
      return format(new Date(rawDate), "dd/MM/yyyy", { locale: vi });
    } catch {
      return "Chưa xác định ngày";
    }
  };
  const groupedByDateSections = useMemo(() => {
    const dateMap = new Map<
      string,
      {
        dateKey: string;
        dateSortTime: number;
        items: ProductionOrderResponse[];
      }
    >();

    postPrintList.forEach((item) => {
      const dateKey = getPrintCompletedDateKey(item);
      const rawDate = item.printOrderCompletedAt || item.impositionCompletedAt || (item.proofingOrder as any)?.completedAt;
      const sortTime = rawDate ? new Date(rawDate).getTime() : 0;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          dateKey,
          dateSortTime: sortTime,
          items: [],
        });
      }

      const dateEntry = dateMap.get(dateKey)!;
      if (sortTime > dateEntry.dateSortTime) {
        dateEntry.dateSortTime = sortTime;
      }
      dateEntry.items.push(item);
    });

    // Sort dates descending (newest date first, "Chưa xác định ngày" last)
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => {
      if (a.dateKey === "Chưa xác định ngày") return 1;
      if (b.dateKey === "Chưa xác định ngày") return -1;
      return b.dateSortTime - a.dateSortTime;
    });

    // Within each date group, sort items by designType code so same type items are next to each other
    return sortedDates.map((dateSection) => {
      const sortedItems = [...dateSection.items].sort((a, b) => {
        const codeA = a.designType?.code || "Z";
        const codeB = b.designType?.code || "Z";
        return codeA.localeCompare(codeB);
      });

      return {
        ...dateSection,
        items: sortedItems,
      };
    });
  }, [postPrintList]);

  // Handle Step Status Update
  const handleUpdateStepStatus = async (stepId: number, status: string, note?: string) => {
    try {
      await updateStepMutation.mutate({ stepId, data: { status, note: note?.trim() || undefined } });
      refetch();
    } catch {
      // Error handled in hook
    }
  };

  // Open Pause Step Dialog
  const handleOpenPauseDialog = (stepId: number, procName: string) => {
    setPauseStepId(stepId);
    setPauseProcName(procName);
    setPauseNote("");
    setPauseDialogOpen(true);
  };

  const handleConfirmPauseStep = () => {
    if (!pauseStepId || !pauseNote.trim()) {
      toast.error("Ghi chú lý do tạm dừng là bắt buộc.");
      return;
    }
    handleUpdateStepStatus(pauseStepId, "blocked", pauseNote.trim());
    setPauseDialogOpen(false);
    setPauseStepId(null);
    setPauseNote("");
  };

  // Open History Step Dialog
  const handleOpenStepHistory = (stepId: number, procName: string) => {
    setHistoryStepId(stepId);
    setHistoryStepName(procName);
    setHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-[1680px] mx-auto pb-24 font-sans text-xs">
      {/* Unified Header & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Top Row: Title + Stats & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#93631F]/10 text-[#93631F] rounded-lg">
              <Scissors className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Sản Xuất Sau In</h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white font-bold text-xs px-2.5 py-1 shadow-2xs">
              Đang sản xuất: {counts?.active || 0} bài
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Làm mới
            </Button>
          </div>
        </div>

        {/* Bottom Row: Design Type Tabs + Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Design Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Button
              variant={selectedDesignTypeId === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDesignTypeId(undefined)}
              className={`h-8 text-xs font-semibold cursor-pointer ${selectedDesignTypeId === undefined
                  ? "bg-[#93631F] hover:bg-[#7a521a] text-white"
                  : "text-slate-600"
                }`}
            >
              Tất cả loại ({postPrintList.length})
            </Button>
            {designTypes.map((dt) => (
              <Button
                key={dt.id}
                variant={selectedDesignTypeId === dt.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDesignTypeId(dt.id)}
                className={`h-8 text-xs font-semibold cursor-pointer ${selectedDesignTypeId === dt.id
                    ? "bg-[#93631F] hover:bg-[#7a521a] text-white"
                    : "text-slate-600"
                  }`}
              >
                {dt.name} ({dt.code})
              </Button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Tìm mã bình bài, mã bài..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main List Render (Matrix Table View Format) */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-[#93631F] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài gia công sau in...</p>
        </div>
      ) : postPrintList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Không có bài nào đang gia công sau in</h3>
          <p className="text-xs text-slate-500">
            Tất cả các công đoạn sau in đã hoàn tất hoặc chưa có bài in hoàn thành mới.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDateSections.map((dateSection) => (
            <div key={dateSection.dateKey} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              {/* Date Header: Clean Date Label */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#93631F]/10 text-[#93631F] rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 font-mono">
                    {dateSection.dateKey}
                  </h2>
                </div>
                <Badge className="bg-slate-800 text-white font-bold text-[11px] px-2.5 py-0.5">
                  {dateSection.items.length} bài gia công
                </Badge>
              </div>

              {/* Single Matrix Table View per Date */}
              <div className="rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#fbf8f3] hover:bg-[#fbf8f3] border-b border-slate-200 uppercase text-[11px] font-bold text-slate-700">
                        <TableHead className="w-[140px]">MÃ BÌNH BÀI</TableHead>
                        <TableHead className="w-[110px] text-center">LOẠI BÀI</TableHead>
                        <TableHead className="w-[190px]">CHẤT LIỆU</TableHead>
                        <TableHead className="w-[170px]">MỐC THỜI GIAN</TableHead>
                        <TableHead className="w-[100px] text-center">LỆNH IN</TableHead>
                        {POST_PRINT_PROCESSES.map((proc) => (
                          <TableHead key={proc.key} className="w-[140px] text-center font-bold text-slate-800">
                            {proc.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateSection.items.map((item) => {
                        const proofingCode = item.proofingOrderCode || `PO-${item.id}`;
                        const images = item.proofingOrderImages || [];
                        const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                        const rawFullImage = images[0]?.imageUrl || images[0]?.thumbnailUrl;
                        const thumbnail = formatImageUrl(rawThumbnail);
                        const fullImage = formatImageUrl(rawFullImage);
                        const isUrgent = item.isUrgent;

                        // Material Info
                        const materialName = item.materialTypeName || (item.proofingOrder as any)?.materialType?.name || "—";
                        const basisWeight = item.basisWeight || item.proofingOrder?.basisWeight;
                        const paperSize = item.paperSizeName || item.proofingOrder?.paperSize?.name;
                        const totalQty = item.totalQuantity || item.proofingOrder?.totalQuantity || item.items?.[0]?.inputQty || 0;

                        // Timestamps
                        const impositionCompleted =
                          item.impositionCompletedAt ||
                          (item as any).impositionDate ||
                          (item as any).impositionCreatedAt ||
                          item.proofingOrder?.completedAt ||
                          (item.proofingOrder as any)?.impositionCompletedAt ||
                          (item as any).proofingOrderCompletedAt ||
                          (item as any).dispatchedAt ||
                          item.createdAt;

                        const printOrderCompleted = item.printOrderCompletedAt;
                        const steps: ProductionStepResponse[] = item.steps || [];
                        const hasAnyPausedStep = steps.some(
                          (s) => s.status?.toLowerCase() === "paused" || s.status?.toLowerCase() === "blocked"
                        );

                        return (
                          <TableRow
                            key={item.id}
                            className={cn(
                              "transition-colors border-b border-slate-100",
                              hasAnyPausedStep
                                ? "bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-500"
                                : "hover:bg-slate-50/80"
                            )}
                          >
                            {/* Column 1: MÃ BÌNH BÀI (Clickable code & image) */}
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shrink-0 cursor-pointer"
                                  onClick={() => fullImage && setViewingImageUrl(fullImage)}
                                  title="Xem ảnh phóng to"
                                >
                                  {thumbnail ? (
                                    <img
                                      src={thumbnail}
                                      alt={proofingCode}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                                      <ImageIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const pId = item.proofingOrderId || item.proofingOrder?.id || item.id;
                                        setSelectedProofingOrderId(pId);
                                        setDetailModalOpen(true);
                                      }}
                                      className="font-mono text-xs font-bold text-slate-900 hover:text-[#93631F] hover:underline cursor-pointer text-left"
                                      title="Click để xem thông tin bình bài"
                                    >
                                      {proofingCode}
                                    </button>
                                    {isUrgent && (
                                      <Badge className="bg-red-500 text-white font-bold text-[8px] px-1 py-0 animate-pulse">
                                        <Flame className="h-2 w-2 mr-0.5" /> GẤP
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            {/* Column 2: LOẠI BÀI (Dedicated Column) */}
                            <TableCell className="text-center py-2.5">
                              <Badge variant="outline" className={`text-[9.5px] font-bold ${getDesignTypeBadgeStyle(item.designType?.code)}`}>
                                {item.designType?.name || "Khác"}
                              </Badge>
                            </TableCell>

                            {/* Column 3: CHẤT LIỆU */}
                            <TableCell className="py-2.5">
                              <div className="flex flex-col text-[11px] text-slate-700 leading-tight space-y-0.5">
                                <div className="font-semibold text-slate-900 truncate">
                                  {materialName}
                                  {basisWeight ? ` ${basisWeight}g` : ""}
                                  {paperSize ? ` (${paperSize})` : ""}
                                </div>
                                <div className="font-mono font-bold text-[10.5px] text-[#93631F]">
                                  Số lượng: {totalQty.toLocaleString("vi-VN")} tờ
                                </div>
                              </div>
                            </TableCell>

                            {/* Column 4: MỐC THỜI GIAN */}
                            <TableCell className="py-2.5">
                              <div className="flex flex-col text-[10px] font-mono space-y-0.5">
                                <div className="text-slate-600 flex items-center gap-1">
                                  <span className="font-sans text-slate-400 font-medium">Bình bài:</span>
                                  <span className="font-semibold">{formatDateTime(impositionCompleted)}</span>
                                </div>
                                <div className="text-emerald-700 flex items-center gap-1 font-semibold">
                                  <span className="font-sans text-slate-400 font-medium">In xong:</span>
                                  <span>{formatDateTime(printOrderCompleted)}</span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Column 5: LỆNH IN */}
                            <TableCell className="text-center py-2.5">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] px-2 py-1">
                                Hoàn thành
                              </Badge>
                            </TableCell>

                            {/* Dynamic Post-Print Process Columns */}
                            {POST_PRINT_PROCESSES.map((proc) => {
                              const step = findStepForProcess(steps, proc.key, proc.keywords);

                              if (!step) {
                                return (
                                  <TableCell key={proc.key} className="text-center text-slate-[#ccc] font-mono text-xs py-2.5">
                                    —
                                  </TableCell>
                                );
                              }

                              const isCanPause = step.status === "in_progress" || step.status === "running";
                              const laminationText = getLaminationName(item);

                              return (
                                <TableCell key={proc.key} className="text-center py-2">
                                  <div className="flex flex-col items-center gap-1 justify-center">
                                    {/* Status Dropdown + History row */}
                                    <div className="flex items-center justify-center gap-1 w-full">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={updateStepMutation.isPending}
                                            className={`h-7 px-2 text-[11px] font-bold border rounded-lg shadow-2xs flex items-center justify-between w-full cursor-pointer ${getStepButtonClass(
                                              step.status
                                            )}`}
                                          >
                                            <span className="truncate flex items-center gap-1">
                                              {(step.status === "paused" || step.status === "blocked") && (
                                                <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse shrink-0" />
                                              )}
                                              {getStepStatusLabel(step.status)}
                                            </span>
                                            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="center" className="w-40 z-50 bg-white">
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStepStatus(step.id, "ready")}
                                            className="text-xs font-semibold text-blue-700 cursor-pointer"
                                          >
                                            Sẵn sàng
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStepStatus(step.id, "in_progress")}
                                            className="text-xs font-semibold text-amber-700 cursor-pointer"
                                          >
                                            Đang làm
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              if (!isCanPause) {
                                                toast.error("Chưa thể tạm dừng", {
                                                  description: "Chỉ có thể Tạm dừng khi công đoạn đang ở trạng thái 'Đang làm'. Vui lòng chọn 'Đang làm' trước.",
                                                });
                                                return;
                                              }
                                              handleOpenPauseDialog(step.id, proc.label);
                                            }}
                                            className={cn(
                                              "text-xs font-bold cursor-pointer flex items-center justify-between",
                                              isCanPause
                                                ? "text-red-700 hover:bg-red-50"
                                                : "text-slate-400 opacity-60"
                                            )}
                                            title={!isCanPause ? "Chỉ tạm dừng được khi công đoạn ở trạng thái 'Đang làm'" : undefined}
                                          >
                                            <div className="flex items-center">
                                              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" /> Tạm dừng
                                            </div>
                                            {!isCanPause && <span className="text-[9px] font-normal text-slate-400 ml-1">(Cần làm)</span>}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleUpdateStepStatus(step.id, "done")}
                                            className="text-xs font-semibold text-emerald-700 cursor-pointer"
                                          >
                                            Hoàn thành
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>

                                      {/* History Button for this step */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenStepHistory(step.id, proc.label)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer shrink-0"
                                        title="Xem nhật ký lịch sử chuyển trạng thái công đoạn"
                                      >
                                        <History className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {/* Lamination type text badge for CÁN MÀNG column (BELOW status button) */}
                                    {proc.key === "lamination" && laminationText && (
                                      <span
                                        className="text-[9.5px] font-bold text-[#93631F] bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded truncate max-w-[125px]"
                                        title={laminationText}
                                      >
                                        {laminationText}
                                      </span>
                                    )}

                                    {/* Die Viewer Button for BẾ column */}
                                    {proc.key === "die_cut" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedItemForDie(item);
                                          setDieModalOpen(true);
                                        }}
                                        className="h-5 px-1.5 text-[9.5px] font-bold text-[#93631F] border-[#93631F]/30 bg-[#93631F]/5 hover:bg-[#93631F]/15 rounded flex items-center gap-1 cursor-pointer shrink-0"
                                        title="Mở xem thông tin khuôn bế cho bài này"
                                      >
                                        <Layers className="h-3 w-3 text-[#93631F]" /> Xem khuôn
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG: TẠM DỪNG STEP (YÊU CẦU NHẬP LÝ DO) */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-purple-800 flex items-center gap-2 text-base font-bold">
              <Pause className="h-5 w-5 text-purple-600" /> Tạm dừng công đoạn {pauseProcName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chuyển công đoạn này sang trạng thái Tạm dừng. Ghi chú lý do là <strong>bắt buộc</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="pauseNote" className="text-xs font-bold text-slate-700 block">
              Ghi chú lý do tạm dừng <span className="text-purple-600">*</span>
            </label>
            <Textarea
              id="pauseNote"
              rows={4}
              maxLength={500}
              placeholder="Nhập lý do tạm dừng công đoạn (vd: Lỗi máy cán, chờ keo khô, chờ kỹ thuật xử lý...)"
              value={pauseNote}
              onChange={(e) => setPauseNote(e.target.value)}
              className="text-xs bg-white border-slate-200"
              autoFocus
            />
            <div className="text-[10px] text-slate-400 text-right">
              {pauseNote.length}/500 ký tự
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPauseDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPauseStep}
              disabled={!pauseNote.trim() || updateStepMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
            >
              {updateStepMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Xác nhận Tạm dừng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: NHẬT KÝ LỊCH SỬ CHUYỂN TRẠNG THÁI STEP */}
      <StepHistoryModal
        stepId={historyStepId}
        stepName={historyStepName}
        isOpen={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />

      {/* Die Detail Modal */}
      <ProductionDieDetailModal
        item={selectedItemForDie}
        open={dieModalOpen}
        onOpenChange={setDieModalOpen}
      />

      {/* Read-Only Proofing Detail Modal */}
      <ReadOnlyProofingDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        proofingOrderId={selectedProofingOrderId}
      />
    </div>
  );
}
