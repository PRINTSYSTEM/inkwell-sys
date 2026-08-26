import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type DesignItem, checkIsDecalSet } from "@/types/proofing";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { cn } from "@/lib/utils";
import { Search, FileText, Copy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateAvailableQuantity } from "@/hooks/use-proofing-order";
import { ROLE } from "@/constants";
import {
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { TruncatedText } from "@/components/ui/truncated-text";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DesignTableProps {
  designs: DesignItem[];
  selectedIds: Set<number>;
  canSelect: (design: DesignItem) => boolean;
  onToggle: (design: DesignItem) => void;
  onReject?: (design: DesignItem) => void;
  isRejecting?: boolean;
  onFindDie?: (design: DesignItem, dimensions: string) => void;
  isSelectionEnabled?: boolean;
  searchTerm?: string;
  isConfiguring?: boolean;
  selectedDesigns?: DesignItem[];
}

export function DesignTable({
  designs,
  selectedIds,
  canSelect,
  onToggle,
  onReject,
  isRejecting,
  onFindDie,
  isSelectionEnabled = true,
  searchTerm = "",
  isConfiguring = false,
  selectedDesigns = [],
}: DesignTableProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateAvailableQuantityMutation = useUpdateAvailableQuantity();

  const [editingDesignId, setEditingDesignId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const role = user?.role;
  const canEditQuantity = user && [
    ROLE.ADMIN,
    ROLE.MANAGER,
    ROLE.DESIGN_LEAD,
    ROLE.DESIGN,
    ROLE.PROOFER,
    ROLE.SALE
  ].includes(role as any);

  const handleSaveQuantity = async (design: DesignItem) => {
    const designId = design.designId || design.id;
    console.log("DEBUG Available Qty: designId =", designId, "design =", design);
    if (!designId) {
      toast.error("Lỗi", { description: "Không tìm thấy ID thiết kế" });
      return;
    }

    const qty = parseInt(editValue, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Lỗi", { description: "Số lượng không hợp lệ" });
      return;
    }

    try {
      await updateAvailableQuantityMutation.mutateAsync({
        designId,
        newAvailableQuantity: qty,
      });
      setEditingDesignId(null);
    } catch (error) {
      // Handled in mutation onError
    }
  };

  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép mã hàng", {
      description: text,
      duration: 1500,
    });
  };

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
          className="bg-emerald-500 text-white font-semibold px-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const sortedDesigns = useMemo(() => {
    return [...designs].sort((a, b) => {
      const aUrgent = Boolean(
        (a as any).urgent ||
        (a as any).isUrgent ||
        (a as any).rush ||
        (a as any).isRushDelivery ||
        (a as any).urgentDelivery,
      );
      const bUrgent = Boolean(
        (b as any).urgent ||
        (b as any).isUrgent ||
        (b as any).rush ||
        (b as any).isRushDelivery ||
        (b as any).urgentDelivery,
      );
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  }, [designs]);

  return (
    <>
      <div className="rounded-md border relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 h-10 text-sm font-bold">Ảnh</TableHead>
              <TableHead className="h-10 text-sm font-bold">Đơn hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">Mã hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">
                Kích thước (mm)
              </TableHead>
              <TableHead className="h-10 text-sm font-bold">SL đặt</TableHead>
              <TableHead className="h-10 text-sm font-bold">
                Chất liệu
              </TableHead>
              <TableHead className="h-10 text-sm font-bold">Quy cách</TableHead>
              {!isConfiguring && (
                <TableHead className="h-10 text-sm font-bold">Giao hàng</TableHead>
              )}
              <TableHead className="h-10 text-sm font-bold">Ngày tạo</TableHead>
              <TableHead className="h-10 text-sm font-bold text-right sticky right-0 bg-background z-20">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDesigns.map((design) => {
              const isSelected = selectedIds.has(design.id);
              const selectedIndex = selectedDesigns ? selectedDesigns.findIndex((d) => d.id === design.id) : -1;
              const selectable = canSelect(design);
              const isUrgent = Boolean(
                (design as any).urgent ||
                (design as any).isUrgent ||
                (design as any).rush ||
                (design as any).isRushDelivery ||
                (design as any).urgentDelivery,
              );
              const deliveryInfo =
                (design as any).deliveryPerson ||
                (design as any).deliveryNote ||
                (design as any).delivery ||
                null;
              const isDecal = (design.designTypeName || "").toLowerCase().includes("decal") || 
                              (design.materialTypeName || "").toLowerCase().includes("decal");
              const isBo = checkIsDecalSet(design);

              // Build full info for tooltip
              const fullInfo = (
                <div className="w-[280px] space-y-3 p-1 text-xs">
                  <div className="w-full flex justify-center">
                    {design.thumbnailUrl ? (
                      <img
                        src={design.thumbnailUrl}
                        alt={design.name}
                        className="max-h-[140px] w-auto object-contain rounded-lg border shadow-sm bg-muted/50"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted rounded-lg border flex items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-sm text-foreground leading-tight">
                        {highlightText(design.name, searchTerm)}
                        {(design.customerCompanyName || design.customerName) && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            — {design.customerCompanyName || design.customerName}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Mã hàng:{" "}
                          <span className="font-mono font-bold text-foreground">
                            {highlightText(design.code, searchTerm)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Thông tin đơn hàng
                        </p>
                        <div className="bg-muted/30 rounded-md p-2.5 space-y-2 border">
                          <div className="flex justify-between text-xs items-center">
                            <span className="text-muted-foreground">
                              Đơn hàng:
                            </span>
                            <span className="font-semibold text-primary">
                              {design.queueItemId?.startsWith("RD_")
                                ? "Thiết kế sẵn / Chưa lên đơn"
                                : design.orderCode || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Chất liệu:
                            </span>
                            <span className="font-medium">
                              {design.materialTypeName}
                              {(() => {
                                const matName = (design.materialTypeName || "").toLowerCase();
                                const isDecalGiay = matName.includes("decal") && (matName.includes("giấy") || matName.includes("giay"));
                                if (isDecalGiay) return null;
                                return design.basisWeight && design.basisWeight > 0 ? ` (${design.basisWeight} gsm)` : "";
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Kích thước:
                            </span>
                            <span className="font-medium">
                              {design.length} × {design.height}
                              {design.width ? ` × ${design.width}` : ""} mm
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Người thiết kế:
                            </span>
                            <span className="font-medium">
                              {design.designerName || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Người chốt in:
                            </span>
                            <span className="font-medium">
                              {design.createdBy || design.designerName || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">
                              SL có thể bình:
                            </span>
                            <span
                              className={cn(
                                "font-bold text-right whitespace-nowrap",
                                (design.availableQuantity !== undefined && design.availableQuantity > 0) ||
                                  (design.availableFrontQty != null && design.availableFrontQty > 0) ||
                                  (design.availableBackQty != null && design.availableBackQty > 0)
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {(() => {
                                 const isDecalBo = checkIsDecalSet(design);
                                 const piecesVal = design.availableQuantity !== undefined && design.availableQuantity !== null
                                   ? design.availableQuantity
                                   : design.quantity;

                                 if (isDecalBo) {
                                   const frontAvail = design.availableFrontQty;
                                   const backAvail = design.availableBackQty;
                                   if (frontAvail != null || backAvail != null) {
                                     return `${(frontAvail ?? 0).toLocaleString("vi-VN")} trước / ${(backAvail ?? 0).toLocaleString("vi-VN")} sau`;
                                   }
                                   const setsVal = Math.floor(piecesVal / 2);
                                   return `${piecesVal.toLocaleString("vi-VN")} / ${setsVal.toLocaleString("vi-VN")} bộ`;
                                 }

                                 return `${piecesVal.toLocaleString("vi-VN")}`;
                               })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(design.designCreatedAt || design.designUpdatedAt) && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Thời gian thiết kế
                          </p>
                          <div className="bg-muted/30 rounded-md p-2 space-y-1 border text-[11px]">
                            {design.designCreatedAt && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground whitespace-nowrap">Ngày tạo:</span>
                                <span className="font-medium text-foreground text-right">
                                  {new Date(design.designCreatedAt).toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            {design.designUpdatedAt && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground whitespace-nowrap">Cập nhật cuối:</span>
                                <span className="font-medium text-foreground text-right">
                                  {new Date(design.designUpdatedAt).toLocaleString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(design.processClassificationOptionName ||
                        design.laminationType ||
                        (design.specification &&
                          design.specification.length > 0)) && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Quy cách sản xuất
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {design.specification &&
                                design.specification.length > 0
                                ? design.specification.map((spec, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-100"
                                  >
                                    {spec}
                                  </Badge>
                                ))
                                : null}
                              {!design.specification?.length &&
                                design.processClassificationOptionName && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-amber-100 text-amber-800 border-amber-200"
                                  >
                                    {processClassificationLabels[
                                      design.processClassificationOptionName
                                    ] || design.processClassificationOptionName}
                                  </Badge>
                                )}
                              {!design.specification?.length &&
                                design.laminationType && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {laminationTypeLabels[
                                      design.laminationType
                                    ] || design.laminationType}
                                  </Badge>
                                )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );

              return (
                <TableRow
                  key={design.id}
                  className={cn(
                    "h-11 transition-colors relative",
                    isSelectionEnabled && "cursor-pointer",
                    isSelected
                      ? "bg-green-100/90 hover:bg-green-200/80 dark:bg-green-900/40 dark:hover:bg-green-900/60 shadow-[inset_4px_0_0_0_#22c55e]"
                      : isUrgent
                        ? "bg-red-50/70 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 shadow-[inset_4px_0_0_0_#ef4444]"
                        : isSelectionEnabled && selectable && "hover:bg-muted/50",
                    isSelectionEnabled && !selectable &&
                    !isSelected &&
                    "opacity-50 cursor-not-allowed",
                    !isSelectionEnabled && !isSelected && "hover:bg-transparent"
                  )}
                  onClick={() => {
                    if (isSelectionEnabled && (selectable || isSelected)) {
                      onToggle(design);
                    }
                  }}
                >
                  <TableCell className="py-1">
                    <div className="flex items-center gap-1.5">
                      {selectedIndex !== -1 ? (
                        <div className="w-5 h-5 shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                          {selectedIndex + 1}
                        </div>
                      ) : (
                        <div className="w-5 h-5 shrink-0" />
                      )}
                      <CursorTooltip
                        content={fullInfo}
                        delayDuration={300}
                        className="p-3 bg-popover/95 backdrop-blur-sm border-shadow shadow-xl ring-1 ring-black/5"
                      >
                        {design.thumbnailUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImage({
                                url: design.imageUrl || design.largeImageUrl || design.thumbnailUrl,
                                title: design.name,
                              });
                            }}
                            className="w-10 h-10 rounded border bg-muted overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
                          >
                            <img
                              src={design.thumbnailUrl}
                              alt={design.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center flex-shrink-0 cursor-help">
                            <FileText className="h-5 w-5 text-muted-foreground opacity-40" />
                          </div>
                        )}
                      </CursorTooltip>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center gap-1.5">
                      {design.queueItemId?.startsWith("RD_") ? (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600 border-none font-normal text-xs py-0.5 px-2 hover:bg-gray-100"
                        >
                          Chưa lên đơn
                        </Badge>
                      ) : design.orderCode ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-sm text-primary">
                            {design.orderCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm font-semibold">
                          -
                        </span>
                      )}
                    </div>
                  </TableCell>
                    <TableCell className="py-1 font-mono text-sm font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{highlightText(design.code, searchTerm)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={(e) => handleCopy(design.code, e)}
                          title="Sao chép mã hàng"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="text-sm text-muted-foreground">
                        {design.length} × {design.height}
                        {design.width ? ` × ${design.width}` : ""}
                      </div>
                    </TableCell>
                    <TableCell
                      className="py-1"
                      onClick={(e) => {
                        if (canEditQuantity) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {editingDesignId === design.id ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveQuantity(design);
                              } else if (e.key === "Escape") {
                                setEditingDesignId(null);
                              }
                            }}
                            className="h-7 w-20 text-xs font-semibold px-1"
                            autoFocus
                            disabled={updateAvailableQuantityMutation.isPending && editingDesignId === design.id}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveQuantity(design);
                            }}
                            disabled={updateAvailableQuantityMutation.isPending && editingDesignId === design.id}
                          >
                            {updateAvailableQuantityMutation.isPending && editingDesignId === design.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "✓"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-1.5 text-xs text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDesignId(null);
                            }}
                            disabled={updateAvailableQuantityMutation.isPending && editingDesignId === design.id}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "text-sm font-semibold flex items-center gap-1 group/qty rounded px-1 -ml-1 transition-colors min-h-[24px] w-fit",
                            canEditQuantity && "cursor-pointer hover:bg-muted/50",
                            isBo && "text-green-600 dark:text-green-400 font-bold"
                          )}
                          onClick={(e) => {
                            if (canEditQuantity) {
                              e.stopPropagation();
                              setEditingDesignId(design.id);
                              setEditValue(
                                (design.availableQuantity !== undefined && design.availableQuantity !== null
                                  ? design.availableQuantity
                                  : (isBo
                                    ? design.quantity * 2
                                    : design.quantity)
                                ).toString()
                              );
                            }
                          }}
                          title={canEditQuantity ? "Nhấp để sửa số lượng có thể bình bài" : undefined}
                        >
                          <span>
                            {(() => {
                              if (isBo) {
                                const frontAvail = design.availableFrontQty;
                                const backAvail = design.availableBackQty;
                                if (frontAvail != null || backAvail != null) {
                                  const f = frontAvail ?? 0;
                                  const b = backAvail ?? 0;
                                  if (f === b) {
                                    return `${(f * 2).toLocaleString("vi-VN")} / ${f.toLocaleString("vi-VN")} bộ`;
                                  }
                                  return `${f.toLocaleString("vi-VN")} trước / ${b.toLocaleString("vi-VN")} sau`;
                                }
                                const piecesVal = design.availableQuantity !== undefined && design.availableQuantity !== null
                                  ? design.availableQuantity
                                  : design.quantity;
                                const setsVal = Math.floor(piecesVal / 2);
                                return `${piecesVal.toLocaleString("vi-VN")} / ${setsVal.toLocaleString("vi-VN")} bộ`;
                              }

                              const piecesVal = design.availableQuantity !== undefined && design.availableQuantity !== null
                                ? design.availableQuantity
                                : design.quantity;
                              return piecesVal.toLocaleString("vi-VN");
                            })()}
                          </span>
                          {canEditQuantity && (
                            <span className="text-[10px] text-muted-foreground opacity-0 group-hover/qty:opacity-100 transition-opacity ml-1">
                              ✏️
                            </span>
                          )}
                        </div>
                      )}
                      {design.proofingAllocations && design.proofingAllocations.length > 0 && (
                        <div className="mt-1.5 space-y-1 border-t border-dashed pt-1.5 text-[11.5px] text-muted-foreground">
                          {design.proofingAllocations.map((alloc, idx) => {
                            const side = alloc.side || "both";
                            const qtyInSheets = alloc.quantityInSheets ?? (alloc.quantityTaken ?? 0);
                            const qtyTaken = alloc.quantityTaken ?? 0;

                            let allocText = "";
                            if (side === "front") {
                              allocText = `${qtyInSheets.toLocaleString("vi-VN")} mặt trước`;
                            } else if (side === "back") {
                              allocText = `${qtyInSheets.toLocaleString("vi-VN")} mặt sau`;
                            } else if (isBo) {
                              allocText = `${qtyTaken.toLocaleString("vi-VN")} bộ`;
                            } else {
                              allocText = qtyTaken.toLocaleString("vi-VN");
                            }

                            return (
                              <div key={idx} className="flex justify-between gap-2.5 whitespace-nowrap">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (alloc.proofingOrderId) {
                                      navigate(`/proofing/${alloc.proofingOrderId}?highlightDesignId=${design.designId || design.id}`);
                                    }
                                  }}
                                  className="font-mono text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                                >
                                  {alloc.proofingOrderCode || `Bài #${alloc.proofingOrderId}`}
                                </span>
                                <span className={cn(
                                  "font-semibold text-[11.5px]",
                                  side === "front"
                                    ? "text-blue-600 dark:text-blue-400 font-bold"
                                    : side === "back"
                                      ? "text-purple-600 dark:text-purple-400 font-bold"
                                      : isBo
                                        ? "text-green-600 dark:text-green-400 font-bold"
                                        : "text-foreground"
                                )}>
                                  {allocText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-1">
                      <div
                        title={design.materialTypeName}
                        className="whitespace-normal break-words min-w-[120px]"
                      >
                        {design.materialTypeName}
                        {(() => {
                          const matName = (design.materialTypeName || "").toLowerCase();
                          const isDecalGiay = matName.includes("decal") && (matName.includes("giấy") || matName.includes("giay"));
                          if (isDecalGiay) return null;
                          return design.basisWeight && design.basisWeight > 0 ? ` (${design.basisWeight} gsm)` : "";
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const specs = design.specification as any;
                          if (Array.isArray(specs) && specs.length > 0) {
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
                          if (
                            typeof specs === "string" &&
                            specs.trim().length > 0
                          ) {
                            return (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 whitespace-nowrap"
                              >
                                {specs}
                              </Badge>
                            );
                          }
                          return (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    {!isConfiguring && (
                      <TableCell className="py-1 text-sm">
                        <div className="flex flex-col gap-1">
                          {isUrgent && (
                            <span className="font-extrabold text-red-600 dark:text-red-500 text-sm">
                              Gấp
                            </span>
                          )}
                          {deliveryInfo ? (
                            <div className="text-sm text-muted-foreground">
                              {deliveryInfo}
                            </div>
                          ) : (
                            !isUrgent && <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="py-1 text-[11px] text-muted-foreground">
                      {design.createdAt ? (
                        (() => {
                          const date = new Date(design.createdAt);
                          if (isNaN(date.getTime())) return "—";
                          const day = String(date.getDate()).padStart(2, "0");
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const year = date.getFullYear();
                          const hours = String(date.getHours()).padStart(2, "0");
                          const minutes = String(date.getMinutes()).padStart(2, "0");
                          const seconds = String(date.getSeconds()).padStart(2, "0");
                          return (
                            <div className="flex flex-col text-left">
                              <span>{day}/{month}/{year}</span>
                              <span className="text-muted-foreground/80">{hours}:{minutes}:{seconds}</span>
                            </div>
                          );
                        })()
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-1 text-right sticky right-0 z-10 transition-colors",
                        isSelected
                          ? "bg-green-100/90 group-hover:bg-green-200/80 dark:bg-green-900/40"
                          : "bg-background",
                      )}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {onReject && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isRejecting}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject(design);
                            }}
                          >
                            Trả về cho TK
                          </Button>
                        )}


                        {onFindDie &&
                          (design.designTypeName || "")
                            .toLowerCase()
                            .includes("hộp") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                const dimensions = `${design.length} × ${design.height}${design.width ? ` × ${design.width}` : ""}`;
                                onFindDie(design, dimensions);
                              }}
                              title="Tìm khuôn liên quan"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {viewingImage && (
        <ImageViewerDialog
          open={!!viewingImage}
          onOpenChange={(open) => {
            if (!open) setViewingImage(null);
          }}
          imageUrl={viewingImage.url}
          title={viewingImage.title}
        />
      )}
    </>
  );
}
