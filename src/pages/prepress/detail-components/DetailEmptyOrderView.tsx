import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
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
        <div className="shrink-0 border-b bg-card/50 px-4 py-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                Thêm mã hàng vào
              </p>
              {nextOrderId && (
                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 shrink-0 select-none">
                  Mã bài: {nextOrderId}
                </Badge>
              )}
            </div>
          </div>
          {materialTypeName && (
            <div className="text-xs font-semibold text-muted-foreground truncate" title={materialTypeName}>
              Chất liệu: <span className="text-foreground">{materialTypeName}</span>
            </div>
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
              <div className="space-y-4">
                {/* List of selected designs */}
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    {selectedDesigns.map((design, index) => (
                      <div
                        key={design.id}
                        className="group relative flex items-center gap-2 p-1.5 border rounded-lg bg-card/50 hover:border-primary/50 transition-all shadow-sm"
                      >
                        <div className="w-5 h-5 shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                          {index + 1}
                        </div>
                        <div className="h-9 w-9 rounded border bg-muted overflow-hidden shrink-0">
                          {design.thumbnailUrl ? (
                            <img
                              src={design.thumbnailUrl}
                              alt={design.code}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Box className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-bold text-xs truncate" title={design.code}>
                                {design.code}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                              Còn:{" "}
                              <span className="text-red-600 dark:text-red-400 font-bold text-[10px]">
                                {(() => {
                                  const avail = design.availableQuantity !== undefined ? design.availableQuantity : design.quantity;
                                  const isDecal = (design.designTypeName || "").toLowerCase().includes("decal") || (design.materialTypeName || "").toLowerCase().includes("decal");
                                  const isBo = isDecal && design.sidesClassification === "two_side";
                                  if (isBo) {
                                    return `${(avail * 2).toLocaleString("vi-VN")} / ${avail.toLocaleString("vi-VN")} bộ`;
                                  }
                                  return avail.toLocaleString("vi-VN");
                                })()}
                              </span>
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium break-all leading-tight truncate" title={design.name}>
                            {design.name}
                          </p>
                        </div>
                        <div className="w-20 shrink-0">
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
                            className="h-7 text-xs font-bold text-center px-1"
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
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => toggleSelection(design)}
                          >
                            <Plus className="h-3.5 w-3.5 rotate-45" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proofing order configuration */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 gap-2.5 bg-muted/10 p-3 rounded-lg border">
                    <div className="space-y-1">
                      <Label
                        htmlFor="sheet-qty"
                        className="text-xs font-bold flex items-center gap-1.5"
                      >
                        <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                        Số lượng giấy in (tờ)
                      </Label>
                      <Input
                        id="sheet-qty"
                        type="number"
                        placeholder="Ví dụ: 1000, 2000..."
                        value={proofingSheetQuantity || ""}
                        onChange={(e) => {
                          const nextValue = parseInt(e.target.value, 10);
                          setProofingSheetQuantity(
                            Number.isNaN(nextValue) ? 0 : nextValue
                          );
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        disabled={!isProofer}
                        className="h-8.5 text-sm font-bold border-muted-foreground/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="paper-size"
                        className="text-xs font-bold flex items-center gap-1.5"
                      >
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />
                        Khổ giấy in (cm)
                      </Label>
                      <div className="flex gap-1.5">
                        <SearchableSelect
                          value={paperSizeId}
                          onValueChange={setPaperSizeId}
                          disabled={!isProofer}
                          className="h-8.5 text-xs font-medium border-muted-foreground/20"
                          placeholder="Chọn khổ giấy..."
                          searchPlaceholder="Tìm khổ giấy..."
                          popoverWidth="w-[280px]"
                          options={[
                            { value: "none", label: "-- Để trống --" },
                            { value: "custom", label: "-- Nhập mới (nếu chưa có sẵn) --" },
                            ...paperSizes.map((ps) => ({
                              value: ps.id.toString(),
                              label: `${ps.name}${ps.width && ps.height ? ` (${ps.width}×${ps.height})` : ""} cm`
                            }))
                          ]}
                        />

                        {showCreateButton && isProofer && (
                          <Button
                            variant="secondary"
                            className="h-8.5 px-2 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={handleCreatePaperSize}
                            disabled={isCreatingPaperSize}
                          >
                            {isCreatingPaperSize ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>

                      {paperSizeId === "custom" && (
                        <div className="mt-1.5 group relative">
                          <Input
                            placeholder="Nhập kích thước (ví dụ: 60×60, 31×43...)"
                            value={customPaperSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              const filtered = val.replace(/[^0-9xX×*]/g, "");
                              setCustomPaperSize(filtered.toLowerCase());
                            }}
                            className="h-8.5 text-xs border-primary/30 focus:border-primary shadow-sm"
                            autoFocus
                            disabled={!isProofer}
                          />
                          {!customPaperSize && (
                            <div className="absolute right-3 top-2 opacity-40 group-hover:opacity-100 transition-opacity">
                              <p className="text-[9px] font-bold text-primary uppercase">
                                Nhập mới
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="order-notes"
                        className="text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        Ghi chú lệnh
                      </Label>
                      <Input
                        id="order-notes"
                        placeholder="Ghi chú cho bộ phận sản xuất..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-8.5 text-xs italic"
                        disabled={!isProofer}
                      />
                    </div>
                  </div>

                  {/* Submit Button placed inside the card container */}
                  <Button
                    className="w-full h-8.5 text-xs font-bold shadow hover:shadow-md transition-all active:scale-[0.98] bg-gradient-to-r from-primary to-primary/80 mt-2"
                    onClick={handleSubmitDesigns}
                    disabled={
                      isAddingDesigns ||
                      !isProofer
                    }
                  >
                    {isAddingDesigns ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>Hoàn tất thêm mã hàng</>
                    )}
                  </Button>
                </div>

              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
