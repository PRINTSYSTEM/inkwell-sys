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
import {
  productionStepStatusLabels,
  laminationTypeLabels,
  dieLocationLabels,
} from "@/lib/status-utils";
import type {
  ProductionOrderResponse,
  ProductionStepResponse,
  ProofingOrderResponse,
} from "@/Schema";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import {
  useUpdateProductionStep,
  useUpdateProductionOrderItem,
  useDeleteProductionOrder,
  useBulkUpdateProductionOrderItems,
} from "@/hooks/use-production";
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
  onStartProduction: (proofingOrderId: number) => void;
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

// Outer helper to get status colors
function getStatusColorClass(status: string) {
  const effectiveStatus = status || "pending";
  switch (effectiveStatus) {
    case "pending":
      return "text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-900/40";
    case "ready":
      return "text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/40";
    case "in_progress":
      return "text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/40";
    case "done":
      return "text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/40";
    case "blocked":
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
}

function InlineStepStatus({
  step,
  isEnabled = true,
  isStatusLocked = false,
  defaultPrintQty,
}: InlineStepStatusProps) {
  const { mutate: updateStep } = useUpdateProductionStep();

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
      className={`flex items-center gap-1.5 h-7 transition-all duration-300 ${!isEnabled ? "opacity-30 grayscale pointer-events-none select-none" : ""} ${isStatusLocked ? "pointer-events-none" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Select
        value={
          step.status || "pending"
        }
        onValueChange={handleStatusChange}
        disabled={!isEnabled}
      >
        <SelectTrigger
          className={`h-7 min-w-[105px] text-[10px] px-2 font-bold border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(
            step.status || "pending",
          )} ${isStatusLocked ? "opacity-100 select-none" : ""}`}
        >
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="pending"
            className="text-xs font-semibold cursor-pointer"
            disabled={step.status === "in_progress"}
          >
            Chờ
          </SelectItem>
          {step.status === "ready" && (
            <SelectItem
              value="ready"
              className="text-xs font-semibold cursor-pointer"
            >
              Sẵn sàng
            </SelectItem>
          )}
          <SelectItem
            value="in_progress"
            className="text-xs font-semibold cursor-pointer"
          >
            Đang thực hiện
          </SelectItem>
          <SelectItem
            value="done"
            className="text-xs font-semibold cursor-pointer"
          >
            Hoàn thành
          </SelectItem>
          <SelectItem
            value="blocked"
            className="text-xs font-semibold cursor-pointer"
          >
            Bị chặn/Lỗi
          </SelectItem>
        </SelectContent>
      </Select>
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
}: StepItemProps) {
  const { mutate: updateStep } = useUpdateProductionStep();
  const { mutate: updateOrderItem } = useUpdateProductionOrderItem();

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
        <>
          <Select
            value={
              step.status || "pending"
            }
            onValueChange={(val: any) => handleUpdate({ status: val })}
            disabled={!isEnabled}
          >
            <SelectTrigger
              className={`h-6 text-[9px] font-bold px-1 w-full border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(step.status || "pending")} ${!isEnabled ? "opacity-30 grayscale" : ""} ${isStatusLocked ? "opacity-100 pointer-events-none select-none" : ""}`}
            >
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="pending"
                className="text-xs font-semibold cursor-pointer"
                disabled={step.status === "in_progress"}
              >
                Chờ
              </SelectItem>
              {step.status === "ready" && (
                <SelectItem
                  value="ready"
                  className="text-xs font-semibold cursor-pointer"
                >
                  Sẵn sàng
                </SelectItem>
              )}
              <SelectItem
                value="in_progress"
                className="text-xs font-semibold cursor-pointer"
              >
                Đang thực hiện
              </SelectItem>
              <SelectItem
                value="done"
                className="text-xs font-semibold cursor-pointer"
              >
                Hoàn thành
              </SelectItem>
              <SelectItem
                value="blocked"
                className="text-xs font-semibold cursor-pointer"
              >
                Bị chặn/Lỗi
              </SelectItem>
            </SelectContent>
          </Select>
        </>
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
          />
        )}
        {info && <div className="w-full text-center">{info}</div>}
      </div>
    </TableCell>
  );
}

const ProductionTableRow = React.memo(
  function ProductionTableRow({
    prod,
    searchTerm,
    onProductionClick,
    onStartProduction,
  }: {
    prod: ProductionOrderResponse;
    searchTerm: string;
    onProductionClick: (id: number) => void;
    onStartProduction: (proofingOrderId: number) => void;
  }) {
    const queryClient = useQueryClient();
    const [openDiePopover, setOpenDiePopover] = useState(false);
    const [openPlatePopover, setOpenPlatePopover] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const { mutate: deleteProductionOrder } = useDeleteProductionOrder();
    const [isEditingPackaging, setIsEditingPackaging] = useState(false);
    const [tempPackagingValues, setTempPackagingValues] = useState<
      Record<
        number,
        {
          outputQty: string;
          defectQty: string;
          notes: string;
          assignedToUserId?: string;
          defectSource?: string;
        }
      >
    >({});
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: defectRecordsData } = useDefectRecordsByProductionOrder(
      prod.id || null,
      undefined,
      !!prod.id && isExpanded,
    );
    const defectRecords = defectRecordsData?.items || [];

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
    const isCreating = React.useRef(false);

    // Auto-start production for draft items if they have a proofingOrderId
    React.useEffect(() => {
      if (isDraft && prod.proofingOrderId && !isCreating.current) {
        isCreating.current = true;
        onStartProduction(prod.proofingOrderId);
      }
    }, [isDraft, prod.proofingOrderId, onStartProduction]);

    const { data: proofingOrderData, isLoading: isProofingLoading } =
      useProofingOrder(
        prod.proofingOrderId || null,
        !!prod.proofingOrderId && isExpanded,
      );
    const proofingOrder = (proofingOrderData || prod.proofingOrder) as any;

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

    const orderImages = React.useMemo(() => {
      const urls: string[] = [];

      const formatUrl = (url: string | null | undefined) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl;
      };

      // 1. Get from loaded proofingOrder if available
      if (proofingOrder) {
        if (proofingOrder.imageUrl) {
          urls.push(formatUrl(proofingOrder.imageUrl));
        }
        if (Array.isArray(proofingOrder.images)) {
          proofingOrder.images.forEach((img: any) => {
            if (img?.imageUrl) {
              urls.push(formatUrl(img.imageUrl));
            }
          });
        }
      }

      // 2. Fallback to batch-loaded images in prod
      if (urls.length === 0 && Array.isArray((prod as any).proofingOrderImages)) {
        (prod as any).proofingOrderImages.forEach((img: any) => {
          if (img?.imageUrl) {
            urls.push(formatUrl(img.imageUrl));
          }
        });
      }

      return Array.from(new Set(urls.filter(Boolean)));
    }, [proofingOrder, prod]);

    React.useEffect(() => {
      setActiveImageIdx(0);
    }, [orderImages]);

    React.useEffect(() => {
      const el = imageContainerRef.current;
      if (!el || orderImages.length <= 1) return;
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY > 0) {
          setActiveImageIdx((prev) => (prev + 1) % orderImages.length);
        } else {
          setActiveImageIdx((prev) => (prev - 1 + orderImages.length) % orderImages.length);
        }
      };
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        el.removeEventListener("wheel", handleWheel);
      };
    }, [orderImages]);

    const productionItems = (prod as any).items || [];

    const { mutate: updateStep } = useUpdateProductionStep();
    const { mutate: updateOrderItem } = useUpdateProductionOrderItem();
    const { mutateAsync: bulkUpdateOrderItems } = useBulkUpdateProductionOrderItems();

    const steps = prod.steps || [];

    // Extract steps based on requested columns
    const materialExportStep = getStepStatus(
      steps,
      ["xuất nguyên liệu"],
      "material_export",
    );
    const printStep = getStepStatus(steps, ["in"], "print");
    const laminationStep = getStepStatus(
      steps,
      ["cán màng", "cán"],
      "lamination",
    );
    const dieCutStep = getStepStatus(steps, ["bế"], "die_cut");
    const cutStep = getStepStatus(steps, ["cắt"], "cut");
    const glueStep = getStepStatus(steps, ["dán"], "glue");
    const specialProcessStep = steps.find(
      (s) =>
        s.stepType === "mounting" ||
        s.stepType === "pressing" ||
        (s.stepTypeName &&
          ["bồi", "ép"].some((k) => s.stepTypeName!.toLowerCase().includes(k))),
    ) || null;
    const packagingSteps = getSteps(
      steps,
      ["đóng gói", "giao hàng"],
      "packaging",
    );
    const packagingStep = packagingSteps[0] || null;

    // Không ràng buộc tuần tự nữa, tất cả đều được enable nếu không phải là draft
    const isMaterialExportEnabled = !isDraft;
    const isPrintEnabled = !isDraft;
    const isSpecialProcessEnabled = !isDraft;
    const isLaminationEnabled = !isDraft;
    const isDieCutEnabled = !isDraft;
    const isCutEnabled = !isDraft;
    const isGlueEnabled = !isDraft;
    const isPackagingEnabled = !isDraft;

    const defaultPrintQty =
      (proofingOrder as any)?.totalProcessedQty ||
      (proofingOrder as any)?.totalQuantity ||
      0;

    const displayDesignType = React.useMemo(() => {
      if (!proofingOrder) return "";

      // 1. Check if designType or designTypeName is directly on production order (prod) or proofingOrder
      const directName = (prod as any).designTypeName ||
        (prod as any).designType?.name ||
        proofingOrder.designTypeName ||
        proofingOrder.designType?.name;
      if (directName) return directName;

      // 2. Extract from proofingOrderDesigns
      const designs = proofingOrder.proofingOrderDesigns || [];
      const names = Array.from(
        new Set(
          designs.map((pod: any) => pod.design?.designType?.name).filter(Boolean)
        )
      );
      return names.join(", ");
    }, [proofingOrder, prod]);

    const displayBasisWeight = React.useMemo(() => {
      if (!proofingOrder) return "";

      // 1. Direct basisWeight from proofingOrder
      if (proofingOrder.basisWeight) return `${proofingOrder.basisWeight}gsm`;

      // 2. Extract from proofingOrderDesigns
      const designs = proofingOrder.proofingOrderDesigns || [];
      const weights = Array.from(
        new Set(
          designs.map((pod: any) => pod.design?.basisWeight).filter(Boolean)
        )
      );
      if (weights.length > 0) {
        return `${weights.join("/")}gsm`;
      }
      return "";
    }, [proofingOrder]);

    const startEditingPackaging = () => {
      if (!proofingOrder?.proofingOrderDesigns) return;

      // Auto-jump packaging step status to 'in_progress' if not already in in_progress or done state
      if (
        packagingStep &&
        packagingStep.id &&
        packagingStep.status !== "in_progress" &&
        packagingStep.status !== "done"
      ) {
        updateStep({
          stepId: packagingStep.id,
          data: {
            status: "in_progress",
            inputQty: packagingStep.inputQty || undefined,
            outputQty: packagingStep.outputQty || undefined,
            defectQty: packagingStep.defectQty || undefined,
          },
        });
      }

      const initialValues: Record<
        number,
        {
          outputQty: string;
          defectQty: string;
          notes: string;
          assignedToUserId: string;
          defectSource: string;
        }
      > = {};
      proofingOrder.proofingOrderDesigns.forEach((pod: any) => {
        const prodItem = productionItems.find(
          (i: any) =>
            i.proofingOrderDesignId === pod.id ||
            i.designId === pod.designId ||
            i.id === pod.id,
        );

        const outQty = prodItem?.outputQty != null
          ? (prodItem.outputQty === 0 ? "" : prodItem.outputQty.toString())
          : prodItem?.producedQty != null
            ? (prodItem.producedQty === 0 ? "" : prodItem.producedQty.toString())
            : defaultPrintQty
              ? String(defaultPrintQty)
              : "";
        const defQty = prodItem?.defectQty != null && prodItem.defectQty !== 0
          ? prodItem.defectQty.toString()
          : "";
        const notesVal = prodItem?.notes || "";

        const existingDefect = defectRecords.find(
          (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
        );

        initialValues[pod.id] = {
          outputQty: outQty,
          defectQty: defQty,
          notes: notesVal,
          assignedToUserId: existingDefect?.assignedToUserId?.toString() || "",
          defectSource: existingDefect?.defectSource || "production",
        };
      });
      setTempPackagingValues(initialValues);
      setIsEditingPackaging(true);
    };

    const handleTempChange = (
      podId: number,
      field: "outputQty" | "defectQty" | "notes" | "assignedToUserId" | "defectSource",
      value: string,
    ) => {
      setTempPackagingValues((prev) => ({
        ...prev,
        [podId]: {
          ...prev[podId],
          [field]: value,
        },
      }));
    };

    const handleSaveAllPackaging = async () => {
      if (!proofingOrder?.proofingOrderDesigns) return;

      // Validate outputQty is not 0 or negative
      const hasZeroOrInvalid = proofingOrder.proofingOrderDesigns.some((pod: any) => {
        const values = tempPackagingValues[pod.id];
        if (!values) return true;
        const outQty = Number(values.outputQty);
        return isNaN(outQty) || outQty <= 0;
      });

      if (hasZeroOrInvalid) {
        toast.error("Số lượng ra phải lớn hơn 0!");
        return;
      }

      // Validate that if defectQty > 0, an employee (assignedToUserId) is selected!
      const missingEmployee = proofingOrder.proofingOrderDesigns.some((pod: any) => {
        const values = tempPackagingValues[pod.id];
        if (!values) return false;
        const defectQty = Number(values.defectQty) || 0;
        return defectQty > 0 && !values.assignedToUserId;
      });

      if (missingEmployee) {
        toast.error("Vui lòng chọn nhân viên chịu trách nhiệm lỗi!");
        return;
      }

      try {
        const itemsToUpdate = proofingOrder.proofingOrderDesigns
          .map((pod: any) => {
            const prodItem = productionItems.find(
              (i: any) =>
                i.proofingOrderDesignId === pod.id ||
                i.designId === pod.designId ||
                i.id === pod.id,
            );
            if (!prodItem) return null;
            const values = tempPackagingValues[pod.id] || {
              outputQty: "",
              defectQty: "",
              notes: "",
              assignedToUserId: "",
              defectSource: "production",
            };
            return {
              itemId: prodItem.id,
              outputQty: Number(values.outputQty) || 0,
              defectQty: Number(values.defectQty) || 0,
              notes: values.notes || "",
            };
          })
          .filter(Boolean) as any[];

        // 1. Bulk update the production order items in one database transaction
        await bulkUpdateOrderItems({
          productionOrderId: prod.id!,
          data: { items: itemsToUpdate },
        });

        // 2. Manage corresponding defect records
        const defectPromises = proofingOrder.proofingOrderDesigns.map(async (pod: any) => {
          const prodItem = productionItems.find(
            (i: any) =>
              i.proofingOrderDesignId === pod.id ||
              i.designId === pod.designId ||
              i.id === pod.id,
          );
          if (!prodItem) return;
          const values = tempPackagingValues[pod.id] || {
            outputQty: "",
            defectQty: "",
            notes: "",
            assignedToUserId: "",
            defectSource: "production",
          };
          const defectQtyNum = Number(values.defectQty) || 0;

          // Find existing defect record for this design/item
          const existingDefect = defectRecords.find(
            (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
          );

          // Calculate differences to avoid redundant API calls
          const oldDefectQty = existingDefect ? existingDefect.defectQuantity : 0;
          const oldWorkerId = existingDefect ? existingDefect.assignedToUserId?.toString() : "";
          const oldDefectSource = existingDefect ? existingDefect.defectSource : "production";
          const oldDescription = existingDefect ? existingDefect.description || "" : "";

          const newWorkerId = values.assignedToUserId || "";
          const newDefectSource = values.defectSource || "production";
          const newDescription = values.notes.trim() || `Lỗi ghi nhận tại khâu kiểm hàng cho mã hàng ${pod.design?.code || pod.design?.designName || ""}`;

          const isUnchanged =
            defectQtyNum === oldDefectQty &&
            newWorkerId === oldWorkerId &&
            newDefectSource === oldDefectSource &&
            (defectQtyNum === 0 || newDescription === oldDescription);

          if (!isUnchanged) {
            if (existingDefect) {
              if (defectQtyNum > 0) {
                // Update existing defect record
                await apiRequest.put(`/defect-records/${existingDefect.id}`, {
                  defectQuantity: defectQtyNum,
                  assignedToUserId: Number(newWorkerId),
                  defectSource: newDefectSource,
                  description: newDescription,
                });
              } else {
                // Delete existing defect record (quantity is 0)
                await apiRequest.delete(`/defect-records/${existingDefect.id}`);
              }
            } else {
              if (defectQtyNum > 0) {
                // Create new defect record
                await apiRequest.post("/defect-records", {
                  productionOrderId: prod.id!,
                  productionStepId: packagingStep?.id || undefined,
                  designId: pod.design?.id,
                  orderDetailId: pod.id,
                  defectQuantity: defectQtyNum,
                  description: newDescription,
                  defectSource: newDefectSource,
                  assignedToUserId: Number(newWorkerId),
                  defectOccurredAt: new Date().toISOString(),
                });
              }
            }
          }
        });

        await Promise.all(defectPromises);

        // Invalidate queries to refresh defect data in view mode
        queryClient.invalidateQueries({
          queryKey: defectRecordKeys.all,
        });

        setIsEditingPackaging(false);
      } catch (error) {
        console.error("Lỗi lưu thông tin đóng gói/lỗi sản xuất:", error);
        toast.error("Đã xảy ra lỗi khi lưu thông tin đóng gói hoặc lỗi sản xuất!");
      }
    };

    // Aggregate lamination info from order and all designs
    const laminationInfo = React.useMemo(() => {
      if (!proofingOrder) return null;

      const lams = new Set<string>();

      // 1. From order level
      if (proofingOrder.laminationTypeName)
        lams.add(proofingOrder.laminationTypeName);
      else if (proofingOrder.laminationType) {
        lams.add(
          laminationTypeLabels[proofingOrder.laminationType] ||
          proofingOrder.laminationType,
        );
      }

      // 2. From designs
      proofingOrder.proofingOrderDesigns?.forEach((pod: any) => {
        const designLam = pod.design?.laminationType;
        if (designLam) {
          lams.add(laminationTypeLabels[designLam] || designLam);
        }
      });

      return Array.from(lams).join(", ");
    }, [proofingOrder]);

    // Date formatter helper
    const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) return "—";
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(date);
      } catch (e) {
        return "—";
      }
    };

    const formatDateTimeWithSeconds = (dateString: string | undefined | null) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(date);
      } catch (e) {
        return null;
      }
    };

    return (
      <>
        <TableRow
          className={`border-b transition-all duration-300 ${isHighlighted
            ? "bg-amber-100/50 dark:bg-amber-900/30 font-medium border-amber-500 dark:border-amber-700"
            : isDraft
              ? "bg-blue-50/20 dark:bg-blue-900/10"
              : ""
            }`}
        >
          <TableCell className="p-1.5 text-center w-10 align-top pt-4 border-r border-border/40 bg-muted/10">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-md bg-background hover:bg-muted text-slate-700 shadow-sm border-slate-200"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Thu gọn" : "Mở rộng"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4.5 h-4.5 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
              )}
            </Button>
          </TableCell>
          <TableCell className="py-3 align-top font-bold text-sm text-primary bg-muted/20 border-r border-border/50 text-center w-[90px] max-w-[90px]">
            {isProofingLoading ? (
              <div className="flex justify-center mt-2">
                <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ) : prod.proofingOrderId ? (
              <div className="flex flex-col items-center justify-center mt-2 gap-1 px-1">
                {isExpanded ? (
                  <div className="flex flex-col items-center gap-1 px-2 py-0.5 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {prod.proofingOrderCode || (proofingOrder as any)?.code || `BB${prod.proofingOrderId}`}
                    </span>
                    {isOrderUrgent && (
                      <span className="px-1 py-0.5 rounded text-[8px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 leading-none">
                        GẤP
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1 py-0.5 text-slate-700 dark:text-slate-300 w-full justify-center flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 leading-none">
                      {prod.proofingOrderCode || (proofingOrder as any)?.code || `BB${prod.proofingOrderId}`}
                    </span>
                    {isOrderUrgent && (
                      <span className="px-1 py-0.5 rounded text-[8px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 leading-none shrink-0">
                        GẤP
                      </span>
                    )}
                    {orderImages.length > 0 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingImageUrl(orderImages[0]);
                        }}
                        className="w-7 h-7 rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-zoom-in hover:scale-105 transition-all duration-150 shrink-0 ml-1"
                        title="Xem nhanh hình ảnh bài in"
                      >
                        <img
                          src={orderImages[0]}
                          alt="Hình bài"
                          className="w-full h-full object-cover select-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {prod.customerName && (
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-normal break-words text-center leading-tight line-clamp-3 px-1 mb-1">
                    {prod.customerName}
                  </span>
                )}

                {/* Hình ảnh bài in với Carousel (Mũi tên & Cuộn chuột) */}
                {isExpanded && orderImages.length > 0 && (
                  <div className="mt-1 flex flex-col items-center gap-1 shrink-0">
                    <div
                      ref={imageContainerRef}
                      className="relative w-16 h-16 rounded border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-slate-50 dark:bg-slate-900 group/img cursor-zoom-in shrink-0"
                    >
                      <img
                        src={orderImages[activeImageIdx]}
                        alt="Hình bài"
                        className="w-full h-full object-cover select-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingImageUrl(orderImages[activeImageIdx]);
                        }}
                      />

                      {orderImages.length > 1 && (
                        <>
                          {/* Mũi tên trái */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) => (prev - 1 + orderImages.length) % orderImages.length);
                            }}
                            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 border border-slate-700/50"
                            title="Hình trước"
                          >
                            <ChevronLeft className="w-3 h-3 stroke-[3]" />
                          </button>

                          {/* Mũi tên phải */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) => (prev + 1) % orderImages.length);
                            }}
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 border border-slate-700/50"
                            title="Hình sau"
                          >
                            <ChevronRight className="w-3 h-3 stroke-[3]" />
                          </button>

                          {/* Chỉ số trang */}
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-slate-900/75 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm tracking-tighter select-none">
                            {activeImageIdx + 1}/{orderImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Nút hủy lệnh SX */}
                {isExpanded && !isDraft && materialExportStep?.status !== "done" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelDialog(true);
                    }}
                    className="mt-1.5 flex items-center text-[9px] font-bold bg-red-600 hover:bg-red-700 text-white rounded px-1.5 py-0.5 transition-all duration-150 w-full justify-center"
                  >
                    Hủy SX
                  </button>
                )}

                {/* Hiển thị thời gian bình bài xong bên dưới hình/mã */}
                {isExpanded && (() => {
                  const finishedTime = proofingOrder?.completedAt || proofingOrder?.updatedAt;
                  const formatted = formatDateTimeWithSeconds(finishedTime);
                  if (!formatted) return null;
                  return (
                    <div className="text-[9px] text-muted-foreground text-center leading-tight font-medium max-w-[90px] whitespace-normal break-words mt-1 border-t border-dashed border-slate-200 dark:border-slate-800 pt-1 w-full">
                      <span className="block font-bold text-slate-500 uppercase tracking-tighter text-[8px] mb-0.5">Xong BB:</span>
                      <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-400">{formatted}</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex justify-center mt-2 text-muted-foreground font-normal">
                —
              </div>
            )}
          </TableCell>
          <StepCell
            step={materialExportStep}
            isEnabled={isMaterialExportEnabled}
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
          />
          <TableCell className="py-3 align-top w-[120px] max-w-[120px] text-center">
            {isProofingLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : !prod.proofingOrderId ? (
              <div className="text-sm font-medium text-muted-foreground flex flex-col items-center justify-center p-4 bg-muted/20 border-2 border-dashed rounded-lg text-center">
                <Package className="w-6 h-6 mb-2 opacity-50" />
                Không có thông tin bình bài đính kèm
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 text-sm items-center text-center">
                {/* 1. Trạng thái IN (Đưa lên đầu cho đồng bộ) */}
                {printStep && (
                  <div className={cn("w-full", isExpanded && "pb-3 border-b border-dashed")}>
                    {/* <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Trạng thái In:</div> */}
                    <InlineStepStatus step={printStep} isEnabled={isPrintEnabled} defaultPrintQty={defaultPrintQty} />
                  </div>
                )}

                {/* 2. Header & General Info */}
                {isExpanded && (
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Trạng thái công đoạn In đã chuyển lên đầu */}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px] text-center w-full">
                      <div>
                        <span className="text-muted-foreground font-medium">Chất liệu: </span>
                        <span className="font-bold text-foreground">
                          {(() => {
                            const designTypeName = displayDesignType || "";
                            const materialTypeName = proofingOrder?.materialType?.name || "";
                            const displayMatName = designTypeName 
                              ? materialTypeName.toLowerCase() 
                              : materialTypeName;
                            const basisWeightVal = displayBasisWeight ? ` ${displayBasisWeight}` : "";
                            return `${designTypeName} ${displayMatName}${basisWeightVal}`.trim() || "—";
                          })()}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-muted/50 pt-1 mt-0.5">
                        <span className="text-muted-foreground font-medium">Khổ giấy: </span>
                        <span className="font-bold text-foreground">
                          {proofingOrder?.paperSize?.name || proofingOrder?.customPaperSize || "—"} mm
                        </span>
                      </div>

                      <div className="border-t border-dashed border-muted/50 pt-1 mt-0.5">
                        <span className="text-muted-foreground font-medium">Số lượng in: </span>
                        <span className="font-bold text-blue-600">
                          {String(
                            proofingOrder?.totalProcessedQty ||
                            proofingOrder?.totalQuantity ||
                            "0",
                          )} tờ
                        </span>
                      </div>

                      {(() => {
                        const method = (proofingOrder?.plateExport?.productionMethod || "").toLowerCase();
                        const isOutsource = method === "outsource";
                        const partnerName = proofingOrder?.plateExport?.printingVendorName || proofingOrder?.plateExport?.printingVendor?.name;
                        if (isOutsource && partnerName) {
                          return (
                            <div className="border-t border-dashed border-muted/50 pt-1 mt-0.5">
                              <span className="text-muted-foreground font-medium">In gia công: </span>
                              <span className="font-bold text-orange-600">
                                {partnerName}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {(prod.notes || proofingOrder?.notes || proofingOrder?.additionalNotes) && (
                        <div className="flex flex-col border-t border-dashed border-muted/50 pt-1.5 mt-0.5">
                          <span className="text-muted-foreground font-medium mb-0.5">
                            Ghi chú:
                          </span>
                          <span className="font-medium text-amber-700 break-words whitespace-pre-wrap italic leading-snug">
                            {prod.notes || proofingOrder?.notes || proofingOrder?.additionalNotes}
                          </span>
                        </div>
                      )}
                    </div>

                    {isDraft && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-600 font-bold animate-pulse">
                        <PlayCircle className="w-3.5 h-3.5" />
                        ĐANG KHỞI TẠO LỆNH...
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Thông tin khuôn bế & Kẽm (Buttons + Popovers) */}
                {isExpanded && proofingOrder?.plateExport && (
                  <div className="flex flex-row gap-2 mt-1 w-full justify-center">
                    <div className="flex flex-col items-center w-full max-w-[110px]">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="cursor-help text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase flex items-center justify-center gap-1 border border-blue-200/40 dark:border-blue-800/40 rounded bg-blue-50/30 dark:bg-blue-950/10 py-0.5 px-1.5 mt-1.5 w-full hover:bg-blue-100/40 dark:hover:bg-blue-900/40 transition-colors">
                            <FileText className="w-2.5 h-2.5" /> Kẽm
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-[250px] p-2 bg-blue-50/95 dark:bg-blue-950/95 border-blue-200/50 dark:border-blue-800/50" align="center">
                          {[proofingOrder?.plateExport]
                            .filter(Boolean)
                            .map((plateExport: any, i: number) => {
                              const isInHouse = (plateExport.productionMethod || "").toLowerCase() !== "outsource";
                              const partnerName = plateExport.printingVendorName || plateExport.printingVendor?.name;
                              const receiveTime = plateExport.isReceived && plateExport.receivedAt
                                ? formatDate(plateExport.receivedAt)
                                : plateExport.estimatedReceiveAt
                                  ? `${formatDate(plateExport.estimatedReceiveAt)} (Dự kiến)`
                                  : "—";

                              return (
                                <div
                                  key={plateExport.id || i}
                                  className="flex flex-col gap-1 text-[11px]"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">
                                      Mã kẽm:
                                    </span>
                                    <span className="font-bold text-foreground">
                                      {plateExport.id ? `ZK${plateExport.id}` : "—"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">
                                      Số lượng:
                                    </span>
                                    <span className="font-bold text-amber-700 dark:text-amber-500">
                                      {plateExport.plateCount || "—"} bản
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-blue-900/30 pt-0.5">
                                    <span className="text-muted-foreground font-medium">
                                      Hình thức in:
                                    </span>
                                    <span className="font-bold text-foreground">
                                      {isInHouse ? "In tại xưởng" : "In gia công"}
                                    </span>
                                  </div>
                                  {!isInHouse && partnerName && (
                                    <div className="flex flex-col pt-0.5 border-t border-blue-100/50 dark:border-blue-900/30">
                                      <span className="text-muted-foreground font-medium">
                                        Đơn vị gia công:
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        {partnerName}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-blue-900/30 pt-0.5">
                                    <span className="text-muted-foreground font-medium">
                                      Thời gian nhận:
                                    </span>
                                    <span className="font-semibold text-foreground">
                                      {receiveTime}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">
                                      Tình trạng:
                                    </span>
                                    <span className={cn(
                                      "font-semibold",
                                      plateExport.isReceived ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                      {plateExport.isReceived ? "Đã nhận" : "Chưa nhận"}
                                    </span>
                                  </div>
                                  {/* Ghi chú Kẽm */}
                                  {(plateExport.notes || plateExport.plate?.notes) && (
                                    <div className="flex flex-col pt-0.5 border-t border-blue-100/50 dark:border-blue-900/30 mt-0.5">
                                      <span className="text-muted-foreground font-medium text-[10px]">
                                        Ghi chú:
                                      </span>
                                      <span className="italic text-amber-700 dark:text-amber-500 break-words font-medium whitespace-pre-wrap">
                                        {plateExport.notes || plateExport.plate?.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </HoverCardContent>
                      </HoverCard>
                      <span className={cn(
                        "text-[8px] font-extrabold mt-0.5 text-center leading-none whitespace-nowrap",
                        proofingOrder?.plateExport?.isReceived ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {proofingOrder?.plateExport?.isReceived ? "Đã nhận kẽm" : "Chưa nhận kẽm"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TableCell>
          <StepCell
            step={specialProcessStep}
            isEnabled={isSpecialProcessEnabled}
            className="w-[70px] max-w-[70px] px-1 text-center"
            info={
              isExpanded && specialProcessStep?.stepTypeName && (
                <div className="text-[13px] font-bold text-amber-600 dark:text-amber-400 italic uppercase mt-1">
                  {specialProcessStep.stepTypeName}
                </div>
              )
            }
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
          />
          <StepCell
            step={laminationStep}
            isEnabled={isLaminationEnabled}
            className="w-[80px] max-w-[80px] px-1 text-center"
            info={
              isExpanded && laminationInfo && (
                <div className="text-[13px] font-bold text-primary italic uppercase mt-1">
                  {laminationInfo}
                </div>
              )
            }
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
          />
          <StepCell
            step={dieCutStep}
            isEnabled={isDieCutEnabled}
            className="w-[80px] max-w-[80px] px-1 text-center"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
            info={
              isExpanded &&
              ((proofingOrder as any)?.dieExports?.length > 0 ||
                (proofingOrder as any)?.proofingOrderDies?.length > 0) && (
                <div onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const allDies = [
                      ...((proofingOrder as any).dieExports || []),
                      ...((proofingOrder as any).proofingOrderDies || []),
                    ];
                    const uniqueDies = allDies.filter(
                      (die, index, self) =>
                        index ===
                        self.findIndex(
                          (d) =>
                            (d.id && d.id === die.id) ||
                            (d.code && d.code === die.code),
                        ),
                    );

                    if (uniqueDies.length === 0) return null;

                    const allReceived = uniqueDies.every((d: any) => {
                      const dieCode = (d.code || d.die?.code || "").trim();
                      const pCode = (proofingOrder?.code || "").trim();
                      const isNewDie = !!(dieCode && pCode && dieCode.toLowerCase() === pCode.toLowerCase());
                      return d.isReceived || !isNewDie;
                    });

                    return (
                      <div className="flex flex-col items-center w-full">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="cursor-help text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1.5 mt-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full">
                              <Box className="w-3 h-3" /> khuôn bế
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-[250px] p-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="center">
                            <div className="flex flex-col gap-1.5 w-full">
                              {uniqueDies.map((dieExport: any, i: number) => {
                                const dieImg = dieExport.die?.imageUrl || dieExport.imageUrl;
                                const locationKey = dieExport.die?.location;
                                const displayLocation = locationKey
                                  ? (dieLocationLabels[locationKey] ||
                                    dieLocationLabels[Object.keys(dieLocationLabels).find(k => k.toLowerCase() === locationKey.toLowerCase()) || ""] ||
                                    locationKey)
                                  : "Trong kho";

                                const dieCode = (dieExport.code || dieExport.die?.code || "").trim();
                                const pCode = (proofingOrder?.code || "").trim();
                                const isNewDie = dieCode && pCode && dieCode.toLowerCase() === pCode.toLowerCase();

                                return (
                                  <div
                                    key={dieExport.id || i}
                                    className="flex flex-col gap-1 text-left text-[11px] border-b border-slate-100 dark:border-slate-800 last:border-0 pb-1.5 last:pb-0"
                                  >
                                    {dieImg && (
                                      <div
                                        className="relative w-full aspect-video rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden mb-1.5 cursor-zoom-in hover:brightness-95 transition-all"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingImageUrl(dieImg);
                                        }}
                                        title="Nhấp để phóng to hình khuôn bế"
                                      >
                                        <img
                                          src={dieImg}
                                          alt="Hình ảnh khuôn"
                                          className="w-full h-full object-contain select-none"
                                        />
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                        Mã khuôn:
                                      </span>
                                      <span className="font-bold text-foreground">
                                        {dieExport.code || dieExport.die?.code || "—"}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                        Kích thước:
                                      </span>
                                      <span className="font-bold text-amber-700 dark:text-amber-500">
                                        {dieExport.size ||
                                          (dieExport.die
                                            ? formatDieSize(dieExport.die)
                                            : "—")}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-0.5">
                                      <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                        Tình trạng:
                                      </span>
                                      <span className="font-bold text-green-600 dark:text-green-400">
                                        {displayLocation}
                                      </span>
                                    </div>

                                    <div className="flex flex-col border-t border-slate-200 dark:border-slate-700 pt-0.5">
                                      <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                        Loại khuôn:
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        {isNewDie ? "Sử dụng khuôn bế mới" : "Sử dụng khuôn bế cũ"}
                                      </span>
                                    </div>

                                    {isNewDie && (
                                      <>
                                        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-0.5">
                                          <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                            Trạng thái nhận:
                                          </span>
                                          <span className={cn(
                                            "font-bold",
                                            dieExport.isReceived ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                                          )}>
                                            {dieExport.isReceived ? "Đã nhận" : "Chưa nhận"}
                                          </span>
                                        </div>

                                        {dieExport.isReceived ? (
                                          dieExport.receivedAt && (
                                            <div className="flex flex-col border-t border-slate-200 dark:border-slate-700 pt-0.5">
                                              <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                                Thời gian nhận:
                                              </span>
                                              <span className="font-semibold text-foreground">
                                                {formatDate(dieExport.receivedAt)}
                                              </span>
                                            </div>
                                          )
                                        ) : (
                                          dieExport.estimatedReceiveAt && (
                                            <div className="flex flex-col border-t border-slate-200 dark:border-slate-700 pt-0.5">
                                              <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                                Hẹn có khuôn:
                                              </span>
                                              <span className="font-semibold text-foreground">
                                                {formatDate(dieExport.estimatedReceiveAt)}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </>
                                    )}

                                    {/* Ghi chú Khuôn */}
                                    {(dieExport.notes || dieExport.die?.notes || dieExport.dieExportNotes) && (
                                      <div className="flex flex-col pt-0.5 border-t border-slate-200 dark:border-slate-700 mt-0.5">
                                        <span className="text-[9px] text-muted-foreground font-medium uppercase">
                                          Ghi chú:
                                        </span>
                                        <span className="italic text-amber-700 dark:text-amber-500 break-words font-medium whitespace-pre-wrap">
                                          {dieExport.notes || dieExport.die?.notes || dieExport.dieExportNotes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <span className={cn(
                          "text-[9px] font-bold mt-1 text-center leading-none",
                          allReceived ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                        )}>
                          {allReceived ? "Đã nhận khuôn" : "Chưa nhận khuôn"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )
            }
          />
          <StepCell
            step={cutStep}
            isEnabled={isCutEnabled}
            className="w-[68px] max-w-[68px] px-1 text-center"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
          />
          <StepCell
            step={glueStep}
            isEnabled={isGlueEnabled}
            className="w-[68px] max-w-[68px] px-1 text-center"
            defaultPrintQty={defaultPrintQty}
            productionItems={productionItems}
          />
          <TableCell
            className="align-top py-3 px-1.5 w-[230px] max-w-[230px]"
          >
            <div className="flex flex-col gap-2">
              {isProofingLoading ? (
                <div className="flex justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : prod.proofingOrderId ? (
                <>
                  {/* Universal Status & Edit/Save Buttons for Packaging column */}
                  <div className={cn("pb-2 mb-2", isExpanded && "border-b border-dashed")}>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        {(packagingStep ||
                          steps.find((s) => s.stepType === "packaging")) && (
                            <InlineStepStatus
                              step={
                                (packagingStep ||
                                  steps.find((s) => s.stepType === "packaging"))!
                              }
                              isEnabled={isPackagingEnabled}
                              isStatusLocked={true}
                              defaultPrintQty={defaultPrintQty}
                            />
                          )}
                      </div>
                      {isExpanded && (
                        <div className="shrink-0">
                          {isEditingPackaging ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] bg-slate-50 hover:bg-slate-100"
                                onClick={() => setIsEditingPackaging(false)}
                              >
                                Hủy
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 px-2.5 text-[10px] bg-[#93631F] hover:bg-[#7a521a] text-white font-bold"
                                onClick={handleSaveAllPackaging}
                              >
                                Lưu
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-[11px] font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
                              disabled={!isPackagingEnabled}
                              onClick={startEditingPackaging}
                            >
                              Sửa
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && proofingOrder?.proofingOrderDesigns && (
                    <div className="flex flex-col gap-2 divide-y divide-dashed">
                      {proofingOrder.proofingOrderDesigns
                        .map((pod: any, idx: number) => {
                          const matchingStep =
                            steps.find((s) => {
                              const isPackaging =
                                s.stepType === "packaging" ||
                                (s.stepTypeName &&
                                  ["đóng gói", "giao hàng"].some((k) =>
                                    s.stepTypeName!.toLowerCase().includes(k),
                                  ));
                              if (!isPackaging) return false;
                              const name = s.stepTypeName?.toLowerCase() || "";
                              const designCode =
                                pod.design?.code?.toLowerCase() || "";
                              const designName =
                                pod.design?.designName?.toLowerCase() || "";
                              return (
                                (designCode && name.includes(designCode)) ||
                                (designName && name.includes(designName))
                              );
                            }) || packagingStep;

                          if (!matchingStep) return null;

                          const prodItem = productionItems.find(
                            (i: any) =>
                              i.proofingOrderDesignId === pod.id ||
                              i.designId === pod.designId ||
                              i.id === pod.id,
                          );

                          return (
                            <div key={`${pod.id}-${matchingStep.id}`} className="grid grid-cols-[1fr_auto] gap-1.5 py-1.5 first:pt-0 border-b border-dashed last:border-0">
                              <div className="bg-muted/10 p-1.5 text-xs flex gap-1.5 rounded border border-border/40 w-full items-start">
                                {(() => {
                                  const designImgUrl = pod.designImageUrl || pod.design?.designImageUrl || pod.design?.designImageUrlConverted || pod.thumbnailUrl || pod.design?.thumbnailUrl;
                                  if (!designImgUrl) return null;
                                  return (
                                    <div className="w-10 h-10 shrink-0 border rounded bg-white overflow-hidden flex items-center justify-center cursor-zoom-in shadow-sm hover:ring-1 hover:ring-primary/30 transition-all mt-0.5">
                                      <img
                                        src={designImgUrl}
                                        alt={pod.design?.code || "design"}
                                        className="w-full h-full object-contain"
                                        onClick={() => setViewingImageUrl(designImgUrl)}
                                      />
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <p className="font-extrabold text-[12px] text-slate-800 dark:text-slate-200 leading-tight mb-1 break-all flex items-center flex-wrap gap-1">
                                    <span>
                                      {highlightText(
                                        pod.design?.designName || pod.design?.code || "—",
                                        searchTerm
                                      )}
                                    </span>
                                    {(pod.isUrgent || pod.design?.isUrgent) && (
                                      <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 leading-none shrink-0 align-middle ml-1">
                                        GẤP
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex flex-col gap-1 text-[10px] mt-1 leading-snug">
                                    <div>
                                      <span className="text-muted-foreground">Mã: </span>
                                      <span className="font-bold text-foreground">
                                        {pod.design?.code
                                          ? highlightText(pod.design.code, searchTerm)
                                          : "—"}
                                      </span>
                                      <span className="text-muted-foreground font-semibold"> - SL: </span>
                                      <span className="font-bold text-amber-700">
                                        {pod.quantity}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">Kích thước: </span>
                                      <span className="font-bold text-foreground">
                                        {pod.design?.dimensions
                                          ? String(pod.design.dimensions)
                                          : "—"}
                                      </span>
                                    </div>

                                    {(pod.notes || pod.design?.notes) && (
                                      <div className="flex flex-col gap-0.5 mt-0.5 pt-0.5 border-t border-muted/20">
                                        <span className="font-bold text-amber-700 break-words whitespace-pre-wrap italic leading-tight text-[10px]">
                                          {pod.notes || pod.design?.notes}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col justify-center min-w-[80px]">
                                {isEditingPackaging ? (
                                  <div className="flex flex-col gap-1.5 min-w-[80px]">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] font-bold text-emerald-600 uppercase w-4 shrink-0 text-center">Ra</span>
                                      <Input
                                        type="number"
                                        value={tempPackagingValues[pod.id]?.outputQty ?? ""}
                                        onChange={(e) => handleTempChange(pod.id, "outputQty", e.target.value)}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        className="h-7 text-[12px] px-1.5 py-0 focus-visible:ring-emerald-500 font-bold tabular-nums"
                                        data-output-qty-index={idx}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            const nextInput = document.querySelector(
                                              `[data-output-qty-index="${idx + 1}"]`
                                            ) as HTMLInputElement;
                                            if (nextInput) {
                                              nextInput.focus();
                                              nextInput.select();
                                            } else {
                                              const firstDefectInput = document.querySelector(
                                                `[data-defect-qty-index="0"]`
                                              ) as HTMLInputElement;
                                              if (firstDefectInput) {
                                                firstDefectInput.focus();
                                                firstDefectInput.select();
                                              } else {
                                                handleSaveAllPackaging();
                                              }
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] font-bold text-red-600 uppercase w-4 shrink-0 text-center">Lỗi</span>
                                      <Input
                                        type="number"
                                        value={tempPackagingValues[pod.id]?.defectQty ?? ""}
                                        onChange={(e) => handleTempChange(pod.id, "defectQty", e.target.value)}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        className="h-7 text-[12px] px-1.5 py-0 focus-visible:ring-red-500 font-bold text-red-600 tabular-nums"
                                        data-defect-qty-index={idx}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            const nextInput = document.querySelector(
                                              `[data-defect-qty-index="${idx + 1}"]`
                                            ) as HTMLInputElement;
                                            if (nextInput) {
                                              nextInput.focus();
                                              nextInput.select();
                                            } else {
                                              handleSaveAllPackaging();
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                    {Number(tempPackagingValues[pod.id]?.defectQty) > 0 && (
                                      <div className="flex flex-col gap-1.5 border-t border-dashed pt-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex flex-col gap-0.5 text-left">
                                          <span className="text-[9px] font-bold text-red-600 uppercase">Nhân viên lỗi</span>
                                          <AsyncSelect
                                            value={tempPackagingValues[pod.id]?.assignedToUserId || ""}
                                            onValueChange={(val) => handleTempChange(pod.id, "assignedToUserId", val?.toString() || "")}
                                            loadOptions={loadUsersOptions}
                                            placeholder="Chọn nhân viên..."
                                            emptyMessage="Không tìm thấy"
                                            className="w-full text-[10px] h-7 min-h-7"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-left">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Nguồn lỗi</span>
                                          <Select
                                            value={tempPackagingValues[pod.id]?.defectSource || "production"}
                                            onValueChange={(val) => handleTempChange(pod.id, "defectSource", val)}
                                          >
                                            <SelectTrigger className="h-7 text-[10px] px-1.5 py-0 bg-background border-muted">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="design" className="text-xs">Lỗi thiết kế</SelectItem>
                                              <SelectItem value="proofing" className="text-xs">Lỗi bình bài</SelectItem>
                                              <SelectItem value="production" className="text-xs">Lỗi sản xuất</SelectItem>
                                              <SelectItem value="management_decision" className="text-xs">Quyết định QL</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}
                                    <Input
                                      placeholder="Ghi chú..."
                                      className="h-7 w-full text-[10px] px-1.5 py-0 bg-background mt-0.5 border-amber-200 focus:border-amber-500"
                                      value={tempPackagingValues[pod.id]?.notes ?? ""}
                                      onChange={(e) => handleTempChange(pod.id, "notes", e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col justify-center min-w-[65px] text-[11px]">
                                    <div className="flex items-center justify-between gap-1 leading-normal">
                                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter text-[10px]">
                                        Ra
                                      </span>
                                      <span className="font-extrabold text-emerald-700 tabular-nums">
                                        {prodItem?.outputQty != null
                                          ? prodItem.outputQty
                                          : prodItem?.producedQty != null
                                            ? prodItem.producedQty
                                            : 0}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 leading-normal">
                                      <span className="font-extrabold text-red-600 dark:text-red-400 uppercase tracking-tighter text-[10px]">
                                        Lỗi
                                      </span>
                                      <span className="font-extrabold text-red-600 tabular-nums">
                                        {prodItem?.defectQty != null ? prodItem.defectQty : 0}
                                      </span>
                                    </div>

                                    {(() => {
                                      const matchingDefects = defectRecords.filter(
                                        (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
                                      );
                                      if (matchingDefects.length === 0) return null;
                                      return (
                                        <div className="text-[9px] text-muted-foreground mt-1 border-t border-dashed pt-1 space-y-1 text-left">
                                          {matchingDefects.map((dr: any) => (
                                            <div key={dr.id} className="flex flex-col gap-0.5 border-b border-dotted last:border-0 pb-0.5 last:pb-0">
                                              <div className="flex justify-between items-center gap-1 font-semibold text-foreground">
                                                <span className="truncate max-w-[80px]" title={dr.assignedToUserName}>
                                                  {dr.assignedToUserName}
                                                </span>
                                                <span className="font-bold text-red-600 shrink-0">
                                                  {dr.defectQuantity}
                                                </span>
                                              </div>
                                              {dr.defectSourceDisplay && (
                                                <span className="text-[8px] text-red-500 italic block">
                                                  ({dr.defectSourceDisplay})
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}

                                    {prodItem?.notes && (
                                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-500 break-words leading-tight border-l-2 border-amber-500/50 pl-1 mt-1 bg-amber-50/30 dark:bg-amber-900/10 py-0.5">
                                        {prodItem.notes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  )}

                  {/* Save/Edit buttons removed from bottom, moved to the top of column */}
                </>
              ) : packagingSteps.length > 0 ? (
                <div className="flex flex-col gap-2 divide-y divide-dashed">
                  {packagingSteps.map((step) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      isCheckStep={isExpanded}
                      isEnabled={isPackagingEnabled}
                      showName={packagingSteps.length > 1}
                      defaultPrintQty={defaultPrintQty}
                      productionItems={productionItems}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 bg-primary/[0.08] dark:bg-primary/[0.15] text-primary/40 font-black text-lg italic border-r border-border/40">
                  —
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>

        {/* Dialog xác nhận hủy lệnh sản xuất */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent
            className="max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Hủy lệnh sản xuất
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-1">
                Bạn có chắc muốn hủy lệnh sản xuất{" "}
                <span className="font-bold text-foreground">
                  {(proofingOrder as any)?.code ||
                    `BB${(proofingOrder as any)?.id}` ||
                    "này"}
                </span>
                ?
                <br />
                <span className="text-red-500 font-medium text-xs mt-1 block">
                  Hành động này không thể hoàn tác.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={isCancelling}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!prod.id) return;
                  setIsCancelling(true);
                  try {
                    await deleteProductionOrder(prod.id);
                    setShowCancelDialog(false);
                  } finally {
                    setIsCancelling(false);
                  }
                }}
              >
                <XCircle className="w-4 h-4" />
                Xác nhận hủy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



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
    if (prevProps.onStartProduction !== nextProps.onStartProduction) return false;

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
  onStartProduction,
}: ProductionListTableProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto [&>div]:!overflow-visible"
      >
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-8 p-0 text-center" />
                <TableHead className="h-10 font-bold text-sm text-center w-[90px] max-w-[90px] bg-muted/50 border-r border-border/50">
                  MÃ BB
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  XUẤT VẬT TƯ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[120px] max-w-[120px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[70px] max-w-[70px]">
                  QUY TRÌNH
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[80px] max-w-[80px]">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[80px] max-w-[80px]">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[68px] max-w-[68px]">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[68px] max-w-[68px]">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[230px] max-w-[230px]">
                  KIỂM HÀNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={10} rows={5} rowHeight="h-32" />
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
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-8 p-0 text-center bg-muted/50" />
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[90px] max-w-[90px] bg-muted/50 border-r border-border/50">
                  MÃ BB
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  XUẤT VẬT TƯ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[120px] max-w-[120px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[70px] max-w-[70px]">
                  QUY TRÌNH
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[80px] max-w-[80px]">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[80px] max-w-[80px]">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[68px] max-w-[68px]">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[68px] max-w-[68px]">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[230px] max-w-[230px]">
                  KIỂM HÀNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((prod: ProductionOrderResponse) => (
                <ProductionTableRow
                  key={prod.id || `draft-${prod.proofingOrderId}`}
                  prod={prod}
                  searchTerm={searchTerm}
                  onProductionClick={onProductionClick}
                  onStartProduction={onStartProduction}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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


