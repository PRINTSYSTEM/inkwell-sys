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
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead className="min-w-[220px]">Thiết kế</TableHead>
              <TableHead className="min-w-[260px]">Thông số in ấn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designs.map((design) => {
              const isSelected = selectedIds.has(design.id);
              const selectable = canSelect(design);

              // Build full info for tooltip
              const fullInfo = (
                <div className="space-y-2 text-sm max-w-md">
                  <div className="font-semibold text-base border-b pb-2">
                    {design.name}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="text-muted-foreground">Mã hàng:</span>
                      <span className="ml-2 font-mono">{design.code}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Đơn hàng:</span>
                      <span className="ml-2 font-semibold">
                        {design.orderCode || design.orderId}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Loại:</span>
                      <span className="ml-2">{design.designTypeName}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Vật liệu:</span>
                      <span className="ml-2">{design.materialTypeName}</span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Kích thước:</span>
                      <span className="ml-2">
                        {design.width}x{design.height} {design.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">SL đặt:</span>
                      <span className="ml-2 font-semibold">
                        {design.quantity.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        SL có thể bình bài:
                      </span>
                      <span
                        className={`ml-2 font-semibold ${
                          design.availableQuantity &&
                          design.availableQuantity > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {design.availableQuantity?.toLocaleString() || "—"}
                      </span>
                    </div>
                  </div>

                  {(design.processClassificationOptionName ||
                    design.sidesClassification ||
                    design.laminationType) && (
                    <div className="pt-2 border-t space-y-1">
                      {design.processClassificationOptionName && (
                        <div>
                          <span className="text-muted-foreground">
                            Cắt - Bế:
                          </span>
                          <span className="ml-2">
                            {processClassificationLabels[
                              design.processClassificationOptionName
                            ] || design.processClassificationOptionName}
                          </span>
                        </div>
                      )}
                      {design.sidesClassification && (
                        <div>
                          <span className="text-muted-foreground">
                            1 - 2 mặt:
                          </span>
                          <span className="ml-2">
                            {sidesClassificationLabels[
                              design.sidesClassification
                            ] || design.sidesClassification}
                          </span>
                        </div>
                      )}
                      {design.laminationType && (
                        <div>
                          <span className="text-muted-foreground">
                            Cán màng:
                          </span>
                          <span className="ml-2">
                            {laminationTypeLabels[design.laminationType] ||
                              design.laminationType}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );

              return (
                <CursorTooltip
                  key={design.id}
                  content={fullInfo}
                  delayDuration={300}
                  className="p-4 max-w-md"
                >
                  <TableRow
                    className={cn(
                      "cursor-pointer align-top",
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
                    <TableCell className="pt-4">
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
                    <TableCell className="pt-3">
                      {design.thumbnailUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage({
                              url: design.thumbnailUrl,
                              title: design.name,
                            });
                          }}
                          className="w-10 h-10 rounded bg-muted overflow-hidden hover:opacity-80 transition-opacity"
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {design.orderCode && (
                            <>
                              <FileText className="h-3 w-3" />
                              <span className="font-semibold text-primary">
                                {design.orderCode}
                              </span>
                            </>
                          )}
                          {!design.orderCode && <span>{design.orderId}</span>}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {design.code}
                        </div>
                        <div className="text-sm font-medium leading-snug">
                          <TruncatedText text={design.name} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>
                            SL đặt:{" "}
                            <span className="font-semibold">
                              {design.quantity.toLocaleString()}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span>SL còn:</span>
                            <span
                              className={cn(
                                "font-semibold",
                                design.availableQuantity &&
                                  design.availableQuantity > 0
                                  ? "text-emerald-600"
                                  : "text-destructive"
                              )}
                            >
                              {design.availableQuantity?.toLocaleString() ||
                                "—"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[11px]">
                          {design.designTypeName}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {design.materialTypeName}
                        </Badge>
                        {design.processClassificationOptionName ? (
                          <Badge variant="outline" className="text-[11px]">
                            {processClassificationLabels[
                              design.processClassificationOptionName
                            ] || design.processClassificationOptionName}
                          </Badge>
                        ) : null}
                        {design.sidesClassification ? (
                          <Badge variant="outline" className="text-[11px]">
                            {sidesClassificationLabels[
                              design.sidesClassification
                            ] || design.sidesClassification}
                          </Badge>
                        ) : null}
                        {design.laminationType ? (
                          <Badge variant="outline" className="text-[11px]">
                            {laminationTypeLabels[design.laminationType] ||
                              design.laminationType}
                          </Badge>
                        ) : null}
                        <div className="text-[11px] text-muted-foreground ml-0.5">
                          {design.width}x{design.height} {design.unit}
                        </div>
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
