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
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Hash,
  Box,
  Package,
  Save,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productionStepStatusLabels } from "@/lib/status-utils";
import type {
  ProductionOrderResponse,
  ProductionStepResponse,
  ProofingOrderResponse,
} from "@/Schema";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { useUpdateProductionStep } from "@/hooks/use-production";
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
import { useState } from "react";

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

// Outer helper to get status colors
function getStatusColorClass(status: string) {
  switch (status) {
    case "pending":
      return "text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800/80";
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

// Inner component to render each row and fetch proofing details
function ProductionTableRow({
  prod,
  onClick,
}: {
  prod: ProductionOrderResponse;
  onClick: () => void;
}) {
  const [openDiePopover, setOpenDiePopover] = useState(false);
  const [openPlatePopover, setOpenPlatePopover] = useState(false);

  const { data: proofingOrderData, isLoading } = useProofingOrder(
    prod.proofingOrderId || null,
    !!prod.proofingOrderId,
  );
  const proofingOrder = proofingOrderData as any;

  const { mutate: updateStep } = useUpdateProductionStep();

  const steps = prod.steps || [];

  // Extract steps based on requested columns
  const laminationStep = getStepStatus(
    steps,
    ["cán màng", "cán"],
    "lamination",
  );
  const cutStep = getStepStatus(steps, ["cắt"], "cut");
  const pasteStep = getStepStatus(steps, ["bồi"]);
  const dieCutStep = getStepStatus(steps, ["bế"], "die_cut");
  const glueStep = getStepStatus(steps, ["dán"], "glue");
  const checkStep = getStepStatus(steps, ["kiểm hàng", "kiểm tra"]);
  const deliveryStep = getStepStatus(
    steps,
    ["giao hàng", "đóng gói", "giao"],
    "packaging",
  );

  const defaultPrintQty =
    (proofingOrder as any)?.totalProcessedQty ||
    (proofingOrder as any)?.totalQuantity ||
    0;

  const printStep = steps.find(
    (s) =>
      s.stepType === "print" ||
      s.stepTypeName?.toLowerCase() === "in" ||
      s.stepTypeName?.toLowerCase() === "in ấn",
  );

  const InlineStepStatus = ({ step }: { step: ProductionStepResponse }) => {
    const handleStatusChange = (newStatus: string) => {
      updateStep({
        stepId: step.id!,
        data: {
          status: newStatus,
          inputQty: step.inputQty || defaultPrintQty || undefined,
          outputQty: step.outputQty || defaultPrintQty || undefined,
          defectQty: step.defectQty || undefined,
        },
      });
    };

    return (
      <div
        className="flex items-center gap-1.5 h-7"
        onClick={(e) => e.stopPropagation()}
      >
        <Select
          value={step.status || "pending"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            className={`h-7 min-w-[105px] text-[10px] px-2 font-bold border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(
              step.status || "pending",
            )}`}
          >
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="pending"
              className="text-xs font-semibold cursor-pointer"
            >
              Chưa thực hiện
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
              Đã hoàn thành
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const StepCell = ({
    step,
    isCheckStep = false,
  }: {
    step: ProductionStepResponse | null;
    isCheckStep?: boolean;
  }) => {
    if (!step)
      return (
        <TableCell className="text-center py-3 text-muted-foreground">
          —
        </TableCell>
      );

    // Auto-fill with proofing order qty if step qty not yet set (or zero)
    const initialInputQty = step.inputQty
      ? step.inputQty.toString()
      : defaultPrintQty
        ? String(defaultPrintQty)
        : "";
    const initialOutputQty = step.outputQty
      ? step.outputQty.toString()
      : defaultPrintQty
        ? String(defaultPrintQty)
        : "";
    const [inputQty, setInputQty] = useState(initialInputQty);
    const [outputQty, setOutputQty] = useState(initialOutputQty);
    const [defectQty, setDefectQty] = useState(
      step.defectQty?.toString() || "",
    );

    React.useEffect(() => {
      setInputQty(
        step.inputQty
          ? step.inputQty.toString()
          : defaultPrintQty
            ? String(defaultPrintQty)
            : "",
      );
      setOutputQty(
        step.outputQty
          ? step.outputQty.toString()
          : defaultPrintQty
            ? String(defaultPrintQty)
            : "",
      );
      setDefectQty(step.defectQty?.toString() || "");
    }, [step.inputQty, step.outputQty, step.defectQty, defaultPrintQty]);

    const handleUpdate = (
      updates: Partial<{
        status: any;
        inputQty: number;
        outputQty: number;
        defectQty: number;
      }>,
    ) => {
      if (step.id) {
        updateStep({
          stepId: step.id,
          data: {
            status: step.status,
            inputQty: Number(inputQty) || 0,
            outputQty: Number(outputQty) || 0,
            defectQty: Number(defectQty) || 0,
            ...updates,
          },
        });
      }
    };

    return (
      <TableCell
        className="align-top py-3 px-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5 w-[140px] mx-auto">
          <Select
            value={step.status || "pending"}
            onValueChange={(val: any) => handleUpdate({ status: val })}
          >
            <SelectTrigger
              className={`h-7 text-[10px] font-bold w-full border-transparent focus:ring-0 shadow-sm ${getStatusColorClass(step.status || "pending")}`}
            >
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="pending"
                className="text-xs font-semibold cursor-pointer"
              >
                Chưa thực hiện
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
                Đã hoàn thành
              </SelectItem>
            </SelectContent>
          </Select>

          {isCheckStep && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                  Vào
                </span>
                <Input
                  type="number"
                  className="h-5 w-14 text-[10px] px-1 py-0 text-right bg-background"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  onBlur={() => {
                    handleUpdate({ inputQty: Number(inputQty) || 0 });
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">
                  Ra
                </span>
                <Input
                  type="number"
                  className="h-5 w-14 text-[10px] px-1 py-0 text-right font-medium text-emerald-700 bg-background"
                  value={outputQty}
                  onChange={(e) => setOutputQty(e.target.value)}
                  onBlur={() => {
                    handleUpdate({ outputQty: Number(outputQty) || 0 });
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter text-red-600 dark:text-red-400">
                  Lỗi
                </span>
                <Input
                  type="number"
                  className="h-5 w-14 text-[10px] px-1 py-0 text-right font-medium text-red-600 bg-background"
                  value={defectQty}
                  onChange={(e) => setDefectQty(e.target.value)}
                  onBlur={() => {
                    handleUpdate({ defectQty: Number(defectQty) || 0 });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </TableCell>
    );
  };

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
    <TableRow
      className="cursor-pointer hover:bg-muted/50 border-b"
      onClick={onClick}
    >
      <TableCell className="py-3 align-top font-bold text-base text-primary whitespace-nowrap bg-muted/20 border-r border-border/50 text-center w-[150px]">
        {isLoading ? (
          <div className="flex justify-center mt-2">
            <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
          </div>
        ) : proofingOrder ? (
          <div className="flex flex-col items-center justify-center mt-2">
            <span>{(proofingOrder as any).code || `BB${(proofingOrder as any).id}`}</span>
          </div>
        ) : (
          <div className="flex justify-center mt-2 text-muted-foreground font-normal">
            —
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 align-top min-w-[300px]">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        ) : proofingOrder ? (
          <div className="flex flex-col gap-2.5 text-sm">
            {/* 1. Header & General Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-wrap items-center gap-2">
                  {printStep && (
                    <div className="flex items-center gap-1.5">
                      <InlineStepStatus step={printStep} />
                    </div>
                  )}
                </div>
                {/* <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full font-semibold border text-muted-foreground">
                  {String(prod.code || `PROD-${prod.id}`)}
                </span> */}
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-xs">

                <span className="text-muted-foreground font-medium">
                  Chất liệu:
                </span>
                <span className="font-bold text-foreground">
                  {(proofingOrder as any).materialType?.name || "—"}
                </span>

                <span className="text-muted-foreground font-medium">
                  Số giấy in:
                </span>
                <span className="font-bold text-foreground text-blue-600">
                  {String(
                    (proofingOrder as any).totalProcessedQty ||
                      (proofingOrder as any).totalQuantity ||
                      "0",
                  )}{" "}
                  tờ
                </span>
              </div>
            </div>

            {/* 2. Thiết kế */}
            {(proofingOrder as any).proofingOrderDesigns &&
              (proofingOrder as any).proofingOrderDesigns.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[13px] text-foreground flex items-center gap-1.5 uppercase">
                    <Layers className="w-3.5 h-3.5" /> Thiết kế (
                    {(proofingOrder as any).proofingOrderDesigns.length})
                  </span>
                  <div className="space-y-2">
                    {(proofingOrder as any).proofingOrderDesigns.map(
                      (pod: any) => (
                        <div
                          key={pod.id}
                          className="bg-muted/20 p-2.5 rounded-md text-xs"
                        >
                          <p className="font-bold text-[13px] text-foreground mb-2">
                            {pod.design?.designName || pod.design?.code || "—"}
                          </p>
                          <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-xs">
                            <span className="text-muted-foreground font-medium">
                              Số lượng:
                            </span>
                            <span className="font-bold text-foreground text-amber-700">
                              {pod.quantity} sản phẩm
                            </span>

                            <span className="text-muted-foreground font-medium">
                              Mã thiết kế:
                            </span>
                            <span className="font-bold text-foreground">
                              {pod.design?.code || "—"}
                            </span>

                            <span className="text-muted-foreground font-medium">
                              Kích thước:
                            </span>
                            <span className="font-bold text-foreground break-all">
                              {pod.design?.dimensions
                                ? String(pod.design.dimensions)
                                : "—"}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* 3. Thông tin khuôn bế & Kẽm (Buttons + Popovers) */}
            <div className="flex flex-row gap-2 mt-1">
              {((proofingOrder as any).dieExports?.length > 0 ||
                (proofingOrder as any).proofingOrderDies?.length > 0) && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Popover
                    open={openDiePopover}
                    onOpenChange={setOpenDiePopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/50"
                        onMouseEnter={() => setOpenDiePopover(true)}
                        onMouseLeave={() => setOpenDiePopover(false)}
                      >
                        <Box className="w-3.5 h-3.5 text-slate-500" />
                        Thông tin khuôn bế
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      className="w-80 p-0 shadow-lg"
                      onMouseEnter={() => setOpenDiePopover(true)}
                      onMouseLeave={() => setOpenDiePopover(false)}
                    >
                      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-b border-border/50">
                        <span className="font-bold text-[13px] text-foreground flex items-center gap-1.5 uppercase">
                          <Box className="w-3.5 h-3.5" /> Thông tin khuôn bế
                        </span>
                      </div>
                      <div className="p-3 max-h-[300px] overflow-y-auto space-y-2">
                        {(
                          (proofingOrder as any).dieExports ||
                          (proofingOrder as any).proofingOrderDies ||
                          []
                        ).map((dieExport: any, i: number) => (
                          <div
                            key={dieExport.id || i}
                            className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-md border text-xs grid grid-cols-2 gap-y-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Mã số khuôn
                              </span>
                              <span className="font-bold text-foreground">
                                {dieExport.die?.code || "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Kích thước
                              </span>
                              <span className="font-semibold text-foreground">
                                {dieExport.die
                                  ? dieExport.die.length && dieExport.die.width
                                    ? `${dieExport.die.length}x${dieExport.die.width}`
                                    : "—"
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Tình trạng khuôn
                              </span>
                              <span className="font-semibold text-green-600">
                                {dieExport.die?.location || "Có thể sử dụng"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                Ngày xuất khuôn
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatDate(dieExport.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {(proofingOrder as any).plateExport && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Popover
                    open={openPlatePopover}
                    onOpenChange={setOpenPlatePopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-900/50"
                        onMouseEnter={() => setOpenPlatePopover(true)}
                        onMouseLeave={() => setOpenPlatePopover(false)}
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Thông tin kẽm
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      className="w-80 p-0 shadow-lg"
                      onMouseEnter={() => setOpenPlatePopover(true)}
                      onMouseLeave={() => setOpenPlatePopover(false)}
                    >
                      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-b border-border/50">
                        <span className="font-bold text-[13px] text-foreground flex items-center gap-1.5 uppercase">
                          <FileText className="w-3.5 h-3.5" /> Thông tin kẽm
                        </span>
                      </div>
                      <div className="p-3 max-h-[300px] overflow-y-auto space-y-2">
                        {[(proofingOrder as any).plateExport]
                          .filter(Boolean)
                          .map((plateExport: any, i: number) => (
                            <div
                              key={plateExport.id || i}
                              className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-md border text-xs grid grid-cols-2 gap-y-2"
                            >
                              <div className="flex flex-col col-span-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Mã số kẽm
                                </span>
                                <span className="font-bold text-foreground">
                                  {plateExport.id ? `ZK${plateExport.id}` : "—"}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Chất liệu (NCC)
                                </span>
                                <span className="font-semibold text-foreground">
                                  {plateExport.vendorName ||
                                    plateExport.plateVendor?.name ||
                                    "Tâm An"}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Số lượng / Độ dày
                                </span>
                                <span className="font-bold text-amber-700">
                                  {plateExport.plateCount || "—"} bản
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Ngày xuất kẽm
                                </span>
                                <span className="font-semibold text-foreground">
                                  {formatDate(
                                    plateExport.createdAt ||
                                      plateExport.exportedAt,
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Tình trạng kẽm
                                </span>
                                <span className="font-semibold text-blue-600">
                                  Đã nhận
                                </span>
                              </div>

                              <div className="flex flex-col col-span-2 pt-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Ghi chú
                                </span>
                                <span className="font-semibold italic text-muted-foreground">
                                  {plateExport.notes || "—"}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
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
      <StepCell step={laminationStep} />
      <StepCell step={cutStep} />
      <StepCell step={pasteStep} />
      <StepCell step={dieCutStep} />
      <StepCell step={glueStep} />
      <StepCell step={checkStep} isCheckStep={true} />
      <StepCell step={deliveryStep} />
    </TableRow>
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
}: ProductionListTableProps) {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={tableContainerRef} className="flex-1 overflow-auto [&>div]:!overflow-visible">
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 font-bold text-sm text-center w-[150px] bg-muted/50 border-r border-border/50">
                  <div className="flex items-center justify-center gap-1.5">
                    MÃ BÌNH BÀI
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowDebug(true)}
                      title="Debug API Data"
                    >
                      <Bug className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="h-10 font-bold text-sm w-[300px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  BỒI
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  KIỂM HÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">
                  GIAO HÀNG
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
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap w-[150px] bg-muted/50 border-r border-border/50">
                  <div className="flex items-center justify-center gap-1.5">
                    MÃ BÌNH BÀI
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowDebug(true)}
                      title="Debug API Data"
                    >
                      <Bug className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="h-10 font-bold text-sm w-[300px]">
                  LỆNH IN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  CÁN MÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  CẮT
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  BỒI
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  BẾ
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  DÁN
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  KIỂM HÀNG
                </TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">
                  GIAO HÀNG
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((prod: ProductionOrderResponse) => (
                <ProductionTableRow
                  key={prod.id}
                  prod={prod}
                  onClick={() => onProductionClick(prod.id!)}
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

      {showDebug && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-[90vw] h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden relative border">
            <div className="flex justify-between items-center px-4 py-3 border-b bg-muted/40">
              <h2 className="font-bold text-[15px] flex items-center gap-2">
                <Bug className="h-4 w-4 text-emerald-600" /> 
                Debug API Data (productions)
              </h2>
              <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold" onClick={() => setShowDebug(false)}>
                Đóng
              </Button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs dark:text-emerald-400 text-emerald-700 bg-slate-950">
              <pre>{JSON.stringify(productions, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
