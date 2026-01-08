import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Factory,
  PlayCircle,
  CheckCircle,
  Edit,
  User,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  productionStatusLabels,
  proofingStatusLabels,
} from "@/lib/status-utils";
import {
  useProductionOrder,
  useUpdateProductionStep,
} from "@/hooks/use-production";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { IdSchema } from "@/Schema";
import { toast } from "sonner";

export default function ProductionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // Form states
  const [startNotes, setStartNotes] = useState("");
  const [progressPercent, setProgressPercent] = useState("0");
  const [wastage, setWastage] = useState("0");
  const [producedQty, setProducedQty] = useState("1");
  const [defectNotes, setDefectNotes] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

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
  
  // Use updating for both starting and completing
  const starting = updating;
  const completing = updating;

  useEffect(() => {
    if (production) {
      setProgressPercent(production.progressPercent?.toString() || "0");
      // ProductionOrderResponse doesn't have defectNotes at order level - it's on steps
      setDefectNotes("");
      setWastage(
        production.totalWastage !== undefined && production.totalWastage !== null
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

  // Find the first pending step to start
  const firstPendingStep = useMemo(() => {
    if (!production?.steps || production.steps.length === 0) return null;
    const sortedSteps = [...production.steps]
      .filter((step) => step.id && step.stepOrder !== undefined)
      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
    return (
      sortedSteps.find(
        (step) =>
          step.status === "pending" || step.status === "waiting_for_production"
      ) || sortedSteps[0] || null
    );
  }, [production?.steps]);

  // Find the current active step (in_production)
  const currentActiveStep = useMemo(() => {
    if (!production?.steps || production.steps.length === 0) return null;
    return (
      production.steps.find((step) => step.status === "in_production") || null
    );
  }, [production?.steps]);

  // Find the last step to complete (could be current active step or last step)
  const stepToComplete = useMemo(() => {
    if (!production?.steps || production.steps.length === 0) return null;
    if (currentActiveStep) return currentActiveStep;
    const sortedSteps = [...production.steps]
      .filter((step) => step.id && step.stepOrder !== undefined)
      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
    return sortedSteps[sortedSteps.length - 1] || null;
  }, [production?.steps, currentActiveStep]);

  // Determine which buttons to show based on steps
  const showStartButton = useMemo(() => {
    return !!firstPendingStep && firstPendingStep.id;
  }, [firstPendingStep]);

  const showUpdateButton = useMemo(() => {
    return !!currentActiveStep && currentActiveStep.id;
  }, [currentActiveStep]);

  const showCompleteButton = useMemo(() => {
    return (
      !!stepToComplete &&
      stepToComplete.id &&
      (currentActiveStep?.status === "in_production" ||
        (production?.progressPercent || 0) >= 100)
    );
  }, [stepToComplete, currentActiveStep, production?.progressPercent]);

  const handleStartProduction = async () => {
    if (!firstPendingStep?.id) {
      toast.error("Không tìm thấy bước sản xuất để bắt đầu");
      setIsStartDialogOpen(false);
      setStartNotes("");
      return;
    }

    try {
      await updateStep({
        id: firstPendingStep.id,
        data: {
          status: "in_production",
          outputQty: firstPendingStep.inputQty || undefined,
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
      const calculatedOutputQty = Math.round(
        (inputQty * progressValue) / 100
      );

      await updateStep({
        id: currentActiveStep.id,
        data: {
          status: "in_production",
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
      await updateStep({
        id: stepToComplete.id,
        data: {
          status: "completed",
          outputQty: producedQtyValue,
          defectQty: wastageValue > 0 ? wastageValue : undefined,
          defectNotes: defectNotes.trim() || undefined,
        },
      });
      setIsCompleteDialogOpen(false);
      setCompleteNotes("");
      setProducedQty("1");
      setWastage("0");
      setDefectNotes("");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/productions")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Chi tiết lệnh sản xuất
            </h1>
            <p className="text-muted-foreground text-pretty">
              ID: {production.id ?? "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Trạng thái hiện tại:
          </span>{" "}
          <StatusBadge
            status={production.status || "pending"}
            label={
              productionStatusLabels[production.status || "pending"] ||
              production.status ||
              "N/A"
            }
          />
          {showStartButton && (
            <Button
              className="gap-2"
              onClick={() => setIsStartDialogOpen(true)}
              disabled={starting}
            >
              <PlayCircle className="h-4 w-4" />
              {starting ? "Đang xử lý..." : "Bắt đầu sản xuất"}
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
              Cập nhật tiến độ
            </Button>
          )}
          {showCompleteButton && (
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setIsCompleteDialogOpen(true)}
              disabled={completing}
            >
              <CheckCircle className="h-4 w-4" />
              {completing ? "Đang xử lý..." : "Hoàn thành"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tiến độ sản xuất
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Tiến độ</Label>
                  <span className="text-2xl font-bold text-primary">
                    {production.progressPercent || 0}%
                  </span>
                </div>
                <Progress
                  value={production.progressPercent || 0}
                  className="h-4"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    ID đơn sản xuất
                  </Label>
                  <p className="font-semibold text-lg">
                    {production.id ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    ID mã bài
                  </Label>
                  <p className="font-medium">
                    {production.proofingOrderId ?? "N/A"}
                  </p>
                </div>
              </div>

              {production.totalWastage !== undefined &&
                production.totalWastage !== null &&
                (production.totalWastage as number) > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Hao hụt
                      </Label>
                      <p className="text-lg font-semibold text-orange-600">
                        {production.totalWastage} đơn vị
                      </p>
                    </div>
                  </>
                )}

            </CardContent>
          </Card>

          {/* Production Steps Card */}
          {production.steps && production.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Các bước sản xuất ({production.steps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {production.steps
                    .filter((step) => step.id && step.stepOrder !== undefined)
                    .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
                    .map((step) => (
                      <Card
                        key={step.id}
                        className={`p-4 ${
                          step.status === "in_production"
                            ? "border-primary bg-primary/5"
                            : step.status === "completed"
                              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                              : "bg-muted/30"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Bước {step.stepOrder}
                              </span>
                              <span className="text-sm font-medium">
                                {step.stepTypeName || step.stepType || "N/A"}
                              </span>
                            </div>
                            <StatusBadge
                              status={step.status || "pending"}
                              label={
                                productionStatusLabels[
                                  step.status || "pending"
                                ] ||
                                step.status ||
                                "Chờ xử lý"
                              }
                            />
                          </div>

                          {step.assignedToName && (
                            <p className="text-xs text-muted-foreground">
                              Người phụ trách:{" "}
                              <span className="font-medium">
                                {step.assignedToName}
                              </span>
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                SL đầu vào:
                              </span>{" "}
                              <span className="font-medium">
                                {step.inputQty || 0}
                              </span>
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
                              <span className="text-muted-foreground">Lỗi:</span>{" "}
                              <span className="font-medium text-orange-600">
                                {step.defectQty || 0}
                              </span>
                            </div>
                          </div>

                          {step.defectNotes && (
                            <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-xs">
                              <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                                Ghi chú lỗi:
                              </p>
                              <p className="text-orange-800 dark:text-orange-200 whitespace-pre-wrap">
                                {step.defectNotes}
                              </p>
                            </div>
                          )}

                          {step.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Hoàn thành: {formatDateTime(step.completedAt)}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proofing Order Details Card */}
          {isLoadingProofingOrder ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : proofingOrder ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
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
                        proofingOrder.status ||
                        "N/A"
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
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
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
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
                          Thiết kế ({proofingOrder.proofingOrderDesigns.length})
                        </Label>
                        <div className="space-y-2">
                          {proofingOrder.proofingOrderDesigns.map((pod) => (
                            <Card key={pod.id} className="p-3 bg-muted/30">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
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

                {proofingOrder.notes && (
                  <>
                    <Separator />
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                            Ghi chú bình bài
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
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

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Production Lead Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Người phụ trách
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {production.productionLeadName || "Chưa phân công"}
                  </p>
                  {/* ProductionOrderResponse has productionLeadId and productionLeadName, not full object */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Ngày tạo
                </Label>
                <p className="text-sm font-medium">
                  {formatDateTime(production.createdAt)}
                </p>
              </div>

              {production.startedAt && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <PlayCircle className="h-3 w-3 text-green-600" />
                      Bắt đầu sản xuất
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDateTime(production.startedAt)}
                    </p>
                  </div>
                </>
              )}

              {production.completedAt && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Hoàn thành
                    </Label>
                    <p className="text-sm font-medium">
                      {formatDateTime(production.completedAt)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Factory className="h-5 w-5" />
                Thông tin nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tiến độ</span>
                <span className="text-sm font-semibold">
                  {production.progressPercent || 0}%
                </span>
              </div>
              {proofingOrder?.totalQuantity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Số lượng
                  </span>
                  <span className="text-sm font-semibold">
                    {proofingOrder.totalQuantity}
                  </span>
                </div>
              )}
              {production.totalWastage !== undefined &&
                production.totalWastage !== null &&
                (production.totalWastage as number) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Hao hụt
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      {production.totalWastage}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Production Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bắt đầu sản xuất</DialogTitle>
            <DialogDescription>
              Xác nhận bắt đầu quá trình sản xuất cho lệnh này
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
  );
}
