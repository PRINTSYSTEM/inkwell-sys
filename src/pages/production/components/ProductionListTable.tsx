import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import {
  Factory,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  Hash,
  Box,
  Package,
  Save,
  PlayCircle,
  Loader2,
  Edit,
  XCircle,
  AlertTriangle,
  FileImage,
  History,
  User,
  Clock,
  Eye,
  Flame,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  productionStepStatusLabels,
  getStepStatusLabel,
  laminationTypeLabels,
  dieLocationLabels,
} from "@/lib/status-utils";
import type {
  ProductionOrderResponse,
  ProductionStepResponse,
  ProofingOrderResponse,
} from "@/Schema";
import {
  useUpdateProductionStep,
  useUpdateProductionOrderItem,
  useDeleteProductionOrder,
  useBulkUpdateProductionOrderItems,
  useProductionStepHistory,
  useProductionOrder,
} from "@/hooks/use-production";
import { usePrintOrderHistory } from "@/hooks/use-print-order";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDieSize } from "@/utils/format-die-size";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { apiRequest } from "@/lib/http";
import { AsyncSelect } from "@/components/forms/AsyncSelect";
import { useDefectRecordsByProductionOrder, defectRecordKeys } from "@/hooks/use-defect-record";

function highlightText(text: string, search: string) {
  if (!search || !search.trim()) return text;
  const cleanSearch = search.trim();
  const parts = text.split(new RegExp(`(${cleanSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanSearch.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded border border-yellow-300">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface ProductionListTableProps {
  isLoading: boolean;
  productions: ProductionOrderResponse[];
  searchTerm: string;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  pageInput: string;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  onProductionClick: (id: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputBlur: () => void;
}

// Helper to find a specific step
function getStepStatus(
  steps: ProductionStepResponse[] | null | undefined,
  keywords: string[],
  stepTypeMatcher?: string,
): ProductionStepResponse | null {
  if (!steps) return null;
  return (
    steps.find((s) => {
      if (stepTypeMatcher && s.stepType === stepTypeMatcher) return true;
      if (s.stepTypeName) {
        const nameLower = s.stepTypeName.toLowerCase();
        return keywords.some((k) => nameLower.includes(k.toLowerCase()));
      }
      return false;
    }) || null
  );
}

// Helper to find all steps of a type
function getSteps(
  steps: ProductionStepResponse[] | null | undefined,
  keywords: string[],
  stepTypeMatcher?: string,
): ProductionStepResponse[] {
  if (!steps) return [];
  return (
    steps.filter((s) => {
      if (stepTypeMatcher && s.stepType === stepTypeMatcher) return true;
      if (s.stepTypeName) {
        const nameLower = s.stepTypeName.toLowerCase();
        return keywords.some((k) => nameLower.includes(k.toLowerCase()));
      }
      return false;
    }) || []
  ).sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
}

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

const getEventBadgeStyle = (eventType?: string) => {
  switch (eventType) {
    case "dispatched":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "re_dispatched":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "started":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "paused":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "returned_by_print":
    case "returned_to_dispatch":
    case "returned_to_proofing":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "reproofed":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

// Modal xem nhật ký chuyển trạng thái của Step (kết hợp cả history công đoạn & history lệnh in)
function StepHistoryModal({
  stepId,
  stepName,
  isOpen,
  onOpenChange,
  printOrderId,
}: {
  stepId: number | null;
  stepName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  printOrderId?: number | null;
}) {
  const { data: stepHistories, isLoading: isStepLoading } = useProductionStepHistory(
    isOpen ? stepId : null,
  );
  const { data: printHistories, isLoading: isPrintLoading } = usePrintOrderHistory(
    isOpen ? printOrderId : null,
  );

  const histories = React.useMemo(() => {
    const list: any[] = [];
    if (stepHistories && Array.isArray(stepHistories)) {
      stepHistories.forEach((h: any) => {
        list.push({
          id: `step-${h.id}`,
          type: "step",
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          userName: h.userName || h.userFullName || "Hệ thống",
          note: h.note || h.description || h.reason,
          createdAt: h.createdAt,
        });
      });
    }
    if (printHistories && Array.isArray(printHistories)) {
      printHistories.forEach((p: any) => {
        list.push({
          id: `print-${p.id}`,
          type: "print",
          eventType: p.eventType || p.action,
          eventTypeDisplayName: p.eventTypeDisplayName || p.action,
          fromStatus: p.fromStatus || p.oldStatus,
          toStatus: p.toStatus || p.newStatus,
          userName: p.userName || p.userFullName || p.createdByName || "Hệ thống",
          note: p.reason || p.notes || p.description,
          createdAt: p.createdAt,
        });
      });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stepHistories, printHistories]);

  const isLoading = isStepLoading || (!!printOrderId && isPrintLoading);

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
          ) : histories.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Chưa có ghi nhận nhật ký chuyển trạng thái nào cho công đoạn này.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {histories.map((h) => (
                <div key={h.id} className="relative group space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                    <Clock className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {h.type === "print" ? (
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-1.5 py-0", getEventBadgeStyle(h.eventType))}>
                        {h.eventTypeDisplayName || getStepStatusLabel(h.eventType || h.toStatus)}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold">
                        {h.fromStatus && (
                          <>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusColorClass(h.fromStatus))}>
                              {getStepStatusLabel(h.fromStatus)}
                            </Badge>
                            <span className="text-slate-400">→</span>
                          </>
                        )}
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusColorClass(h.toStatus || ""))}>
                          {getStepStatusLabel(h.toStatus)}
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

                  {h.note && (
                    <div className="mt-1 text-[11px] text-red-900 bg-red-50 border border-red-200/80 rounded-lg p-2 font-mono">
                      <span className="font-bold font-sans text-red-900">Lý do: </span>
                      {h.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal hiển thị báo số KCS từng con hàng (dạng danh sách list đầy đủ như KCS)
function ProductionReportModal({
  prod: initialProd,
  isOpen,
  onOpenChange,
}: {
  prod: ProductionOrderResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: fullProd, isLoading: isProdLoading } = useProductionOrder(
    initialProd?.id || null,
    !!initialProd?.id && isOpen,
  );

  const prod = fullProd || initialProd;

  if (!initialProd) return null;

  const items = (prod as any)?.items || [];
  const proofingOrder = (prod as any)?.proofingOrder;
  const proofingDesigns = proofingOrder?.proofingOrderDesigns || [];
  const proofingCode = prod?.proofingOrderCode || (proofingOrder as any)?.code || `BB${prod?.proofingOrderId}`;

  const formatUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl;
  };

  const getCustomerName = (item: any) => {
    if (!item) return "—";
    const design = item.design || {};
    const itemCustomer = item.customer || design.customer || {};
    const poCustomer = proofingOrder?.customer || proofingOrder?.order?.customer || {};
    const prodCustomer = (prod as any)?.customer || (prod as any)?.proofingOrder?.customer || {};

    return (
      item.customerCompanyName ||
      item.customerName ||
      itemCustomer.companyName ||
      itemCustomer.name ||
      design.customerCompanyName ||
      design.customerName ||
      proofingOrder?.customerCompanyName ||
      proofingOrder?.customerName ||
      poCustomer.companyName ||
      poCustomer.name ||
      (prod as any)?.customerCompanyName ||
      (prod as any)?.customerName ||
      prodCustomer.companyName ||
      prodCustomer.name ||
      "—"
    );
  };

  const displayItems = items.length > 0 ? items : proofingDesigns;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-slate-200 p-5 rounded-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <ClipboardList className="h-5 w-5 text-[#93631F]" />
            Báo số KCS — Bài in {proofingCode}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
            <Box className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>SỐ LƯỢNG KCS THEO TỪNG CON HÀNG ({displayItems.length})</span>
          </div>

          {isProdLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-600" />
              Đang tải dữ liệu KCS...
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-2.5">
              {items.map((item: any, idx: number) => {
                const imgUrl = formatUrl(item.designThumbnailUrl || item.designImageUrl || item.design?.imageUrl);
                const name = item.designName || item.designCode || `Mã hàng #${idx + 1}`;
                const code = item.designCode || "—";
                const customer = getCustomerName(item);
                const inputQty = item.inputQty != null ? item.inputQty.toLocaleString("vi-VN") : "0";
                const itemsPerSheet = item.itemsPerSheet != null && item.itemsPerSheet > 0 ? item.itemsPerSheet : 1;
                const outputQty = item.outputQty != null ? item.outputQty.toLocaleString("vi-VN") : "0";
                const defectQty = item.defectQty != null ? item.defectQty.toLocaleString("vi-VN") : "0";

                return (
                  <div
                    key={item.id || item.productionOrderItemId || idx}
                    className="p-3 bg-emerald-50/40 border border-emerald-300/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-400 transition-colors"
                  >
                    {/* Left: Thumbnail & Main Information */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 border rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {imgUrl ? (
                          <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <FileImage className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="font-black text-slate-900 text-sm truncate" title={name}>
                          {name}
                        </div>

                        <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 flex-wrap">
                          <span>Mã: <strong className="font-bold text-slate-800">{code}</strong></span>
                          <span>•</span>
                          <span>SL Bình bài: <strong className="font-black text-[#93631F] text-sm">{inputQty}</strong></span>
                          <span>•</span>
                          <span className="bg-white text-slate-700 border border-slate-200/90 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            {itemsPerSheet} con/bài
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: RA & LỖI stats */}
                    <div className="flex items-center gap-4 shrink-0 text-right pr-1">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">RA</span>
                        <span className="text-base font-mono font-black text-emerald-700">{outputQty}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">LỖI</span>
                        <span className="text-base font-mono font-black text-red-600">{defectQty}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : proofingDesigns.length > 0 ? (
            <div className="space-y-2.5">
              {proofingDesigns.map((pod: any, idx: number) => {
                const name = pod.design?.name || pod.design?.code || `Mã hàng #${idx + 1}`;
                const code = pod.design?.code || "—";
                const customer = getCustomerName(pod);
                const imgUrl = formatUrl(pod.design?.thumbnailUrl || pod.design?.imageUrl);
                const qty = pod.quantity != null ? pod.quantity.toLocaleString("vi-VN") : "0";
                const itemsPerSheet = pod.itemsPerSheet != null && pod.itemsPerSheet > 0 ? pod.itemsPerSheet : 1;
                const outputQty = pod.outputQty != null ? pod.outputQty.toLocaleString("vi-VN") : "0";

                return (
                  <div
                    key={pod.id || idx}
                    className="p-3 bg-emerald-50/40 border border-emerald-300/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 border rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {imgUrl ? (
                          <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <FileImage className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="font-black text-slate-900 text-sm truncate" title={name}>
                          {name}
                        </div>

                        <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 flex-wrap">
                          <span>Mã: <strong className="font-bold text-slate-800">{code}</strong></span>
                          <span>•</span>
                          <span>SL Bình bài: <strong className="font-black text-[#93631F] text-sm">{qty}</strong></span>
                          <span>•</span>
                          <span className="bg-white text-slate-700 border border-slate-200/90 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                            {itemsPerSheet} con/bài
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right pr-1">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">RA</span>
                        <span className="text-base font-mono font-black text-emerald-700">{outputQty}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">LỖI</span>
                        <span className="text-base font-mono font-black text-red-600">0</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Chưa có dữ liệu con hàng cho bài in này.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Outer helper to get status colors
function getStatusColorClass(status: string) {
  const effectiveStatus = status || "pending";
  switch (effectiveStatus.toLowerCase()) {
    case "pending":
      return "text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-900/40";
    case "ready":
      return "text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/40";
    case "in_progress":
    case "running":
      return "text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200 font-bold animate-pulse";
    case "done":
    case "completed":
      return "text-emerald-800 bg-emerald-100 border-emerald-300 hover:bg-emerald-200 font-bold";
    case "blocked":
    case "paused":
      return "text-red-800 bg-red-100 border-red-300 hover:bg-red-200 font-extrabold shadow-2xs";
    case "cancelled":
      return "text-destructive bg-destructive/15 hover:bg-destructive/25 dark:text-red-300 dark:bg-red-900/40";
    default:
      return "bg-muted text-muted-foreground";
  }
}

interface InlineStepStatusProps {
  step: ProductionStepResponse;
  isEnabled?: boolean;
  isStatusLocked?: boolean;
  defaultPrintQty: number;
  onOpenHistory?: (stepId: number, name: string, printOrderId?: number | null) => void;
}

function InlineStepStatus({
  step,
  isEnabled = true,
  isStatusLocked = false,
  defaultPrintQty,
  onOpenHistory,
}: InlineStepStatusProps) {
  const { mutate: updateStep } = useUpdateProductionStep();
  const isPaused = step.status === "paused" || step.status === "blocked";

  const handleStatusChange = (newStatus: string) => {
    updateStep({
      stepId: step.id!,
      data: {
        status: newStatus,
        inputQty: step.inputQty || defaultPrintQty || undefined,
        outputQty: step.outputQty || defaultPrintQty || undefined,
        defectQty: step.defectQty || undefined,
        notes: (step as any).notes || (step as any).defectNotes || undefined,
      },
    });
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 h-7 transition-all duration-300 ${!isEnabled ? "opacity-30 grayscale pointer-events-none select-none" : ""} ${isStatusLocked ? "pointer-events-none" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Select
        value={
          step.status === "completed" ? "done" : (step.status || "pending")
        }
        onValueChange={handleStatusChange}
        disabled={!isEnabled}
      >
        <SelectTrigger
          className={`h-7 min-w-[92px] text-[10px] px-1.5 font-bold border-slate-200 shadow-2xs ${getStatusColorClass(
            step.status || "pending",
          )} ${isStatusLocked ? "opacity-100 select-none" : ""}`}
        >
          <div className="flex items-center gap-1 truncate">
            {isPaused && <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse shrink-0" />}
            <SelectValue placeholder="Trạng thái" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending" className="text-xs font-semibold cursor-pointer" disabled={step.status === "in_progress"}>
            Chờ
          </SelectItem>
          {step.status === "ready" && (
            <SelectItem value="ready" className="text-xs font-semibold cursor-pointer">
              Sẵn sàng
            </SelectItem>
          )}
          <SelectItem value="in_progress" className="text-xs font-semibold cursor-pointer">
            Đang thực hiện
          </SelectItem>
          <SelectItem value="done" className="text-xs font-semibold cursor-pointer">
            Hoàn thành
          </SelectItem>
          <SelectItem value="blocked" className="text-xs font-bold text-red-700 cursor-pointer">
            <div className="flex items-center gap-1 text-red-700">
              <AlertTriangle className="h-3 w-3 text-red-600" /> Tạm dừng
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {step.id && onOpenHistory && (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => onOpenHistory(step.id!, step.stepTypeName || step.stepType || "")}
          className="h-6 w-6 text-slate-400 hover:text-[#93631F] hover:bg-amber-50 rounded shrink-0 cursor-pointer p-0"
          title="Xem nhật ký công đoạn"
        >
          <History className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface StepItemProps {
  step: ProductionStepResponse;
  isCheckStep?: boolean;
  isEnabled?: boolean;
  showName?: boolean;
  label?: string;
  hideStatus?: boolean;
  isPackagingItem?: boolean;
  productionItemId?: number | null;
  productionOrderId?: number | null;
  initialOutputQtyOverride?: number | null;
  initialDefectQtyOverride?: number | null;
  isStatusLocked?: boolean;
  defaultPrintQty: number;
  productionItems: any[];
  onOpenHistory?: (stepId: number, name: string, printOrderId?: number | null) => void;
}

function StepItem({
  step,
  isCheckStep = false,
  isEnabled = true,
  showName = false,
  label,
  hideStatus = false,
  isPackagingItem = false,
  productionItemId = null,
  productionOrderId = null,
  initialOutputQtyOverride = null,
  initialDefectQtyOverride = null,
  isStatusLocked = false,
  defaultPrintQty,
  productionItems,
  onOpenHistory,
}: StepItemProps) {
  const { mutate: updateStep } = useUpdateProductionStep();
  const { mutate: updateOrderItem } = useUpdateProductionOrderItem();
  const isPaused = step.status === "paused" || step.status === "blocked";

  // Auto-fill with proofing order qty if step qty not yet set (or zero)
  const initialInputQty = step.inputQty
    ? step.inputQty.toString()
    : defaultPrintQty
      ? String(defaultPrintQty)
      : "";
  const computedOutputQty =
    isPackagingItem && initialOutputQtyOverride !== null
      ? (initialOutputQtyOverride === 0 ? "" : initialOutputQtyOverride.toString())
      : step.outputQty != null
        ? (step.outputQty === 0 ? "" : step.outputQty.toString())
        : defaultPrintQty
          ? String(defaultPrintQty)
          : "";
  const computedDefectQty =
    isPackagingItem && initialDefectQtyOverride !== null
      ? (initialDefectQtyOverride === 0 ? "" : initialDefectQtyOverride.toString())
      : (step.defectQty ? step.defectQty.toString() : "");

  const hasBeenSaved = isPackagingItem
    ? initialOutputQtyOverride !== null || initialDefectQtyOverride !== null
    : step.outputQty != null || step.defectQty != null;

  const [inputQty, setInputQty] = useState(initialInputQty);
  const [notes, setNotes] = useState(
    isPackagingItem
      ? productionItems.find((i: any) => i.id === productionItemId)?.notes || ""
      : step.notes || (step as any).defectNotes || "",
  );
  const [outputQty, setOutputQty] = useState(computedOutputQty);
  const [defectQty, setDefectQty] = useState(computedDefectQty);
  const [isEditing, setIsEditing] = useState(!hasBeenSaved);

  React.useEffect(() => {
    // Don't overwrite local state while user is editing
    if (isEditing) return;

    setInputQty(
      step.inputQty
        ? step.inputQty.toString()
        : defaultPrintQty
          ? String(defaultPrintQty)
          : "",
    );
    setOutputQty(
      isPackagingItem && initialOutputQtyOverride !== null
        ? (initialOutputQtyOverride === 0 ? "" : initialOutputQtyOverride.toString())
        : step.outputQty != null
          ? (step.outputQty === 0 ? "" : step.outputQty.toString())
          : defaultPrintQty
            ? String(defaultPrintQty)
            : "",
    );
    setDefectQty(
      isPackagingItem && initialDefectQtyOverride !== null
        ? (initialDefectQtyOverride === 0 ? "" : initialDefectQtyOverride.toString())
        : (step.defectQty ? step.defectQty.toString() : ""),
    );
    setNotes(
      isPackagingItem
        ? productionItems.find((i: any) => i.id === productionItemId)?.notes || ""
        : step.notes || (step as any).defectNotes || "",
    );
  }, [
    isEditing,
    step.inputQty,
    step.outputQty,
    step.defectQty,
    step.notes,
    defaultPrintQty,
    isPackagingItem,
    initialOutputQtyOverride,
    initialDefectQtyOverride,
    productionItems,
    productionItemId,
  ]);

  const handleUpdate = (
    updates: Partial<{
      status: any;
      inputQty: number;
      outputQty: number;
      defectQty: number;
      notes?: string;
    }>,
  ) => {
    // 1. Update the Item (quantities) if it's a packaging item
    if (
      isPackagingItem &&
      productionItemId !== null &&
      productionOrderId !== null
    ) {
      updateOrderItem({
        productionOrderId,
        itemId: productionItemId,
        data: {
          outputQty:
            updates.outputQty !== undefined
              ? updates.outputQty
              : Number(outputQty) || 0,
          defectQty:
            updates.defectQty !== undefined
              ? updates.defectQty
              : Number(defectQty) || 0,
          notes: updates.notes !== undefined ? updates.notes : notes,
        },
      });
    }

    // 2. Update the Step (status and quantities)
    // This is always called for non-packaging steps, or for packaging steps when status changes
    if (step.id && (updates.status !== undefined || !isPackagingItem)) {
      updateStep({
        stepId: step.id,
        data: {
          status: updates.status ?? (step.status || "pending"),
          inputQty:
            updates.inputQty !== undefined
              ? updates.inputQty
              : Number(inputQty) || 0,
          outputQty:
            updates.outputQty !== undefined
              ? updates.outputQty
              : Number(outputQty) || 0,
          defectQty:
            updates.defectQty !== undefined
              ? updates.defectQty
              : Number(defectQty) || 0,
          notes: updates.notes !== undefined ? updates.notes : notes,
        },
      }).catch((err) => {
        console.error("Lỗi cập nhật bước:", err);
      });
    }

    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full max-w-[100px] md:max-w-[110px] mx-auto py-2 first:pt-0 last:pb-0">
      {(showName || label) && (
        <span
          className="text-[9px] font-bold text-muted-foreground truncate leading-tight uppercase tracking-tighter"
          title={label || step.stepTypeName || ""}
        >
          {label || step.stepTypeName || "Đóng gói"}
        </span>
      )}
      {!hideStatus && (
        <div className="flex items-center justify-center gap-1 w-full">
          <Select
            value={
              step.status === "completed" ? "done" : (step.status || "pending")
            }
            onValueChange={(val: any) => handleUpdate({ status: val })}
            disabled={!isEnabled}
          >
            <SelectTrigger
              className={`h-6 text-[9px] font-bold px-1.5 w-full border-slate-200 shadow-2xs ${getStatusColorClass(step.status || "pending")} ${!isEnabled ? "opacity-30 grayscale" : ""} ${isStatusLocked ? "opacity-100 pointer-events-none select-none" : ""}`}
            >
              <div className="flex items-center gap-1 truncate">
                {isPaused && <AlertTriangle className="h-3 w-3 text-red-600 animate-pulse shrink-0" />}
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending" className="text-xs font-semibold cursor-pointer" disabled={step.status === "in_progress"}>
                Chờ
              </SelectItem>
              {step.status === "ready" && (
                <SelectItem value="ready" className="text-xs font-semibold cursor-pointer">
                  Sẵn sàng
                </SelectItem>
              )}
              <SelectItem value="in_progress" className="text-xs font-semibold cursor-pointer">
                Đang thực hiện
              </SelectItem>
              <SelectItem value="done" className="text-xs font-semibold cursor-pointer">
                Hoàn thành
              </SelectItem>
              <SelectItem value="blocked" className="text-xs font-bold text-red-700 cursor-pointer">
                <div className="flex items-center gap-1 text-red-700">
                  <AlertTriangle className="h-3 w-3 text-red-600" /> Tạm dừng
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {step.id && onOpenHistory && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => onOpenHistory(step.id!, step.stepTypeName || step.stepType || "")}
              className="h-6 w-6 text-slate-400 hover:text-[#93631F] hover:bg-amber-50 rounded shrink-0 cursor-pointer p-0"
              title="Xem nhật ký công đoạn"
            >
              <History className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {isCheckStep && !isEditing && (
        <div className="flex flex-col gap-1 mt-1">
          {/* Ẩn phần Vào theo yêu cầu */}
          <div className="hidden items-center justify-between gap-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
              Vào
            </span>
            <span className="text-[10px] tabular-nums font-medium">
              {inputQty || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
              Ra
            </span>
            <span className="text-[13px] tabular-nums font-bold text-emerald-700">
              {outputQty || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">
              Lỗi
            </span>
            <span className="text-[13px] tabular-nums font-bold text-red-600">
              {defectQty || 0}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 mt-1 text-[10px] w-full"
            disabled={!isEnabled}
            onClick={() => {
              setIsEditing(true);
            }}
          >
            <Edit className="w-3 h-3 mr-1" /> Sửa
          </Button>
          {notes && (
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-500 break-words leading-tight border-l-2 border-amber-500/50 pl-1.5 mt-1.5 bg-amber-50/30 dark:bg-amber-900/10 py-1">
              {notes}
            </div>
          )}
        </div>
      )}

      {isCheckStep && isEditing && (
        <div className="flex flex-col gap-1 mt-1">
          {/* Ẩn phần Vào theo yêu cầu */}
          <div className="hidden items-center justify-between gap-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
              Vào
            </span>
            <Input
              type="number"
              className="h-5 w-14 text-[10px] px-1 py-0 text-right bg-background"
              value={inputQty}
              onChange={(e) => setInputQty(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase w-5 shrink-0 text-center">Ra</span>
            <Input
              type="number"
              value={outputQty}
              onChange={(e) => setOutputQty(e.target.value)}
              className="h-7 text-[13px] px-1.5 py-0 focus-visible:ring-emerald-500 font-bold tabular-nums"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-red-600 uppercase w-5 shrink-0 text-center">Lỗi</span>
            <Input
              type="number"
              value={defectQty}
              onChange={(e) => setDefectQty(e.target.value)}
              className="h-7 text-[13px] px-1.5 py-0 focus-visible:ring-red-500 font-bold text-red-600 tabular-nums"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-6 mt-1 text-[10px] w-full"
            disabled={!isEnabled}
            onClick={() => {
              if (isCheckStep) {
                const outQty = Number(outputQty);
                if (isNaN(outQty) || outQty <= 0) {
                  toast.error("Số lượng ra phải lớn hơn 0!");
                  return;
                }
              }
              handleUpdate({
                ...(isCheckStep && { status: "done" }),
                inputQty: Number(inputQty) || 0,
                outputQty: Number(outputQty) || 0,
                defectQty: Number(defectQty) || 0,
                notes: notes,
              });
            }}
          >
            <Save className="w-3 h-3 mr-1" /> Lưu
          </Button>
          <Input
            placeholder="Ghi chú..."
            className="h-7 w-full text-[11px] px-1.5 py-0 bg-background mt-1.5 border-amber-200 focus:border-amber-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

interface StepCellProps {
  step: ProductionStepResponse | null;
  isCheckStep?: boolean;
  isEnabled?: boolean;
  showName?: boolean;
  info?: React.ReactNode;
  isStatusLocked?: boolean;
  defaultPrintQty: number;
  productionItems: any[];
  className?: string;
  onOpenHistory?: (stepId: number, name: string, printOrderId?: number | null) => void;
}

function StepCell({
  step,
  isCheckStep = false,
  isEnabled = true,
  showName = false,
  info,
  isStatusLocked = false,
  defaultPrintQty,
  productionItems,
  className,
  onOpenHistory,
}: StepCellProps) {
  // If no step AND no info, show empty
  if (!step && !info)
    return (
      <TableCell className={cn("text-center py-3 bg-primary/[0.08] dark:bg-primary/[0.15] text-primary/40 font-black text-lg italic border-r border-border/40", className)}>
        —
      </TableCell>
    );

  return (
    <TableCell
      className={cn("align-top py-3 px-1", className || "w-[85px] max-w-[85px]")}
    >
      <div className="flex flex-col items-center gap-1.5">
        {step && (
          <StepItem
            step={step}
            isCheckStep={isCheckStep}
            isEnabled={isEnabled}
            showName={showName}
            isStatusLocked={isStatusLocked}
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={onOpenHistory}
          />
        )}
        {info && <div className="w-full text-center">{info}</div>}
      </div>
    </TableCell>
  );
}

interface ProductionTableRowProps {
  prod: ProductionOrderResponse;
  searchTerm: string;
  onProductionClick: (id: number) => void;
  onOpenHistory?: (stepId: number, name: string, printOrderId?: number | null) => void;
  onOpenProofingDetail?: (proofingOrderId: number) => void;
  onOpenReportModal?: (prod: ProductionOrderResponse) => void;
}

const ProductionTableRow = React.memo(
  function ProductionTableRow({
    prod,
    searchTerm,
    onProductionClick,
    onOpenHistory,
    onOpenProofingDetail,
    onOpenReportModal,
  }: ProductionTableRowProps) {
    const queryClient = useQueryClient();
    const [openDiePopover, setOpenDiePopover] = useState(false);
    const [openPlatePopover, setOpenPlatePopover] = useState(false);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    const printOrderIdForHistory =
      (prod as any)?.printOrderId ||
      (prod as any)?.printOrder?.id ||
      prod.proofingOrderId ||
      prod.id;

    const handleStepHistoryOpen = React.useCallback(
      (stepId: number, name: string) => {
        if (onOpenHistory) {
          onOpenHistory(stepId, name, printOrderIdForHistory);
        }
      },
      [onOpenHistory, printOrderIdForHistory],
    );

    const loadUsersOptions = async (search?: string) => {
      try {
        const res = await apiRequest.get<any>("/users", {
          params: {
            pageNumber: 1,
            pageSize: 100,
            isActive: true,
            search: search || undefined,
          },
        });
        return (res.data?.items ?? []).map((u: any) => ({
          value: u.id,
          label: u.fullName || u.username || `User #${u.id}`,
          description: u.role ? `Vai trò: ${u.role}` : undefined,
        }));
      } catch (err) {
        console.error("loadUsersOptions error:", err);
        return [];
      }
    };

    const isDraft = !prod.id;
    const proofingOrder = prod.proofingOrder as any;

    const isOrderUrgent = React.useMemo(() => {
      return (
        !!prod.isUrgent ||
        !!(prod as any).isUrgent ||
        !!proofingOrder?.isUrgent ||
        !!(proofingOrder as any)?.isUrgent ||
        !!(
          proofingOrder?.proofingOrderDesigns &&
          proofingOrder.proofingOrderDesigns.some((pod: any) => pod.isUrgent || pod.design?.isUrgent)
        )
      );
    }, [prod, proofingOrder]);

    const [searchParams] = useSearchParams();
    const searchHighlight = searchParams.get("search") || "";
    const isHighlighted = React.useMemo(() => {
      if (!searchHighlight) return false;
      const cleanSearch = searchHighlight.toLowerCase().trim();
      const cleanCode = (proofingOrder?.code || "").toLowerCase().trim();
      const cleanBBId = proofingOrder?.id ? `bb${proofingOrder.id}` : "";
      return (
        cleanCode === cleanSearch ||
        String(prod.id) === cleanSearch ||
        cleanBBId === cleanSearch
      );
    }, [searchHighlight, proofingOrder?.code, proofingOrder?.id, prod.id]);

    const formatUrl = (url: string | null | undefined) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
      const cleanUrl = url.startsWith("/") ? url : `/${url}`;
      return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl;
    };

    const { orderImages, orderThumbnails } = React.useMemo(() => {
      const largeUrls: string[] = [];
      const thumbUrls: string[] = [];

      const addImage = (large: string | null | undefined, thumb: string | null | undefined) => {
        if (!large) return;
        largeUrls.push(formatUrl(large));
        thumbUrls.push(formatUrl(thumb || large));
      };

      if (proofingOrder) {
        if (proofingOrder.imageUrl) {
          addImage(proofingOrder.imageUrl, proofingOrder.thumbnailUrl);
        }
        if (Array.isArray(proofingOrder.images)) {
          proofingOrder.images.forEach((img: any) => {
            addImage(img.imageUrl, img.thumbnailUrl);
          });
        }
      }

      if (largeUrls.length === 0 && Array.isArray((prod as any).proofingOrderImages)) {
        (prod as any).proofingOrderImages.forEach((img: any) => {
          addImage(img.imageUrl, img.thumbnailUrl);
        });
      }

      return {
        orderImages: Array.from(new Set(largeUrls.filter(Boolean))),
        orderThumbnails: Array.from(new Set(thumbUrls.filter(Boolean))),
      };
    }, [proofingOrder, prod]);

    React.useEffect(() => {
      setActiveImageIdx(0);
    }, [orderImages]);

    const productionItems = (prod as any).items || [];
    const steps = prod.steps || [];
    const hasAnyPausedStep = (steps || []).some(
      (s) => s.status?.toLowerCase() === "paused" || s.status?.toLowerCase() === "blocked"
    );

    const materialExportStep = getStepStatus(steps, ["xuất nguyên liệu"], "material_export");
    const printStep = getStepStatus(steps, ["in"], "print");
    const laminationStep = getStepStatus(steps, ["cán màng", "cán"], "lamination");
    const mountingStep = getStepStatus(steps, ["bồi"], "mounting") || steps.find(s => s.stepTypeName?.toLowerCase().includes("bồi")) || null;
    const foilingStep = getStepStatus(steps, ["ép kim", "ép"], "pressing") || steps.find(s => s.stepType === "foiling" || s.stepTypeName?.toLowerCase().includes("ép")) || null;
    const dieCutStep = getStepStatus(steps, ["bế"], "die_cut");
    const cutStep = getStepStatus(steps, ["cắt"], "cut");
    const glueStep = getStepStatus(steps, ["dán"], "glue");

    const isMaterialExportEnabled = !isDraft;
    const isPrintEnabled = !isDraft;
    const isSpecialProcessEnabled = !isDraft;
    const isLaminationEnabled = !isDraft;
    const isDieCutEnabled = !isDraft;
    const isCutEnabled = !isDraft;
    const isGlueEnabled = !isDraft;

    const defaultPrintQty = proofingOrder?.totalProcessedQty || proofingOrder?.totalQuantity || 0;

    const displayDesignType = React.useMemo(() => {
      if (!proofingOrder) return "";
      const directName = (prod as any).designTypeName || (prod as any).designType?.name || proofingOrder.designTypeName || proofingOrder.designType?.name;
      if (directName) return directName;
      const designs = proofingOrder.proofingOrderDesigns || [];
      const names = Array.from(new Set(designs.map((pod: any) => pod.design?.designType?.name).filter(Boolean)));
      return names.join(", ");
    }, [proofingOrder, prod]);

    const displayBasisWeight = React.useMemo(() => {
      if (!proofingOrder) return "";
      if (proofingOrder.basisWeight) return `${proofingOrder.basisWeight}gsm`;
      const designs = proofingOrder.proofingOrderDesigns || [];
      const weights = Array.from(new Set(designs.map((pod: any) => pod.design?.basisWeight).filter(Boolean)));
      if (weights.length > 0) return `${weights.join("/")}gsm`;
      return "";
    }, [proofingOrder]);

    const laminationInfo = React.useMemo(() => {
      if (!proofingOrder) return null;
      const lams = new Set<string>();
      if (proofingOrder.laminationTypeName) lams.add(proofingOrder.laminationTypeName);
      else if (proofingOrder.laminationType) {
        lams.add(laminationTypeLabels[proofingOrder.laminationType] || proofingOrder.laminationType);
      }
      proofingOrder.proofingOrderDesigns?.forEach((pod: any) => {
        const designLam = pod.design?.laminationType;
        if (designLam) {
          lams.add(laminationTypeLabels[designLam] || designLam);
        }
      });
      return Array.from(lams).join(", ");
    }, [proofingOrder]);

    return (
      <>
        <TableRow
          className={cn(
            "border-b transition-colors duration-150",
            hasAnyPausedStep
              ? "bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-500"
              : isHighlighted
                ? "bg-amber-100/50 hover:bg-amber-100/70"
                : "hover:bg-slate-50/80"
          )}
        >
          {/* Col 0: MÃ BÌNH BÀI */}
          <TableCell className="py-2 px-2 align-middle w-[140px] border-r border-slate-200/60">
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shrink-0 cursor-pointer shadow-2xs"
                onClick={() => orderImages.length > 0 && setViewingImageUrl(orderImages[0])}
                title="Bấm để xem ảnh bài in"
              >
                {orderThumbnails.length > 0 ? (
                  <img src={orderThumbnails[0]} alt="Hình bài" className="h-full w-full object-cover select-none" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                    <FileImage className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="space-y-0.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    const pId = prod.proofingOrderId || (proofingOrder as any)?.id;
                    if (pId && onOpenProofingDetail) onOpenProofingDetail(pId);
                  }}
                  className="font-mono text-xs font-black text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left block truncate"
                  title="Bấm để xem thông tin bình bài (Read-Only)"
                >
                  {prod.proofingOrderCode || (proofingOrder as any)?.code || `BB${prod.proofingOrderId}`}
                </button>

                {isOrderUrgent && (
                  <Badge className="bg-red-500 text-white font-bold text-[8px] px-1 py-0 animate-pulse">
                    <Flame className="h-2 w-2 mr-0.5" /> GẤP
                  </Badge>
                )}
              </div>
            </div>
          </TableCell>

          {/* Col 1: LOẠI BÀI */}
          <TableCell className="text-center py-2.5 px-2 align-top w-[100px]">
            <Badge variant="outline" className={cn("text-[9.5px] font-bold", getDesignTypeBadgeStyle(displayDesignType))}>
              {displayDesignType || "—"}
            </Badge>
          </TableCell>

          {/* Col 2: CHẤT LIỆU & QUY CÁCH */}
          <TableCell className="py-2.5 px-2 align-top w-[220px]">
            <div className="flex flex-col text-[11px] text-slate-700 leading-tight space-y-0.5">
              <div className="font-semibold text-slate-900 truncate" title={proofingOrder?.materialType?.name || ""}>
                {proofingOrder?.materialType?.name || (prod as any).materialTypeName || "—"}
                {displayBasisWeight ? ` ${displayBasisWeight}` : ""}
              </div>
              <div className="text-[10.5px] text-slate-500">
                Khổ: {proofingOrder?.paperSize?.name || proofingOrder?.customPaperSize || "—"}
              </div>
              <div className="font-mono font-bold text-[10.5px] text-[#93631F]">
                Số lượng: {defaultPrintQty.toLocaleString("vi-VN")} tờ
              </div>
            </div>
          </TableCell>

          {/* Cols 3 - 10: Steps */}
          <StepCell
            step={materialExportStep}
            isEnabled={isMaterialExportEnabled}
            className="w-[110px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={printStep}
            isEnabled={isPrintEnabled}
            className="w-[110px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={laminationStep}
            isEnabled={isLaminationEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            info={
              laminationInfo ? (
                <div className="text-[10px] font-extrabold text-amber-800 italic uppercase mt-1 tracking-tight">
                  {laminationInfo}
                </div>
              ) : null
            }
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={mountingStep}
            isEnabled={isSpecialProcessEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={foilingStep}
            isEnabled={isSpecialProcessEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={dieCutStep}
            isEnabled={isDieCutEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={cutStep}
            isEnabled={isCutEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />
          <StepCell
            step={glueStep}
            isEnabled={isGlueEnabled}
            className="w-[120px] px-1 text-center align-top py-2.5"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            onOpenHistory={handleStepHistoryOpen}
          />

          {/* Col 11: BÁO SỐ */}
          <TableCell className="text-center py-2.5 px-2 align-top w-[110px]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenReportModal && onOpenReportModal(prod)}
              className="h-7 text-[10.5px] font-bold px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80 shadow-2xs gap-1 cursor-pointer w-full mt-0.5"
              title="Xem chi tiết số lượng báo sản xuất & phế phẩm"
            >
              <ClipboardList className="h-3.5 w-3.5 text-[#93631F]" />
              Báo số
            </Button>
          </TableCell>
        </TableRow>

        {viewingImageUrl && (
          <ImageViewerDialog
            imageUrl={viewingImageUrl}
            open={!!viewingImageUrl}
            onOpenChange={(open) => {
              if (!open) setViewingImageUrl(null);
            }}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.searchTerm !== nextProps.searchTerm) return false;
    if (prevProps.onProductionClick !== nextProps.onProductionClick) return false;

    const p = prevProps.prod;
    const n = nextProps.prod;

    if (p.id !== n.id) return false;
    if (p.status !== n.status) return false;
    if (p.progressPercent !== n.progressPercent) return false;
    if (p.proofingOrderId !== n.proofingOrderId) return false;
    if (p.proofingOrderCode !== n.proofingOrderCode) return false;

    const pSteps = p.steps || [];
    const nSteps = n.steps || [];
    if (pSteps.length !== nSteps.length) return false;
    for (let i = 0; i < pSteps.length; i++) {
      if (pSteps[i].id !== nSteps[i].id) return false;
      if (pSteps[i].status !== nSteps[i].status) return false;
      if (pSteps[i].outputQty !== nSteps[i].outputQty) return false;
      if (pSteps[i].defectQty !== nSteps[i].defectQty) return false;
    }

    return true;
  }
);

export function ProductionListTable({
  isLoading,
  productions,
  searchTerm,
  totalCount,
  currentPage,
  itemsPerPage,
  totalPages,
  pageInput,
  tableContainerRef,
  onProductionClick,
  onPreviousPage,
  onNextPage,
  onPageInputChange,
  onPageInputBlur,
}: ProductionListTableProps) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyStepId, setHistoryStepId] = useState<number | null>(null);
  const [historyStepName, setHistoryStepName] = useState<string>("");
  const [historyPrintOrderId, setHistoryPrintOrderId] = useState<number | null>(null);

  const [proofingModalOpen, setProofingModalOpen] = useState(false);
  const [selectedProofingOrderId, setSelectedProofingOrderId] = useState<number | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportProd, setSelectedReportProd] = useState<ProductionOrderResponse | null>(null);

  const handleOpenHistory = (stepId: number, name: string, printOrderId?: number | null) => {
    setHistoryStepId(stepId);
    setHistoryStepName(name);
    setHistoryPrintOrderId(printOrderId || null);
    setHistoryModalOpen(true);
  };

  const handleOpenProofingDetail = (proofingOrderId: number) => {
    setSelectedProofingOrderId(proofingOrderId);
    setProofingModalOpen(true);
  };

  const handleOpenReportModal = (prod: ProductionOrderResponse) => {
    setSelectedReportProd(prod);
    setReportModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto [&>div]:!overflow-visible"
      >
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-[#fbf8f3] z-10 shadow-2xs border-b border-slate-200">
              <TableRow className="bg-[#fbf8f3] hover:bg-[#fbf8f3] uppercase text-[11px] font-bold text-slate-700">
                <TableHead className="h-10 font-bold text-[#93631F] text-center whitespace-nowrap w-[140px] border-r border-slate-200">MÃ BÌNH BÀI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[100px]">LOẠI BÀI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-left w-[220px]">CHẤT LIỆU & QUY CÁCH</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[110px]">XUẤT VẬT TƯ</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[110px]">LỆNH IN</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">CÁN MÀNG</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">BỒI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">ÉP KIM</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">BẾ</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">CẮT</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">DÁN</TableHead>
                <TableHead className="h-10 font-bold text-[#93631F] text-center whitespace-nowrap w-[110px]">BÁO SỐ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={12} rows={5} rowHeight="h-32" />
            </TableBody>
          </Table>
        ) : productions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Factory className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy đơn sản xuất nào
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-[#fbf8f3] z-10 shadow-2xs border-b border-slate-200">
              <TableRow className="bg-[#fbf8f3] hover:bg-[#fbf8f3] uppercase text-[11px] font-bold text-slate-700">
                <TableHead className="h-10 font-bold text-[#93631F] text-center whitespace-nowrap w-[140px] border-r border-slate-200">MÃ BÌNH BÀI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[100px]">LOẠI BÀI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-left w-[220px]">CHẤT LIỆU & QUY CÁCH</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[110px]">XUẤT VẬT TƯ</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[110px]">LỆNH IN</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">CÁN MÀNG</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">BỒI</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">ÉP KIM</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">BẾ</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">CẮT</TableHead>
                <TableHead className="h-10 font-bold text-slate-700 text-center whitespace-nowrap w-[120px]">DÁN</TableHead>
                <TableHead className="h-10 font-bold text-[#93631F] text-center whitespace-nowrap w-[110px]">BÁO SỐ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((prod: ProductionOrderResponse) => (
                <ProductionTableRow
                  key={prod.id || `draft-${prod.proofingOrderId}`}
                  prod={prod}
                  searchTerm={searchTerm}
                  onProductionClick={onProductionClick}
                  onOpenHistory={handleOpenHistory}
                  onOpenProofingDetail={handleOpenProofingDetail}
                  onOpenReportModal={handleOpenReportModal}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <StepHistoryModal
        stepId={historyStepId}
        stepName={historyStepName}
        printOrderId={historyPrintOrderId}
        isOpen={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />

      <ReadOnlyProofingDetailModal
        proofingOrderId={selectedProofingOrderId}
        open={proofingModalOpen}
        onOpenChange={setProofingModalOpen}
      />

      <ProductionReportModal
        prod={selectedReportProd}
        isOpen={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />

      {/* Pagination */}
      {!isLoading && productions.length > 0 && totalCount > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3 shrink-0 bg-background">
          <div className="text-sm font-medium text-muted-foreground">
            {searchTerm.trim() ? (
              <>
                Hiển thị {productions.length} / {totalCount} đơn sản xuất (đã
                lọc theo từ khóa)
              </>
            ) : (
              <>
                Hiển thị{" "}
                <span className="font-bold text-foreground">
                  {productions.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </span>
                {" - "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-foreground">{totalCount}</span>{" "}
                đơn sản xuất
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onPreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trang trước</span>
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-muted-foreground">
                Trang
              </span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={onPageInputChange}
                onBlur={onPageInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-14 h-8 text-center text-sm font-semibold"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-muted-foreground">
                / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              <span className="hidden sm:inline">Trang sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


