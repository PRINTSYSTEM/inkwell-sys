import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Filter,
  Eye,
  Check,
  X,
  Minus,
  Box,
  FileText,
  Calendar,
  Info,
  Package,
  RotateCcw,
  History,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import { PrintOrderHistoryModal } from "@/components/production/PrintOrderHistoryModal";
import { formatImageUrl, cn } from "@/lib/utils";
import { dieLocationLabels } from "@/lib/status-utils";
import {
  useDispatchCandidates,
  useDispatchCandidatesSummary,
  useDispatchPrintOrders,
  useConfirmPaperReady,
  useConfirmFluteReady,
  useReturnToProofing,
  usePrintOrders,
  useUndoDispatchPrintOrder,
} from "@/hooks/use-print-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useReceivePlate } from "@/hooks/use-plate-export";
import { useReceiveDie } from "@/hooks/use-die";
import { PrintOrderResponse } from "@/Schema/print-order.schema";
import { toast } from "sonner";

const getDesignTypePillStyle = (code?: string) => {
  switch (code?.toUpperCase()) {
    case "H":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "N":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "D":
      return "bg-purple-50 text-purple-600 border-purple-200";
    case "T":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "TC":
    case "DC":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
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

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "HH:mm dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

export default function ProductionDispatch() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | undefined>(undefined);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // State for Read-Only Proofing Detail Modal
  const [viewingProofingOrderId, setViewingProofingOrderId] = useState<number | null>(null);

  // Checked state for 4 Operator Verification Checkboxes (Kẽm, Khuôn, Giấy, Sóng)
  const [checkedKemMap, setCheckedKemMap] = useState<Record<number, boolean>>({});
  const [checkedKhuonMap, setCheckedKhuonMap] = useState<Record<number, boolean>>({});
  const [checkedGiayMap, setCheckedGiayMap] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dispatch_checked_giay_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [checkedFluteMap, setCheckedFluteMap] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dispatch_checked_flute_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist operator manual verifications (Giấy & Sóng) to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dispatch_checked_giay_map", JSON.stringify(checkedGiayMap));
    } catch (e) {
      console.error("Failed to save checkedGiayMap to localStorage", e);
    }
  }, [checkedGiayMap]);

  useEffect(() => {
    try {
      localStorage.setItem("dispatch_checked_flute_map", JSON.stringify(checkedFluteMap));
    } catch (e) {
      console.error("Failed to save checkedFluteMap to localStorage", e);
    }
  }, [checkedFluteMap]);

  // Loading state during API receive calls
  const [receivingMap, setReceivingMap] = useState<Record<number, boolean>>({});

  // Queries & Mutations
  const { data: designTypesData } = useDesignTypeList();
  const designTypes = designTypesData?.items || [];

  const { data: summaryData } = useDispatchCandidatesSummary({
    search: searchQuery.trim() || undefined,
  });

  const {
    data: candidatesData,
    isLoading,
    refetch,
  } = useDispatchCandidates({
    pageNumber: 1,
    pageSize: 100,
    search: searchQuery.trim() || undefined,
    designTypeId: selectedDesignTypeId,
  });

  const { data: unfilteredCandidatesData } = useDispatchCandidates({
    pageNumber: 1,
    pageSize: 300,
    search: searchQuery.trim() || undefined,
    designTypeId: undefined,
  });

  const dispatchMutation = useDispatchPrintOrders();
  const receivePlateMutation = useReceivePlate();
  const receiveDieMutation = useReceiveDie();
  const confirmPaperReadyMutation = useConfirmPaperReady();
  const confirmFluteReadyMutation = useConfirmFluteReady();
  const returnToProofingMutation = useReturnToProofing();

  // Return to Proofing Dialog State
  const [returnToProofingOpen, setReturnToProofingOpen] = useState(false);
  const [returnToProofingItem, setReturnToProofingItem] = useState<PrintOrderResponse | null>(null);
  const [returnToProofingReason, setReturnToProofingReason] = useState("");

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPrintOrderId, setHistoryPrintOrderId] = useState<number | null>(null);
  const [historyProofingCode, setHistoryProofingCode] = useState<string | undefined>(undefined);

  // Main Tab State: "candidates" (Bài chờ điều lệnh) vs "undo" (Hủy điều lệnh)
  const [mainTab, setMainTab] = useState<"candidates" | "undo">("candidates");

  // State & Query for Undo Dispatch Tab (Status = waiting)
  const [undoSearchQuery, setUndoSearchQuery] = useState("");
  const [undoPage, setUndoPage] = useState(1);

  const {
    data: waitingPrintOrdersData,
    isLoading: isLoadingWaiting,
    refetch: refetchWaiting,
  } = usePrintOrders({
    status: "waiting",
    pageNumber: undoPage,
    pageSize: 50,
    search: undoSearchQuery.trim() || undefined,
    designTypeId: selectedDesignTypeId,
  });

  const undoDispatchMutation = useUndoDispatchPrintOrder();
  const [undoTargetItem, setUndoTargetItem] = useState<PrintOrderResponse | null>(null);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);

  const handleOpenUndoDialog = (item: PrintOrderResponse) => {
    setUndoTargetItem(item);
    setUndoDialogOpen(true);
  };

  const handleConfirmUndoDispatch = () => {
    if (!undoTargetItem) return;
    undoDispatchMutation.mutate(undoTargetItem.id, {
      onSuccess: () => {
        setUndoDialogOpen(false);
        setUndoTargetItem(null);
        refetchWaiting();
        refetch();
      },
    });
  };

  const candidateItems = candidatesData?.items || [];

  const formatDispatchDateKey = (item: PrintOrderResponse) => {
    const rawDate = item.dispatchedAt || (item as any).createdAt;
    if (!rawDate) return "Chưa xác định ngày";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return "Chưa xác định ngày";
      return format(d, "dd/MM/yyyy", { locale: vi });
    } catch {
      return "Chưa xác định ngày";
    }
  };

  const groupedUndoSections = useMemo(() => {
    const waitingItems = waitingPrintOrdersData?.items || [];
    const dateMap = new Map<
      string,
      {
        dateKey: string;
        dateSortTime: number;
        items: PrintOrderResponse[];
      }
    >();

    waitingItems.forEach((item) => {
      const dateKey = formatDispatchDateKey(item);
      const rawDate = item.dispatchedAt || (item as any).createdAt;
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
    let result = Array.from(dateMap.values()).sort((a, b) => {
      if (a.dateKey === "Chưa xác định ngày") return 1;
      if (b.dateKey === "Chưa xác định ngày") return -1;
      return b.dateSortTime - a.dateSortTime;
    });

    if (selectedDateFilter) {
      try {
        const targetDateKey = format(new Date(selectedDateFilter), "dd/MM/yyyy");
        result = result.filter((s) => s.dateKey === targetDateKey);
      } catch {
        // ignore
      }
    }

    return result;
  }, [waitingPrintOrdersData?.items, selectedDateFilter]);

  const handleOpenReturnToProofing = (item: PrintOrderResponse) => {
    setReturnToProofingItem(item);
    setReturnToProofingReason("");
    setReturnToProofingOpen(true);
  };

  const handleConfirmReturnToProofing = () => {
    if (!returnToProofingItem) return;
    const isReturnedFromPrint = returnToProofingItem.status === "returned" || !!returnToProofingItem.returnedAt;
    if (!isReturnedFromPrint && !returnToProofingReason.trim()) return;

    returnToProofingMutation.mutate(
      {
        id: returnToProofingItem.id,
        data: { reason: returnToProofingReason.trim() },
      },
      {
        onSuccess: () => {
          setReturnToProofingOpen(false);
          setReturnToProofingItem(null);
          setReturnToProofingReason("");
          refetch();
        },
      }
    );
  };

  const handleOpenHistory = (item: PrintOrderResponse) => {
    const proofingCode = item.productionOrder?.proofingOrderCode || `PO-${item.productionOrderId}`;
    setHistoryPrintOrderId(item.id);
    setHistoryProofingCode(proofingCode);
    setHistoryModalOpen(true);
  };

  // Helper to evaluate readiness of each item (Kẽm, Khuôn, Giấy, Sóng)
  const getItemReadiness = (item: PrintOrderResponse) => {
    const po = item.productionOrder;
    const proofingOrder = po?.proofingOrder;
    const dies = proofingOrder?.proofingOrderDies || [];
    const plateExport = proofingOrder?.plateExport;

    // Check if operator ticked or backend already received
    const kemReceivedBE = plateExport ? plateExport.isReceived === true : true;
    const kemOk = checkedKemMap[item.id] !== undefined ? checkedKemMap[item.id] : kemReceivedBE;
    const kemLabel = plateExport?.plateCount ? `${plateExport.plateCount} kẽm` : `1/1 bộ`;

    // Khuôn condition: A die is ready if received (isReceived === true) or if it's an existing die in warehouse (isNewDie === false)
    const isDieReady = (d: any) => d.isReceived === true || d.isNewDie === false;
    const khuonRequired = dies.length > 0;
    const khuonReceivedBE = !khuonRequired ? null : (dies.length > 0 && dies.every(isDieReady));
    const khuonOk = !khuonRequired ? null : (checkedKhuonMap[item.id] !== undefined ? checkedKhuonMap[item.id] : (khuonReceivedBE ?? false));
    const khuonLabel = !khuonRequired ? "Không yêu cầu" : `${dies.filter(isDieReady).length}/${dies.length} cái`;

    // Giấy condition (operator confirm paper available - reads BE item.isPaperReady or local check)
    const totalQty = item.totalQuantity ?? proofingOrder?.totalQuantity ?? 1000;
    const giayOk = checkedGiayMap[item.id] !== undefined ? checkedGiayMap[item.id] : (item.isPaperReady === true);
    const giayLabel = `${totalQty.toLocaleString("vi-VN")} tờ`;

    // Sóng condition (reads BE item.isFluteReady or local check)
    const matName = item.materialTypeName || (proofingOrder as any)?.materialType?.name || (proofingOrder as any)?.customPaperSize || "";
    const isFluteMat = matName.toLowerCase().includes("sóng") || matName.toLowerCase().includes("song") || matName.toLowerCase().includes("flute");
    const requiresFlute = item.requiresFluteCheck || (po as any)?.requiresFluteCheck || (proofingOrder as any)?.requiresFluteCheck || isFluteMat || false;
    const fluteMaterialName = item.fluteMaterialName || (po as any)?.fluteMaterialName || (proofingOrder as any)?.fluteMaterialName || "Bìa Carton Sóng E";
    const fluteOk = !requiresFlute ? true : (checkedFluteMap[item.id] !== undefined ? checkedFluteMap[item.id] : (item.isFluteReady === true));

    // Nới điều kiện điều lệnh: CHỈ cần Kẽm + Giấy (Khuôn & Sóng E không còn chặn điều lệnh)
    const isEligible = kemOk && giayOk;

    let missingReason = "";
    if (!kemOk) missingReason = "missing_kem";
    else if (!giayOk) missingReason = "missing_giay";
    else if (khuonOk === false) missingReason = "missing_khuon";
    else if (requiresFlute && !fluteOk) missingReason = "missing_flute";

    return {
      kemOk,
      kemLabel,
      khuonRequired,
      khuonOk,
      khuonLabel,
      giayOk,
      giayLabel,
      requiresFlute,
      fluteMaterialName,
      fluteOk,
      isEligible,
      missingReason,
      plateExport,
      dies,
    };
  };

  // Toggle Kẽm Checkbox (Calls API PUT /api/proofing-orders/plates/{id}/receive if isReceived == false)
  const handleToggleKem = async (item: PrintOrderResponse) => {
    const plateExport = item.productionOrder?.proofingOrder?.plateExport;
    const currentChecked = getItemReadiness(item).kemOk;

    if (!currentChecked && plateExport && plateExport.isReceived === false) {
      setReceivingMap((prev) => ({ ...prev, [item.id]: true }));
      try {
        await receivePlateMutation.mutateAsync(plateExport.id);
        setCheckedKemMap((prev) => ({ ...prev, [item.id]: true }));
        refetch();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể xác nhận nhận kẽm");
      } finally {
        setReceivingMap((prev) => ({ ...prev, [item.id]: false }));
      }
    } else {
      setCheckedKemMap((prev) => ({ ...prev, [item.id]: !currentChecked }));
    }
  };

  // Toggle Khuôn Checkbox (Calls API PUT /api/proofing-orders/dies/{id}/receive for unreceived dies)
  const handleToggleKhuon = async (item: PrintOrderResponse) => {
    const dies = item.productionOrder?.proofingOrder?.proofingOrderDies || [];
    if (dies.length === 0) return;

    const currentChecked = getItemReadiness(item).khuonOk;
    // Call receive API for all unreceived dies (isReceived === false)
    const unreceivedDies = dies.filter((d) => d.isReceived === false);

    if (!currentChecked && unreceivedDies.length > 0) {
      setReceivingMap((prev) => ({ ...prev, [item.id]: true }));
      try {
        for (const die of unreceivedDies) {
          await receiveDieMutation.mutateAsync(die.id);
        }
        setCheckedKhuonMap((prev) => ({ ...prev, [item.id]: true }));
        refetch();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Không thể xác nhận nhận khuôn");
      } finally {
        setReceivingMap((prev) => ({ ...prev, [item.id]: false }));
      }
    } else {
      setCheckedKhuonMap((prev) => ({ ...prev, [item.id]: !currentChecked }));
    }
  };

  // Toggle Giấy Checkbox (Calls BE API PUT /api/print-orders/dispatch-candidates/{id}/confirm-paper)
  const handleToggleGiay = async (item: PrintOrderResponse) => {
    const currentChecked = getItemReadiness(item).giayOk;
    const newChecked = !currentChecked;
    setCheckedGiayMap((prev) => ({ ...prev, [item.id]: newChecked }));

    try {
      await confirmPaperReadyMutation.mutateAsync({
        id: item.id,
        isPaperReady: newChecked,
      });
      refetch();
    } catch {
      // Revert on error
      setCheckedGiayMap((prev) => ({ ...prev, [item.id]: currentChecked }));
    }
  };

  // Toggle Sóng Checkbox (Calls BE API PUT /api/print-orders/dispatch-candidates/{id}/confirm-flute)
  const handleToggleFlute = async (item: PrintOrderResponse) => {
    const currentChecked = getItemReadiness(item).fluteOk;
    const newChecked = !currentChecked;
    setCheckedFluteMap((prev) => ({ ...prev, [item.id]: newChecked }));

    try {
      await confirmFluteReadyMutation.mutateAsync({
        id: item.id,
        isFluteReady: newChecked,
      });
      refetch();
    } catch {
      // Revert on error
      setCheckedFluteMap((prev) => ({ ...prev, [item.id]: currentChecked }));
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let eligible = 0;
    let missingKem = 0;
    let missingKhuon = 0;
    let missingGiay = 0;
    let missingFlute = 0;

    candidateItems.forEach((item) => {
      const readiness = getItemReadiness(item);
      if (readiness.isEligible) eligible++;
      else if (!readiness.kemOk) missingKem++;
      else if (readiness.khuonOk === false) missingKhuon++;
      else if (!readiness.giayOk) missingGiay++;
      else if (readiness.requiresFlute && !readiness.fluteOk) missingFlute++;
    });

    const total = candidateItems.length;
    return {
      total,
      eligible,
      eligiblePct: total > 0 ? ((eligible / total) * 100).toFixed(1) : "0",
      missingKem,
      missingKemPct: total > 0 ? ((missingKem / total) * 100).toFixed(1) : "0",
      missingKhuon,
      missingKhuonPct: total > 0 ? ((missingKhuon / total) * 100).toFixed(1) : "0",
      missingGiay,
      missingGiayPct: total > 0 ? ((missingGiay / total) * 100).toFixed(1) : "0",
      missingFlute,
      missingFlutePct: total > 0 ? ((missingFlute / total) * 100).toFixed(1) : "0",
    };
  }, [candidateItems, checkedKemMap, checkedKhuonMap, checkedGiayMap, checkedFluteMap]);

  // Filtered Candidate Items based on BOTH selectedDesignTypeId and selectedStatusFilter
  const filteredItems = useMemo(() => {
    return candidateItems.filter((item) => {
      // 1. Filter by Design Type
      if (selectedDesignTypeId !== undefined) {
        const itemDesignTypeId = item.designTypeId || item.productionOrder?.designType?.id;
        if (itemDesignTypeId !== selectedDesignTypeId) return false;
      }

      // 2. Filter by Status
      if (selectedStatusFilter === "all") return true;
      const readiness = getItemReadiness(item);
      if (selectedStatusFilter === "eligible") return readiness.isEligible;
      if (selectedStatusFilter === "missing_kem") return !readiness.kemOk;
      if (selectedStatusFilter === "missing_khuon") return readiness.khuonOk === false;
      if (selectedStatusFilter === "missing_giay") return !readiness.giayOk;
      if (selectedStatusFilter === "missing_flute") return readiness.requiresFlute && !readiness.fluteOk;
      return true;
    });
  }, [candidateItems, selectedDesignTypeId, selectedStatusFilter, checkedKemMap, checkedKhuonMap, checkedGiayMap, checkedFluteMap]);

  // Group filtered items strictly by Imposition Date (formatted dd/MM/yyyy)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, PrintOrderResponse[]> = {};

    filteredItems.forEach((item) => {
      const dateLabel = formatImpositionDate(item);
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

    let result = sortedDateKeys.map((dateKey) => ({
      dateLabel: dateKey,
      items: groups[dateKey],
    }));

    if (selectedDateFilter) {
      try {
        const targetDateKey = format(new Date(selectedDateFilter), "dd/MM/yyyy");
        result = result.filter((g) => g.dateLabel === targetDateKey);
      } catch {
        // ignore
      }
    }

    return result;
  }, [filteredItems, checkedKemMap, checkedKhuonMap, checkedGiayMap, checkedFluteMap, selectedDateFilter]);

  const eligibleItemIds = useMemo(() => {
    return filteredItems
      .filter((item) => getItemReadiness(item).isEligible)
      .map((item) => item.id);
  }, [filteredItems, checkedKemMap, checkedKhuonMap, checkedGiayMap, checkedFluteMap]);

  const isAllEligibleSelected =
    eligibleItemIds.length > 0 &&
    eligibleItemIds.every((id) => selectedIds.includes(id));

  const handleToggleSelectAllEligible = () => {
    if (isAllEligibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !eligibleItemIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...eligibleItemIds])));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpenDetailModal = (item: PrintOrderResponse) => {
    const proofingId =
      item.productionOrder?.proofingOrderId ||
      item.productionOrder?.proofingOrder?.id ||
      item.productionOrderId;
    if (proofingId) {
      setViewingProofingOrderId(proofingId);
    }
  };

  const isAnySelectedUneligible = useMemo(() => {
    return selectedIds.some((id) => {
      const item = candidateItems.find((ci) => ci.id === id);
      return item ? !getItemReadiness(item).isEligible : false;
    });
  }, [selectedIds, candidateItems, checkedKemMap, checkedKhuonMap, checkedGiayMap, checkedFluteMap]);

  const handleDispatchSelected = () => {
    if (selectedIds.length === 0) return;

    if (isAnySelectedUneligible) {
      toast.warning("Vui lòng tick xác nhận đủ Kẽm và Giấy cho tất cả bài đã chọn trước khi điều lệnh!");
      return;
    }

    dispatchMutation.mutate(
      { printOrderIds: selectedIds },
      {
        onSuccess: () => {
          setCheckedGiayMap((prev) => {
            const next = { ...prev };
            selectedIds.forEach((id) => delete next[id]);
            return next;
          });
          setCheckedFluteMap((prev) => {
            const next = { ...prev };
            selectedIds.forEach((id) => delete next[id]);
            return next;
          });
          setSelectedIds([]);
          refetch();
          refetchWaiting();
        },
      }
    );
  };

  // Active counts from summary API (with fallback to candidateItems stats)
  const totalCount = summaryData?.total ?? stats.total;
  const eligibleCount = summaryData?.eligible ?? stats.eligible;
  const missingKemCount = summaryData?.missingKem ?? stats.missingKem;
  const missingKhuonCount = summaryData?.missingKhuon ?? stats.missingKhuon;
  const missingGiayCount = summaryData?.missingGiay ?? stats.missingGiay;
  const missingFluteCount = summaryData?.missingFlute ?? stats.missingFlute;

  const eligiblePct = totalCount > 0 ? ((eligibleCount / totalCount) * 100).toFixed(1) : "0";
  const missingKemPct = totalCount > 0 ? ((missingKemCount / totalCount) * 100).toFixed(1) : "0";
  const missingKhuonPct = totalCount > 0 ? ((missingKhuonCount / totalCount) * 100).toFixed(1) : "0";
  const missingGiayPct = totalCount > 0 ? ((missingGiayCount / totalCount) * 100).toFixed(1) : "0";
  const missingFlutePct = totalCount > 0 ? ((missingFluteCount / totalCount) * 100).toFixed(1) : "0";

  const waitingCount = waitingPrintOrdersData?.totalCount ?? waitingPrintOrdersData?.items?.length ?? 0;

  return (
    <div className="space-y-3 p-4 max-w-[1700px] mx-auto pb-16 font-sans bg-slate-50/50 min-h-screen text-xs">
      {/* Compact Page Header Bar with Main Tab Switcher */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 px-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900">Điều Lệnh Sản Xuất</h1>

          {/* Navigation Tabs: Bài chờ điều lệnh vs Hủy điều lệnh */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMainTab("candidates")}
              className={cn(
                "h-7 text-xs font-bold px-3 rounded-md transition-all",
                mainTab === "candidates"
                  ? "bg-white text-[#93631F] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Bài chờ điều lệnh ({totalCount})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMainTab("undo")}
              className={cn(
                "h-7 text-xs font-bold px-3 rounded-md transition-all flex items-center gap-1.5",
                mainTab === "undo"
                  ? "bg-[#93631F] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Điều lệnh Hoàn thành ({waitingCount})
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              refetchWaiting();
            }}
            className="h-8 text-[11px] font-semibold rounded-lg border-slate-200 px-2.5"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Làm mới
          </Button>

          {mainTab === "candidates" && (
            <Button
              onClick={handleDispatchSelected}
              disabled={selectedIds.length === 0 || isAnySelectedUneligible || dispatchMutation.isPending}
              title={
                isAnySelectedUneligible
                  ? "Tất cả các bài đã chọn phải thỏa mãn đủ Kẽm và Giấy mới có thể điều lệnh!"
                  : "Bấm để điều lệnh sản xuất"
              }
              className={cn(
                "h-8 text-white font-bold px-4 rounded-lg shadow-2xs transition-all text-xs",
                selectedIds.length > 0 && !isAnySelectedUneligible
                  ? "bg-[#93631F] hover:bg-[#7a521a] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200 shadow-none"
              )}
            >
              {dispatchMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5" />
              )}
              Điều lệnh ({selectedIds.length} bài)
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area: Grouped strictly by Imposition Date & Design Type */}
      {mainTab === "candidates" && (
        <div className="space-y-3">
          {/* Top 6 Compact Mini Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Tổng bài chờ</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {totalCount} <span className="text-[10px] font-normal text-slate-400">bài</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Đủ điều kiện</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {eligibleCount} <span className="text-[10px] font-normal text-slate-400">({eligiblePct}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Thiếu kẽm</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {missingKemCount} <span className="text-[10px] font-normal text-slate-400">({missingKemPct}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5" title="Thông tin tham khảo: Chưa chuẩn bị xong (dùng cho các khâu sau khi in, không chặn điều lệnh)">
              <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Box className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Thiếu khuôn (khâu sau)</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {missingKhuonCount} <span className="text-[10px] font-normal text-slate-400">({missingKhuonPct}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Thiếu giấy</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {missingGiayCount} <span className="text-[10px] font-normal text-slate-400">({missingGiayPct}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5" title="Thông tin tham khảo: Chưa chuẩn bị xong (dùng cho các khâu sau khi in, không chặn điều lệnh)">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">Thiếu sóng (khâu sau)</div>
                <div className="text-sm font-black text-slate-900 leading-none mt-0.5">
                  {missingFluteCount} <span className="text-[10px] font-normal text-slate-400">({missingFlutePct}%)</span>
                </div>
              </div>
            </div>
          </div>

      {/* Redesigned Clean 2-Row Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Row 1: Design Types (Left) + Date Picker & Search Bar (Right) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          {/* Left: Design Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1">
              Loại bài:
            </span>
            <Button
              variant={selectedDesignTypeId === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDesignTypeId(undefined)}
              className={cn(
                "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer shrink-0",
                selectedDesignTypeId === undefined
                  ? "bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              Tất cả ({totalCount})
            </Button>
            {summaryData?.byDesignType && summaryData.byDesignType.length > 0 ? (
              summaryData.byDesignType.map((dt) => (
                <Button
                  key={dt.designTypeId}
                  variant={selectedDesignTypeId === dt.designTypeId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDesignTypeId(dt.designTypeId)}
                  className={cn(
                    "h-7 text-[11px] font-semibold rounded-lg px-2.5 py-0 cursor-pointer shrink-0",
                    selectedDesignTypeId === dt.designTypeId
                      ? "bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs"
                      : "text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {dt.name} ({dt.count})
                </Button>
              ))
            ) : (
              designTypes.map((dt) => {
                const count = (unfilteredCandidatesData?.items || candidateItems).filter(
                  (item) => (item.designTypeId || item.productionOrder?.designType?.id) === dt.id
                ).length;
                return (
                  <Button
                    key={dt.id}
                    variant={selectedDesignTypeId === dt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDesignTypeId(dt.id)}
                    className={cn(
                      "h-7 text-[11px] font-semibold rounded-lg px-2.5 py-0 cursor-pointer shrink-0",
                      selectedDesignTypeId === dt.id
                        ? "bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs"
                        : "text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {dt.name} ({count})
                  </Button>
                );
              })
            )}
          </div>

          {/* Right: Date Picker & Search Box */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-36 h-7 bg-white rounded-lg border border-slate-200 flex items-center px-1.5 shadow-2xs">
              <DatePicker
                value={selectedDateFilter}
                onChange={(val) => setSelectedDateFilter(val)}
                allowClear
                placeholder="Lọc ngày..."
                className="w-full h-6 text-[11px]"
              />
            </div>

            <div className="relative w-56 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm mã bài, tên bài, chất liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-[11px] rounded-lg border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Status Filters (Trạng thái) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1">
            Trạng thái:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("all")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer shrink-0",
              selectedStatusFilter === "all"
                ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            Tất cả ({totalCount})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("eligible")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer transition-all shrink-0 flex items-center gap-1",
              selectedStatusFilter === "eligible"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            )}
          >
            <span>Đủ điều kiện</span>
            <span className="px-1.5 py-0.1 rounded-full text-[10px] bg-black/10 font-mono">
              {eligibleCount}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("missing_kem")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer transition-all shrink-0 flex items-center gap-1",
              selectedStatusFilter === "missing_kem"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                : "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100"
            )}
          >
            <span>Thiếu kẽm</span>
            <span className="px-1.5 py-0.1 rounded-full text-[10px] bg-black/10 font-mono">
              {missingKemCount}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("missing_khuon")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer transition-all shrink-0 flex items-center gap-1",
              selectedStatusFilter === "missing_khuon"
                ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                : "bg-orange-50/70 text-orange-800 border-orange-200 hover:bg-orange-100"
            )}
          >
            <span>Thiếu khuôn</span>
            <span className="px-1.5 py-0.1 rounded-full text-[10px] bg-black/10 font-mono">
              {missingKhuonCount}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("missing_giay")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer transition-all shrink-0 flex items-center gap-1",
              selectedStatusFilter === "missing_giay"
                ? "bg-red-600 text-white border-red-600 shadow-2xs"
                : "bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100"
            )}
          >
            <span>Thiếu giấy</span>
            <span className="px-1.5 py-0.1 rounded-full text-[10px] bg-black/10 font-mono">
              {missingGiayCount}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatusFilter("missing_flute")}
            className={cn(
              "h-7 text-[11px] font-bold rounded-lg px-2.5 py-0 cursor-pointer transition-all shrink-0 flex items-center gap-1",
              selectedStatusFilter === "missing_flute"
                ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                : "bg-purple-50/70 text-purple-800 border-purple-200 hover:bg-purple-100"
            )}
          >
            <span>Thiếu sóng</span>
            <span className="px-1.5 py-0.1 rounded-full text-[10px] bg-black/10 font-mono">
              {missingFluteCount}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Action Bar for All Eligible */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-2 px-3 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="select-all-eligible"
            checked={isAllEligibleSelected}
            onCheckedChange={handleToggleSelectAllEligible}
            className="h-3.5 w-3.5 text-[#93631F]"
          />
          <label htmlFor="select-all-eligible" className="cursor-pointer font-bold text-slate-800 flex items-center gap-1 text-xs">
            <span>Chọn tất cả bài đủ điều kiện</span>
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 font-extrabold text-[10px] px-1.5 py-0 ml-1">
              {eligibleItemIds.length}
            </Badge>
          </label>
        </div>
      </div>

      {/* Main Content Area: Grouped strictly by Imposition Date & Design Type */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
          <Loader2 className="h-6 w-6 text-[#93631F] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài chờ điều lệnh...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-500">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h3 className="font-bold text-slate-800 text-xs mb-1">Không có bài nào phù hợp với bộ lọc</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByDate.map((group) => (
            <div key={group.dateLabel} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* Date Group Header */}
              <div className="p-2 px-3.5 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between font-bold text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#93631F]" />
                  <span>Ngày bình bài: <strong>{group.dateLabel}</strong></span>
                  <Badge className="bg-[#93631F] text-white font-extrabold text-[10px] px-2 py-0">
                    {group.items.length} bài
                  </Badge>
                </div>
              </div>

              {/* Table for this Date Group */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase">
                      <TableHead className="w-10 text-center py-2 px-1">#</TableHead>
                      <TableHead className="w-[100px] py-2 px-2">Mã bài</TableHead>
                      <TableHead className="w-10 text-center py-2 px-1">Ảnh</TableHead>
                      <TableHead className="w-[85px] py-2 px-2">Loại bài</TableHead>
                      <TableHead className="w-[210px] py-2 px-2">Chất liệu & Quy cách</TableHead>
                      <TableHead className="min-w-[340px] py-2 px-2">Điều kiện sản xuất</TableHead>
                      <TableHead className="w-[120px] py-2 px-2">Trạng thái</TableHead>
                      <TableHead className="w-[130px] py-2 px-2">Thời gian bình</TableHead>
                      <TableHead className="w-[210px] min-w-[210px] py-2 px-2">Ghi chú</TableHead>
                      <TableHead className="w-[210px] min-w-[210px] text-center py-2 px-2">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item, index) => {
                      const isSelected = selectedIds.includes(item.id);
                      const po = item.productionOrder;
                      const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                      const images = po?.proofingOrderImages || [];
                      const rawThumbnail = images[0]?.thumbnailUrl || images[0]?.imageUrl;
                      const rawFullImage = images[0]?.imageUrl || images[0]?.thumbnailUrl;
                      const thumbnail = formatImageUrl(rawThumbnail);
                      const fullImage = formatImageUrl(rawFullImage);

                      // Summary Fields
                      const designTypeCode = item.designTypeCode || po?.designType?.code || "H";
                      const designTypeName = item.designTypeName || po?.designType?.name || "Hộp";
                      const materialName = item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || (po?.proofingOrder as any)?.customPaperSize || "—";
                      const paperSizeName = item.paperSizeName || po?.proofingOrder?.paperSize?.name || "Chưa chọn";
                      const totalQty = item.totalQuantity ?? po?.proofingOrder?.totalQuantity ?? 0;
                      const itemCount = item.itemCount ?? po?.proofingOrder?.proofingOrderDesigns?.length ?? 1;
                      const basisWeight = item.basisWeight ?? po?.proofingOrder?.basisWeight;

                      const readiness = getItemReadiness(item);
                      const isReceiving = receivingMap[item.id];
                      const isReturned = item.status === "returned" || !!item.returnedAt || !!item.returnReason;
                      const generalNotes = (po?.proofingOrder as any)?.notes || (po as any)?.notes || (item as any)?.notes;

                      return (
                        <TableRow
                          key={item.id}
                          onClick={() => handleToggleSelect(item.id)}
                          className={cn(
                            "cursor-pointer transition-colors border-b border-slate-100",
                            isReturned
                              ? isSelected
                                ? "bg-rose-100/90 hover:bg-rose-100 border-l-4 border-l-rose-600"
                                : "bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-l-rose-500"
                              : isSelected
                                ? "bg-amber-50/40 hover:bg-amber-50/70"
                                : "hover:bg-slate-50/70"
                          )}
                        >
                          {/* # and Checkbox */}
                          <TableCell className="text-center py-1.5 px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[11px] font-medium text-slate-400">{index + 1}</span>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelect(item.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-3.5 w-3.5 text-[#93631F]"
                              />
                            </div>
                          </TableCell>

                          {/* Mã bài - Opens Read-Only Proofing Detail Modal */}
                          <TableCell className="py-1.5 px-2">
                            <span
                              className="font-mono text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetailModal(item);
                              }}
                              title="Bấm để xem chi tiết bài bình (Read-Only Modal)"
                            >
                              {proofingCode}
                            </span>
                          </TableCell>

                          {/* Thumbnail */}
                          <TableCell className="text-center py-1.5 px-1">
                            <div
                              className="h-8 w-8 bg-slate-100 rounded-md border border-slate-200 mx-auto overflow-hidden relative cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (fullImage) setViewingImageUrl(fullImage);
                              }}
                            >
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={proofingCode}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Loại bài Pill */}
                          <TableCell className="py-1.5 px-2">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-semibold px-2 py-0 rounded-full border", getDesignTypePillStyle(designTypeCode))}
                            >
                              {designTypeName}
                            </Badge>
                          </TableCell>

                          {/* Chất liệu & Quy cách */}
                          <TableCell className="py-2 px-2">
                            <div className="flex flex-col text-slate-900 leading-tight gap-0.5">
                              <span className="font-extrabold text-xs text-slate-900 truncate" title={materialName}>
                                {materialName}{basisWeight ? ` ${basisWeight}g` : ""}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600">
                                Khổ: <strong className="text-slate-800 font-mono">{paperSizeName}</strong> • {itemCount} mã hàng
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600">
                                Số giấy in: <strong className="text-amber-900 font-bold font-mono">{totalQty.toLocaleString("vi-VN")} tờ</strong>
                              </span>
                            </div>
                          </TableCell>

                          {/* 3 Condition Cards: Kẽm, Khuôn, Giấy */}
                          <TableCell className="py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {/* 1. Card Kẽm */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] min-w-[110px] cursor-pointer transition-all hover:bg-slate-100/80",
                                      readiness.kemOk ? "bg-slate-50/80 border-slate-200" : "bg-red-50/50 border-red-200"
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Layers className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <div className="flex flex-col leading-tight truncate">
                                        <span className="font-bold text-slate-800 text-[10px]">Kẽm</span>
                                        <span className="text-[9px] text-slate-500 truncate">{readiness.kemLabel}</span>
                                      </div>
                                    </div>

                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleKem(item);
                                      }}
                                      className="cursor-pointer shrink-0 ml-1 p-0.5"
                                      title="Tick để xác nhận nhận kẽm"
                                    >
                                      {isReceiving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                                      ) : (
                                        <Checkbox
                                          checked={readiness.kemOk}
                                          onCheckedChange={() => { }}
                                          className="h-3.5 w-3.5 text-[#93631F]"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </PopoverTrigger>

                                {readiness.plateExport && (() => {
                                  const pe = readiness.plateExport as any;
                                  const vendorName = pe.printingVendorName || pe.vendorName || pe.plateVendor?.name || pe.printingVendor?.name || pe.vendorCode || pe.printingVendorCode || pe.vendorId || pe.printingVendorId;
                                  const isVendor = pe.productionMethod === "vendor" || pe.productionMethod === "outsource" || !!vendorName;
                                  const prodMethodLabel = isVendor ? "Thuê ngoài" : "In tại xưởng";
                                  return (
                                    <PopoverContent className="w-64 p-2.5 text-xs shadow-md">
                                      <div className="font-bold text-slate-900 mb-1 pb-1 border-b">
                                        Thông tin Kẽm bài {proofingCode}:
                                      </div>
                                      <div className="space-y-1 text-[11px] text-slate-600">
                                        <div>Số kẽm: <strong className="text-slate-800">{pe.plateCount || 0} kẽm</strong></div>
                                        <div>Sản xuất: <strong className="text-slate-800">{prodMethodLabel}</strong></div>
                                        {vendorName && (
                                          <div>Nhà cung cấp: <strong className="text-slate-800">{vendorName}</strong></div>
                                        )}
                                        <div className="flex items-center gap-1 mt-1">
                                          <span>Trạng thái:</span>
                                          <Badge variant="outline" className={pe.isReceived ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                                            {pe.isReceived ? "Đã nhận kẽm" : "Chưa nhận kẽm"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  );
                                })()}
                              </Popover>

                              {/* 2. Card Khuôn */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] min-w-[110px] cursor-pointer transition-all hover:bg-slate-100/80",
                                      readiness.khuonOk === null
                                        ? "bg-slate-50/80 border-slate-200 text-slate-500"
                                        : readiness.khuonOk
                                          ? "bg-slate-50/80 border-slate-200"
                                          : "bg-red-50/50 border-red-200"
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Box className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <div className="flex flex-col leading-tight truncate">
                                        <span className="font-bold text-slate-800 text-[10px]">Khuôn</span>
                                        <span className="text-[9px] text-slate-500 truncate">{readiness.khuonLabel}</span>
                                      </div>
                                    </div>

                                    {readiness.khuonRequired ? (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleKhuon(item);
                                        }}
                                        className="cursor-pointer shrink-0 ml-1 p-0.5"
                                        title="Tick để xác nhận nhận khuôn"
                                      >
                                        {isReceiving ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                                        ) : (
                                          <Checkbox
                                            checked={!!readiness.khuonOk}
                                            onCheckedChange={() => { }}
                                            className="h-3.5 w-3.5 text-[#93631F]"
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <Minus className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                                    )}
                                  </div>
                                </PopoverTrigger>

                                {readiness.dies.length > 0 && (
                                  <PopoverContent className="w-72 p-2.5 text-xs shadow-md">
                                    <div className="font-bold text-slate-900 mb-1.5 pb-1 border-b">
                                      Thông tin Khuôn bế bài {proofingCode}:
                                    </div>
                                    <div className="space-y-2">
                                      {readiness.dies.map((d: any, di: number) => {
                                        const dieImg = formatImageUrl(d.die?.imageUrl || d.imageUrl || d.die?.thumbnailUrl || d.thumbnailUrl);
                                        const locRaw = d.die?.location || d.location;
                                        const locMapped = locRaw ? (dieLocationLabels[locRaw] || dieLocationLabels[locRaw.trim()] || locRaw) : null;
                                        return (
                                          <div key={d.id || di} className="bg-slate-50 p-2 rounded border flex items-start gap-2 text-[11px]">
                                            {dieImg ? (
                                              <div
                                                className="h-12 w-12 bg-white rounded border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-[#93631F]/50 transition-all"
                                                onClick={() => setViewingImageUrl(dieImg)}
                                                title="Bấm để phóng to hình khuôn"
                                              >
                                                <img src={dieImg} alt={d.code || "Hình khuôn"} className="h-full w-full object-cover" />
                                              </div>
                                            ) : (
                                              <div className="h-12 w-12 bg-slate-100 rounded border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                                <Box className="h-4 w-4" />
                                              </div>
                                            )}
                                            <div className="flex-1 space-y-0.5 min-w-0">
                                              <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                                                <span className="truncate">{d.code || `Khuôn ${di + 1}`}</span>
                                                {(() => {
                                                  const dieInStock = d.isReceived === true || d.isNewDie === false;
                                                  return (
                                                    <Badge variant="outline" className={dieInStock ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                                                      {dieInStock ? "Đang lưu kho" : "Chưa nhận khuôn"}
                                                    </Badge>
                                                  );
                                                })()}
                                              </div>
                                              <div className="text-slate-500">Kích thước: {d.size || "—"}</div>
                                              {locMapped && (
                                                <div className="text-slate-500">Vị trí kho: <strong className="text-slate-700">{locMapped}</strong></div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                )}
                              </Popover>

                              {/* 3. Card Giấy */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] min-w-[120px] cursor-pointer transition-all hover:bg-slate-100/80",
                                      readiness.giayOk ? "bg-slate-50/80 border-slate-200" : "bg-red-50/50 border-red-200"
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <div className="flex flex-col leading-tight truncate">
                                        <span className="font-bold text-slate-800 text-[10px]">Giấy</span>
                                        <span className="text-[9px] text-slate-500 truncate">{readiness.giayLabel}</span>
                                      </div>
                                    </div>

                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleGiay(item);
                                      }}
                                      className="cursor-pointer shrink-0 ml-1 p-0.5"
                                      title="Tick để xác nhận có đủ giấy"
                                    >
                                      <Checkbox
                                        checked={readiness.giayOk}
                                        onCheckedChange={() => { }}
                                        className="h-3.5 w-3.5 text-[#93631F]"
                                      />
                                    </div>
                                  </div>
                                </PopoverTrigger>

                                <PopoverContent className="w-60 p-2.5 text-xs shadow-md">
                                  <div className="font-bold text-slate-900 mb-1 pb-1 border-b">
                                    Thông tin Giấy in bài {proofingCode}:
                                  </div>
                                  <div className="space-y-1 text-[11px] text-slate-600">
                                    <div>Khổ giấy: <strong className="text-slate-800">{paperSizeName}</strong></div>
                                    <div>Chất liệu: <strong className="text-slate-800">{materialName}</strong></div>
                                    {basisWeight && <div>Định lượng: <strong className="text-slate-800">{basisWeight} GSM</strong></div>}
                                    <div>Số lượng tờ: <strong className="text-amber-800 font-bold">{totalQty.toLocaleString("vi-VN")} tờ</strong></div>
                                  </div>
                                </PopoverContent>
                              </Popover>

                              {/* 4. Card Sóng (chỉ hiện khi requiresFlute == true) */}
                              {readiness.requiresFlute && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] min-w-[115px] cursor-pointer transition-all hover:bg-slate-100/80",
                                        readiness.fluteOk ? "bg-slate-50/80 border-slate-200" : "bg-red-50/50 border-red-200"
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Package className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                        <div className="flex flex-col leading-tight truncate">
                                          <span className="font-bold text-slate-800 text-[10px]">Sóng E</span>
                                          <span className="text-[9px] text-slate-500 truncate" title={readiness.fluteMaterialName}>
                                            {readiness.fluteMaterialName}
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFlute(item);
                                        }}
                                        className="cursor-pointer shrink-0 ml-1 p-0.5"
                                        title="Tick để xác nhận có đủ bìa carton sóng E"
                                      >
                                        <Checkbox
                                          checked={readiness.fluteOk}
                                          onCheckedChange={() => { }}
                                          className="h-3.5 w-3.5 text-[#93631F]"
                                        />
                                      </div>
                                    </div>
                                  </PopoverTrigger>

                                  <PopoverContent className="w-60 p-2.5 text-xs shadow-md">
                                    <div className="font-bold text-slate-900 mb-1 pb-1 border-b">
                                      Thông tin Bồi Sóng E bài {proofingCode}:
                                    </div>
                                    <div className="space-y-1 text-[11px] text-slate-600">
                                      <div>Loại sóng: <strong className="text-slate-800">{readiness.fluteMaterialName}</strong></div>
                                      <div>Chiều bồi: <strong className="text-slate-800">Chưa rõ</strong></div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span>Trạng thái:</span>
                                        <Badge variant="outline" className={readiness.fluteOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>
                                          {readiness.fluteOk ? "Đã có sóng" : "Chưa có sóng"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </TableCell>

                          {/* Trạng thái Badge */}
                          <TableCell className="py-1.5 px-2">
                            <div className="flex flex-col items-start leading-tight">
                              {readiness.isEligible ? (
                                <>
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                    <Check className="h-2.5 w-2.5 stroke-[3]" /> Đủ điều kiện
                                  </Badge>
                                  <span className="text-[9.5px] text-slate-500 font-medium mt-0.5">Sẵn sàng điều lệnh</span>
                                </>
                              ) : readiness.missingReason === "missing_kem" ? (
                                <>
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                    📍 Thiếu kẽm
                                  </Badge>
                                  <span className="text-[9.5px] text-amber-600 font-medium mt-0.5">Chưa có kẽm</span>
                                </>
                              ) : readiness.missingReason === "missing_khuon" ? (
                                <>
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-bold text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                    📍 Thiếu khuôn
                                  </Badge>
                                  <span className="text-[9.5px] text-orange-600 font-medium mt-0.5">Thiếu 1 cái</span>
                                </>
                              ) : readiness.missingReason === "missing_flute" ? (
                                <>
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-bold text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                    📍 Thiếu sóng
                                  </Badge>
                                  <span className="text-[9.5px] text-purple-600 font-medium mt-0.5">Chưa xác nhận sóng</span>
                                </>
                              ) : (
                                <>
                                  <Badge className="bg-red-50 text-red-700 border-red-200 font-bold text-[10px] px-1.5 py-0 rounded-md flex items-center gap-1">
                                    📍 Thiếu giấy
                                  </Badge>
                                  <span className="text-[9.5px] text-red-600 font-medium mt-0.5">Thiếu số lượng</span>
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* Thời gian bình bài */}
                          <TableCell className="py-1.5 px-2">
                            {(() => {
                              const prepressTime = formatDateTime(
                                item.productionOrder?.proofingOrder?.completedAt ||
                                item.impositionCompletedAt ||
                                item.impositionDate ||
                                item.productionOrder?.proofingOrder?.updatedAt ||
                                item.productionOrder?.createdAt
                              );
                              return (
                                <span className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                  {prepressTime}
                                </span>
                              );
                            })()}
                          </TableCell>

                          {/* Ghi chú */}
                          <TableCell className="py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                            {isReturned ? (
                              <div className="bg-rose-100/80 border border-rose-200/90 rounded-lg p-2 text-[11px] leading-tight space-y-1">
                                <div className="flex items-center justify-between text-rose-800 font-bold text-[10px]">
                                  <span className="flex items-center gap-1">
                                    <RotateCcw className="h-3 w-3 text-rose-600 shrink-0" />
                                    {item.returnTypeDisplayName || (item.returnType === "dispatch" ? "Điều lệnh trả về" : "Lệnh in trả về")}
                                  </span>
                                  {item.returnedAt && (
                                    <span className="font-mono text-[9px] font-normal text-rose-700">
                                      {format(new Date(item.returnedAt), "HH:mm dd/MM")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-900 font-semibold break-words">
                                  {item.returnReason || "Không có ghi chú lý do"}
                                </div>
                              </div>
                            ) : generalNotes ? (
                              <div className="text-[11px] text-slate-700 line-clamp-2 italic" title={generalNotes}>
                                {generalNotes}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">—</span>
                            )}
                          </TableCell>

                          {/* Thao tác Buttons: 2x2 grid layout */}
                          <TableCell className="text-center py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-1.5 w-[205px] mx-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDetailModal(item)}
                                className="h-7 text-[10.5px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-md px-1.5 w-full flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                title="Xem chi tiết bài bình (chỉ đọc)"
                              >
                                <Eye className="h-3 w-3 text-slate-500 shrink-0" /> Chi tiết
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenHistory(item)}
                                className="h-7 text-[10.5px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-md px-1.5 w-full flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                title="Xem lịch sử sản xuất"
                              >
                                <History className="h-3 w-3 text-slate-500 shrink-0" /> Lịch sử
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReturnToProofing(item)}
                                className="h-7 text-[10.5px] font-semibold text-rose-700 bg-rose-50/60 border-rose-200 hover:bg-rose-100 rounded-md px-1.5 w-full flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                title="Trả về bộ phận Bình bài để điều chỉnh lại file"
                              >
                                <RotateCcw className="h-3 w-3 text-rose-600 shrink-0" /> Trả bình bài
                              </Button>

                              <Button
                                size="sm"
                                disabled={!readiness.isEligible || dispatchMutation.isPending}
                                onClick={() => {
                                  if (!readiness.isEligible) return;
                                  dispatchMutation.mutate({ printOrderIds: [item.id] });
                                }}
                                className={cn(
                                  "h-7 text-[10.5px] font-bold text-white rounded-md px-1.5 w-full flex items-center justify-center gap-1 transition-all shrink-0 shadow-2xs",
                                  readiness.isEligible
                                    ? "bg-[#93631F] hover:bg-[#7a521a] cursor-pointer"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200 shadow-none"
                                )}
                                title={
                                  readiness.isEligible
                                    ? "Bấm để điều lệnh sản xuất ngay cho bài này"
                                    : "Bài me chưa đủ điều kiện (Kẽm, Khuôn, Giấy, Sóng) để điều lệnh!"
                                }
                              >
                                <Send className="h-3 w-3 shrink-0" /> Điều lệnh
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}

      {/* Main Tab 2: Điều lệnh Hoàn thành (Bài ĐÃ ĐIỀU, CHƯA IN) */}
      {mainTab === "undo" && (
        <div className="space-y-3">
          {/* Top Toolbar for Undo Tab */}
          <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Danh sách bài đã điều lệnh (Chờ in / Chưa in)</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline border-l border-slate-200 pl-2">
                Quản lý bài đã điều lệnh. Hủy điều lệnh cho các bài bị điều nhầm nếu cần điều chỉnh lại.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="w-36 h-7 bg-white rounded-lg border border-slate-200 flex items-center px-1.5 shadow-2xs">
                <DatePicker
                  value={selectedDateFilter}
                  onChange={(val) => setSelectedDateFilter(val)}
                  allowClear
                  placeholder="Lọc ngày..."
                  className="w-full h-6 text-[11px]"
                />
              </div>

              <div className="relative w-full md:w-56 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm mã bài, tên bài, chất liệu..."
                  value={undoSearchQuery}
                  onChange={(e) => setUndoSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-[11px] rounded-lg border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Table Grouped by Dispatch Date */}
          {isLoadingWaiting ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <Loader2 className="h-6 w-6 text-rose-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách bài đã điều lệnh...</p>
            </div>
          ) : groupedUndoSections.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-xs mb-1">Không có bài nào đã điều lệnh đang chờ in</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedUndoSections.map((dateSection) => (
                <div key={dateSection.dateKey} className="space-y-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  {/* Section Header: Date */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#93631F]/10 text-[#93631F] rounded-lg">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <h2 className="text-xs font-black text-slate-900 font-mono">
                        {dateSection.dateKey}
                      </h2>
                    </div>
                    <Badge className="bg-slate-800 text-white font-bold text-[10px] px-2.5 py-0.5">
                      {dateSection.items.length} bài điều lệnh
                    </Badge>
                  </div>

                  {/* Table per Date */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase">
                          <TableHead className="w-10 text-center py-2 px-1">#</TableHead>
                          <TableHead className="w-[110px] py-2 px-2">Mã bài</TableHead>
                          <TableHead className="w-[85px] py-2 px-2">Loại bài</TableHead>
                          <TableHead className="w-[220px] py-2 px-2">Chất liệu & Quy cách</TableHead>
                          <TableHead className="w-[140px] py-2 px-2">Người điều lệnh</TableHead>
                          <TableHead className="w-[140px] py-2 px-2">Thời gian điều</TableHead>
                          <TableHead className="w-[110px] py-2 px-2">Trạng thái</TableHead>
                          <TableHead className="w-[140px] text-center py-2 px-2">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateSection.items.map((item, index) => {
                          const po = item.productionOrder;
                          const proofingCode = po?.proofingOrderCode || `PO-${item.productionOrderId}`;
                          const designTypeName = item.designTypeName || po?.designType?.name || "Hộp";
                          const designTypeCode = item.designTypeCode || po?.designType?.code || "H";
                          const materialName = item.materialTypeName || (po?.proofingOrder as any)?.materialType?.name || "—";
                          const totalQty = item.totalQuantity ?? po?.proofingOrder?.totalQuantity ?? 0;
                          const dispatchedBy = item.dispatchedByName || item.dispatchedByUserName || "—";
                          const dispatchedAt = item.dispatchedAt ? formatDateTime(item.dispatchedAt) : "—";

                          return (
                            <TableRow key={item.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                              <TableCell className="text-center py-2 px-2 text-slate-400 font-medium">{index + 1}</TableCell>
                              <TableCell className="py-2 px-2">
                                <div className="flex flex-col gap-0.5 items-start">
                                  <span className="font-mono text-xs font-bold text-blue-600">{proofingCode}</span>
                                  {(() => {
                                    const prepressTime = formatDateTime(
                                      item.productionOrder?.proofingOrder?.completedAt ||
                                      item.impositionCompletedAt ||
                                      item.impositionDate ||
                                      item.productionOrder?.proofingOrder?.updatedAt ||
                                      item.productionOrder?.createdAt
                                    );
                                    return prepressTime !== "—" ? (
                                      <span
                                        className="text-[9.5px] font-mono text-slate-500 font-medium flex items-center gap-1 shrink-0"
                                        title="Thời gian hoàn thành bình bài"
                                      >
                                        <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                        {prepressTime}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-2">
                                <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0 rounded-full border", getDesignTypePillStyle(designTypeCode))}>
                                  {designTypeName}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-2">
                                <div className="flex flex-col text-[11px] leading-tight">
                                  <span className="font-bold text-slate-900 truncate">{materialName}</span>
                                  <span className="text-[10px] text-slate-500">Số lượng: <strong className="text-slate-800">{totalQty.toLocaleString("vi-VN")} tờ</strong></span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-2 text-[11px] font-medium text-slate-700">{dispatchedBy}</TableCell>
                              <TableCell className="py-2 px-2 text-[11px] font-mono text-slate-600">{dispatchedAt}</TableCell>
                              <TableCell className="py-2 px-2">
                                <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold text-[10px]">
                                  Chưa in / Chờ in
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center py-2 px-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenUndoDialog(item)}
                                  className="h-7 text-[10.5px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md px-2.5 flex items-center justify-center gap-1 cursor-pointer mx-auto shadow-2xs"
                                  title="Hủy điều lệnh để đưa bài về màn hình điều lệnh lại"
                                >
                                  <RotateCcw className="h-3 w-3" /> Hủy điều lệnh
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Read-Only Proofing Detail Modal matching prepress detail view */}
      <ReadOnlyProofingDetailModal
        proofingOrderId={viewingProofingOrderId}
        open={!!viewingProofingOrderId}
        onOpenChange={(open) => !open && setViewingProofingOrderId(null)}
      />

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />

      {/* Dialog Trả về bình bài (Từ Màn điều lệnh) */}
      <Dialog open={returnToProofingOpen} onOpenChange={setReturnToProofingOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-rose-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Trả về bộ phận Bình bài
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Trả về bình bài để xử lí — bài <strong>GIỮ lại</strong>, không mất lịch sử sản xuất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="returnToProofingReason" className="text-xs font-bold text-slate-700 block">
              Lý do trả về bình bài {!returnToProofingItem?.returnedAt && <span className="text-rose-500">*</span>}
            </label>
            <Textarea
              id="returnToProofingReason"
              rows={4}
              maxLength={1000}
              placeholder={
                returnToProofingItem?.returnedAt
                  ? "Có thể bỏ trống để giữ nguyên lý do của thợ in (hoặc bổ sung lý do mới)..."
                  : "Nhập chi tiết lý do trả về cho Bình bài (vd: Sai thông số file, cần chỉnh lại quy cách...)"
              }
              value={returnToProofingReason}
              onChange={(e) => setReturnToProofingReason(e.target.value)}
              className="text-xs bg-white"
            />
            <div className="text-[10px] text-slate-400 text-right">
              {returnToProofingReason.length}/1000 ký tự
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReturnToProofingOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReturnToProofing}
              disabled={(!returnToProofingItem?.returnedAt && !returnToProofingReason.trim()) || returnToProofingMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {returnToProofingMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Xác nhận Trả về Bình bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production History Timeline Modal */}
      <PrintOrderHistoryModal
        isOpen={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        printOrderId={historyPrintOrderId}
        proofingCode={historyProofingCode}
      />

      {/* Dialog Confirm Hủy điều lệnh */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-rose-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Xác nhận Hủy điều lệnh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1">
              Bạn có chắc chắn muốn HỦY ĐIỀU LỆNH cho bài <strong>{undoTargetItem?.productionOrder?.proofingOrderCode || `PO-${undoTargetItem?.productionOrderId}`}</strong>?
              <br /><br />
              Thao tác này sẽ đưa bài về trạng thái <strong>Chưa điều lệnh</strong> và bài sẽ quay lại danh sách bài chờ điều lệnh.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setUndoDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmUndoDispatch}
              disabled={undoDispatchMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {undoDispatchMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Xác nhận Hủy điều lệnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
