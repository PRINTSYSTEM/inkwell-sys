import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";
import {
  useKcsProductionOrders,
  useKcsDesignTypeSummary,
  KcsProductionOrderResponse,
  KcsDesignTypeSummaryResponse,
} from "@/hooks/use-kcs";
import { useBulkUpdateProductionOrderItems } from "@/hooks/use-production";
import { defectRecordKeys } from "@/hooks/use-defect-record";
import { useAuth } from "@/hooks/use-auth";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useDesign } from "@/hooks/use-design";
import { checkIsDecalSet } from "@/types/proofing";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import {
  Factory,
  Search,
  Calendar,
  Printer,
  Save,
  XCircle,
  Loader2,
  FileImage,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { AsyncSelect } from "@/components/forms/AsyncSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrintLabelDialog } from "./components/PrintLabelDialog";

export default function KCSPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // No tab filtering needed as requested by user - showing all completed proofing orders

  // Date filters
  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");

  // Design type filter
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | null>(null);

  // Print Dialog State
  const [printPoId, setPrintPoId] = useState<number | null>(null);
  const [printItemId, setPrintItemId] = useState<number | null>(null);
  const [printDefaultQty, setPrintDefaultQty] = useState<number>(0);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);

  // ImageViewer Dialog State
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const handleOpenPrintLabel = useCallback((poId: number, itemId: number, defaultQty: number) => {
    setPrintPoId(poId);
    setPrintItemId(itemId);
    setPrintDefaultQty(defaultQty);
    setIsPrintLabelOpen(true);
  }, []);

  const handleOpenImageViewer = useCallback((url: string) => {
    setViewingImageUrl(url);
  }, []);

  // Table container ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Date validation: toDate >= fromDate
  useEffect(() => {
    if (customFromDate && customToDate) {
      if (new Date(customFromDate) > new Date(customToDate)) {
        toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      }
    }
  }, [customFromDate, customToDate]);

  // Date options helpers
  const dateOptions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatDateLabel = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

    return {
      todayLabel: `Hôm nay (${formatDateLabel(today)})`,
      yesterdayLabel: `Hôm qua (${formatDateLabel(yesterday)})`,
      twoDaysAgoLabel: `Ngày ${formatDateLabel(twoDaysAgo)}`,
      twoDaysAgoValue: `${twoDaysAgo.getFullYear()}-${pad(twoDaysAgo.getMonth() + 1)}-${pad(twoDaysAgo.getDate())}`,
    };
  }, []);

  // Compute from/to Date parameters based on shortcuts (using local YYYY-MM-DD date strings)
  const dateParams = useMemo(() => {
    const toLocalDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (dateFilterType === "all") {
      return { fromDate: undefined, toDate: undefined };
    }
    if (dateFilterType === "today") {
      const dateStr = toLocalDateString(new Date());
      return { fromDate: dateStr, toDate: dateStr };
    }
    if (dateFilterType === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const dateStr = toLocalDateString(d);
      return { fromDate: dateStr, toDate: dateStr };
    }
    if (dateFilterType === "two_days_ago") {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      const dateStr = toLocalDateString(d);
      return { fromDate: dateStr, toDate: dateStr };
    }
    if (dateFilterType === "custom" && customFromDate && customToDate) {
      if (new Date(customFromDate) <= new Date(customToDate)) {
        return { fromDate: customFromDate, toDate: customToDate };
      }
    }
    return { fromDate: undefined, toDate: undefined };
  }, [dateFilterType, customFromDate, customToDate]);

  // Fetch summary count of design types (always showing all, not affected by selectedDesignTypeId)
  const { data: designTypesSummary = [] } = useKcsDesignTypeSummary({
    proofingCompletedFromDate: dateParams.fromDate,
    proofingCompletedToDate: dateParams.toDate,
  });

  // Fetch active design types master list
  const { data: designTypesData } = useDesignTypeList({ status: "active" });
  const designTypes = useMemo(() => {
    return Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData as any)?.items || [];
  }, [designTypesData]);

  // Query parameters for GET /api/v1/production-orders/kcs
  const queryParams = useMemo(() => {
    return {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      proofingCompletedFromDate: dateParams.fromDate,
      proofingCompletedToDate: dateParams.toDate,
      designTypeId: selectedDesignTypeId || undefined,
      search: debouncedSearch.trim() || undefined,
      sortColumn: "CreatedAt",
      sortOrder: "desc",
    };
  }, [currentPage, dateParams, selectedDesignTypeId, debouncedSearch]);

  const { data: productionsResp, isLoading } = useKcsProductionOrders(queryParams);

  const productions = useMemo<KcsProductionOrderResponse[]>(() => {
    return productionsResp?.items || [];
  }, [productionsResp]);

  const totalCount = productionsResp?.total ?? 0;
  const totalPages = productionsResp?.totalPages ?? 1;

  // Filter client-side based on tabs if tab parameters are not natively filtered by backend
  const filteredProductions = useMemo(() => {
    return productions;
  }, [productions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilterType, customFromDate, customToDate, selectedDesignTypeId]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background relative">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3 pb-3 pt-0">

        {/* Header section */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#93631F]/10 text-[#93631F] rounded-md">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-800 dark:text-slate-100">Báo số KCS</h1>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-2.5 mb-3 shrink-0 bg-muted/20 p-2.5 rounded-lg border border-border/50">
          {/* ROW 1: Date Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 bg-background dark:bg-muted/10 p-1 rounded-md border border-border/40 w-fit">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2 select-none">
                Ngày hoàn thành BB:
              </span>
              <Button
                variant={dateFilterType === "all" ? "default" : "ghost"}
                size="sm"
                type="button"
                className={cn(
                  "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                  dateFilterType === "all"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                )}
                onClick={() => {
                  setDateFilterType("all");
                  setCustomFromDate("");
                  setCustomToDate("");
                }}
              >
                Tất cả ngày
              </Button>
              <Button
                variant={dateFilterType === "today" ? "default" : "ghost"}
                size="sm"
                type="button"
                className={cn(
                  "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                  dateFilterType === "today"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                )}
                onClick={() => {
                  setDateFilterType("today");
                  setCustomFromDate("");
                  setCustomToDate("");
                }}
              >
                {dateOptions.todayLabel}
              </Button>
              <Button
                variant={dateFilterType === "yesterday" ? "default" : "ghost"}
                size="sm"
                type="button"
                className={cn(
                  "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                  dateFilterType === "yesterday"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                )}
                onClick={() => {
                  setDateFilterType("yesterday");
                  setCustomFromDate("");
                  setCustomToDate("");
                }}
              >
                {dateOptions.yesterdayLabel}
              </Button>
              <Button
                variant={dateFilterType === "two_days_ago" ? "default" : "ghost"}
                size="sm"
                type="button"
                className={cn(
                  "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                  dateFilterType === "two_days_ago"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                )}
                onClick={() => {
                  setDateFilterType("two_days_ago");
                  setCustomFromDate(dateOptions.twoDaysAgoValue);
                  setCustomToDate(dateOptions.twoDaysAgoValue);
                }}
              >
                {dateOptions.twoDaysAgoLabel}
              </Button>

              <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/60">
                <Button
                  variant={dateFilterType === "custom" ? "default" : "ghost"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                    dateFilterType === "custom"
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                  )}
                  onClick={() => {
                    setDateFilterType("custom");
                  }}
                >
                  Chọn khoảng ngày...
                </Button>
                {dateFilterType === "custom" && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center border border-input rounded-sm px-2 bg-background focus-within:ring-1 focus-within:ring-slate-450 h-7">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase select-none mr-1.5">TỪ</span>
                      <input
                        type="date"
                        value={customFromDate}
                        onChange={(e) => setCustomFromDate(e.target.value)}
                        className="bg-transparent border-0 p-0 text-xs focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none w-[96px] h-full"
                      />
                    </div>
                    <span className="text-xs text-slate-400">—</span>
                    <div className="flex items-center border border-input rounded-sm px-2 bg-background focus-within:ring-1 focus-within:ring-slate-450 h-7">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase select-none mr-1.5">ĐẾN</span>
                      <input
                        type="date"
                        value={customToDate}
                        onChange={(e) => setCustomToDate(e.target.value)}
                        className="bg-transparent border-0 p-0 text-xs focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none w-[96px] h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-0 w-full lg:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã BB hoặc mã hàng..."
                className="pl-9 h-9 text-xs bg-background border border-input focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* ROW 3: Design Type Filters & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 bg-background dark:bg-muted/10 p-1 rounded-md border border-border/40 w-fit">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2 select-none">
                Loại sản phẩm:
              </span>
              <Button
                variant={selectedDesignTypeId === null ? "default" : "ghost"}
                size="sm"
                type="button"
                className={cn(
                  "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                  selectedDesignTypeId === null
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                )}
                onClick={() => setSelectedDesignTypeId(null)}
              >
                Tất cả
              </Button>
              {designTypes.map((type: any) => {
                const summary = designTypesSummary.find((s) => s.designTypeId === type.id);
                const count = summary ? summary.productionOrderCount : 0;
                return (
                  <Button
                    key={type.id}
                    variant={selectedDesignTypeId === type.id ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    className={cn(
                      "h-7 text-xs px-2.5 rounded-sm font-medium transition-all",
                      selectedDesignTypeId === type.id
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-muted"
                    )}
                    onClick={() => setSelectedDesignTypeId(type.id)}
                  >
                    <span>{type.name || "Chưa xác định"}</span>
                    <span
                      className={cn(
                        "ml-1.5 px-1 py-0.2 rounded-full text-[9px] font-extrabold",
                        selectedDesignTypeId === type.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 font-semibold px-1">
              Tổng số lệnh hoàn thành bài: <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Main List */}
        <div ref={tableContainerRef} className="flex-grow overflow-auto border rounded-lg bg-background shadow-inner">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Bình bài</TableHead>
                  <TableHead className="w-[120px]">Hoàn thành BB</TableHead>
                  <TableHead className="w-[120px]">Loại thiết kế</TableHead>
                  <TableHead>Danh sách mã hàng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton cols={4} rows={4} rowHeight="h-28" />
              </TableBody>
            </Table>
          ) : filteredProductions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <Factory className="h-12 w-12 text-muted-foreground opacity-60" />
              <p className="text-sm font-medium text-slate-400">
                Không tìm thấy lệnh sản xuất nào hoàn thành bình bài
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[130px] font-bold">Hình Bình Bài</TableHead>
                  <TableHead className="w-[110px] font-bold">Mã BB</TableHead>
                  <TableHead className="w-[130px] font-bold">Hoàn thành BB</TableHead>
                  <TableHead className="w-[140px] font-bold">Loại thiết kế</TableHead>
                  <TableHead className="font-bold">Danh sách mã hàng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductions.map((prod) => (
                  <KcsOrderRow
                    key={prod.productionOrderId}
                    prod={prod}
                    onOpenPrintLabel={handleOpenPrintLabel}
                    onOpenImageViewer={handleOpenImageViewer}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <span className="text-xs font-semibold">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      {/* ImageViewer Dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={!!viewingImageUrl}
          onOpenChange={(open) => {
            if (!open) setViewingImageUrl(null);
          }}
        />
      )}

      {/* Print Label Dialog */}
      <PrintLabelDialog
        open={isPrintLabelOpen}
        onOpenChange={setIsPrintLabelOpen}
        poId={printPoId}
        itemId={printItemId}
        defaultQty={printDefaultQty}
      />
    </div>
  );
}

interface KcsItemRowProps {
  item: KcsProductionOrderResponse["items"][number];
  prod: KcsProductionOrderResponse;
  idx: number;
  isEditing: boolean;
  itemVals: any;
  existingDefect: any;
  handleValChange: (itemId: number, field: string, value: string) => void;
  loadUsersOptions: (search?: string) => Promise<any>;
  onOpenPrintLabel: (poId: number, itemId: number, defaultQty: number) => void;
  onOpenImageViewer: (url: string) => void;
}

const KcsItemRow = React.memo(function KcsItemRow({
  item,
  prod,
  idx,
  isEditing,
  itemVals,
  existingDefect,
  handleValChange,
  loadUsersOptions,
  onOpenPrintLabel,
  onOpenImageViewer,
}: KcsItemRowProps) {
  // Query design detail to get sidesClassification
  const { data: design } = useDesign(item.designId || null, !!item.designId);

  const side = (item as any).side || "both";
  const isDecalSet = checkIsDecalSet(design || (item as any));
  const isBoBoth = isDecalSet && (side === "both" || !side);

  const formatQty = (qty: number | undefined | null) => {
    if (qty == null) return "0";
    if (side === "front" || side === "back") {
      return qty.toLocaleString("vi-VN");
    }
    if (isBoBoth) {
      const sets = Math.floor(qty / 2);
      return `${sets.toLocaleString("vi-VN")} bộ`;
    }
    return qty.toLocaleString("vi-VN");
  };

  const formatRawQty = (qty: number | undefined | null) => {
    if (qty == null) return "0";
    return qty.toLocaleString("vi-VN");
  };

  const hasValue = isEditing
    ? Number(itemVals?.outputQty || 0) > 0
    : Number(item.outputQty || 0) > 0;

  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-3 p-2 border rounded-md transition-all items-start shadow-sm border-l-4 ${
        hasValue
          ? "bg-emerald-100/90 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-800 border-l-emerald-600 dark:border-l-emerald-500 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/40"
          : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 border-l-slate-300 dark:border-l-slate-700 hover:shadow-sm"
      }`}
    >
      {/* Left part: item image & text details */}
      <div className="flex gap-2 min-w-0">
        {item.designImageUrl || item.designThumbnailUrl ? (
          <div className="w-10 h-10 border rounded bg-white overflow-hidden flex items-center justify-center shrink-0 cursor-zoom-in hover:ring-1 hover:ring-primary/20">
            <img
              src={
                (() => {
                  const url = item.designThumbnailUrl || item.designImageUrl || "";
                  if (url.startsWith("http")) return url;
                  return `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "")}/${url.replace(/^\//, "")}`;
                })()
              }
              alt={item.designCode || "design"}
              loading="lazy"
              decoding="async"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              onClick={() => {
                const url = item.designImageUrl || item.designThumbnailUrl || "";
                onOpenImageViewer(
                  url.startsWith("http")
                    ? url
                    : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "")}/${url.replace(/^\//, "")}`
                );
              }}
            />
          </div>
        ) : (
          <div className="w-10 h-10 border rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
            <FileImage className="w-4 h-4 opacity-40" />
          </div>
        )}
        <div className="min-w-0 text-xs leading-normal">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate" title={item.designName || ""}>
              {item.designName || "—"}
            </p>
            {isDecalSet && (item as any).side === "front" && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                Mặt trước
              </span>
            )}
            {isDecalSet && (item as any).side === "back" && (
              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                Mặt sau
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-slate-500 mt-1">
            <span>Mã: <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.designCode || "—"}</strong></span>
            <span>•</span>
            <span>Khách: <strong className="text-slate-800 dark:text-slate-200 font-bold">{item.customerName || item.customerCompanyName || "—"}</strong></span>
            <span>•</span>
            <span>SL Bình bài: <strong className="text-amber-800 dark:text-amber-500 font-extrabold text-sm">{formatQty(item.inputQty)}</strong></span>
            <span>•</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold text-[11px] border">
              {(item.itemsPerSheet != null && item.itemsPerSheet > 0 ? item.itemsPerSheet : 1)} con/bài
            </span>
          </div>
        </div>
      </div>

      {/* Right part: numeric input inputs or read-only quantities */}
      <div className="flex items-center gap-3">
        {isEditing && itemVals ? (
          <div className="flex flex-col gap-1.5 w-[220px] shrink-0 border-l pl-3">
            {/* Quantity Out Input */}
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Hàng Ra</span>
              <Input
                type="number"
                value={itemVals.outputQty}
                onChange={(e) => handleValChange(item.productionOrderItemId, "outputQty", e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={`h-7 text-xs font-bold w-24 tabular-nums focus-visible:ring-emerald-500 transition-colors ${
                  Number(itemVals.outputQty || 0) > 0
                    ? "text-emerald-700 dark:text-emerald-500 border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : ""
                }`}
                data-output-index={idx}
              />
            </div>
            {/* Defect Quantity Input */}
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-[10px] font-bold text-red-600 uppercase">Hàng Lỗi</span>
              <Input
                type="number"
                value={itemVals.defectQty}
                onChange={(e) => handleValChange(item.productionOrderItemId, "defectQty", e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="h-7 text-xs font-bold w-24 tabular-nums text-red-600 border-red-200 focus-visible:ring-red-500"
              />
            </div>

            {/* Defect Employee & Defect Source Dropdowns (if defectQty > 0) */}
            {Number(itemVals.defectQty) > 0 && (
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed mt-0.5 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-red-500 uppercase">N/V phụ trách lỗi</span>
                  <AsyncSelect
                    value={itemVals.assignedToUserId}
                    onValueChange={(val) => handleValChange(item.productionOrderItemId, "assignedToUserId", val?.toString() || "")}
                    loadOptions={loadUsersOptions}
                    placeholder="Chọn người..."
                    className="w-full h-7 text-[10px] min-h-7"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Nguồn lỗi</span>
                  <Select
                    value={itemVals.defectSource}
                    onValueChange={(val) => handleValChange(item.productionOrderItemId, "defectSource", val)}
                  >
                    <SelectTrigger className="h-7 text-[10px] bg-background border-muted px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design" className="text-xs">Lỗi thiết kế</SelectItem>
                      <SelectItem value="proofing" className="text-xs">Lỗi bình bài</SelectItem>
                      <SelectItem value="production" className="text-xs">Lỗi sản xuất</SelectItem>
                      <SelectItem value="management_decision" className="text-xs">Quyết định QL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Item Note */}
            <Input
              placeholder="Ghi chú hàng..."
              value={itemVals.notes}
              onChange={(e) => handleValChange(item.productionOrderItemId, "notes", e.target.value)}
              className="h-7 text-[10px] px-2"
            />
          </div>
        ) : (
          // Read-only state
          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
            <div className="text-right">
              <span className="text-[10px] block text-slate-400 dark:text-slate-500 font-bold uppercase leading-none mb-1">Ra</span>
              <span className={`text-base font-black tabular-nums ${
                (item.outputQty || 0) > 0
                  ? "text-emerald-800 dark:text-emerald-400 font-extrabold"
                  : "text-slate-400 dark:text-slate-650"
              }`}>
                {formatRawQty(item.outputQty)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] block text-slate-400 dark:text-slate-500 font-bold uppercase leading-none mb-1">Lỗi</span>
              <span className="text-red-600 dark:text-red-400 text-base font-black tabular-nums">
                {formatRawQty(item.defectQty)}
              </span>
            </div>
            {existingDefect && (
              <div className="text-[9px] text-muted-foreground w-20 leading-tight text-left border-l pl-2">
                <span className="block font-bold text-slate-700 truncate" title={existingDefect.assignedToUserName}>
                  {existingDefect.assignedToUserName}
                </span>
                <span className="text-red-500 italic block text-[8px]">
                  ({existingDefect.defectSource === "production" ? "Sản xuất" : existingDefect.defectSource === "design" ? "Thiết kế" : "Bình bài"})
                </span>
              </div>
            )}

            {/* Print label button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-300 hover:bg-slate-100 shrink-0"
              onClick={() => onOpenPrintLabel(prod.productionOrderId, item.productionOrderItemId, item.outputQty || item.inputQty || 0)}
              title="In tem nhãn dán thùng"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Inner row component to manage edit state for each production order
interface KcsOrderRowProps {
  prod: KcsProductionOrderResponse;
  onOpenPrintLabel: (poId: number, itemId: number, defaultQty: number) => void;
  onOpenImageViewer: (url: string) => void;
}

const KcsOrderRow = React.memo(function KcsOrderRow({
  prod,
  onOpenPrintLabel,
  onOpenImageViewer,
}: KcsOrderRowProps) {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [quickQty, setQuickQty] = useState("");
  const [tempValues, setTempValues] = useState<
    Record<
      number,
      {
        outputQty: string;
        defectQty: string;
        notes: string;
        assignedToUserId: string;
        defectSource: string;
      }
    >
  >({});

  const { mutateAsync: bulkUpdateItems, isPending: isSaving } = useBulkUpdateProductionOrderItems();

  const defectRecords = prod.defectRecords || [];

  // Load user options for defect worker selection
  const loadUsersOptions = async (search?: string) => {
    try {
      const res = await apiRequest.get<any>("/users", {
        params: {
          pageNumber: 1,
          pageSize: 100,
          isActive: true,
          search: search || undefined,
        },
      });
      return (res.data?.items ?? []).map((u: any) => ({
        value: u.id,
        label: u.fullName || u.username || `User #${u.id}`,
        description: u.role ? `Vai trò: ${u.role}` : undefined,
      }));
    } catch (err) {
      console.error("loadUsersOptions error:", err);
      return [];
    }
  };

  // Initialize form state
  const startEditing = () => {
    const initial: typeof tempValues = {};
    prod.items.forEach((item) => {
      const existingDefect = defectRecords.find(
        (dr) => dr.designId === item.designId || dr.orderDetailId === item.orderDetailId
      );

      initial[item.productionOrderItemId] = {
        outputQty: item.outputQty !== null && item.outputQty !== 0 ? String(item.outputQty) : "0",
        defectQty: item.defectQty !== null && item.defectQty !== 0 ? String(item.defectQty) : "",
        notes: existingDefect?.description || "",
        assignedToUserId: existingDefect?.assignedToUserId?.toString() || "",
        defectSource: existingDefect?.defectSource || "production",
      };
    });
    setTempValues(initial);
    setQuickQty("");
    setIsEditing(true);
  };

  // Update temp values in state
  const handleValChange = (
    itemId: number,
    field: "outputQty" | "defectQty" | "notes" | "assignedToUserId" | "defectSource",
    value: string
  ) => {
    // Validation: only integers >= 0 for outputQty and defectQty
    if (field === "outputQty" || field === "defectQty") {
      if (value !== "" && !/^\d+$/.test(value)) {
        return; // Ignore non-numeric input
      }
    }

    setTempValues((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // Apply quick quantity input to all items (Apply All / Nhập nhanh)
  const handleApplyQuickQty = () => {
    const qtyNum = Number(quickQty);
    if (!quickQty || isNaN(qtyNum) || qtyNum < 0) {
      toast.error("Vui lòng nhập số lượng nhanh hợp lệ (số nguyên >= 0)!");
      return;
    }

    setTempValues((prev) => {
      const updated = { ...prev };
      prod.items.forEach((item) => {
        if (updated[item.productionOrderItemId]) {
          const itemsPerSheet =
            item.itemsPerSheet != null && item.itemsPerSheet > 0
              ? item.itemsPerSheet
              : 1;
          const calculatedOutput = qtyNum * itemsPerSheet;
          updated[item.productionOrderItemId] = {
            ...updated[item.productionOrderItemId],
            outputQty: String(calculatedOutput),
          };
        }
      });
      return updated;
    });

    toast.info("Đã áp dụng số lượng ra (nhân theo số con bình) cho tất cả!");
  };

  // Save all items and sync defect records
  const handleSave = async () => {
    // 1. Validate inputs (integer >= 0)
    let hasInvalidOutput = false;
    let missingEmployee = false;

    prod.items.forEach((item) => {
      const vals = tempValues[item.productionOrderItemId];
      if (!vals) return;

      const outQty = Number(vals.outputQty);
      if (isNaN(outQty) || outQty < 0) {
        hasInvalidOutput = true;
      }

      const defQty = Number(vals.defectQty) || 0;
      if (defQty > 0 && !vals.assignedToUserId) {
        missingEmployee = true;
      }
    });

    if (hasInvalidOutput) {
      toast.error("Số lượng ra phải là số nguyên lớn hơn hoặc bằng 0!");
      return;
    }

    if (missingEmployee) {
      toast.error("Vui lòng chọn nhân viên chịu trách nhiệm lỗi!");
      return;
    }

    try {
      const itemsToUpdate = prod.items
        .map((item) => {
          const vals = tempValues[item.productionOrderItemId];
          if (!vals) return null;
          return {
            itemId: item.productionOrderItemId,
            outputQty: Number(vals.outputQty) || 0,
            defectQty: Number(vals.defectQty) || 0,
            notes: vals.notes || "",
          };
        })
        .filter(Boolean) as any[];

      // Save bulk output quantities
      await bulkUpdateItems({
        productionOrderId: prod.productionOrderId,
        data: { items: itemsToUpdate },
      });

      // Manage defect records (create, update, delete)
      const defectPromises = prod.items.map(async (item) => {
        const vals = tempValues[item.productionOrderItemId];
        if (!vals) return;

        const defectQtyNum = Number(vals.defectQty) || 0;
        const existingDefect = defectRecords.find(
          (dr) => dr.designId === item.designId || dr.orderDetailId === item.orderDetailId
        );

        const oldDefectQty = existingDefect ? existingDefect.defectQuantity : 0;
        const oldWorkerId = existingDefect ? existingDefect.assignedToUserId?.toString() : "";
        const oldDefectSource = existingDefect ? existingDefect.defectSource : "production";
        const oldDescription = existingDefect ? existingDefect.description || "" : "";

        const newWorkerId = vals.assignedToUserId || "";
        const newDefectSource = vals.defectSource || "production";
        const newDescription = vals.notes.trim() || `Lỗi ghi nhận tại khâu KCS cho mã hàng ${item.designCode || ""}`;

        const isUnchanged =
          defectQtyNum === oldDefectQty &&
          newWorkerId === oldWorkerId &&
          newDefectSource === oldDefectSource &&
          (defectQtyNum === 0 || newDescription === oldDescription);

        if (!isUnchanged) {
          if (existingDefect) {
            if (defectQtyNum > 0) {
              await apiRequest.put(`/defect-records/${existingDefect.id}`, {
                defectQuantity: defectQtyNum,
                assignedToUserId: Number(newWorkerId),
                defectSource: newDefectSource,
                description: newDescription,
              });
            } else {
              await apiRequest.delete(`/defect-records/${existingDefect.id}`);
            }
          } else {
            if (defectQtyNum > 0) {
              // Find the packaging/QC step ID if it exists
              let stepId: number | undefined = undefined;
              try {
                const stepRes = await apiRequest.get<any>(`/production-orders/${prod.productionOrderId}`);
                const packagingStep = (stepRes.data?.steps ?? []).find(
                  (s: any) =>
                    s.stepType === "packaging" ||
                    (s.stepTypeName &&
                      ["đóng gói", "giao hàng"].some((k) =>
                        s.stepTypeName.toLowerCase().includes(k)
                      ))
                );
                stepId = packagingStep?.id;
              } catch (err) {
                console.error("Lỗi lấy thông tin steps:", err);
              }

              await apiRequest.post("/defect-records", {
                productionOrderId: prod.productionOrderId,
                productionStepId: stepId,
                designId: item.designId,
                orderDetailId: item.orderDetailId,
                defectQuantity: defectQtyNum,
                description: newDescription,
                defectSource: newDefectSource,
                assignedToUserId: Number(newWorkerId),
                defectOccurredAt: new Date().toISOString(),
              });
            }
          }
        }
      });

      await Promise.all(defectPromises);

      // Invalidate queries to refresh KCS orders list and defect records
      queryClient.invalidateQueries({ queryKey: ["kcs-production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kcs-design-type-summary"] });
      queryClient.invalidateQueries({ queryKey: defectRecordKeys.all });

      toast.success("Lưu thông tin KCS thành công!");
      setIsEditing(false);
    } catch (err) {
      console.error("Lỗi lưu KCS:", err);
      toast.error("Không thể lưu thông tin KCS!");
    }
  };

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "—";
    }
  };

  // Get layout image URL
  const layoutImageUrl = useMemo(() => {
    if (prod.proofingOrderImages && prod.proofingOrderImages.length > 0) {
      const img = prod.proofingOrderImages[0];
      if (img.imageUrl) {
        if (img.imageUrl.startsWith("http")) return img.imageUrl;
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return `${baseUrl}/${img.imageUrl.replace(/^\//, "")}`;
      }
    }
    return null;
  }, [prod.proofingOrderImages]);

  // Get layout thumbnail URL
  const layoutImageThumbnailUrl = useMemo(() => {
    if (prod.proofingOrderImages && prod.proofingOrderImages.length > 0) {
      const img = prod.proofingOrderImages[0];
      const url = img.thumbnailUrl || img.imageUrl;
      if (url) {
        if (url.startsWith("http")) return url;
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return `${baseUrl}/${url.replace(/^\//, "")}`;
      }
    }
    return null;
  }, [prod.proofingOrderImages]);

  // Check if KCS has been completely finished for this row
  const isChecked = prod.items && prod.items.length > 0 && prod.items.every((i) => (i.outputQty ?? 0) > 0);

  return (
    <TableRow
      className={cn(
        "hover:bg-muted/5 font-medium border-b transition-colors",
        isChecked && "bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50"
      )}
    >

      {/* Flat layout image */}
      <TableCell className="align-top py-3">
        {layoutImageUrl ? (
          <div className="w-20 h-20 border rounded bg-white overflow-hidden flex items-center justify-center cursor-zoom-in hover:ring-2 hover:ring-primary/40 transition-colors shadow-sm">
            <img
              src={layoutImageThumbnailUrl || layoutImageUrl}
              alt={prod.proofingOrderCode || "Flat layout"}
              loading="lazy"
              decoding="async"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              onClick={() => onOpenImageViewer(layoutImageUrl)}
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-muted-foreground border">
            <FileImage className="w-5 h-5 mb-1 opacity-50" />
            <span className="text-[10px]">Không ảnh</span>
          </div>
        )}
      </TableCell>

      {/* Code */}
      <TableCell className="align-top py-3 text-sm">
        <span className="text-base font-black text-slate-900 dark:text-slate-100">
          {prod.proofingOrderCode || `LSX #${prod.productionOrderId}`}
        </span>
        {isChecked && (
          <span className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-500 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã KCS
          </span>
        )}
      </TableCell>

      {/* Completed date */}
      <TableCell className="align-top py-3 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        {formatDate(prod.proofingOrderCompletedAt)}
      </TableCell>

      {/* Design type */}
      <TableCell className="align-top py-3 text-xs text-slate-700 dark:text-slate-350">
        {prod.designTypeName || "—"}
      </TableCell>

      {/* Items list / QC details */}
      <TableCell className="align-top py-3 pl-1">
        <div className="flex flex-col gap-3">

          {/* Action Row at top of list */}
          <div className="flex gap-2 justify-between items-center max-w-5xl">
            {isEditing ? (
              <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 p-2 rounded-md w-full max-w-[420px]">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap">
                  Nhập nhanh hàng ra:
                </span>
                <Input
                  type="number"
                  placeholder="Số lượng..."
                  value={quickQty}
                  onChange={(e) => {
                    if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                      setQuickQty(e.target.value);
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-7 text-xs w-28 bg-background border-amber-300 font-bold tabular-nums"
                />
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-[10px] font-bold bg-[#93631F] hover:bg-[#7a521a]"
                  onClick={handleApplyQuickQty}
                >
                  Áp Dụng Tất Cả
                </Button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 font-semibold"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Hủy sửa
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-4 text-xs bg-[#93631F] hover:bg-[#7a521a] text-white font-extrabold shadow-sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1" />
                    )}
                    Lưu Báo Số
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
                  onClick={startEditing}
                >
                  Nhập / Sửa Báo Số KCS
                </Button>
              )}
            </div>
          </div>

          {/* Table list of individual designs */}
          <div className="space-y-2 max-w-5xl">
            {prod.items.map((item, idx) => {
              const itemVals = tempValues[item.productionOrderItemId];
              const existingDefect = defectRecords.find(
                (dr) => dr.designId === item.designId || dr.orderDetailId === item.orderDetailId
              );

              return (
                <KcsItemRow
                  key={item.productionOrderItemId}
                  item={item}
                  prod={prod}
                  idx={idx}
                  isEditing={isEditing}
                  itemVals={itemVals}
                  existingDefect={existingDefect}
                  handleValChange={handleValChange}
                  loadUsersOptions={loadUsersOptions}
                  onOpenPrintLabel={onOpenPrintLabel}
                  onOpenImageViewer={onOpenImageViewer}
                />
              );
            })}
          </div>

          {/* Action Row at bottom of list */}
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 max-w-5xl">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 font-semibold"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Hủy sửa
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 px-4 text-xs bg-[#93631F] hover:bg-[#7a521a] text-white font-extrabold shadow-sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1" />
                  )}
                  Lưu Báo Số
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
                onClick={startEditing}
              >
                Nhập / Sửa Báo Số KCS
              </Button>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
});
