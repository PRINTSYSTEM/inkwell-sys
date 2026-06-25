import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Filter dates & View tab
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewTab, setViewTab] = useState<"all" | "pending-material">("all");
  const isPendingMaterialMode = viewTab === "pending-material";

  const queryParams = useMemo<ProductionListParams>(() => {
    const params: ProductionListParams = {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      fromDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      toDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
    };
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    if (sortColumn.trim()) {
      params.sortColumn = sortColumn.trim();
      params.sortOrder = sortOrder;
    }
    return params;
  }, [currentPage, itemsPerPage, selectedStatus, sortColumn, sortOrder, dateRange]);

  const {
    data: allProductionsResp,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useProductionOrders(queryParams);

  const {
    data: pendingMaterialResp,
    isLoading: isLoadingPending,
    error: errorPending,
  } = usePendingMaterialProductionOrders(queryParams);

  const productionsResp = isPendingMaterialMode ? pendingMaterialResp : allProductionsResp;
  const isLoading = isPendingMaterialMode ? isLoadingPending : isLoadingAll;
  const error = isPendingMaterialMode ? errorPending : errorAll;

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
    });

  const proofingOrders = useMemo<ProofingOrderResponse[]>(
    () => proofingOrdersResp?.items || [],
    [proofingOrdersResp?.items]
  );

  // Unified List: Merged ProductionOrders and filtered ProofingOrders
  const displayProductions = useMemo<ProductionOrderResponse[]>(() => {
    if (isPendingMaterialMode) {
      // In pending-material mode, we only show productions fetched from the backend (which are pending material)
      // and we just filter by search query.
      return productions.filter((prod: any) => {
        const search = debouncedSearch.toLowerCase().trim();
        const cleanSearch = search.replace(/^bb0*/, "bb");
        const cleanProdCode = (prod.proofingOrderCode || prod.proofingOrder?.code || "").toLowerCase().trim().replace(/^bb0*/, "bb");

        return (
          search.length === 0 ||
          String(prod.id ?? "")
            .toLowerCase()
            .includes(search) ||
          (prod.proofingOrder?.code ?? "").toLowerCase().includes(search) ||
          (prod.proofingOrderCode ?? "").toLowerCase().includes(search) ||
          cleanProdCode.includes(cleanSearch) ||
          (prod.productionLeadName ?? "").toLowerCase().includes(search)
        );
      });
    }

    const existingPoIds = new Set(productions.map((p) => p.proofingOrderId));
    const readyProofingAsProds: ProductionOrderResponse[] = proofingOrders
      .filter((po) => !existingPoIds.has(po.id))
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

      const matchSearch =
        search.length === 0 ||
        String(prod.id ?? "")
          .toLowerCase()
          .includes(search) ||
        (prod.proofingOrder?.code ?? "").toLowerCase().includes(search) ||
        (prod.proofingOrderCode ?? "").toLowerCase().includes(search) ||
        cleanProdCode.includes(cleanSearch) ||
        (prod.productionLeadName ?? "").toLowerCase().includes(search);

      const matchStatus =
        selectedStatus === "all" ||
        (prod.id ? prod.status === selectedStatus : selectedStatus === "Draft");

      return matchSearch && matchStatus;
    });
  }, [productions, proofingOrders, debouncedSearch, selectedStatus, isPendingMaterialMode]);

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
      total: totalCount,
      pending:
        productions?.filter((p) => p.status === "WaitingForProduction")
          .length || 0,
      inProgress:
        productions?.filter((p) => p.status === "InProduction").length || 0,
      completed:
        productions?.filter((p) => p.status === "Completed").length || 0,
    }),
    [totalCount, productions]
  );

  return (
    <div className="h-full">
      <div className="h-full flex flex-col overflow-hidden bg-background relative">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4">
          <ProductionListHeader
            stats={stats}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
            <Tabs
              value={viewTab}
              onValueChange={(val) => {
                setViewTab(val as "all" | "pending-material");
                setCurrentPage(1);
              }}
              className="w-fit"
            >
              <TabsList className="grid grid-cols-2 w-[360px]">
                <TabsTrigger value="all">Tất cả lệnh sản xuất</TabsTrigger>
                <TabsTrigger value="pending-material">Chưa xuất vật tư</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Khoảng ngày:</span>
              <DateRangePicker
                value={dateRange}
                onValueChange={(val) => {
                  setDateRange(val);
                  setCurrentPage(1);
                }}
                className="w-[280px]"
              />
            </div>
          </div>

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
