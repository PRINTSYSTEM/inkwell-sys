import { useMemo } from "react";
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
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
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
  const isDieExported =
    (order.dieExports?.length ?? 0) > 0 ||
    (order.proofingOrderDies?.length ?? 0) > 0;
  const orderCodeMatches =
    shouldShowExpand && order.code?.toLowerCase().includes(searchTermLower);

  const isUrgent = useMemo(() => {
    if (!order.deliveryDate) return false;
    try {
      const deliveryDate = new Date(order.deliveryDate);
      const now = new Date();
      const d1 = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 2;
    } catch (e) {
      return false;
    }
  }, [order.deliveryDate]);

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
      <div className="border-b pb-2 sticky top-0 bg-popover z-10 space-y-1.5">
        <h4 className="font-bold text-base text-foreground leading-tight">
          Mã bài: {order.code}
        </h4>
        <div className="text-[11px] text-muted-foreground space-y-0.5 font-medium">
          <div>
            <span className="font-semibold text-foreground">Người tạo lệnh:</span>{" "}
            {order.createdBy?.fullName || order.createdBy?.username || "—"}
          </div>
          <div>
            <span className="font-semibold text-foreground">Người tạo đơn hàng:</span>{" "}
            {order.order?.creator?.fullName || order.order?.creator?.username || order.creator?.fullName || order.creator?.username || "—"}
          </div>
          {order.notes && (
            <div>
              <span className="font-semibold text-foreground">Ghi chú lệnh:</span>{" "}
              {order.notes}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {designs.map((pod: any, idx: number) => {
          const d = pod.design;
          return (
            <div
              key={pod.id || idx}
              className="space-y-2 pb-4 border-b last:border-0 border-dashed"
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
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Thiết kế {idx + 1}: {d?.designName || d?.code || "—"}
                </p>
                <div className="bg-muted/30 rounded-md p-2.5 space-y-1.5 border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      Đơn hàng:
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {d?.latestOrderCode || d?.orderCode || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      Người tạo thiết kế:
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {d?.designer?.fullName || d?.designer?.username || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      Số lượng bình:
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {(pod.quantity || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {(d?.notes || d?.latestRequirements) && (
                    <div className="pt-1.5 border-t border-muted-foreground/10 space-y-1">
                      {d?.notes && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú thiết kế: </span>
                          <span className="italic">{d.notes}</span>
                        </div>
                      )}
                      {d?.latestRequirements && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Yêu cầu đơn hàng: </span>
                          <span className="italic">{d.latestRequirements}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <TableRow
      className={cn(
        "h-10 cursor-pointer group hover:bg-muted/50 transition-colors",
        isUrgent && "bg-rose-50/60 hover:bg-rose-100/60 border-l-4 border-l-rose-500 dark:bg-rose-950/20 dark:hover:bg-rose-900/20 dark:border-l-rose-600"
      )}
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
        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <div className="flex flex-col gap-1 cursor-help">
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
          </HoverCardTrigger>
          <HoverCardContent
            className="w-[400px] p-3 bg-popover/95 backdrop-blur-sm border shadow-2xl ring-1 ring-black/5 rounded-xl max-h-[80vh] overflow-y-auto custom-scrollbar"
            side="right"
            align="start"
            sideOffset={10}
          >
            {tooltipContent}
          </HoverCardContent>
        </HoverCard>
      </TableCell>

      <TableCell className="py-3 font-semibold text-xs align-top">
        <div className="flex flex-col gap-1">
          {Array.from(
            new Set(
              designs.map((pod: any) => {
                const materialName = pod.design?.materialType?.name || "—";
                const basisWeight = pod.design?.basisWeight;
                const designType = pod.design?.designType?.name;
                return `${materialName}${basisWeight ? ` ${basisWeight}gsm` : ""}${designType ? ` (${designType})` : ""}`;
              })
            )
          ).map((text: any, idx: number) => (
            <span key={idx} className="text-muted-foreground block">
              {text}
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
          status={(order.plateOutputCount ?? 0) > 0 ? "exported" : "not_exported"}
          label={(order.plateOutputCount ?? 0) > 0 ? "Đã xuất" : "Chưa xuất"}
          className={cn(
            "text-xs font-semibold",
            (order.plateOutputCount ?? 0) > 0
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
            status={isDieExported ? "exported" : "not_exported"}
            label={isDieExported ? "Đã xuất" : "Chưa xuất"}
            className={cn(
              "text-xs font-semibold",
              isDieExported
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

      <TableCell className="py-3 font-medium align-top whitespace-nowrap text-[11px]">
        <div className="flex flex-col gap-1 text-slate-700 dark:text-slate-300">
          {order.status === "completed" ? (
            <div>
              <span className="font-semibold text-slate-500">Hoàn thành: </span>
              {order.completedAt
                ? format(new Date(order.completedAt), "HH:mm:ss dd/MM/yyyy")
                : order.updatedAt
                  ? format(new Date(order.updatedAt), "HH:mm:ss dd/MM/yyyy")
                  : "—"}
            </div>
          ) : (
            <span className="text-muted-foreground italic">Chưa hoàn thành</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
