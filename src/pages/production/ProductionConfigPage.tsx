import React, { useState, useEffect } from "react";
import { Clock, Save, RefreshCw, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProductionConfig, useUpdateProductionConfig } from "@/hooks/use-production-timing";

const PRODUCTION_STEPS = [
  { stepType: "dispatch", label: "Điều lệnh" },
  { stepType: "material_export", label: "Xuất vật tư" },
  { stepType: "print", label: "Lệnh in" },
  { stepType: "lamination", label: "Cán màng" },
  { stepType: "mounting", label: "Bồi" },
  { stepType: "pressing", label: "Ép kim" },
  { stepType: "die_cut", label: "Bế" },
  { stepType: "cut", label: "Cắt" },
  { stepType: "glue", label: "Dán" },
  { stepType: "packaging", label: "Đóng gói / KCS" },
];

export default function ProductionConfigPage() {
  const { data: configItems, isLoading, refetch } = useProductionConfig();
  const { mutate: updateConfig, isPending: isSaving } = useUpdateProductionConfig();

  const [formState, setFormState] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (configItems && Array.isArray(configItems)) {
      const initial: Record<string, string> = {};
      configItems.forEach((item) => {
        initial[item.key] = item.value || "0";
      });
      PRODUCTION_STEPS.forEach((step) => {
        const deadlineKey = `Production_DeadlineHours_${step.stepType}`;
        const warningKey = `Production_WarningHours_${step.stepType}`;
        if (initial[deadlineKey] === undefined) initial[deadlineKey] = "24";
        if (initial[warningKey] === undefined) initial[warningKey] = "12";
      });
      setFormState(initial);
    }
  }, [configItems]);

  const handleChange = (key: string, val: string) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
    const stepType = key.replace(/^Production_(Deadline|Warning)Hours_/, "");
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[stepType];
      return next;
    });
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    const payload: Record<string, string> = {};

    PRODUCTION_STEPS.forEach((step) => {
      const deadlineKey = `Production_DeadlineHours_${step.stepType}`;
      const warningKey = `Production_WarningHours_${step.stepType}`;

      const deadlineVal = parseFloat(formState[deadlineKey] || "0");
      const warningVal = parseFloat(formState[warningKey] || "0");

      if (isNaN(deadlineVal) || deadlineVal <= 0) {
        errors[step.stepType] = "Thời hạn phải > 0";
      } else if (isNaN(warningVal) || warningVal <= 0) {
        errors[step.stepType] = "Cảnh báo phải > 0";
      } else if (warningVal >= deadlineVal) {
        errors[step.stepType] = `Cảnh báo (${warningVal}h) phải < Hạn tối đa (${deadlineVal}h)`;
      }

      payload[deadlineKey] = String(formState[deadlineKey] || "24");
      payload[warningKey] = String(formState[warningKey] || "12");
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Vui lòng sửa các lỗi trước khi lưu!");
      return;
    }

    setValidationErrors({});
    updateConfig(payload);
  };

  // Split 10 steps into 2 balanced columns (5 per column) for compact display
  const col1Steps = PRODUCTION_STEPS.slice(0, 5);
  const col2Steps = PRODUCTION_STEPS.slice(5, 10);

  const renderStepCard = (step: typeof PRODUCTION_STEPS[0], globalIndex: number) => {
    const deadlineKey = `Production_DeadlineHours_${step.stepType}`;
    const warningKey = `Production_WarningHours_${step.stepType}`;
    const error = validationErrors[step.stepType];

    return (
      <div
        key={step.stepType}
        className="p-2.5 px-3 rounded-lg border bg-white dark:bg-slate-900 flex flex-col gap-1.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Step Info */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 border">
              {globalIndex + 1}
            </span>
            <div className="truncate">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                ({step.stepType})
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Warning */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hidden sm:inline">
                Vàng:
              </span>
              <Input
                type="number"
                min="1"
                step="0.5"
                value={formState[warningKey] || ""}
                onChange={(e) => handleChange(warningKey, e.target.value)}
                placeholder="12"
                className="h-7 w-16 text-center text-xs font-mono font-bold border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 focus:border-amber-500 focus:ring-amber-500 p-0"
              />
              <span className="text-[10px] text-slate-400">h</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 hidden sm:inline">
                Đỏ:
              </span>
              <Input
                type="number"
                min="1"
                step="0.5"
                value={formState[deadlineKey] || ""}
                onChange={(e) => handleChange(deadlineKey, e.target.value)}
                placeholder="24"
                className="h-7 w-16 text-center text-xs font-mono font-bold border-red-300/80 bg-red-50/50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500 p-0"
              />
              <span className="text-[10px] text-slate-400">h</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-[10.5px] text-red-600 font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 px-2 rounded border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Cấu hình giờ sản xuất</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời hạn tối đa (Đỏ) & Ngưỡng cảnh báo (Vàng) cho 10 khâu sản xuất (tính bằng giờ).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Tải lại
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="h-8 text-xs font-bold shadow-xs"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            Lưu cấu hình
          </Button>
        </div>
      </div>

      {/* Compact Info Banner */}
      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span><strong>Vàng (Cảnh báo):</strong> vượt ngưỡng, chưa quá hạn.</span>
          <span><strong>Đỏ (Quá hạn):</strong> vượt thời hạn tối đa.</span>
          <span className="text-amber-700 dark:text-amber-400"><em>Lưu ý: Chỉ cảnh báo — KHÔNG chặn thao tác.</em></span>
        </div>
      </div>

      {/* 2-Column Grid Layout of 10 steps for zero vertical scrolling */}
      <Card className="shadow-xs border flex-1">
        <CardHeader className="py-2.5 px-4 border-b bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cấu hình thời gian 10 khâu sản xuất
          </CardTitle>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="h-4 text-[9px] px-1 bg-amber-50 text-amber-700 border-amber-300">Vàng</Badge> Ngưỡng cảnh báo
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="h-4 text-[9px] px-1 bg-red-50 text-red-700 border-red-300">Đỏ</Badge> Hạn tối đa
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Column 1: Steps 1 to 5 */}
            <div className="space-y-2">
              {col1Steps.map((step, idx) => renderStepCard(step, idx))}
            </div>

            {/* Column 2: Steps 6 to 10 */}
            <div className="space-y-2">
              {col2Steps.map((step, idx) => renderStepCard(step, idx + 5))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
