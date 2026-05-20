import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Layers,
  Plus,
  FileImage,
  Search,
  Edit,
  Download,
  Trash2,
  Loader2,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { formatDesignDimensions } from "@/utils/format-die-size";
import { downloadFile } from "@/lib/download-utils";
import { QuantityCell } from "./QuantityCell";

function HoverInfoCopy({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || value === "—" || value === "0") return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Đã sao chép ${label.toLowerCase()}: ${value}`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!value || value === "—" || value === "0") return null;

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center p-0.5 ml-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-4 w-4 shrink-0"
      title={`Sao chép ${label}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

interface DetailDesignsListCardProps {
  order: any;
  orderDesigns: any[];
  editingQuantityDesignId: number | null;
  setEditingQuantityDesignId: (id: number | null) => void;
  inlineQuantityValue: string;
  setInlineQuantityValue: (val: string) => void;
  updatingDesignId: number | null;
  handleUpdateDesignQuantity: (designId: number) => void;
  setIsAddDesignDialogOpen: (val: boolean) => void;
  setSelectedDesignForRelatedDies: (data: any) => void;
  setIsRelatedDiesDialogOpen: (val: boolean) => void;
  setViewingImageUrl: (url: string | null) => void;
  setImageViewerOpen: (val: boolean) => void;
  setRemoveDesignTarget: (data: any) => void;
  setIsConfirmRemoveDesignDialogOpen: (val: boolean) => void;
  isRemovingDesign: boolean;
  isQuantityEditOpen: boolean;
  handleOpenQuantityEdit: () => void;
  setIsQuantityEditOpen: (val: boolean) => void;
  updateTotalQuantity: string;
  setUpdateTotalQuantity: (val: string) => void;
  updateDesignQuantities: Record<number, string>;
  setUpdateDesignQuantities: (val: (prev: any) => any) => void;
  onReject?: (pod: any) => void;
  isRejecting?: boolean;
  onFindDie?: (design: any, dimensions: string) => void;
}

export function DetailDesignsListCard({
  order,
  orderDesigns,
  editingQuantityDesignId,
  setEditingQuantityDesignId,
  inlineQuantityValue,
  setInlineQuantityValue,
  updatingDesignId,
  handleUpdateDesignQuantity,
  setIsAddDesignDialogOpen,
  setSelectedDesignForRelatedDies,
  setIsRelatedDiesDialogOpen,
  setViewingImageUrl,
  setImageViewerOpen,
  setRemoveDesignTarget,
  setIsConfirmRemoveDesignDialogOpen,
  isRemovingDesign,
  isQuantityEditOpen,
  handleOpenQuantityEdit,
  setIsQuantityEditOpen,
  updateTotalQuantity,
  setUpdateTotalQuantity,
  updateDesignQuantities,
  setUpdateDesignQuantities,
  onReject,
  isRejecting,
  onFindDie,
}: DetailDesignsListCardProps) {
  if (!order) return null;

  return (
    <Card className="relative">
      <CardHeader className="pb-3 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Danh sách mã hàng ({orderDesigns?.length ?? 0})
          </CardTitle>
          {order && order.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setIsAddDesignDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm mã hàng
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="h-9 px-6 text-[10px] w-12">STT</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">Ảnh</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">Mã hàng</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">
                  Kích thước
                </TableHead>
                <TableHead className="h-9 px-2 text-[10px]">SL</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">
                  Số mặt in
                </TableHead>
                <TableHead className="h-9 px-2 text-[10px]">Quy cách</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">Cán màng</TableHead>
                <TableHead className="h-9 px-2 text-[10px]">
                  Quy cách đầy đủ
                </TableHead>
                <TableHead className="h-9 px-6 text-right text-[10px]">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderDesigns.map((pod, index) => {
                const fullInfo = (
                  <div className="space-y-2 text-sm max-w-md">
                    <div className="font-semibold text-base border-b pb-2">
                      {pod.design?.designName}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Mã hàng:</span>
                        <span className="ml-2 font-mono">
                          {pod.design?.code}
                        </span>
                        {pod.design?.code && (
                          <HoverInfoCopy value={pod.design.code} label="Mã hàng" />
                        )}
                      </div>

                      <div className="flex items-center">
                        <span className="text-muted-foreground">Loại:</span>
                        <span className="ml-2">
                          {pod.design?.designType?.name || "—"}
                        </span>
                        {pod.design?.designType?.name && (
                          <HoverInfoCopy value={pod.design.designType.name} label="Loại" />
                        )}
                      </div>

                      <div className="flex items-center">
                        <span className="text-muted-foreground">
                          Chất liệu:
                        </span>
                        <span className="ml-2">
                          {pod.design?.materialType?.name || "—"}
                        </span>
                        {pod.design?.materialType?.name && (
                          <HoverInfoCopy value={pod.design.materialType.name} label="Chất liệu" />
                        )}
                      </div>

                      <div className="flex items-center">
                        <span className="text-muted-foreground">
                          Kích thước:
                        </span>
                        <span className="ml-2">
                          {formatDesignDimensions(
                            pod.design?.length,
                            pod.design?.width,
                            pod.design?.height,
                          )}{" "}
                          mm
                        </span>
                        {pod.design?.length && (
                          <HoverInfoCopy
                            value={`${formatDesignDimensions(
                              pod.design?.length,
                              pod.design?.width,
                              pod.design?.height,
                            )} mm`}
                            label="Kích thước"
                          />
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground">SL:</span>
                        <span className="ml-2 font-semibold">
                          {pod.quantity?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground">
                          NV mã hàng:
                        </span>
                        <span className="ml-2">
                          {pod.design?.designer?.fullName || "—"}
                        </span>
                      </div>
                    </div>

                    {(pod.design?.processClassification ||
                      pod.design?.sidesClassification ||
                      pod.design?.laminationType) && (
                      <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                        {pod.design?.processClassification && (
                          <Badge variant="secondary" className="text-xs">
                            <span className="text-muted-foreground">
                              Quy cách:
                            </span>
                            <span className="ml-2">
                              {processClassificationLabels[
                                pod.design.processClassification
                              ] || pod.design.processClassification}
                            </span>
                          </Badge>
                        )}
                        {pod.design?.laminationType && (
                          <Badge variant="secondary" className="text-xs">
                            <span className="text-muted-foreground">
                              Cán màng:
                            </span>
                            <span className="ml-2">
                              {laminationTypeLabels[
                                pod.design.laminationType
                              ] || pod.design.laminationType}
                            </span>
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Full Specifications */}
                    {(() => {
                      const rawSpec =
                        (pod.design as any)?.specification ||
                        (pod.design as any)?.specifications ||
                        (pod as any).specification ||
                        (pod as any).specifications ||
                        (pod as any).orderDetail?.specification ||
                        (pod as any).orderDetail?.specifications;

                      let specs: string[] = [];
                      if (Array.isArray(rawSpec)) {
                        specs = rawSpec.filter(
                          (s) => typeof s === "string" && s.trim(),
                        );
                      } else if (typeof rawSpec === "string" && rawSpec.trim()) {
                        const trimmed = rawSpec.trim();
                        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                          try {
                            const parsed = JSON.parse(trimmed);
                            if (Array.isArray(parsed)) {
                              specs = parsed.filter(
                                (s) => typeof s === "string" && s.trim(),
                              );
                            }
                          } catch (e) {}
                        }
                        if (specs.length === 0) {
                          specs = trimmed
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                        }
                      }

                      if (specs.length > 0) {
                        return (
                          <div className="pt-2 border-t space-y-1">
                            <div className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                              Quy cách đầy đủ:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {specs.map((spec, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 py-0 h-5"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="pt-2 border-t space-y-1">
                      <div className="font-semibold text-xs text-muted-foreground">
                        Yêu cầu:
                      </div>
                      <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                        {pod.design?.latestRequirements || "---"}
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      <div className="font-semibold text-xs text-muted-foreground">
                        Ghi chú:
                      </div>
                      <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                        {pod.design?.notes || "---"}
                      </div>
                    </div>
                  </div>
                );

                return (
                  <HoverCard key={pod.id} openDelay={300}>
                    <HoverCardTrigger asChild>
                      <TableRow className="h-14">
                      <TableCell className="px-6 py-1">
                        <p className="text-xs text-muted-foreground">
                          {index + 1}
                        </p>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {pod.design?.designImageUrl ? (
                          <img
                            src={pod.design.designImageUrl}
                            alt={pod.design.designName}
                            className="w-10 h-10 object-cover rounded border cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImageUrl(pod.design.designImageUrl);
                              setImageViewerOpen(true);
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                            <FileImage className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <p className="font-medium text-xs">
                          {pod.design?.code}
                        </p>
                      </TableCell>

                      <TableCell className="px-2 py-1">
                        <div className="text-xs">
                          <p>
                            {formatDesignDimensions(
                              pod.design?.length,
                              pod.design?.width,
                              pod.design?.height,
                            )}{" "}
                            mm
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <QuantityCell
                          pod={pod}
                          editingQuantityDesignId={editingQuantityDesignId}
                          inlineQuantityValue={inlineQuantityValue}
                          setInlineQuantityValue={setInlineQuantityValue}
                          setEditingQuantityDesignId={
                            setEditingQuantityDesignId
                          }
                          handleUpdateDesignQuantity={
                            handleUpdateDesignQuantity
                          }
                          updatingDesignId={updatingDesignId}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <span className="text-xs">
                          {pod.design?.sidesClassification
                            ? sidesClassificationLabels[
                                pod.design.sidesClassification
                              ] || pod.design.sidesClassification
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <span className="text-xs">
                          {pod.design?.processClassification
                            ? processClassificationLabels[
                                pod.design.processClassification
                              ] || pod.design.processClassification
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <span className="text-xs">
                          {pod.design?.laminationType
                            ? laminationTypeLabels[
                                pod.design.laminationType
                              ] || pod.design.laminationType
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const rawSpec =
                              (pod.design as any)?.specification ||
                              (pod.design as any)?.specifications ||
                              (pod as any).specification ||
                              (pod as any).specifications ||
                              (pod as any).orderDetail?.specification ||
                              (pod as any).orderDetail?.specifications;

                            let specs: string[] = [];
                            if (Array.isArray(rawSpec)) {
                              specs = rawSpec.filter(
                                (s) => typeof s === "string" && s.trim(),
                              );
                            } else if (
                              typeof rawSpec === "string" &&
                              rawSpec.trim()
                            ) {
                              const trimmed = rawSpec.trim();
                              if (
                                trimmed.startsWith("[") &&
                                trimmed.endsWith("]")
                              ) {
                                try {
                                  const parsed = JSON.parse(trimmed);
                                  if (Array.isArray(parsed)) {
                                    specs = parsed.filter(
                                      (s) => typeof s === "string" && s.trim(),
                                    );
                                  }
                                } catch (e) {
                                  // Not valid JSON
                                }
                              }
                              if (specs.length === 0) {
                                specs = trimmed
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                              }
                            }

                            if (specs.length > 0) {
                              return specs.map((spec, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 whitespace-nowrap"
                                >
                                  {spec}
                                </Badge>
                              ));
                            }
                            return (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {pod.design?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                const dims = formatDesignDimensions(
                                  pod.design?.length,
                                  pod.design?.width,
                                  pod.design?.height,
                                );
                                onFindDie?.(pod.design, dims);
                              }}
                              title="Tìm khuôn liên quan"
                            >
                              <Search className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {order && order.status !== "completed" && pod.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingQuantityDesignId(pod.id!);
                                setInlineQuantityValue(
                                  pod.quantity?.toString() || "",
                                );
                              }}
                              disabled={
                                editingQuantityDesignId === pod.id ||
                                updatingDesignId === pod.id
                              }
                              title="Cập nhật số lượng"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {pod.design?.designFileUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(
                                  pod.design.designFileUrl,
                                  pod.design.code || `DES-${pod.design.id}`,
                                );
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {order &&
                            order.status !== "completed" &&
                            pod.id &&
                            onReject && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReject(pod);
                                }}
                                disabled={isRejecting}
                                title="Hoàn hàng về phòng thiết kế"
                              >
                                {isRejecting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          {order && order.status !== "completed" && pod.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemoveDesignTarget({
                                  proofingOrderDesignId: pod.id!,
                                  designCode: pod.design?.code,
                                  designName: pod.design?.designName,
                                });
                                setIsConfirmRemoveDesignDialogOpen(true);
                              }}
                              disabled={isRemovingDesign}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-[450px] p-4 max-w-md" side="right" align="start">
                      {fullInfo}
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {order.status !== "completed" && (
          <div className="border-t px-6 py-6 space-y-3">
            {!isQuantityEditOpen && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs w-full"
                onClick={handleOpenQuantityEdit}
              >
                <Edit className="h-3 w-3" />
                Cập nhật số lượng mã hàng
              </Button>
            )}

            {isQuantityEditOpen && (
              <div className="rounded-md bg-muted/30 border px-3 py-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="update-total-quantity">Số giấy in</Label>
                  <Input
                    id="update-total-quantity"
                    type="number"
                    min="1"
                    value={updateTotalQuantity}
                    onChange={(e) => setUpdateTotalQuantity(e.target.value)}
                    placeholder="Nhập số giấy in..."
                  />
                </div>

                {orderDesigns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Cập nhật số lượng theo mã hàng</Label>
                    <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-3 bg-background/40">
                      {orderDesigns.map((pod) => {
                        const designId = pod.id;
                        if (!designId) return null;

                        const currentQty =
                          updateDesignQuantities[designId] || "";
                        const hasChanged =
                          currentQty &&
                          parseInt(currentQty, 10) !== pod.quantity;
                        const isUpdating = updatingDesignId === designId;

                        return (
                          <div
                            key={designId}
                            className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {pod.design?.code || `Design #${designId}`}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {pod.design?.designName || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Hiện tại: {pod.quantity?.toLocaleString() || 0}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={currentQty}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setUpdateDesignQuantities((prev) => ({
                                    ...prev,
                                    [designId]: value,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    hasChanged &&
                                    !isUpdating
                                  ) {
                                    handleUpdateDesignQuantity(designId);
                                  }
                                }}
                                onBlur={() => {
                                  if (hasChanged && !isUpdating) {
                                    handleUpdateDesignQuantity(designId);
                                  }
                                }}
                                placeholder={
                                  pod.quantity?.toString() || "Số lượng"
                                }
                                className="w-24 text-sm"
                                disabled={isUpdating}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs shrink-0"
                                onClick={() =>
                                  handleUpdateDesignQuantity(designId)
                                }
                                disabled={
                                  !hasChanged ||
                                  isUpdating ||
                                  !currentQty ||
                                  parseInt(currentQty, 10) < 1
                                }
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Cập nhật"
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nhập số lượng mới và nhấn "Cập nhật" hoặc Enter cho từng
                      mã hàng
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsQuantityEditOpen(false);
                      setUpdateDesignQuantities((prev) => ({}));
                    }}
                    disabled={updatingDesignId !== null}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
