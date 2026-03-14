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
} from "lucide-react";
import {
  processClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { downloadFile } from "@/lib/download-utils";

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
  handleStartEditField: (field: "totalQuantity" | "paperSize" | "notes") => void;
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
    <Card className="relative">
      <div className="absolute top-1 right-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
        DetailOrderInfoCard.tsx
      </div>
      <CardHeader className="pb-3 px-6">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Thông tin bình bài
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <Label className="text-muted-foreground text-[10px] font-normal">
              Số giấy in
            </Label>
            {editingField === "totalQuantity" ? (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  min="1"
                  value={inlineTotalQuantity}
                  onChange={(e) => setInlineTotalQuantity(e.target.value)}
                  className="h-7 text-xs font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveField();
                    else if (e.key === "Escape") handleCancelEditField();
                  }}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleSaveField}
                    disabled={isUpdatingInfo}
                  >
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleCancelEditField}
                    disabled={isUpdatingInfo}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={() =>
                  order.status !== "completed" &&
                  handleStartEditField("totalQuantity")
                }
              >
                <p
                  className={`font-bold text-sm ${
                    order.status !== "completed"
                      ? "group-hover:text-primary transition-colors"
                      : ""
                  }`}
                >
                  {(order.totalQuantity ?? 0).toLocaleString()}
                </p>
                {order.status !== "completed" && (
                  <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <Label className="text-muted-foreground text-[10px] font-normal">
              SL hàng
            </Label>
            <p className="font-bold text-sm">
              {order.proofingOrderDesigns?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Khổ giấy */}
        <div className="space-y-0.5">
          <Label className="text-muted-foreground text-[10px] font-normal">
            Khổ giấy
          </Label>
          {editingField === "paperSize" ? (
            <div className="space-y-1.5">
              <Select
                value={inlinePaperSizeId}
                onValueChange={setInlinePaperSizeId}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Chọn khổ giấy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">-- Nhập thủ công --</SelectItem>
                  {paperSizes.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id.toString()}>
                      {ps.name}
                      {ps.width && ps.height
                        ? ` (${ps.width}×${ps.height})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inlinePaperSizeId === "custom" && (
                <Input
                  value={inlineCustomPaperSize}
                  onChange={(e) => setInlineCustomPaperSize(e.target.value)}
                  placeholder="Ví dụ: 60×60, 31×43..."
                  className="h-7 text-xs"
                />
              )}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  onClick={handleSaveField}
                  disabled={isUpdatingInfo}
                >
                  Lưu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={handleCancelEditField}
                  disabled={isUpdatingInfo}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 group cursor-pointer"
              onClick={() =>
                order.status !== "completed" &&
                handleStartEditField("paperSize")
              }
            >
              <p
                className={`font-bold text-sm text-xs ${
                  order.status !== "completed"
                    ? "group-hover:text-primary transition-colors"
                    : ""
                }`}
              >
                {order.paperSize?.name ||
                  order.customPaperSize ||
                  "Chưa xác định"}
              </p>
              {order.status !== "completed" && (
                <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          )}
        </div>

        {/* Chất liệu */}
        <div className="space-y-0.5">
          <Label className="text-muted-foreground text-[10px] font-normal">
            Chất liệu
          </Label>
          <div>
            <p className="font-bold text-sm">
              {order.materialType?.name || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              {order.materialType?.code || "—"}
            </p>
          </div>
        </div>

        {/* Quy cách - Cán màng */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-[10px] font-bold flex items-center gap-1.5">
              <Settings2 className="h-3 w-3" />
              Quy cách
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {uniqueProcessClassifications.length > 0 ? (
                uniqueProcessClassifications.map((classification) => (
                  <Badge
                    key={classification}
                    variant="secondary"
                    className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
                  >
                    {processClassificationLabels[classification] ||
                      classification}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">---</span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-[10px] font-bold flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Cán màng
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {uniqueLaminationTypes.length > 0 ? (
                uniqueLaminationTypes.map((laminationType) => (
                  <Badge
                    key={laminationType}
                    variant="secondary"
                    className="text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    {laminationTypeLabels[laminationType] || laminationType}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">---</span>
              )}
            </div>
          </div>
        </div>

        {/* Ghi chú */}
        <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
          <div className="flex items-start gap-1.5">
            <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-[10px]">
                  Ghi chú
                </p>
                {order.status !== "completed" && editingField !== "notes" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleStartEditField("notes")}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {editingField === "notes" ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={inlineNotes}
                    onChange={(e) => setInlineNotes(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    rows={3}
                    className="text-xs resize-none"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Escape" &&
                        !e.shiftKey &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        handleCancelEditField();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={handleSaveField}
                      disabled={isUpdatingInfo}
                    >
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={handleCancelEditField}
                      disabled={isUpdatingInfo}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`group ${
                    order.status !== "completed" ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    order.status !== "completed" &&
                    handleStartEditField("notes")
                  }
                >
                  <p
                    className={`text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed text-xs ${
                      order.status !== "completed"
                        ? "group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors"
                        : ""
                    }`}
                  >
                    {order.notes || "---"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {order.proofingFileUrl && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Label className="text-muted-foreground text-[10px] font-normal">
              File:
            </Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => {
                if (order.proofingFileUrl) {
                  downloadFile(
                    order.proofingFileUrl,
                    order.code ?? `BB-${order.id ?? ""}`
                  );
                }
              }}
            >
              <Download className="h-3 w-3" />
              Tải xuống
            </Button>
          </div>
        )}

        {order.status !== "completed" && (
          <div className="pt-2 border-t space-y-3">
            {!order.proofingFileUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs w-full"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="h-3 w-3" />
                Tải lên file bình bài
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
