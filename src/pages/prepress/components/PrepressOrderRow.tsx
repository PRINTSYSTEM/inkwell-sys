import { ChevronDown, FileImage, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { format } from "date-fns";
import {
  laminationTypeLabels,
  processClassificationLabels,
  proofingStatusLabels,
} from "@/lib/status-utils";

interface PrepressOrderRowProps {
  order: any;
  shouldShowExpand: boolean;
  searchTermLower: string;
  debouncedSearchTerm: string;
  onNavigate: (id: number) => void;
}

export function PrepressOrderRow({
  order,
  shouldShowExpand,
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
          className="bg-emerald-500 text-white font-semibold px-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const tooltipContent = (
    <div className="w-[380px] space-y-4 p-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="border-b pb-2 sticky top-0 bg-popover z-10">
        <h4 className="font-bold text-base text-foreground leading-tight">
          {order.code}
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">
          Ngày tạo:{" "}
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("vi-VN")
            : "—"}
        </p>
      </div>

      <div className="space-y-6">
        {designs.map((pod: any, idx: number) => {
          const d = pod.design;
          return (
            <div
              key={pod.id || idx}
              className="space-y-3 pb-4 border-b last:border-0 border-dashed"
            >
              <div className="w-full">
                {d?.designImageUrl ? (
                  <img
                    src={d.designImageUrl}
                    alt={d.code}
                    className="w-full aspect-video object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-lg border flex items-center justify-center">
                    <FileImage className="h-10 w-10 text-muted-foreground opacity-40" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Mã hàng {idx + 1}: {d?.code || "—"}
                </p>
                <div className="bg-muted/30 rounded-md p-2.5 space-y-2 border">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-muted-foreground font-medium">
                      Mã hàng:
                    </span>
                    <span className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-primary">
                      {d?.code || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Đơn hàng:
                    </span>
                    <span className="font-semibold">{d?.orderCode || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Chất liệu:
                    </span>
                    <span className="font-medium">
                      {d?.materialType?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Quy cách:
                    </span>
                    <span className="font-medium text-right">
                      {(() => {
                        const specs = d?.specification || (d as any)?.specifications;
                        if (Array.isArray(specs) && specs.length > 0) return specs.join(", ");
                        if (typeof specs === "string" && specs.trim().length > 0) return specs;
                        return d?.processClassification
                          ? processClassificationLabels[d.processClassification] ||
                            d.processClassification
                          : d?.length != null
                            ? `${d.length}x${d.height}mm`
                            : "—";
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-muted-foreground/10">
                    <span className="text-muted-foreground font-medium">
                      Số lượng bình:
                    </span>
                    <span className="font-bold text-blue-600">
                      {(pod.quantity || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-2 sticky bottom-0 bg-popover border-t">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Trạng thái tổng quát
        </p>
        <div className="flex flex-wrap gap-1.5 pb-1">
          <StatusBadge
            status={order.status || ""}
            label={proofingStatusLabels[order.status || ""] || "—"}
            className="text-[10px] px-2 py-0 h-5 font-bold"
          />
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 h-5 whitespace-nowrap bg-background font-bold border-primary/20 text-primary"
          >
            {designs.length} mã hàng
          </Badge>
          {order.plateExport && (
            <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px] px-2 py-0 h-5 font-bold">
              Đã xuất kẽm
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <CursorTooltip
      content={tooltipContent}
      delayDuration={1000}
      className="p-3 bg-popover/95 backdrop-blur-sm border shadow-2xl ring-1 ring-black/5 rounded-xl"
    >
      <TableRow
        className="h-10 cursor-pointer group hover:bg-muted/50 transition-colors"
        onClick={() => onNavigate(order.id)}
      >
        {shouldShowExpand && (
          <TableCell className="py-3 w-10">
            <div className="flex items-center justify-center">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                )}
              />
            </div>
          </TableCell>
        )}
        <TableCell className="py-2 w-12 align-top">
          <div className="flex flex-col gap-1">
            {designs.slice(0, 3).map((pod: any, idx: number) => (
              <div key={pod.id || idx} className="w-10 h-10 shrink-0">
                {pod.design?.designImageUrl ? (
                  <img
                    src={pod.design.designImageUrl}
                    alt={pod.design.code}
                    className="w-10 h-10 object-cover rounded border shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {designs.length > 3 && (
              <div className="w-10 text-[9px] text-center font-bold text-muted-foreground">
                +{designs.length - 3} nữa
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="py-3 font-semibold align-top">
          {shouldShowExpand && orderCodeMatches
            ? highlightText(order.code || "", debouncedSearchTerm.trim())
            : order.code}
        </TableCell>

        <TableCell className="py-3 font-bold text-xs align-top text-slate-800 dark:text-slate-200">
          <div className="flex flex-col gap-1">
            {designs.map((pod: any, idx: number) => {
              const code = pod.design?.code || "—";
              return (
                <div key={pod.id || idx} className="flex items-center gap-1.5 min-h-5">
                  <span>{highlightText(code, debouncedSearchTerm.trim())}</span>
                  {code !== "—" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4.5 w-4.5 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(code);
                        toast.success("Đã sao chép mã hàng", {
                          description: code,
                          duration: 1500,
                        });
                      }}
                      title="Sao chép mã hàng"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </TableCell>

        <TableCell className="py-3 font-semibold text-xs align-top">
          <div className="flex flex-col gap-1">
            {designs.map((pod: any, idx: number) => (
              <span key={pod.id || idx} className="text-muted-foreground">
                {pod.design?.materialType?.name || "—"}
              </span>
            ))}
          </div>
        </TableCell>
        <TableCell className="py-3 text-xs align-top">
          <div className="flex flex-col gap-1">
            {designs.map((pod: any, idx: number) => {
              const d = pod.design;
              const specs = d?.specification || (d as any)?.specifications;
              const spec = Array.isArray(specs)
                ? specs.join(", ")
                : typeof specs === "string" && specs.trim().length > 0
                  ? specs
                  : d?.processClassification
                    ? processClassificationLabels[d.processClassification] ||
                      d.processClassification
                    : d?.length != null
                      ? `${d.length}x${d.height}mm`
                      : "—";
              return <span key={pod.id || idx}>{spec}</span>;
            })}
          </div>
        </TableCell>
        <TableCell className="py-3 align-top">
          <StatusBadge
            status={order.status || ""}
            label={
              proofingStatusLabels[order.status || ""] || order.status || "—"
            }
            className={cn(
              "text-xs font-bold",
              order.status === "completed"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-amber-100 text-amber-800 border-amber-300",
            )}
          />
        </TableCell>
        <TableCell className="py-3 align-top">
          <StatusBadge
            status={order.plateExport ? "exported" : "not_exported"}
            label={order.plateExport ? "Đã xuất" : "Chưa xuất"}
            className={cn(
              "text-xs font-semibold",
              order.plateExport
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300",
            )}
          />
        </TableCell>
        <TableCell className="py-3 align-top">
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
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-red-100 text-red-800 border-red-300",
              )}
            />
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground italic">
              Không có bế
            </span>
          )}
        </TableCell>
        <TableCell className="py-3 font-medium align-top whitespace-nowrap text-muted-foreground text-[11px]">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("vi-VN")
            : "—"}
        </TableCell>
      </TableRow>
    </CursorTooltip>
  );
}
