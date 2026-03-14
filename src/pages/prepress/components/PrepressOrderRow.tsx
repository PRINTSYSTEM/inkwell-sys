import { ChevronDown, FileImage } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";
import {
  laminationTypeLabels,
  processClassificationLabels,
  proofingStatusLabels,
} from "@/lib/status-utils";

interface PrepressOrderRowProps {
  order: any;
  shouldShowExpand: boolean;
  isExpanded: boolean;
  searchTermLower: string;
  debouncedSearchTerm: string;
  onNavigate: (id: number) => void;
}

export function PrepressOrderRow({
  order,
  shouldShowExpand,
  isExpanded,
  searchTermLower,
  debouncedSearchTerm,
  onNavigate,
}: PrepressOrderRowProps) {
  const designs = order.proofingOrderDesigns ?? [];
  const orderCodeMatches =
    shouldShowExpand && order.code?.toLowerCase().includes(searchTermLower);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-red-500 text-white font-semibold px-0.5 rounded"
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
      <TableRow
        className="hover:bg-muted/50 cursor-pointer"
        onClick={() => onNavigate(order.id)}
      >
        {shouldShowExpand && (
          <TableCell className="py-3 w-10">
            <div className="flex items-center justify-center">
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
            </div>
          </TableCell>
        )}
        <TableCell className="py-2 w-12">
          {designs[0]?.design?.designImageUrl ? (
            <img
              src={designs[0].design.designImageUrl}
              alt={designs[0].design.code}
              className="w-10 h-10 object-cover rounded border"
            />
          ) : (
            <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell className="relative py-3 font-semibold">
          <div className="absolute -top-1 left-0 bg-slate-500 text-white text-[8px] px-1 rounded shadow-sm opacity-50 font-mono pointer-events-none">
            PrepressOrderRow.tsx
          </div>
          {shouldShowExpand && orderCodeMatches
            ? highlightText(order.code || "", debouncedSearchTerm.trim())
            : order.code}
        </TableCell>
        <TableCell className="py-3 font-semibold text-xs text-primary">
          {designs[0]?.design?.orderCode || "—"}
        </TableCell>
        <TableCell className="py-3 font-mono text-sm font-semibold">
          {designs[0]?.design?.code || "—"}
        </TableCell>
        <TableCell className="py-3 font-semibold text-center">
          {order.proofingOrderDesigns?.length ?? 0}
        </TableCell>
        <TableCell className="py-3 font-semibold text-xs">
          {designs[0]?.design?.materialType?.name || "—"}
        </TableCell>
        <TableCell className="py-3 text-xs">
          {designs[0]?.design?.processClassification
            ? processClassificationLabels[designs[0].design.processClassification] || designs[0].design.processClassification
            : designs[0]?.design?.length != null
            ? `${designs[0].design.length}x${designs[0].design.height}mm`
            : "—"}
        </TableCell>
        <TableCell className="py-3">
          <StatusBadge
            status={order.status || ""}
            label={
              proofingStatusLabels[order.status || ""] ||
              order.status ||
              "Không xác định"
            }
            className={cn(
              "text-xs font-semibold",
              order.status === "completed"
                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
            )}
          />
        </TableCell>
        <TableCell className="py-3">
          <StatusBadge
            status={order.plateExport ? "exported" : "not_exported"}
            label={order.plateExport ? "Đã xuất" : "Chưa xuất"}
            className={cn(
              "text-xs font-semibold",
              order.plateExport
                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
            )}
          />
        </TableCell>
        <TableCell className="py-3">
          {order.proofingOrderDesigns?.some(
            (pod: any) => pod.design?.processClassification === "die_cut",
          ) ? (
            <StatusBadge
              status={
                (order.dieExports?.length ?? 0) > 0
                  ? "exported"
                  : "not_exported"
              }
              label={
                (order.dieExports?.length ?? 0) > 0 ? "Đã xuất" : "Chưa xuất"
              }
              className={cn(
                "text-xs font-semibold",
                (order.dieExports?.length ?? 0) > 0
                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
              )}
            />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              Không có
            </span>
          )}
        </TableCell>
        <TableCell className="py-3 font-semibold">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("vi-VN")
            : "—"}
        </TableCell>
      </TableRow>
      {shouldShowExpand && isExpanded && designs.length > 0 && (
        <TableRow>
          <TableCell
            colSpan={shouldShowExpand ? 12 : 11}
            className="p-0 bg-muted/20"
          >
            <div className="p-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="h-9 text-xs font-bold w-16">
                        Ảnh
                      </TableHead>
                      <TableHead className="h-9 text-xs font-bold">
                        Đơn hàng
                      </TableHead>
                      <TableHead className="h-9 text-xs font-bold">
                        Mã hàng
                      </TableHead>
                      <TableHead className="h-9 text-xs font-bold">
                        Chất liệu
                      </TableHead>
                      <TableHead className="h-9 text-xs font-bold text-right">
                        Số lượng
                      </TableHead>
                      <TableHead className="h-9 text-xs font-bold">
                        Quy cách
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designs.map((pod: any) => {
                      const designCode = pod.design?.code || "";
                      const designCodeMatches = designCode
                        .toLowerCase()
                        .includes(searchTermLower);
                      const length = pod.design?.length;
                      const width = pod.design?.width;
                      const height = pod.design?.height;

                      const fullInfo = (
                        <div className="space-y-2 text-sm max-w-md">
                          <div className="font-semibold text-base border-b pb-2">
                            {pod.design?.designName || "—"}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <div>
                              <span className="text-muted-foreground">
                                Mã hàng:
                              </span>
                              <span className="ml-2 font-mono">
                                {designCode || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Chất liệu:
                              </span>
                              <span className="ml-2">
                                {pod.design?.materialType?.name || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Kích thước:
                              </span>
                              <span className="ml-2">
                                {formatDesignDimensions(length, width, height)}{" "}
                                mm
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">SL:</span>
                              <span className="ml-2 font-semibold">
                                {pod.quantity?.toLocaleString() || "0"}
                              </span>
                            </div>
                          </div>
                          {(pod.design?.processClassification ||
                            pod.design?.laminationType) && (
                            <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                              {pod.design?.processClassification && (
                                <Badge variant="secondary" className="text-xs">
                                  <span className="text-muted-foreground">
                                    Quy cách:
                                  </span>
                                  <span className="ml-2">
                                    {processClassificationLabels[
                                      pod.design.processClassification
                                    ] || pod.design.processClassification}
                                  </span>
                                </Badge>
                              )}
                              {pod.design?.laminationType && (
                                <Badge variant="secondary" className="text-xs">
                                  <span className="text-muted-foreground">
                                    Cán màng:
                                  </span>
                                  <span className="ml-2">
                                    {laminationTypeLabels[
                                      pod.design.laminationType
                                    ] || pod.design.laminationType}
                                  </span>
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );

                      return (
                        <CursorTooltip
                          key={pod.id}
                          content={fullInfo}
                          delayDuration={300}
                          className="p-4 max-w-md"
                        >
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="py-2">
                              {pod.design?.designImageUrl ? (
                                <img
                                  src={pod.design.designImageUrl}
                                  alt={pod.design?.designName || designCode}
                                  className="w-12 h-12 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                  <FileImage className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-xs font-semibold text-primary">
                              {pod.design?.orderCode || pod.design?.orderId || "—"}
                            </TableCell>
                            <TableCell className="py-2 font-mono text-sm font-semibold">
                              {shouldShowExpand && designCodeMatches
                                ? highlightText(
                                    designCode,
                                    debouncedSearchTerm.trim(),
                                  )
                                : designCode || "—"}
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                              {pod.design?.materialType?.name || "—"}
                            </TableCell>
                            <TableCell className="py-2 text-sm text-right font-semibold">
                              {pod.quantity != null
                                ? pod.quantity.toLocaleString("vi-VN")
                                : "—"}
                            </TableCell>
                            <TableCell className="py-2 text-sm">
                              {pod.design?.processClassification
                                ? processClassificationLabels[pod.design.processClassification] || pod.design.processClassification
                                : formatDesignDimensions(length, width, height, 1, " × ") + (length != null || height != null ? " mm" : "")}
                            </TableCell>
                          </TableRow>
                        </CursorTooltip>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
