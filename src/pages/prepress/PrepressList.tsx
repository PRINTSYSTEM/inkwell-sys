import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  FileImage,
  Loader2,
  Plus,
  Search,
  Box,
  RotateCcw,
  X,
  Check,
  ChevronsUpDown,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";

import {
  useAddDesignsToProofingOrder,
  useAvailableOrderDetailsForProofing,
  useCreateProofingOrder,
  useUpdateProofingOrder,
  useProofingAvailableOrderDetailsDesignTypeSummary,
  useProofingOrders,
  useRejectDesignFromProofingOrder,
  usePaperSizes,
  useCreatePaperSize,
} from "@/hooks/use-proofing-order";
import { useDesignTypeList } from "@/hooks/use-design-type";
import { useProofingSelection } from "@/hooks/useProofingSelection";
import { useSystemSetting } from "@/hooks/use-system-setting";

import { ProofingOrderListParamsSchema } from "@/Schema/params.schema";
import {
  laminationTypeLabels,
  processClassificationLabels,
  proofingStatusLabels,
  sidesClassificationLabels,
} from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { formatDesignDimensions } from "@/utils/format-die-size";

import { PrepressDesignFilter } from "./components/PrepressDesignFilter";
import { PrepressOrdersHeader } from "./components/PrepressOrdersHeader";
import { PrepressOrdersTable } from "./components/PrepressOrdersTable";
import { PrepressOrderRow } from "./components/PrepressOrderRow";
import { DetailEmptyOrderView } from "./detail-components/DetailEmptyOrderView";
import { DieListDialog } from "@/components/dies/DieListDialog";
import { InventoryViewDialog } from "@/components/inventory/InventoryViewDialog";

import type { DesignItem } from "@/types/proofing";
import { useMaterialTypeList, useAuth } from "@/hooks";
import { ROLE } from "@/constants";
import type { UserRole } from "@/Schema";

type ProofingOrder =
  import("@/Schema/proofing-order.schema").ProofingOrderResponse;

function useHasActiveProofingFilters(args: {
  selectedDesignTypes: number[];
  selectedMaterialTypes: number[];
}) {
  return (
    args.selectedDesignTypes.length > 0 ||
    args.selectedMaterialTypes.length > 0
  );
}

export default function PrepressList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const isProofer = role === ROLE.ADMIN || role === ROLE.MANAGER || role === ROLE.PROOFER;

  // ===== Mode: Orders list (default) vs Waiting designs (when filters active) =====
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<number[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<number[]>(
    [],
  );

  const [viewMode, setViewMode] = useState<"orders" | "designs">("orders");

  const hasActiveFilters = useHasActiveProofingFilters({
    selectedDesignTypes,
    selectedMaterialTypes,
  });

  // Switch to designs mode when any filter becomes active, back to orders if cleared
  useEffect(() => {
    if (hasActiveFilters) {
      setViewMode("designs");
    } else {
      setViewMode("orders");
    }
  }, [hasActiveFilters]);

  // ===== Selection (for waiting designs) =====
  const {
    selectedDesigns,
    selectedIds,
    currentMaterialTypeId,
    toggleSelection,
    clearSelection,
    canSelect,
  } = useProofingSelection();

  // ===== Orders list (Proofing orders) =====
  const [designCode, setDesignCode] = useState("");
  const [debouncedDesignCode] = useDebounce(designCode, 300);
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState<
    number | null
  >(null);
  const [incompleteOrdersPage, setIncompleteOrdersPage] = useState(1);
  const [completedOrdersPage, setCompletedOrdersPage] = useState(1);
  const [productionReturnedOrdersPage, setProductionReturnedOrdersPage] = useState(1);
  const [incompleteOrdersPageInput, setIncompleteOrdersPageInput] =
    useState<string>("");
  const [completedOrdersPageInput, setCompletedOrdersPageInput] =
    useState<string>("");
  const [productionReturnedOrdersPageInput, setProductionReturnedOrdersPageInput] =
    useState<string>("");
  const ordersTableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  const incompleteQueryParams = useMemo(() => {
    const raw = {
      status: "not_completed",
      code: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: incompleteOrdersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, incompleteOrdersPage]);

  const completedQueryParams = useMemo(() => {
    const raw = {
      status: "completed",
      code: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: completedOrdersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, completedOrdersPage]);

  const productionReturnedQueryParams = useMemo(() => {
    const raw = {
      status: "production_returned",
      code: debouncedDesignCode.trim() || null,
      materialTypeId: selectedMaterialTypeId,
      pageSize: itemsPerPage,
      pageNumber: productionReturnedOrdersPage,
    };
    const parsed = ProofingOrderListParamsSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }, [debouncedDesignCode, selectedMaterialTypeId, productionReturnedOrdersPage]);

  const { data: incompleteOrdersResp, isLoading: loadingIncompleteOrders } =
    useProofingOrders(incompleteQueryParams);

  const { data: completedOrdersResp, isLoading: loadingCompletedOrders } =
    useProofingOrders(completedQueryParams);

  const { data: productionReturnedOrdersResp, isLoading: loadingProductionReturnedOrders } =
    useProofingOrders(productionReturnedQueryParams);

  const incompleteOrders = useMemo<ProofingOrder[]>(() => {
    const items = incompleteOrdersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [incompleteOrdersResp?.items]);

  const completedOrders = useMemo<ProofingOrder[]>(() => {
    const items = completedOrdersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [completedOrdersResp?.items]);

  const productionReturnedOrders = useMemo<ProofingOrder[]>(() => {
    const items = productionReturnedOrdersResp?.items;
    if (!items || !Array.isArray(items)) return [];
    return items as unknown as ProofingOrder[];
  }, [productionReturnedOrdersResp?.items]);

  const { data: currentNumberSetting } = useSystemSetting("ProofingOrder_CurrentNumber");

  const nextOrderId = useMemo(() => {
    if (currentNumberSetting?.value) {
      const num = parseInt(currentNumberSetting.value, 10);
      if (!isNaN(num)) {
        return (num + 1).toString();
      }
    }

    let maxCodeNum = 0;
    
    const checkMax = (items: any[]) => {
      items.forEach((item: any) => {
        if (item.code) {
          const num = parseInt(item.code, 10);
          if (!isNaN(num) && num > maxCodeNum) {
            maxCodeNum = num;
          }
        }
      });
    };

    if (incompleteOrdersResp?.items) {
      checkMax(incompleteOrdersResp.items);
    }
    if (completedOrdersResp?.items) {
      checkMax(completedOrdersResp.items);
    }
    if (productionReturnedOrdersResp?.items) {
      checkMax(productionReturnedOrdersResp.items);
    }

    return maxCodeNum > 0 ? (maxCodeNum + 1).toString() : undefined;
  }, [currentNumberSetting, incompleteOrdersResp, completedOrdersResp, productionReturnedOrdersResp]);

  const incompleteTotalCount = incompleteOrdersResp?.total ?? 0;
  const incompleteTotalPages =
    Math.ceil(incompleteTotalCount / itemsPerPage) || 1;

  const completedTotalCount = completedOrdersResp?.total ?? 0;
  const completedTotalPages =
    Math.ceil(completedTotalCount / itemsPerPage) || 1;

  const productionReturnedTotalCount = productionReturnedOrdersResp?.total ?? 0;
  const productionReturnedTotalPages =
    Math.ceil(productionReturnedTotalCount / itemsPerPage) || 1;

  const isSearchActiveAndEmpty = useMemo(() => {
    if (loadingIncompleteOrders || loadingCompletedOrders || loadingProductionReturnedOrders) return false;
    return (
      debouncedDesignCode.trim() !== "" &&
      incompleteTotalCount === 0 &&
      completedTotalCount === 0 &&
      productionReturnedTotalCount === 0
    );
  }, [
    debouncedDesignCode,
    incompleteTotalCount,
    completedTotalCount,
    productionReturnedTotalCount,
    loadingIncompleteOrders,
    loadingCompletedOrders,
    loadingProductionReturnedOrders,
  ]);

  useEffect(() => {
    setIncompleteOrdersPageInput(incompleteOrdersPage.toString());
  }, [incompleteOrdersPage]);

  useEffect(() => {
    setCompletedOrdersPageInput(completedOrdersPage.toString());
  }, [completedOrdersPage]);

  useEffect(() => {
    setProductionReturnedOrdersPageInput(productionReturnedOrdersPage.toString());
  }, [productionReturnedOrdersPage]);

  useEffect(() => {
    if (ordersTableRef.current) ordersTableRef.current.scrollTop = 0;
  }, [incompleteOrdersPage, completedOrdersPage, productionReturnedOrdersPage]);

  useEffect(() => {
    // reset orders pagination when list filters change
    setIncompleteOrdersPage(1);
    setIncompleteOrdersPageInput("1");
    setCompletedOrdersPage(1);
    setCompletedOrdersPageInput("1");
    setProductionReturnedOrdersPage(1);
    setProductionReturnedOrdersPageInput("1");
  }, [debouncedDesignCode, selectedMaterialTypeId]);

  const handleIncompletePageInputBlur = () => {
    const page = parseInt(incompleteOrdersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= incompleteTotalPages) {
      setIncompleteOrdersPage(page);
    } else {
      setIncompleteOrdersPageInput(incompleteOrdersPage.toString());
    }
  };

  const handleCompletedPageInputBlur = () => {
    const page = parseInt(completedOrdersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= completedTotalPages) {
      setCompletedOrdersPage(page);
    } else {
      setCompletedOrdersPageInput(completedOrdersPage.toString());
    }
  };

  const handleProductionReturnedPageInputBlur = () => {
    const page = parseInt(productionReturnedOrdersPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= productionReturnedTotalPages) {
      setProductionReturnedOrdersPage(page);
    } else {
      setProductionReturnedOrdersPageInput(productionReturnedOrdersPage.toString());
    }
  };

  // ===== Waiting designs data (when filters active) =====
  const selectedDesignTypeId =
    selectedDesignTypes.length > 0 ? selectedDesignTypes[0] : null;

  const designCodeForApi =
    debouncedDesignCode.trim().length > 0 ? debouncedDesignCode : null;

  const [designsPage, setDesignsPage] = useState(1);
  const [designsPageInput, setDesignsPageInput] = useState<string>("");
  const designsTableRef = useRef<HTMLDivElement>(null);
  const designsPageSize = 20;

  const materialTypeIdForApi = currentMaterialTypeId
    ? currentMaterialTypeId
    : selectedMaterialTypes.length === 1
      ? selectedMaterialTypes[0]
      : null;

  const { data: availableDesignsData, isLoading: isLoadingDesigns } =
    useAvailableOrderDetailsForProofing(
      viewMode === "designs" || isSearchActiveAndEmpty
        ? {
          materialTypeId: viewMode === "designs" ? materialTypeIdForApi : null,
          designTypeId: viewMode === "designs" ? selectedDesignTypeId : null,
          designCode: designCodeForApi,
          pageNumber: designsPage,
          pageSize: designsPageSize,
        }
        : undefined,
    );

  const [materialSelected, setMaterialSelected] = useState<number | null>(null);
  const { data: materialTypesData } = useMaterialTypeList({ status: "active", pageSize: 100 });

  // Material types for orders list filter
  const materialTypeOptionsForOrders = useMemo(() => {
    const items = Array.isArray(materialTypesData)
      ? materialTypesData
      : (materialTypesData?.items ?? []);
    return items.map((mt: any) => ({
      id: mt.id,
      name: mt.name || "",
    }));
  }, [materialTypesData]);

  const designsTotalCount = availableDesignsData?.total ?? 0;
  const designsTotalPages = availableDesignsData?.totalPages ?? 1;

  useEffect(() => {
    setDesignsPageInput(designsPage.toString());
  }, [designsPage]);

  useEffect(() => {
    if (designsTableRef.current) designsTableRef.current.scrollTop = 0;
  }, [designsPage]);

  useEffect(() => {
    setDesignsPage(1);
    setDesignsPageInput("1");
  }, [
    selectedDesignTypeId,
    materialTypeIdForApi,
    debouncedDesignCode,
  ]);

  const handleDesignsPageInputBlur = () => {
    const page = parseInt(designsPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= designsTotalPages) {
      setDesignsPage(page);
    } else {
      setDesignsPageInput(designsPage.toString());
    }
  };

  // ===== Filter option sources =====
  const { data: designTypesData } = useDesignTypeList({ status: "active" });
  const { data: designTypesCount = [] } =
    useProofingAvailableOrderDetailsDesignTypeSummary(true);

  const designTypeOptions = useMemo(() => {
    const items = Array.isArray(designTypesData)
      ? designTypesData
      : (designTypesData?.items ?? []);

    const countMap = new Map<number, number>();
    if (Array.isArray(designTypesCount) && designTypesCount.length > 0) {
      designTypesCount.forEach((row: any) => {
        const id = row?.designTypeId;
        if (typeof id === "number") countMap.set(id, row?.count ?? 0);
      });
    }

    const baseOptions = items.map((dt: any) => ({
      id: dt.id,
      name: dt.name || "",
      count: countMap.get(dt.id) || 0,
    }));

    const result: typeof baseOptions = [];
    baseOptions.forEach((opt) => {
      result.push(opt);
      const optNameLower = opt.name.toLowerCase();
      if ((optNameLower.includes("nhãn") || optNameLower.includes("nhan")) && !optNameLower.includes("cuộn") && !optNameLower.includes("cuon")) {
        result.push({
          id: 999001,
          name: "Nhãn Metaline",
          count: countMap.get(999001) || 0,
        });
      } else if ((optNameLower.includes("túi") || optNameLower.includes("tui")) && !optNameLower.includes("cuộn") && !optNameLower.includes("cuon")) {
        result.push({
          id: 999002,
          name: "Túi Metaline",
          count: countMap.get(999002) || 0,
        });
      }
    });

    return result;
  }, [designTypesData, designTypesCount]);

  const materialTypeOptions = availableDesignsData?.materialTypeOptions ?? [];

  // Handlers that keep design/material filters in sync:
  const handleDesignTypeChange = (ids: number[]) => {
    // When user actively picks a design type, reset material selection so
    // material options will be reloaded for that design type.
    setSelectedDesignTypes(ids);
    setSelectedMaterialTypes([]);
    setIncompleteOrdersPage(1);
    setCompletedOrdersPage(1);
  };

  const handleMaterialTypeChange = (ids: number[]) => {
    setSelectedMaterialTypes(ids);
    setIncompleteOrdersPage(1);
    setCompletedOrdersPage(1);

    // If user selected exactly one material and no design type is selected,
    // pick a corresponding design type that uses that material (if available).
    if (ids.length === 1 && (!selectedDesignTypes || selectedDesignTypes.length === 0)) {
      const mtId = ids[0];
      const designs = availableDesignsData?.designs ?? [];
      const matchedDesignTypeIds = Array.from(
        new Set(
          designs
            .filter((d: any) => d.materialTypeId === mtId)
            .map((d: any) => d.designTypeId),
        ),
      ).filter((v) => typeof v === "number" && !Number.isNaN(v));

      if (matchedDesignTypeIds.length > 0) {
        // Pick the first matching design type as the 'corresponding' one.
        setSelectedDesignTypes([matchedDesignTypeIds[0]]);
      }
    }
    // If material cleared, also clear design type selection
    if (ids.length === 0) {
      setSelectedDesignTypes([]);
    }
  };

  // ===== Actions =====
  const { mutateAsync: createProofingOrder, isPending: isCreating } =
    useCreateProofingOrder();
  const { mutateAsync: addDesignsMutate, isPending: isAddingDesigns } =
    useAddDesignsToProofingOrder();
  const { mutateAsync: rejectDesignMutate, isPending: isRejecting } =
    useRejectDesignFromProofingOrder();


  const [isDieListDialogOpen, setIsDieListDialogOpen] = useState(false);
  const [isInventoryViewDialogOpen, setIsInventoryViewDialogOpen] =
    useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(
    new Set(),
  );
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<DesignItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");



  // Die list prefill state
  const [dieListInitialSize, setDieListInitialSize] = useState<
    string | undefined
  >(undefined);

  const handleFindDie = (_design: DesignItem, dimensions: string) => {
    setDieListInitialSize(dimensions || "");
    setIsDieListDialogOpen(true);
  };

  // ===== Config Panel State (inline DetailEmptyOrderView) =====
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [designQuantities, setDesignQuantities] = useState<
    Record<number, number>
  >({});
  const [proofingSheetQuantity, setProofingSheetQuantity] = useState(0);
  const [paperSizeId, setPaperSizeId] = useState("custom");
  const [customPaperSize, setCustomPaperSize] = useState("");
  const [configNotes, setConfigNotes] = useState("");
  const { data: paperSizesData } = usePaperSizes();
  const paperSizes = paperSizesData || [];
  const { mutate: createPaperSizeMutate, loading: isCreatingPaperSize } =
    useCreatePaperSize();
  const { mutateAsync: updateProofingOrder, isPending: isUpdatingOrder } =
    useUpdateProofingOrder();

  const configSelectedCount = useMemo(() => {
    return Object.values(designQuantities).filter((qty) => qty > 0).length;
  }, [designQuantities]);

  const configMaterialTypeName = useMemo(() => {
    if (!currentMaterialTypeId || !materialTypeOptions.length) return null;
    const found = materialTypeOptions.find(
      (m: any) => m.id === currentMaterialTypeId,
    );
    return found?.name || null;
  }, [currentMaterialTypeId, materialTypeOptions]);

  const parsedCustomPaperSize = useMemo(() => {
    if (!customPaperSize || paperSizeId !== "custom") return null;
    const trimmed = customPaperSize.trim();
    const match = trimmed.match(/^(\d+)\s*[×xX*]\s*(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }, [customPaperSize, paperSizeId]);

  const existingPaperSize = useMemo(() => {
    if (!parsedCustomPaperSize || !paperSizes) return null;
    return (
      paperSizes.find(
        (ps) =>
          ps.width === parsedCustomPaperSize.width &&
          ps.height === parsedCustomPaperSize.height,
      ) ?? null
    );
  }, [parsedCustomPaperSize, paperSizes]);

  const showCreateButton = useMemo(() => {
    return (
      paperSizeId === "custom" &&
      !!parsedCustomPaperSize &&
      !existingPaperSize &&
      customPaperSize.trim().length > 0
    );
  }, [paperSizeId, parsedCustomPaperSize, existingPaperSize, customPaperSize]);

  const handleCreatePaperSize = async () => {
    if (!parsedCustomPaperSize) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập khổ giấy hợp lệ (ví dụ: 31×43)",
      });
      return;
    }
    if (existingPaperSize) {
      setPaperSizeId(existingPaperSize.id.toString());
      return;
    }
    try {
      const newPaperSize = await createPaperSizeMutate({
        name: `${parsedCustomPaperSize.width}×${parsedCustomPaperSize.height}`,
        width: parsedCustomPaperSize.width,
        height: parsedCustomPaperSize.height,
        isCustom: true,
      });
      if (newPaperSize?.id) {
        setPaperSizeId(newPaperSize.id.toString());
        setCustomPaperSize("");
        toast.success("Thành công", { description: "Đã tạo khổ giấy mới" });
      }
    } catch (error) {
      console.error("Failed to create paper size:", error);
      toast.error("Lỗi", { description: "Không thể tạo khổ giấy mới" });
    }
  };

  const handleConfigSubmitDesigns = async () => {
    try {
      if (!currentMaterialTypeId || selectedDesigns.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng chọn mã hàng để thêm vào bình bài",
        });
        return;
      }
      const items = Object.entries(designQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const design = selectedDesigns.find((d) => d.id === parseInt(id, 10));
          if (!design) return null;
          const quantity = Math.floor(qty);
          if (quantity <= 0) return null;

          const isPoolDesign = design.queueItemId?.startsWith("RD_") || false;
          return {
            orderDetailId: isPoolDesign ? null : design.id,
            readyDesignId: design.readyDesignId ?? design.designId ?? null,
            quantity: quantity,
          };
        })
        .filter(
          (item): item is { orderDetailId: number | null; readyDesignId: number | null; quantity: number } =>
            item !== null,
        );

      if (items.length === 0) {
        toast.error("Lỗi", {
          description: "Vui lòng nhập số lượng cho ít nhất một mã hàng",
        });
        return;
      }

      // 1. Create proofing order first
      const result = await createProofingOrder({ suppressToast: true } as any);
      const orderId = result?.id;
      if (!orderId) {
        toast.error("Không thể tạo lệnh bình bài");
        return;
      }

      // 2. Add designs to the new order
      await addDesignsMutate({
        id: orderId,
        request: { materialTypeId: currentMaterialTypeId, items },
        suppressToast: true,
      });

      const firstDesignWithWeight = selectedDesigns.find(
        (d) => d.basisWeight !== undefined && d.basisWeight !== null && d.basisWeight > 0
      );
      const basisWeightVal = firstDesignWithWeight?.basisWeight;

      // 3. Update order with configuration (Sheet Qty, Paper Size, Notes)
      await updateProofingOrder({
        id: orderId,
        data: {
          totalQuantity:
            proofingSheetQuantity > 0 ? proofingSheetQuantity : undefined,
          paperSizeId:
            paperSizeId && paperSizeId !== "custom"
              ? parseInt(paperSizeId, 10)
              : undefined,
          customPaperSize:
            paperSizeId === "custom" ? customPaperSize : undefined,
          notes: configNotes || undefined,
          basisWeight: basisWeightVal || undefined,
        },
        suppressToast: true,
      });

      toast.success("Thành công", {
        description: `Đã tạo lệnh bình bài #${orderId}.`,
      });
      setIsConfiguring(false);
      setDesignQuantities({});
      setProofingSheetQuantity(0);
      setPaperSizeId("custom");
      setCustomPaperSize("");
      setConfigNotes("");
      clearSelection();
      navigate(`/proofing/${orderId}`);
    } catch (e) {
      console.error("Submit designs failed:", e);
    }
  };

  const handleCancelCreateOrder = () => {
    setIsConfiguring(false);
    setDesignQuantities({});
    setProofingSheetQuantity(0);
    setPaperSizeId("custom");
    setCustomPaperSize("");
    setConfigNotes("");
    clearSelection();
  };

  const handleToggleDesign = (design: DesignItem) => {
    const isSelecting = !selectedIds.has(design.id);
    toggleSelection(design);

    if (isSelecting) {
      setDesignQuantities((prev) => ({
        ...prev,
        [design.id]:
          design.availableQuantity !== undefined
            ? design.availableQuantity
            : design.quantity || 0,
      }));
    }

    // Removed automatic triggering of isConfiguring to only open panel when "Tạo lệnh mới" is clicked
    /* 
    if (!isConfiguring) {
      setIsConfiguring(true);
    }
    */
  };

  const handleClearFilters = () => {
    setSelectedDesignTypes([]);
    setSelectedMaterialTypes([]);
    setDesignCode("");
    setDesignsPage(1);
    setDesignsPageInput("1");
    setViewMode("orders");
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  // Check if we should show expand functionality (when designCode search is active)
  const shouldShowExpand = debouncedDesignCode.trim().length > 0;
  const searchTermLower = debouncedDesignCode.trim().toLowerCase();

  const canCreateOrder = useMemo(() => {
    return selectedDesigns.length > 0 && currentMaterialTypeId != null;
  }, [selectedDesigns, currentMaterialTypeId]);

  // Auto-expand all orders when search is active
  useEffect(() => {
    if (
      shouldShowExpand &&
      (incompleteOrders.length > 0 || completedOrders.length > 0)
    ) {
      const allOrderIds = new Set([
        ...incompleteOrders.map((o) => o.id),
        ...completedOrders.map((o) => o.id),
      ]);
      setExpandedOrderIds(allOrderIds);
    } else {
      setExpandedOrderIds(new Set());
    }
  }, [shouldShowExpand, incompleteOrders, completedOrders]);

  const openRejectDialog = (design: DesignItem) => {
    setRejectTarget(design);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };



  return (
    <div className="relative">
      <div className="relative h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
        <div className="mx-auto flex h-full w-full max-w-none flex-col gap-4 p-4">
          {/* Header */}
          <header className="shrink-0">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">Bình bài</h1>
                <p className="text-xs text-muted-foreground">
                  Danh sách mã bài & thiết kế chờ bình bài
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isProofer && (
                  isConfiguring ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                      onClick={handleCancelCreateOrder}
                    >
                      <X className="h-4 w-4" />
                      Hủy Tạo lệnh
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={isCreating}
                      onClick={() => {
                        setIsConfiguring(true);
                        setProofingSheetQuantity(0);
                        setPaperSizeId("custom");
                        setCustomPaperSize("");
                        setConfigNotes("");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Tạo lệnh mới
                    </Button>
                  )
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="min-h-0 flex-1 overflow-hidden">
            <div className={cn("h-full flex gap-4")}>
              <Card
                className={cn(
                  "h-full overflow-hidden",
                  isConfiguring ? "w-[72%] min-w-0 flex-none" : "w-full",
                )}
              >
                <CardContent className="h-full p-0">
                  <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                    <header className="shrink-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsDieListDialogOpen(true)}
                        >
                          <Box className="h-4 w-4" />
                          Danh sách khuôn bế
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsInventoryViewDialogOpen(true)}
                        >
                          <Package className="h-4 w-4" />
                          Xem kho hàng
                        </Button>

                        {/* Search Input on the same row, next to buttons */}
                        <div className="relative w-80 max-w-sm ml-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Tìm mã bình bài hoặc mã thiết kế..."
                            className="h-9 pl-10 text-xs"
                            value={designCode}
                            onChange={(e) => {
                              setDesignCode(e.target.value);
                              setIncompleteOrdersPage(1);
                              setCompletedOrdersPage(1);
                            }}
                          />
                        </div>
                      </div>

                      <PrepressOrdersHeader
                        designCode={designCode}
                        setDesignCode={setDesignCode}
                        selectedMaterialTypeId={selectedMaterialTypeId}
                        setSelectedMaterialTypeId={setSelectedMaterialTypeId}
                        materialTypeOptionsForOrders={
                          materialTypeOptionsForOrders
                        }
                        designTypeOptions={designTypeOptions}
                        materialTypeOptions={materialTypeOptions}
                        selectedDesignTypes={selectedDesignTypes}
                        selectedMaterialTypes={selectedMaterialTypes}
                        currentMaterialTypeId={currentMaterialTypeId}
                        onDesignTypeChange={(ids) => {
                          if (ids.length === 0) {
                            handleClearFilters();
                          } else {
                            handleDesignTypeChange(ids);
                            setViewMode("designs");
                          }
                        }}
                        onMaterialTypeChange={handleMaterialTypeChange}
                        onClearFilters={handleClearFilters}
                        designs={availableDesignsData?.designs || []}
                        selectedIds={selectedIds}
                        canSelect={canSelect}
                        onToggle={handleToggleDesign}
                        isLoadingDesigns={isLoadingDesigns}
                        // New props for split orders
                        hasActiveFilters={viewMode === "designs"}
                        incompleteOrders={incompleteOrders}
                        completedOrders={completedOrders}
                        productionReturnedOrders={productionReturnedOrders}
                        loadingIncomplete={loadingIncompleteOrders}
                        loadingCompleted={loadingCompletedOrders}
                        loadingProductionReturned={loadingProductionReturnedOrders}
                        incompletePage={incompleteOrdersPage}
                        setIncompletePage={setIncompleteOrdersPage}
                        completedPage={completedOrdersPage}
                        setCompletedPage={setCompletedOrdersPage}
                        productionReturnedPage={productionReturnedOrdersPage}
                        setProductionReturnedPage={setProductionReturnedOrdersPage}
                        incompleteTotalPages={incompleteTotalPages}
                        completedTotalPages={completedTotalPages}
                        productionReturnedTotalPages={productionReturnedTotalPages}
                        incompleteOrdersPageInput={incompleteOrdersPageInput}
                        setIncompleteOrdersPageInput={
                          setIncompleteOrdersPageInput
                        }
                        handleIncompletePageInputBlur={
                          handleIncompletePageInputBlur
                        }
                        completedOrdersPageInput={completedOrdersPageInput}
                        setCompletedOrdersPageInput={
                          setCompletedOrdersPageInput
                        }
                        handleCompletedPageInputBlur={
                          handleCompletedPageInputBlur
                        }
                        productionReturnedOrdersPageInput={productionReturnedOrdersPageInput}
                        setProductionReturnedOrdersPageInput={
                          setProductionReturnedOrdersPageInput
                        }
                        handleProductionReturnedPageInputBlur={
                          handleProductionReturnedPageInputBlur
                        }
                        incompleteTotalCount={incompleteTotalCount}
                        completedTotalCount={completedTotalCount}
                        productionReturnedTotalCount={productionReturnedTotalCount}
                        itemsPerPage={itemsPerPage}
                        shouldShowExpand={shouldShowExpand}
                        expandedOrderIds={expandedOrderIds}
                        searchTermLower={searchTermLower}
                        debouncedDesignCode={debouncedDesignCode}
                        onNavigate={(id) => navigate(`/proofing/${id}${debouncedDesignCode.trim() ? `?search=${encodeURIComponent(debouncedDesignCode.trim())}` : ""}`)}
                        ordersTableRef={ordersTableRef}
                        // Actions for shared DesignTable
                        onReject={isProofer ? openRejectDialog : undefined}
                        isRejecting={isRejecting}
                        onFindDie={handleFindDie}
                        isSelectionEnabled={isProofer}
                        isConfiguring={isConfiguring}
                        selectedDesigns={selectedDesigns}
                        // Designs Pagination props
                        designsPage={designsPage}
                        setDesignsPage={setDesignsPage}
                        designsTotalPages={designsTotalPages}
                        designsPageInput={designsPageInput}
                        setDesignsPageInput={setDesignsPageInput}
                        handleDesignsPageInputBlur={handleDesignsPageInputBlur}
                        designsTotalCount={designsTotalCount}
                        designsPageSize={designsPageSize}
                      />

                      {(selectedMaterialTypeId || designCode.trim()) && (
                        <div className="flex items-center gap-2 px-0 mt-[-8px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={() => {
                              setDesignCode("");
                              setSelectedMaterialTypeId(null);
                              setIncompleteOrdersPage(1);
                              setCompletedOrdersPage(1);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Xóa bộ lọc
                          </Button>
                        </div>
                      )}
                    </header>

                    {/* Orders list components are now inside PrepressOrdersHeader if !hasActiveFilters */}
                  </div>
                </CardContent>
              </Card>

              {/* Right panel: config panel when creating new order */}
              {isConfiguring && (
                <div className="w-[28%] min-w-[320px] shrink-0 h-full flex flex-col">
                  <DetailEmptyOrderView
                    selectedDesigns={selectedDesigns}
                    selectedCount={configSelectedCount}
                    materialTypeName={configMaterialTypeName}
                    designQuantities={designQuantities}
                    setDesignQuantities={setDesignQuantities}
                    toggleSelection={handleToggleDesign}
                    proofingSheetQuantity={proofingSheetQuantity}
                    setProofingSheetQuantity={setProofingSheetQuantity}
                    paperSizeId={paperSizeId}
                    setPaperSizeId={setPaperSizeId}
                    customPaperSize={customPaperSize}
                    setCustomPaperSize={setCustomPaperSize}
                    notes={configNotes}
                    setNotes={setConfigNotes}
                    paperSizes={paperSizes}
                    showCreateButton={showCreateButton}
                    isCreatingPaperSize={isCreatingPaperSize}
                    handleCreatePaperSize={handleCreatePaperSize}
                    handleSubmitDesigns={handleConfigSubmitDesigns}
                    isAddingDesigns={
                      isCreating || isAddingDesigns || isUpdatingOrder
                    }
                    nextOrderId={nextOrderId}
                  />
                </div>
              )}
            </div>
          </main>

          <DieListDialog
            open={isDieListDialogOpen}
            onOpenChange={setIsDieListDialogOpen}
            initialSize={dieListInitialSize}
          />

          <InventoryViewDialog
            open={isInventoryViewDialogOpen}
            onOpenChange={setIsInventoryViewDialogOpen}
          />

          <AlertDialog
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hoàn hàng về phòng thiết kế</AlertDialogTitle>
                <AlertDialogDescription>
                  Xác nhận hoàn hàng để thiết kế được trả về phòng thiết kế xử
                  lý lại.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {rejectTarget && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-sm font-semibold text-foreground">
                      {rejectTarget.code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rejectTarget.name}
                      {rejectTarget.orderCode || rejectTarget.orderId
                        ? ` • ${rejectTarget.orderCode || rejectTarget.orderId}`
                        : ""}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reject-reason">Lý do (bắt buộc)</Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ví dụ: sai thông tin, cần chỉnh file, thiếu chi tiết..."
                      className="min-h-[90px]"
                    />
                  </div>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    closeRejectDialog();
                  }}
                  disabled={isRejecting}
                >
                  Huỷ
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!rejectTarget) return;
                    try {
                      await rejectDesignMutate({
                        designId: rejectTarget.designId || rejectTarget.id,
                        reason: rejectReason.trim() || null,
                      });

                      // If this design is currently selected, unselect it.
                      // If it was the last selected item, also clearSelection()
                      // to ensure currentMaterialTypeId is reset.
                      const wasLastSelected =
                        selectedDesigns.length === 1 &&
                        selectedDesigns[0]?.id === rejectTarget.id;

                      if (selectedIds.has(rejectTarget.id)) {
                        toggleSelection(rejectTarget);
                      }

                      if (wasLastSelected) {
                        clearSelection();
                      }

                      closeRejectDialog();
                    } catch (err) {
                      console.error("Reject design failed:", err);
                      // error toast already handled by hook
                    }
                  }}
                  disabled={isRejecting || !rejectTarget || !rejectReason.trim()}
                >
                  {isRejecting ? "Đang xử lý..." : "Xác nhận"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


        </div>
      </div>
    </div>
  );
}
