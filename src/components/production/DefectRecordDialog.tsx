// src/components/production/DefectRecordDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { useProductionOrder } from "@/hooks/use-production";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import { useCreateDefectRecord } from "@/hooks/use-defect-record";
import { AsyncSelect } from "@/components/forms/AsyncSelect";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type { UserResponsePaginate } from "@/Schema";

export interface DefectRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: number;
  prefilledStepId?: number | null;
  prefilledDesignId?: number | null;
  prefilledQuantity?: number | null;
  prefilledDescription?: string | null;
  prefilledAssignedToUserId?: number | null;
  prefilledDefectSource?: string | null;
  onSuccess?: () => void;
}

const DEFECT_SOURCES = [
  { value: "design", label: "Lỗi do thiết kế" },
  { value: "proofing", label: "Lỗi do bình bài" },
  { value: "production", label: "Lỗi do sản xuất" },
  { value: "management_decision", label: "Quyết định quản lý" },
];

export function DefectRecordDialog({
  open,
  onOpenChange,
  productionOrderId,
  prefilledStepId,
  prefilledDesignId,
  prefilledQuantity,
  prefilledDescription,
  prefilledAssignedToUserId,
  prefilledDefectSource,
  onSuccess,
}: DefectRecordDialogProps) {
  // Form states
  const [stepId, setStepId] = useState<string>("none");
  const [designId, setDesignId] = useState<string>("");
  const [defectQuantity, setDefectQuantity] = useState<string>("1");
  const [defectSource, setDefectSource] = useState<string>("production");
  const [assignedToUserId, setAssignedToUserId] = useState<string | number>("");
  const [defectOccurredAt, setDefectOccurredAt] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data fetching
  const { data: productionOrder, isLoading: loadingProduction } = useProductionOrder(
    open && productionOrderId ? productionOrderId : null,
    open && !!productionOrderId
  );

  const { data: proofingOrder, isLoading: loadingProofing } = useProofingOrder(
    productionOrder?.proofingOrderId || null,
    open && !!productionOrder?.proofingOrderId
  );

  const createDefectMutation = useCreateDefectRecord();

  // Load active users for autocomplete
  const loadUsersOptions = async (search?: string) => {
    try {
      const res = await apiRequest.get<UserResponsePaginate>("/users", {
        params: {
          pageNumber: 1,
          pageSize: 100,
          isActive: true,
          search: search || undefined,
        },
      });
      return (res.data?.items ?? []).map((u) => ({
        value: u.id,
        label: u.fullName || u.username || `User #${u.id}`,
        description: u.role ? `Vai trò: ${u.role}` : undefined,
      }));
    } catch (err) {
      console.error("loadUsersOptions error:", err);
      return [];
    }
  };

  // Set default datetime to now (Asia/Ho_Chi_Minh offset or local browser format)
  useEffect(() => {
    if (open) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDefectOccurredAt(localISO);
    }
  }, [open]);

  // Sync pre-fills
  useEffect(() => {
    if (open) {
      if (prefilledStepId) setStepId(prefilledStepId.toString());
      if (prefilledDesignId) setDesignId(prefilledDesignId.toString());
      if (prefilledQuantity) setDefectQuantity(prefilledQuantity.toString());
      if (prefilledDescription) setDescription(prefilledDescription);
      if (prefilledAssignedToUserId) setAssignedToUserId(prefilledAssignedToUserId);
      if (prefilledDefectSource) setDefectSource(prefilledDefectSource);
    } else {
      // Reset form
      setStepId("none");
      setDesignId("");
      setDefectQuantity("1");
      setDefectSource("production");
      setAssignedToUserId("");
      setDescription("");
      setErrors({});
    }
  }, [
    open,
    prefilledStepId,
    prefilledDesignId,
    prefilledQuantity,
    prefilledDescription,
    prefilledAssignedToUserId,
    prefilledDefectSource,
  ]);

  // Auto-select design if there is only 1 design in the proofing order
  useEffect(() => {
    if (open && proofingOrder?.proofingOrderDesigns && proofingOrder.proofingOrderDesigns.length === 1) {
      const singleDesign = proofingOrder.proofingOrderDesigns[0].design;
      if (singleDesign?.id) {
        setDesignId(singleDesign.id.toString());
      }
    }
  }, [open, proofingOrder]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!designId) {
      newErrors.designId = "Vui lòng chọn thiết kế/mã hàng bị lỗi";
    }

    const qty = Number(defectQuantity);
    if (!defectQuantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      newErrors.defectQuantity = "Số lượng lỗi phải là số nguyên dương lớn hơn 0";
    }

    if (!assignedToUserId) {
      newErrors.assignedToUserId = "Vui lòng chọn người chịu trách nhiệm";
    }

    if (!defectOccurredAt) {
      newErrors.defectOccurredAt = "Vui lòng chọn thời gian xảy ra lỗi";
    } else {
      const selectedDate = new Date(defectOccurredAt);
      if (selectedDate > new Date()) {
        newErrors.defectOccurredAt = "Thời gian xảy ra lỗi không được ở tương lai";
      }
    }

    if (!description.trim()) {
      newErrors.description = "Vui lòng nhập mô tả chi tiết lỗi";
    } else if (description.length > 1000) {
      newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Find orderDetailId from selected design
    const selectedDesignIdNum = Number(designId);
    const relatedPod = proofingOrder?.proofingOrderDesigns?.find(
      (pod) => pod.design?.id === selectedDesignIdNum
    );

    const payload = {
      productionOrderId: productionOrderId,
      productionStepId: stepId !== "none" ? Number(stepId) : undefined,
      designId: selectedDesignIdNum,
      orderDetailId: relatedPod?.id || undefined,
      defectQuantity: Number(defectQuantity),
      description: description.trim(),
      defectSource: defectSource,
      assignedToUserId: Number(assignedToUserId),
      defectOccurredAt: new Date(defectOccurredAt).toISOString(),
    };

    createDefectMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      },
    });
  };

  const isMutating = createDefectMutation.isPending;
  const isDataLoading = loadingProduction || loadingProofing;

  const designOptions = proofingOrder?.proofingOrderDesigns ?? [];
  const stepsOptions = productionOrder?.steps ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !isMutating && onOpenChange(v)}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Ghi nhận lỗi sản xuất</DialogTitle>
          <DialogDescription>
            Tạo bản ghi lỗi phục vụ khấu trừ lương hoặc đánh giá chất lượng công việc.
          </DialogDescription>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Lệnh sản xuất (Readonly) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Lệnh sản xuất
              </Label>
              <Input
                value={
                  productionOrder?.proofingOrderCode ||
                  (productionOrder?.id ? `#${productionOrder.id}` : "")
                }
                readOnly
                className="bg-muted text-muted-foreground h-9 text-sm font-semibold"
              />
            </div>

            {/* Mã hàng/Thiết kế */}
            <div className="space-y-1">
              <Label htmlFor="design-select" className="text-sm font-medium">
                Mã hàng lỗi <span className="text-red-500">*</span>
              </Label>
              <Select value={designId} onValueChange={setDesignId} disabled={isMutating}>
                <SelectTrigger id="design-select" className="h-9">
                  <SelectValue placeholder="Chọn thiết kế bị lỗi..." />
                </SelectTrigger>
                <SelectContent>
                  {designOptions.map((pod) => (
                    <SelectItem key={pod.id} value={pod.design?.id?.toString() || ""}>
                      {pod.design?.designName} ({pod.design?.code || "Chưa có mã"})
                    </SelectItem>
                  ))}
                  {designOptions.length === 0 && (
                    <SelectItem value="none" disabled>
                      Không có thiết kế nào
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.designId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.designId}
                </p>
              )}
            </div>

            {/* Công đoạn lỗi */}
            <div className="space-y-1">
              <Label htmlFor="step-select" className="text-sm font-medium">
                Công đoạn lỗi
              </Label>
              <Select value={stepId} onValueChange={setStepId} disabled={isMutating}>
                <SelectTrigger id="step-select" className="h-9">
                  <SelectValue placeholder="Chọn công đoạn..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Khác / QC</SelectItem>
                  {stepsOptions.map((step) => (
                    <SelectItem key={step.id} value={step.id?.toString() || ""}>
                      Bước {step.stepOrder}: {step.stepTypeName || step.stepType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nguồn lỗi */}
              <div className="space-y-1">
                <Label htmlFor="source-select" className="text-sm font-medium">
                  Nguồn lỗi <span className="text-red-500">*</span>
                </Label>
                <Select value={defectSource} onValueChange={setDefectSource} disabled={isMutating}>
                  <SelectTrigger id="source-select" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Số lượng lỗi */}
              <div className="space-y-1">
                <Label htmlFor="quantity-input" className="text-sm font-medium">
                  Số lượng lỗi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity-input"
                  type="number"
                  min="1"
                  step="1"
                  value={defectQuantity}
                  onChange={(e) => setDefectQuantity(e.target.value)}
                  disabled={isMutating}
                  className="h-9"
                />
                {errors.defectQuantity && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.defectQuantity}
                  </p>
                )}
              </div>
            </div>

            {/* Người chịu trách nhiệm (Autocomplete) */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-sm font-medium mb-1">
                Người chịu trách nhiệm <span className="text-red-500">*</span>
              </Label>
              <AsyncSelect
                value={assignedToUserId}
                onValueChange={(val) => setAssignedToUserId(val as string | number)}
                loadOptions={loadUsersOptions}
                placeholder="Tìm kiếm nhân viên..."
                emptyMessage="Không tìm thấy nhân viên"
                disabled={isMutating}
                className="w-full h-9"
              />
              {errors.assignedToUserId && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.assignedToUserId}
                </p>
              )}
            </div>

            {/* Thời gian xảy ra lỗi */}
            <div className="space-y-1">
              <Label htmlFor="occurred-input" className="text-sm font-medium">
                Thời gian xảy ra lỗi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="occurred-input"
                type="datetime-local"
                value={defectOccurredAt}
                onChange={(e) => setDefectOccurredAt(e.target.value)}
                disabled={isMutating}
                className="h-9"
              />
              {errors.defectOccurredAt && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.defectOccurredAt}
                </p>
              )}
            </div>

            {/* Mô tả lỗi */}
            <div className="space-y-1">
              <Label htmlFor="description-input" className="text-sm font-medium">
                Mô tả chi tiết lỗi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description-input"
                placeholder="Ví dụ: Cán màng nhăn mép, In lệch màu nhạt hơn bài mẫu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isMutating}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                ) : (
                  <div />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {description.length}/1000 ký tự
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMutating}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isMutating || isDataLoading}>
            {isMutating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu ghi nhận"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
