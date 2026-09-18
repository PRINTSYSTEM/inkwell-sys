import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileImage,
  Flame,
  ChevronLeft,
  ChevronRight,
  Factory,
  Layers,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProductionOrderResponse } from "@/Schema";
import { ReadOnlyProofingDetailModal } from "@/components/proofing/ReadOnlyProofingDetailModal";
import { ProductionDieDetailModal } from "@/components/production/ProductionDieDetailModal";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { getProductionStatusLabel, getProductionStepName, getFlowCode, getSpecificationBadges, FLOW_SPEC_STEPS_MAP, getLaminationTypeName } from "@/lib/status-utils";

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
  onSelectOrder?: (order: ProductionOrderResponse) => void;
}

function getShortStepName(st: any): string {
  const name = getProductionStepName(st);
  if (!name) return "Khâu";
  if (name.includes("Xuất vật tư") || name.includes("Xuất NVL") || name.includes("Xuất nguyên liệu")) return "Xuất NVL";
  if (name.includes("In offset") || name.includes("In Tờ") || name.includes("In Cuộn") || name.includes("In flexo") || name === "In") return "In";
  if (name.includes("Cán màng") || name.includes("Cán")) return "Cán";
  if (name.includes("Bế gỡ") || name.includes("Bế phẳng") || name.includes("Bế")) return "Bế";
  if (name.includes("Gỡ")) return "Gỡ";
  if (name.includes("Dán thành phẩm") || name.includes("Dán góc") || name.includes("Dán")) return "Dán";
  if (name.includes("KCS") || name.includes("Đóng gói") || name.includes("Kiểm hàng")) return "KCS";
  if (name.includes("Chặt") || name.includes("Xả cuộn") || name.includes("Cắt")) return "Cắt";
  if (name.includes("Bồi")) return "Bồi";
  if (name.includes("Ép kim")) return "Ép kim";
  if (name.includes("Xếp hông")) return "Xếp hông";
  if (name.includes("Zipper")) return "Zip";
  return name.length > 7 ? name.slice(0, 6) + "." : name;
}

// Horizontal Stepper for Table Row Progress displaying ALL step labels
function HorizontalProductionProgress({ item, isLate }: { item: any; isLate?: boolean }) {
  const rawSteps = item?.steps;
  let stepsToRender: any[] = [];

  if (Array.isArray(rawSteps) && rawSteps.length > 0) {
    stepsToRender = rawSteps;
  } else {
    // Fallback: build pipeline steps from order specifications / flow map
    const specBadges = getSpecificationBadges(item);
    const flowCode = getFlowCode(item);
    const stepNames = specBadges.length > 0 ? specBadges : (FLOW_SPEC_STEPS_MAP[flowCode] || ["In", "Cán", "Bế", "Gỡ", "Dán"]);

    const isCompleted = item.status === "completed" || item.status === "done";
    const isDispatched = Boolean(item.dispatchedAt || item.scheduledPrintDate);

    stepsToRender = stepNames.map((name, idx) => ({
      id: idx + 1,
      stepName: name,
      status: isCompleted
        ? "completed"
        : isDispatched && idx === 0
          ? "in_progress"
          : "pending",
    }));
  }

  if (!stepsToRender || stepsToRender.length === 0) {
    return (
      <div className="flex items-center justify-center w-full">
        <span className="text-[11px] text-muted-foreground italic">Chưa có công đoạn</span>
      </div>
    );
  }

  // Active step index
  const runningIdx = stepsToRender.findIndex(
    (s: any) => s.status === "in_progress" || s.status === "running" || s.status === "overdue" || s.isCurrent
  );
  const readyIdx = stepsToRender.findIndex((s: any) => s.status === "ready" || s.status === "waiting");
  const allCompleted = stepsToRender.every((s: any) => s.status === "completed" || s.status === "done");

  const currentIdx = runningIdx >= 0
    ? runningIdx
    : readyIdx >= 0
      ? readyIdx
      : allCompleted
        ? stepsToRender.length - 1
        : 0;

  return (
    <div className="w-full flex flex-col space-y-0.5 py-0.5 px-1 min-w-[320px] max-w-[460px] mx-auto">
      {/* 1. Connecting Line & Dots with Step Names */}
      <div className="flex items-center w-full relative px-2">
        {/* Track Line */}
        <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />

        {stepsToRender.map((st: any, i: number) => {
          const isDone = st.status === "completed" || st.status === "done";
          const isCurrent = i === currentIdx && !allCompleted;
          const isInProgress = st.status === "in_progress" || st.status === "running";
          const isReady = st.status === "ready" || st.status === "waiting" || (isCurrent && !isInProgress && !isDone);
          const isWarning = st.status === "warning" || st.processingStatus === "warning" || st.waitingStatus === "warning";
          const isStOverdue = st.status === "overdue" || st.status === "late" || st.processingStatus === "late" || st.waitingStatus === "late" || (isCurrent && isLate);

          const shortName = getShortStepName(st);
          const fullName = getProductionStepName(st);

          let dotStyle = "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600";
          let labelStyle = "text-slate-400 dark:text-slate-500 font-normal";

          if (isDone) {
            dotStyle = "bg-emerald-500 border-emerald-600 shadow-2xs";
            labelStyle = "text-emerald-700 dark:text-emerald-400 font-semibold";
          } else if (isStOverdue) {
            dotStyle = "bg-red-500 border-red-600 ring-2 ring-red-200 dark:ring-red-950 animate-pulse shadow-2xs";
            labelStyle = "text-red-600 dark:text-red-400 font-black";
          } else if (isWarning) {
            dotStyle = "bg-amber-500 border-amber-600 ring-2 ring-amber-200 dark:ring-amber-950 shadow-2xs";
            labelStyle = "text-amber-600 dark:text-amber-400 font-bold";
          } else if (isInProgress) {
            dotStyle = "bg-blue-500 border-blue-600 ring-2 ring-blue-200 dark:ring-blue-950 animate-pulse shadow-2xs";
            labelStyle = "text-blue-600 dark:text-blue-400 font-bold";
          } else if (isReady) {
            dotStyle = "bg-sky-100 border-sky-500 ring-2 ring-sky-200 dark:bg-sky-950 dark:border-sky-400 shadow-2xs";
            labelStyle = "text-sky-700 dark:text-sky-300 font-bold";
          }

          const formatTime = (ts: string | null | undefined) => {
            if (!ts) return null;
            try { return format(new Date(ts), "HH:mm dd/MM"); } catch { return null; }
          };

          const tooltipLines = [
            `${fullName}: ${isStOverdue ? `🔴 TRỄ TIẾN ĐỘ (+${st.overdueMinutes || 0}p)` : isWarning ? "🟡 SẮP TRỄ SLA" : isDone ? "🟢 Hoàn thành" : isInProgress ? "🔵 Đang thực hiện" : "⚪ Chưa tới"}`,
            st.startedAt ? `• Bắt đầu: ${formatTime(st.startedAt)}` : null,
            st.completedAt ? `• Hoàn thành: ${formatTime(st.completedAt)}` : st.estimatedCompleteAt ? `• Dự kiến xong (SLA): ${formatTime(st.estimatedCompleteAt)}` : null,
            st.standardProcessingMinutes ? `• Định mức SLA: ${st.standardProcessingMinutes} phút` : null,
            st.processingMinutes ? `• Đã làm: ${st.processingMinutes} phút` : null,
            st.assignedWorkerName ? `• Thợ phụ trách: ${st.assignedWorkerName}` : null,
            st.delayReason ? `• Lý do trễ: ${st.delayReason}` : null,
          ].filter(Boolean);

          return (
            <div
              key={st.id || i}
              className="flex-1 flex flex-col items-center z-10 group relative cursor-pointer"
              title={tooltipLines.join("\n")}
            >
              {/* Dot */}
              <div className={cn("w-3.5 h-3.5 rounded-full border-2 transition-all", dotStyle)} />

              {/* Step Name */}
              <span className={cn("text-[11px] mt-1 truncate max-w-[56px] text-center leading-tight transition-colors", labelStyle)}>
                {shortName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
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
  onSelectOrder,
}: ProductionListTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingProofingId, setViewingProofingId] = useState<number | null>(null);
  const [viewingDieOrder, setViewingDieOrder] = useState<any | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === productions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(productions.map((p) => p.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto rounded-xl border bg-card shadow-2xs"
      >
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 border-b">
              <TableRow className="text-[11px] font-bold uppercase">
                <TableHead className="w-10 text-center"><Checkbox /></TableHead>
                <TableHead className="w-28 font-bold">Mã lệnh</TableHead>
                <TableHead className="w-20">Loại</TableHead>
                <TableHead className="w-44">Sản phẩm / Chất liệu</TableHead>
                <TableHead className="w-36">Thời gian</TableHead>
                <TableHead className="w-28 text-center">Trạng thái</TableHead>
                <TableHead className="w-[440px] text-center">Tiến độ sản xuất</TableHead>
                <TableHead className="w-36 text-center">Báo động</TableHead>
                <TableHead className="w-16 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={9} rows={8} rowHeight="h-14" />
            </TableBody>
          </Table>
        ) : productions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
            <Factory className="h-12 w-12 mb-3 text-muted-foreground/60" />
            <p className="text-sm font-semibold">Không tìm thấy Lệnh sản xuất nào phù hợp</p>
          </div>
        ) : (
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/60 z-10 border-b text-[11px] font-extrabold uppercase">
              <TableRow>
                <TableHead className="w-10 text-center py-1.5">
                  <Checkbox
                    checked={selectedIds.length === productions.length && productions.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-28 py-1.5 font-bold">Mã lệnh</TableHead>
                <TableHead className="w-20 py-1.5">Loại</TableHead>
                <TableHead className="w-44 py-1.5">Sản phẩm / Chất liệu</TableHead>
                <TableHead className="w-36 py-1.5">Thời gian</TableHead>
                <TableHead className="w-28 text-center py-1.5">Trạng thái</TableHead>
                <TableHead className="w-32 text-center py-1.5 font-bold text-amber-900 dark:text-amber-200">Ngày giao hàng</TableHead>
                <TableHead className="w-[440px] text-center py-1.5">Tiến độ sản xuất</TableHead>
                <TableHead className="w-36 text-center py-1.5">Báo động</TableHead>
                <TableHead className="w-16 text-right py-1.5 pr-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((item: any) => {
                const isSelected = selectedIds.includes(item.id);
                const orderCode = item.proofingOrderCode || item.code || `LSX${String(item.id).padStart(6, "0")}`;
                const flowCode = getFlowCode(item);
                const productName = item.productName || item.productionFlowName || item.proofingOrderTitle || item.proofingOrder?.title || item.title || item.name || item.designTypeName || "—";
                const materialName = item.materialTypeName || item.materialName || item.materialType?.name || item.paperTypeName || item.paperType || item.proofingOrder?.materialTypeName || item.design?.materialTypeName || null;
                const rawSpec = item.specification;
                const specStr = typeof rawSpec === "string" ? rawSpec : Array.isArray(rawSpec) ? rawSpec.join(", ") : "";
                const isStepSpecStr = specStr && (
                  specStr.toLowerCase().replace(/[\s,\-_]+/g, "").startsWith("incán") ||
                  specStr.toLowerCase().includes("bếgỡ") ||
                  specStr.toLowerCase().includes("gỡdán")
                );
                const specification = !isStepSpecStr && specStr ? specStr : null;
                const subText = materialName
                  ? (specification ? `${materialName} (${specification})` : materialName)
                  : specification;

                const laminationType = getLaminationTypeName(item);
                const hasBeStep = Array.isArray(item.steps)
                  ? item.steps.some((s: any) => {
                      const n = (s.stepName || s.name || s.stepCode || "").toLowerCase();
                      return n.includes("bế") || n.includes("be") || n.includes("die");
                    })
                  : flowCode !== "F05" && flowCode !== "F10";

                const customerName = item.customerName || item.proofingOrder?.customerName || item.customer?.name || item.customerNameDisplay || "—";
                const proofingCompletedDate =
                  item.proofingCompletedAt ||
                  item.proofingOrder?.completedAt ||
                  item.proofingOrderCompletedAt ||
                  item.createdAt;

                const firstStep = Array.isArray(item.steps) && item.steps.length > 0 ? item.steps[0] : null;
                const isFirstStepReadyOrDone = Boolean(
                  firstStep && (
                    firstStep.status === "ready" ||
                    firstStep.status === "in_progress" ||
                    firstStep.status === "running" ||
                    firstStep.status === "done" ||
                    firstStep.status === "completed"
                  )
                );

                const hasAnyStepStartedOrCompleted = Array.isArray(item.steps) && item.steps.some(
                  (s: any) => s.startedAt || s.completedAt || s.status === "in_progress" || s.status === "running" || s.status === "done" || s.status === "completed"
                );

                const rawDispatchedDate =
                  item.dispatchedAt ||
                  item.dispatchedDate ||
                  item.dispatchDate ||
                  item.scheduledPrintDate ||
                  item.scheduledDate ||
                  item.printedAt ||
                  item.proofingOrder?.dispatchedAt ||
                  (isFirstStepReadyOrDone ? firstStep?.readyAt : null);

                const isExplicitlyDispatchedStatus =
                  item.status === "dispatched" ||
                  item.status === "in_production" ||
                  item.status === "processing" ||
                  item.status === "in_progress" ||
                  item.status === "ready" ||
                  item.status === "waiting_for_print" ||
                  item.status === "waiting";

                const isExplicitNotDispatchedStatus =
                  !rawDispatchedDate &&
                  (item.status === "pending_dispatch" ||
                    item.status === "not_dispatched" ||
                    item.status === "draft" ||
                    item.status === "pending_material" ||
                    item.status === "waiting_for_production");

                const isDispatched = Boolean(
                  rawDispatchedDate ||
                  hasAnyStepStartedOrCompleted ||
                  isFirstStepReadyOrDone ||
                  (isExplicitlyDispatchedStatus && !isExplicitNotDispatchedStatus)
                );

                const dispatchedDate = isDispatched ? (rawDispatchedDate || firstStep?.startedAt) : null;

                const proofingStr = proofingCompletedDate ? format(new Date(proofingCompletedDate), "dd/MM HH:mm") : "—";
                const dispatchedStr = dispatchedDate ? format(new Date(dispatchedDate), "dd/MM HH:mm") : "—";

                const rawStatus = item.statusDisplay || item.status || "in_production";
                const statusLabel = getProductionStatusLabel(rawStatus, isDispatched);

                // Dynamically detect late and warning steps from item steps & SLA estimates
                const lateStep = Array.isArray(item.steps) ? item.steps.find((s: any) =>
                  (typeof s.overdueMinutes === "number" && s.overdueMinutes > 0) ||
                  s.status === "overdue" ||
                  s.status === "late" ||
                  s.slaStatus === "late" ||
                  s.slaStatus === "overdue" ||
                  s.processingStatus === "late" ||
                  s.waitingStatus === "late" ||
                  (s.estimatedCompleteAt && new Date(s.estimatedCompleteAt).getTime() < Date.now() && s.status !== "completed" && s.status !== "done")
                ) : null;

                const warnStep = Array.isArray(item.steps) ? item.steps.find((s: any) =>
                  (typeof s.warningMinutes === "number" && s.warningMinutes > 0) ||
                  s.status === "warning" ||
                  s.slaStatus === "warning" ||
                  s.processingStatus === "warning" ||
                  s.waitingStatus === "warning"
                ) : null;

                const overdueMinutes = item.overdueMinutes || lateStep?.overdueMinutes || (lateStep ? (lateStep.overdueMinutes || Math.round((Date.now() - new Date(lateStep.estimatedCompleteAt || lateStep.readyAt || Date.now()).getTime()) / 60000)) : 0);
                const warningMinutes = item.warningMinutes || warnStep?.warningMinutes || 0;

                const isLate =
                  (typeof item.overdueMinutes === "number" && item.overdueMinutes > 0) ||
                  Boolean(lateStep) ||
                  item.slaStatus === "late" ||
                  item.slaStatus === "overdue" ||
                  statusLabel.toLowerCase().includes("trễ") ||
                  statusLabel.toLowerCase().includes("quá hạn") ||
                  statusLabel.toLowerCase().includes("late");

                const isWarn = !isLate && (
                  (typeof item.warningMinutes === "number" && item.warningMinutes > 0) ||
                  Boolean(warnStep) ||
                  item.slaStatus === "warning" ||
                  statusLabel.toLowerCase().includes("cảnh báo") ||
                  statusLabel.toLowerCase().includes("sắp")
                );

                const isPendingNVL = statusLabel.toLowerCase().includes("chưa xuất") || statusLabel.toLowerCase().includes("vật tư");
                const isCompleted = statusLabel.toLowerCase().includes("hoàn thành") || statusLabel.toLowerCase().includes("done");

                const isUrgent = item.isUrgent || item.isRush || item.priority === "urgent" || item.priority === "high" || item.proofingOrder?.isUrgent || item.isUrgentOrder;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-muted/60 transition-colors cursor-pointer border-b",
                      isSelected && "bg-amber-50/50 dark:bg-amber-950/20"
                    )}
                    onClick={() => onSelectOrder && onSelectOrder(item)}
                  >
                    {/* Checkbox */}
                    <TableCell className="text-center py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>

                    {/* Mã lệnh */}
                    <TableCell className="py-1.5 font-bold font-mono text-primary hover:underline">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{orderCode}</span>
                        {isUrgent && (
                          <Badge className="bg-red-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 animate-pulse border-none shrink-0">
                            🔥 GẤP
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Loại */}
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200">
                        {flowCode}
                      </Badge>
                    </TableCell>

                    {/* Sản phẩm / Chất liệu */}
                    <TableCell className="py-1.5">
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-foreground text-xs">{productName}</span>
                        {subText ? (
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]" title={subText}>
                            {subText}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa có chất liệu</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Thời gian (Bình bài & Điều lệnh) */}
                    <TableCell className="py-1.5 text-muted-foreground font-mono text-[11px] leading-tight">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center gap-1" title="Thời gian Bình bài hoàn thành">
                          <span className="text-[10px] text-slate-400 font-sans font-medium shrink-0">Bình bài:</span>
                          <strong className="font-bold text-foreground">{proofingStr}</strong>
                        </div>
                        <div className="flex items-center gap-1" title="Thời gian Điều lệnh in">
                          <span className="text-[10px] text-slate-400 font-sans font-medium shrink-0">Điều lệnh:</span>
                          <strong className={cn("font-bold", dispatchedDate ? "text-[#93631F]" : "text-slate-400 font-normal")}>
                            {dispatchedStr}
                          </strong>
                        </div>
                      </div>
                    </TableCell>

                    {/* Trạng thái (Detailed Phase Badge) */}
                    <TableCell className="text-center py-1.5">
                      {(() => {
                        // 1. Completed
                        if (isCompleted || item.status === "completed" || item.status === "done") {
                          return (
                            <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              🟢 Hoàn thành
                            </Badge>
                          );
                        }

                        // 2. Not dispatched yet / Pending NVL
                        if (!isDispatched || item.status === "pending_dispatch" || item.status === "pending_material") {
                          if (isPendingNVL || item.status === "pending_material") {
                            return (
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                ⚪ Chưa xuất NVL
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
                              ⌛ Chờ điều lệnh
                            </Badge>
                          );
                        }

                        // 3. Find active step status
                        const rawSteps = item.steps;
                        let stepsArr: any[] = [];
                        if (Array.isArray(rawSteps) && rawSteps.length > 0) {
                          stepsArr = rawSteps;
                        } else {
                          const specBadges = getSpecificationBadges(item);
                          stepsArr = specBadges.map((n) => ({ stepName: n, status: "in_progress" }));
                        }

                        const runningIdx = stepsArr.findIndex(
                          (s: any) => s.status === "in_progress" || s.status === "running" || s.status === "overdue" || s.isCurrent
                        );
                        const readyIdx = stepsArr.findIndex((s: any) => s.status === "ready" || s.status === "waiting");
                        const activeIdx = runningIdx >= 0 ? runningIdx : readyIdx >= 0 ? readyIdx : 0;
                        const activeSt = stepsArr[activeIdx];

                        if (activeSt) {
                          const stName = getShortStepName(activeSt);
                          const isStLate = activeSt.status === "overdue" || activeSt.status === "late" || activeSt.processingStatus === "late" || isLate;
                          const isStWarn = activeSt.status === "warning" || activeSt.processingStatus === "warning" || isWarn;
                          const isRunning = activeSt.status === "in_progress" || activeSt.status === "running";

                          if (isStLate) {
                            return (
                              <Badge className="text-[10px] font-black border-none px-2 py-0.5 whitespace-nowrap bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse">
                                🔴 Trễ: {stName}
                              </Badge>
                            );
                          }
                          if (isStWarn) {
                            return (
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                🟡 Sắp trễ: {stName}
                              </Badge>
                            );
                          }
                          if (isRunning) {
                            return (
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                🔵 Đang {stName}
                              </Badge>
                            );
                          }
                          return (
                            <Badge className="text-[10px] font-semibold border-none px-2 py-0.5 whitespace-nowrap bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200">
                              ⌛ Chờ {stName}
                            </Badge>
                          );
                        }

                        // Fallback
                        return (
                          <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {isLate ? "🔴 Quá hạn" : isWarn ? "🟡 Sắp quá hạn" : `🔵 ${statusLabel}`}
                          </Badge>
                        );
                      })()}
                    </TableCell>

                    {/* NGÀY GIAO HÀNG (Delivery SLA) */}
                    <TableCell className="text-center py-1.5">
                      {(() => {
                        const status = item.deliverySlaStatus;
                        const plannedAt = item.plannedDeliveryAt;
                        const remainingHours = item.deliveryRemainingHours;
                        const lateHours = item.deliveryLateHours;
                        const kcsCompletedAt = item.kcsCompletedAt;
                        const refAt = item.deliveryReferenceAt;
                        const slaDays = item.deliverySlaDays;
                        const warnHours = item.deliveryWarningBeforeHours;

                        const dateStr = plannedAt ? format(new Date(plannedAt), "dd/MM") : "—";
                        const refStr = refAt ? format(new Date(refAt), "dd/MM HH:mm") : "chưa";
                        const kcsStr = kcsCompletedAt ? format(new Date(kcsCompletedAt), "dd/MM") : "chưa";

                        const fullTooltip = `Bình bài: ${refStr} | SLA: ${slaDays ?? 0} ngày | Cảnh báo: ${warnHours ?? 0} giờ | KCS: ${kcsStr}`;

                        if (!status || status === "NOT_APPLIED" || item.deliverySlaUnavailableReason === "NOT_APPLIED") {
                          const flow = getFlowCode(item);
                          const defaultSlaDays =
                            slaDays && slaDays > 0
                              ? slaDays
                              : flow.includes("F05") || flow.includes("F06") || flow.includes("F07") || flow.includes("F08") || flow.includes("F09")
                                ? 2
                                : 3;

                          const effectiveRefDateStr = refAt || item.proofingCompletedAt || item.createdAt || new Date().toISOString();
                          let refDateObj = new Date(effectiveRefDateStr);
                          if (isNaN(refDateObj.getTime())) refDateObj = new Date();

                          const fallbackPlannedDate = plannedAt
                            ? new Date(plannedAt)
                            : new Date(refDateObj.getTime() + defaultSlaDays * 86400000);

                          const fbDateStr = format(fallbackPlannedDate, "dd/MM");
                          const diffMs = fallbackPlannedDate.getTime() - Date.now();
                          const fbRemainingHours = diffMs / 3600000;

                          if (fbRemainingHours <= 0) {
                            const fbLateHours = Math.abs(fbRemainingHours);
                            return (
                              <div
                                className="flex flex-col items-center justify-center cursor-help"
                                title={`Dự kiến giao ${fbDateStr} (SLA ${defaultSlaDays} ngày từ ${format(refDateObj, "dd/MM HH:mm")}) — Trễ ${fbLateHours.toFixed(1)}h | ${fullTooltip}`}
                              >
                                <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                  🔴 {fbDateStr}
                                </Badge>
                                <span className="text-[9.5px] text-rose-600 font-mono mt-0.5">Trễ {fbLateHours.toFixed(1)}h</span>
                              </div>
                            );
                          }

                          if (fbRemainingHours <= 12) {
                            return (
                              <div
                                className="flex flex-col items-center justify-center cursor-help"
                                title={`Dự kiến giao ${fbDateStr} (SLA ${defaultSlaDays} ngày từ ${format(refDateObj, "dd/MM HH:mm")}) — Còn ${fbRemainingHours.toFixed(1)}h | ${fullTooltip}`}
                              >
                                <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  🟡 {fbDateStr}
                                </Badge>
                                <span className="text-[9.5px] text-amber-600 font-mono mt-0.5">Còn {fbRemainingHours.toFixed(1)}h</span>
                              </div>
                            );
                          }

                          return (
                            <div
                              className="flex flex-col items-center justify-center cursor-help"
                              title={`Dự kiến giao ${fbDateStr} (SLA ${defaultSlaDays} ngày từ ${format(refDateObj, "dd/MM HH:mm")}) — Còn ${fbRemainingHours.toFixed(1)}h | ${fullTooltip}`}
                            >
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                🟢 {fbDateStr}
                              </Badge>
                              <span className="text-[9.5px] text-emerald-600 font-mono mt-0.5">Còn {fbRemainingHours.toFixed(1)}h</span>
                            </div>
                          );
                        }

                        if (status === "NORMAL") {
                          return (
                            <div className="flex flex-col items-center justify-center cursor-help" title={`Kịp tiến độ — còn ${remainingHours?.toFixed(1) ?? 0} giờ | ${fullTooltip}`}>
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                🟢 {dateStr}
                              </Badge>
                              <span className="text-[9.5px] text-emerald-600 font-mono mt-0.5">Còn {remainingHours?.toFixed(1) ?? 0}h</span>
                            </div>
                          );
                        }

                        if (status === "WARNING") {
                          return (
                            <div className="flex flex-col items-center justify-center cursor-help" title={`Sắp đến hạn — còn ${remainingHours?.toFixed(1) ?? 0} giờ | ${fullTooltip}`}>
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                🟡 {dateStr}
                              </Badge>
                              <span className="text-[9.5px] text-amber-600 font-mono mt-0.5">Còn {remainingHours?.toFixed(1) ?? 0}h</span>
                            </div>
                          );
                        }

                        if (status === "OVERDUE") {
                          return (
                            <div className="flex flex-col items-center justify-center cursor-help" title={`Quá hạn — trễ ${lateHours?.toFixed(1) ?? 0} giờ | ${fullTooltip}`}>
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                🔴 {dateStr}
                              </Badge>
                              <span className="text-[9.5px] text-rose-600 font-mono mt-0.5">Trễ {lateHours?.toFixed(1) ?? 0}h</span>
                            </div>
                          );
                        }

                        if (status === "ON_TIME") {
                          return (
                            <div className="flex flex-col items-center justify-center cursor-help" title={`Đúng hạn — KCS ${kcsStr} | ${fullTooltip}`}>
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-emerald-700 text-white dark:bg-emerald-800">
                                ✅ {dateStr}
                              </Badge>
                              <span className="text-[9.5px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">✓ KCS {kcsStr}</span>
                            </div>
                          );
                        }

                        if (status === "COMPLETED_LATE") {
                          return (
                            <div className="flex flex-col items-center justify-center cursor-help" title={`Trễ ${lateHours?.toFixed(1) ?? 0} giờ — KCS ${kcsStr} | ${fullTooltip}`}>
                              <Badge className="text-[10px] font-bold border-none px-2 py-0.5 whitespace-nowrap bg-rose-700 text-white dark:bg-rose-800">
                                🔴 {dateStr}
                              </Badge>
                              <span className="text-[9.5px] text-rose-700 dark:text-rose-400 font-mono mt-0.5">Trễ {lateHours?.toFixed(1) ?? 0}h</span>
                            </div>
                          );
                        }

                        return (
                          <div className="text-center font-mono text-xs text-slate-500" title={fullTooltip}>
                            {dateStr}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Tiến độ sản xuất (Full Pipeline Stepper with Step Names) */}
                    <TableCell className="py-1.5">
                      <HorizontalProductionProgress item={item} isLate={isLate} />
                    </TableCell>

                    {/* Báo động */}
                    <TableCell className="text-center py-1.5 font-mono text-xs font-bold whitespace-nowrap">
                      {isLate ? (
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-red-600 dark:text-red-400 font-black text-[11px] animate-pulse">
                            🔴 Quá hạn {overdueMinutes > 0 ? `+${overdueMinutes}p` : ""}
                          </span>
                          <span className="text-[9.5px] text-red-500 font-sans font-medium mt-0.5">
                            {lateStep ? `Khâu ${getShortStepName(lateStep)}` : "Quá hạn SLA"}
                          </span>
                        </div>
                      ) : isWarn ? (
                        <div className="flex flex-col items-center leading-tight">
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                            🟡 Sắp trễ {warningMinutes > 0 ? `còn ${warningMinutes}p` : ""}
                          </span>
                          <span className="text-[9.5px] text-amber-600/80 font-sans font-medium mt-0.5">
                            {warnStep ? `Khâu ${getShortStepName(warnStep)}` : "Sắp tới hạn"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-normal">🟢 Đúng tiến độ</span>
                      )}
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right py-1.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => onSelectOrder && onSelectOrder(item)}
                        title="Xem chi tiết lệnh"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between py-2.5 px-3 border-t bg-card text-xs font-medium text-muted-foreground">
        <div>
          Hiển thị <strong>{productions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{" "}
          <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> trong tổng số{" "}
          <strong>{totalCount}</strong> lệnh
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
            className="h-7 text-xs font-bold px-2"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Trang trước
          </Button>

          <span className="text-xs font-bold px-2 font-mono">
            Trang {currentPage} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="h-7 text-xs font-bold px-2"
          >
            Trang sau <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Proofing Modal */}
      {viewingProofingId && (
        <ReadOnlyProofingDetailModal
          proofingOrderId={viewingProofingId}
          open={!!viewingProofingId}
          onOpenChange={(open) => !open && setViewingProofingId(null)}
        />
      )}

      {/* Die Detail Modal */}
      <ProductionDieDetailModal
        order={viewingDieOrder}
        isOpen={!!viewingDieOrder}
        onClose={() => setViewingDieOrder(null)}
      />
    </div>
  );
}
