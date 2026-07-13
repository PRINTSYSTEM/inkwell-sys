import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import {
  useCompletedProofingOrders,
  useUpdateProofingOrderScheduleStatus,
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { formatDate } from "@/lib/status-utils";
import type { ProofingOrderResponse } from "@/Schema/proofing-order.schema";

export default function ProductionDispatch() {
  const getLocalDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>("all");
  const [originStatusFilter, setOriginStatusFilter] = useState<string>("all");
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<string>("all");
  const [fromDate, setFromDate] = useState(getLocalDateString);
  const [toDate, setToDate] = useState(getLocalDateString);
  const [dateFilterMode, setDateFilterMode] = useState<"all" | "today" | "yesterday" | "two_days_ago" | "custom">("today");

  // Dynamic Date Labels
  const todayLabel = useMemo(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `Hôm nay (${dd}/${mm})`;
  }, []);

  const yesterdayLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `Hôm qua (${dd}/${mm})`;
  }, []);

  const twoDaysAgoLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `Ngày ${dd}/${mm}`;
  }, []);

  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTwoDaysAgoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSetDateFilterMode = (mode: "all" | "today" | "yesterday" | "two_days_ago" | "custom") => {
    setDateFilterMode(mode);
    if (mode === "all") {
      setFromDate("");
      setToDate("");
    } else if (mode === "today") {
      const today = getTodayStr();
      setFromDate(today);
      setToDate(today);
    } else if (mode === "yesterday") {
      const yesterday = getYesterdayStr();
      setFromDate(yesterday);
      setToDate(yesterday);
    } else if (mode === "two_days_ago") {
      const twoDaysAgo = getTwoDaysAgoStr();
      setFromDate(twoDaysAgo);
      setToDate(twoDaysAgo);
    }
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setDateFilterMode("custom");
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setDateFilterMode("custom");
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Image viewer state
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Fetch completed proofing orders (load a large enough page size for client side interactivity)
  const { data: proofingData, isLoading, isError, refetch } = useCompletedProofingOrders({
    pageSize: 300,
    pageNumber: 1,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: searchQuery || undefined,
  });

  const { data: designTypesData } = useDesignTypeList({ status: "active" });

  const { mutate: updateScheduleStatus, isPending: isUpdating } = useUpdateProofingOrderScheduleStatus();

  const proofingOrders = useMemo(() => {
    return proofingData?.items || [];
  }, [proofingData]);

  // Design type options helper
  const designTypeOptions = useMemo(() => {
    const items = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData?.items ?? []);
    return items.map((dt: any) => ({
      id: dt.id,
      name: dt.name || "",
    }));
  }, [designTypesData]);

  // Count the occurrences of each design type within current loaded proofingOrders
  const designTypeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    proofingOrders.forEach((po) => {
      const typeIds = new Set<number>();
      (po.proofingOrderDesigns || []).forEach((pod: any) => {
        if (pod.design?.designTypeId) {
          typeIds.add(pod.design.designTypeId);
        }
      });
      typeIds.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [proofingOrders]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, scheduleStatusFilter, originStatusFilter, selectedDesignTypeId, fromDate, toDate]);

  // Statistics calculation based on total loaded data
  const stats = useMemo(() => {
    const items = proofingOrders;
    const total = items.length;
    const notScheduled = items.filter((item) => (item.scheduleStatus || "not_scheduled") === "not_scheduled").length;
    const scheduled = items.filter((item) => item.scheduleStatus === "scheduled").length;
    const changed = items.filter((item) => item.scheduleStatus === "changed").length;

    return { total, notScheduled, scheduled, changed };
  }, [proofingOrders]);

  // Client-side filtering, sorting, and pagination
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...proofingOrders];

    // 1. Search Query filter (Mã bài / Mã hàng / Tên sản phẩm)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((po) => {
        const matchCode = (po.code || "").toLowerCase().includes(q);
        const matchDetails = (po.proofingOrderDesigns || []).some((pod: any) => {
          const matchDesignCode = (pod.design?.code || "").toLowerCase().includes(q);
          const matchDesignName = (pod.design?.designName || "").toLowerCase().includes(q);
          return matchDesignCode || matchDesignName;
        });
        return matchCode || matchDetails;
      });
    }

    // 2. Schedule Status Filter
    if (scheduleStatusFilter !== "all") {
      result = result.filter((po) => {
        const currentStatus = po.scheduleStatus || "not_scheduled";
        return currentStatus === scheduleStatusFilter;
      });
    }

    // 3. Origin Status Filter
    if (originStatusFilter !== "all") {
      result = result.filter((po) => po.status === originStatusFilter);
    }

    // 4. Design Type Filter
    if (selectedDesignTypeId !== "all") {
      const typeIdNum = Number(selectedDesignTypeId);
      result = result.filter((po) => {
        return (po.proofingOrderDesigns || []).some(
          (pod: any) => pod.design?.designTypeId === typeIdNum
        );
      });
    }

    // 5. Date Range Filter (based on completedAt/updatedAt/createdAt)
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((po) => {
        const dateVal = po.completedAt || po.updatedAt || po.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal) >= start;
      });
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((po) => {
        const dateVal = po.completedAt || po.updatedAt || po.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal) <= end;
      });
    }

    // 6. Sort logic:
    // Priority: scheduleStatus === "changed" first, then completedAt descending
    result.sort((a, b) => {
      const statusA = a.scheduleStatus || "not_scheduled";
      const statusB = b.scheduleStatus || "not_scheduled";

      if (statusA === "changed" && statusB !== "changed") return -1;
      if (statusA !== "changed" && statusB === "changed") return 1;

      // Secondary sort: CompletedAt/UpdatedAt/CreatedAt desc
      const dateValA = a.completedAt || a.updatedAt || a.createdAt;
      const dateValB = b.completedAt || b.updatedAt || b.createdAt;
      const dateA = dateValA ? new Date(dateValA).getTime() : 0;
      const dateB = dateValB ? new Date(dateValB).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [proofingOrders, searchQuery, scheduleStatusFilter, originStatusFilter, selectedDesignTypeId, fromDate, toDate]);

  // Paginated List
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage) || 1;

  // Handle status update mutation
  const handleUpdateStatus = (id: number, currentStatus?: string | null) => {
    let nextStatus = "scheduled";
    if (currentStatus === "scheduled") {
      nextStatus = "not_scheduled";
    }
    updateScheduleStatus({ id, scheduleStatus: nextStatus });
  };

  // Helper to format design display names and details
  const getOriginStatusBadge = (status?: string | null) => {
    if (status === "production_returned") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Sản xuất trả về
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        Hoàn thành
      </span>
    );
  };

  const getScheduleStatusBadge = (status?: string | null) => {
    const effectiveStatus = status || "not_scheduled";
    switch (effectiveStatus) {
      case "not_scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800">
            Chưa lên lịch
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
            <Check className="w-3.5 h-3.5" />
            Đã lên lịch
          </span>
        );
      case "changed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Có thay đổi (Cần check)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getProofingThumbnail = (po: ProofingOrderResponse) => {
    // 1. Check images array (contains thumbnails uploaded for proofing order)
    if (po.images && po.images.length > 0) {
      const firstImg = po.images[0];
      const url = firstImg.thumbnailUrl || firstImg.imageUrl;
      if (url) {
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return url.startsWith("http") ? url : `${baseUrl}/${url.startsWith("/") ? url.slice(1) : url}`;
      }
    }

    // 2. Direct thumbnailUrl on proofing order
    if (po.thumbnailUrl) return po.thumbnailUrl;

    // 3. Fallback to design image
    if (po.proofingOrderDesigns && po.proofingOrderDesigns.length > 0) {
      const firstDesign = po.proofingOrderDesigns[0].design as any;
      const designImg = firstDesign?.designImageUrl || firstDesign?.designThumbnailUrl || firstDesign?.imageUrl;
      if (designImg) {
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return designImg.startsWith("http") ? designImg : `${baseUrl}/${designImg.startsWith("/") ? designImg.slice(1) : designImg}`;
      }
    }
    return null;
  };

  const getProofingOriginalUrl = (po: ProofingOrderResponse) => {
    // 1. Check images array
    if (po.images && po.images.length > 0) {
      const firstImg = po.images[0];
      const url = firstImg.imageUrl || firstImg.thumbnailUrl;
      if (url) {
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return url.startsWith("http") ? url : `${baseUrl}/${url.startsWith("/") ? url.slice(1) : url}`;
      }
    }

    // 2. Direct imageUrl on proofing order
    if ((po as any).imageUrl) {
      const url = (po as any).imageUrl;
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
      return url.startsWith("http") ? url : `${baseUrl}/${url.startsWith("/") ? url.slice(1) : url}`;
    }

    // 3. Fallback to design high-res image
    if (po.proofingOrderDesigns && po.proofingOrderDesigns.length > 0) {
      const firstDesign = po.proofingOrderDesigns[0].design as any;
      const designImg = firstDesign?.designImageUrl || firstDesign?.designThumbnailUrl || firstDesign?.imageUrl;
      if (designImg) {
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
        return designImg.startsWith("http") ? designImg : `${baseUrl}/${designImg.startsWith("/") ? designImg.slice(1) : designImg}`;
      }
    }

    // 4. Fallback to thumbnail
    return getProofingThumbnail(po) || "";
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setScheduleStatusFilter("all");
    setOriginStatusFilter("all");
    setSelectedDesignTypeId("all");
    setFromDate("");
    setToDate("");
    setDateFilterMode("all");
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Điều lệnh sản xuất
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 self-start sm:self-auto rounded-lg text-xs font-semibold"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Tải lại danh sách
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tổng bài hoàn thành
              </p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                {stats.total}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Chưa lên lịch
              </p>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                {stats.notScheduled}
              </h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Có thay đổi (Cần check)
              </p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">
                {stats.changed}
              </h3>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertCircle className="h-4 w-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-stone-900">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Đã lên lịch
              </p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.scheduled}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Check className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and search bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-stone-900 rounded-xl overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Quick Date Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 pb-3 border-b border-stone-150/40 dark:border-stone-800/30">
            <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mr-2 w-24">
              Ngày lên bài:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetDateFilterMode("all")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold ${
                  dateFilterMode === "all"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                Tất cả ngày
              </button>
              <button
                type="button"
                onClick={() => handleSetDateFilterMode("today")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold ${
                  dateFilterMode === "today"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                {todayLabel}
              </button>
              <button
                type="button"
                onClick={() => handleSetDateFilterMode("yesterday")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold ${
                  dateFilterMode === "yesterday"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                {yesterdayLabel}
              </button>
              <button
                type="button"
                onClick={() => handleSetDateFilterMode("two_days_ago")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold ${
                  dateFilterMode === "two_days_ago"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                {twoDaysAgoLabel}
              </button>
              <button
                type="button"
                onClick={() => handleSetDateFilterMode("custom")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold ${
                  dateFilterMode === "custom"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                Chọn ngày...
              </button>
            </div>
          </div>

          {/* Quick Design Type Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5 pb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider mr-2 w-24">
              Loại thiết kế:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDesignTypeId("all")}
                className={`text-xs px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                  selectedDesignTypeId === "all"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                }`}
              >
                <span>Tất cả</span>
                <span className={`inline-block text-[9px] px-1 py-0.2 rounded font-bold ${
                  selectedDesignTypeId === "all"
                    ? "bg-emerald-700 text-emerald-100 dark:bg-emerald-400 dark:text-emerald-950"
                    : "bg-stone-200/80 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                }`}>
                  {stats.total}
                </span>
              </button>
              {designTypeOptions.map((option) => {
                const count = designTypeCounts[option.id] || 0;
                const isSelected = selectedDesignTypeId === option.id.toString();
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedDesignTypeId(option.id.toString())}
                    className={`text-xs px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-stone-900 shadow-sm"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-600 dark:text-stone-400 dark:bg-stone-950/20 hover:dark:bg-stone-950/40"
                    }`}
                  >
                    <span>{option.name}</span>
                    <span className={`inline-block text-[9px] px-1 py-0.2 rounded font-bold ${
                      isSelected
                        ? "bg-emerald-700 text-emerald-100 dark:bg-emerald-400 dark:text-emerald-950"
                        : "bg-stone-200/80 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard Input Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-150/40 dark:border-stone-800/30">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Tìm mã bài, mã hàng..."
                className="pl-9 h-9 border-stone-200 focus-visible:ring-primary rounded-lg text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Schedule Status Filter */}
            <div className="w-[130px]">
              <Select value={scheduleStatusFilter} onValueChange={setScheduleStatusFilter}>
                <SelectTrigger className="h-9 border-stone-200 rounded-lg text-xs font-medium bg-background">
                  <SelectValue placeholder="Trạng thái lịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tất cả lịch</SelectItem>
                  <SelectItem value="not_scheduled" className="text-xs">Chưa lên lịch</SelectItem>
                  <SelectItem value="scheduled" className="text-xs">Đã lên lịch</SelectItem>
                  <SelectItem value="changed" className="text-xs text-rose-600 font-semibold">Có thay đổi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Origin Status Filter */}
            <div className="w-[145px]">
              <Select value={originStatusFilter} onValueChange={setOriginStatusFilter}>
                <SelectTrigger className="h-9 border-stone-200 rounded-lg text-xs font-medium bg-background">
                  <SelectValue placeholder="Trạng thái bài" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tất cả trạng thái bài</SelectItem>
                  <SelectItem value="completed" className="text-xs">Hoàn thành</SelectItem>
                  <SelectItem value="production_returned" className="text-xs">Sản xuất trả về</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range inputs group */}
            <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-950/20 px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">Từ</span>
              <Input
                type="date"
                className="h-7 w-[120px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:text-stone-300"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
              />
              <span className="text-stone-300 dark:text-stone-800 text-xs px-1">—</span>
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">Đến</span>
              <Input
                type="date"
                className="h-7 w-[120px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none dark:text-stone-300"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
              />
            </div>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 hover:border-rose-300 dark:border-rose-950/40 dark:hover:bg-rose-950/20 font-semibold rounded-lg"
              onClick={handleResetFilters}
            >
              <X className="h-3.5 w-3.5" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table / Grid */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-stone-900">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-slate-500 animate-pulse">
              Đang tải danh sách điều lệnh...
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-50">Lỗi tải dữ liệu</p>
              <p className="text-sm text-muted-foreground mt-1">Không thể lấy danh sách bài hoàn thành từ server.</p>
            </div>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Clock className="h-10 w-10 text-stone-300 dark:text-stone-700" />
            <div>
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bài bình nào</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Vui lòng điều chỉnh lại bộ lọc tìm kiếm hoặc nhấp đặt lại.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold rounded-lg"
              onClick={handleResetFilters}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-stone-50/75 dark:bg-stone-900/95 border-b border-stone-200 dark:border-stone-800">
                <TableRow className="hover:bg-transparent border-stone-200 dark:border-stone-800">
                  <TableHead className="w-12 pl-6">Hình</TableHead>
                  <TableHead className="w-[140px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Mã bài</TableHead>
                  <TableHead className="font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider">Thông tin hàng</TableHead>
                  <TableHead className="w-[150px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider text-center">Trạng thái bài</TableHead>
                  <TableHead className="w-[150px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider text-center">Trạng thái lịch</TableHead>
                  <TableHead className="w-[180px] font-bold text-stone-600 dark:text-stone-300 text-xs uppercase tracking-wider text-right pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((po) => {
                  const thumbnail = getProofingThumbnail(po);
                  const isChanged = (po.scheduleStatus || "not_scheduled") === "changed";
                  const isScheduled = po.scheduleStatus === "scheduled";

                  return (
                    <TableRow
                      key={po.id}
                      className={`border-stone-100 dark:border-stone-850 hover:bg-stone-50/30 dark:hover:bg-stone-950/20 ${isChanged ? "bg-rose-50/5 dark:bg-rose-950/5" : ""
                        }`}
                    >
                      {/* Image Thumbnail */}
                      <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="h-12 w-12 rounded-lg bg-stone-100 dark:bg-stone-800 border flex items-center justify-center overflow-hidden relative shadow-inner">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={po.code || "Bài bình"}
                              className="h-full w-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                              onClick={() => setViewingImageUrl(getProofingOriginalUrl(po))}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-stone-400" />
                          )}
                        </div>
                      </TableCell>

                      {/* Proofing Order Code & Completed At */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-black text-sm uppercase text-slate-900 dark:text-slate-50">
                            {po.code || `BÀI #${po.id}`}
                          </span>
                          <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {po.completedAt ? formatDate(po.completedAt) : (po.updatedAt ? formatDate(po.updatedAt) : (po.createdAt ? formatDate(po.createdAt) : "—"))}
                          </span>
                        </div>
                      </TableCell>

                      {/* Design Items Info */}
                      <TableCell className="py-4">
                        {po.proofingOrderDesigns && po.proofingOrderDesigns.length > 0 ? (
                          <div className="space-y-2">
                            {po.proofingOrderDesigns.map((pod: any, idx: number) => (
                              <div
                                key={pod.id || idx}
                                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950/40 px-2.5 py-1.5 rounded-lg border border-stone-150/40 dark:border-stone-800/30"
                              >
                                <span className="font-mono font-bold text-stone-900 dark:text-stone-50">
                                  {pod.design?.code || "Mã hàng nháp"}
                                </span>
                                <span className="text-[11px] font-medium text-stone-500 truncate max-w-[180px]" title={pod.design?.designName}>
                                  {pod.design?.designName}
                                </span>
                                <span className="text-[10px] text-stone-400">•</span>
                                <span className="text-[11px] text-stone-500">
                                  {pod.design?.designType?.name}
                                </span>
                                {pod.design?.size && (
                                  <>
                                    <span className="text-[10px] text-stone-400">•</span>
                                    <span className="text-[11px] text-stone-500 font-mono">
                                      {pod.design.size}
                                    </span>
                                  </>
                                )}
                                {pod.design?.materialName && (
                                  <>
                                    <span className="text-[10px] text-stone-400">•</span>
                                    <span className="text-[11px] text-stone-500 truncate max-w-[120px]" title={pod.design.materialName}>
                                      {pod.design.materialName}
                                    </span>
                                  </>
                                )}
                                <span className="text-[10px] text-stone-400">•</span>
                                <span className="text-[11px] font-bold text-primary">
                                  {new Intl.NumberFormat("vi-VN").format(pod.quantity || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Không có thiết kế nào</span>
                        )}
                      </TableCell>

                      {/* Origin status (Completed / Returned) */}
                      <TableCell className="text-center align-middle">
                        {getOriginStatusBadge(po.status)}
                      </TableCell>

                      {/* Schedule Status badge */}
                      <TableCell className="text-center align-middle">
                        {getScheduleStatusBadge(po.scheduleStatus)}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-right pr-6 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {isChanged ? (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-bold gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                              onClick={() => po.id && handleUpdateStatus(po.id, "changed")}
                              disabled={isUpdating}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Xác nhận đã check
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={isScheduled ? "outline" : "default"}
                              className={`h-8 text-xs font-bold gap-1 rounded-lg transition-all ${isScheduled
                                  ? "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/40 dark:text-amber-400 dark:bg-amber-950/20"
                                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                }`}
                              onClick={() => po.id && handleUpdateStatus(po.id, po.scheduleStatus)}
                              disabled={isUpdating}
                            >
                              {isScheduled ? (
                                <>
                                  <Clock className="h-3.5 w-3.5" />
                                  Hủy lịch
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Lên lịch
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && !isError && filteredAndSortedOrders.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex-wrap gap-4">
            <span className="text-sm font-semibold text-slate-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredAndSortedOrders.length)} của{" "}
              {filteredAndSortedOrders.length} bài bình
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-background">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Image Viewer popup zoom */}
      <ImageViewerDialog
        open={!!viewingImageUrl}
        onOpenChange={(open) => !open && setViewingImageUrl(null)}
        imageUrl={viewingImageUrl || ""}
      />
    </div>
  );
}
