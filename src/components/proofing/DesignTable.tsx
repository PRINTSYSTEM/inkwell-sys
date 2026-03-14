import { useState } from "react";
import type { DesignItem } from "@/types/proofing";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FileText } from "lucide-react";
import {
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { TruncatedText } from "@/components/ui/truncated-text";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

interface DesignTableProps {
  designs: DesignItem[];
  selectedIds: Set<number>;
  canSelect: (design: DesignItem) => boolean;
  onToggle: (design: DesignItem) => void;
}

export function DesignTable({
  designs,
  selectedIds,
  canSelect,
  onToggle,
}: DesignTableProps) {
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  return (
    <>
      <div className="rounded-md border relative">
        <div className="absolute -top-2 right-1 bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[100] font-mono pointer-events-none opacity-80">
          DesignTable.tsx
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 h-10 text-sm font-bold"></TableHead>
              <TableHead className="w-16 h-10 text-sm font-bold">Ảnh</TableHead>
              <TableHead className="h-10 text-sm font-bold">Đơn hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">Mã hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">Chất liệu</TableHead>
              <TableHead className="h-10 text-sm font-bold">
                Quy cách
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
                        {design.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Mã hàng: <span className="font-mono font-bold text-foreground">{design.code}</span>
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
                            <span className="text-muted-foreground">Đơn hàng:</span>
                            <span className="font-semibold text-primary">{design.orderCode || design.orderId}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Chất liệu:</span>
                            <span className="font-medium">{design.materialTypeName}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Kích thước:</span>
                            <span className="font-medium">
                              {design.length} × {design.height}
                              {design.width ? ` × ${design.width}` : ""} mm
                            </span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">SL có thể bình:</span>
                            <span className={cn("font-bold", design.availableQuantity && design.availableQuantity > 0 ? "text-green-600" : "text-red-600")}>
                                {design.availableQuantity?.toLocaleString() || "0"} / {design.quantity.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(design.processClassificationOptionName || design.laminationType) && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Quy cách sản xuất
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {design.processClassificationOptionName && (
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                                {processClassificationLabels[design.processClassificationOptionName] || design.processClassificationOptionName}
                              </Badge>
                            )}
                            {design.laminationType && (
                              <Badge variant="secondary" className="text-[10px]">
                                {laminationTypeLabels[design.laminationType] || design.laminationType}
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
                      "cursor-pointer h-14",
                      isSelected && "bg-primary/5",
                      !selectable &&
                        !isSelected &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (selectable || isSelected) {
                        onToggle(design);
                      }
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        disabled={!selectable && !isSelected}
                        onCheckedChange={() => {
                          if (selectable || isSelected) {
                            onToggle(design);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
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
                      {design.orderCode ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-sm text-primary">
                            {design.orderCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm font-semibold">
                          {design.orderId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-sm font-semibold">
                      {design.code}
                    </TableCell>
                    <TableCell className="py-3 max-w-[200px]">
                      <div title={design.name} className="truncate">
                        {design.materialTypeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {design.processClassificationOptionName && (
                          <Badge variant="outline" className="text-xs">
                            {processClassificationLabels[
                              design.processClassificationOptionName
                            ] || design.processClassificationOptionName}
                          </Badge>
                        )}
                        {design.sidesClassification && (
                          <Badge variant="outline" className="text-xs">
                            {sidesClassificationLabels[
                              design.sidesClassification
                            ] || design.sidesClassification}
                          </Badge>
                        )}
                        {design.laminationType && (
                          <Badge variant="outline" className="text-xs">
                            {laminationTypeLabels[design.laminationType] ||
                              design.laminationType}
                          </Badge>
                        )}
                        {!design.processClassificationOptionName &&
                          !design.sidesClassification &&
                          !design.laminationType && (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
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
