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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 h-10 text-sm font-bold"></TableHead>
              <TableHead className="w-16 h-10 text-sm font-bold">Ảnh</TableHead>
              <TableHead className="h-10 text-sm font-bold">Đơn hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">Mã hàng</TableHead>
              <TableHead className="h-10 text-sm font-bold">Tên</TableHead>
              <TableHead className="h-10 text-sm font-bold">
                Quy trình sản xuất
              </TableHead>
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
                        {design.length} × {design.height}
                        {design.width ? ` × ${design.width}` : ""} mm
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
                    <div>
                      <span className="text-muted-foreground">
                        Nhân viên thiết kế:
                      </span>
                      <span className="ml-2">{design.designerName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Nhân viên kế toán:
                      </span>
                      <span className="ml-2">{design.accountantName}</span>
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
                    <TableCell className="py-3">
                      <TruncatedText
                        text={design.name}
                        className="font-semibold text-sm"
                      />
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
