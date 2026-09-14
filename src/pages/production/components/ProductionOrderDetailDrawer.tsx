import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  User,
  History,
  Calendar,
  AlertCircle,
  Loader2,
  Users,
  Edit2,
  Check,
  X,
  Sparkles,
  Layers,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { ProductionOrderResponse } from "@/Schema";
import { getProductionStatusLabel, getProductionStepName, FLOW_SPEC_STEPS_MAP, getFlowCode, toCanonicalBeStageCode, getLaminationTypeName } from "@/lib/status-utils";
import { useProductionOrder, useProductionOrderHistory, useUpdateProductionStep, useUpdateStepWorkerCount, useFlowWorkerDefaults } from "@/hooks/use-production";
import { ProductionDieDetailModal } from "@/components/production/ProductionDieDetailModal";

interface ProductionOrderDetailDrawerProps {
  order: ProductionOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintSlip?: (orderId: number) => void;
}

const getStageCodeForStep = (stepNameOrCode: string): string => {
  const name = String(stepNameOrCode || "").toUpperCase().trim();
  if (name.includes("BÌNH BÀI") || name === "BINH_BAI") return "BINH_BAI";
  if (name.includes("ĐIỀU LỆNH") || name === "DISPATCH") return "DISPATCH";
  if (name.includes("IN") || name === "PRINT") return "PRINT";
  if (name.includes("CÁN") || name === "LAMINATION" || name.includes("LAM")) return "LAMINATION";
  if (name.includes("BỒI") || name === "MOUNTING") return "MOUNTING";
  if (name.includes("BẾ") || name === "DIE_CUT") return "DIE_CUT";
  if (name.includes("GỠ") || name === "STRIPPING") return "STRIPPING";
  if (name.includes("DÁN") || name === "GLUE") return "GLUE";
  if (name.includes("ÉP BIÊN") || name === "SIDE_SEAL") return "SIDE_SEAL";
  if (name.includes("XẢ CUỘN") || name === "UNWIND") return "UNWIND";
  if (name.includes("XẾP HÔNG") || name === "GUSSET") return "GUSSET";
  if (name.includes("ZIP") || name === "ZIPPER") return "ZIPPER";
  if (name.includes("CẮT") || name === "CUT") return "CUT";
  if (name.includes("CHIA CUỘN") || name === "SLIT") return "SLIT";
  if (name.includes("ÉP MIỆNG") || name === "TOP_SEAL") return "TOP_SEAL";
  if (name.includes("ĐÓNG GÓI") || name === "PACKAGING") return "PACKAGING";
  return name;
};

const safeFormatTime = (dateStr?: string | Date | null) => {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [y, m, d] = dateStr.trim().split("-").map(Number);
      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    }
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (Number.isNaN(d.getTime())) return String(dateStr);

    const isMidnightString =
      typeof dateStr === "string" &&
      (dateStr.includes("T00:00:00") || dateStr.endsWith(" 00:00:00"));
    if (isMidnightString) {
      return format(d, "dd/MM/yyyy");
    }

    return format(d, "HH:mm dd/MM/yyyy");
  } catch {
    return String(dateStr);
  }
};

export function ProductionOrderDetailDrawer({
  order: propOrder,
  isOpen,
  onClose,
  onPrintSlip,
}: ProductionOrderDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"progress" | "history">("progress");
  const [editingStepId, setEditingStepId] = useState<any>(null);
  const [editingWorkerCountInput, setEditingWorkerCountInput] = useState<string>("");
  const [isDieModalOpen, setIsDieModalOpen] = useState<boolean>(false);

  const orderId = propOrder?.id ?? null;
  const { data: fetchedOrder } = useProductionOrder(orderId, isOpen && !!orderId);
  const order = fetchedOrder || propOrder;

  const flowCode = getFlowCode(order);

  // Extract Lamination Type (Cán màng gì: Cán bóng, Cán mờ, Cán Metalize...)
  const laminationType = getLaminationTypeName(order);
  const { data: historyItems, isLoading: isHistoryLoading } = useProductionOrderHistory(
    orderId,
    isOpen
  );
  const { mutate: updateStepStatus, isPending: isUpdatingStep } = useUpdateProductionStep();
  const updateWorkerCountMutation = useUpdateStepWorkerCount();
  const { data: flowWorkerDefaults } = useFlowWorkerDefaults(flowCode);

  const handleSaveWorkerCount = async (st: any) => {
    if (!order?.id) return;
    const val = editingWorkerCountInput.trim();
    const parsed = val === "" ? null : parseInt(val, 10);
    if (val !== "" && (isNaN(parsed!) || parsed! < 0)) {
      toast.error("Số công phải là số nguyên >= 0 hoặc để trống (Chưa cấu hình)");
      return;
    }
    if (st.isVirtual || typeof st.id !== "number") {
      toast.error("Khâu này chưa nằm trong CSDL Lệnh Sản Xuất, không thể cập nhật trực tiếp");
      setEditingStepId(null);
      return;
    }

    try {
      await updateWorkerCountMutation.mutate({
        orderId: order.id,
        stepId: st.id,
        workerCount: parsed,
      });
      toast.success("Đã cập nhật số công vào CSDL");
      setEditingStepId(null);
    } catch {
      // Handled in hook toast
    }
  };

  if (!order) return null;

  const orderCode = String(order.proofingOrderCode || order.code || `LSX${String(order.id).padStart(6, "0")}`);
  const productName = String((order as any).productName || (order as any).productionFlowName || (order as any).proofingOrderTitle || (order as any).title || (order as any).name || (order as any).designTypeName || "—");
  const materialName = String(
    (order as any).materialTypeName ||
    (order as any).materialName ||
    (order as any).materialType?.name ||
    (order as any).paperTypeName ||
    (order as any).paperType ||
    (order as any).proofingOrder?.materialTypeName ||
    (order as any).design?.materialTypeName ||
    ""
  );
  const rawSpec = (order as any).specification;
  const specStr = typeof rawSpec === "string" ? rawSpec : Array.isArray(rawSpec) ? rawSpec.join(", ") : "";
  const isStepSpecStr = specStr && (
    specStr.toLowerCase().replace(/[\s,\-_]+/g, "").startsWith("incán") ||
    specStr.toLowerCase().includes("bếgỡ") ||
    specStr.toLowerCase().includes("gỡdán")
  );
  const specification = !isStepSpecStr && specStr ? specStr : null;
  const customerName = String((order as any).customerName || (order as any).proofingOrder?.customerName || (order as any).customer?.name || "—");
  const firstStep = Array.isArray(order.steps) && order.steps.length > 0 ? order.steps[0] : null;
  const isFirstStepReadyOrDone = Boolean(
    firstStep && (
      firstStep.status === "ready" ||
      firstStep.status === "in_progress" ||
      firstStep.status === "running" ||
      firstStep.status === "done" ||
      firstStep.status === "completed"
    )
  );

  const hasAnyStepStartedOrCompleted = Array.isArray(order.steps) && order.steps.some(
    (s: any) => s.startedAt || s.completedAt || s.status === "in_progress" || s.status === "running" || s.status === "done" || s.status === "completed"
  );

  // Find proofing and dispatch timestamps from historyItems
  const historyProofingEvent = historyItems?.find(
    (h: any) => h.category === "proofing" || h.eventType === "proofing_completed" || h.eventTypeDisplayName?.includes("Bình bài")
  );
  const historyDispatchEvent = historyItems?.find(
    (h: any) => h.category === "dispatch" || h.eventType === "dispatched" || h.eventTypeDisplayName?.includes("Điều lệnh")
  );

  const rawDispatchedDate =
    (order as any).dispatchedAt ||
    (order as any).dispatchedDate ||
    (order as any).dispatchDate ||
    (order as any).scheduledPrintDate ||
    (order as any).scheduledDate ||
    (order as any).printedAt ||
    (order as any).proofingOrder?.dispatchedAt ||
    historyDispatchEvent?.createdAt ||
    historyDispatchEvent?.timestamp ||
    (isFirstStepReadyOrDone ? firstStep?.readyAt : null);

  const isExplicitlyDispatchedStatus =
    order.status === "dispatched" ||
    order.status === "in_production" ||
    order.status === "processing" ||
    order.status === "in_progress" ||
    order.status === "ready" ||
    order.status === "waiting_for_print" ||
    order.status === "waiting";

  const isExplicitNotDispatchedStatus =
    !rawDispatchedDate &&
    (order.status === "pending_dispatch" ||
      order.status === "not_dispatched" ||
      order.status === "draft" ||
      order.status === "pending_material" ||
      order.status === "waiting_for_production");

  const isDispatched = Boolean(
    rawDispatchedDate ||
    hasAnyStepStartedOrCompleted ||
    isFirstStepReadyOrDone ||
    (isExplicitlyDispatchedStatus && !isExplicitNotDispatchedStatus)
  );

  const rawStatus = String((order as any).statusDisplay || (order as any).status || "");
  const statusText = getProductionStatusLabel(rawStatus, isDispatched);

  const lateStep = (order.steps as any[])?.find((s: any) => (s.overdueMinutes && s.overdueMinutes > 0) || s.status === "overdue" || s.slaStatus === "late");
  const overdueMinutes = (order as any).overdueMinutes || lateStep?.overdueMinutes || 0;
  const isLate = overdueMinutes > 0 || statusText.toLowerCase().includes("quá hạn") || statusText.toLowerCase().includes("late");

  const proofingCompletedDate =
    (order as any).proofingCompletedAt ||
    (order as any).proofingOrder?.completedAt ||
    (order as any).proofingOrderCompletedAt ||
    historyProofingEvent?.createdAt ||
    historyProofingEvent?.timestamp ||
    (order as any).createdAt ||
    null;

  const dispatchedDate = isDispatched ? (rawDispatchedDate || firstStep?.startedAt) : null;

  // Timeline Step Data: build full steps list including virtual steps for Bình bài and Điều lệnh
  const defaultFlowSteps = FLOW_SPEC_STEPS_MAP[flowCode] || ["In", "Cán màng", "Bế", "Gỡ", "Dán", "Đóng gói"];
  const fullDefaultSteps = defaultFlowSteps.includes("Đóng gói")
    ? defaultFlowSteps
    : [...defaultFlowSteps, "Đóng gói"];

  const rawStepsList = (order.steps && order.steps.length > 0)
    ? order.steps
    : fullDefaultSteps.map((name, idx) => ({
        id: idx + 1,
        stepName: name,
        stepCode: getStageCodeForStep(name),
        status: "pending",
        duration: "—",
      }));

  const hasBinhBai = rawStepsList.some((s: any) => getStageCodeForStep(s.stepCode || s.stepName) === "BINH_BAI");
  const hasDispatch = rawStepsList.some((s: any) => getStageCodeForStep(s.stepCode || s.stepName) === "DISPATCH");

  const virtualSteps: any[] = [];
  if (!hasBinhBai) {
    virtualSteps.push({
      id: `virtual-binh-bai`,
      stepCode: "BINH_BAI",
      stepName: "Bình bài",
      status: proofingCompletedDate ? "completed" : "ready",
      readyAt: (order as any).createdAt,
      completedAt: proofingCompletedDate,
      workerCount: null,
      isVirtual: true,
    });
  }

  if (!hasDispatch) {
    virtualSteps.push({
      id: `virtual-dispatch`,
      stepCode: "DISPATCH",
      stepName: "Điều lệnh",
      status: dispatchedDate ? "completed" : proofingCompletedDate ? "ready" : "pending",
      readyAt: proofingCompletedDate,
      completedAt: dispatchedDate,
      workerCount: null,
      isVirtual: true,
    });
  }

  const steps = [...virtualSteps, ...rawStepsList];

  const getEffectiveWorkerCount = (st: any) => {
    const stageCode = getStageCodeForStep(st.stepCode || st.stepName);
    if (st.workerCount != null) {
      return { count: st.workerCount, isDefault: false };
    }
    const targetNorm = toCanonicalBeStageCode(stageCode);
    const matchedDef = flowWorkerDefaults?.find((d) => {
      if (!d) return false;
      const dCode = toCanonicalBeStageCode(d.stageCode);
      const codeMatch = dCode !== "" && dCode === targetNorm;
      const nameMatch = Boolean(
        d.stageName &&
        st.stepName &&
        d.stageName.toLowerCase() === String(st.stepName).toLowerCase()
      );
      return codeMatch || nameMatch;
    });
    if (matchedDef && matchedDef.defaultWorkerCount != null) {
      return { count: matchedDef.defaultWorkerCount, isDefault: true };
    }
    return { count: null, isDefault: false };
  };

  const totalWorkerCount = steps.reduce((sum: number, st: any) => {
    const eff = getEffectiveWorkerCount(st);
    return sum + (eff.count ?? 0);
  }, 0);

  const isAnyWorkerCountConfigured = steps.some((st: any) => getEffectiveWorkerCount(st).count != null);

  const handleStepStatusChange = (stepId: number, stepIdx: number, newStatus: string) => {
    if (stepIdx > 0) {
      const prevStep = steps[stepIdx - 1];
      const isPrevDone = prevStep.status === "completed" || prevStep.status === "done";
      if (!isPrevDone && (newStatus === "in_progress" || newStatus === "done" || newStatus === "ready")) {
        toast.error(`Khâu "${getProductionStepName(prevStep)}" chưa hoàn thành. Chưa thể chuyển trạng thái khâu này!`);
        return;
      }
    } else if (stepIdx === 0 && !dispatchedDate) {
      if (newStatus === "in_progress" || newStatus === "done") {
        toast.error("Lệnh sản xuất chưa được Điều lệnh in! Vui lòng thực hiện Điều lệnh trước.");
        return;
      }
    }

    updateStepStatus({
      stepId,
      data: { status: newStatus as any },
    });
  };

  const activeStepIndex = steps.findIndex(
    (s: any) => s.status === "ready" || s.status === "in_progress" || s.status === "overdue" || s.isCurrent
  );
  const currentStep = steps[activeStepIndex >= 0 ? activeStepIndex : 0];

  // Synthesize initial history item if history API returns empty list
  const displayHistoryItems = (historyItems && historyItems.length > 0)
    ? historyItems
    : proofingCompletedDate
      ? [
          {
            id: "init-proofing",
            category: "proofing",
            eventType: "proofing_completed",
            eventTypeDisplayName: "Bình bài hoàn thành",
            stepTypeName: "Bình bài",
            createdAt: proofingCompletedDate,
            actorName: "Hệ thống",
            note: `Bình bài hoàn thành, Lệnh sản xuất ${orderCode} được tạo.`,
          },
        ]
      : [];

  const isUrgent = (order as any).isUrgent || (order as any).isRush || (order as any).priority === "urgent" || (order as any).priority === "high" || (order as any).proofingOrder?.isUrgent || (order as any).isUrgentOrder;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-black/20 backdrop-blur-[1px]"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background border-l shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black font-mono text-primary">{orderCode}</h2>
            <Badge variant="outline" className="text-xs font-extrabold bg-blue-50 text-blue-800 border-blue-200">
              {flowCode}
            </Badge>
            {isUrgent && (
              <Badge className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 animate-pulse border-none">
                🔥 BÀI GẤP
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Badge
              className={cn(
                "text-xs font-bold border-none px-2.5 py-1 flex items-center gap-1",
                isLate
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isLate ? `🔴 Quá hạn  +${overdueMinutes} phút` : `🟢 ${statusText}`}</span>
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs (2 tabs: Tiến độ, Lịch sử) */}
        <div className="px-4 pt-2 border-b bg-card">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9 p-1">
              <TabsTrigger value="progress" className="text-xs font-bold">Tiến độ</TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-bold">Lịch sử</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "progress" && (
            <div className="space-y-4">
              {/* Order Key Specs & Milestones Summary Card */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-[#93631F]" />
                    Thông tin & Mốc thời gian LSX
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDieModalOpen(true)}
                    className="h-6 text-[11px] font-bold text-[#93631F] border-[#93631F]/40 bg-white dark:bg-slate-900 hover:bg-[#93631F]/10 gap-1 px-2 shadow-2xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#93631F]" />
                    Xem khuôn bế
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                  <div>
                    <span className="text-slate-500">Bình bài hoàn thành:</span>{" "}
                    <strong className="font-mono text-slate-800 dark:text-slate-200 font-semibold block sm:inline">
                      {safeFormatTime(proofingCompletedDate) || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Điều lệnh in:</span>{" "}
                    <strong className="font-mono text-[#93631F] font-bold block sm:inline">
                      {safeFormatTime(dispatchedDate) || "—"}
                    </strong>
                  </div>
                </div>

                {laminationType && (
                  <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-600 font-medium">Loại cán màng:</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 font-extrabold text-[11px] px-2 py-0">
                      {laminationType}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Tiến độ sản xuất thời gian thực
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{steps.length} công đoạn</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5",
                      isAnyWorkerCountConfigured
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    )}
                  >
                    <Users className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>
                      {isAnyWorkerCountConfigured
                        ? `Tổng công: ${totalWorkerCount} công`
                        : "Số công: Chưa cấu hình"}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Vertical Stepper Timeline with Status Dropdown & Timestamps */}
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-3.5 pl-4 py-1">
                {steps.map((st: any, idx: number) => {
                  const isDone = st.status === "completed" || st.status === "done";
                  const isCurrentOverdue = st.status === "overdue" || st.isCurrent;
                  const isReady = st.status === "ready" || st.status === "waiting";
                  const isInProgress = st.status === "in_progress" || st.status === "running";
                  const isPending = !isDone && !isInProgress && !isReady && !isCurrentOverdue && (st.status === "pending" || !st.status);

                  const nextStep = idx < steps.length - 1 ? steps[idx + 1] : null;
                  const finishTime =
                    st.completedAt ||
                    st.completed_at ||
                    st.finishedAt ||
                    st.finishAt ||
                    st.updatedAt ||
                    st.updated_at ||
                    (isDone ? ((nextStep as any)?.readyAt || (nextStep as any)?.startedAt || (order as any)?.completedAt) : null);

                  const effWorker = getEffectiveWorkerCount(st);

                  return (
                    <div key={st.id || idx} className="relative group p-2.5 rounded-lg border bg-card/60 hover:bg-card transition-colors">
                      {/* Node circle icon */}
                      <div
                        className={cn(
                          "absolute -left-[25px] top-3.5 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-background transition-colors",
                          isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isCurrentOverdue
                              ? "border-red-500 bg-red-500 text-white animate-pulse"
                              : isReady
                                ? "border-sky-500 bg-sky-100 text-sky-700"
                                : "border-slate-300 text-slate-400"
                        )}
                      >
                        {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {isCurrentOverdue && <AlertTriangle className="w-3 h-3 text-white" />}
                      </div>

                      {/* Content details */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={cn(
                                "text-xs font-bold",
                                isDone ? "text-foreground" : isCurrentOverdue ? "text-red-600 dark:text-red-400" : isReady ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground"
                              )}
                            >
                              {getProductionStepName(st)}
                            </h4>

                            {/* Compact inline badge for Cán màng */}
                            {(getProductionStepName(st).toLowerCase().includes("cán") ||
                              getProductionStepName(st).toLowerCase().includes("can") ||
                              String(st.stepCode || "").toLowerCase().includes("can") ||
                              String(st.stepCode || "").toLowerCase().includes("lamination")) && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 font-extrabold text-[10px] px-1.5 py-0">
                                {laminationType || "Cán mờ"}
                              </Badge>
                            )}

                            {/* Compact inline button for Bế */}
                            {(getProductionStepName(st).toLowerCase().includes("bế") ||
                              getProductionStepName(st).toLowerCase().includes("be") ||
                              String(st.stepCode || "").toLowerCase().includes("be") ||
                              String(st.stepCode || "").toLowerCase().includes("die")) && (
                              <button
                                type="button"
                                onClick={() => setIsDieModalOpen(true)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#93631F] hover:underline bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 cursor-pointer"
                                title="Xem thông tin khuôn bế kỹ thuật"
                              >
                                <Layers className="w-3 h-3 text-[#93631F]" />
                                Khuôn bế
                              </button>
                            )}

                            {isCurrentOverdue && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                Đang xử lý (quá hạn)
                              </span>
                            )}
                            {isReady && !isInProgress && !isDone && (
                              <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">
                                ⚪ Sẵn sàng
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] text-muted-foreground font-normal italic">
                                Chưa tới
                              </span>
                            )}
                          </div>

                          {/* Timestamps (Sẵn sàng, Bắt đầu, Hoàn thành & SLA dự kiến) */}
                          <div className="space-y-0.5 text-[10.5px] font-mono text-muted-foreground">
                            {!isPending && st.readyAt && st.stepCode !== "BINH_BAI" && (
                              <div className="flex items-center gap-1 text-[#93631F]">
                                <span>⚪ Sẵn sàng:</span>
                                <strong className="font-semibold">{safeFormatTime(st.readyAt)}</strong>
                              </div>
                            )}
                            {st.startedAt && (
                              <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
                                <span>🔵 Bắt đầu:</span>
                                <strong className="font-semibold">{safeFormatTime(st.startedAt)}</strong>
                              </div>
                            )}
                            {isDone && (
                              <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300">
                                <span>🟢 Hoàn thành:</span>
                                <strong className="font-semibold">{safeFormatTime(finishTime) || "Đã hoàn thành"}</strong>
                              </div>
                            )}
                            {!isPending && !isDone && st.estimatedCompleteAt && (
                              <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                <span>⏱️ Dự kiến xong (SLA):</span>
                                <strong className="font-semibold">{safeFormatTime(st.estimatedCompleteAt)}</strong>
                              </div>
                            )}
                            {(st.standardProcessingMinutes || st.processingMinutes) && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-sans mt-0.5">
                                {st.standardProcessingMinutes && <span>Định mức: <strong>{st.standardProcessingMinutes}m</strong></span>}
                                {st.processingMinutes && <span>Thực tế: <strong>{st.processingMinutes}m</strong></span>}
                                {st.overdueMinutes > 0 && <span className="text-red-600 font-bold">Trễ: +{st.overdueMinutes}m</span>}
                              </div>
                            )}
                            {st.assignedWorkerName && (
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-sans">
                                👤 Thợ phụ trách: <strong className="text-slate-800 dark:text-slate-200">{st.assignedWorkerName}</strong>
                              </div>
                            )}
                            {st.delayReason && (
                              <div className="text-[10px] text-red-600 dark:text-red-400 font-sans italic">
                                ⚠️ Lý do trễ: {st.delayReason}
                              </div>
                            )}
                            {/* Worker Count Section & Inline Override */}
                            <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 text-[11px] font-sans">
                              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Số công:</span>
                              {editingStepId === st.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="Số công (bỏ trống = Chưa cấu hình)"
                                    value={editingWorkerCountInput}
                                    onChange={(e) => setEditingWorkerCountInput(e.target.value)}
                                    className="h-6 w-24 text-[11px] px-2 py-0 bg-background border-input"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveWorkerCount(st)}
                                    disabled={updateWorkerCountMutation.isPending}
                                    className="h-6 px-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold"
                                    title="Lưu số công"
                                  >
                                    {updateWorkerCountMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingStepId(null)}
                                    className="h-6 px-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Hủy"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {effWorker.count == null ? (
                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 font-semibold text-[10px] px-2 py-0">
                                      Chưa cấu hình
                                    </Badge>
                                  ) : effWorker.count === 0 ? (
                                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-semibold text-[10px] px-2 py-0">
                                      0 công (Không cần người)
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10.5px] px-2 py-0">
                                      {effWorker.count} công {effWorker.isDefault ? "(Mặc định)" : ""}
                                    </Badge>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStepId(st.id);
                                      setEditingWorkerCountInput(effWorker.count == null ? "" : String(effWorker.count));
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                                    title="Bấm để cập nhật riêng số công cho LSX này"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Step Status Dropdown & Duration */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {st.id && !st.isVirtual && typeof st.id === "number" ? (
                            <Select
                              value={st.status || "pending"}
                              onValueChange={(newStatus) => handleStepStatusChange(st.id, idx, newStatus)}
                              disabled={isUpdatingStep}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-6 text-[10.5px] px-2 font-bold rounded-md border border-slate-200 shadow-2xs gap-1 cursor-pointer",
                                  st.status === "completed" || st.status === "done"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : st.status === "in_progress" || st.status === "running"
                                      ? "bg-cyan-50 text-cyan-700 border-cyan-300"
                                      : st.status === "ready"
                                        ? "bg-emerald-50/70 text-emerald-800 border-emerald-200"
                                        : st.status === "paused" || st.status === "blocked"
                                          ? "bg-amber-50 text-amber-700 border-amber-300"
                                          : "bg-slate-50 text-slate-600 border-slate-200"
                                )}
                              >
                                <SelectValue placeholder="Trạng thái" />
                              </SelectTrigger>
                              <SelectContent align="end" className="text-xs font-medium">
                                <SelectItem value="ready" className="text-xs font-semibold text-emerald-800">⚪ Sẵn sàng</SelectItem>
                                <SelectItem value="in_progress" className="text-xs font-bold text-cyan-700">🔵 Đang thực hiện</SelectItem>
                                <SelectItem value="paused" className="text-xs font-semibold text-amber-600">🟡 Tạm dừng</SelectItem>
                                <SelectItem value="done" className="text-xs font-bold text-emerald-600">🟢 Hoàn thành</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={cn(
                                "text-xs font-mono font-bold shrink-0",
                                isDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                              )}
                            >
                              {isDone ? "🟢 Hoàn thành" : "⚪ Đang xử lý"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Callout Alert Box for Overdue step */}
              {isLate && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    Khâu {String(lateStep?.stepName || lateStep?.stepTypeName || (currentStep as any)?.stepName || (currentStep as any)?.stepTypeName || "Sản xuất")} đang quá hạn {overdueMinutes} phút
                  </div>
                  <div className="text-xs text-red-900/80 dark:text-red-200/80 space-y-0.5 pl-6 font-medium">
                    {lateStep?.standardProcessingMinutes && (
                      <p>• Định mức chuẩn SLA: <strong>≤ {lateStep.standardProcessingMinutes} phút</strong></p>
                    )}
                    {lateStep?.processingMinutes && (
                      <p>• Thời gian thực tế: <strong>{lateStep.processingMinutes} phút</strong></p>
                    )}
                    {lateStep?.delayReason && (
                      <p>• Lý do trễ: <strong>{lateStep.delayReason}</strong></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Lịch sử ghi nhận thao tác của Lệnh {orderCode}
                </h3>
                {isHistoryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              </div>

              {!displayHistoryItems || displayHistoryItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">
                  {isHistoryLoading ? "Đang tải lịch sử..." : `Chưa ghi nhận lịch sử thao tác cho Lệnh ${orderCode}`}
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-3 pl-4 py-1">
                  {displayHistoryItems.map((item: any, idx: number) => {
                    const rawTime = item.createdAt || item.performedAt || item.timestamp;
                    const timeStr = safeFormatTime(rawTime) || "—";
                    const actor = item.actorName || item.createdByName || item.userName || item.user || "Hệ thống";
                    const eventTitle = item.eventTypeDisplayName || item.title || item.action || item.eventName || "Cập nhật LSX";
                    const noteText = item.note || item.description || item.notes || "";
                    const stepTypeLabel = item.stepTypeName ? getProductionStepName(item.stepTypeName) : null;

                    return (
                      <div key={item.id || idx} className="relative group text-xs bg-card p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="absolute -left-[25px] top-3 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-background border-amber-500 text-amber-600">
                          <History className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-xs">{eventTitle}</span>
                              {stepTypeLabel && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                  {stepTypeLabel}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{timeStr}</span>
                          </div>
                          {noteText && <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{noteText}</p>}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Thực hiện bởi: <strong>{actor}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>

      {/* Production Die Detail Modal */}
      <ProductionDieDetailModal
        item={order}
        open={isDieModalOpen}
        onOpenChange={setIsDieModalOpen}
      />
    </Sheet>
  );
}
