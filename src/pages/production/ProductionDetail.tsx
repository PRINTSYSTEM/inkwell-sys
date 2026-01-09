import { useState, useEffect, useMemo } from "react";
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

export default function ProductionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

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
  const { mutate: assignWorker, isPending: assigning } =
    useAssignProductionWorker();

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

  const handleStartProduction = async () => {
    if (!firstReadyStep?.id) {
      toast.error("Không tìm thấy bước sản xuất sẵn sàng để bắt đầu");
      setIsStartDialogOpen(false);
      setStartNotes("");
      return;
    }

    // Validate that step is actually READY
    if (firstReadyStep.status !== "ready") {
      toast.error("Bước này chưa sẵn sàng để bắt đầu");
      setIsStartDialogOpen(false);
      setStartNotes("");
      return;
    }

    try {
      await updateStep({
        stepId: firstReadyStep.id,
        data: {
          status: "IN_PROGRESS", // API expects uppercase
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
          status: "IN_PROGRESS", // API expects uppercase
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

  const handleCompleteProduction = async () => {
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
      const combinedNotes = [defectNotes.trim(), completeNotes.trim()]
        .filter(Boolean)
        .join("\n\n");

      await updateStep({
        stepId: stepToComplete.id,
        data: {
          status: "DONE", // API expects uppercase
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
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const formatDateTime = (dateStr?: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Chưa cập nhật";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
                  onClick={() => setIsStartDialogOpen(true)}
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

                        const selectValue = currentAssignedUserId
                          ? currentAssignedUserId.toString()
                          : "none";

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
                        const getCardClassName = () => {
                          if (step.status === "in_progress") {
                            return "border-primary/70 bg-primary/5";
                          }
                          if (step.status === "done") {
                            return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
                          }
                          if (step.status === "ready") {
                            return "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10 border-2";
                          }
                          return "border-dashed bg-muted/40";
                        };

                        return (
                          <Card
                            key={step.id}
                            className={`p-4 transition-colors ${getCardClassName()}`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    Bước {step.stepOrder}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {step.stepTypeName ||
                                      step.stepType ||
                                      "N/A"}
                                  </span>
                                </div>
                                <StatusBadge
                                  status={step.status || "pending"}
                                  label={
                                    productionStepStatusLabels[
                                      step.status || "pending"
                                    ] || "Chờ xử lý"
                                  }
                                />
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1 text-xs">
                                  <p className="text-muted-foreground">
                                    Người phụ trách
                                  </p>
                                  <p className="font-medium">
                                    {step.assignedToName || "Chưa phân công"}
                                  </p>
                                </div>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                  <Select
                                    value={selectValue}
                                    onValueChange={(value) => {
                                      const userId =
                                        value === "none" ? null : Number(value);
                                      assignWorker({
                                        stepId: step.id!,
                                        data: { assignedToUserId: userId },
                                      });
                                    }}
                                    disabled={assigning}
                                  >
                                    <SelectTrigger className="w-full sm:w-48">
                                      <SelectValue placeholder="Chọn thợ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        Chưa phân công
                                      </SelectItem>
                                      {workers.map((worker: any) => (
                                        <SelectItem
                                          key={worker.id}
                                          value={worker.id?.toString() || ""}
                                        >
                                          {worker.fullName ||
                                            worker.username ||
                                            `Nhân viên ${worker.id}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">
                                    SL đầu vào:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {displayInputQty}
                                  </span>
                                  {previousStep &&
                                    previousStep.status === "done" &&
                                    previousStep.outputQty !== undefined && (
                                      <span className="ml-1 text-xs text-muted-foreground">
                                        (từ bước trước: {previousStep.outputQty}
                                        )
                                      </span>
                                    )}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    SL đầu ra:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {step.outputQty || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Lỗi:
                                  </span>{" "}
                                  <span className="font-medium text-orange-600">
                                    {step.defectQty || 0}
                                  </span>
                                </div>
                              </div>

                              {step.defectNotes && (
                                <div
                                  className={`rounded border p-2 text-xs ${
                                    (step.defectQty || 0) > 0
                                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                                  }`}
                                >
                                  <p
                                    className={`mb-1 font-semibold ${
                                      (step.defectQty || 0) > 0
                                        ? "text-orange-900 dark:text-orange-100"
                                        : "text-blue-900 dark:text-blue-100"
                                    }`}
                                  >
                                    {(step.defectQty || 0) > 0
                                      ? "Ghi chú lỗi:"
                                      : "Ghi chú:"}
                                  </p>
                                  <p
                                    className={`whitespace-pre-wrap ${
                                      (step.defectQty || 0) > 0
                                        ? "text-orange-800 dark:text-orange-200"
                                        : "text-blue-800 dark:text-blue-200"
                                    }`}
                                  >
                                    {step.defectNotes}
                                  </p>
                                </div>
                              )}

                              {/* Show status-specific information */}
                              {step.status === "ready" && (
                                <div className="flex items-center gap-2 rounded-md bg-emerald-100/50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Sẵn sàng để bắt đầu</span>
                                </div>
                              )}
                              {step.status === "pending" && previousStep && (
                                <div className="flex items-center gap-2 rounded-md bg-slate-100/50 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800/30 dark:text-slate-400">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>
                                    Chờ bước trước hoàn thành để kích hoạt
                                  </span>
                                </div>
                              )}
                              {step.startedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Bắt đầu: {formatDateTime(step.startedAt)}
                                </p>
                              )}
                              {step.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Hoàn thành: {formatDateTime(step.completedAt)}
                                </p>
                              )}
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
                          Tổng số lượng
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
                                      <p className="text-sm font-medium">
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
                          Tổng số lượng
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
                                      <p className="text-sm font-medium">
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
              <Button onClick={handleStartProduction} disabled={starting}>
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
                onClick={handleCompleteProduction}
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
      </div>
    </div>
  );
}
