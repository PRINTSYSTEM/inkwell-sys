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

function formatDesignCreatedDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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
  onReject?: (pod: any) => void;
  isRejecting?: boolean;
  onFindDie?: (design: any, dimensions: string) => void;
  highlightSearchTerm?: string;
  isProofer?: boolean;
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
  onReject,
  isRejecting,
  onFindDie,
  highlightSearchTerm = "",
  isProofer = true,
}: DetailDesignsListCardProps) {
  // order null check moved below (hooks must be called first)

  const isDieExported = (order?.dieExports?.length ?? 0) > 0 || (order?.proofingOrderDies?.length ?? 0) > 0;

  const highlightText = (text: string, search: string) => {
    if (!search || !text) return text;
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-emerald-500 text-white font-semibold px-0.5 rounded animate-pulse"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };
  const isDecal =
    orderDesigns?.[0]?.design?.designType?.name
      ?.toLowerCase()
      .includes("decal") ?? false;
  const hasDieCutDesigns = React.useMemo(() => {
    if (!orderDesigns || orderDesigns.length === 0) return false;
    return orderDesigns.some(
      (pod) => pod.design?.processClassification === "die_cut",
    );
  }, [orderDesigns]);

  return (
    <Card className="relative">
      <CardHeader className="pb-3 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Danh sách mã hàng ({orderDesigns?.length ?? 0})
          </CardTitle>
          {order && order.status !== "completed" && isProofer && (
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
              <TableRow className="h-10">
                <TableHead className="w-12 text-center">STT</TableHead>

                <TableHead className="w-20 text-center">
                  Ảnh
                </TableHead>

                <TableHead className="w-40">
                  Mã hàng
                </TableHead>

                <TableHead className="w-36">
                  Kích thước
                </TableHead>

                <TableHead className="w-28 whitespace-nowrap">
                  Ngày TK
                </TableHead>

                <TableHead className="w-20 text-center">
                  SL
                </TableHead>

                <TableHead className="w-24 text-center">
                  {isDecal ? "Loại SP" : "Số mặt"}
                </TableHead>

                <TableHead>
                  Quy cách đầy đủ
                </TableHead>

                <TableHead className="w-48 text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderDesigns.map((pod, index) => {
                const fullInfo = (
                  <div className="space-y-2 text-sm max-w-md">
                    <div className="font-semibold text-base border-b pb-2 flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 break-words flex-1 leading-snug">
                          {pod.design?.designName}
                        </div>
                        {pod.isUrgent && (
                          <span className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-red-300 shrink-0">
                            Gấp
                          </span>
                        )}
                      </div>
                      {pod.design?.customer && (
                        <div className="text-muted-foreground font-normal text-sm break-words w-full">
                          {pod.design.customer.companyName || pod.design.customer.name}
                        </div>
                      )}
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
                          Thiết kế:
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
                          } catch (e) {
                            // Không phải JSON hợp lệ — fallback sang tách theo dấu phẩy bên dưới
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
                        <TableCell className="px-2 py-1 text-center">
                          <p className="text-xs text-muted-foreground">
                            {index + 1}
                          </p>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          {pod.design?.designThumbnailUrl || pod.design?.designImageUrl ? (
                            <img
                              src={pod.design.designThumbnailUrl || pod.design.designImageUrl}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-xs">
                              {highlightText(pod.design?.code || "", highlightSearchTerm)}
                            </p>
                            {pod.isUrgent && (
                              <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                                Gấp
                              </span>
                            )}
                          </div>
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
                        <TableCell className="px-2 py-1 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">
                            {formatDesignCreatedDate(pod.design?.createdAt)}
                          </span>
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
                              ? pod.design.designType?.name?.toLowerCase().includes("decal")
                                ? pod.design.sidesClassification === "one_side"
                                  ? "Decal lẻ"
                                  : pod.design.sidesClassification === "two_side"
                                    ? "Decal bộ"
                                    : sidesClassificationLabels[
                                    pod.design.sidesClassification
                                    ] || pod.design.sidesClassification
                                : sidesClassificationLabels[
                                pod.design.sidesClassification
                                ] || pod.design.sidesClassification
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
                        <TableCell className="px-6 py-2 text-right">
                          <div className="flex flex-col gap-1 items-stretch w-28 ml-auto py-1">
                            {hasDieCutDesigns && pod.design?.id && pod.design?.processClassification === "die_cut" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 justify-start gap-1.5 text-[11px] font-normal"
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
                                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">Tìm khuôn</span>
                              </Button>
                            )}
                            {order && order.status !== "completed" && pod.id && isProofer && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 justify-start gap-1.5 text-[11px] font-normal"
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
                                <Edit className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">Sửa SL</span>
                              </Button>
                            )}
                            {order && order.status !== "completed" && pod.id && isProofer && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 justify-start gap-1.5 text-[11px] font-normal text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/10 hover:border-destructive/20"
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
                                title="Xóa mã hàng"
                              >
                                <Trash2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">Xóa Mã</span>
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
      </CardContent>
    </Card>
  );
}
