import React, { useMemo, useState } from "react";
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
  processClassificationLabels,
  proofingStatusLabels,
} from "@/lib/status-utils";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

function DesignHoverContent({ design, pod }: { design: any; pod: any }) {
  return (
    <div className="flex gap-4 p-2 text-xs">
      <div className="w-28 h-28 shrink-0 rounded-md border bg-muted overflow-hidden">
        {design?.designThumbnailUrl ? (
          <img
            src={design.designThumbnailUrl}
            alt={design.code}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : design?.designImageUrl ? (
          <img
            src={design.designImageUrl}
            alt={design.code}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5 text-left">
        <h4 className="font-bold text-sm text-foreground truncate">
          {design?.code || "—"}
        </h4>
        <p className="text-[11px] text-muted-foreground font-medium truncate">
          {design?.designName || "—"}
        </p>
        <div className="space-y-1 pt-1 border-t border-dashed">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Đơn hàng:</span>
            <span className="font-mono font-semibold text-foreground truncate max-w-[120px]">
              {design?.latestOrderCode || design?.orderCode || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Người tạo:</span>
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {design?.designer?.fullName || design?.designer?.username || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Số lượng bình:</span>
            <span className="font-bold text-blue-600">
              {(pod.quantity || 0).toLocaleString("vi-VN")}
            </span>
          </div>
          {design?.notes && (
            <div className="text-[10px] text-muted-foreground mt-1 bg-muted/40 p-1 rounded italic truncate" title={design.notes}>
              Ghi chú: {design.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesignCodeHoverCard({
  pod,
  idx,
  debouncedSearchTerm,
  highlightText,
}: {
  pod: any;
  idx: number;
  debouncedSearchTerm: string;
  highlightText: (text: string, term: string) => any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const code = pod.design?.code || "—";

  return (
    <HoverCard openDelay={300} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-1.5 min-h-5 whitespace-nowrap cursor-help">
          <span className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold whitespace-nowrap">
            {highlightText(code, debouncedSearchTerm.trim())}
          </span>
          {pod.isUrgent && (
            <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
              Gấp
            </span>
          )}
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
      </HoverCardTrigger>
      <HoverCardContent
        className="w-[420px] p-3 bg-popover/95 backdrop-blur-sm border shadow-2xl ring-1 ring-black/5 rounded-xl"
        side="right"
        align="start"
        sideOffset={10}
      >
        {isOpen && <DesignHoverContent design={pod.design} pod={pod} />}
      </HoverCardContent>
    </HoverCard>
  );
}

interface PrepressOrderRowProps {
  order: any;
  shouldShowExpand: boolean;
  searchTermLower: string;
  debouncedSearchTerm: string;
  onNavigate: (id: number) => void;
  showAllDesignsByDefault?: boolean;
}

export const PrepressOrderRow = React.memo(function PrepressOrderRow({
  order,
  shouldShowExpand,
  searchTermLower,
  debouncedSearchTerm,
  onNavigate,
  showAllDesignsByDefault = false,
}: PrepressOrderRowProps) {
  const designs = order.proofingOrderDesigns ?? [];
  const isDieExported =
    (order.dieExports?.length ?? 0) > 0 ||
    (order.proofingOrderDies?.length ?? 0) > 0;
  const orderCodeMatches =
    shouldShowExpand && order.code?.toLowerCase().includes(searchTermLower);

  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [isDesignsExpanded, setIsDesignsExpanded] = useState(false);

  const formatImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
    return `${baseUrl}/${url.startsWith("/") ? url.slice(1) : url}`;
  };

  const proofingImgUrl = useMemo(() => {
    if (order.images && order.images.length > 0) {
      const firstImg = order.images[0];
      const url = firstImg.thumbnailUrl || firstImg.imageUrl;
      if (url) return formatImageUrl(url);
    }
    const orderImg = order.thumbnailUrl || order.proofingImageUrl || order.proofingImageUrlConverted || order.imageUrl;
    return formatImageUrl(orderImg);
  }, [order.images, order.thumbnailUrl, order.proofingImageUrl, order.proofingImageUrlConverted, order.imageUrl]);

  const proofingOriginalImgUrl = useMemo(() => {
    if (order.images && order.images.length > 0) {
      const firstImg = order.images[0];
      const url = firstImg.imageUrl || firstImg.thumbnailUrl;
      if (url) return formatImageUrl(url);
    }
    const orderImg = order.imageUrl || order.proofingImageUrl || order.proofingImageUrlConverted || order.thumbnailUrl;
    return formatImageUrl(orderImg);
  }, [order.images, order.imageUrl, order.proofingImageUrl, order.proofingImageUrlConverted, order.thumbnailUrl]);

  const searchMatchesDesignCode = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return false;
    return designs.some((pod: any) =>
      pod.design?.code?.toLowerCase().includes(term) ||
      pod.design?.designName?.toLowerCase().includes(term)
    );
  }, [designs, debouncedSearchTerm]);

  const showAllDesigns = showAllDesignsByDefault || searchMatchesDesignCode || isDesignsExpanded;

  const isUrgent = useMemo(() => {
    if (designs.some((pod: any) => pod.isUrgent)) return true;

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
  }, [order.deliveryDate, designs]);

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



  const designTypeNames = useMemo(() => {
    const set = new Set<string>();
    const orderTypeName = order.designType?.name || (order as any).designTypeName;
    if (orderTypeName) set.add(orderTypeName);
    designs.forEach((pod: any) => {
      const name = pod.design?.designType?.name || (pod.design as any)?.designTypeName;
      if (name) set.add(name);
    });
    const list = Array.from(set).filter((s) => s && s !== "—");
    return list.length > 0 ? list : ["—"];
  }, [order.designType, order.designTypeName, designs]);

  const materialTypeTexts = useMemo(() => {
    const set = new Set<string>();
    const orderMatName = order.materialType?.name || (order as any).materialTypeName;
    const orderBw = order.basisWeight;
    if (orderMatName) {
      set.add(`${orderMatName}${orderBw ? ` ${orderBw}gsm` : ""}`);
    }
    designs.forEach((pod: any) => {
      const matName = pod.design?.materialType?.name || (pod.design as any)?.materialTypeName;
      const bw = pod.design?.basisWeight || orderBw;
      if (matName) {
        set.add(`${matName}${bw ? ` ${bw}gsm` : ""}`);
      }
    });
    const list = Array.from(set).filter((s) => s && s !== "—");
    return list.length > 0 ? list : ["—"];
  }, [order.materialType, order.materialTypeName, order.basisWeight, designs]);

  const paperSizeDisplay = useMemo(() => {
    if (order.paperSize?.name) return order.paperSize.name;
    if (order.customPaperSize) return order.customPaperSize;
    if (order.rollWidth) return `Cuộn (Rộng: ${order.rollWidth} mm)`;
    return "—";
  }, [order.paperSize, order.customPaperSize, order.rollWidth]);

  const specTexts = useMemo(() => {
    const set = new Set<string>();
    if (order.laminationTypeName) set.add(order.laminationTypeName);
    if (order.processClassification) {
      set.add(processClassificationLabels[order.processClassification] || order.processClassification);
    }
    designs.forEach((pod: any) => {
      const d = pod.design;
      if (!d) return;
      const specs = d.specification || (d as any).specifications;
      if (Array.isArray(specs)) {
        specs.forEach((s: string) => s && set.add(s));
      } else if (typeof specs === "string" && specs.trim().length > 0) {
        set.add(specs.trim());
      } else if (d.processClassification) {
        set.add(processClassificationLabels[d.processClassification] || d.processClassification);
      } else if (d.length != null && d.height != null) {
        set.add(`${d.length}x${d.height}mm`);
      }
    });
    const list = Array.from(set).filter((s) => s && s !== "—");
    return list.length > 0 ? list : ["—"];
  }, [order.laminationTypeName, order.processClassification, designs]);

  return (
    <>
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
          <div className="w-10 h-10 shrink-0">
            {proofingImgUrl ? (
              <img
                src={proofingImgUrl}
                alt={order.code}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 object-cover rounded border shadow-sm cursor-zoom-in hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingImageUrl(proofingOriginalImgUrl);
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                <FileImage className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="py-3 font-semibold align-top min-w-[120px] w-32 whitespace-nowrap">
          {shouldShowExpand && orderCodeMatches
            ? highlightText(order.code || "", debouncedSearchTerm.trim())
            : order.code}
        </TableCell>

        <TableCell className="py-3 font-semibold text-xs align-top min-w-[100px] w-28 whitespace-nowrap">
          <div className="flex flex-col gap-1">
            {designTypeNames.map((text: string, idx: number) => (
              <span key={idx} className="block text-slate-800 dark:text-slate-200">
                {text}
              </span>
            ))}
          </div>
        </TableCell>

        <TableCell className="py-3 font-medium text-xs align-top min-w-[140px] w-36 break-words">
          <div className="flex flex-col gap-1">
            {materialTypeTexts.map((text: string, idx: number) => (
              <span key={idx} className="block text-muted-foreground break-words leading-tight">
                {text}
              </span>
            ))}
          </div>
        </TableCell>

        <TableCell className="py-3 font-bold text-xs align-top min-w-[210px] w-56 text-slate-800 dark:text-slate-200">
          <div className="flex flex-col gap-1.5">
            {designs.length > 0 ? (
              (showAllDesigns ? designs : designs.slice(0, 1)).map((pod: any, idx: number) => (
                <DesignCodeHoverCard
                  key={pod.id || idx}
                  pod={pod}
                  idx={idx}
                  debouncedSearchTerm={debouncedSearchTerm}
                  highlightText={highlightText}
                />
              ))
            ) : (
              <span className="text-muted-foreground font-normal">—</span>
            )}
            {!showAllDesigns && designs.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDesignsExpanded(true);
                }}
                className="text-left text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
              >
                +{designs.length - 1} mã khác
              </button>
            )}
            {isDesignsExpanded && !searchMatchesDesignCode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDesignsExpanded(false);
                }}
                className="text-left text-[10px] font-bold text-slate-500 hover:text-slate-600 hover:underline mt-0.5"
              >
                Thu gọn
              </button>
            )}
          </div>
        </TableCell>

        <TableCell className="py-3 font-medium text-xs align-top text-center">
          {paperSizeDisplay}
        </TableCell>
        <TableCell className="py-3 font-bold text-sm align-top text-center text-rose-600 font-mono">
          {order.totalQuantity ? order.totalQuantity.toLocaleString("vi-VN") : "0"}
        </TableCell>
        <TableCell className="py-3 text-xs align-top">
          <div className="flex flex-col gap-1">
            {specTexts.map((spec: string, idx: number) => (
              <span key={idx} className="block">
                {spec}
              </span>
            ))}
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
          {order.status === "production_returned" && (order.returnTypeDisplayName || order.returnType || order.returnReason) && (
            <div className="mt-1 flex flex-col gap-0.5">
              <Badge variant="outline" className={cn(
                "text-[9.5px] font-bold py-0 px-1.5 border w-fit",
                order.returnType === "dispatch" ? "bg-red-50 text-red-700 border-red-200" : "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                {order.returnTypeDisplayName || (order.returnType === "dispatch" ? "Điều lệnh trả về" : "Lệnh in trả về")}
              </Badge>
              {order.returnReason && (
                <span className="text-[10px] text-rose-700 font-medium italic line-clamp-2" title={order.returnReason}>
                  Lý do: {order.returnReason}
                </span>
              )}
            </div>
          )}
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

        <TableCell className="py-3 align-top whitespace-nowrap">
          <div className="flex flex-col gap-0.5">
            {order.status === "completed" ? (
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {order.completedAt
                  ? format(new Date(order.completedAt), "HH:mm:ss dd/MM/yyyy")
                  : order.updatedAt
                    ? format(new Date(order.updatedAt), "HH:mm:ss dd/MM/yyyy")
                    : "—"}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic font-medium">Chưa hoàn thành</span>
            )}
            {order.createdBy && (
              <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                Tạo bởi: {order.createdBy.fullName || order.createdBy.username || "—"}
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>

      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={!!viewingImageUrl}
          onOpenChange={(open) => {
            if (!open) setViewingImageUrl(null);
          }}
        />
      )}
    </>
  );
});
