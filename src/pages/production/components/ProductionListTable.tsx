import React from "react";
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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
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
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
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
  useProductionOrder,
} from "@/hooks/use-production";
import { useCreateStockOutForProduction } from "@/hooks/use-stock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMaterials } from "@/hooks/use-material";
import { formatDieSize } from "@/utils/format-die-size";

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
  const effectiveStatus = !status || status === "pending" ? "ready" : status;
  switch (effectiveStatus) {
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
          !step.status || step.status === "pending" ? "ready" : step.status
        }
        onValueChange={handleStatusChange}
        disabled={!isEnabled}
      >
        <SelectTrigger
          className={`h-7 min-w-[105px] text-[10px] px-2 font-bold border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(
            !step.status || step.status === "pending" ? "ready" : step.status,
          )} ${isStatusLocked ? "opacity-100 select-none" : ""}`}
        >
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="ready"
            className="text-xs font-semibold cursor-pointer"
          >
            Sẵn sàng
          </SelectItem>
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
  onShowMaterialExport?: () => void;
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
  onShowMaterialExport,
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
      ? initialOutputQtyOverride.toString()
      : step.outputQty
        ? step.outputQty.toString()
        : defaultPrintQty
          ? String(defaultPrintQty)
          : "";
  const computedDefectQty =
    isPackagingItem && initialDefectQtyOverride !== null
      ? initialDefectQtyOverride.toString()
      : step.defectQty?.toString() || "";

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
        ? initialOutputQtyOverride.toString()
        : step.outputQty
          ? step.outputQty.toString()
          : defaultPrintQty
            ? String(defaultPrintQty)
            : "",
    );
    setDefectQty(
      isPackagingItem && initialDefectQtyOverride !== null
        ? initialDefectQtyOverride.toString()
        : step.defectQty?.toString() || "",
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
          status: updates.status || step.status,
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
              !step.status || step.status === "pending" ? "ready" : step.status
            }
            onValueChange={(val: any) => handleUpdate({ status: val })}
            disabled={!isEnabled}
          >
            <SelectTrigger
              className={`h-7 text-[10px] font-bold w-full border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(!step.status || step.status === "pending" ? "ready" : step.status)} ${!isEnabled ? "opacity-30 grayscale" : ""} ${isStatusLocked ? "opacity-100 pointer-events-none select-none" : ""}`}
            >
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="ready"
                className="text-xs font-semibold cursor-pointer"
              >
                Sẵn sàng
              </SelectItem>
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
          {step.stepType === "material_export" && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 mt-1 text-[10px] w-full bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
              disabled={!isEnabled || step.status === "done"}
              onClick={() => onShowMaterialExport?.()}
            >
              Xuất nguyên liệu
            </Button>
          )}
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
              // Auto-jump to ready when clicking Edit (requested by user)
              if (step.status !== "ready" && step.id) {
                updateStep({
                  stepId: step.id,
                  data: {
                    status: "ready",
                    inputQty: step.inputQty || undefined,
                    outputQty: step.outputQty || undefined,
                    defectQty: step.defectQty || undefined,
                  },
                });
              }
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
              handleUpdate({
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
  onShowMaterialExport?: () => void;
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
  onShowMaterialExport,
}: StepCellProps) {
  // If no step AND no info, show empty
  if (!step && !info)
    return (
      <TableCell className="text-center py-3 bg-primary/[0.08] dark:bg-primary/[0.15] text-primary/40 font-black text-lg italic border-r border-border/40">
        —
      </TableCell>
    );

  return (
    <TableCell
      className="align-top py-3 px-1.5 w-[85px] max-w-[85px]"
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
            onShowMaterialExport={onShowMaterialExport}
          />
        )}
        {info && <div className="w-full text-center">{info}</div>}
      </div>
    </TableCell>
  );
}

// Inner component to render each row and fetch proofing details
function ProductionTableRow({
  prod,
  onProductionClick,
  onStartProduction,
}: {
  prod: ProductionOrderResponse;
  onProductionClick: (id: number) => void;
  onStartProduction: (proofingOrderId: number) => void;
}) {
  const [openDiePopover, setOpenDiePopover] = useState(false);
  const [openPlatePopover, setOpenPlatePopover] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMaterialExportDialog, setShowMaterialExportDialog] = useState(false);

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
      !!prod.proofingOrderId,
    );
  const proofingOrder = (proofingOrderData || prod.proofingOrder) as any;

  const { data: detailedProd, isLoading: isProdDetailLoading } =
    useProductionOrder(prod.id || null, !isDraft);
  const productionItems =
    (detailedProd as any)?.items || (prod as any).items || [];

  const { mutate: updateStep } = useUpdateProductionStep();
  const { mutate: updateOrderItem } = useUpdateProductionOrderItem();
  const { mutateAsync: createStockOutForProduction } = useCreateStockOutForProduction();

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

  return (
    <>
      <TableRow
        className={`border-b ${isDraft ? "bg-blue-50/20 dark:bg-blue-900/10" : ""}`}
      >
        <TableCell className="py-3 align-top font-bold text-sm text-primary bg-muted/20 border-r border-border/50 text-center w-[90px] max-w-[90px]">
          {isProofingLoading ? (
            <div className="flex justify-center mt-2">
              <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
            </div>
          ) : proofingOrder ? (
            <div className="flex flex-col items-center justify-center mt-2 gap-1 px-1">
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                  !isDraft ? "cursor-pointer text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" : "text-muted-foreground"
                )}
                onClick={() => !isDraft && onProductionClick(prod.id!)}
                title={!isDraft ? "Xem chi tiết lệnh sản xuất" : ""}
              >
                <span className="font-bold underline decoration-blue-400/30 underline-offset-4">
                  {(proofingOrder as any).code || `BB${(proofingOrder as any).id}`}
                </span>
                {!isDraft && <ExternalLink className="w-3 h-3" />}
              </div>

              {prod.customerName && (
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-normal break-words text-center leading-tight line-clamp-3 px-1">
                  {prod.customerName}
                </span>
              )}
              {/* Nút hủy lệnh SX */}
              {!isDraft && (
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
          isStatusLocked={true}
          defaultPrintQty={defaultPrintQty}
          productionItems={productionItems}
          onShowMaterialExport={() => setShowMaterialExportDialog(true)}
        />
        <TableCell className="py-3 align-top w-[120px] max-w-[120px]">
          {isProofingLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          ) : proofingOrder ? (
            <div className="flex flex-col gap-2.5 text-sm">
              {/* 1. Trạng thái IN (Đưa lên đầu cho đồng bộ) */}
              {printStep && (
                <div className="pb-3 border-b border-dashed">
                  {/* <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Trạng thái In:</div> */}
                  <InlineStepStatus step={printStep} isEnabled={isPrintEnabled} defaultPrintQty={defaultPrintQty} />
                </div>
              )}

              {/* 2. Header & General Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Trạng thái công đoạn In đã chuyển lên đầu */}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-bold uppercase text-[9px] mb-0.5">
                      Chất liệu:
                    </span>
                    <span className="font-bold text-foreground leading-tight text-[11px]">
                      {proofingOrder?.materialType?.name || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col border-t border-dashed border-muted/50 pt-1 mt-0">
                    <span className="text-muted-foreground font-bold uppercase text-[9px] mb-0.5">
                      Khổ giấy:
                    </span>
                    <span className="font-bold text-foreground leading-tight text-[11px]">
                      {proofingOrder?.paperSize?.name || proofingOrder?.customPaperSize || "—"} cm
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-muted/50 pt-1.5 mt-0.5">
                    <span className="text-muted-foreground font-medium">
                      Số lượng in:
                    </span>
                    <span className="font-bold text-blue-600">
                      {String(
                        proofingOrder?.totalProcessedQty ||
                          proofingOrder?.totalQuantity ||
                          "0",
                      )}{" "}
                      tờ
                    </span>
                  </div>
                  
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

              {/* 4. Thông tin khuôn bế & Kẽm (Buttons + Popovers) */}
              <div className="flex flex-row gap-2 mt-1">
                {(proofingOrder as any).plateExport && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="cursor-help text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center justify-center gap-1.5 border border-blue-200/50 dark:border-blue-800/50 rounded bg-blue-50/50 dark:bg-blue-950/20 p-1 mt-2 w-full hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-colors">
                        <FileText className="w-3 h-3" /> Thông tin kẽm
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[250px] p-2 bg-blue-50/95 dark:bg-blue-950/95 border-blue-200/50 dark:border-blue-800/50" align="start">
                      {[(proofingOrder as any).plateExport]
                        .filter(Boolean)
                        .map((plateExport: any, i: number) => (
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
                            <div className="flex flex-col pt-0.5 border-t border-blue-100/50 dark:border-blue-900/30">
                              <span className="text-muted-foreground font-medium">
                                Nhà cung cấp:
                              </span>
                              <span className="font-semibold text-foreground">
                                {plateExport.vendorName ||
                                  plateExport.plateVendor?.name ||
                                  "Tâm An"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-blue-900/30 pt-0.5">
                              <span className="text-muted-foreground font-medium">
                                Ngày xuất:
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatDate(
                                  plateExport.createdAt || plateExport.exportedAt,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground font-medium">
                                Tình trạng:
                              </span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                Đã nhận
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
                        ))}
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground flex flex-col items-center justify-center p-4 bg-muted/20 border-2 border-dashed rounded-lg">
              <Package className="w-6 h-6 mb-2 opacity-50" />
              Không có thông tin bình bài đính kèm
            </div>
          )}
        </TableCell>
        <StepCell
          step={specialProcessStep}
          isEnabled={isSpecialProcessEnabled}
          info={
            specialProcessStep?.stepTypeName && (
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
          info={
            laminationInfo && (
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
          defaultPrintQty={defaultPrintQty}
          productionItems={productionItems}
          info={
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

              return (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="cursor-help text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1.5 mt-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full">
                      <Box className="w-3 h-3" /> khuôn bế
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-[250px] p-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" align="center">
                    <div className="flex flex-col gap-1.5 w-full">
                      {uniqueDies.map((dieExport: any, i: number) => (
                        <div
                          key={dieExport.id || i}
                          className="flex flex-col gap-1 text-left text-[11px] border-b border-slate-100 dark:border-slate-800 last:border-0 pb-1.5 last:pb-0"
                        >
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
                              {dieExport.die?.location || "Có thể dùng"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">
                              Ngày xuất:
                            </span>
                            <span className="font-bold text-foreground">
                              {formatDate(dieExport.createdAt)}
                            </span>
                          </div>
                          
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
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })()}
              </div>
            )
          }
        />
        <StepCell step={cutStep} isEnabled={isCutEnabled} defaultPrintQty={defaultPrintQty} productionItems={productionItems} />
        <StepCell step={glueStep} isEnabled={isGlueEnabled} defaultPrintQty={defaultPrintQty} productionItems={productionItems} />
        <TableCell
          className="align-top py-3 px-1.5 w-[180px] max-w-[180px]"
        >
          <div className="flex flex-col gap-2">
            {isProofingLoading || isProdDetailLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : proofingOrder?.proofingOrderDesigns &&
              proofingOrder.proofingOrderDesigns.length > 0 ? (
              <>
                {/* Universal Status for Packaging column */}
                {(packagingStep ||
                  steps.find((s) => s.stepType === "packaging")) && (
                  <div className="pb-2 border-b border-dashed mb-1">
                    <InlineStepStatus
                      step={
                        (packagingStep ||
                          steps.find((s) => s.stepType === "packaging"))!
                      }
                      isEnabled={isPackagingEnabled}
                      isStatusLocked={true}
                      defaultPrintQty={defaultPrintQty}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 divide-y divide-dashed">
                  {proofingOrder.proofingOrderDesigns
                    .map((pod: any) => {
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
                        <div key={`${pod.id}-${matchingStep.id}`} className="grid grid-cols-[1fr_auto] gap-3 py-2 first:pt-0 border-b border-dashed last:border-0">
                          <div className="bg-muted/20 p-2.5 rounded-md text-xs">
                            <p className="font-bold text-[13px] text-foreground mb-1.5 break-all">
                              {pod.design?.designName ||
                                pod.design?.code ||
                                "—"}
                            </p>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <div className="flex justify-between items-center gap-1 border-b border-muted/50 pb-1">
                                <span className="text-muted-foreground font-medium whitespace-nowrap">
                                  Số lượng:
                                </span>
                                <span className="font-bold text-foreground text-amber-700 text-right">
                                  {pod.quantity} SP
                                </span>
                              </div>

                              <div className="flex justify-between items-center gap-1 border-b border-muted/50 pb-1">
                                <span className="text-muted-foreground font-medium whitespace-nowrap">
                                  Mã:
                                </span>
                                <span className="font-bold text-foreground text-right truncate">
                                  {pod.design?.code || "—"}
                                </span>
                              </div>

                              <div className="flex justify-between items-center gap-1">
                                <span className="text-muted-foreground font-medium whitespace-nowrap">
                                  Kích thước:
                                </span>
                                <span className="font-bold text-foreground text-right truncate">
                                  {pod.design?.dimensions
                                    ? String(pod.design.dimensions)
                                    : "—"}
                                </span>
                              </div>
                              
                              {(pod.notes || pod.design?.notes) && (
                                <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-muted/30">
                                  <span className="font-bold text-amber-700 break-words whitespace-pre-wrap italic leading-tight text-[11px]">
                                    {pod.notes || pod.design?.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center min-w-[80px]">
                            <StepItem
                              step={matchingStep}
                              isCheckStep={true}
                              isEnabled={isPackagingEnabled}
                              showName={false}
                              hideStatus={true}
                              isPackagingItem={true}
                              productionItemId={prodItem ? prodItem.id : null}
                              productionOrderId={prod.id}
                              initialOutputQtyOverride={
                                prodItem?.outputQty != null
                                  ? prodItem.outputQty
                                  : prodItem?.producedQty != null
                                    ? prodItem.producedQty
                                    : null
                              }
                              initialDefectQtyOverride={
                                prodItem?.defectQty != null
                                  ? prodItem.defectQty
                                  : null
                              }
                              defaultPrintQty={defaultPrintQty}
                              productionItems={productionItems}
                            />
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              </>
            ) : packagingSteps.length > 0 ? (
              <div className="flex flex-col gap-2 divide-y divide-dashed">
                {packagingSteps.map((step) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    isCheckStep={true}
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
              onClick={(e) => {
                e.stopPropagation();
                // TODO: gọi API hủy lệnh SX ở đây
                setShowCancelDialog(false);
              }}
            >
              <XCircle className="w-4 h-4" />
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showMaterialExportDialog && materialExportStep && prod.id && (
        <MaterialExportDialog
          isOpen={showMaterialExportDialog}
          onOpenChange={setShowMaterialExportDialog}
          productionOrderId={prod.id}
          proofingOrder={proofingOrder}
          defaultPrintQty={Number(materialExportStep.inputQty) || defaultPrintQty || 1}
          onExportSuccess={() => {
            if (materialExportStep && materialExportStep.id && materialExportStep.status !== "done") {
              updateStep({
                stepId: materialExportStep.id,
                data: {
                  status: "done",
                  inputQty: materialExportStep.inputQty || undefined,
                  outputQty: materialExportStep.outputQty || undefined,
                  defectQty: materialExportStep.defectQty || undefined,
                }
              });
            }
          }}
        />
      )}
    </>
  );
}

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
                <TableHead className="h-10 font-bold text-sm text-center w-[90px] max-w-[90px] bg-muted/50 border-r border-border/50">
                  MÃ BB
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  XUẤT NL
                </TableHead>
                <TableHead className="h-10 font-bold text-sm w-[120px] max-w-[120px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  QUY TRÌNH 
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[85px] max-w-[85px]">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center w-[180px] max-w-[180px]">
                  KIỂM HÀNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={9} rows={5} rowHeight="h-32" />
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
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[90px] max-w-[90px] bg-muted/50 border-r border-border/50">
                  MÃ BB
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  XUẤT NL
                </TableHead>
                <TableHead className="h-10 font-bold text-sm w-[120px] max-w-[120px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  QUY TRÌNH ĐB
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[85px] max-w-[85px]">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[180px] max-w-[180px]">
                  KIỂM HÀNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((prod: ProductionOrderResponse) => (
                <ProductionTableRow
                  key={prod.id || `draft-${prod.proofingOrderId}`}
                  prod={prod}
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

export function MaterialExportDialog({
  isOpen,
  onOpenChange,
  productionOrderId,
  proofingOrder,
  defaultPrintQty,
  onExportSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number;
  proofingOrder: any;
  defaultPrintQty: number;
  onExportSuccess?: () => void;
}) {
  const { data: materialsData, isLoading: isMaterialsLoading } = useMaterials(
    { pageSize: 100 }
  );
  const materials = (materialsData as any)?.items || [];
  
  const { mutateAsync: createStockOutForProduction, isPending } = useCreateStockOutForProduction();
  // State for selected export items
  const [selectedItems, setSelectedItems] = useState<{materialId: string, quantity: string}[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
    }
  }, [isOpen]);

  const handleSelectMaterial = (matId: string) => {
    if (!selectedItems.find(i => i.materialId === matId)) {
      setSelectedItems([...selectedItems, { 
        materialId: matId, 
        quantity: defaultPrintQty?.toString() || "1" 
      }]);
    }
    setMaterialSearchOpen(false);
  };

  const handleRemoveItem = (matId: string) => {
    setSelectedItems(selectedItems.filter(item => item.materialId !== matId));
  };

  const handleQuantityChange = (matId: string, qty: string) => {
    setSelectedItems(selectedItems.map(item => 
      item.materialId === matId ? { ...item, quantity: qty } : item
    ));
  };

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nguyên vật liệu");
      return;
    }
    
    const payloadItems = selectedItems.map(item => {
      const mat = materials.find((m: any) => m.id?.toString() === item.materialId);
      return {
        itemName: mat?.name || proofingOrder?.materialType?.name || "Nguyên liệu",
        itemCode: mat?.code || proofingOrder?.materialType?.code || "NL",
        unit: mat?.unit || "Tờ",
        quantity: Number(item.quantity) || 1,
        notes: "",
        materialId: Number(item.materialId) || proofingOrder?.materialTypeId || null,
        orderDetailId: proofingOrder?.orderDetailId || null
      };
    });
    
    try {
      await createStockOutForProduction({
        productionOrderId,
        itemType: "material",
        notes: "Xuất NL cho lệnh sản xuất",
        stockOutDate: new Date().toISOString(),
        items: payloadItems
      });
      onOpenChange(false);
      onExportSuccess?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Xuất Nguyên Liệu</DialogTitle>
          <DialogDescription>
            Tìm và chọn các loại vật tư cần xuất cho đơn này
          </DialogDescription>
        </DialogHeader>
        
        {isMaterialsLoading ? (
          <div className="py-8 flex justify-center shrink-0">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Tìm chọn nguyên vật liệu</Label>
              <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialSearchOpen}
                    className="w-full justify-between font-normal text-muted-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nhấn để tìm và thêm vật tư...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Tìm kiếm loại giấy, màng..." className="h-9" />
                    <CommandList className="max-h-[250px]">
                      <CommandEmpty>Không tìm thấy NVL nào.</CommandEmpty>
                      <CommandGroup>
                        {materials.map((m: any) => {
                          const isSelected = selectedItems.some(i => i.materialId === m.id!.toString());
                          return (
                            <CommandItem
                              key={m.id}
                              value={m.name || m.code || ""}
                              onSelect={() => handleSelectMaterial(m.id!.toString())}
                              className={cn("py-2", isSelected && "opacity-50 pointer-events-none")}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{m.name}</span>
                                <span className="text-[11px] text-muted-foreground flex gap-2">
                                  {m.code && <span>Mã: {m.code}</span>}
                                  {m.stockQuantity !== undefined && (
                                    <span className="text-blue-600">Tồn: {m.stockQuantity} {m.unit || 'Tờ'}</span>
                                  )}
                                </span>
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

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Kích thước tham khảo từ thiết kế:</Label>
              <div className="h-8 px-3 py-1 bg-muted/30 rounded-md text-sm border flex items-center text-muted-foreground">
                {proofingOrder?.paperSize
                  ? [
                      proofingOrder.paperSize.name,
                      proofingOrder.paperSize.width && proofingOrder.paperSize.height
                        ? `(${proofingOrder.paperSize.width} x ${proofingOrder.paperSize.height} cm)`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : proofingOrder?.customPaperSize || "Không xác định"}
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="space-y-3 mt-6 pt-4 border-t">
                <Label>Các vật tư đã chọn xuất</Label>
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const mat = materials.find((m: any) => m.id?.toString() === item.materialId);
                    return (
                      <div key={item.materialId} className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" title={mat?.name}>
                            {mat?.name || "Nguyên liệu"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {mat?.stockQuantity !== undefined ? `Tồn kho: ${mat.stockQuantity} ${mat?.unit || 'Tờ'}` : "Không rõ tồn kho"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantity} 
                              onChange={e => handleQuantityChange(item.materialId, e.target.value)} 
                              className="h-8 w-20 text-right font-bold tabular-nums"
                            />
                            <span className="text-xs font-medium text-muted-foreground w-6">
                              {mat?.unit || "Tờ"}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.materialId)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="shrink-0 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Hủy</Button>
          <Button onClick={handleConfirm} disabled={isPending || isMaterialsLoading || selectedItems.length === 0}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Xác nhận xuất ({selectedItems.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
