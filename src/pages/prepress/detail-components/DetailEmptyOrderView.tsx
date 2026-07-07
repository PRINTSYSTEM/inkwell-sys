import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Calculator,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Package,
  Box,
} from "lucide-react";

interface DetailEmptyOrderViewProps {
  selectedDesigns: any[];
  selectedCount: number;
  materialTypeName: string | null;
  designQuantities: Record<number, number>;
  setDesignQuantities: (val: (prev: any) => any) => void;
  toggleSelection: (design: any) => void;
  proofingSheetQuantity: number;
  setProofingSheetQuantity: (val: number) => void;
  paperSizeId: string;
  setPaperSizeId: (val: string) => void;
  customPaperSize: string;
  setCustomPaperSize: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  paperSizes: any[];
  showCreateButton: boolean;
  isCreatingPaperSize: boolean;
  handleCreatePaperSize: () => void;
  handleSubmitDesigns: () => void;
  isAddingDesigns: boolean;
  isProofer?: boolean;
  nextOrderId?: string | number;
}

export function DetailEmptyOrderView({
  selectedDesigns,
  selectedCount,
  materialTypeName,
  designQuantities,
  setDesignQuantities,
  toggleSelection,
  proofingSheetQuantity,
  setProofingSheetQuantity,
  paperSizeId,
  setPaperSizeId,
  customPaperSize,
  setCustomPaperSize,
  notes,
  setNotes,
  paperSizes,
  showCreateButton,
  isCreatingPaperSize,
  handleCreatePaperSize,
  handleSubmitDesigns,
  isAddingDesigns,
  isProofer = true,
  nextOrderId,
}: DetailEmptyOrderViewProps) {
  return (
    <div className="flex-1 flex min-h-0 w-full max-w-full overflow-hidden border rounded-lg shadow-sm bg-background relative">
      {/* LEFT SIDE - DESIGN LIST */}
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {/* Right header */}
        <div className="shrink-0 border-b bg-card/50 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-base font-bold text-foreground truncate">
              Thêm mã hàng vào bình bài
            </p>
            {nextOrderId && (
              <Badge variant="secondary" className="text-[11px] font-bold px-1.5 py-0 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 shrink-0 select-none">
                Mã bài: {nextOrderId}
              </Badge>
            )}
          </div>
          {materialTypeName && (
            <Badge variant="secondary" className="text-sm font-semibold">
              {materialTypeName}
            </Badge>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            {selectedDesigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Box className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  Chưa chọn mã hàng
                </h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Danh sách mã hàng đã chọn sẽ hiển thị tại đây để bạn nhập số
                  lượng và cấu hình bài bình.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* List of selected designs */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    {selectedDesigns.map((design) => (
                      <div
                        key={design.id}
                        className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:border-primary/50 transition-all shadow-sm"
                      >
                        <div className="h-12 w-12 rounded border bg-muted overflow-hidden shrink-0">
                          {design.thumbnailUrl ? (
                            <img
                              src={design.thumbnailUrl}
                              alt={design.code}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Box className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-sm truncate">
                                {design.code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 font-bold shrink-0"
                              >
                                {design.designTypeName}
                              </Badge>
                            </div>
                            <span className="text-[14px] text-muted-foreground font-medium shrink-0">
                              Còn:{" "}
                              <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                                {(design.availableQuantity !== undefined
                                  ? design.availableQuantity
                                  : design.quantity
                                ).toLocaleString()}
                              </span>
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground font-medium break-all leading-relaxed">
                            {design.name}
                          </p>
                        </div>
                        <div className="w-24 shrink-0">
                          <Label
                            htmlFor={`qty-${design.id}`}
                            className="sr-only"
                          >
                            Số lượng
                          </Label>
                          <Input
                            id={`qty-${design.id}`}
                            type="number"
                            placeholder="SL"
                            className="h-8 text-sm font-bold text-center"
                            value={designQuantities[design.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDesignQuantities((prev) => ({
                                ...prev,
                                [design.id]:
                                  val === "" ? 0 : parseInt(val, 10),
                              }));
                            }}
                            disabled={!isProofer}
                          />
                        </div>
                        {isProofer && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => toggleSelection(design)}
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proofing order configuration */}
                <div className="space-y-4">

                  <div className="grid grid-cols-1 gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                    <div className="space-y-2">
                      <Label
                        htmlFor="sheet-qty"
                        className="text-sm font-bold flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        Số lượng giấy in (tờ)
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="sheet-qty"
                        type="number"
                        placeholder="Ví dụ: 1000, 2000..."
                        value={proofingSheetQuantity || ""}
                        onChange={(e) =>
                          setProofingSheetQuantity(
                            parseInt(e.target.value, 10)
                          )
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        disabled={!isProofer}
                        className="h-10 text-base font-bold border-muted-foreground/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="paper-size"
                        className="text-sm font-bold flex items-center gap-2"
                      >
                        <Box className="h-4 w-4 text-muted-foreground" />
                        Khổ giấy in (cm)
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={paperSizeId}
                          onValueChange={setPaperSizeId}
                          disabled={!isProofer}
                        >
                          <SelectTrigger
                            id="paper-size"
                            className="h-10 text-sm font-medium border-muted-foreground/20"
                          >
                            <SelectValue placeholder="Chọn khổ giấy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">
                              -- Nhập mới (nếu chưa có sẵn) --
                            </SelectItem>
                            {paperSizes.map((ps) => (
                              <SelectItem
                                key={ps.id}
                                value={ps.id.toString()}
                              >
                                {ps.name}
                                {ps.width && ps.height
                                  ? ` (${ps.width}×${ps.height})`
                                  : ""} cm
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {showCreateButton && isProofer && (
                          <Button
                            variant="secondary"
                            className="h-10 px-3 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={handleCreatePaperSize}
                            disabled={isCreatingPaperSize}
                          >
                            {isCreatingPaperSize ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {paperSizeId === "custom" && (
                        <div className="mt-2 group relative">
                          <Input
                            placeholder="Nhập kích thước (ví dụ: 60×60, 31×43...)"
                            value={customPaperSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Chỉ cho phép số và ký tự x, X, ×, *, . (dấu chấm cho số thập phân nếu cần)
                              // Ở đây theo yêu cầu là 11x11 nên tôi sẽ lọc giữ lại số và x
                              const filtered = val.replace(/[^0-9xX×*]/g, "");
                              setCustomPaperSize(filtered.toLowerCase());
                            }}
                            className="h-10 text-sm border-primary/30 focus:border-primary shadow-sm"
                            autoFocus
                            disabled={!isProofer}
                          />
                          {!customPaperSize && (
                            <div className="absolute right-3 top-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] font-bold text-primary uppercase">
                                Nhập mới
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="order-notes"
                        className="text-sm font-bold flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Ghi chú lệnh
                      </Label>
                      <Input
                        id="order-notes"
                        placeholder="Ghi chú cho bộ phận sản xuất..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-10 text-sm italic"
                        disabled={!isProofer}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </ScrollArea>

          {/* FIXED FOOTER - ACTIONS */}
          {selectedDesigns.length > 0 && (
            <div className="shrink-0 border-t bg-card/50 p-4 space-y-3">
              <Button
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] bg-gradient-to-r from-primary to-primary/80"
                onClick={handleSubmitDesigns}
                disabled={
                  isAddingDesigns ||
                  !paperSizeId ||
                  (paperSizeId === "custom" && !customPaperSize.trim()) ||
                  !isProofer
                }
              >
                {isAddingDesigns ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>Hoàn tất thêm mã hàng</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
