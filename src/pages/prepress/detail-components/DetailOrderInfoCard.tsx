import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Edit,
  Download,
  Upload,
  Settings2,
  Layers,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  processClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { downloadFile } from "@/lib/download-utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailOrderInfoCardProps {
  order: any;
  editingField: "totalQuantity" | "paperSize" | "notes" | "basisWeight" | "rollWidth" | "code" | "all" | null;
  inlineTotalQuantity: string;
  setInlineTotalQuantity: (val: string) => void;
  inlinePaperSizeId: string;
  setInlinePaperSizeId: (val: string) => void;
  inlineCustomPaperSize: string;
  setInlineCustomPaperSize: (val: string) => void;
  inlineNotes: string;
  setInlineNotes: (val: string) => void;
  inlineBasisWeight?: string;
  setInlineBasisWeight?: (val: string) => void;
  inlineRollWidth?: string;
  setInlineRollWidth?: (val: string) => void;
  paperSizes: any[];
  uniqueProcessClassifications: string[];
  uniqueLaminationTypes: string[];
  uniqueSpecifications: string[];
  isUpdatingInfo: boolean;
  handleStartEditField: (
    field: "totalQuantity" | "paperSize" | "notes" | "basisWeight" | "rollWidth" | "code",
  ) => void;
  handleStartEditAllFields: () => void;
  handleCancelEditField: () => void;
  handleSaveField: () => void;
  setIsUploadDialogOpen: (val: boolean) => void;
  setImageViewerOpen: (val: boolean) => void;
  setViewingImageUrl: (val: string | null) => void;
  onDeleteImage?: (imageId: number) => void;
  isProofer?: boolean;
}

export function DetailOrderInfoCard({
  order,
  editingField,
  inlineTotalQuantity,
  setInlineTotalQuantity,
  inlinePaperSizeId,
  setInlinePaperSizeId,
  inlineCustomPaperSize,
  setInlineCustomPaperSize,
  inlineNotes,
  setInlineNotes,
  inlineBasisWeight = "",
  setInlineBasisWeight = () => {},
  inlineRollWidth = "",
  setInlineRollWidth = () => {},
  paperSizes,
  uniqueProcessClassifications,
  uniqueLaminationTypes,
  uniqueSpecifications,
  isUpdatingInfo,
  handleStartEditField,
  handleStartEditAllFields,
  handleCancelEditField,
  handleSaveField,
  setIsUploadDialogOpen,
  setImageViewerOpen,
  setViewingImageUrl,
  onDeleteImage,
  isProofer = true,
}: DetailOrderInfoCardProps) {
  if (!order) return null;

  const firstDesignCustomer = order.proofingOrderDesigns?.[0]?.design?.customer;
  const nestedOrderCustomer = order.order?.customer;
  const customerSource =
    order.customer || nestedOrderCustomer || firstDesignCustomer;

  const customerName =
    order.customerName ||
    order.order?.customerName ||
    customerSource?.name ||
    null;
  const customerCompanyName =
    order.customerCompanyName ||
    order.order?.customerCompanyName ||
    customerSource?.companyName ||
    null;

  const customerDisplayName = customerCompanyName || customerName || "—";

  const designDesignerNames = Array.from(
    new Set(
      (order.proofingOrderDesigns ?? [])
        .map((pod: any) => pod?.design?.designer)
        .map((designer: any) => designer?.fullName || designer?.name)
        .filter(Boolean),
    ),
  ) as string[];

  const designerDisplay =
    (designDesignerNames.length > 0 && designDesignerNames.join(", ")) ||
    order.creator?.fullName ||
    order.creator?.name ||
    order.createdBy?.fullName ||
    order.createdBy?.name ||
    "-";

  const gsmWarnings = useMemo(() => {
    if (!order?.basisWeight || !order?.proofingOrderDesigns || order.proofingOrderDesigns.length === 0) return [];
    
    const warnings: { type: "error" | "warning"; message: string }[] = [];
    order.proofingOrderDesigns.forEach((pod: any) => {
      const designGsm = pod.design?.basisWeight;
      const designCode = pod.design?.code || `DES-${pod.design?.id}`;
      if (designGsm) {
        if (order.basisWeight < designGsm) {
          warnings.push({
            type: "error",
            message: `GSM ${order.basisWeight} nhỏ hơn thiết kế ${designCode} (${designGsm} gsm)!`,
          });
        } else if (order.basisWeight > designGsm + 50) {
          warnings.push({
            type: "warning",
            message: `GSM ${order.basisWeight} dày hơn thiết kế ${designCode} (${designGsm} gsm)!`,
          });
        }
      }
    });
    return warnings;
  }, [order?.basisWeight, order?.proofingOrderDesigns]);

  const hasGrammage = useMemo(() => {
    const familyName = order.materialType?.materialFamilyName?.toLowerCase() || "";
    const typeName = order.materialType?.name?.toLowerCase() || "";
    const typeCode = order.materialType?.code?.toLowerCase() || "";

    return (
      familyName.includes("giấy") ||
      familyName.includes("giay") ||
      familyName.includes("paper") ||
      typeName.includes("giấy") ||
      typeName.includes("giay") ||
      typeName.includes("paper") ||
      typeName.includes("ivory") ||
      typeName.includes("bristol") ||
      typeName.includes("couche") ||
      typeName.includes("duplex") ||
      typeName.includes("kraft") ||
      typeCode.includes("paper")
    );
  }, [order.materialType]);

  return (
    <Card className="relative h-full flex flex-col">
      <CardHeader className="pb-1.5 px-4 flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="text-sm flex items-center gap-2 whitespace-nowrap">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          Thông tin bình bài
        </CardTitle>
        {order.status !== "completed" && editingField !== "all" && isProofer && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/5 shrink-0 flex items-center gap-1"
            onClick={handleStartEditAllFields}
            title="Sửa tất cả thông tin"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 flex-1 flex flex-col gap-2">
        {/* Image Display - Narrower Aspect */}
        <div className="mt-2">
          {((order.images && order.images.length > 0) || order.imageUrl) ? (
            <div className="flex flex-col gap-2">
              <div className={`grid gap-2 w-full ${(order.images && order.images.length > 1) ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* Legacy single imageUrl fallback */}
                {order.imageUrl && (!order.images || order.images.length === 0) && (
                  <div
                    className="relative aspect-[21/9] w-full overflow-hidden rounded-md border border-muted-foreground/10 bg-muted/5 group cursor-zoom-in"
                    onClick={() => {
                      setViewingImageUrl(order.imageUrl);
                      setImageViewerOpen(true);
                    }}
                  >
                    <img
                      src={order.imageUrl}
                      alt="Bình bài"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
                    </div>
                  </div>
                )}

                {/* Multi-image display */}
                {order.images && order.images.map((img: any, idx: number) => (
                  <div
                    key={img.id || idx}
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-muted-foreground/10 bg-muted/5 group cursor-zoom-in"
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Ảnh bình bài ${idx + 1}`}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onClick={() => {
                        setViewingImageUrl(img.imageUrl);
                        setImageViewerOpen(true);
                      }}
                    />
                    
                    {/* Maximize Icon */}
                    <div 
                      className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                    >
                      <Maximize2 className="h-5 w-5 text-white drop-shadow-md" />
                    </div>

                    {/* Delete Icon (Top-Right, Hoverable) */}
                    {order.status !== "completed" && onDeleteImage && isProofer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteImage(img.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-sm"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center aspect-[21/9] w-full rounded-md border border-dashed border-muted-foreground/20 bg-muted/5 group">
              <ImageIcon className="h-5 w-5 text-muted-foreground/20 mb-0.5 group-hover:text-muted-foreground/40 transition-colors" />
              <p className="text-[9px] text-muted-foreground/40 font-medium">
                Chưa có ảnh
              </p>
            </div>
          )}
        </div>

        {gsmWarnings.length > 0 && (
          <div className="flex flex-col gap-1.5 px-0.5 pt-1.5">
            {gsmWarnings.map((w, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-semibold border",
                  w.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
                    : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400"
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    w.type === "error" ? "bg-red-500" : "bg-amber-500"
                  )}
                />
                <span className="leading-tight">{w.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-2 pt-2">
          {/* Key Metrics Row */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Số giấy in
                {editingField !== "all" && !order.totalQuantity && (
                  <span title="Chưa chọn số giấy" className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full">!</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                {editingField === "all" ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      type="number"
                      min="1"
                      value={inlineTotalQuantity}
                      onChange={(e) => setInlineTotalQuantity(e.target.value)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      className="h-6 text-xs font-bold px-2 w-24"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveField();
                        else if (e.key === "Escape") handleCancelEditField();
                      }}
                      autoFocus={false}
                    />
                  </div>
                ) : (
                  <p className="font-bold text-[12px]">
                    {(order.totalQuantity ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Số lượng mã hàng
              </Label>
              <p className="font-bold text-[12px]">
                {order.proofingOrderDesigns?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="h-px bg-muted-foreground/5" />

          {/* Paper and Material */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Khổ giấy
                {editingField !== "all" && !(order.paperSize?.name || order.customPaperSize) && (
                  <span title="Chưa chọn khổ giấy" className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full">!</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                {editingField === "all" ? (
                  <div className="flex gap-1.5 items-center">
                    <SearchableSelect
                      value={inlinePaperSizeId}
                      onValueChange={setInlinePaperSizeId}
                      className="h-6 text-xs px-2 w-[120px] bg-slate-50 hover:bg-slate-100"
                      placeholder="Chọn khổ..."
                      searchPlaceholder="Tìm khổ..."
                      popoverWidth="w-[200px]"
                      options={[
                        { value: "custom", label: "-- Nhập thủ công --" },
                        ...paperSizes.map((ps) => ({
                          value: ps.id.toString(),
                          label: `${ps.name} cm`
                        }))
                      ]}
                    />
                    {inlinePaperSizeId === "custom" && (
                      <Input
                        value={inlineCustomPaperSize}
                        onChange={(e) =>
                          setInlineCustomPaperSize(e.target.value)
                        }
                        placeholder="ví dụ: 90×90"
                        className="h-6 text-xs px-2 w-24"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveField();
                          else if (e.key === "Escape")
                            handleCancelEditField();
                        }}
                        autoFocus={false}
                      />
                    )}
                  </div>
                ) : (
                  <p className="font-bold text-[12px]">
                    {order.paperSize?.name ||
                      order.customPaperSize ||
                      "Chưa chọn"} cm
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0 mt-0.5">
                Chất liệu
              </Label>
              <div className="text-right min-w-0">
                <p className="font-bold text-[12px] leading-tight truncate">
                  {order.materialType?.name || "—"}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {order.materialType?.code || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0 mt-0.5">
                Loại thiết kế
              </Label>
              <div className="text-right min-w-0">
                <p className="font-bold text-[12px] leading-tight truncate">
                  {order.designType?.name || "—"}
                </p>
              </div>
            </div>

            {hasGrammage && (
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Định lượng (GSM)
                </Label>
                <div className="flex items-center gap-1">
                  {editingField === "all" ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={inlineBasisWeight}
                        onChange={(e) => setInlineBasisWeight(e.target.value)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="h-6 text-xs font-bold px-2 w-24"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveField();
                          else if (e.key === "Escape") handleCancelEditField();
                        }}
                        autoFocus={false}
                      />
                    </div>
                  ) : (
                    <p className="font-bold text-[12px]">
                      {order.basisWeight ? `${order.basisWeight} gsm` : "Chưa nhập"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {((order.materialType?.name?.toLowerCase().includes("cuộn") ||
              order.materialType?.name?.toLowerCase().includes("cuon") ||
              order.materialType?.name?.toLowerCase().includes("pe") ||
              order.materialType?.name?.toLowerCase().includes("pa") ||
              order.rollWidth) ? (
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Khổ cuộn (mm)
                </Label>
                <div className="flex items-center gap-1">
                  {editingField === "all" ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={inlineRollWidth}
                        onChange={(e) => setInlineRollWidth(e.target.value)}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="h-6 text-xs font-bold px-2 w-24"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveField();
                          else if (e.key === "Escape") handleCancelEditField();
                        }}
                        autoFocus={false}
                      />
                    </div>
                  ) : (
                    <p className="font-bold text-[12px]">
                      {order.rollWidth ? `${order.rollWidth} mm` : "Chưa nhập"}
                    </p>
                  )}
                </div>
              </div>
            ) : null)}
          </div>

          <div className="h-px bg-muted-foreground/5" />

          {/* Classification Badges */}
          <div className="flex flex-col gap-1.5">
            {uniqueSpecifications && uniqueSpecifications.length > 0 ? (
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Quy cách đầy đủ
                </Label>
                <div className="flex flex-wrap gap-1 justify-end">
                  {uniqueSpecifications.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-[9px] font-bold px-1 py-0 bg-amber-100 text-amber-700 border-none"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                    Quy cách
                  </Label>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {uniqueProcessClassifications.map((c) => (
                      <Badge
                        key={c}
                        variant="secondary"
                        className="text-[9px] font-bold px-1 py-0 bg-primary/10 text-primary border-none"
                      >
                        {processClassificationLabels[c] || c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                    Cán màng
                  </Label>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {uniqueLaminationTypes.map((l) => (
                      <Badge
                        key={l}
                        variant="secondary"
                        className="text-[9px] font-bold px-1 py-0 bg-blue-50 text-blue-700 border-none"
                      >
                        {laminationTypeLabels[l] || l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-px bg-muted-foreground/5" />

          {/* Customer Info */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-4">
              <Label className="text-muted-foreground text-[11px] font-normal uppercase tracking-tight shrink-0 mt-0.5">
                Khách hàng
              </Label>
              <div className="text-right min-w-0">
                <p className="font-bold text-[13px] leading-snug break-words">
                  {customerDisplayName}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-muted-foreground/5" />

          {/* Designer & Date */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Thiết kế
              </Label>
              {designDesignerNames.length > 2 ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-bold text-[12px] truncate cursor-help border-b border-dotted border-slate-400 dark:border-slate-600">
                        {designDesignerNames.slice(0, 2).join(", ")}...
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] text-xs font-semibold text-slate-800 bg-white border border-slate-200 shadow-lg p-2.5 rounded-lg">
                      {designDesignerNames.join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="font-bold text-[12px] truncate">
                  {designerDisplay}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Ngày nhận
              </Label>
              <p className="font-bold text-[11px]">
                {order.createdAt
                  ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Ghi chú - Compact Box */}
          <div className="p-2 bg-amber-50/40 border border-amber-100 rounded-md text-[12px] italic text-amber-900/80">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800/60 font-sans">
                Ghi chú
              </span>
            </div>
            {editingField === "all" ? (
              <div className="space-y-1 mt-1">
                <Textarea
                  value={inlineNotes}
                  onChange={(e) => setInlineNotes(e.target.value)}
                  rows={2}
                  className="text-[12px] p-1.5 h-auto min-h-[40px] not-italic"
                  autoFocus={false}
                />
              </div>
            ) : (
              <p className="line-clamp-3">
                {order.notes || "Không có ghi chú"}
              </p>
            )}
          </div>

          {editingField === "all" && (
            <div className="flex gap-2 justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                onClick={handleCancelEditField}
                disabled={isUpdatingInfo}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={handleSaveField}
                disabled={isUpdatingInfo}
              >
                {isUpdatingInfo && <Loader2 className="h-3 w-3 animate-spin mr-1 shrink-0" />}
                Lưu tất cả
              </Button>
            </div>
          )}

          <div className="pt-1.5 space-y-1.5 flex-none mb-auto">
            {order.proofingFileUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 min-h-[28px] max-h-7 text-[11px] font-bold gap-2 border-primary/20 hover:bg-primary/5 text-primary flex-none"
                onClick={() =>
                  downloadFile(order.proofingFileUrl, order.code || "file")
                }
              >
                <Download className="h-3 w-3 shrink-0" />
                Tải hình ảnh bình bài
              </Button>
            ) : (
              order.status !== "completed" && isProofer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 min-h-[28px] max-h-7 text-[11px] font-bold gap-2 border-dashed border-primary/40 hover:border-primary text-primary flex-none"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-3 w-3 shrink-0" />
                  Tải lên hình ảnh bình bài
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
