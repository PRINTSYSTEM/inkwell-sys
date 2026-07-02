import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import {
  useProductionOrders,
  useCreateProductionOrder,
  usePendingMaterialProductionOrders,
} from "@/hooks/use-production";
import { useProofingOrdersForProduction } from "@/hooks/use-proofing-order";
import { useAuth } from "@/hooks/use-auth";
import {
  ProductionOrderResponse,
  ProductionOrderResponsePaginateSchema,
  safeParseSchema,
  type ProductionListParams,
  type ProofingOrderResponse,
} from "@/Schema";
import type { SortOrder } from "@/components/ui/sort-controls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ProductionListHeader } from "./components/ProductionListHeader";
import { ProductionListFilter } from "./components/ProductionListFilter";
import { ProductionListTable } from "./components/ProductionListTable";

import { useListState } from "@/hooks/use-list-state";

export default function ProductionListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [pageInput, setPageInput] = useState<string>("1");
  const [itemsPerPage] = useState(10);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // View tab
  type ProductionTab = "all" | "pending_material" | "in_production" | "pending_qc" | "completed";
  const [viewTab, setViewTab] = useState<ProductionTab>("all");

  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [customDate, setCustomDate] = useState<string>("");

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

  // Compute fromDate/toDate ISO params based on dateFilterType & customDate
  const dateParams = useMemo(() => {
    if (dateFilterType === "all") {
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
    if (dateFilterType === "two_days_ago") {
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 2);
      end.setHours(23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }
    if (dateFilterType === "custom" && customDate) {
      const [year, month, day] = customDate.split("-").map(Number);
      if (year && month && day) {
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        return { fromDate: start.toISOString(), toDate: end.toISOString() };
      }
    }
    return { fromDate: undefined, toDate: undefined };
  }, [dateFilterType, customDate]);

  // Single query to fetch all production list stats in parallel (cached & no refetch on mount)
  const { data: statsData } = useQuery({
    queryKey: ["production-orders", "summary-stats", todayStart, todayEnd, dateParams.fromDate, dateParams.toDate],
    queryFn: async () => {
      const fetchCount = async (tab?: string, fromDate?: string, toDate?: string) => {
        try {
          const res = await apiRequest.get<any>(
            API_SUFFIX.PRODUCTION_ORDERS,
            {
              params: normalizeParams({
                pageNumber: 1,
                pageSize: 1,
                tab,
                fromDate,
                toDate,
              }),
            }
          );
          return res.data?.total ?? 0;
        } catch (e) {
          console.error(`Failed to fetch count for tab: ${tab}`, e);
          return 0;
        }
      };

      const [
        pendingMaterial,
        inProduction,
        inProductionToday,
        pendingQc,
        completed,
        completedToday,
      ] = await Promise.all([
        fetchCount("pending_material", dateParams.fromDate, dateParams.toDate),
        fetchCount("in_production", dateParams.fromDate, dateParams.toDate),
        fetchCount("in_production", todayStart, todayEnd),
        fetchCount("pending_qc", dateParams.fromDate, dateParams.toDate),
        fetchCount("completed", dateParams.fromDate, dateParams.toDate),
        fetchCount("completed", todayStart, todayEnd),
      ]);

      return {
        pendingMaterial,
        inProduction,
        inProductionToday,
        pendingQc,
        completed,
        completedToday,
      };
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
      params.search = debouncedSearch.trim();
    }
    if (dateParams.fromDate) {
      params.fromDate = dateParams.fromDate;
    }
    if (dateParams.toDate) {
      params.toDate = dateParams.toDate;
    }
    return params;
  }, [currentPage, itemsPerPage, selectedStatus, sortColumn, sortOrder, viewTab, debouncedSearch, dateParams]);

  const {
    data: productionsResp,
    isLoading,
    error,
  } = useProductionOrders(queryParams);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, debouncedSearch, dateFilterType, customDate]);

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

  const { mutate: createProduction, isPending: creating } =
    useCreateProductionOrder();

  // Fetch proofing orders waiting for production
  const { data: proofingOrdersResp, isLoading: isLoadingProofingOrders } =
    useProofingOrdersForProduction({
      pageNumber: 1,
      pageSize: 100,
      search: debouncedSearch.trim() || undefined,
    });

  const proofingOrders = useMemo<ProofingOrderResponse[]>(
    () => proofingOrdersResp?.items || [],
    [proofingOrdersResp?.items]
  );

  // Unified List: Merged ProductionOrders and filtered ProofingOrders
  const displayProductions = useMemo<ProductionOrderResponse[]>(() => {
    if (viewTab !== "all") {
      // In specific tabs, we only show productions fetched from the backend (which matches tab condition)
      // and we just filter by search query. No drafts shown.
      return productions.filter((prod: any) => {
        const search = debouncedSearch.toLowerCase().trim();
        const cleanSearch = search.replace(/^bb0*/, "bb");
        const cleanProdCode = (prod.proofingOrderCode || prod.proofingOrder?.code || "").toLowerCase().trim().replace(/^bb0*/, "bb");

        const matchDesign = (prod.proofingOrder?.proofingOrderDesigns || []).some((pod: any) => {
          const dName = (pod.design?.designName || pod.design?.name || "").toLowerCase();
          const dCode = (pod.design?.code || "").toLowerCase();
          return dName.includes(search) || dCode.includes(search);
        });

        return (
          search.length === 0 ||
          String(prod.id ?? "")
            .toLowerCase()
            .includes(search) ||
          (prod.proofingOrder?.code ?? "").toLowerCase().includes(search) ||
          (prod.proofingOrderCode ?? "").toLowerCase().includes(search) ||
          (cleanSearch.startsWith("bb") && cleanProdCode.includes(cleanSearch)) ||
          (prod.productionLeadName ?? "").toLowerCase().includes(search) ||
          matchDesign
        );
      });
    }

    const existingPoIds = new Set(productions.map((p) => p.proofingOrderId));
    const readyProofingAsProds: ProductionOrderResponse[] = proofingOrders
      .filter((po) => !existingPoIds.has(po.id) && (!po.productions || (po.productions as any[]).length === 0))
      .map((po) => ({
        proofingOrderId: po.id,
        proofingOrder: po,
        status: "Draft",
        steps: [],
        createdAt: po.updatedAt || po.createdAt,
      } as unknown as ProductionOrderResponse));

    const merged = [...productions, ...readyProofingAsProds];

    // Apply client-side search/status filter
    return merged.filter((prod: any) => {
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
        selectedStatus === "all" ||
        (prod.id ? prod.status === selectedStatus : selectedStatus === "Draft");

      return matchSearch && matchStatus;
    });
  }, [productions, proofingOrders, debouncedSearch, selectedStatus, viewTab]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPageInput("");
      return;
    }
    const page = parseInt(value, 10);
    if (!isNaN(page)) {
      setPageInput(page.toString());
    }
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleProductionClick = (productionId: number) => {
    navigate(`/productions/${productionId}`);
  };

  const handleStartProduction = async (proofingOrderId: number) => {
    if (!user?.id) {
      toast.error("Lỗi xác thực", {
        description: "Không thể lấy thông tin người dùng",
      });
      return;
    }

    try {
      await createProduction({
        proofingOrderId: proofingOrderId,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

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

          <div className="flex flex-col gap-2 mb-3 shrink-0 bg-muted/20 p-2 rounded-lg border border-border/50">
            {/* ROW 1: Status Tabs + Search & Filters */}
            <div className="flex flex-wrap flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Tabs
                value={viewTab}
                onValueChange={(val) => {
                  setViewTab(val as any);
                  setCurrentPage(1);
                }}
                className="w-fit shrink-0"
              >
                <TabsList className="h-9 p-1">
                  <TabsTrigger value="all" className="h-7 text-xs px-3">
                    Tất cả
                  </TabsTrigger>
                  <TabsTrigger value="pending_material" className="h-7 text-xs px-3 gap-1.5 flex items-center">
                    <span>Chưa xuất vật tư</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all",
                      viewTab === "pending_material" 
                        ? "bg-orange-500 text-white" 
                        : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                    )}>
                      {stats.pendingMaterial}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="in_production" className="h-7 text-xs px-3 gap-1.5 flex items-center">
                    <span>Đang sản xuất</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1",
                      viewTab === "in_production" 
                        ? "bg-blue-500 text-white" 
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    )}>
                      <span>{stats.inProduction}</span>
                      {stats.inProductionToday > 0 && (
                        <span className="text-[8px] font-bold opacity-80">+{stats.inProductionToday}</span>
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending_qc" className="h-7 text-xs px-3 gap-1.5 flex items-center">
                    <span>Chờ kiểm hàng</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all",
                      viewTab === "pending_qc" 
                        ? "bg-amber-500 text-white" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    )}>
                      {stats.pendingQc}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="h-7 text-xs px-3 gap-1.5 flex items-center">
                    <span>Hoàn thành</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1",
                      viewTab === "completed" 
                        ? "bg-emerald-500 text-white" 
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    )}>
                      <span>{stats.completed}</span>
                      {stats.completedToday > 0 && (
                        <span className="text-[8px] font-bold opacity-80">+{stats.completedToday}</span>
                      )}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <ProductionListFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onSortColumnChange={setSortColumn}
                onSortOrderChange={setSortOrder}
                onClearSort={() => {
                  setSortColumn("");
                  setSortOrder("desc");
                }}
              />
            </div>

            {/* ROW 2: Date Filters (Below status tabs) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-background dark:bg-muted/10 p-1 rounded-md border border-border/40 w-fit">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2 select-none">Ngày lên bài:</span>
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
                  setCustomDate("");
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
                  setCustomDate("");
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
                  setCustomDate("");
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
                  setCustomDate(dateOptions.twoDaysAgoValue);
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
                  Chọn ngày...
                </Button>
                {dateFilterType === "custom" && (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="h-7 text-xs bg-background border border-input w-32 py-0 px-2 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <ProductionListTable
            isLoading={isLoading}
            productions={displayProductions}
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
            onStartProduction={handleStartProduction}
          />
        </div>
      </div>
    </div>
  );
}
