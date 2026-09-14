import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import {
  useProductionOrders,
  usePendingMaterialProductionOrders,
  useProductionDesignTypeSummary,
} from "@/hooks/use-production";
import { useDesignTypeList } from "@/hooks/use-design-type";
import {
  ProductionOrderResponse,
  ProductionOrderResponsePaginateSchema,
  safeParseSchema,
  type ProductionListParams,
} from "@/Schema";
import type { SortOrder } from "@/components/ui/sort-controls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

import { ProductionListHeader } from "./components/ProductionListHeader";
import { ProductionListFilter } from "./components/ProductionListFilter";
import { ProductionListTable } from "./components/ProductionListTable";
import { ProductionOrderDetailDrawer } from "./components/ProductionOrderDetailDrawer";
import { ProductionDelayReportModal } from "@/components/production";

import { useListState } from "@/hooks/use-list-state";

export default function ProductionListPage() {
  const navigate = useNavigate();

  const {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm: debouncedSearch,
    statusFilter: selectedStatus,
    setStatusFilter: setSelectedStatus,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
  } = useListState();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDelayReportModalOpen, setIsDelayReportModalOpen] = useState(false);
  const [pageInput, setPageInput] = useState<string>("1");
  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [customFromDate, setCustomFromDate] = useState<string>("");
  const [customToDate, setCustomToDate] = useState<string>("");
  const itemsPerPage = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // View tab
  type ProductionTab = "all" | "active" | "pending_material" | "in_production" | "pending_qc" | "completed" | "overdue";
  const [viewTab, setViewTab] = useState<ProductionTab>("active");
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<ProductionOrderResponse | null>(null);

  // Design Type Filter State & Data Fetching
  const [selectedDesignTypeId, setSelectedDesignTypeId] = useState<number | null>(null);
  const { data: designTypesData } = useDesignTypeList({ status: "active" });
  const designTypes = useMemo(() => {
    return Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData as any)?.items || [];
  }, [designTypesData]);

  // Reset selectedDesignTypeId when date filter, view tab, or status changes
  useEffect(() => {
    setSelectedDesignTypeId(null);
  }, [dateFilterType, viewTab, selectedStatus]);

  // Stats queries (All-time & Today)
  const todayStart = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate()).toISOString();
  }, []);

  const todayEnd = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999).toISOString();
  }, []);

  // Pre-calculate date options for UI
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
      twoDaysAgoValue: `${twoDaysAgo.getFullYear()}-${pad(twoDaysAgo.getMonth() + 1)}-${pad(twoDaysAgo.getDate())}`
    };
  }, []);

  // Compute fromDate/toDate ISO params based on dateFilterType & customFromDate/customToDate
  const dateParams = useMemo(() => {
    if (dateFilterType === "all" && !customFromDate) {
      return { fromDate: undefined, toDate: undefined };
    }
    if (dateFilterType === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "yesterday") {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "7-days" || dateFilterType === "week") {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "month") {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "last_month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "custom" || customFromDate) {
      let fromDate: string | undefined = undefined;
      let toDate: string | undefined = undefined;
      
      if (customFromDate) {
        const [year, month, day] = customFromDate.split("-").map(Number);
        if (year && month && day) {
          const start = new Date(year, month - 1, day, 0, 0, 0, 0);
          fromDate = start.toISOString();
        }
      }
      
      if (customToDate) {
        const [year, month, day] = customToDate.split("-").map(Number);
        if (year && month && day) {
          const end = new Date(year, month - 1, day, 23, 59, 59, 999);
          toDate = end.toISOString();
        }
      } else if (customFromDate) {
        // If only start date is selected, filter range is that single day
        const [year, month, day] = customFromDate.split("-").map(Number);
        if (year && month && day) {
          const end = new Date(year, month - 1, day, 23, 59, 59, 999);
          toDate = end.toISOString();
        }
      }
      
      return { fromDate, toDate };
    }
    return { fromDate: undefined, toDate: undefined };
  }, [dateFilterType, customFromDate, customToDate]);

  // Fetch summary stats using a single optimized endpoint
  const { data: statsData } = useQuery({
    queryKey: ["production-orders", "summary-stats", todayStart, todayEnd, dateParams.fromDate, dateParams.toDate],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<any>(
          `${API_SUFFIX.PRODUCTION_ORDERS}/summary-stats`,
          {
            params: normalizeParams({
              fromDate: dateParams.fromDate,
              toDate: dateParams.toDate,
              todayStart,
              todayEnd,
            }),
          }
        );
        return {
          pendingMaterial: res.data?.pendingMaterial ?? 0,
          inProduction: res.data?.inProduction ?? 0,
          inProductionToday: res.data?.inProductionToday ?? 0,
          pendingQc: res.data?.pendingQc ?? 0,
          completed: res.data?.completed ?? 0,
          completedToday: res.data?.completedToday ?? 0,
        };
      } catch (e) {
        console.error("Failed to fetch summary stats", e);
        return {
          pendingMaterial: 0,
          inProduction: 0,
          inProductionToday: 0,
          pendingQc: 0,
          completed: 0,
          completedToday: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnMount: false, // do not refetch when returning to page
    refetchOnWindowFocus: false, // do not refetch on focus
  });

  const queryParams = useMemo<ProductionListParams>(() => {
    const params: ProductionListParams = {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
    };
    if (viewTab !== "all") {
      params.tab = viewTab;
    }
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    if (sortColumn.trim()) {
      params.sortColumn = sortColumn.trim();
      params.sortOrder = sortOrder;
    }
    if (debouncedSearch.trim()) {
      const isPrepressCode = /^\s*[a-zA-Z]*\d+\s*$/.test(debouncedSearch);
      if (isPrepressCode) {
        (params as any).proofingOrderCode = debouncedSearch.trim();
      } else {
        params.search = debouncedSearch.trim();
      }
    }
    if (selectedDesignTypeId !== null) {
      params.designTypeId = selectedDesignTypeId;
    }
    if (dateParams.fromDate) {
      params.fromDate = dateParams.fromDate;
    }
    if (dateParams.toDate) {
      params.toDate = dateParams.toDate;
    }
    return params;
  }, [currentPage, itemsPerPage, selectedStatus, selectedDesignTypeId, sortColumn, sortOrder, viewTab, debouncedSearch, dateParams]);

  const { data: designTypeSummaryData } = useProductionDesignTypeSummary({
    search: debouncedSearch.trim() || undefined,
    fromDate: dateParams.fromDate,
    toDate: dateParams.toDate,
    tab: viewTab !== "all" ? viewTab : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });

  const {
    data: productionsResp,
    isLoading,
    error,
  } = useProductionOrders(queryParams);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, debouncedSearch, dateFilterType, customFromDate, customToDate]);

  // Try to parse with schema, but fallback to raw data if validation fails
  const parseProdResp = safeParseSchema(
    ProductionOrderResponsePaginateSchema,
    productionsResp
  );

  // Memoize productions to prevent dependency warnings
  const productions = useMemo<ProductionOrderResponse[]>(() => {
    if (parseProdResp?.items) {
      return parseProdResp.items;
    }
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "items" in productionsResp
    ) {
      const rawItems = (productionsResp as { items?: unknown[] }).items;
      if (Array.isArray(rawItems)) {
        console.warn(
          "Schema validation failed for productions response, using raw data:",
          productionsResp
        );
        return rawItems as ProductionOrderResponse[];
      }
    }
    return [];
  }, [parseProdResp?.items, productionsResp]);

  // Get total count and total pages from API response
  const totalCount = useMemo(() => {
    if (parseProdResp?.total !== undefined) {
      return parseProdResp.total;
    }
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "total" in productionsResp
    ) {
      return (productionsResp as { total?: number }).total ?? 0;
    }
    return productions.length;
  }, [parseProdResp?.total, productionsResp, productions.length]);

  const totalPages = useMemo(() => {
    if (parseProdResp?.totalPages !== undefined) {
      return parseProdResp.totalPages;
    }
    if (
      productionsResp &&
      typeof productionsResp === "object" &&
      "totalPages" in productionsResp
    ) {
      return (productionsResp as { totalPages?: number }).totalPages ?? 1;
    }
    return Math.ceil(totalCount / itemsPerPage);
  }, [parseProdResp?.totalPages, productionsResp, totalCount, itemsPerPage]);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Scroll to top of table when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Unified List: ProductionOrders filtered by search/status
  const displayProductions = useMemo<ProductionOrderResponse[]>(() => {
    return productions.filter((prod: any) => {
      const search = debouncedSearch.toLowerCase().trim();
      const cleanSearch = search.replace(/^bb0*/, "bb");
      const cleanProdCode = (prod.proofingOrderCode || prod.proofingOrder?.code || "").toLowerCase().trim().replace(/^bb0*/, "bb");

      const matchDesign = (prod.proofingOrder?.proofingOrderDesigns || []).some((pod: any) => {
        const dName = (pod.design?.designName || pod.design?.name || "").toLowerCase();
        const dCode = (pod.design?.code || "").toLowerCase();
        return dName.includes(search) || dCode.includes(search);
      });

      const matchSearch =
        search.length === 0 ||
        String(prod.id ?? "")
          .toLowerCase()
          .includes(search) ||
        (prod.proofingOrder?.code ?? "").toLowerCase().includes(search) ||
        (prod.proofingOrderCode ?? "").toLowerCase().includes(search) ||
        (cleanSearch.startsWith("bb") && cleanProdCode.includes(cleanSearch)) ||
        (prod.productionLeadName ?? "").toLowerCase().includes(search) ||
        matchDesign;

      const matchStatus =
        selectedStatus === "all" || prod.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [productions, debouncedSearch, selectedStatus, viewTab]);

  // Helper to extract design type ID from a display production order
  const getProdDesignTypeId = (prod: any) => {
    if (prod.designTypeId) return prod.designTypeId;
    if (prod.designType?.id) return prod.designType.id;
    
    // Fallback to nested proofingOrder
    const proofing = prod.proofingOrder;
    if (proofing?.designTypeId) return proofing.designTypeId;
    if (proofing?.designType?.id) return proofing.designType.id;
    
    // Fallback to designs in proofingOrder
    const designs = proofing?.proofingOrderDesigns || [];
    if (designs.length > 0) {
      const typeId = designs[0]?.design?.designType?.id || designs[0]?.design?.designTypeId;
      if (typeId) return typeId;
    }

    return null;
  };

  // Compute design type counts based on displayProductions *before* design type filtering
  const designTypeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    displayProductions.forEach((prod) => {
      const typeId = getProdDesignTypeId(prod);
      if (typeId) {
        counts[typeId] = (counts[typeId] || 0) + 1;
      }
    });
    return counts;
  }, [displayProductions]);

  // Finally filtered list to render in the table
  const finalDisplayProductions = useMemo(() => {
    if (selectedDesignTypeId === null) return displayProductions;
    return displayProductions.filter((prod) => {
      const typeId = getProdDesignTypeId(prod);
      return typeId === selectedDesignTypeId;
    });
  }, [displayProductions, selectedDesignTypeId]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  }, []);

  const handlePageInputBlur = useCallback(() => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  }, [pageInput, totalPages, currentPage]);

  const handleProductionClick = useCallback((productionId: number) => {
    navigate(`/production/${productionId}`);
  }, [navigate]);

  const stats = useMemo(
    () => ({
      pendingMaterial: statsData?.pendingMaterial ?? 0,
      inProduction: statsData?.inProduction ?? 0,
      inProductionToday: statsData?.inProductionToday ?? 0,
      pendingQc: statsData?.pendingQc ?? 0,
      completed: statsData?.completed ?? 0,
      completedToday: statsData?.completedToday ?? 0,
    }),
    [statsData]
  );

  return (
    <div className="h-full">
      <div className="h-full flex flex-col overflow-hidden bg-background relative">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3 pb-3 pt-0">
          <ProductionListHeader stats={stats} />

          <div className="flex flex-col gap-2 mb-2 shrink-0 bg-card p-2 rounded-xl border shadow-2xs">
            {/* ROW 1: 2 Main Tabs ("Chưa hoàn thành" & "Hoàn thành") + Search & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <Tabs
                value={viewTab === "completed" ? "completed" : viewTab === "all" ? "all" : "active"}
                onValueChange={(val) => {
                  setViewTab(val as any);
                  setCurrentPage(1);
                }}
                className="w-full lg:w-auto shrink-0"
              >
                <TabsList className="h-9 p-1 bg-muted/60">
                  <TabsTrigger value="active" className="h-7 text-xs font-bold px-3.5 gap-1.5 flex items-center cursor-pointer">
                    <span>Chưa hoàn thành</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10.5px] font-black transition-all",
                      viewTab !== "completed" && viewTab !== "all"
                        ? "bg-amber-500 text-white" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    )}>
                      {stats.pendingMaterial + stats.inProduction + stats.pendingQc}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="completed" className="h-7 text-xs font-bold px-3.5 gap-1.5 flex items-center cursor-pointer">
                    <span>Hoàn thành</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10.5px] font-black transition-all flex items-center gap-1",
                      viewTab === "completed" 
                        ? "bg-emerald-600 text-white" 
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    )}>
                      <span>{stats.completed}</span>
                      {stats.completedToday > 0 && (
                        <span className="text-[8.5px] font-bold opacity-90">+{stats.completedToday}</span>
                      )}
                    </span>
                  </TabsTrigger>

                  <TabsTrigger value="all" className="h-7 text-xs font-medium px-2.5 text-slate-500 hover:text-slate-900 cursor-pointer">
                    Tất cả ({stats.pendingMaterial + stats.inProduction + stats.pendingQc + stats.completed})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <ProductionListFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                dateFilterType={dateFilterType}
                onDateFilterTypeChange={setDateFilterType}
                customFromDate={customFromDate}
                onCustomFromDateChange={setCustomFromDate}
                customToDate={customToDate}
                onCustomToDateChange={setCustomToDate}
                selectedDesignTypeId={selectedDesignTypeId}
                designTypes={designTypes}
                onDesignTypeChange={(val) => {
                  if (val === "all" || !val) {
                    setSelectedDesignTypeId(null);
                    return;
                  }
                  const num = Number(val);
                  if (!isNaN(num)) {
                    setSelectedDesignTypeId(num);
                  } else {
                    const matched = designTypes.find((dt: any) => dt.code?.toUpperCase() === val.toUpperCase());
                    if (matched?.id) {
                      setSelectedDesignTypeId(matched.id);
                    } else {
                      setSelectedDesignTypeId(val as any);
                    }
                  }
                }}
                onResetFilters={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
                  setDateFilterType("all");
                  setSelectedDesignTypeId(null);
                  setCustomFromDate("");
                  setCustomToDate("");
                }}
                onOpenDelayReport={() => setIsDelayReportModalOpen(true)}
              />
            </div>

            {/* ROW 2: Ultra-compact Date & Design Type Sub-Pills */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t text-xs">
              {/* Quick Date Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1 select-none">Ngày:</span>
                <Button
                  variant={dateFilterType === "all" && !customFromDate ? "default" : "ghost"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0",
                    dateFilterType === "all" && !customFromDate ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => { setDateFilterType("all"); setCustomFromDate(""); setCustomToDate(""); }}
                >
                  Tất cả
                </Button>
                <Button
                  variant={dateFilterType === "today" && !customFromDate ? "default" : "ghost"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0",
                    dateFilterType === "today" && !customFromDate ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => { setDateFilterType("today"); setCustomFromDate(""); setCustomToDate(""); }}
                >
                  {dateOptions.todayLabel}
                </Button>
                <Button
                  variant={dateFilterType === "yesterday" && !customFromDate ? "default" : "ghost"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0",
                    dateFilterType === "yesterday" && !customFromDate ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => { setDateFilterType("yesterday"); setCustomFromDate(""); setCustomToDate(""); }}
                >
                  {dateOptions.yesterdayLabel}
                </Button>

                {customFromDate && (
                  <Button
                    variant="default"
                    size="sm"
                    type="button"
                    className="h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs"
                    onClick={() => { setCustomFromDate(""); setCustomToDate(""); setDateFilterType("all"); }}
                    title="Xóa lọc ngày tùy chọn"
                  >
                    <span>
                      📅 {customFromDate && customToDate && customFromDate !== customToDate
                        ? `${customFromDate.split("-").reverse().join("/")} - ${customToDate.split("-").reverse().join("/")}`
                        : `Ngày ${customFromDate.split("-").reverse().join("/")}`}
                    </span>
                    <X className="w-3 h-3 text-white opacity-80 hover:opacity-100" />
                  </Button>
                )}
              </div>

              {/* Quick Design Type Summary Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1 select-none">Loại:</span>
                <Button
                  variant={selectedDesignTypeId === null ? "default" : "ghost"}
                  size="sm"
                  type="button"
                  className={cn(
                    "h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0",
                    selectedDesignTypeId === null ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => setSelectedDesignTypeId(null)}
                >
                  Tất cả ({designTypeSummaryData?.total ?? totalCount})
                </Button>
                {(designTypeSummaryData?.designTypes || []).slice(0, 6).map((dt) => (
                  <Button
                    key={dt.designTypeId}
                    variant={selectedDesignTypeId === dt.designTypeId ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    className={cn(
                      "h-6 text-[11px] px-2 rounded font-medium transition-all shrink-0 flex items-center gap-1",
                      selectedDesignTypeId === dt.designTypeId ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
                    )}
                    onClick={() => setSelectedDesignTypeId(dt.designTypeId)}
                  >
                    <span>{dt.name}</span>
                    <span className="text-[9px] opacity-75">({dt.count})</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <ProductionListTable
            isLoading={isLoading}
            productions={finalDisplayProductions}
            searchTerm={searchTerm}
            totalCount={totalCount}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            pageInput={pageInput}
            tableContainerRef={tableContainerRef}
            onProductionClick={handleProductionClick}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
            onPageInputChange={handlePageInputChange}
            onPageInputBlur={handlePageInputBlur}
            onSelectOrder={(order) => setSelectedDrawerOrder(order)}
          />
        </div>
      </div>

      <ProductionDelayReportModal
        open={isDelayReportModalOpen}
        onOpenChange={setIsDelayReportModalOpen}
      />

      <ProductionOrderDetailDrawer
        order={selectedDrawerOrder}
        isOpen={!!selectedDrawerOrder}
        onClose={() => setSelectedDrawerOrder(null)}
      />
    </div>
  );
}
