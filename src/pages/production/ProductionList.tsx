import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  useProductionOrders,
  useCreateProductionOrder,
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

import { ProductionListHeader } from "./components/ProductionListHeader";
import { ProductionListFilter } from "./components/ProductionListFilter";
import { ProductionListTable } from "./components/ProductionListTable";
import { CreateProductionDialog } from "./components/CreateProductionDialog";

export default function ProductionListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProofingOrderId, setSelectedProofingOrderId] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState("");
  const [proofingSearchTerm, setProofingSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [debouncedProofingSearch] = useDebounce(proofingSearchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const queryParams = useMemo<ProductionListParams>(() => {
    const params: ProductionListParams = {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
    };
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    if (sortColumn.trim()) {
      params.sortColumn = sortColumn.trim();
      params.sortOrder = sortOrder;
    }
    return params;
  }, [currentPage, itemsPerPage, selectedStatus, sortColumn, sortOrder]);

  const {
    data: productionsResp,
    isLoading,
    error,
  } = useProductionOrders(queryParams);

  // Try to parse with schema, but fallback to raw data if validation fails
  // Similar to plate export issue - API returns 200 but schema validation might fail
  const parseProdResp = safeParseSchema(
    ProductionOrderResponsePaginateSchema,
    productionsResp
  );

  // Memoize productions to prevent dependency warnings
  // Use raw data if schema validation fails (API returned 200 but schema is too strict)
  const productions = useMemo<ProductionOrderResponse[]>(() => {
    if (parseProdResp?.items) {
      return parseProdResp.items;
    }
    // Fallback to raw data if parse failed but we have data
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

  // Auto-adjust currentPage if it exceeds totalPages
  // Only adjust when data is actually loaded (not undefined) to avoid resetting during data fetch
  useEffect(() => {
    if (productionsResp && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [totalPages, currentPage, productionsResp]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [selectedStatus, sortColumn, sortOrder]);

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

  // Filter proofing orders by search term
  const filteredProofingOrders = useMemo(() => {
    if (!debouncedProofingSearch.trim()) {
      return proofingOrders;
    }

    const search = debouncedProofingSearch.toLowerCase().trim();
    return proofingOrders.filter((order) => {
      const codeMatch = order.code?.toLowerCase().includes(search);
      const materialMatch = order.materialType?.name
        ?.toLowerCase()
        .includes(search);
      const creatorMatch = order.createdBy?.fullName
        ?.toLowerCase()
        .includes(search);
      const designMatch = order.proofingOrderDesigns?.some(
        (pod) =>
          pod.design?.designName?.toLowerCase().includes(search) ||
          pod.design?.code?.toLowerCase().includes(search)
      );
      const idMatch = order.id?.toString().includes(search);

      return (
        codeMatch || materialMatch || creatorMatch || designMatch || idMatch
      );
    });
  }, [proofingOrders, debouncedProofingSearch]);

  // Get selected proofing order details
  const selectedProofingOrder = useMemo(() => {
    if (!selectedProofingOrderId) return null;
    return (
      proofingOrders.find((order) => order.id === selectedProofingOrderId) ||
      null
    );
  }, [proofingOrders, selectedProofingOrderId]);

  // Client-side search filter (since API doesn't support search parameter)
  const filteredProductions = useMemo(
    () =>
      productions?.filter((prod: ProductionOrderResponse) => {
        const search = debouncedSearch.toLowerCase().trim();

        const matchSearch =
          search.length === 0 ||
          String(prod.id ?? "")
            .toLowerCase()
            .includes(search) ||
          (prod.productionLeadName ?? "").toLowerCase().includes(search);

        const matchStatus =
          selectedStatus === "all" || prod.status === selectedStatus;

        return matchSearch && matchStatus;
      }),
    [productions, debouncedSearch, selectedStatus]
  );

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

  const handleCreateProduction = async () => {
    if (!selectedProofingOrderId) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng chọn một bình bài để tạo lệnh sản xuất",
      });
      return;
    }

    if (!user?.id) {
      toast.error("Lỗi xác thực", {
        description: "Không thể lấy thông tin người dùng",
      });
      return;
    }

    try {
      await createProduction({
        proofingOrderId: selectedProofingOrderId,
        customSteps: notes ? [notes] : undefined,
      });
      setIsCreateDialogOpen(false);
      setSelectedProofingOrderId(null);
      setNotes("");
      setProofingSearchTerm("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDateTime = (dateStr?: string | null) =>
    dateStr
      ? new Date(dateStr).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

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
    <div className="relative border-2 border-red-500/50 h-full">
      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[9999] font-mono pointer-events-none rounded-bl">
        ProductionList.tsx
      </div>
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-4">
          <ProductionListHeader
            stats={stats}
            onCreateClick={() => setIsCreateDialogOpen(true)}
          />

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
            productions={filteredProductions}
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
          />
        </div>

        <CreateProductionDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setSelectedProofingOrderId(null);
              setNotes("");
              setProofingSearchTerm("");
            }
          }}
          proofingSearchTerm={proofingSearchTerm}
          onProofingSearchChange={setProofingSearchTerm}
          filteredProofingOrders={filteredProofingOrders}
          selectedProofingOrderId={selectedProofingOrderId}
          onSelectProofingOrder={setSelectedProofingOrderId}
          selectedProofingOrder={selectedProofingOrder}
          notes={notes}
          onNotesChange={setNotes}
          isCreating={creating}
          onCreateProduction={handleCreateProduction}
          onFormatDateTime={formatDateTime}
        />
      </div>
    </div>
  );
}
