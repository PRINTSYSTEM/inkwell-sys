import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Package,
  Eye,
  Hash,
  User,
  Building2,
  Copy,
  Check,
  Ruler,
  ExternalLink,
  LayoutGrid,
  List,
  Tag,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useSearchDies, useRelatedDiesByProofingOrder } from "@/hooks/use-die";
import { formatDieSize } from "@/utils/format-die-size";
import type { DieResponse, DieListParams } from "@/Schema";
import { dieStatusLabels, dieLocationLabels } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

interface DieListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDesignCode?: string;
  initialSize?: string;
  initialCategory?: "box" | "decal";
  initialDesignType?: string;
  onUseDie?: (die: DieResponse) => void;
}

export function DieListDialog({
  open,
  onOpenChange,
  initialDesignCode,
  initialSize,
  initialCategory,
  initialDesignType,
  onUseDie,
}: DieListDialogProps) {
  const navigate = useNavigate();
  const [designCode, setDesignCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [size, setSize] = useState("");
  const [proofingOrderCode, setProofingOrderCode] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card"); // Default: Card view
  const [activeTab, setActiveTab] = useState("list");
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [copiedDieId, setCopiedDieId] = useState<number | null>(null);
  const [copiedProofingOrderCode, setCopiedProofingOrderCode] = useState<string | null>(null);

  const [debouncedDesignCode] = useDebounce(designCode, 300);
  const [debouncedCustomerName] = useDebounce(customerName, 300);
  const [debouncedSize] = useDebounce(size, 300);
  const [debouncedProofingOrderCode] = useDebounce(proofingOrderCode, 300);

  // When dialog opens, prefill search & intelligently detect category filter
  useEffect(() => {
    if (open) {
      if (typeof initialDesignCode === "string") setDesignCode(initialDesignCode);
      if (typeof initialSize === "string") setSize(initialSize);

      // Smart auto-category detection
      if (initialCategory) {
        setCategoryFilter(initialCategory);
      } else if (initialDesignType) {
        const typeLower = initialDesignType.toLowerCase();
        if (
          typeLower.includes("decal") ||
          typeLower.includes("de cal") ||
          typeLower.includes("nhãn") ||
          typeLower.includes("sticker")
        ) {
          setCategoryFilter("decal");
        } else if (
          typeLower.includes("hộp") ||
          typeLower.includes("box") ||
          typeLower.includes("túi")
        ) {
          setCategoryFilter("box");
        } else {
          setCategoryFilter("all");
        }
      } else if (initialDesignCode) {
        const codeLower = initialDesignCode.toLowerCase();
        if (codeLower.includes("decal") || codeLower.includes("de")) {
          setCategoryFilter("decal");
        }
      }
    }
  }, [open, initialDesignCode, initialSize, initialCategory, initialDesignType]);

  // Search dies with design code, size, customer name, and category
  const searchParams = useMemo((): DieListParams | undefined => {
    if (!open) return undefined;

    const params: DieListParams = {
      q: debouncedDesignCode.trim() || "",
      size: debouncedSize.trim() || "",
      customerName: debouncedCustomerName.trim() || "",
      proofingOrderCode: debouncedProofingOrderCode.trim() || "",
      category: categoryFilter === "all" ? undefined : categoryFilter,
      pageSize: 200, // Load up to 200 dies for 20+ cards display
      pageNumber: 1,
    };

    return params;
  }, [open, debouncedDesignCode, debouncedCustomerName, debouncedSize, debouncedProofingOrderCode, categoryFilter]);

  const {
    data: searchData,
    isLoading: isLoadingDies,
    error: searchError,
  } = useSearchDies(searchParams);

  const dies = useMemo(() => searchData?.items || [], [searchData]);
  const totalCount = searchData?.total ?? 0;

  // Get firstProofingOrderId from first die that has it
  const firstProofingOrderId = useMemo(() => {
    const dieWithProofingOrder = dies.find((die) => die.firstProofingOrderId != null);
    return dieWithProofingOrder?.firstProofingOrderId ?? null;
  }, [dies]);

  // Fetch related dies by proofing order
  const {
    data: relatedDies = [],
    isLoading: isLoadingRelatedDies,
    error: relatedDiesError,
  } = useRelatedDiesByProofingOrder(
    firstProofingOrderId,
    { relevance: "size" },
    activeTab === "related" && !!firstProofingOrderId && open
  );

  const handleClearSearch = () => {
    setDesignCode("");
    setCustomerName("");
    setSize("");
    setProofingOrderCode("");
    setCategoryFilter("all");
  };

  // Compact High-Density Card Item (Fits 20 cards on 1 screen)
  const renderDieCard = (die: DieResponse) => {
    const isBox = die.category === "box" || !die.category;
    const firstHistoryItem =
      die.usageHistory?.find(
        (u: { proofingOrderId?: number; proofingOrderCode?: string }) => u.proofingOrderId === die.firstProofingOrderId
      ) || die.usageHistory?.[0];

    const proofingOrderId = die.firstProofingOrderId || firstHistoryItem?.proofingOrderId || null;
    const usageCode =
      firstHistoryItem?.proofingOrderCode || die.firstProofingOrderCode || (proofingOrderId ? `PO-${proofingOrderId}` : null);

    return (
      <div
        key={die.id}
        className="group relative rounded-xl border border-slate-200 bg-white p-2.5 transition-all duration-200 hover:border-primary hover:shadow-md cursor-pointer flex flex-col justify-between"
        onClick={() => {
          if (die.isUsable && onUseDie) {
            onOpenChange(false);
            setTimeout(() => onUseDie(die), 120);
          }
        }}
      >
        <div>
          {/* Top Row: Code + Badges */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono font-bold text-sm text-slate-900 truncate">
                {die.code || `Khuôn #${die.id}`}
              </span>
              {isBox ? (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] px-1.5 py-0 shrink-0 font-medium">
                  Hộp
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-bold shrink-0">
                  Decal
                </Badge>
              )}
            </div>
            {die.isUsable ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                Còn dùng
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                Không dùng
              </span>
            )}
          </div>

          {/* Main Info: Image + Dimensions + Usage Code */}
          <div className="flex items-center gap-2.5 my-1">
            <div
              className="relative w-11 h-11 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (die.imageUrl) {
                  setViewingImageUrl(die.imageUrl);
                  setImageViewerOpen(true);
                }
              }}
            >
              {die.imageUrl ? (
                <img
                  src={die.imageUrl}
                  alt={die.code || `Die ${die.id}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="font-bold text-slate-800 text-xs truncate">
                {formatDieSize(die) || "—"}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {usageCode ? (
                  <span className="inline-flex items-center gap-1">
                    <span>Mã bài:</span>
                    <button
                      type="button"
                      className="font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer inline-flex items-center gap-0.5 bg-emerald-50 hover:bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange(false);
                        const targetId = proofingOrderId || usageCode.replace(/\D/g, "");
                        if (targetId) {
                          navigate(`/proofing/${targetId}`);
                        }
                      }}
                      title={`Chuyển đến bài in ${usageCode}`}
                    >
                      {usageCode}
                      <ExternalLink className="h-2.5 w-2.5 opacity-70 ml-0.5" />
                    </button>
                  </span>
                ) : (
                  die.vendorName ? `NCC: ${die.vendorName}` : "Chưa gắn bài"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        {die.isUsable && onUseDie && (
          <Button
            variant="default"
            size="sm"
            className="w-full h-6 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-none mt-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
              setTimeout(() => onUseDie(die), 120);
            }}
          >
            Sử dụng khuôn
          </Button>
        )}
      </div>
    );
  };

  // Dense Table View Option
  const renderDenseTable = (diesList: DieResponse[]) => (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <Table className="w-full text-xs">
        <TableHeader className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center font-bold text-slate-700">#</TableHead>
            <TableHead className="font-bold text-slate-700">Mã khuôn</TableHead>
            <TableHead className="font-bold text-slate-700">Loại</TableHead>
            <TableHead className="font-bold text-slate-700">Kích thước</TableHead>
            <TableHead className="font-bold text-slate-700">Mã bài gốc / Sử dụng</TableHead>
            <TableHead className="font-bold text-slate-700">NCC / Vị trí</TableHead>
            <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
            <TableHead className="text-right font-bold text-slate-700 min-w-[90px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diesList.map((die, idx) => {
            const isBox = die.category === "box" || !die.category;
            const firstHistoryItem =
              die.usageHistory?.find(
                (u: { proofingOrderId?: number; proofingOrderCode?: string }) => u.proofingOrderId === die.firstProofingOrderId
              ) || die.usageHistory?.[0];

            const proofingOrderId = die.firstProofingOrderId || firstHistoryItem?.proofingOrderId || null;
            const usageCode =
              firstHistoryItem?.proofingOrderCode || die.firstProofingOrderCode || (proofingOrderId ? `PO-${proofingOrderId}` : null);

            return (
              <TableRow
                key={die.id}
                className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer group"
                onClick={() => {
                  if (die.isUsable && onUseDie) {
                    onOpenChange(false);
                    setTimeout(() => onUseDie(die), 120);
                  }
                }}
              >
                <TableCell className="text-center font-mono text-[11px] text-slate-400 py-2">
                  {idx + 1}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    {die.imageUrl ? (
                      <img
                        src={die.imageUrl}
                        alt={die.code || `Die ${die.id}`}
                        className="w-6 h-6 object-cover rounded border border-slate-200 shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingImageUrl(die.imageUrl || null);
                          setImageViewerOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <span className="font-mono font-bold text-slate-900 group-hover:text-primary">
                      {die.code || `Khuôn #${die.id}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {isBox ? (
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] px-1.5 py-0 font-medium">
                      Hộp
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-bold">
                      Decal
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-slate-800 py-2">
                  {formatDieSize(die) || "—"}
                </TableCell>
                <TableCell className="font-mono text-slate-600 py-2">
                  {usageCode ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange(false);
                        const targetId = proofingOrderId || usageCode.replace(/\D/g, "");
                        if (targetId) {
                          navigate(`/proofing/${targetId}`);
                        }
                      }}
                      title={`Chuyển đến bài in ${usageCode}`}
                    >
                      {usageCode}
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </button>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-slate-600 truncate max-w-[140px] py-2">
                  {die.vendorName || (die.location ? dieLocationLabels[die.location] : "Trong kho")}
                </TableCell>
                <TableCell className="py-2">
                  {die.isUsable ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Còn dùng
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Không dùng
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right py-2">
                  {die.isUsable && onUseDie && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange(false);
                        setTimeout(() => onUseDie(die), 120);
                      }}
                    >
                      Sử dụng
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] h-[92vh] flex flex-col p-4 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          {/* Top Ultra-Compact Header & Filter Toolbar */}
          <div className="shrink-0 space-y-2 pb-2.5 border-b border-slate-100">
            {/* Header Line 1: Title + Info + Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Danh sách khuôn bế
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0">
                    {totalCount} khuôn
                  </Badge>
                </h2>
              </div>

              {/* View mode switcher & clear filters */}
              <div className="flex items-center gap-2">
                {(designCode.trim() || customerName.trim() || size.trim() || proofingOrderCode.trim() || categoryFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={handleClearSearch} className="h-7 text-xs text-rose-600 hover:text-rose-700 px-2 font-medium">
                    Xóa bộ lọc
                  </Button>
                )}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                  <Button
                    variant={viewMode === "card" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-xs font-semibold cursor-pointer"
                    onClick={() => setViewMode("card")}
                    title="Chế độ Dạng Thẻ"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                    Thẻ
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-xs font-semibold cursor-pointer"
                    onClick={() => setViewMode("table")}
                    title="Chế độ Bảng Gọn"
                  >
                    <List className="h-3.5 w-3.5 mr-1" />
                    Bảng
                  </Button>
                </div>
              </div>
            </div>

            {/* Header Line 2: Inline Compact Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="w-[140px] shrink-0">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs font-semibold bg-slate-50/80 border-slate-200">
                    <SelectValue placeholder="Phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả loại khuôn</SelectItem>
                    <SelectItem value="box" className="text-xs">Khuôn Hộp (Box)</SelectItem>
                    <SelectItem value="decal" className="text-xs">Khuôn Decal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size Search */}
              <div className="relative w-[140px] shrink-0">
                <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Kích thước..."
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50/80 border-slate-200"
                />
              </div>

              {/* Design Code / Die Code Search */}
              <div className="relative w-[160px] shrink-0">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Mã hàng / Mã khuôn..."
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50/80 border-slate-200"
                />
              </div>

              {/* Proofing Order Code Search */}
              <div className="relative w-[140px] shrink-0">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Mã bình bài..."
                  value={proofingOrderCode}
                  onChange={(e) => setProofingOrderCode(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50/80 border-slate-200"
                />
              </div>

              {/* Customer Name Search */}
              <div className="relative w-[150px] shrink-0">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tên khách hàng..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50/80 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-h-0 flex flex-col pt-2">
            {isLoadingDies ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  Đang tải danh sách khuôn bế...
                </p>
              </div>
            ) : searchError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  Đã xảy ra lỗi khi tải dữ liệu khuôn bế
                </p>
              </div>
            ) : dies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  Không tìm thấy khuôn bế nào
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Không có khuôn bế nào phù hợp với bộ lọc và tiêu chí tìm kiếm của bạn
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
                <TabsList className="shrink-0 mb-2 h-8 w-fit bg-slate-100 p-0.5">
                  <TabsTrigger value="list" className="h-7 text-xs font-semibold px-3">
                    Danh sách khuôn ({dies.length})
                  </TabsTrigger>
                  <TabsTrigger value="related" disabled={!firstProofingOrderId} className="h-7 text-xs font-semibold px-3">
                    Khuôn liên quan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-0 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {viewMode === "card" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                        {dies.map((die: DieResponse) => renderDieCard(die))}
                      </div>
                    ) : (
                      renderDenseTable(dies)
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="related" className="mt-0 flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
                  {isLoadingRelatedDies ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-xs text-slate-600">Đang tải khuôn liên quan...</span>
                    </div>
                  ) : relatedDies.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500">
                      Không tìm thấy khuôn liên quan
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      {viewMode === "card" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                          {relatedDies.map((die: DieResponse) => renderDieCard(die))}
                        </div>
                      ) : (
                        renderDenseTable(relatedDies)
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      {viewingImageUrl && (
        <ImageViewerDialog
          imageUrl={viewingImageUrl}
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) setViewingImageUrl(null);
          }}
        />
      )}
    </>
  );
}
