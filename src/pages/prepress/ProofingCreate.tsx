import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { DesignItem } from "@/types/proofing";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { DesignTable } from "@/components/proofing/DesignTable";
import { DesignCardSkeleton } from "@/components/proofing/DesignCardSkeleton";
import { FilterSection } from "@/components/proofing/FilterSection";
import { FilterNoticeBanner } from "@/components/proofing/FilterNoticeBanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderTree,
  FileText,
  Loader2,
  Hash,
  Maximize2,
  MessageSquare,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useAvailableOrderDetailsForProofing,
  usePaperSizes,
  useCreateProofingOrder,
  useAddDesignsToProofingOrder,
  useCreatePaperSize,
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { ROUTE_PATHS } from "@/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import {
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";

export default function ProofingOrderPage() {
  const navigate = useNavigate();

  // Selection state (left list)
  const {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection,
    clearSelection,
    isSelected,
    canSelect,
  } = useProofingSelection();

  // Filter states
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

  // View states
  const [groupByOrder, setGroupByOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState<string>("");
  const itemsPerPage = 10;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Inline proofing order configuration state (right panel)
  const [notes, setNotes] = useState("");
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState<number>(1);
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [paperSizeId, setPaperSizeId] = useState<string>("none");
  const [customPaperSize, setCustomPaperSize] = useState("");

  // API call with smart filtering
  const { data, isLoading } = useAvailableOrderDetailsForProofing({
    materialTypeId: currentMaterialTypeId,
  });

  // Fetch design types
  const { data: designTypesData } = useDesignTypeList({
    status: "active",
  });

  // Paper sizes + create hooks
  const { data: paperSizes } = usePaperSizes();
  const {
    mutateAsync: createProofingOrder,
    isPending: isCreatingProofingOrder,
  } = useCreateProofingOrder();
  const { mutateAsync: addDesignsToProofingOrder, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const { mutate: createPaperSize, loading: isCreatingPaperSize } =
    useCreatePaperSize();

  const isCreating = isCreatingProofingOrder || isAddingDesigns;

  // Debug: Log when materialTypeId changes
  useEffect(() => {
    console.log("🎯 ProofingCreate - Material Type Changed:", {
      currentMaterialTypeId,
      selectedDesignsCount: selectedDesigns.length,
    });
  }, [currentMaterialTypeId, selectedDesigns.length]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [
    currentMaterialTypeId,
    selectedDesignTypes,
    selectedMaterialTypes,
    searchTerm,
  ]);

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

  // Sync default quantities when selection changes (default = lấy hết)
  useEffect(() => {
    setDesignQuantities((prev) => {
      const next: Record<number, number> = {};

      selectedDesigns.forEach((design) => {
        const existing = prev[design.id];
        if (existing != null) {
          next[design.id] = existing;
        } else {
          const baseAvailableQty =
            design.availableQuantity !== undefined &&
            design.availableQuantity >= 0
              ? design.availableQuantity
              : design.quantity;
          next[design.id] = baseAvailableQty;
        }
      });

      return next;
    });
  }, [selectedDesigns]);

  // Get current material type name for banner
  const currentMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !data) return "";
    const material = data.materialTypeOptions.find(
      (m) => m.id === currentMaterialTypeId
    );
    return material?.name || "";
  }, [currentMaterialTypeId, data]);

  const materialTypeName =
    selectedDesigns.length > 0 ? selectedDesigns[0].materialTypeName : "";

  // Transform design types to FilterOption format with count
  const designTypeOptions = useMemo(() => {
    if (!designTypesData || !data?.designs) return [];

    const designTypeItems = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData.items ?? []);

    // Count designs by designTypeId
    const countMap = new Map<number, number>();
    data.designs.forEach((design) => {
      const count = countMap.get(design.designTypeId) || 0;
      countMap.set(design.designTypeId, count + 1);
    });

    return designTypeItems.map((dt) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));
  }, [designTypesData, data?.designs]);

  // Apply client-side filters (left list)
  const filteredAndSortedDesigns = useMemo(() => {
    if (!data) {
      console.log("⚠️ ProofingCreate - No data available");
      return [];
    }

    if (!data.designs) {
      console.warn("⚠️ ProofingCreate - data.designs is undefined:", data);
      return [];
    }

    let result = [...data.designs];

    // Filter by design type
    if (selectedDesignTypes.length > 0) {
      result = result.filter((d) =>
        selectedDesignTypes.includes(d.designTypeId)
      );
    }

    // Filter by material type (only when no design is selected)
    if (!currentMaterialTypeId && selectedMaterialTypes.length > 0) {
      result = result.filter((d) =>
        selectedMaterialTypes.includes(d.materialTypeId)
      );
    }

    // Filter by search term (code)
    if (searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim().toLowerCase();
      result = result.filter((d) => d.code.toLowerCase().includes(searchLower));
    }

    return result;
  }, [
    data,
    selectedDesignTypes,
    selectedMaterialTypes,
    currentMaterialTypeId,
    searchTerm,
  ]);

  // Group by order if enabled
  const groupedByOrder = useMemo(() => {
    if (!groupByOrder) return null;

    const groups = new Map<string, DesignItem[]>();
    filteredAndSortedDesigns.forEach((design) => {
      const key = design.orderCode || design.orderId || "unknown";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(design);
    });

    return Array.from(groups.entries()).map(([orderCode, designs]) => ({
      orderCode,
      customerName: designs[0]?.customerName || "",
      customerCompanyName: designs[0]?.customerCompanyName || "",
      designs,
    }));
  }, [filteredAndSortedDesigns, groupByOrder]);

  // Pagination for left list
  const totalCount = filteredAndSortedDesigns.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedDesigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDesigns.slice(start, start + itemsPerPage);
  }, [filteredAndSortedDesigns, currentPage, itemsPerPage]);

  // Auto-adjust currentPage if it exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
      setPageInput("1");
    }
  }, [totalPages, currentPage]);

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

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    clearSelection();
    setDesignQuantities({});
  };

  // ===== Inline proofing order logic (right panel) =====
  const handleQuantityChange = (
    id: number,
    value: string,
    maxQty: number,
    availableQty?: number
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      const maxAvailable =
        availableQty !== undefined && availableQty >= 0 ? availableQty : maxQty;
      const clampedValue = Math.min(Math.max(0, numValue), maxAvailable);
      setDesignQuantities((prev) => ({
        ...prev,
        [id]: clampedValue,
      }));
    }
  };

  const totalSelectedQuantity = useMemo(() => {
    return Object.values(designQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [designQuantities]);

  const hasValidQuantities = useMemo(() => {
    return selectedDesigns.some((design) => {
      const qty = designQuantities[design.id] || 0;
      return qty > 0;
    });
  }, [selectedDesigns, designQuantities]);

  const selectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  // Parse custom paper size input (format: "31×43" or "31x43" or "31 × 43")
  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
    // Match patterns like "31×43", "31x43", "31 × 43", "31 x 43"
    const match = trimmed.match(/^(\d+)\s*[×xX]\s*(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }, [customPaperSize, paperSizeId]);

  // Check if custom paper size already exists in list
  const existingPaperSize = useMemo(() => {
    if (!parsedCustomPaperSize || !paperSizes) return null;
    return paperSizes.find(
      (ps) =>
        ps.width === parsedCustomPaperSize.width &&
        ps.height === parsedCustomPaperSize.height
    );
  }, [parsedCustomPaperSize, paperSizes]);

  // Show create button if custom input is valid and doesn't exist
  const showCreateButton =
    paperSizeId === "custom" &&
    parsedCustomPaperSize !== null &&
    existingPaperSize === null;

  // Handle create new paper size
  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) return;
    try {
      const newPaperSize = await createPaperSize({
        name: `${parsedCustomPaperSize.width}×${parsedCustomPaperSize.height}`,
        width: parsedCustomPaperSize.width,
        height: parsedCustomPaperSize.height,
        isCustom: true,
      });
      // Select the newly created paper size
      if (newPaperSize?.id) {
        setPaperSizeId(newPaperSize.id.toString());
        setCustomPaperSize("");
      }
    } catch (error) {
      // Error is handled by the hook
      console.error("Failed to create paper size:", error);
    }
  };

  const handleSubmitProofingOrder = async () => {
    try {
      if (
        !proofingSheetQuantity ||
        proofingSheetQuantity < 1 ||
        !Number.isInteger(proofingSheetQuantity) ||
        proofingSheetQuantity > 2147483647
      ) {
        toast.error("Lỗi", {
          description:
            "Số lượng giấy in phải là số nguyên từ 1 đến 2,147,483,647",
        });
        return;
      }

      const invalidDesigns = selectedDesigns.filter((design) => {
        const qty = designQuantities[design.id] || 0;
        if (qty <= 0) return false;
        const maxAllowedQty =
          design.availableQuantity !== undefined &&
          design.availableQuantity >= 0
            ? design.availableQuantity
            : design.quantity;
        return qty > maxAllowedQty;
      });

      if (invalidDesigns.length > 0) {
        toast.error("Lỗi", {
          description:
            "Số lượng lấy vượt quá số lượng còn lại chưa bình bài. Vui lòng kiểm tra lại.",
        });
        return;
      }

      // Validate that we have at least one design with quantity > 0
      const hasValidQuantities = selectedDesigns.some((design) => {
        const qty = designQuantities[design.id] || 0;
        return qty > 0;
      });

      if (!hasValidQuantities) {
        toast.error("Lỗi", {
          description:
            "Vui lòng nhập số lượng lấy cho ít nhất một thiết kế (lớn hơn 0)",
        });
        return;
      }

      // Validate materialTypeId
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn thiết kế để tạo bình bài",
        });
        return;
      }

      // Step 1: Create proofing order first (without designs)
      // Try to create with minimal payload (API might require some fields)
      const createPayload: any = {
        totalQuantity: proofingSheetQuantity,
        notes: notes?.trim() || null,
        paperSizeId:
          paperSizeId === "none" || paperSizeId === "custom"
            ? null
            : Number(paperSizeId),
        customPaperSize:
          paperSizeId === "custom" && customPaperSize?.trim()
            ? customPaperSize.trim()
            : null,
      };

      // Create proofing order
      const createResult = await createProofingOrder(createPayload);

      if (!createResult?.id) {
        throw new Error("Không thể lấy ID của bình bài");
      }

      const proofingOrderId = createResult.id;

      // Step 2: Add designs to the proofing order
      // Map orderDetailItems to designIds
      const designIds = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, _]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          return design?.designId;
        })
        .filter((id): id is number => id !== undefined);

      if (designIds.length === 0) {
        toast.error("Lỗi", {
          description: "Không tìm thấy design IDs để thêm vào bình bài",
        });
        return;
      }

      const addDesignsPayload = {
        materialTypeId: currentMaterialTypeId,
        designIds: designIds,
        totalQuantity: proofingSheetQuantity,
        paperSizeId:
          paperSizeId === "none" || paperSizeId === "custom"
            ? null
            : Number(paperSizeId),
        customPaperSize:
          paperSizeId === "custom" && customPaperSize?.trim()
            ? customPaperSize.trim()
            : null,
        notes: notes?.trim() || null,
      };

      // Add designs to proofing order
      await addDesignsToProofingOrder({
        id: proofingOrderId,
        request: addDesignsPayload,
      });

      // On success: reset and navigate to detail page
      clearSelection();
      setDesignQuantities({});
      setNotes("");
      setProofingSheetQuantity(1);
      setPaperSizeId("none");
      setCustomPaperSize("");

      navigate(`${ROUTE_PATHS.PROOFING.ROOT}/${proofingOrderId}`);
    } catch (error) {
      console.error("Failed to create proofing order:", error);
      // Error is already handled by the hooks via toast
    }
  };

  const remainingQuantity = useMemo(() => {
    return selectedDesigns.reduce((total, design) => {
      const currentQty = designQuantities[design.id] || 0;
      const baseAvailableQty =
        design.availableQuantity !== undefined && design.availableQuantity >= 0
          ? design.availableQuantity
          : design.quantity;
      return total + (baseAvailableQty - currentQty);
    }, 0);
  }, [selectedDesigns, designQuantities]);

  return (
    <div className="h-full w-full max-w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Tạo bài</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Tổng cộng {data?.totalCount || 0} thiết kế •{" "}
              {selectedDesigns.length} đã chọn
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedDesigns.length > 0 && (
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-semibold"
              >
                {selectedDesigns.length} thiết kế đã chọn
              </Badge>
            )}

            {/* Toggle View */}
            {/* View mode removed: always use table view */}

            {/* Group by Order Toggle */}
            <Button
              variant={groupByOrder ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByOrder(!groupByOrder)}
              className="gap-2 h-8"
            >
              <FolderTree className="h-4 w-4" />
              <span className="hidden md:inline">
                {groupByOrder ? "Bỏ nhóm" : "Nhóm theo đơn"}
              </span>
            </Button>

            {/* Create Proofing Order Button (global CTA) */}
            <Button
              onClick={handleSubmitProofingOrder}
              disabled={
                selectedDesigns.length === 0 ||
                !hasValidQuantities ||
                proofingSheetQuantity < 1 ||
                isCreating
              }
              className="gap-2 h-9 min-w-[160px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Tạo mã bài
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* BODY: 2 COLUMNS */}
      <div className="flex-1 flex min-h-0 w-full max-w-full overflow-hidden">
        {/* LEFT: DESIGN LIST + FILTERS */}
        <div className="basis-1/2 min-w-0 border-r flex flex-col min-h-0 bg-card/30">
          <div className="p-4 border-b">
            <FilterSection
              designTypeOptions={designTypeOptions}
              materialTypeOptions={data?.materialTypeOptions || []}
              selectedDesignTypes={selectedDesignTypes}
              selectedMaterialTypes={selectedMaterialTypes}
              currentMaterialTypeId={currentMaterialTypeId}
              searchTerm={searchTerm}
              onDesignTypeChange={setSelectedDesignTypes}
              onMaterialTypeChange={setSelectedMaterialTypes}
              onSearchChange={setSearchTerm}
              onClearFilters={handleClearFilters}
            />

            {currentMaterialTypeId && currentMaterialTypeName && (
              <div className="mt-3">
                <FilterNoticeBanner
                  materialTypeName={currentMaterialTypeName}
                  onClear={handleClearSelection}
                />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={tableContainerRef} className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                  <span>Đang tải danh sách thiết kế...</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DesignCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : paginatedDesigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-base font-semibold text-muted-foreground">
                  Không có thiết kế nào phù hợp.
                </div>
              ) : groupByOrder && groupedByOrder ? (
                <div className="space-y-6">
                  {groupedByOrder.map((group) => (
                    <div key={group.orderCode} className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-base">
                            {group.orderCode}
                          </p>
                          {(group.customerName ||
                            group.customerCompanyName) && (
                            <p className="text-sm font-medium text-muted-foreground">
                              {group.customerCompanyName || group.customerName}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-sm font-semibold"
                        >
                          {group.designs.length} thiết kế
                        </Badge>
                      </div>
                      <DesignTable
                        designs={group.designs}
                        selectedIds={selectedIds}
                        canSelect={canSelect}
                        onToggle={toggleSelection}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <DesignTable
                  designs={paginatedDesigns}
                  selectedIds={selectedIds}
                  canSelect={canSelect}
                  onToggle={toggleSelection}
                />
              )}
            </div>
          </div>

          {/* Pagination (left list) */}
          {totalCount > 0 && (
            <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-3 text-sm text-muted-foreground bg-background">
              <div className="text-sm font-medium text-muted-foreground">
                Hiển thị{" "}
                <span className="font-bold text-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>
                {" - "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-foreground">{totalCount}</span>{" "}
                thiết kế
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Trang trước</span>
                </Button>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Trang
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    onBlur={handlePageInputBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-14 h-8 text-center text-sm font-semibold"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <span className="hidden sm:inline">Trang sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: INLINE PROOFING ORDER CONFIG */}
        <div className="basis-1/2 min-w-0 flex flex-col min-h-0">
          {/* Right header */}
          <div className="shrink-0 border-b bg-card/50 px-4 py-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold">Lệnh bình bài mới</p>
              <p className="text-sm font-medium text-muted-foreground">
                {selectedDesigns.length > 0
                  ? `${selectedDesigns.length} thiết kế • ${selectedCount} đã nhập số lượng`
                  : "Chọn thiết kế ở cột bên trái để thêm vào lệnh"}
              </p>
            </div>
            {materialTypeName && (
              <Badge variant="secondary" className="text-sm font-semibold">
                {materialTypeName}
              </Badge>
            )}
          </div>

          {selectedDesigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-base font-semibold text-muted-foreground">
              Chưa có thiết kế nào được chọn.
              <br />
              Hãy click chọn thiết kế ở cột bên trái, hệ thống sẽ tự động thêm
              vào bảng bên phải.
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Top: Designs table with quantities */}
              <div className="flex-[7] overflow-hidden border-b">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 z-10">
                      <TableRow>
                        <TableHead className="w-10 text-center text-sm font-bold">
                          #
                        </TableHead>
                        <TableHead className="min-w-[200px] text-sm font-bold">
                          Thiết kế
                        </TableHead>
                        <TableHead className="w-32 text-sm font-bold">
                          Kích thước (mm)
                        </TableHead>
                        <TableHead className="w-24 text-right text-sm font-bold">
                          Còn lại
                        </TableHead>
                        <TableHead className="w-40 text-sm font-bold">
                          Số lượng lấy
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDesigns.map((design, index) => {
                        const currentQty = designQuantities[design.id] || 0;

                        const baseAvailableQty =
                          design.availableQuantity !== undefined &&
                          design.availableQuantity >= 0
                            ? design.availableQuantity
                            : design.quantity;

                        const maxQty = baseAvailableQty;
                        const remainingQty = Math.max(
                          0,
                          baseAvailableQty - currentQty
                        );

                        const isValid = currentQty > 0 && currentQty <= maxQty;
                        const isExceeded = currentQty > maxQty;
                        const hasAvailableQuantity =
                          design.availableQuantity !== undefined;

                        // Build full info for tooltip
                        const fullInfo = (
                          <div className="space-y-2 text-sm max-w-md">
                            <div className="font-semibold text-base border-b pb-2">
                              {design.name}
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                              <div>
                                <span className="text-muted-foreground">
                                  Mã hàng:
                                </span>
                                <span className="ml-2 font-mono">
                                  {design.code}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  Đơn hàng:
                                </span>
                                <span className="ml-2 font-semibold">
                                  {design.orderCode || design.orderId}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  Loại:
                                </span>
                                <span className="ml-2">
                                  {design.designTypeName}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  Vật liệu:
                                </span>
                                <span className="ml-2">
                                  {design.materialTypeName}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  Kích thước:
                                </span>
                                <span className="ml-2">
                                  {design.length} × {design.height}
                                  {design.width ? ` × ${design.width}` : ""} mm
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  SL đặt:
                                </span>
                                <span className="ml-2 font-semibold">
                                  {design.quantity.toLocaleString()}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  SL có thể bình bài:
                                </span>
                                <span
                                  className={`ml-2 font-semibold ${
                                    design.availableQuantity &&
                                    design.availableQuantity > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {design.availableQuantity?.toLocaleString() ||
                                    "—"}
                                </span>
                              </div>

                              <div>
                                <span className="text-muted-foreground">
                                  SL đang lấy:
                                </span>
                                <span className="ml-2 font-semibold text-primary">
                                  {currentQty.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Nhân viên thiết kế:
                                </span>
                                <span className="ml-2">
                                  {design.designerName || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Nhân viên kế toán:
                                </span>
                                <span className="ml-2">
                                  {design.accountantName || "—"}
                                </span>
                              </div>
                            </div>

                            {(design.processClassificationOptionName ||
                              design.sidesClassification ||
                              design.laminationType) && (
                              <div className="pt-2 border-t space-y-1">
                                {design.processClassificationOptionName && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Cắt - Bế:
                                    </span>
                                    <span className="ml-2">
                                      {processClassificationLabels[
                                        design.processClassificationOptionName
                                      ] ||
                                        design.processClassificationOptionName}
                                    </span>
                                  </div>
                                )}
                                {design.sidesClassification && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      1 - 2 mặt:
                                    </span>
                                    <span className="ml-2">
                                      {sidesClassificationLabels[
                                        design.sidesClassification
                                      ] || design.sidesClassification}
                                    </span>
                                  </div>
                                )}
                                {design.laminationType && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Cán màng:
                                    </span>
                                    <span className="ml-2">
                                      {laminationTypeLabels[
                                        design.laminationType
                                      ] || design.laminationType}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <CursorTooltip
                            key={design.id}
                            content={fullInfo}
                            delayDuration={300}
                            className="p-4 max-w-md"
                          >
                            <TableRow
                              className={cn(
                                "hover:bg-muted/30",
                                isValid && "bg-emerald-50/40",
                                isExceeded && "bg-destructive/5"
                              )}
                            >
                              <TableCell className="text-center text-sm font-bold text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-bold text-base">
                                    {design.code}
                                  </div>
                                  <code className="text-sm font-semibold text-muted-foreground font-mono">
                                    {design.name}
                                  </code>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  {design.length} × {design.height}
                                  {design.width ? ` × ${design.width}` : ""}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {hasAvailableQuantity ? (
                                  <span
                                    className={cn(
                                      "text-base font-bold",
                                      design.availableQuantity! > 0
                                        ? "text-emerald-600"
                                        : design.availableQuantity! === 0
                                          ? "text-amber-600"
                                          : "text-destructive"
                                    )}
                                  >
                                    {remainingQty.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-base font-semibold text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={maxQty}
                                    className={cn(
                                      "h-9 flex-1 text-right font-mono text-base font-semibold",
                                      isExceeded &&
                                        "border-destructive focus-visible:ring-destructive"
                                    )}
                                    value={currentQty || ""}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        design.id,
                                        e.target.value,
                                        design.quantity,
                                        design.availableQuantity
                                      )
                                    }
                                    placeholder="0"
                                  />
                                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                                    /{maxQty.toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CursorTooltip>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Bottom: Config panel (fixed at bottom) */}
              <div className="flex-[3] border-t bg-muted/20 flex flex-col min-h-0">
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {/* Row 1: Config items in one row */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Proofing Sheet Quantity */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="proofingSheetQuantity"
                        className="text-sm font-bold"
                      >
                        Số lượng giấy in
                        <span className="text-destructive"> *</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          id="proofingSheetQuantity"
                          type="number"
                          min="1"
                          max="2147483647"
                          step="1"
                          className="pl-8 h-8 text-sm font-semibold"
                          placeholder="Nhập số lượng"
                          value={proofingSheetQuantity || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              setProofingSheetQuantity(0);
                            } else {
                              const numValue = parseInt(value, 10);
                              if (
                                !isNaN(numValue) &&
                                numValue > 0 &&
                                numValue <= 2147483647
                              ) {
                                setProofingSheetQuantity(numValue);
                              } else if (numValue > 2147483647) {
                                setProofingSheetQuantity(2147483647);
                              }
                            }
                          }}
                          required
                        />
                      </div>
                    </div>

                    {/* Paper Size */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="paperSizeId"
                        className="text-sm font-bold"
                      >
                        Khổ giấy in
                      </Label>
                      <Select
                        value={paperSizeId}
                        onValueChange={setPaperSizeId}
                      >
                        <SelectTrigger id="paperSizeId" className="h-8 text-sm">
                          <Maximize2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Chọn khổ giấy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chưa xác định</SelectItem>
                          {paperSizes?.map((ps) => (
                            <SelectItem key={ps.id} value={ps.id.toString()}>
                              {ps.name}
                              {ps.width && ps.height
                                ? ` (${ps.width}×${ps.height})`
                                : ""}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            -- Nhập thủ công --
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Paper Size or Size Display */}
                    {paperSizeId === "custom" ? (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="customPaperSize"
                          className="text-sm font-bold"
                        >
                          Khổ giấy tùy chỉnh
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="customPaperSize"
                            className="h-8 text-sm flex-1"
                            placeholder="31×43, 65×86..."
                            value={customPaperSize}
                            onChange={(e) => setCustomPaperSize(e.target.value)}
                            disabled={isCreatingPaperSize}
                          />
                          {showCreateButton && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 shrink-0"
                              onClick={handleCreatePaperSize}
                              disabled={isCreatingPaperSize}
                            >
                              {isCreatingPaperSize ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1.5 text-xs">Tạo mới</span>
                            </Button>
                          )}
                        </div>
                        {existingPaperSize && (
                          <p className="text-xs font-medium text-muted-foreground">
                            Đã tồn tại:{" "}
                            {existingPaperSize.name ||
                              `${existingPaperSize.width}×${existingPaperSize.height}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-muted-foreground">
                          Kích thước
                        </Label>
                        <div className="h-8 flex items-center px-2 rounded-md border bg-background text-sm font-semibold text-muted-foreground">
                          {paperSizeId !== "none" &&
                          paperSizes?.find(
                            (ps) => ps.id.toString() === paperSizeId
                          ) ? (
                            <span>
                              {
                                paperSizes.find(
                                  (ps) => ps.id.toString() === paperSizeId
                                )?.width
                              }{" "}
                              ×{" "}
                              {
                                paperSizes.find(
                                  (ps) => ps.id.toString() === paperSizeId
                                )?.height
                              }
                            </span>
                          ) : (
                            <span className="italic">Chưa chọn</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Notes */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Ghi chú
                    </Label>
                    <Textarea
                      id="notes"
                      className="min-h-[60px] text-sm resize-none"
                      placeholder="Nhập ghi chú cho lệnh bình bài này (tùy chọn)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Footer summary */}
                <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between gap-2 text-sm font-semibold text-muted-foreground bg-background">
                  <div>
                    {selectedCount > 0 && (
                      <span>
                        {selectedCount}/{selectedDesigns.length} thiết kế đã
                        nhập số lượng • Tổng lấy{" "}
                        <span className="font-bold text-foreground">
                          {totalSelectedQuantity.toLocaleString()}
                        </span>{" "}
                        sp
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {!hasValidQuantities && (
                      <div>
                        Vui lòng nhập số lượng &gt; 0 cho ít nhất 1 thiết kế.
                      </div>
                    )}
                    {proofingSheetQuantity < 1 && (
                      <div>Số lượng giấy in phải &gt;= 1.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
