import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  Search,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Plus,
  Trash2,
  X,
  User,
  Image as ImageIcon,
  Edit2,
  Factory,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { AsyncSelect } from "@/components/forms/AsyncSelect";
import { getStatusColorClass } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/http";

import {
  useProductionOrders,
  useUpdateProductionStep,
  useUpdateProductionOrderItem,
  useBulkUpdateProductionOrderItems,
} from "@/hooks/use-production";
import { useProofingOrder } from "@/hooks/use-proofing-order";
import {
  useDefectRecordsByProductionOrder,
  defectRecordKeys,
} from "@/hooks/use-defect-record";
import type {
  ProductionOrderResponse,
  ProductionStepResponse,
} from "@/Schema";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// SUB-COMPONENT: QCInspectionRow
// ============================================================================

interface QCInspectionRowProps {
  prod: ProductionOrderResponse;
  searchTerm: string;
}

function QCInspectionRow({ prod, searchTerm }: QCInspectionRowProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  
  const [tempPackagingValues, setTempPackagingValues] = useState<
    Record<
      number,
      {
        outputQty: string;
        defectQty: string;
        notes: string;
        assignedToUserId?: string;
        defectSource?: string;
      }
    >
  >({});

  // Query defect records only when row is expanded
  const { data: defectRecordsData } = useDefectRecordsByProductionOrder(
    prod.id || null,
    undefined,
    !!prod.id && isExpanded,
  );
  const defectRecords = defectRecordsData?.items || [];

  const { mutate: updateStep } = useUpdateProductionStep();
  const { mutateAsync: bulkUpdateOrderItems } = useBulkUpdateProductionOrderItems();

  // Query proofing order only when row is expanded
  const { data: proofingOrderData, isLoading: isProofingLoading } = useProofingOrder(
    prod.proofingOrderId || null,
    !!prod.proofingOrderId && isExpanded,
  );
  const proofingOrder = (proofingOrderData || prod.proofingOrder) as any;

  const orderImages = useMemo(() => {
    if (!proofingOrder) return [];
    const urls: string[] = [];
    if (proofingOrder.imageUrl) {
      urls.push(proofingOrder.imageUrl);
    }
    if (Array.isArray(proofingOrder.images)) {
      proofingOrder.images.forEach((img: any) => {
        if (img.imageUrl) urls.push(img.imageUrl);
      });
    }
    return urls;
  }, [proofingOrder]);

  const productionItems = (prod as any).items || [];
  const steps = prod.steps || [];
  const packagingSteps = getSteps(steps, ["đóng gói", "giao hàng"], "packaging");
  const packagingStep = packagingSteps[0] || null;

  const defaultPrintQty =
    (proofingOrder as any)?.totalProcessedQty ||
    (proofingOrder as any)?.totalQuantity ||
    0;

  const loadUsersOptions = useCallback(async (search?: string) => {
    try {
      const res = await apiRequest.get<any>("/users", {
        params: {
          pageNumber: 1,
          pageSize: 100,
          isActive: true,
          search: search || undefined,
        },
      });
      return (res.data?.items ?? []).map((u: any) => ({
        value: u.id,
        label: u.fullName || u.username || `User #${u.id}`,
        description: u.role ? `Vai trò: ${u.role}` : undefined,
      }));
    } catch (err) {
      console.error("loadUsersOptions error:", err);
      return [];
    }
  }, []);

  const handleStatusChange = (newStatus: string) => {
    if (!packagingStep || !packagingStep.id) {
      toast.error("Không tìm thấy bước kiểm hàng/đóng gói!");
      return;
    }
    updateStep({
      stepId: packagingStep.id,
      data: {
        status: newStatus,
        inputQty: packagingStep.inputQty || defaultPrintQty || undefined,
        outputQty: packagingStep.outputQty || defaultPrintQty || undefined,
        defectQty: packagingStep.defectQty || undefined,
        notes: (packagingStep as any).notes || (packagingStep as any).defectNotes || undefined,
      },
    });
  };

  const startEditing = () => {
    setIsExpanded(true);

    // Auto-progress step to 'in_progress' if ready
    if (
      packagingStep &&
      packagingStep.id &&
      packagingStep.status !== "in_progress" &&
      packagingStep.status !== "done"
    ) {
      updateStep({
        stepId: packagingStep.id,
        data: {
          status: "in_progress",
          inputQty: packagingStep.inputQty || undefined,
          outputQty: packagingStep.outputQty || undefined,
          defectQty: packagingStep.defectQty || undefined,
        },
      });
    }

    setTempPackagingValues({});
    setIsEditing(true);
  };

  // Auto-initialize edit values once proofingOrder is loaded
  useEffect(() => {
    if (isEditing && proofingOrder && proofingOrder.proofingOrderDesigns && Object.keys(tempPackagingValues).length === 0) {
      const initialValues: typeof tempPackagingValues = {};
      proofingOrder.proofingOrderDesigns.forEach((pod: any) => {
        const prodItem = productionItems.find(
          (i: any) =>
            i.proofingOrderDesignId === pod.id ||
            i.designId === pod.designId ||
            i.id === pod.id,
        );

        const outQtyVal = prodItem?.outputQty != null && prodItem.outputQty !== 0
          ? prodItem.outputQty
          : prodItem?.producedQty != null && prodItem.producedQty !== 0
            ? prodItem.producedQty
            : 0;

        const outQty = outQtyVal > 0 ? outQtyVal.toString() : "";
        const defQty = prodItem?.defectQty != null && prodItem.defectQty !== 0
          ? prodItem.defectQty.toString()
          : "";
        const notesVal = prodItem?.notes || "";

        const existingDefect = defectRecords.find(
          (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
        );

        initialValues[pod.id] = {
          outputQty: outQty,
          defectQty: defQty,
          notes: notesVal,
          assignedToUserId: existingDefect?.assignedToUserId?.toString() || "",
          defectSource: existingDefect?.defectSource || "production",
        };
      });
      setTempPackagingValues(initialValues);
    }
  }, [isEditing, proofingOrder, productionItems, defectRecords, tempPackagingValues]);

  const handleTempChange = (
    podId: number,
    field: "outputQty" | "defectQty" | "notes" | "assignedToUserId" | "defectSource",
    value: string,
  ) => {
    setTempPackagingValues((prev) => ({
      ...prev,
      [podId]: {
        ...prev[podId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!proofingOrder?.proofingOrderDesigns) return;

    // Validate quantities
    const hasInvalid = proofingOrder.proofingOrderDesigns.some((pod: any) => {
      const values = tempPackagingValues[pod.id];
      if (!values) return true;
      const outQty = Number(values.outputQty);
      return isNaN(outQty) || outQty <= 0;
    });

    if (hasInvalid) {
      toast.error("Số lượng ra phải lớn hơn 0!");
      return;
    }

    const missingEmployee = proofingOrder.proofingOrderDesigns.some((pod: any) => {
      const values = tempPackagingValues[pod.id];
      if (!values) return false;
      const defQty = Number(values.defectQty) || 0;
      return defQty > 0 && !values.assignedToUserId;
    });

    if (missingEmployee) {
      toast.error("Vui lòng chọn nhân viên chịu trách nhiệm lỗi!");
      return;
    }

    try {
      const itemsToUpdate = proofingOrder.proofingOrderDesigns
        .map((pod: any) => {
          const prodItem = productionItems.find(
            (i: any) =>
              i.proofingOrderDesignId === pod.id ||
              i.designId === pod.designId ||
              i.id === pod.id,
          );
          if (!prodItem) return null;
          const values = tempPackagingValues[pod.id] || {
            outputQty: "",
            defectQty: "",
            notes: "",
          };
          return {
            itemId: prodItem.id,
            outputQty: Number(values.outputQty) || 0,
            defectQty: Number(values.defectQty) || 0,
            notes: values.notes || "",
          };
        })
        .filter(Boolean) as any[];

      // 1. Bulk update production order items
      await bulkUpdateOrderItems({
        productionOrderId: prod.id!,
        data: { items: itemsToUpdate },
      });

      // 2. Manage defect records
      const defectPromises = proofingOrder.proofingOrderDesigns.map(async (pod: any) => {
        const prodItem = productionItems.find(
          (i: any) =>
            i.proofingOrderDesignId === pod.id ||
            i.designId === pod.designId ||
            i.id === pod.id,
        );
        if (!prodItem) return;
        const values = tempPackagingValues[pod.id] || {
          outputQty: "",
          defectQty: "",
          notes: "",
          assignedToUserId: "",
          defectSource: "production",
        };
        const defectQtyNum = Number(values.defectQty) || 0;

        const existingDefect = defectRecords.find(
          (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
        );

        const oldDefectQty = existingDefect ? existingDefect.defectQuantity : 0;
        const oldWorkerId = existingDefect ? existingDefect.assignedToUserId?.toString() : "";
        const oldDefectSource = existingDefect ? existingDefect.defectSource : "production";
        const oldDescription = existingDefect ? existingDefect.description || "" : "";

        const newWorkerId = values.assignedToUserId || "";
        const newDefectSource = values.defectSource || "production";
        const newDescription = values.notes.trim() || `Lỗi ghi nhận tại khâu kiểm hàng cho mã hàng ${pod.design?.code || pod.design?.designName || ""}`;

        const isUnchanged =
          defectQtyNum === oldDefectQty &&
          newWorkerId === oldWorkerId &&
          newDefectSource === oldDefectSource &&
          (defectQtyNum === 0 || newDescription === oldDescription);

        if (!isUnchanged) {
          if (existingDefect) {
            if (defectQtyNum > 0) {
              await apiRequest.put(`/defect-records/${existingDefect.id}`, {
                defectQuantity: defectQtyNum,
                assignedToUserId: Number(newWorkerId),
                defectSource: newDefectSource,
                description: newDescription,
              });
            } else {
              await apiRequest.delete(`/defect-records/${existingDefect.id}`);
            }
          } else {
            if (defectQtyNum > 0) {
              await apiRequest.post("/defect-records", {
                productionOrderId: prod.id!,
                productionStepId: packagingStep?.id || undefined,
                designId: pod.design?.id,
                orderDetailId: pod.id,
                defectQuantity: defectQtyNum,
                description: newDescription,
                defectSource: newDefectSource,
                assignedToUserId: Number(newWorkerId),
                defectOccurredAt: new Date().toISOString(),
              });
            }
          }
        }
      });

      await Promise.all(defectPromises);

      queryClient.invalidateQueries({
        queryKey: defectRecordKeys.all,
      });

      setIsEditing(false);
      toast.success("Đã cập nhật số lượng thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu số lượng kiểm hàng!");
    }
  };

  return (
    <TableRow className="hover:bg-slate-50/50">
      {/* 1. Job details */}
      <TableCell className="align-top py-4 font-bold text-sm text-center w-[125px] max-w-[125px] border-r">
        <div className="flex flex-col items-center gap-1.5 px-1">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 rounded-full cursor-pointer hover:bg-slate-100 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </Button>
            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-[13px] tracking-wide bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded shadow-sm">
              {prod.proofingOrderCode || `BB${prod.proofingOrderId}`}
            </span>
          </div>

          {isExpanded && isProofingLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {orderImages.length > 0 && (
                <div
                  onClick={() => setViewingImageUrl(orderImages[activeImageIdx])}
                  className="relative w-16 h-16 rounded border border-slate-200 shadow-sm overflow-hidden bg-slate-50 cursor-zoom-in hover:scale-105 transition-all mt-1.5"
                >
                  <img
                    src={orderImages[activeImageIdx]}
                    alt="Hình bài"
                    className="w-full h-full object-cover"
                  />
                  {orderImages.length > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 font-bold">
                      {activeImageIdx + 1}/{orderImages.length}
                    </div>
                  )}
                </div>
              )}
              {isExpanded && orderImages.length > 1 && (
                <div className="flex gap-1 mt-1 justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-4 w-4 rounded-full p-0"
                    onClick={() => setActiveImageIdx((prev) => (prev - 1 + orderImages.length) % orderImages.length)}
                  >
                    <ChevronLeft className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-4 w-4 rounded-full p-0"
                    onClick={() => setActiveImageIdx((prev) => (prev + 1) % orderImages.length)}
                  >
                    <ChevronRight className="h-2.5 w-2.5" />
                  </Button>
                </div>
              )}
            </>
          )}

          {prod.customerName && (
            <span className="text-[10px] text-muted-foreground font-semibold text-center mt-1 break-words line-clamp-2 leading-tight">
              {prod.customerName}
            </span>
          )}
        </div>
      </TableCell>

      {/* 2. Step Status selector */}
      <TableCell className="align-top py-4 w-[140px] max-w-[140px] border-r">
        {packagingStep ? (
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Trạng thái:</span>
            <Select
              value={packagingStep.status || "pending"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                className={cn(
                  "h-8 text-[11px] font-bold px-2.5 border-transparent focus:ring-0 shadow-sm rounded-md",
                  getStatusColorClass(packagingStep.status || "pending")
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="text-xs font-semibold">Chờ</SelectItem>
                <SelectItem value="in_progress" className="text-xs font-semibold">Đang thực hiện</SelectItem>
                <SelectItem value="done" className="text-xs font-semibold">Hoàn thành</SelectItem>
                <SelectItem value="blocked" className="text-xs font-semibold">Bị chặn / Lỗi</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-1.5">
              {isExpanded ? (
                isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="h-7 w-full text-xs font-bold bg-[#93631F] hover:bg-[#7a521a] text-white"
                    >
                      Lưu
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setTempPackagingValues({});
                      }}
                      variant="outline"
                      size="sm"
                      className="h-7 w-full text-xs"
                    >
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={startEditing}
                    variant="outline"
                    size="sm"
                    className="h-7 w-full text-xs font-bold text-[#93631F] border-[#93631F] hover:bg-stone-50"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Sửa số lượng
                  </Button>
                )
              ) : (
                <Button
                  onClick={startEditing}
                  variant="outline"
                  size="sm"
                  className="h-7 w-full text-xs font-bold text-[#93631F] border-[#93631F] hover:bg-stone-50"
                >
                  Nhập số lượng
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            Không có khâu đóng gói
          </div>
        )}
      </TableCell>

      {/* 3. Items list with quantity inputs */}
      <TableCell className="align-top py-4">
        {!isExpanded ? (
          <div className="flex flex-col gap-1.5 py-3">
            <p className="text-xs text-muted-foreground font-semibold">
              Bấm nút mở rộng hoặc nút "Nhập số lượng" để kiểm hàng cho sản phẩm.
            </p>
            {productionItems.length > 0 && (
              <span className="text-[11px] font-bold text-[#93631F] bg-amber-50 border border-amber-100 w-fit px-2.5 py-0.5 rounded mt-2 block">
                Số lượng sản phẩm: {productionItems.length}
              </span>
            )}
          </div>
        ) : isProofingLoading ? (
          <div className="space-y-2 animate-pulse py-4">
            <div className="h-8 bg-muted rounded w-full"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        ) : proofingOrder?.proofingOrderDesigns && proofingOrder.proofingOrderDesigns.length > 0 ? (
          <div className="flex flex-col gap-3.5 divide-y divide-slate-100">
            {proofingOrder.proofingOrderDesigns.map((pod: any, idx: number) => {
              const prodItem = productionItems.find(
                (i: any) =>
                  i.proofingOrderDesignId === pod.id ||
                  i.designId === pod.designId ||
                  i.id === pod.id,
              );

              const designImgUrl = pod.designImageUrl || pod.design?.designImageUrl || pod.design?.designImageUrlConverted || pod.thumbnailUrl || pod.design?.thumbnailUrl;

              return (
                <div key={pod.id} className="grid grid-cols-[1fr_200px] gap-6 pt-3.5 first:pt-0">
                  {/* Left: Item metadata */}
                  <div className="flex gap-3.5 items-start">
                    {designImgUrl && (
                      <div
                        onClick={() => setViewingImageUrl(designImgUrl)}
                        className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-white shrink-0 cursor-zoom-in shadow-sm"
                      >
                        <img
                          src={designImgUrl}
                          alt={pod.design?.code || "design"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[13px] text-stone-900 leading-tight mb-1 break-all">
                        {pod.design?.designName || pod.design?.code || "—"}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-semibold">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          Mã: <span className="font-bold">{pod.design?.code || "—"}</span>
                        </span>
                        {pod.design?.dimensions && (
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            KT: {pod.design.dimensions}
                          </span>
                        )}
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                          Yêu cầu: {pod.quantity} SP
                        </span>
                      </div>
                      {(pod.notes || pod.design?.notes) && (
                        <p className="text-[10px] text-amber-600 font-semibold italic mt-1.5 leading-snug">
                          Ghi chú: {pod.notes || pod.design?.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity / Defect Inputs */}
                  <div className="flex flex-col gap-1.5 justify-center min-w-[200px] bg-slate-50/50 p-2 rounded border">
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        {/* Output Qty */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-600 uppercase w-7 shrink-0 text-right">RA:</span>
                          <Input
                            type="number"
                            value={tempPackagingValues[pod.id]?.outputQty ?? ""}
                            onChange={(e) => handleTempChange(pod.id, "outputQty", e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="h-8 text-[12px] px-2 py-1 focus-visible:ring-emerald-500 font-extrabold tabular-nums w-full"
                          />
                        </div>

                        {/* Defect Qty */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-red-600 uppercase w-7 shrink-0 text-right">LỖI:</span>
                          <Input
                            type="number"
                            value={tempPackagingValues[pod.id]?.defectQty ?? ""}
                            onChange={(e) => handleTempChange(pod.id, "defectQty", e.target.value)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="h-8 text-[12px] px-2 py-1 focus-visible:ring-red-500 font-extrabold text-red-600 tabular-nums w-full"
                          />
                        </div>

                        {/* Worker and defect source selection if defectQty > 0 */}
                        {Number(tempPackagingValues[pod.id]?.defectQty) > 0 && (
                          <div className="flex flex-col gap-2 border-t border-dashed pt-2 mt-1">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-[9px] font-bold text-red-600 uppercase">Nhân viên lỗi</span>
                              <AsyncSelect
                                value={tempPackagingValues[pod.id]?.assignedToUserId || ""}
                                onValueChange={(val) => handleTempChange(pod.id, "assignedToUserId", val?.toString() || "")}
                                loadOptions={loadUsersOptions}
                                placeholder="Chọn nhân viên..."
                                emptyMessage="Không tìm thấy"
                                className="w-full text-[10px] h-7 min-h-7"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Nguồn lỗi</span>
                              <Select
                                value={tempPackagingValues[pod.id]?.defectSource || "production"}
                                onValueChange={(val) => handleTempChange(pod.id, "defectSource", val)}
                              >
                                <SelectTrigger className="h-7 text-[10px] px-2 py-0 bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="design" className="text-xs">Lỗi thiết kế</SelectItem>
                                  <SelectItem value="proofing" className="text-xs">Lỗi bình bài</SelectItem>
                                  <SelectItem value="production" className="text-xs">Lỗi sản xuất</SelectItem>
                                  <SelectItem value="management_decision" className="text-xs">Quyết định QL</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <Input
                          placeholder="Ghi chú lỗi..."
                          className="h-7 w-full text-[10px] px-2 py-1 bg-background mt-0.5"
                          value={tempPackagingValues[pod.id]?.notes ?? ""}
                          onChange={(e) => handleTempChange(pod.id, "notes", e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 w-full text-xs font-semibold">
                        <div className="flex items-center justify-between gap-2 border-b border-dashed pb-1">
                          <span className="text-[11px] font-bold text-emerald-600 uppercase">Đã làm (Ra)</span>
                          <span className="text-[13px] tabular-nums font-bold text-emerald-700">
                            {prodItem?.outputQty != null
                              ? prodItem.outputQty
                              : prodItem?.producedQty != null
                                ? prodItem.producedQty
                                : 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-red-600 uppercase">Số lượng lỗi</span>
                          <span className="text-[13px] tabular-nums font-bold text-red-600">
                            {prodItem?.defectQty != null ? prodItem.defectQty : 0}
                          </span>
                        </div>

                        {/* Display defect details if any */}
                        {(() => {
                          const matchingDefects = defectRecords.filter(
                            (dr) => dr.designId === pod.design?.id || dr.orderDetailId === pod.id
                          );
                          if (matchingDefects.length === 0) return null;
                          return (
                            <div className="text-[9px] text-muted-foreground mt-1 border-t border-dashed pt-1 space-y-1 text-left">
                              {matchingDefects.map((dr: any) => (
                                <div key={dr.id} className="flex flex-col gap-0.5 border-b border-dotted last:border-0 pb-0.5 last:pb-0">
                                  <div className="flex justify-between items-center gap-1 font-semibold text-foreground">
                                    <span className="truncate max-w-[100px]" title={dr.assignedToUserName}>
                                      {dr.assignedToUserName}
                                    </span>
                                    <span className="font-bold text-red-600 shrink-0">
                                      {dr.defectQuantity}
                                    </span>
                                  </div>
                                  {dr.defectSourceDisplay && (
                                    <span className="text-[8px] text-red-500 italic block">
                                      ({dr.defectSourceDisplay})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {prodItem?.notes && (
                          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-500 break-words leading-tight border-l-2 border-amber-500 pl-1 mt-1 bg-amber-50/50 py-0.5">
                            Ghi chú: {prodItem.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">
            Không tìm thấy sản phẩm nào
          </div>
        )}
      </TableCell>

      {/* Viewing zoom image dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          open={!!viewingImageUrl}
          onOpenChange={(open) => !open && setViewingImageUrl(null)}
          imageUrl={viewingImageUrl}
        />
      )}
    </TableRow>
  );
}

// ============================================================================
// MAIN COMPONENT: QCInspectionView
// ============================================================================

interface QCInspectionViewProps {
  tab: "pending_qc" | "completed";
}

export function QCInspectionView({ tab }: QCInspectionViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  const queryParams = useMemo(() => {
    const params: any = {
      pageNumber: currentPage,
      pageSize: 10,
      tab: tab,
    };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    return params;
  }, [currentPage, tab, debouncedSearch]);

  const { data: resp, isLoading, refetch } = useProductionOrders(queryParams);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const orders = useMemo<ProductionOrderResponse[]>(() => {
    if (resp && typeof resp === "object" && "items" in resp) {
      return (resp.items as ProductionOrderResponse[]) || [];
    }
    return [];
  }, [resp]);

  const totalCount = useMemo(() => {
    if (resp && typeof resp === "object" && "total" in resp) {
      return (resp.total as number) ?? 0;
    }
    return orders.length;
  }, [resp, orders]);

  const totalPages = useMemo(() => {
    if (resp && typeof resp === "object" && "totalPages" in resp) {
      return (resp.totalPages as number) ?? 1;
    }
    return Math.ceil(totalCount / 10) || 1;
  }, [resp, totalCount]);

  return (
    <div className="space-y-4">
      {/* Search filter */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã bài, tên khách hàng..."
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1" onClick={() => refetch()}>
          <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-stone-500" />
            <p className="text-sm text-muted-foreground font-medium">Đang tải danh sách bài in...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Factory className="h-10 w-10 text-muted-foreground mb-1" />
            <p className="text-sm font-semibold text-slate-700">Không có bài in nào</p>
            <p className="text-xs text-muted-foreground">Không tìm thấy bài in phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 font-bold border-b text-[12px] uppercase text-slate-600">
                <TableRow>
                  <TableHead className="w-[125px] max-w-[125px] text-center font-bold">Mã bài / Hình bài</TableHead>
                  <TableHead className="w-[140px] max-w-[140px] font-bold">Thao tác</TableHead>
                  <TableHead className="font-bold">Danh sách hàng & Số lượng kiểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((prod) => (
                  <QCInspectionRow key={prod.id} prod={prod} searchTerm={debouncedSearch} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && orders.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 bg-white shrink-0">
            <div className="text-xs font-semibold text-slate-500">
              Hiển thị {orders.length} / {totalCount} đơn kiểm hàng
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Trang trước
              </Button>
              <span className="text-xs font-bold text-slate-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
