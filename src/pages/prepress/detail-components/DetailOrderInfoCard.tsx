import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface DetailOrderInfoCardProps {
  order: any;
  editingField: "totalQuantity" | "paperSize" | "notes" | "all" | null;
  inlineTotalQuantity: string;
  setInlineTotalQuantity: (val: string) => void;
  inlinePaperSizeId: string;
  setInlinePaperSizeId: (val: string) => void;
  inlineCustomPaperSize: string;
  setInlineCustomPaperSize: (val: string) => void;
  inlineNotes: string;
  setInlineNotes: (val: string) => void;
  paperSizes: any[];
  uniqueProcessClassifications: string[];
  uniqueLaminationTypes: string[];
  uniqueSpecifications: string[];
  isUpdatingInfo: boolean;
  handleStartEditField: (
    field: "totalQuantity" | "paperSize" | "notes",
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
            size="icon"
            className="h-7 w-7 text-primary hover:bg-primary/5 shrink-0"
            onClick={handleStartEditAllFields}
            title="Cập nhật thông tin"
          >
            <Edit className="h-3.5 w-3.5" />
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

        <div className="flex-1 flex flex-col gap-2 pt-2">
          {/* Key Metrics Row */}
          <div className="flex flex-col gap-1.5">
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() =>
                order.status !== "completed" &&
                editingField !== "all" &&
                isProofer &&
                handleStartEditField("totalQuantity")
              }
            >
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Số giấy in
                {!(editingField === "totalQuantity" || editingField === "all") && !order.totalQuantity && (
                  <span title="Chưa chọn số giấy" className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full">!</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                {(editingField === "totalQuantity" || editingField === "all") ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      type="number"
                      min="1"
                      value={inlineTotalQuantity}
                      onChange={(e) => setInlineTotalQuantity(e.target.value)}
                      className="h-6 text-xs font-bold px-2 w-24"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveField();
                        else if (e.key === "Escape") handleCancelEditField();
                      }}
                      autoFocus={editingField === "totalQuantity"}
                    />
                    {editingField !== "all" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-[10px] text-green-600"
                        onClick={handleSaveField}
                        disabled={isUpdatingInfo}
                      >
                        Lưu
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-[12px]">
                      {(order.totalQuantity ?? 0).toLocaleString()}
                    </p>
                    {order.status !== "completed" && (
                      <Edit className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </>
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
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() =>
                order.status !== "completed" &&
                editingField !== "all" &&
                isProofer &&
                handleStartEditField("paperSize")
              }
            >
              <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                Khổ giấy
                {!(editingField === "paperSize" || editingField === "all") && !(order.paperSize?.name || inlinePaperSizeId) && (
                  <span title="Chưa chọn khổ giấy" className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full">!</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                {(editingField === "paperSize" || editingField === "all") ? (
                  <div className="flex gap-1.5 items-center">
                    <Select
                      value={inlinePaperSizeId}
                      onValueChange={setInlinePaperSizeId}
                    >
                      <SelectTrigger className="h-6 text-xs px-2 min-w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">
                          -- Nhập thủ công --
                        </SelectItem>
                        {paperSizes.map((ps) => (
                          <SelectItem key={ps.id} value={ps.id.toString()}>
                            {ps.name} cm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        autoFocus={editingField === "paperSize"}
                      />
                    )}
                    {editingField !== "all" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-[10px] text-green-600"
                        onClick={handleSaveField}
                        disabled={isUpdatingInfo}
                      >
                        Lưu
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-[12px]">
                      {order.paperSize?.name ||
                        order.customPaperSize ||
                        "Chưa chọn"} cm
                    </p>
                    {order.status !== "completed" && isProofer && (
                      <Edit className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </>
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
              <p className="font-bold text-[12px] truncate">
                {designerDisplay}
              </p>
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
              {order.status !== "completed" && editingField !== "notes" && editingField !== "all" && isProofer && (
                <button
                  onClick={() => handleStartEditField("notes")}
                  className="text-amber-800/40 hover:text-amber-800 transition-colors"
                >
                  <Edit className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            {(editingField === "notes" || editingField === "all") ? (
              <div className="space-y-1 mt-1">
                <Textarea
                  value={inlineNotes}
                  onChange={(e) => setInlineNotes(e.target.value)}
                  rows={2}
                  className="text-[12px] p-1.5 h-auto min-h-[40px] not-italic"
                  autoFocus={editingField === "notes"}
                />
                {editingField !== "all" && (
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={handleSaveField}
                      disabled={isUpdatingInfo}
                    >
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={handleCancelEditField}
                      disabled={isUpdatingInfo}
                    >
                      Hủy
                    </Button>
                  </div>
                )}
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
