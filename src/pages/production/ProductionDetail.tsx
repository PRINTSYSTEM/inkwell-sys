import { useState, useEffect, useMemo, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Edit,
  User,
  AlertCircle,
  Package,
  Layers,
  FileText,
  AlertTriangle,
  Loader2,
  Download,
  Scissors,
  Maximize2,
  Palette,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  productionStatusLabels,
  productionStepStatusLabels,
  proofingStatusLabels,
} from "@/lib/status-utils";
import {
  useProductionOrder,
  useUpdateProductionStep,
  useAssignProductionWorker,
} from "@/hooks/use-production";
import {
  useStockOutsByProductionOrder,
  useCompleteStockOut,
} from "@/hooks/use-stock";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { IdSchema } from "@/Schema";
import { toast } from "sonner";
import { useUsers } from "@/hooks/use-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDieSize } from "@/utils/format-die-size";
import {
  MaterialExportDialog,
  DieCutStepDialog,
  CompletionDialog,
  DefectRecordDialog,
} from "@/components/production";
import { productionStepTypeLabels } from "@/lib/status-utils";

export default function ProductionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // New dialog states for step-specific dialogs
  const [isMaterialExportDialogOpen, setIsMaterialExportDialogOpen] =
    useState(false);
  const [isDieCutStartDialogOpen, setIsDieCutStartDialogOpen] = useState(false);
  const [isDieCutCompleteDialogOpen, setIsDieCutCompleteDialogOpen] =
    useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isDefectRecordDialogOpen, setIsDefectRecordDialogOpen] = useState(false);
  const [defectPrefilledStepId, setDefectPrefilledStepId] = useState<number | null>(null);
  const [defectPrefilledDesignId, setDefectPrefilledDesignId] = useState<number | null>(null);
  const [defectPrefilledQuantity, setDefectPrefilledQuantity] = useState<number | null>(null);
  const [defectPrefilledDescription, setDefectPrefilledDescription] = useState<string | null>(null);

  // Form states
  const [progressPercent, setProgressPercent] = useState("0");
  const [wastage, setWastage] = useState("0");
  const [producedQty, setProducedQty] = useState("1");
  const [defectNotes, setDefectNotes] = useState("");
  const [startNotes, setStartNotes] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  // Worker search state (debounced to avoid spamming API)
  const [workerSearch, setWorkerSearch] = useState("");
  const [debouncedWorkerSearch] = useDebounce(workerSearch, 400);

  // Track selected worker for each step (single worker per step)
  const [selectedWorkersByStep, setSelectedWorkersByStep] = useState<
    Record<number, number | null>
  >({});
  const [isEditingWorker, setIsEditingWorker] = useState<
    Record<number, boolean>
  >({});

  const idValue = params.id ? Number(params.id) : Number.NaN;
  const idValid = IdSchema.safeParse(idValue).success;

  // Use new production order API
  const {
    data: production,
    isLoading,
    error,
  } = useProductionOrder(idValid ? idValue : null, idValid);

  // Fetch proofing order details
  const { data: proofingOrder, isLoading: isLoadingProofingOrder } =
    useProofingOrder(
      production?.proofingOrderId || null,
      idValid && !!production?.proofingOrderId
    );

  const { mutate: updateStep, isPending: updating } = useUpdateProductionStep();
  const { mutateAsync: assignWorker, isPending: assigning } =
    useAssignProductionWorker();
  const { mutateAsync: completeStockOutAsync } = useCompleteStockOut();

  // Fetch stock outs for this production order to find material export stock out
  const { data: stockOutsData } = useStockOutsByProductionOrder(
    production?.id || null,
    idValid && !!production?.id
  );
  const stockOuts: any[] = Array.isArray(stockOutsData) ? stockOutsData : [];

  // Sync selected worker with API response when production data changes
  useEffect(() => {
    if (production?.steps) {
      setSelectedWorkersByStep((prev) => {
        const merged = { ...prev };
        let hasChanges = false;

        production.steps?.forEach((step) => {
          if (step.id) {
            const stepId = step.id;
            const apiAssignedId = step.assignedToId;

            // Sync from API if not currently editing this step
            if (!isEditingWorker[stepId]) {
              if (apiAssignedId !== merged[stepId]) {
                merged[stepId] = apiAssignedId || null;
                hasChanges = true;
              }
            }
          }
        });

        return hasChanges ? merged : prev;
      });
    }
  }, [production?.steps, isEditingWorker]);

  // Sync selected worker with API response when production data changes
  useEffect(() => {
    if (production?.steps) {
      setSelectedWorkersByStep((prev) => {
        const merged = { ...prev };
        let hasChanges = false;

        production.steps?.forEach((step) => {
          if (step.id) {
            const stepId = step.id;
            const apiAssignedId = step.assignedToId;

            // Sync from API if not currently editing this step
            if (!isEditingWorker[stepId]) {
              if (apiAssignedId !== merged[stepId]) {
                merged[stepId] = apiAssignedId || null;
                hasChanges = true;
              }
            }
          }
        });

        return hasChanges ? merged : prev;
      });
    }
  }, [production?.steps, isEditingWorker]);

  const { data: usersResponse } = useUsers({
    pageNumber: 1,
    pageSize: 50,
    role: "production",
    isActive: true,
    search: debouncedWorkerSearch || undefined,
  } as any);
  const workers = usersResponse?.items || [];

  // Use updating for both starting and completing
  const starting = updating;
  const completing = updating;

  useEffect(() => {
    if (production) {
      setProgressPercent(production.progressPercent?.toString() || "0");
      // ProductionOrderResponse doesn't have defectNotes at order level - it's on steps
      setDefectNotes("");
      setWastage(
        production.totalWastage !== undefined &&
          production.totalWastage !== null
          ? production.totalWastage.toString()
          : "0"
      );
      // Set default producedQty from production order if available
      if (production.producedQty) {
        setProducedQty(production.producedQty.toString());
      } else if (proofingOrder?.totalQuantity) {
        setProducedQty(proofingOrder.totalQuantity.toString());
      }
    }
  }, [production, proofingOrder]);

  const sortedSteps = useMemo(() => {
    if (!production?.steps || production.steps.length === 0) return [];
    return [...production.steps]
      .filter((step) => step.id && step.stepOrder !== undefined)
      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
  }, [production?.steps]);

  const stepStats = useMemo(() => {
    const total = sortedSteps.length;
    const inProgress = sortedSteps.filter(
      (step) => step.status === "in_progress"
    ).length;
    const done = sortedSteps.filter((step) => step.status === "done").length;
    const ready = sortedSteps.filter((step) => step.status === "ready").length;
    return { total, inProgress, done, ready };
  }, [sortedSteps]);

  // Find the first READY step to start (theorically only one READY step at a time)
  // According to business logic: PENDING → READY → IN_PROGRESS → DONE
  // When previous step is DONE, next step automatically changes from PENDING to READY
  const firstReadyStep = useMemo(() => {
    return sortedSteps.find((step) => step.status === "ready") || null;
  }, [sortedSteps]);

  // Find the current active step (in_production)
  const currentActiveStep = useMemo(() => {
    return sortedSteps.find((step) => step.status === "in_progress") || null;
  }, [sortedSteps]);

  // Find the step to complete (only the current active IN_PROGRESS step)
  // According to business logic: Only IN_PROGRESS steps can be completed
  const stepToComplete = useMemo(() => {
    return currentActiveStep; // Only complete active IN_PROGRESS step
  }, [currentActiveStep]);

  // Determine which buttons to show based on steps
  // According to business logic:
  // - "Bắt đầu": Only show when there's a READY step (not PENDING)
  // - "Cập nhật": Only show when there's an IN_PROGRESS step
  // - "Hoàn thành": Only show when there's an IN_PROGRESS step
  const showStartButton = useMemo(() => {
    return !!firstReadyStep && firstReadyStep.id;
  }, [firstReadyStep]);

  const showUpdateButton = useMemo(() => {
    return !!currentActiveStep && currentActiveStep.id;
  }, [currentActiveStep]);

  const showCompleteButton = useMemo(() => {
    return (
      !!currentActiveStep &&
      currentActiveStep.id &&
      currentActiveStep.status === "in_progress"
    );
  }, [currentActiveStep]);

  // Check if step is the last step (for completion dialog with stock-in)
  const isLastStep = useMemo(() => {
    if (!stepToComplete || !sortedSteps.length) return false;
    const lastStep = sortedSteps[sortedSteps.length - 1];
    return stepToComplete.id === lastStep.id;
  }, [stepToComplete, sortedSteps]);

  // Determine which start dialog to open based on step type
  const shouldShowMaterialExportDialog = useMemo(() => {
    return firstReadyStep?.stepType === "material_export";
  }, [firstReadyStep]);

  // Check if current active step is material_export (for auto-opening dialog)
  const shouldShowMaterialExportDialogForActiveStep = useMemo(() => {
    return currentActiveStep?.stepType === "material_export";
  }, [currentActiveStep]);

  // Prevent auto-open from immediately reopening after the user closes the dialog
  const suppressMaterialExportAutoOpenRef = useRef(false);

  useEffect(() => {
    // Reset suppression when there's no active material_export step in progress anymore
    if (!shouldShowMaterialExportDialogForActiveStep) {
      suppressMaterialExportAutoOpenRef.current = false;
    }
  }, [shouldShowMaterialExportDialogForActiveStep]);

  // Auto-open MaterialExportDialog when step is in_progress and type is material_export
  useEffect(() => {
    if (
      shouldShowMaterialExportDialogForActiveStep &&
      currentActiveStep?.id &&
      production?.id &&
      !isMaterialExportDialogOpen
    ) {
      if (suppressMaterialExportAutoOpenRef.current) {
        return;
      }
      setIsMaterialExportDialogOpen(true);
    }
  }, [
    shouldShowMaterialExportDialogForActiveStep,
    currentActiveStep?.id,
    production?.id,
    isMaterialExportDialogOpen,
  ]);

  const shouldShowDieCutStartDialog = useMemo(() => {
    // Only die_cut uses dies. "cut" should follow normal flow like other steps.
    return firstReadyStep?.stepType === "die_cut";
  }, [firstReadyStep]);

  // Determine which complete dialog to open based on step type
  const shouldShowDieCutCompleteDialog = useMemo(() => {
    // Only die_cut uses dies. "cut" should follow normal flow like other steps.
    return stepToComplete?.stepType === "die_cut";
  }, [stepToComplete]);

  const shouldShowCompletionDialog = useMemo(() => {
    // Show completion dialog for last step or steps that need stock-in
    // You can add more conditions here based on business logic
    return isLastStep || stepToComplete?.stepType === "packaging";
  }, [isLastStep, stepToComplete]);

  const handleStartProduction = async () => {
    if (!firstReadyStep?.id) {
      toast.error("Không tìm thấy bước sản xuất sẵn sàng để bắt đầu");
      return;
    }

    // Validate that step is actually READY
    if (firstReadyStep.status !== "ready") {
      toast.error("Bước này chưa sẵn sàng để bắt đầu");
      return;
    }

    // For material_export step, update step status first, then open dialog
    if (shouldShowMaterialExportDialog && production?.id) {
      suppressMaterialExportAutoOpenRef.current = false;
      // Update step to IN_PROGRESS first, then open dialog
      updateStep({
        stepId: firstReadyStep.id!,
        data: {
          status: "in_progress",
          inputQty: firstReadyStep.inputQty || undefined,
        },
      });
      // Open dialog immediately (step update will happen in background)
      setIsMaterialExportDialogOpen(true);
    } else if (shouldShowDieCutStartDialog) {
      setIsDieCutStartDialogOpen(true);
    } else {
      // Default simple dialog for other step types
      setIsStartDialogOpen(true);
    }
  };

  const handleSimpleStartProduction = async () => {
    if (!firstReadyStep?.id) {
      toast.error("Không tìm thấy bước sản xuất sẵn sàng để bắt đầu");
      setIsStartDialogOpen(false);
      setStartNotes("");
      return;
    }

    try {
      await updateStep({
        stepId: firstReadyStep.id,
        data: {
          status: "in_progress",
          outputQty: firstReadyStep.inputQty || undefined,
          defectNotes: startNotes.trim() || undefined,
        },
      });
      setIsStartDialogOpen(false);
      setStartNotes("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdateProgress = async () => {
    if (!currentActiveStep?.id) {
      toast.error("Không tìm thấy bước sản xuất đang hoạt động để cập nhật");
      setIsUpdateDialogOpen(false);
      return;
    }

    const progressValue = Number(progressPercent);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      toast.error("Tiến độ phải từ 0 đến 100");
      return;
    }

    const wastageValue = wastage.trim() === "" ? 0 : Number(wastage);
    if (isNaN(wastageValue) || wastageValue < 0) {
      toast.error("Hao hụt phải là số dương");
      return;
    }

    try {
      // Calculate outputQty based on progress and inputQty
      const inputQty = currentActiveStep.inputQty || 0;
      const calculatedOutputQty = Math.round((inputQty * progressValue) / 100);

      await updateStep({
        stepId: currentActiveStep.id,
        data: {
          status: "in_progress", // API expects lowercase (snake_case)
          outputQty: calculatedOutputQty,
          defectQty: wastageValue > 0 ? wastageValue : undefined,
          defectNotes: defectNotes.trim() || undefined,
        },
      });
      setIsUpdateDialogOpen(false);
      setProgressPercent("0");
      setWastage("0");
      setDefectNotes("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCompleteProduction = () => {
    if (!stepToComplete?.id) {
      toast.error("Không tìm thấy bước sản xuất để hoàn thành");
      return;
    }

    // Open appropriate dialog based on step type
    if (shouldShowDieCutCompleteDialog) {
      setIsDieCutCompleteDialogOpen(true);
    } else if (shouldShowCompletionDialog) {
      setIsCompletionDialogOpen(true);
    } else {
      // Default simple dialog for other step types
      setIsCompleteDialogOpen(true);
    }
  };

  const handleCompleteMaterialExportStep = async () => {
    const step = currentActiveStep || firstReadyStep;
    if (!step?.id) {
      toast.error("Không tìm thấy bước sản xuất để hoàn thành");
      return;
    }

    // Validate step is material_export and in_progress
    if (step.stepType !== "material_export" || step.status !== "in_progress") {
      toast.error(
        "Bước này không phải là bước xuất nguyên liệu đang thực hiện"
      );
      return;
    }

    try {
      // Find and complete the related stock-out first
      if (production?.id) {
        const pendingStockOut = stockOuts.find(
          (so: any) =>
            so.productionOrderId === production.id &&
            so.status !== "completed" &&
            so.status !== "cancelled"
        );

        if (pendingStockOut?.id) {
          // Complete the stock-out first (wait for it to complete)
          await completeStockOutAsync(pendingStockOut.id);
        }
      }

      // Complete step with outputQty = inputQty (same quantity as input)
      const outputQty = step.inputQty || proofingOrder?.totalQuantity || 0;

      await updateStep({
        stepId: step.id,
        data: {
          status: "done",
          outputQty: outputQty,
        },
      });

      toast.success("Đã hoàn thành bước xuất nguyên liệu");
      setIsMaterialExportDialogOpen(false);
    } catch (error: any) {
      toast.error("Không thể hoàn thành bước", {
        description:
          error?.response?.data?.message || error?.message || "Đã xảy ra lỗi",
      });
    }
  };

  const handleSimpleCompleteProduction = async () => {
    if (!stepToComplete?.id) {
      toast.error("Không tìm thấy bước sản xuất để hoàn thành");
      setIsCompleteDialogOpen(false);
      setCompleteNotes("");
      return;
    }

    const producedQtyValue =
      producedQty.trim() === "" ? 1 : Number(producedQty);

    if (isNaN(producedQtyValue) || producedQtyValue < 1) {
      toast.error("Số lượng sản xuất phải lớn hơn 0");
      return;
    }

    const wastageValue = wastage.trim() === "" ? 0 : Number(wastage);
    if (isNaN(wastageValue) || wastageValue < 0) {
      toast.error("Hao hụt phải là số dương");
      return;
    }

    try {
      // If this is a material_export step, find and complete the related stock-out
      if (stepToComplete.stepType === "material_export" && production?.id) {
        // Find the stock-out for this production order that hasn't been completed yet
        const pendingStockOut = stockOuts.find(
          (so: any) =>
            so.productionOrderId === production.id &&
            so.status !== "completed" &&
            so.status !== "cancelled"
        );

        if (pendingStockOut?.id) {
          // Complete the stock-out first (wait for it to complete)
          await completeStockOutAsync(pendingStockOut.id);
        }
      }

      const combinedNotes = [defectNotes.trim(), completeNotes.trim()]
        .filter(Boolean)
        .join("\n\n");

      await updateStep({
        stepId: stepToComplete.id,
        data: {
          status: "done",
          outputQty: producedQtyValue,
          defectQty: wastageValue > 0 ? wastageValue : undefined,
          defectNotes: combinedNotes || undefined,
        },
      });
      setIsCompleteDialogOpen(false);
      setProducedQty("1");
      setWastage("0");
      setDefectNotes("");
      setCompleteNotes("");

      if (wastageValue > 0) {
        const confirmLogDefect = window.confirm(
          "Bạn đã ghi nhận hao hụt/lỗi > 0. Bạn có muốn ghi nhận lỗi này vào Nhật ký lỗi sản xuất để khấu trừ lương không?"
        );
        if (confirmLogDefect) {
          setDefectPrefilledStepId(stepToComplete.id);
          setDefectPrefilledQuantity(wastageValue);
          setDefectPrefilledDescription(defectNotes.trim() || `Hao hụt/Lỗi xảy ra trong công đoạn ${stepToComplete.stepTypeName || stepToComplete.stepType}`);
          setIsDefectRecordDialogOpen(true);
        }
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa cập nhật";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
    return date.toLocaleString("vi-VN", {
      // Use local VN timezone explicitly to avoid UTC / environment timezone drift
      timeZone: "Asia/Ho_Chi_Minh",
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReopenStep = async (stepId: number) => {
    try {
      await updateStep({
        stepId,
        data: {
          status: "in_progress",
        },
      });
      toast.success("Đã mở lại bước sản xuất này để điều chỉnh");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Đang tải thông tin lệnh sản xuất...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!production || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Không tìm thấy đơn sản xuất</p>
            <Button
              onClick={() => navigate("/productions")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
        <div className="sticky top-0 z-20 -mx-4 bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/productions")}
                className="mt-0.5"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 space-y-1">
                <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  Chi tiết lệnh sản xuất
                </h1>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    ID lệnh{" "}
                    <span className="font-medium text-foreground">
                      {production.id ?? "N/A"}
                    </span>
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>
                    Mã bài{" "}
                    <span className="font-medium text-foreground">
                      {production.proofingOrderId ?? "N/A"}
                    </span>
                  </span>
                    {stepStats.total > 0 && (
                      <>
                        <span className="text-muted-foreground/60">•</span>
                        <Badge variant="secondary">
                          Bước {stepStats.done}/{stepStats.total}
                        </Badge>
                      </>
                    )}
                    {stepStats.inProgress > 0 && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                        Đang làm {stepStats.inProgress}
                      </Badge>
                    )}
                    {stepStats.ready > 0 && (
                      <Badge variant="outline">Sẵn sàng {stepStats.ready}</Badge>
                    )}
                  </div>
                  {production.customerName && (
                    <div className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate uppercase tracking-tight">
                        {production.customerName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div className="flex items-center gap-2 rounded-full bg-card/60 px-3 py-1 text-xs shadow-sm">
                <span className="text-muted-foreground">Trạng thái</span>
                <StatusBadge
                  status={production.status || "waiting_for_production"}
                  label={
                    productionStatusLabels[
                      production.status || "waiting_for_production"
                    ] ||
                    productionStepStatusLabels[
                      production.status || "waiting_for_production"
                    ] ||
                    "Chưa xác định"
                  }
                />
              </div>
              {showStartButton && (
                <Button
                  className="gap-2"
                  onClick={handleStartProduction}
                  disabled={starting}
                >
                  <PlayCircle className="h-4 w-4" />
                  {starting ? "Đang xử lý..." : "Bắt đầu"}
                </Button>
              )}
              {showUpdateButton && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsUpdateDialogOpen(true)}
                  disabled={updating}
                >
                  <Edit className="h-4 w-4" />
                  Cập nhật
                </Button>
              )}
              {showCompleteButton && (
                <Button
                  className="gap-2 bg-emerald-600 text-emerald-50 hover:bg-emerald-700"
                  onClick={() => setIsCompleteDialogOpen(true)}
                  disabled={completing}
                >
                  <CheckCircle className="h-4 w-4" />
                  {completing ? "Đang xử lý..." : "Hoàn thành"}
                </Button>
              )}
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  setDefectPrefilledStepId(currentActiveStep?.id || null);
                  setDefectPrefilledDesignId(null);
                  setDefectPrefilledQuantity(null);
                  setDefectPrefilledDescription(null);
                  setIsDefectRecordDialogOpen(true);
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                Ghi nhận lỗi
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          {/* Left Column - Main Info */}
          <div className="space-y-4">
            {/* Production Steps Card */}
            {production.steps && production.steps.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Layers className="h-5 w-5 text-primary" />
                      Các bước sản xuất ({production.steps.length})
                    </CardTitle>
                    <div className="w-full sm:w-64">
                      <Label
                        htmlFor="worker-search"
                        className="text-xs text-muted-foreground"
                      >
                        Tìm thợ theo tên / username
                      </Label>
                      <Input
                        id="worker-search"
                        value={workerSearch}
                        onChange={(e) => setWorkerSearch(e.target.value)}
                        placeholder="Nhập tên hoặc username..."
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {production.steps
                      .filter((step) => step.id && step.stepOrder !== undefined)
                      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
                      .map((step, index) => {
                        const currentAssignedUserId = step.assignedToId;
                        const stepId = step.id!;

                        // Get previous step to show InputQty logic
                        const previousStep =
                          index > 0 ? sortedSteps[index - 1] : null;
                        // According to business logic: OutputQty of previous step becomes InputQty of next step
                        // Display the actual InputQty from API (backend handles the logic)
                        const displayInputQty = step.inputQty || 0;

                        // Determine card styling based on status
                        // PENDING: muted/dashed (waiting for previous step to complete)
                        // READY: highlighted (ready to start)
                        // IN_PROGRESS: primary (active)
                        // DONE: emerald (completed)
                        const getCardStyles = () => {
                          if (step.status === "in_progress") {
                            return {
                              border:
                                "border-l-4 border-l-primary border-r border-t border-b border-primary/20",
                              bg: "bg-primary/5 dark:bg-primary/10",
                              shadow: "shadow-md shadow-primary/10",
                            };
                          }
                          if (step.status === "done") {
                            return {
                              border:
                                "border-l-4 border-l-emerald-500 border-r border-t border-b border-emerald-200 dark:border-emerald-800",
                              bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
                              shadow: "shadow-sm shadow-emerald-500/10",
                            };
                          }
                          if (step.status === "ready") {
                            return {
                              border:
                                "border-l-4 border-l-emerald-400 border-r-2 border-t-2 border-b-2 border-emerald-300/50 dark:border-emerald-600",
                              bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
                              shadow: "shadow-lg shadow-emerald-500/20",
                            };
                          }
                          return {
                            border:
                              "border-l-4 border-l-dashed border-l-muted-foreground/30 border-r border-t border-b border-dashed border-muted-foreground/20",
                            bg: "bg-muted/30 dark:bg-muted/20",
                            shadow: "shadow-sm",
                          };
                        };

                        const cardStyles = getCardStyles();

                        return (
                          <Card
                            key={step.id}
                            className={`relative overflow-hidden ${cardStyles.border} ${cardStyles.bg} ${cardStyles.shadow} transition-all duration-200 hover:shadow-lg`}
                          >
                            <div className="p-5 space-y-4">
                              {/* Header Section */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background/80 dark:bg-background/40 flex items-center justify-center border border-border/50 shadow-sm">
                                    <span className="text-xs font-bold text-foreground/80">
                                      {step.stepOrder}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                                      {step.stepTypeName ||
                                        step.stepType ||
                                        "N/A"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Bước {step.stepOrder}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  <StatusBadge
                                    status={step.status}
                                    label={
                                      productionStepStatusLabels[step.status]
                                    }
                                  />
                                </div>
                              </div>

                              {/* Worker Assignment Section */}
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pt-2 border-t border-border/50">
                                <div className="space-y-2 flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Người phụ trách
                                    </Label>
                                  </div>
                                  {currentAssignedUserId &&
                                  !isEditingWorker[stepId] ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs font-medium px-2.5 py-1"
                                      >
                                        {(() => {
                                          const assignedWorker = workers.find(
                                            (w: any) =>
                                              w.id === currentAssignedUserId
                                          );
                                          return (
                                            assignedWorker?.fullName ||
                                            assignedWorker?.username ||
                                            `Nhân viên ${currentAssignedUserId}`
                                          );
                                        })()}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs hover:bg-accent"
                                        onClick={() => {
                                          setIsEditingWorker((prev) => ({
                                            ...prev,
                                            [stepId]: true,
                                          }));
                                        }}
                                      >
                                        <Edit className="h-3 w-3 mr-1.5" />
                                        Sửa
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      Chưa phân công
                                    </p>
                                  )}
                                </div>
                                {(!currentAssignedUserId ||
                                  isEditingWorker[stepId]) && (
                                  <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[200px]">
                                    <Select
                                      value={
                                        selectedWorkersByStep[stepId]
                                          ? selectedWorkersByStep[
                                              stepId
                                            ]!.toString()
                                          : undefined
                                      }
                                      onValueChange={(value) => {
                                        const userId =
                                          value === "none"
                                            ? null
                                            : Number(value);
                                        setSelectedWorkersByStep((prev) => ({
                                          ...prev,
                                          [stepId]: userId,
                                        }));

                                        // Update API immediately
                                        assignWorker({
                                          stepId: stepId,
                                          data: {
                                            assignedToUserId: userId,
                                          },
                                        });

                                        // Close edit mode if was editing
                                        if (isEditingWorker[stepId]) {
                                          setIsEditingWorker((prev) => ({
                                            ...prev,
                                            [stepId]: false,
                                          }));
                                        }
                                      }}
                                      disabled={assigning}
                                    >
                                      <SelectTrigger className="w-full sm:w-48 h-9">
                                        <SelectValue placeholder="Chọn nhân viên" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          Chưa phân công
                                        </SelectItem>
                                        {workers.map((worker: any) => (
                                          <SelectItem
                                            key={worker.id}
                                            value={worker.id.toString()}
                                          >
                                            {worker.fullName ||
                                              worker.username ||
                                              `Nhân viên ${worker.id}`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {isEditingWorker[stepId] && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-3"
                                        onClick={() => {
                                          setIsEditingWorker((prev) => ({
                                            ...prev,
                                            [stepId]: false,
                                          }));
                                        }}
                                      >
                                        Hủy
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    SL đầu vào
                                  </p>
                                  <p className="text-lg font-semibold text-foreground">
                                    {displayInputQty}
                                  </p>
                                  {previousStep &&
                                    previousStep.status === "done" &&
                                    previousStep.outputQty !== undefined && (
                                      <p className="text-[10px] text-muted-foreground/80">
                                        Từ bước trước: {previousStep.outputQty}
                                      </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    SL đầu ra
                                  </p>
                                  <p className="text-lg font-semibold text-foreground">
                                    {step.outputQty || 0}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Lỗi
                                  </p>
                                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-500">
                                    {step.defectQty || 0}
                                  </p>
                                </div>
                              </div>

                              {/* Notes Section */}
                              {step.defectNotes && (
                                <div
                                  className={`rounded-lg border p-3 text-xs ${
                                    (step.defectQty || 0) > 0
                                      ? "border-orange-200/80 bg-orange-50/80 dark:border-orange-800/50 dark:bg-orange-950/30"
                                      : "border-blue-200/80 bg-blue-50/80 dark:border-blue-800/50 dark:bg-blue-950/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <FileText
                                      className={`h-3.5 w-3.5 ${
                                        (step.defectQty || 0) > 0
                                          ? "text-orange-600 dark:text-orange-400"
                                          : "text-blue-600 dark:text-blue-400"
                                      }`}
                                    />
                                    <p
                                      className={`font-semibold ${
                                        (step.defectQty || 0) > 0
                                          ? "text-orange-900 dark:text-orange-100"
                                          : "text-blue-900 dark:text-blue-100"
                                      }`}
                                    >
                                      {(step.defectQty || 0) > 0
                                        ? "Ghi chú lỗi"
                                        : "Ghi chú"}
                                    </p>
                                  </div>
                                  <p
                                    className={`whitespace-pre-wrap leading-relaxed ${
                                      (step.defectQty || 0) > 0
                                        ? "text-orange-800 dark:text-orange-200"
                                        : "text-blue-800 dark:text-blue-200"
                                    }`}
                                  >
                                    {step.defectNotes}
                                  </p>
                                </div>
                              )}

                              {/* Status Messages & Timestamps */}
                              <div className="space-y-2 pt-2 border-t border-border/50">
                                {/* Status-specific information */}
                                {step.status === "ready" && (
                                  <div className="flex items-center gap-2 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/40 px-3 py-2 text-xs">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                                      Sẵn sàng để bắt đầu
                                    </span>
                                  </div>
                                )}
                                {step.status === "pending" && previousStep && (
                                  <div className="flex items-center gap-2 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 px-3 py-2 text-xs">
                                    <AlertCircle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      Chờ bước trước hoàn thành để kích hoạt
                                    </span>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div className="flex flex-col gap-1.5 text-xs">
                                  {step.startedAt && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3 w-3 flex-shrink-0" />
                                      <span>
                                        Bắt đầu:{" "}
                                        {formatDateTime(step.startedAt)}
                                      </span>
                                    </div>
                                  )}
                                  {step.completedAt && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                      <span>
                                        Hoàn thành:{" "}
                                        {formatDateTime(step.completedAt)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="lg:hidden">
              {/* Proofing Order Details Card */}
              {isLoadingProofingOrder ? (
                <Card className="shadow-sm">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ) : proofingOrder ? (
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-5 w-5 text-primary" />
                        Thông tin bình bài
                      </CardTitle>
                      {proofingOrder.proofingFileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            if (proofingOrder.proofingFileUrl) {
                              const link = document.createElement("a");
                              link.href = proofingOrder.proofingFileUrl;
                              link.download = `binh-bai-${
                                proofingOrder.code || proofingOrder.id
                              }.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Tải file bình bài
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Mã bình bài
                        </Label>
                        <p className="font-semibold">
                          {proofingOrder.code || `BB${proofingOrder.id}`}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Trạng thái
                        </Label>
                        <StatusBadge
                          status={proofingOrder.status || ""}
                          label={
                            proofingStatusLabels[proofingOrder.status || ""] ||
                            "N/A"
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          Chất liệu
                        </Label>
                        <p className="text-sm font-medium">
                          {proofingOrder.materialType?.name || "N/A"}
                        </p>
                        {proofingOrder.materialType?.code && (
                          <p className="text-xs text-muted-foreground">
                            {proofingOrder.materialType.code}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          Số giấy in
                        </Label>
                        <p className="text-sm font-semibold">
                          {proofingOrder.totalQuantity || 0} sản phẩm
                        </p>
                      </div>
                    </div>

                    {proofingOrder.proofingOrderDesigns &&
                      proofingOrder.proofingOrderDesigns.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Thiết kế (
                              {proofingOrder.proofingOrderDesigns.length})
                            </Label>
                            <div className="space-y-2">
                              {proofingOrder.proofingOrderDesigns.map((pod) => (
                                <Card key={pod.id} className="bg-muted/40 p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium break-all">
                                        {pod.design?.designName ||
                                          pod.design?.code ||
                                          "N/A"}
                                      </p>
                                      <Badge variant="secondary">
                                        {pod.quantity} sản phẩm
                                      </Badge>
                                    </div>
                                    {pod.design?.code && (
                                      <p className="text-xs text-muted-foreground">
                                        Mã: {pod.design.code}
                                      </p>
                                    )}
                                    {pod.design?.dimensions && (
                                      <p className="text-xs text-muted-foreground">
                                        Kích thước: {pod.design.dimensions}
                                      </p>
                                    )}
                                    <div className="flex justify-end pt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                        onClick={() => {
                                          setDefectPrefilledDesignId(pod.design?.id || null);
                                          setDefectPrefilledStepId(currentActiveStep?.id || null);
                                          setDefectPrefilledQuantity(null);
                                          setDefectPrefilledDescription(null);
                                          setIsDefectRecordDialogOpen(true);
                                        }}
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        Báo lỗi
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                    {/* Thông tin khuôn bế */}
                    {((proofingOrder.dieExports &&
                      proofingOrder.dieExports.length > 0) ||
                      (proofingOrder.proofingOrderDies &&
                        proofingOrder.proofingOrderDies.length > 0)) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Scissors className="h-4 w-4 text-primary" />
                            Thông tin khuôn bế
                          </Label>
                          <div className="space-y-3">
                            {(
                              proofingOrder.dieExports ||
                              proofingOrder.proofingOrderDies ||
                              []
                            ).map((dieExport: any) => {
                              const die = dieExport.die;
                              if (!die) return null;
                              return (
                                <Card
                                  key={dieExport.id || die.id}
                                  className="border-l-4 border-l-blue-500 bg-blue-50/50 p-3 dark:bg-blue-950/20"
                                >
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Mã số khuôn
                                        </Label>
                                      </div>
                                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                        {die.code || `K${die.id}` || "N/A"}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Maximize2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Kích thước
                                        </Label>
                                      </div>
                                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {formatDieSize(die) || "N/A"}
                                      </p>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Tình trạng khuôn
                                        </Label>
                                      </div>
                                      <Badge
                                        variant={
                                          die.isUsable
                                            ? "default"
                                            : "destructive"
                                        }
                                        className={
                                          die.isUsable
                                            ? "bg-emerald-500 hover:bg-emerald-600"
                                            : ""
                                        }
                                      >
                                        {die.isUsable
                                          ? "Có thể sử dụng"
                                          : "Không thể sử dụng"}
                                      </Badge>
                                    </div>
                                    {dieExport.createdAt && (
                                      <div className="space-y-2 sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                          <Label className="text-xs text-muted-foreground">
                                            Ngày xuất khuôn
                                          </Label>
                                        </div>
                                        <p className="text-xs text-blue-800 dark:text-blue-200">
                                          {formatDateTime(dieExport.createdAt)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Thông tin Kẽm */}
                    {proofingOrder.plateExport && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Layers className="h-4 w-4 text-primary" />
                            Thông tin Kẽm
                          </Label>
                          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 p-3 dark:bg-purple-950/20">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Mã số Kẽm
                                  </Label>
                                </div>
                                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.id
                                    ? `PL${proofingOrder.plateExport.id}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Chất liệu
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.plateVendor
                                    ?.name ||
                                    proofingOrder.plateExport.vendorName ||
                                    "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Maximize2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Độ dày
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.plateCount
                                    ? `${proofingOrder.plateExport.plateCount} tấm`
                                    : "N/A"}
                                </p>
                              </div>
                              {proofingOrder.plateExport.sentAt && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày sản xuất
                                    </Label>
                                  </div>
                                  <p className="text-xs text-purple-800 dark:text-purple-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.sentAt
                                    )}
                                  </p>
                                </div>
                              )}
                              {proofingOrder.plateExport.receivedAt && (
                                <div className="space-y-2 sm:col-span-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày nhận
                                    </Label>
                                  </div>
                                  <p className="text-xs text-purple-800 dark:text-purple-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.receivedAt
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      </>
                    )}

                    {/* Thông tin xuất kẽm */}
                    {proofingOrder.plateExport && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Palette className="h-4 w-4 text-primary" />
                            Thông tin xuất kẽm
                          </Label>
                          <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Mã số kẽm
                                  </Label>
                                </div>
                                <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                                  {proofingOrder.plateExport.id
                                    ? `ZK${proofingOrder.plateExport.id}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Maximize2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Kích thước kẽm
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  {proofingOrder.customPaperSize ||
                                    proofingOrder.paperSize?.name ||
                                    "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Palette className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Số màu
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  {proofingOrder.plateExport.plateCount
                                    ? `${proofingOrder.plateExport.plateCount} màu`
                                    : "N/A"}
                                </p>
                              </div>
                              {proofingOrder.plateExport.sentAt && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày xuất kẽm
                                    </Label>
                                  </div>
                                  <p className="text-xs text-amber-800 dark:text-amber-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.sentAt
                                    )}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-2 sm:col-span-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Tình trạng kẽm
                                  </Label>
                                </div>
                                <Badge
                                  variant={
                                    proofingOrder.plateExport.receivedAt
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    proofingOrder.plateExport.receivedAt
                                      ? "bg-emerald-500 hover:bg-emerald-600"
                                      : proofingOrder.plateExport.sentAt
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : ""
                                  }
                                >
                                  {proofingOrder.plateExport.receivedAt
                                    ? "Đã nhận"
                                    : proofingOrder.plateExport.sentAt
                                      ? "Đã gửi"
                                      : "Chưa xuất"}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}

                    {proofingOrder.notes && (
                      <>
                        <Separator />
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                                Ghi chú bình bài
                              </p>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                                {proofingOrder.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="mt-4 flex h-full flex-col space-y-4 overflow-y-auto border-t border-border pt-4 pl-1 lg:mt-0 lg:border-t-0 lg:border-l lg:pl-4">
            {/* Proofing Order Details Card - desktop/right column */}
            <div className="hidden lg:block">
              {isLoadingProofingOrder ? (
                <Card className="shadow-sm">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ) : proofingOrder ? (
                <Card className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-5 w-5 text-primary" />
                        Thông tin bình bài
                      </CardTitle>
                      {proofingOrder.proofingFileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            if (proofingOrder.proofingFileUrl) {
                              const link = document.createElement("a");
                              link.href = proofingOrder.proofingFileUrl;
                              link.download = `binh-bai-${
                                proofingOrder.code || proofingOrder.id
                              }.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Tải file bình bài
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Mã bình bài
                        </Label>
                        <p className="font-semibold">
                          {proofingOrder.code || `BB${proofingOrder.id}`}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Khách hàng
                        </Label>
                        <p className="font-semibold text-blue-600">
                          {production.customerName || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Trạng thái
                        </Label>
                        <StatusBadge
                          status={proofingOrder.status || ""}
                          label={
                            proofingStatusLabels[proofingOrder.status || ""] ||
                            "N/A"
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          Chất liệu
                        </Label>
                        <p className="text-sm font-medium">
                          {proofingOrder.materialType?.name || "N/A"}
                        </p>
                        {proofingOrder.materialType?.code && (
                          <p className="text-xs text-muted-foreground">
                            {proofingOrder.materialType.code}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          Số giấy in
                        </Label>
                        <p className="text-sm font-semibold">
                          {proofingOrder.totalQuantity || 0} sản phẩm
                        </p>
                      </div>
                    </div>

                    {proofingOrder.proofingOrderDesigns &&
                      proofingOrder.proofingOrderDesigns.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              Thiết kế (
                              {proofingOrder.proofingOrderDesigns.length})
                            </Label>
                            <div className="space-y-2">
                              {proofingOrder.proofingOrderDesigns.map((pod) => (
                                <Card key={pod.id} className="bg-muted/40 p-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium break-all">
                                        {pod.design?.designName ||
                                          pod.design?.code ||
                                          "N/A"}
                                      </p>
                                      <Badge variant="secondary">
                                        {pod.quantity} sản phẩm
                                      </Badge>
                                    </div>
                                    {pod.design?.code && (
                                      <p className="text-xs text-muted-foreground">
                                        Mã: {pod.design.code}
                                      </p>
                                    )}
                                    {pod.design?.dimensions && (
                                      <p className="text-xs text-muted-foreground">
                                        Kích thước: {pod.design.dimensions}
                                      </p>
                                    )}
                                    <div className="flex justify-end pt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                        onClick={() => {
                                          setDefectPrefilledDesignId(pod.design?.id || null);
                                          setDefectPrefilledStepId(currentActiveStep?.id || null);
                                          setDefectPrefilledQuantity(null);
                                          setDefectPrefilledDescription(null);
                                          setIsDefectRecordDialogOpen(true);
                                        }}
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        Báo lỗi
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                    {/* Thông tin khuôn bế */}
                    {((proofingOrder.dieExports &&
                      proofingOrder.dieExports.length > 0) ||
                      (proofingOrder.proofingOrderDies &&
                        proofingOrder.proofingOrderDies.length > 0)) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Scissors className="h-4 w-4 text-primary" />
                            Thông tin khuôn bế
                          </Label>
                          <div className="space-y-3">
                            {(
                              proofingOrder.dieExports ||
                              proofingOrder.proofingOrderDies ||
                              []
                            ).map((dieExport: any) => {
                              const die = dieExport.die;
                              if (!die) return null;
                              return (
                                <Card
                                  key={dieExport.id || die.id}
                                  className="border-l-4 border-l-blue-500 bg-blue-50/50 p-3 dark:bg-blue-950/20"
                                >
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Mã số khuôn
                                        </Label>
                                      </div>
                                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                        {die.code || `K${die.id}` || "N/A"}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Maximize2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Kích thước
                                        </Label>
                                      </div>
                                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {formatDieSize(die) || "N/A"}
                                      </p>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <Label className="text-xs text-muted-foreground">
                                          Tình trạng khuôn
                                        </Label>
                                      </div>
                                      <Badge
                                        variant={
                                          die.isUsable
                                            ? "default"
                                            : "destructive"
                                        }
                                        className={
                                          die.isUsable
                                            ? "bg-emerald-500 hover:bg-emerald-600"
                                            : ""
                                        }
                                      >
                                        {die.isUsable
                                          ? "Có thể sử dụng"
                                          : "Không thể sử dụng"}
                                      </Badge>
                                    </div>
                                    {dieExport.createdAt && (
                                      <div className="space-y-2 sm:col-span-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                          <Label className="text-xs text-muted-foreground">
                                            Ngày xuất khuôn
                                          </Label>
                                        </div>
                                        <p className="text-xs text-blue-800 dark:text-blue-200">
                                          {formatDateTime(dieExport.createdAt)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Thông tin Kẽm */}
                    {proofingOrder.plateExport && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Layers className="h-4 w-4 text-primary" />
                            Thông tin Kẽm
                          </Label>
                          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 p-3 dark:bg-purple-950/20">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Mã số Kẽm
                                  </Label>
                                </div>
                                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.id
                                    ? `PL${proofingOrder.plateExport.id}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Chất liệu
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.plateVendor
                                    ?.name ||
                                    proofingOrder.plateExport.vendorName ||
                                    "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Maximize2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Độ dày
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                  {proofingOrder.plateExport.plateCount
                                    ? `${proofingOrder.plateExport.plateCount} tấm`
                                    : "N/A"}
                                </p>
                              </div>
                              {proofingOrder.plateExport.sentAt && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày sản xuất
                                    </Label>
                                  </div>
                                  <p className="text-xs text-purple-800 dark:text-purple-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.sentAt
                                    )}
                                  </p>
                                </div>
                              )}
                              {proofingOrder.plateExport.receivedAt && (
                                <div className="space-y-2 sm:col-span-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày nhận
                                    </Label>
                                  </div>
                                  <p className="text-xs text-purple-800 dark:text-purple-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.receivedAt
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      </>
                    )}

                    {/* Thông tin xuất kẽm */}
                    {proofingOrder.plateExport && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-semibold">
                            <Palette className="h-4 w-4 text-primary" />
                            Thông tin xuất kẽm
                          </Label>
                          <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Mã số kẽm
                                  </Label>
                                </div>
                                <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                                  {proofingOrder.plateExport.id
                                    ? `ZK${proofingOrder.plateExport.id}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Maximize2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Kích thước kẽm
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  {proofingOrder.customPaperSize ||
                                    proofingOrder.paperSize?.name ||
                                    "N/A"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Palette className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Số màu
                                  </Label>
                                </div>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  {proofingOrder.plateExport.plateCount
                                    ? `${proofingOrder.plateExport.plateCount} màu`
                                    : "N/A"}
                                </p>
                              </div>
                              {proofingOrder.plateExport.sentAt && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <Label className="text-xs text-muted-foreground">
                                      Ngày xuất kẽm
                                    </Label>
                                  </div>
                                  <p className="text-xs text-amber-800 dark:text-amber-200">
                                    {formatDateTime(
                                      proofingOrder.plateExport.sentAt
                                    )}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-2 sm:col-span-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  <Label className="text-xs text-muted-foreground">
                                    Tình trạng kẽm
                                  </Label>
                                </div>
                                <Badge
                                  variant={
                                    proofingOrder.plateExport.receivedAt
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    proofingOrder.plateExport.receivedAt
                                      ? "bg-emerald-500 hover:bg-emerald-600"
                                      : proofingOrder.plateExport.sentAt
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : ""
                                  }
                                >
                                  {proofingOrder.plateExport.receivedAt
                                    ? "Đã nhận"
                                    : proofingOrder.plateExport.sentAt
                                      ? "Đã gửi"
                                      : "Chưa xuất"}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </>
                    )}

                    {proofingOrder.notes && (
                      <>
                        <Separator />
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 text-xs font-semibold text-amber-900 dark:text-amber-100">
                                Ghi chú bình bài
                              </p>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                                {proofingOrder.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>

        {/* Start Production Dialog */}
        <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bắt đầu sản xuất</DialogTitle>
              <DialogDescription>
                {firstReadyStep
                  ? `Bắt đầu bước "${firstReadyStep.stepTypeName || firstReadyStep.stepType || "N/A"}"`
                  : "Xác nhận bắt đầu quá trình sản xuất cho lệnh này"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ghi chú (tùy chọn)</Label>
                <Textarea
                  placeholder="Nhập ghi chú khi bắt đầu sản xuất..."
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStartDialogOpen(false);
                  setStartNotes("");
                }}
              >
                Hủy
              </Button>
              <Button onClick={handleSimpleStartProduction} disabled={starting}>
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Bắt đầu
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Progress Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cập nhật tiến độ</DialogTitle>
              <DialogDescription>
                Cập nhật tiến độ sản xuất, hao hụt và ghi chú lỗi
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Tiến độ (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                  placeholder="0-100"
                />
                <p className="text-xs text-muted-foreground">
                  Nhập số từ 0 đến 100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wastage">Hao hụt (tùy chọn)</Label>
                <Input
                  id="wastage"
                  type="number"
                  min="0"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defect-notes">Ghi chú lỗi (tùy chọn)</Label>
                <Textarea
                  id="defect-notes"
                  placeholder="Ghi chú về lỗi hoặc vấn đề..."
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex-1 flex items-center">
                <Button
                  variant="ghost"
                  type="button"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={async () => {
                    if (currentActiveStep?.id && window.confirm("Bạn có chắc chắn muốn đưa bước này về trạng thái 'Sẵn sàng' không? Dữ liệu tiến độ hiện tại sẽ bị xóa.")) {
                      try {
                        await updateStep({
                          stepId: currentActiveStep.id,
                          data: {
                            status: "ready",
                            outputQty: 0,
                            defectQty: 0,
                          },
                        });
                        toast.success("Đã đưa bước sản xuất về trạng thái Sẵn sàng");
                        setIsUpdateDialogOpen(false);
                      } catch (err) {
                        // Lỗi đã được xử lý trong hook mutation
                      }
                    }
                  }}
                  disabled={updating}
                >
                  Về Sẵn sàng
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleUpdateProgress} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Cập nhật
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Production Dialog */}
        <Dialog
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hoàn thành sản xuất</DialogTitle>
              <DialogDescription>
                Xác nhận hoàn thành quá trình sản xuất. Vui lòng nhập thông tin
                hao hụt và lỗi nếu có.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="produced-qty">
                  Số lượng sản xuất <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="produced-qty"
                  type="number"
                  min="1"
                  value={producedQty}
                  onChange={(e) => setProducedQty(e.target.value)}
                  placeholder="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Số lượng sản phẩm đã sản xuất thành công
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-wastage">Hao hụt cuối cùng</Label>
                <Input
                  id="final-wastage"
                  type="number"
                  min="0"
                  value={wastage}
                  onChange={(e) => setWastage(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-defect-notes">Ghi chú lỗi (nếu có)</Label>
                <Textarea
                  id="final-defect-notes"
                  placeholder="Ghi chú về lỗi hoặc vấn đề cuối cùng..."
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-notes">
                  Ghi chú hoàn thành (tùy chọn)
                </Label>
                <Textarea
                  id="complete-notes"
                  placeholder="Ghi chú thêm khi hoàn thành đơn sản xuất..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCompleteDialogOpen(false);
                  setCompleteNotes("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSimpleCompleteProduction}
                disabled={completing}
                className="bg-green-600 hover:bg-green-700"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Hoàn thành
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Step-Specific Dialogs */}

        {/* Material Export Dialog - for material_export step type */}
        {(firstReadyStep || currentActiveStep) && production && (
          <MaterialExportDialog
            open={isMaterialExportDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                suppressMaterialExportAutoOpenRef.current = true;
              }
              setIsMaterialExportDialogOpen(open);
            }}
            step={(currentActiveStep || firstReadyStep)!}
            productionOrder={production}
            proofingOrder={proofingOrder || null}
            onCancel={async () => {
              // Rollback step to ready when user cancels without creating stock out
              const stepToRollback = currentActiveStep || firstReadyStep;
              if (
                stepToRollback?.id &&
                stepToRollback.status === "in_progress"
              ) {
                try {
                  await updateStep({
                    stepId: stepToRollback.id,
                    data: {
                      status: "ready",
                      inputQty: stepToRollback.inputQty || undefined,
                    },
                  });
                  toast.success("Đã hủy tạo phiếu xuất kho", {
                    description:
                      "Bước sản xuất đã được quay lại trạng thái sẵn sàng",
                  });
                } catch (error: any) {
                  toast.error("Không thể quay lại trạng thái bước", {
                    description:
                      error?.response?.data?.message ||
                      error?.message ||
                      "Đã xảy ra lỗi",
                  });
                }
              }
            }}
            onComplete={handleCompleteMaterialExportStep}
          />
        )}

        {/* Die Cut Start Dialog - for die_cut/cut step type when starting */}
        {firstReadyStep && production && (
          <DieCutStepDialog
            open={isDieCutStartDialogOpen}
            onOpenChange={setIsDieCutStartDialogOpen}
            step={firstReadyStep}
            productionOrder={production}
            proofingOrder={proofingOrder || null}
            mode="start"
          />
        )}

        {/* Die Cut Complete Dialog - for die_cut/cut step type when completing */}
        {stepToComplete && production && (
          <DieCutStepDialog
            open={isDieCutCompleteDialogOpen}
            onOpenChange={setIsDieCutCompleteDialogOpen}
            step={stepToComplete}
            productionOrder={production}
            proofingOrder={proofingOrder || null}
            mode="complete"
          />
        )}

        {/* Completion Dialog - for last step or steps that need stock-in */}
        {stepToComplete && production && (
          <CompletionDialog
            open={isCompletionDialogOpen}
            onOpenChange={setIsCompletionDialogOpen}
            step={stepToComplete}
            productionOrder={production}
            proofingOrder={proofingOrder || null}
          />
        )}

        {/* Defect Record Dialog */}
        {production?.id && (
          <DefectRecordDialog
            open={isDefectRecordDialogOpen}
            onOpenChange={setIsDefectRecordDialogOpen}
            productionOrderId={production.id}
            prefilledStepId={defectPrefilledStepId}
            prefilledDesignId={defectPrefilledDesignId}
            prefilledQuantity={defectPrefilledQuantity}
            prefilledDescription={defectPrefilledDescription}
          />
        )}
      </div>
      </div>
    </div>
  );
}
