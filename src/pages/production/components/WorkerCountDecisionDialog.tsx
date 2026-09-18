import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Users, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateStepWorkerCountV2 } from "@/hooks/use-production";

interface WorkerCountDecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: number;
  stepName: string;
  orderCode?: string;
  defaultWorkerCount?: number | null;
  requiredByKpi?: number | null;
  currentWorkerCount?: number | null;
  onSuccess?: () => void;
}

export const WorkerCountDecisionDialog: React.FC<WorkerCountDecisionDialogProps> = ({
  isOpen,
  onClose,
  stepId,
  stepName,
  orderCode,
  defaultWorkerCount,
  requiredByKpi,
  currentWorkerCount,
  onSuccess,
}) => {
  const [workerCount, setWorkerCount] = useState<number>(
    currentWorkerCount ?? requiredByKpi ?? defaultWorkerCount ?? 1
  );

  const updateWorkerCountV2 = useUpdateStepWorkerCountV2();

  useEffect(() => {
    if (isOpen) {
      setWorkerCount(currentWorkerCount ?? requiredByKpi ?? defaultWorkerCount ?? 1);
    }
  }, [isOpen, currentWorkerCount, requiredByKpi, defaultWorkerCount]);

  const reqKpi = requiredByKpi ?? 0;
  const defWorker = defaultWorkerCount ?? 0;

  // Validation Logic (Section 2.2 of Specification)
  const isZeroWorkerBlocked = reqKpi > 0 && workerCount === 0;

  const getWarningMessages = () => {
    const warnings: string[] = [];
    if (workerCount !== defWorker && defWorker > 0) {
      warnings.push(`Khác với số công mặc định quy trình (${defWorker})`);
    }
    if (workerCount !== reqKpi && reqKpi > 0) {
      warnings.push(`Khác với số công đề xuất theo định mức KPI (${reqKpi})`);
    }
    return warnings;
  };

  const warnings = getWarningMessages();

  const handleSave = async () => {
    if (isZeroWorkerBlocked) {
      toast.error(
        `Khâu này cần ít nhất ${reqKpi} công theo KPI. Không thể đặt số công = 0.`
      );
      return;
    }

    try {
      const result = await updateWorkerCountV2.mutate({
        stepId,
        actualWorkerCount: workerCount,
      });

      if (result?.warningMessage) {
        toast.warning(result.warningMessage);
      } else {
        toast.success(`Đã cập nhật ${workerCount} công cho khâu ${stepName}!`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật số công nhân sự.";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-amber-900 dark:text-amber-400" />
            Điều chỉnh số công — Khâu {stepName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {orderCode ? `Lệnh sản xuất: ${orderCode}` : "Quản lý quyết định số công điều phối trên công đoạn."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4 text-xs">
          {/* 3-Way Metrics Comparison */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg border bg-muted/30 text-center space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium block">Mặc định Flow</span>
              <span className="text-sm font-extrabold font-mono text-foreground">
                {defWorker > 0 ? `${defWorker} công` : "—"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-center space-y-1">
              <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold block">Đề xuất KPI</span>
              <span className="text-sm font-extrabold font-mono text-amber-900 dark:text-amber-200">
                {reqKpi > 0 ? `${reqKpi} công` : "—"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-center space-y-1">
              <span className="text-[10px] text-emerald-900 dark:text-emerald-300 font-bold block">Hiện tại</span>
              <span className="text-sm font-extrabold font-mono text-emerald-950 dark:text-emerald-100">
                {currentWorkerCount ?? workerCount} công
              </span>
            </div>
          </div>

          {/* Actual Worker Input */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-foreground block text-xs">
              Số công thực tế quyết định:
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={workerCount}
                onChange={(e) => setWorkerCount(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="h-9 font-mono font-bold text-center text-sm border-amber-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-muted-foreground shrink-0">công</span>
            </div>
          </div>

          {/* Validation Error Block */}
          {isZeroWorkerBlocked && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed font-semibold">
                Khâu này cần ít nhất {reqKpi} công theo KPI. Không thể đặt số công = 0. Vui lòng nhập số công &ge; {reqKpi} hoặc liên hệ quản lý để điều chỉnh KPI.
              </div>
            </div>
          )}

          {/* Warning Messages */}
          {!isZeroWorkerBlocked && warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Cảnh báo lệch định mức:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-900 dark:text-amber-300 pl-1">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isZeroWorkerBlocked || updateWorkerCountV2.isPending}
            className="bg-amber-900 hover:bg-amber-950 text-white font-bold gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            {updateWorkerCountV2.isPending ? "Đang lưu..." : "Xác nhận số công"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
