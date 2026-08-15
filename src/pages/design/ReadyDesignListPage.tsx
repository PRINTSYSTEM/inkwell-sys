import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Package, Search, Plus, Trash2, Calendar, FileText, User, Image as ImageIcon, X, RefreshCw, ChevronLeft, ChevronRight, XCircle, Flame, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { apiRequest, API_SUFFIX } from "@/apis";
import { cn } from "@/lib/utils";
import { EditDesignNotesDialog } from "@/components/design/EditDesignNotesDialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { designStatusLabels, orderStatusLabels, orderDetailItemStatusLabels } from "@/lib/status-utils";
import {
  useReadyDesigns,
  useCustomers,
  useCustomerAddresses,
  useCustomer,
  useCreateCustomerAddress,
  useCreateOrderFromReadyDesigns,
  useUpdateReadyDesign,
  useDeleteReadyDesign,
  useResetReadyDesignAvailableQuantity,
  useCancelDesignFromPool,
  useAuth,
} from "@/hooks";
import { ROLE } from "@/constants";
import type { ReadyDesignResponse } from "@/Schema";

// Component to render image thumbnail for each ready design
function DesignImageThumbnail({
  thumbnailUrl,
  largeImageUrl,
  designName,
}: {
  thumbnailUrl?: string | null;
  largeImageUrl?: string | null;
  designName?: string | null;
}) {
  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const displayUrl = thumbnailUrl || largeImageUrl;

  if (displayUrl && !hasError) {
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPreviewOpen(true);
          }}
          className="relative group w-10 h-10 rounded-lg overflow-hidden border border-border/80 shadow-sm transition-all hover:scale-110 hover:shadow-md cursor-zoom-in bg-white dark:bg-zinc-900 flex items-center justify-center"
        >
          <img
            src={displayUrl}
            alt={designName || ""}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Search className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <ImageViewerDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          imageUrl={largeImageUrl || displayUrl}
          title={designName || ""}
        />
      </>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center border border-border/40">
      <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
}

// Render a status badge for design statuses (keeps label mapping consistent)
function renderStatusBadge(status: string | null | undefined) {
  if (!status) return <StatusBadge status="unknown" label="—" />;
  const label = designStatusLabels[status] || status;
  return <StatusBadge status={status} label={label} />;
}

export default function ReadyDesignListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter & Search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState(() => {
    const searchParam = new URLSearchParams(window.location.search).get("search");
    return searchParam || "";
  });
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // New filters (mirrored from SaleDesignSearch)
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [dimensionsFilter, setDimensionsFilter] = useState("");
  const [debouncedDimensions] = useDebounce(dimensionsFilter, 300);
  const [binhBaiFilter, setBinhBaiFilter] = useState<string>("all");

  // Pagination/Filter reset state
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("ready_design_list_page");
    return saved ? parseInt(saved, 10) || 1 : 1;
  });
  const [pageInput, setPageInput] = useState(() => {
    const saved = sessionStorage.getItem("ready_design_list_page");
    return saved ? String(parseInt(saved, 10) || 1) : "1";
  });
  const ITEMS_PER_PAGE = 100;

  // Sync pageInput with currentPage and persist
  useEffect(() => {
    setPageInput(String(currentPage));
    sessionStorage.setItem("ready_design_list_page", String(currentPage));
  }, [currentPage]);

  // Selected designs
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDesignForNotes, setSelectedDesignForNotes] = useState<any | null>(null);

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Quick address form state
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressString, setNewAddressString] = useState("");
  const [newAddressRecipient, setNewAddressRecipient] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");

  const resetNewAddressForm = () => {
    setNewAddressLabel("");
    setNewAddressString("");
    setNewAddressRecipient("");
    setNewAddressPhone("");
  };

  const handleSaveQuickAddress = async () => {
    if (!targetCustomerIdForAddresses || !newAddressLabel.trim() || !newAddressString.trim()) return;
    try {
      const newAddr = await createAddressMutation.mutateAsync({
        label: newAddressLabel.trim(),
        address: newAddressString.trim(),
        recipientName: newAddressRecipient.trim() || undefined,
        recipientPhone: newAddressPhone.trim() || undefined,
        isDefault: addresses.length === 0,
      });
      if (newAddr && newAddr.id) {
        setSelectedAddressId(newAddr.id.toString());
      }
      setIsAddingNewAddress(false);
      resetNewAddressForm();
    } catch (err) {
      // Error handled by mutation hook toast
    }
  };

  // Fetch design types
  const { data: designTypes = [] } = useQuery({
    queryKey: ["design-types"],
    queryFn: async () => {
      const res = await apiRequest.get(API_SUFFIX.DESIGN_TYPES);
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload?.items && Array.isArray(payload.items)) return payload.items;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const selectedTypeId = selectedTypeName
    ? (designTypes.find((t: any) => t.name === selectedTypeName)?.id ?? null)
    : null;

  // Fetch materials (filtered by type if selected)
  const { data: materialOptions = [] } = useQuery<any[]>({
    queryKey: ["materials", selectedTypeId],
    queryFn: async () => {
      if (selectedTypeId) {
        const res = await apiRequest.get(API_SUFFIX.MATERIAL_TYPES_BY_DESIGN_TYPE(selectedTypeId), { params: { status: "active" } });
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.items && Array.isArray(payload.items)) return payload.items;
        return [];
      }
      const res = await apiRequest.get(API_SUFFIX.MATERIAL_TYPES, { params: { pageNumber: 1, pageSize: 100, status: "active" } });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload?.items && Array.isArray(payload.items)) return payload.items;
      return [];
    },
    placeholderData: keepPreviousData,
  });

  // Fetch customers
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    pageNumber: 1,
    pageSize: 50,
    search: debouncedCustomerSearch || undefined,
  });
  const customers = customersData?.items || [];

  // Fetch ready designs
  const readyDesignsParams = useMemo(() => {
    return {
      pageNumber: 1,
      pageSize: 10000,
      customerId: selectedCustomer?.id || undefined,
      search: debouncedSearchQuery.trim() || undefined,
    };
  }, [selectedCustomer, debouncedSearchQuery]);

  const { data: readyDesignsData, isLoading: loadingDesigns, refetch: refetchDesigns } = useReadyDesigns(
    readyDesignsParams
  );
  const designs = readyDesignsData?.items || [];

  const sortedDesigns = useMemo(() => {
    if (!designs) return [];

    let filtered = [...designs];

    const normalize = (value: unknown) =>
      String(value ?? "")
        .trim()
        .toLowerCase();

    const selectedTypeMaterials = new Set(
      selectedTypeName
        ? materialOptions.map((m: any) => normalize(m.name))
        : []
    );

    // Client-side design type filtering. ReadyDesign does not always include
    // designTypeName, so fall back to the material list for the selected type.
    if (selectedTypeName) {
      filtered = filtered.filter((d) => {
        const typeName = (d as any).designTypeName || (d as any).designType?.name;
        if (typeName) return normalize(typeName) === normalize(selectedTypeName);

        const matName = d.materialTypeName || (d as any).materialType?.name;
        return selectedTypeMaterials.has(normalize(matName));
      });
    }

    // Client-side material filtering
    if (materialFilter) {
      filtered = filtered.filter((d) => {
        const matName = d.materialTypeName || (d as any).materialType?.name;
        return normalize(matName) === normalize(materialFilter);
      });
    }

    // Client-side dimensions filtering
    if (debouncedDimensions.trim()) {
      const dimSearch = normalize(debouncedDimensions);
      filtered = filtered.filter((d) => {
        return normalize(d.dimensions).includes(dimSearch);
      });
    }

    // Client-side bình bài filtering
    if (binhBaiFilter === "in-binh-bai") {
      filtered = filtered.filter((d) => d.isInBinhBai);
    } else if (binhBaiFilter === "not-in-binh-bai") {
      filtered = filtered.filter((d) => !d.isInBinhBai);
    }

    return filtered.sort((a, b) => {
      // 1. isInBinhBai first
      const bA = a.isInBinhBai ? 1 : 0;
      const bB = b.isInBinhBai ? 1 : 0;
      if (bA !== bB) return bB - bA;

      // 2. isUrgent next
      const uA = a.isUrgent ? 1 : 0;
      const uB = b.isUrgent ? 1 : 0;
      return uB - uA; // Urgent first
    });
  }, [designs, selectedTypeName, materialFilter, debouncedDimensions, materialOptions, binhBaiFilter]);

  const totalCount = sortedDesigns.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  const paginatedDesigns = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedDesigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedDesigns, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setCurrentPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  // Fetch customer addresses for the selected design's customer
  const targetCustomerIdForAddresses = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const firstSelected = sortedDesigns.find((d) => d.id === selectedIds[0]);
    return firstSelected?.customerId || null;
  }, [selectedIds, sortedDesigns]);

  const { data: addresses = [], isLoading: loadingAddresses } = useCustomerAddresses(
    targetCustomerIdForAddresses,
    !!targetCustomerIdForAddresses
  );

  const { data: customerDetail } = useCustomer(
    targetCustomerIdForAddresses,
    !!targetCustomerIdForAddresses
  );

  const createAddressMutation = useCreateCustomerAddress(
    targetCustomerIdForAddresses || 0
  );

  const handleCreateAddressFromProfile = async () => {
    if (!targetCustomerIdForAddresses || !customerDetail?.address) return;
    try {
      await createAddressMutation.mutateAsync({
        label: "Địa chỉ hồ sơ",
        address: customerDetail.address,
        isDefault: true,
        recipientName: customerDetail.representativeName || customerDetail.name || "Khách hàng",
        recipientPhone: customerDetail.phone || undefined,
      });
    } catch (err) {
      // Error handled by mutation hook toast
    }
  };

  // Order Creation Mutation
  const { mutate: createOrderFromReadyDesigns, loading: isCreatingOrder } =
    useCreateOrderFromReadyDesigns();

  // Reset selected checkboxes if the page or customer filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, selectedCustomer, debouncedSearchQuery, selectedTypeName, materialFilter, debouncedDimensions, binhBaiFilter]);

  // Determine if a row should be disabled for selection
  // Rules: Only allow selecting designs from the SAME customer
  const currentCustomerId = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const firstSelected = sortedDesigns.find((d) => d.id === selectedIds[0]);
    return firstSelected?.customerId || null;
  }, [selectedIds, sortedDesigns]);

  const isRowSelectionDisabled = (design: ReadyDesignResponse) => {
    if (currentCustomerId === null) return false;
    return design.customerId !== currentCustomerId;
  };

  const handleSelectRow = (id: number, design: ReadyDesignResponse) => {
    if (isRowSelectionDisabled(design)) {
      toast.error("Chỉ được phép chọn thiết kế của cùng một khách hàng trong một đơn hàng.");
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    // Select all items belonging to the same customer as the first item
    if (sortedDesigns.length === 0) return;

    // Use the first item's customerId as the rule
    const targetCustId = sortedDesigns[0].customerId;
    const validIdsOnPage = sortedDesigns
      .filter((d) => d.customerId === targetCustId && d.id !== undefined)
      .map((d) => d.id as number);

    setSelectedIds(validIdsOnPage);
  };

  const isAllSelected = useMemo(() => {
    if (sortedDesigns.length === 0) return false;
    const targetCustId = currentCustomerId || sortedDesigns[0].customerId;
    const validPageIds = sortedDesigns
      .filter((d) => d.customerId === targetCustId && d.id !== undefined)
      .map((d) => d.id as number);

    return validPageIds.length > 0 && validPageIds.every((id) => selectedIds.includes(id));
  }, [sortedDesigns, selectedIds, currentCustomerId]);

  const selectedDesignsDetails = useMemo(() => {
    return sortedDesigns.filter((d) => d.id !== undefined && selectedIds.includes(d.id));
  }, [sortedDesigns, selectedIds]);

  // Update Ready Design Mutation (for isUrgent flag)
  const { mutate: updateReadyDesign } = useUpdateReadyDesign();
  const { mutate: deleteReadyDesign } = useDeleteReadyDesign();
  const { mutate: resetAvailableQuantity } = useResetReadyDesignAvailableQuantity();
  const { mutate: cancelDesignFromPool } = useCancelDesignFromPool();
  const [updatingUrgentId, setUpdatingUrgentId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [designToDelete, setDesignToDelete] = useState<ReadyDesignResponse | null>(null);
  const [designToCancelFromPool, setDesignToCancelFromPool] = useState<ReadyDesignResponse | null>(null);
  const canCancelFromPool = user?.role === ROLE.ADMIN || user?.role === ROLE.SALE;

  const handleResetQuantity = async (designId: number) => {
    setResettingId(designId);
    try {
      await resetAvailableQuantity(designId);
    } catch (err) {
      // Error handled in hook
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleUrgent = async (design: ReadyDesignResponse) => {
    if (!design.id) return;
    setUpdatingUrgentId(design.id);
    try {
      await updateReadyDesign({
        id: design.id,
        data: {
          isUrgent: !design.isUrgent,
        },
      });
    } catch (err) {
      // Error handled by mutation hook
    } finally {
      setUpdatingUrgentId(null);
    }
  };

  const handleOpenOrderDialog = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thiết kế");
      return;
    }
    // Set default values (Default to 1 week in the future)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yyyy = nextWeek.getFullYear();
    const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const dd = String(nextWeek.getDate()).padStart(2, '0');
    const defaultDateString = `${yyyy}-${mm}-${dd}`;
    setDeliveryDate(defaultDateString);
    setSelectedAddressId("");
    setNotes("");
    setIsAddingNewAddress(false);
    resetNewAddressForm();

    // Try to auto-select default address if available
    const defaultAddr = addresses.find((a) => a.isDefault);
    if (defaultAddr?.id) {
      setSelectedAddressId(defaultAddr.id.toString());
    } else if (addresses.length > 0 && addresses[0].id) {
      setSelectedAddressId(addresses[0].id.toString());
    }

    setOrderDialogOpen(true);
  };

  // Auto-select address when list becomes available or changes while the dialog is open
  useEffect(() => {
    if (orderDialogOpen && addresses.length > 0) {
      const isValid = addresses.some((a) => a.id?.toString() === selectedAddressId);
      if (!selectedAddressId || !isValid) {
        const defaultAddr = addresses.find((a) => a.isDefault);
        if (defaultAddr?.id) {
          setSelectedAddressId(defaultAddr.id.toString());
        } else if (addresses[0]?.id) {
          setSelectedAddressId(addresses[0].id.toString());
        }
      }
    }
  }, [addresses, orderDialogOpen, selectedAddressId]);

  const handleCreateOrder = async () => {
    if (selectedIds.length === 0) return;

    const payload = {
      readyDesignIds: selectedIds,
      customerAddressId: selectedAddressId ? Number(selectedAddressId) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      note: notes.trim() || undefined,
    };

    try {
      const result = await createOrderFromReadyDesigns(payload);
      setOrderDialogOpen(false);
      setSelectedIds([]);
      if (result?.id) {
        navigate(`/accounting/orders/${result.id}?tab=payment`);
      } else {
        navigate("/accounting/orders");
      }
    } catch (err) {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kho thiết kế chờ lên đơn hàng
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchDesigns()}
            disabled={loadingDesigns}
            className="h-9 w-9 border-stone-200 dark:border-zinc-850 rounded-lg animate-none shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loadingDesigns ? "animate-spin" : ""}`} />
          </Button>

          {selectedIds.length > 0 && (
            <Button
              onClick={handleOpenOrderDialog}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/20 animate-in fade-in duration-300"
            >
              Lên đơn hàng ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 mb-3 shrink-0 border-border/40">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã, tên thiết kế..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Customer filter combo */}
            <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between bg-background border-border/80 h-9 px-3 text-sm font-normal w-[200px]"
                >
                  <span className="truncate">
                    {selectedCustomer
                      ? `KH: ${selectedCustomer.name}`
                      : "Lọc theo khách hàng..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-popover border border-border" align="start">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput
                    placeholder="Tìm khách hàng..."
                    className="h-9 text-sm w-full"
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingCustomers ? "Đang tải..." : "Không tìm thấy khách hàng"}
                    </CommandEmpty>
                    <CommandGroup>
                      {selectedCustomer && (
                        <CommandItem
                          onSelect={() => {
                            setSelectedCustomer(null);
                            setCustomerComboOpen(false);
                            setCurrentPage(1);
                          }}
                          className="py-2 text-sm text-destructive cursor-pointer hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Xóa bộ lọc khách hàng
                        </CommandItem>
                      )}
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id.toString()}
                          onSelect={() => {
                            setSelectedCustomer({ id: customer.id!, name: customer.name! });
                            setCustomerComboOpen(false);
                            setCurrentPage(1);
                          }}
                          className="py-2 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                              }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">Mã: {customer.code}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Design Type */}
            <div className="w-[140px]">
              <Select
                value={selectedTypeName ?? "0"}
                onValueChange={(v) => {
                  setSelectedTypeName(v && v !== "0" ? v : null);
                  setMaterialFilter(null);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tất cả loại</SelectItem>
                  {designTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Material */}
            <div className="w-[155px]">
              <Select
                value={materialFilter ?? "0"}
                onValueChange={(v) => { setMaterialFilter(v && v !== "0" ? v : null); setCurrentPage(1); }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tất cả chất liệu</SelectItem>
                  {materialOptions.map((m: any) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            <Input
              placeholder="Kích thước"
              value={dimensionsFilter}
              onChange={(e) => { setDimensionsFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 text-sm w-[110px]"
            />

            {/* Binh Bai Filter */}
            <div className="w-[150px]">
              <Select
                value={binhBaiFilter}
                onValueChange={(v) => {
                  setBinhBaiFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Bình bài" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả bình bài</SelectItem>
                  <SelectItem value="in-binh-bai">Đang bình bài</SelectItem>
                  <SelectItem value="not-in-binh-bai">Chưa bình bài</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="secondary"
              size="sm"
              className="h-9"
              onClick={() => {
                setSelectedCustomer(null);
                setSearchQuery("");
                setSelectedTypeName(null);
                setMaterialFilter(null);
                setDimensionsFilter("");
                setBinhBaiFilter("all");
                setCurrentPage(1);
              }}
            >
              Làm sạch bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pool Table */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/40">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1 relative">
            <table className="w-full caption-bottom text-sm min-w-[1350px]">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-[45px] text-center"></TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[70px] text-center">Hình ảnh</TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[95px] leading-tight">Mã thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold min-w-[220px]">Tên thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[80px] leading-tight">Người thiết kế</TableHead>
                  <TableHead className="h-9 text-sm font-bold min-w-[180px]">Khách hàng</TableHead>
                  <TableHead className="h-9 text-sm font-bold text-right w-[70px] leading-tight">SL chốt in</TableHead>
                  <TableHead className="h-9 text-sm font-bold text-center w-[110px]">Trạng thái</TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[80px] leading-tight">Kích thước</TableHead>
                  <TableHead className="h-9 text-sm font-bold w-[80px] leading-tight">Chất liệu</TableHead>
                  <TableHead className="h-9 text-sm font-bold min-w-[220px]">Ghi chú</TableHead>
                  <TableHead className="h-9 text-sm font-bold text-right pr-4 w-[95px] leading-tight">Ngày cập nhật</TableHead>
                  <TableHead className="h-9 text-sm font-bold text-center px-1 w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDesigns ? (
                  <TableSkeleton cols={13} rows={8} rowHeight="h-12" />
                ) : paginatedDesigns.length > 0 ? (
                  paginatedDesigns.map((design) => {
                    const isSelected = selectedIds.includes(design.id!);
                    const isDisabled = isRowSelectionDisabled(design);
                    const isPendingUpdate = !!(design as any).isPendingOrderUpdate || !!(design as any).is_pending_order_update;
                    return (
                      <TableRow
                        key={design.id}
                        className={cn(
                          "h-12 transition-all duration-150 relative",
                          isPendingUpdate && "bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",
                          !isPendingUpdate && design.isUrgent && (isSelected ? "bg-red-200/90 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/60 text-red-950 dark:text-red-100 border-l-4 border-l-red-600 shadow-sm" : "bg-red-100/80 hover:bg-red-150/90 dark:bg-red-950/50 dark:hover:bg-red-900/40 text-red-900 dark:text-red-200 border-l-4 border-l-red-600"),
                          !isPendingUpdate && !design.isUrgent && isSelected && "bg-primary/5 hover:bg-primary/10",
                          !isPendingUpdate && !design.isUrgent && !isSelected && "hover:bg-muted/50",
                          isDisabled && "opacity-45"
                        )}
                      >
                        <TableCell className="text-center py-2 w-[45px]">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(design.id!, design)}
                            disabled={isDisabled}
                          />
                        </TableCell>
                        <TableCell className="py-1 w-[70px]">
                          <div className="flex items-center justify-center w-full">
                            <DesignImageThumbnail
                              thumbnailUrl={design.designThumbnailUrl}
                              largeImageUrl={design.designImageUrl}
                              designName={design.designName}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 font-mono font-semibold text-sm w-[95px] break-words">
                          {design.designCode}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-semibold break-words min-w-[220px]" title={design.designName || ""}>
                          {design.designName}
                        </TableCell>
                        <TableCell
                          className="py-2 text-xs font-medium break-words w-[80px] leading-snug"
                          title={design.designerName || "—"}
                        >
                          {design.designerName || "—"}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium break-words min-w-[180px]">
                          {design.customerName}
                        </TableCell>
                        <TableCell className="py-2 text-sm font-medium text-right whitespace-nowrap font-mono w-[70px]">
                          {(() => {
                            const qty = (design as any).requestedQuantity ?? design.quantity ?? 0;
                            const typeName = (design as any).designTypeName || (design as any).designType?.name || "";
                            const matName = design.materialTypeName || (design as any).materialType?.name || "";
                            const isDecal = typeName.toLowerCase().includes("decal") || matName.toLowerCase().includes("decal");
                            const isBo = isDecal && (
                              design.sidesClassification === "two_side" ||
                              (design as any).sidesClassificationOption === "two_side" ||
                              (design as any).sidesClassification === "two_side" ||
                              (design as any).unitName?.toLowerCase()?.includes("bộ")
                            );
                            return `${Number(qty).toLocaleString("vi-VN")}${isBo ? " bộ" : ""}`;
                          })()}
                        </TableCell>
                        <TableCell className="py-2 text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1 justify-center">
                            <StatusBadge
                              status={design.status || ""}
                              label={
                                orderDetailItemStatusLabels[design.status || ""] ||
                                orderStatusLabels[design.status || ""] ||
                                designStatusLabels[design.status || ""] ||
                                design.status ||
                                "N/A"
                              }
                            />
                            {design.isUrgent && (
                              <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] animate-pulse px-1.5 py-0.5 whitespace-nowrap shadow-sm">
                                Giao gấp
                              </Badge>
                            )}
                            {isPendingUpdate && (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] animate-pulse px-1.5 py-0.5 whitespace-nowrap">
                                Cần cập nhật đơn hàng
                              </Badge>
                            )}
                            {design.isInBinhBai && (
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] px-1 py-0.5 whitespace-nowrap flex items-center gap-0.5 cursor-pointer select-none">
                                      <span>Đang BB: {design.binhBaiQuantity ?? 0}</span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-zinc-950 text-white border border-zinc-800 p-2.5 rounded-lg shadow-xl max-w-xs z-50">
                                    <p className="font-semibold text-xs mb-1 text-zinc-300">Mã các bài đang chứa thiết kế:</p>
                                    <ul className="list-disc list-inside text-xs font-mono text-zinc-400">
                                      {design.activeBinhBaiCodes && design.activeBinhBaiCodes.length > 0 ? (
                                        design.activeBinhBaiCodes.map((code) => <li key={code}>{code}</li>)
                                      ) : (
                                        <li>Không rõ</li>
                                      )}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn("py-2 font-mono text-xs w-[80px] whitespace-nowrap", design.isUrgent ? "text-red-650/80 dark:text-red-400/80" : "text-muted-foreground")}>
                          {design.dimensions || "—"}
                        </TableCell>
                        <TableCell className={cn("py-2 text-xs font-medium break-words w-[80px]", design.isUrgent ? "text-red-650/80 dark:text-red-400/80" : "text-muted-foreground")} title={design.materialTypeName || ""}>
                          {design.materialTypeName}
                          {(() => {
                            const typeName = (design as any).designTypeName || (design as any).designType?.name || "";
                            const matName = design.materialTypeName || (design as any).materialType?.name || "";
                            const isDecalDesign = typeName.toLowerCase().includes("decal");
                            const isPaperMaterial = matName.toLowerCase().includes("giấy") || matName.toLowerCase().includes("giay");
                            const isDecalPaper = isDecalDesign && isPaperMaterial;
                            return (design as any).basisWeight && !isDecalPaper ? ` (${(design as any).basisWeight} gsm)` : "";
                          })()}
                        </TableCell>
                        <TableCell className={cn("py-2 text-xs break-words min-w-[220px] whitespace-pre-wrap font-mono", design.isUrgent ? "text-red-800 dark:text-red-200 font-medium" : "text-muted-foreground")} title={design.notes || ""}>
                          {design.notes || "—"}
                        </TableCell>
                        <TableCell className={cn("py-2 text-xs text-right pr-4 w-[95px]", design.isUrgent ? "text-red-650/80 dark:text-red-355/80" : "text-muted-foreground")}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (design.designId) {
                                      navigate(`/design/detail/${design.designId}`);
                                    }
                                  }}
                                  className="text-right items-end hover:text-primary hover:underline transition-colors focus:outline-none flex flex-col font-mono ml-auto"
                                >
                                  {design.updatedAt ? (
                                    (() => {
                                      const date = new Date(design.updatedAt);
                                      if (isNaN(date.getTime())) return "—";
                                      const day = String(date.getDate()).padStart(2, "0");
                                      const month = String(date.getMonth() + 1).padStart(2, "0");
                                      const year = date.getFullYear();
                                      const hours = String(date.getHours()).padStart(2, "0");
                                      const minutes = String(date.getMinutes()).padStart(2, "0");
                                      const seconds = String(date.getSeconds()).padStart(2, "0");
                                      return (
                                        <>
                                          <span>{day}/{month}/{year}</span>
                                          <span className="text-[10px] opacity-85 text-muted-foreground/80">{hours}:{minutes}:{seconds}</span>
                                        </>
                                      );
                                    })()
                                  ) : (
                                    "—"
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="p-3 max-w-[280px] bg-popover text-popover-foreground border shadow-md rounded-md space-y-1.5 text-xs">
                                <div className="font-semibold border-b pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                  Thời gian thiết kế
                                </div>
                                <div className="space-y-1.5 text-xs text-left">
                                  <div className="flex justify-between gap-6">
                                    <span className="text-muted-foreground whitespace-nowrap">Ngày tạo:</span>
                                    <span className="font-medium text-foreground">
                                      {design.createdAt
                                        ? new Date(design.createdAt).toLocaleString("vi-VN", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })
                                        : "—"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-6">
                                    <span className="text-muted-foreground whitespace-nowrap">Cập nhật cuối:</span>
                                    <span className="font-medium text-foreground">
                                      {design.updatedAt
                                        ? new Date(design.updatedAt).toLocaleString("vi-VN", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit",
                                        })
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-2 text-center px-1 w-[80px]" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-0.5 place-items-center w-fit mx-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={updatingUrgentId === design.id}
                              className={cn(
                                "h-7 w-7 rounded-lg transition-all",
                                design.isUrgent
                                  ? "text-red-600 bg-red-100/90 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400"
                                  : "text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              )}
                              onClick={() => handleToggleUrgent(design)}
                              title={design.isUrgent ? "Hủy giao gấp" : "Đánh dấu giao gấp"}
                            >
                              {updatingUrgentId === design.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Flame className={cn("h-3.5 w-3.5", design.isUrgent ? "fill-red-600 text-red-600 animate-pulse" : "")} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 rounded-lg"
                              onClick={() => setSelectedDesignForNotes({
                                id: design.designId || design.id,
                                code: design.designCode || (design as any).code,
                                designName: design.designName,
                                notes: design.notes,
                              })}
                              title="Sửa / thêm ghi chú thiết kế"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {isPendingUpdate && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resettingId === design.id}
                                className="col-span-2 h-6 px-1.5 text-[10px] font-bold border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-sm shrink-0 my-0.5"
                                onClick={() => handleResetQuantity(design.id!)}
                                title="Đồng bộ số lượng khả dụng và hoàn tất cập nhật đơn hàng"
                              >
                                {resettingId === design.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <RefreshCw className="h-3 w-3 mr-1 text-amber-600" />
                                )}
                                Cập nhật SL
                              </Button>
                            )}
                            {canCancelFromPool && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-amber-650 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-550 dark:hover:bg-amber-950/30 rounded-lg"
                                onClick={() => setDesignToCancelFromPool(design)}
                                title="Hủy thiết kế và xóa khỏi kho"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                              onClick={() => setDesignToDelete(design)}
                              title="Xóa thiết kế khỏi kho"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">Không có thiết kế nào sẵn sàng trong kho</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>

          {/* Pagination & Total Count */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 shrink-0 bg-background">
              <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
                <div className="font-semibold text-foreground">
                  Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} trong tổng số {totalCount} thiết kế
                </div>
                {selectedIds.length > 0 && (
                  <span className="text-indigo-650 dark:text-indigo-400 font-medium">Đã chọn {selectedIds.length} thiết kế</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold px-2 py-1"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loadingDesigns}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Trang trước
                </Button>
                <div className="flex items-center space-x-1">
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
                    className="w-12 h-8 text-center text-xs font-semibold px-1"
                    disabled={loadingDesigns}
                  />
                  <span className="text-xs text-muted-foreground">
                    / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold px-2 py-1"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loadingDesigns}
                >
                  Trang sau
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Creation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg bg-background border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold text-foreground">
              Lên đơn hàng từ kho thiết kế
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn đang tạo đơn hàng cho khách hàng: <span className="font-bold text-foreground">{selectedDesignsDetails[0]?.customerName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
            {/* Selected designs summary */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Các thiết kế đã chọn ({selectedDesignsDetails.length})</Label>
              <div className="bg-muted/40 border rounded-lg p-2.5 space-y-2.5 max-h-[200px] overflow-y-auto">
                {selectedDesignsDetails.map((item) => (
                  <div key={item.id} className="flex flex-col text-xs border-b border-border/40 pb-2.5 last:border-0 last:pb-0 last:border-b-0 gap-1.5">
                    {/* Top row: Code and Quantity */}
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-muted-foreground">{item.designCode}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        SL đặt: {((item as any).availableQuantityForOrdering ?? item.quantity ?? 0).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {/* Bottom row: Name and Urgent Checkbox */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium break-words text-foreground/80" title={item.designName || ""}>
                          {item.designName}
                        </span>
                        {item.notes && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold break-words mt-0.5" title={item.notes}>
                            Ghi chú: {item.notes}
                          </span>
                        )}
                      </div>

                      {item.isUrgent && (
                        <div className="inline-flex items-center gap-1.5 shrink-0 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-2 py-1 rounded-md">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                          </span>

                          <span className="text-xs font-medium text-red-700 dark:text-red-300">
                            Giao gấp
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-foreground flex items-center gap-1">
                  Địa chỉ giao hàng
                </Label>
                <div className="flex items-center gap-2.5">
                  {addresses.length > 0 && customerDetail?.address && !addresses.some(a => a.address === customerDetail.address) && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold"
                      disabled={createAddressMutation.isPending}
                      onClick={handleCreateAddressFromProfile}
                    >
                      {createAddressMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Thêm từ hồ sơ
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center gap-1"
                    onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  >
                    <Plus className="h-3 w-3" />
                    {isAddingNewAddress ? "Hủy" : "Tạo mới"}
                  </Button>
                </div>
              </div>
              {!isAddingNewAddress ? (
                <>
                  {loadingAddresses ? (
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Đang tải sổ địa chỉ...
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 p-2.5 rounded-lg">
                        Khách hàng chưa đăng ký địa chỉ giao hàng nào. Vui lòng tạo nhanh địa chỉ ở nút trên.
                      </div>
                      {customerDetail?.address ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1.5 py-2.5 h-auto border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold transition-all shadow-sm"
                          disabled={createAddressMutation.isPending}
                          onClick={handleCreateAddressFromProfile}
                        >
                          {createAddressMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          Sử dụng địa chỉ hồ sơ: <span className="underline truncate max-w-[200px]" title={customerDetail.address}>{customerDetail.address}</span>
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground italic pl-1">
                          (Hồ sơ khách hàng cũng chưa đăng ký địa chỉ liên hệ)
                        </div>
                      )}
                    </div>
                  ) : (
                    <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      <SelectTrigger className="h-auto min-h-11 py-1.5 bg-background border-border/80 [&>span]:line-clamp-none [&>span]:w-full [&>span]:flex [&>span]:flex-col [&>span]:items-start [&>span]:justify-center">
                        <SelectValue placeholder="Chọn địa chỉ giao hàng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id!.toString()} className="text-sm">
                            <div className="flex flex-col text-left min-w-0">
                              <span className="font-medium">
                                {addr.label} {addr.isDefault && <Badge className="ml-1 py-0 scale-90">Mặc định</Badge>}
                              </span>
                              {addr.address && (
                                <span className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[360px] md:max-w-[420px]">{addr.address}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              ) : (
                <div className="p-3 bg-muted/40 border rounded-lg space-y-3 mt-2 animate-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Tên gợi nhớ *</Label>
                      <Input
                        placeholder="VD: Văn phòng, Kho..."
                        value={newAddressLabel}
                        onChange={(e) => setNewAddressLabel(e.target.value)}
                        className="h-9 text-xs bg-background border-border/80"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Số điện thoại</Label>
                      <Input
                        placeholder="Số điện thoại nhận"
                        value={newAddressPhone}
                        onChange={(e) => setNewAddressPhone(e.target.value)}
                        className="h-9 text-xs bg-background border-border/80"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Người nhận</Label>
                    <Input
                      placeholder="Tên người nhận hàng"
                      value={newAddressRecipient}
                      onChange={(e) => setNewAddressRecipient(e.target.value)}
                      className="h-9 text-xs bg-background border-border/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Địa chỉ chi tiết *</Label>
                    <Input
                      placeholder="Nhập địa chỉ giao hàng..."
                      value={newAddressString}
                      onChange={(e) => setNewAddressString(e.target.value)}
                      className="h-9 text-xs bg-background border-border/80"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1 border-t border-border/40">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => {
                        setIsAddingNewAddress(false);
                        resetNewAddressForm();
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-7 text-xs px-3 font-semibold"
                      disabled={createAddressMutation.isPending || !newAddressLabel.trim() || !newAddressString.trim()}
                      onClick={handleSaveQuickAddress}
                    >
                      {createAddressMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Lưu địa chỉ
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Ngày giao hàng
              </Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-11 bg-background"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Ghi chú đơn hàng
              </Label>
              <Textarea
                placeholder="Ghi chú yêu cầu giao nhận, tiến độ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] bg-background resize-none border-border/80"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setOrderDialogOpen(false)}
              disabled={isCreatingOrder}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={isCreatingOrder || selectedIds.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo đơn...
                </>
              ) : (
                "Xác nhận tạo đơn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!designToDelete} onOpenChange={(open) => !open && setDesignToDelete(null)}>
        <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Xác nhận xóa thiết kế
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Bạn có chắc chắn muốn xóa thiết kế <span className="font-bold text-foreground">{designToDelete?.designCode}</span> ({designToDelete?.designName}) khỏi kho thiết kế sẵn sàng không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setDesignToDelete(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (designToDelete?.id) {
                  await deleteReadyDesign(designToDelete.id);
                  setDesignToDelete(null);
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel from Pool Confirmation Dialog */}
      <Dialog open={!!designToCancelFromPool} onOpenChange={(open) => !open && setDesignToCancelFromPool(null)}>
        <DialogContent className="max-w-md bg-background border border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-600" />
              Xác nhận hủy và xóa thiết kế khỏi kho
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Bạn có chắc chắn muốn xóa thiết kế <span className="font-bold text-foreground">{designToCancelFromPool?.designCode}</span> khỏi kho và chuyển trạng thái thiết kế <span className="font-bold text-foreground">{designToCancelFromPool?.designName}</span> thành <span className="font-bold text-destructive">"Hủy"</span> không?
              <p className="mt-2 text-xs font-semibold text-amber-600">Hành động này không thể hoàn tác sau khi xác nhận.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-border/40 gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setDesignToCancelFromPool(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              onClick={async () => {
                if (designToCancelFromPool?.designId) {
                  await cancelDesignFromPool(designToCancelFromPool.designId);
                  setDesignToCancelFromPool(null);
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedDesignForNotes && (
        <EditDesignNotesDialog
          open={!!selectedDesignForNotes}
          onOpenChange={(open) => {
            if (!open) setSelectedDesignForNotes(null);
          }}
          designId={selectedDesignForNotes.id}
          designCode={selectedDesignForNotes.code}
          designName={selectedDesignForNotes.designName}
          currentNotes={selectedDesignForNotes.notes}
        />
      )}
    </div>
  );
}
