import { useState } from "react";
import type { DesignItem } from "@/types/proofing";
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
import { Search, FileText, Copy } from "lucide-react";
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
}: DesignTableProps) {
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
                Kích thước
              </TableHead>
              <TableHead className="h-10 text-sm font-bold">SL đặt</TableHead>
              <TableHead className="h-10 text-sm font-bold">
                Chất liệu
              </TableHead>
              <TableHead className="h-10 text-sm font-bold">Số mặt</TableHead>
              <TableHead className="h-10 text-sm font-bold">Quy cách</TableHead>
              <TableHead className="h-10 text-sm font-bold">Ngày tạo</TableHead>
              <TableHead className="h-10 text-sm font-bold text-right sticky right-0 bg-background z-20">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designs.map((design) => {
              const isSelected = selectedIds.has(design.id);
              const selectable = canSelect(design);

              // Build full info for tooltip
              const fullInfo = (
                <div className="w-[350px] space-y-4 p-1 text-sm">
                  <div className="w-full">
                    {design.thumbnailUrl ? (
                      <img
                        src={design.thumbnailUrl}
                        alt={design.name}
                        className="w-full aspect-video object-cover rounded-lg border shadow-sm"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted rounded-lg border flex items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-base text-foreground leading-tight">
                        {highlightText(design.name, searchTerm)}
                        {(design.customerCompanyName || design.customerName) && (
                          <span className="text-sm font-normal text-muted-foreground ml-1">
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
                              {design.basisWeight && design.basisWeight > 0 ? ` (${design.basisWeight} gsm)` : ""}
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
                                "font-bold",
                                design.availableQuantity &&
                                  design.availableQuantity > 0
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {design.availableQuantity?.toLocaleString() ||
                                "0"}{" "}
                              / {design.quantity.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

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
                <CursorTooltip
                  key={design.id}
                  content={fullInfo}
                  delayDuration={1000}
                  className="p-3 bg-popover/95 backdrop-blur-sm border-shadow shadow-xl ring-1 ring-black/5"
                >
                  <TableRow
                    className={cn(
                      "h-14 transition-colors relative",
                      isSelectionEnabled && "cursor-pointer",
                      isSelected &&
                      "bg-green-100/90 hover:bg-green-200/80 dark:bg-green-900/40 dark:hover:bg-green-900/60 shadow-[inset_4px_0_0_0_#22c55e]",
                      isSelectionEnabled && !isSelected && selectable && "hover:bg-muted/50",
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
                    <TableCell>
                      {design.thumbnailUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage({
                              url: design.thumbnailUrl,
                              title: design.name,
                            });
                          }}
                          className="w-10 h-10 rounded object-cover bg-muted overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={design.thumbnailUrl}
                            alt={design.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="py-3">
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
                    </TableCell>
                    <TableCell className="py-3 font-mono text-sm font-semibold">
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
                    <TableCell className="py-3">
                      <div className="text-sm text-muted-foreground">
                        {design.length} × {design.height}
                        {design.width ? ` × ${design.width}` : ""} mm
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm font-semibold">
                        {((design.designTypeName?.toLowerCase().includes("decal") ||
                          design.materialTypeName?.toLowerCase().includes("decal")) &&
                          design.sidesClassification === "two_side"
                          ? design.quantity * 2
                          : design.quantity
                        ).toLocaleString()}
                      </div>
                      {design.availableQuantity !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Có thể: {design.availableQuantity.toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 max-w-[200px]">
                      <div
                        title={design.materialTypeName}
                        className={cn(
                          isSelectionEnabled
                            ? "line-clamp-2 whitespace-normal break-words"
                            : "truncate"
                        )}
                      >
                        {design.materialTypeName}
                        {design.basisWeight && design.basisWeight > 0 ? ` (${design.basisWeight} gsm)` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {design.sidesClassification && (
                          <Badge variant="outline" className="text-xs">
                            {sidesClassificationLabels[
                              design.sidesClassification
                            ] || design.sidesClassification}
                          </Badge>
                        )}
                        {!design.sidesClassification && (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell className="py-3 text-[11px] text-muted-foreground whitespace-nowrap">
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
                          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                        })()
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-2 text-right sticky right-0 z-10 transition-colors",
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
                </CursorTooltip>
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
