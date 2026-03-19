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
  editingField: "totalQuantity" | "paperSize" | "notes" | null;
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
  isUpdatingInfo: boolean;
  handleStartEditField: (
    field: "totalQuantity" | "paperSize" | "notes",
  ) => void;
  handleCancelEditField: () => void;
  handleSaveField: () => void;
  setIsUploadDialogOpen: (val: boolean) => void;
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
  isUpdatingInfo,
  handleStartEditField,
  handleCancelEditField,
  handleSaveField,
  setIsUploadDialogOpen,
}: DetailOrderInfoCardProps) {
  if (!order) return null;

  return (
    <div className="border border-black relative h-full flex flex-col">
      <span className="absolute top-0 left-0 bg-black text-white text-[10px] px-1 z-50">
        DetailOrderInfoCard.tsx
      </span>
      <Card className="relative h-full flex flex-col">
        <CardHeader className="pb-1.5 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Thông tin bình bài
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 flex-1 flex flex-col gap-2">
          {/* Image Display - Narrower Aspect */}
          <div className="mt-2">
            {order.imageUrl ? (
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md border border-muted-foreground/10 bg-muted/5 group">
                <img
                  src={order.imageUrl}
                  alt="Bình bài"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
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
                  handleStartEditField("totalQuantity")
                }
              >
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Số giấy in
                </Label>
                <div className="flex items-center gap-1">
                  {editingField === "totalQuantity" ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={inlineTotalQuantity}
                        onChange={(e) => setInlineTotalQuantity(e.target.value)}
                        className="h-6 text-xs font-bold px-2 w-20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveField();
                          else if (e.key === "Escape") handleCancelEditField();
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-[10px] text-green-600"
                        onClick={handleSaveField}
                        disabled={isUpdatingInfo}
                      >
                        Lưu
                      </Button>
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
                  SL hàng
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
                  handleStartEditField("paperSize")
                }
              >
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Khổ giấy
                </Label>
                <div className="flex items-center gap-1">
                  {editingField === "paperSize" ? (
                    <div className="flex gap-1 items-center">
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
                              {ps.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* If custom selected, show input for manual size */}
                      {inlinePaperSizeId === "custom" ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={inlineCustomPaperSize}
                            onChange={(e) =>
                              setInlineCustomPaperSize(e.target.value)
                            }
                            placeholder="ví dụ: 90×90"
                            className="h-6 text-xs px-2 w-28"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveField();
                              else if (e.key === "Escape")
                                handleCancelEditField();
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px] text-green-600"
                            onClick={handleSaveField}
                            disabled={isUpdatingInfo}
                          >
                            Lưu
                          </Button>
                        </div>
                      ) : (
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
                          "Chưa chọn"}
                      </p>
                      {order.status !== "completed" && (
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
            </div>

            <div className="h-px bg-muted-foreground/5" />

            {/* Designer & Date */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-normal uppercase tracking-tight shrink-0">
                  Designer
                </Label>
                <p className="font-bold text-[12px] truncate">
                  {order.creator?.name || "—"}
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
                {order.status !== "completed" && editingField !== "notes" && (
                  <button
                    onClick={() => handleStartEditField("notes")}
                    className="text-amber-800/40 hover:text-amber-800 transition-colors"
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              {editingField === "notes" ? (
                <div className="space-y-1 mt-1">
                  <Textarea
                    value={inlineNotes}
                    onChange={(e) => setInlineNotes(e.target.value)}
                    rows={2}
                    className="text-[12px] p-1.5 h-auto min-h-[40px]"
                    autoFocus
                  />
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
                </div>
              ) : (
                <p className="line-clamp-3">
                  {order.notes || "Không có ghi chú"}
                </p>
              )}
            </div>

            <div className="mt-auto pt-1.5 space-y-1.5">
              {order.proofingFileUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[11px] font-bold gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() =>
                    downloadFile(order.proofingFileUrl, order.code || "file")
                  }
                >
                  <Download className="h-3 w-3" />
                  Tải bài đã bình
                </Button>
              ) : (
                order.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[11px] font-bold gap-2 border-dashed border-primary/40 hover:border-primary text-primary"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Upload className="h-3 w-3" />
                    Tải lên hình ảnh bình bài
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
