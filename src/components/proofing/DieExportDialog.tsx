import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Copy,
  Hash,
  User,
  Ruler,
  Package,
} from "lucide-react";
import { DieListDialog } from "@/components/dies/DieListDialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { useRecordDieExportWithFile } from "@/hooks/use-proofing-order";
import { useActiveDieVendors, useCreateVendor } from "@/hooks/use-vendor";
import { useSupplierTypes } from "@/hooks/use-supplier-type";
import {
  useCreateDie,
  useSearchDies,
  useAssignDieToProofingOrder,
  useDiesByProofingOrder,
  useRemoveDieFromProofingOrder,
  useReplaceDie,
} from "@/hooks/use-die";
import type { ProofingOrderResponse } from "@/Schema/proofing-order.schema";
import type { DieResponse, DieListParams } from "@/Schema";
import { getErrorMessage } from "@/services/BaseService";
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDieSize } from "@/utils/format-die-size";
import {
  dieUsageTypeLabels,
  dieStatusLabels,
  dieLocationLabels,
} from "@/lib/status-utils";

interface DieExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofingOrderId: number;
  proofingOrder?: ProofingOrderResponse | null;
  onSuccess?: () => void;
  mode?: "export" | "replace" | "add";
  replacingDieId?: number;
  initialSelectedDieIds?: number[];
  initialSize?: string;
  initialCategory?: "box" | "decal";
}

export function DieExportDialog({
  open,
  onOpenChange,
  proofingOrderId,
  proofingOrder,
  onSuccess,
  mode = "export",
  replacingDieId,
  initialSelectedDieIds,
  initialSize,
  initialCategory,
}: DieExportDialogProps) {
  const [dieCount, setDieCount] = useState<number>(1);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState<string>("");
  const [vendorPhone, setVendorPhone] = useState<string>("");
  const [vendorEmail, setVendorEmail] = useState<string>("");
  const [vendorAddress, setVendorAddress] = useState<string>("");
  const [vendorNote, setVendorNote] = useState<string>("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [dieFiles, setDieFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [receivedAtManual, setReceivedAtManual] = useState<string>("");
  const [dieNotes, setDieNotes] = useState<Record<number, string>>({});
  const [newDieNote, setNewDieNote] = useState<string>("");
  const [dieAction, setDieAction] = useState<"select" | "create">("select");

  // For selecting existing dies
  const [selectedDieIds, setSelectedDieIds] = useState<number[]>([]);
  const [isBrowsingDie, setIsBrowsingDie] = useState(false);
  const [designCode, setDesignCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [size, setSize] = useState("");
  const [proofingOrderCode, setProofingOrderCode] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [copiedProofingOrderCode, setCopiedProofingOrderCode] = useState<
    string | null
  >(null);

  const [debouncedDesignCode] = useDebounce(designCode, 300);
  const [debouncedCustomerName] = useDebounce(customerName, 300);
  const [debouncedSize] = useDebounce(size, 300);
  const [debouncedProofingOrderCode] = useDebounce(proofingOrderCode, 300);

  // For creating new die
  const [dieName, setDieName] = useState<string>("");
  const [dieCode, setDieCode] = useState<string>("");
  const [dieType, setDieType] = useState<string>("");
  const [dieSize, setDieSize] = useState<string>("");
  const [dieLength, setDieLength] = useState<number | undefined>(undefined);
  const [dieWidth, setDieWidth] = useState<number | undefined>(undefined);
  const [dieHeight, setDieHeight] = useState<number | undefined>(undefined);
  const [dieImage, setDieImage] = useState<File | null>(null);
  const [dieImagePreview, setDieImagePreview] = useState<string | null>(null);
  const [dieCategory, setDieCategory] = useState<string>("box");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedDecalDieSizes, setSelectedDecalDieSizes] = useState<string[]>([]);
  const [isReusable, setIsReusable] = useState<boolean>(true);

  const queryClient = useQueryClient();
  const { data: vendors, isLoading: loadingVendors } = useActiveDieVendors();
  const { data: supplierTypesResp } = useSupplierTypes({ page: 1, size: 1000 });
  const supplierTypes = supplierTypesResp?.items || [];
  const { mutateAsync: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: recordDie, isPending: recordingDie } =
    useRecordDieExportWithFile();
  const { mutateAsync: createDie, isPending: creatingDie } = useCreateDie();
  const { mutateAsync: assignDie, isPending: assigningDie } =
    useAssignDieToProofingOrder();
  const { mutate: removeDie, isPending: removingDie } =
    useRemoveDieFromProofingOrder();
  const { mutateAsync: replaceDie, isPending: replacingDie } = useReplaceDie();

  // Search dies with design code, size, customer name, and proofing order code
  const searchParams = useMemo((): DieListParams | undefined => {
    if (!open || dieAction !== "select") return undefined;

    return {
      q: debouncedDesignCode.trim() || "",
      size: debouncedSize.trim() || "",
      customerName: debouncedCustomerName.trim() || "",
      proofingOrderCode: debouncedProofingOrderCode.trim() || "",
      category: categoryFilter === "all" ? undefined : categoryFilter,
      isUsable: true,
      pageSize: 100,
      pageNumber: 1,
    };
  }, [
    open,
    dieAction,
    categoryFilter,
    debouncedDesignCode,
    debouncedSize,
    debouncedCustomerName,
    debouncedProofingOrderCode,
  ]);

  const {
    data: searchDiesData,
    isLoading: isLoadingDies,
    isError: searchError,
  } = useSearchDies(searchParams);

  const allDies = searchDiesData?.items || [];

  // Fetch dies already assigned to this proofing order
  const { data: assignedDies } = useDiesByProofingOrder(proofingOrderId, open);
  const assignedDieIds = useMemo(
    () => new Set(assignedDies?.map((ad) => ad.dieId).filter(Boolean) || []),
    [assignedDies],
  );

  // Extract design types and dimensions from proofing order
  const proofingOrderDesigns = useMemo(() => {
    if (!proofingOrder?.proofingOrderDesigns) return [];
    return proofingOrder.proofingOrderDesigns
      .map((pod) => pod.design)
      .filter((d) => d != null);
  }, [proofingOrder]);

  // Get unique design types from proofing order
  const designTypes = useMemo(() => {
    const types = new Set<string>();
    proofingOrderDesigns.forEach((design) => {
      if (design?.designType?.name) {
        types.add(design.designType.name.toLowerCase());
      }
    });
    return Array.from(types);
  }, [proofingOrderDesigns]);

  // Get dimensions from designs (for filtering by size)
  const designDimensions = useMemo(() => {
    const dims: Array<{
      length: number;
      width?: number;
      height: number;
      designTypeName: string;
    }> = [];
    proofingOrderDesigns.forEach((design) => {
      if (design?.length && design?.height) {
        dims.push({
          length: design.length,
          width: design.width,
          height: design.height,
          designTypeName: design.designType?.name || "",
        });
      }
    });
    return dims;
  }, [proofingOrderDesigns]);

  // Helper function to format dimensions to string
  const formatDimensions = useCallback(
    (length: number, width: number | undefined, height: number): string => {
      if (width && width > 0) {
        return `${length}x${width}x${height}`;
      }
      return `${length}x${height}`;
    },
    [],
  );

  // All designs with their dimension info for reference display
  const allDesignDimensions = useMemo(() => {
    return proofingOrderDesigns
      .filter((d) => d != null)
      .map((design) => ({
        code: design!.code || "",
        designTypeName: design!.designType?.name || "",
        length: design!.length ?? undefined,
        width: design!.width ?? undefined,
        height: design!.height ?? undefined,
        sizeStr: formatDimensions(
          design!.length || 0,
          design!.width ?? undefined,
          design!.height || 0,
        ),
      }));
  }, [proofingOrderDesigns, formatDimensions]);

  // Candidate size options for Decal dies (dieSizes)
  const candidateDecalSizes = useMemo(() => {
    const list: { label: string; value: string }[] = [];
    allDesignDimensions.forEach((d) => {
      const parts = [d.length, d.width, d.height].filter((n) => n != null && n > 0);
      if (parts.length > 0) {
        const val = parts.join("×");
        if (!list.some((item) => item.value === val)) {
          list.push({ label: `Bài ${d.code || "mẫu"}`, value: val });
        }
      }
    });

    const typedParts = [dieLength, dieWidth, dieHeight].filter((n) => n != null && n > 0);
    if (typedParts.length > 0) {
      const customVal = typedParts.join("×");
      if (!list.some((item) => item.value === customVal)) {
        list.push({ label: "Kích thước vừa nhập", value: customVal });
      }
    }
    return list;
  }, [allDesignDimensions, dieLength, dieWidth, dieHeight]);

  // Helper function to check if die matches design type
  const matchesDesignType = useCallback(
    (
      dieName: string | null | undefined,
      dieType: string | null | undefined,
      designTypes: string[],
    ): boolean => {
      if (designTypes.length === 0) return true; // No filter if no design types
      if (!dieName && !dieType) return false; // No match if die has no name or type

      const dieNameLower = (dieName || "").toLowerCase();
      const dieTypeLower = (dieType || "").toLowerCase();
      const matches = designTypes.some((dt) => {
        // Check if design type is contained in die name or die type
        // OR if die type/name is contained in design type (for partial matches like "Decal" matching "decal cuộn")
        return (
          dieNameLower.includes(dt) ||
          dieTypeLower.includes(dt) ||
          dt.includes(dieNameLower) ||
          dt.includes(dieTypeLower)
        );
      });
      return matches;
    },
    [],
  );

  // Helper function to check if die size matches dimensions
  const matchesDimensions = useCallback(
    (
      dieSize: string | null | undefined,
      dimensions: Array<{
        length: number;
        width?: number;
        height: number;
        designTypeName: string;
      }>,
    ): boolean => {
      if (!dieSize || dimensions.length === 0) return true; // No filter if no dimensions
      // Normalize die size: remove spaces, handle "x0x" patterns
      let dieSizeNormalized = dieSize.toLowerCase().replace(/\s/g, "");
      // Replace patterns like "x0x" or "x0" with just "x" to normalize width=0 cases
      dieSizeNormalized = dieSizeNormalized.replace(/x0+x/g, "x");
      dieSizeNormalized = dieSizeNormalized.replace(/x0+$/g, "x");

      const matches = dimensions.some((dim) => {
        const formatted = formatDimensions(dim.length, dim.width, dim.height);
        const formattedLower = formatted.toLowerCase();
        // Check if normalized die size contains the formatted dimension
        const result = dieSizeNormalized.includes(formattedLower);
        return result;
      });
      return matches;
    },
    [formatDimensions],
  );

  // Filter out already assigned dies only (design type/dimensions are used for sorting/prioritization, not filtering)
  const availableDies = useMemo(() => {
    // Include all dies, but prioritize those already assigned to this order
    let filtered = allDies.filter((die) => !!die.id);

    // Sort dies
    filtered = filtered.sort((a, b) => {
      // Priority 1: Already assigned to this order (for re-exporting)
      const aAssigned = assignedDieIds.has(a.id!);
      const bAssigned = assignedDieIds.has(b.id!);
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;

      // Priority 2: Matches design dimensions
      const aMatchesDim =
        designDimensions.length > 0
          ? matchesDimensions(a.size, designDimensions)
          : false;
      const bMatchesDim =
        designDimensions.length > 0
          ? matchesDimensions(b.size, designDimensions)
          : false;

      if (aMatchesDim !== bMatchesDim) return aMatchesDim ? -1 : 1;

      return 0;
    });

    return filtered;
  }, [
    allDies,
    assignedDieIds,
    designDimensions,
    matchesDimensions,
  ]);

  // Auto-fill die name, code, type and size when creating new die based on proofing order designs
  useEffect(() => {      if (proofingOrderDesigns.length > 0) {
        // Aggregate all types and sizes
        const allTypes = Array.from(new Set(allDesignDimensions.map(d => d.designTypeName))).filter(Boolean);
        const allSizes = allDesignDimensions.map(d => d.sizeStr).filter(Boolean);
        
        const combinedTypes = allTypes.join(", ");
        const combinedSizes = allSizes.join(", ");
        const suggestedName = `${combinedTypes} ${combinedSizes}`.trim();

        setDieName(suggestedName);
        setDieSize(combinedSizes);
        setDieType(combinedTypes);
        
        // Code from first design as prefix or main ref
        const firstDesign = proofingOrderDesigns[0];
        if (firstDesign?.code) {
          setDieCode(firstDesign.code);
        }

        // Individual numeric dimensions from first design (as a fallback/primary reference)
        if (firstDesign) {
          setDieLength(firstDesign.length || undefined);
          setDieWidth(firstDesign.width || undefined);
          setDieHeight(firstDesign.height || undefined);
        }
      }
  }, [
    open,
    dieAction,
    proofingOrderDesigns,
    allDesignDimensions,
    dieName,
    dieCode,
    dieType,
    dieSize,
  ]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDieCount(1);
      setVendorId(null);
      setVendorName("");
      setVendorPhone("");
      setVendorEmail("");
      setVendorAddress("");
      setVendorNote("");
      setIsCreatingVendor(false);
      setVendorSearchOpen(false);
      setDieFiles([]);
      setImagePreviews([]);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setReceivedAtManual(convertISOToLocalDateTime(tomorrow.toISOString()));
      setDieNotes({});
      setNewDieNote("");
      setDieAction("select");
      // Initialize selected dies from prop if provided
      if (initialSelectedDieIds && initialSelectedDieIds.length > 0) {
        setSelectedDieIds(initialSelectedDieIds);
      } else {
        setSelectedDieIds([]);
      }
      setDesignCode("");
      setCustomerName("");
      // Initialize size filter if provided
      if (initialSize) {
        setSize(initialSize);
      } else {
        setSize("");
      }
      setProofingOrderCode("");
      setDieName("");
      setDieSize("");
      setDieLength(undefined);
      setDieWidth(undefined);
      setDieHeight(undefined);
      const designTypeName = (
        (proofingOrder as any)?.designType?.name ||
        (proofingOrder as any)?.designTypeName ||
        proofingOrder?.itemType ||
        proofingOrder?.proofingOrderDesigns?.[0]?.design?.designType?.name ||
        (proofingOrder?.proofingOrderDesigns?.[0]?.design as any)?.designTypeName ||
        (proofingOrder as any)?.items?.[0]?.designTypeName ||
        proofingOrder?.materialType?.name ||
        ""
      ).toLowerCase();

      const isDecalOrder =
        initialCategory === "decal" ||
        designTypeName.includes("decal") ||
        designTypeName.includes("de cal") ||
        designTypeName.includes("nhãn") ||
        designTypeName.includes("sticker");

      const defaultCategory = isDecalOrder ? "decal" : "box";
      setDieCategory(defaultCategory);
      setCategoryFilter(defaultCategory);
      setSelectedDecalDieSizes([]);
      setIsReusable(true);
    }
  }, [open, initialSelectedDieIds, initialSize, initialCategory, proofingOrder]);

  // Cleanup image preview URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      if (dieImagePreview) {
        URL.revokeObjectURL(dieImagePreview);
      }
    };
  }, [imagePreviews, dieImagePreview]);

  // Helper function to format local datetime with timezone offset
  const formatLocalDateTimeWithOffset = useCallback((date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes <= 0 ? "+" : "-";

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${pad(offsetHours)}:${pad(offsetMins)}`;
  }, []);

  const convertLocalDateTimeToISO = useCallback(
    (localDateTime: string): string => {
      const date = new Date(localDateTime);
      return formatLocalDateTimeWithOffset(date);
    },
    [formatLocalDateTimeWithOffset],
  );

  const convertISOToLocalDateTime = useCallback((isoString: string | null | undefined): string => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, "0");
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  }, []);

  const receivedAt = useMemo(() => {
    return receivedAtManual
      ? convertLocalDateTimeToISO(receivedAtManual)
      : null;
  }, [receivedAtManual, convertLocalDateTimeToISO]);

  const handleCreateVendor = async () => {
    if (!vendorName.trim()) {
      toast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }

    const dieSupplierType = supplierTypes.find(
      (t) => t.code?.toUpperCase() === "DIE"
    );

    createVendor(
      {
        name: vendorName.trim(),
        phone: vendorPhone.trim() || null,
        email: vendorEmail.trim() || null,
        address: vendorAddress.trim() || null,
        note: vendorNote.trim() || null,
        vendorType: dieSupplierType?.code || "DIE",
        supplierTypeId: dieSupplierType?.id,
      },
      {
        onSuccess: (newVendor) => {
          setVendorId(newVendor.id);
          setIsCreatingVendor(false);
          setVendorName("");
          setVendorPhone("");
          setVendorEmail("");
          setVendorAddress("");
          setVendorNote("");
          toast.success("Đã tạo nhà cung cấp mới");
        },
        onError: (error) => {
          toast.error("Không thể tạo nhà cung cấp", {
            description: getErrorMessage(error, "Không thể tạo nhà cung cấp"),
          });
        },
      },
    );
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" không phải là ảnh`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" vượt quá 10MB`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setDieFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }

    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setDieFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
    setImagePreviews((prev) => {
      const urlToRevoke = prev[index];
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDieImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File phải là ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File vượt quá 10MB");
      return;
    }

    setDieImage(file);
    if (dieImagePreview) {
      URL.revokeObjectURL(dieImagePreview);
    }
    setDieImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const toggleDieSelection = (dieId: number) => {
    setSelectedDieIds((prev) => {
      if (prev.includes(dieId)) {
        return prev.filter((id) => id !== dieId);
      } else {
        return [...prev, dieId];
      }
    });
  };

  const handleCopyProofingOrderCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedProofingOrderCode(code);
      toast.success("Đã sao chép mã bài", {
        description: `Mã bài "${code}" đã được sao chép vào clipboard`,
      });
      setTimeout(() => {
        setCopiedProofingOrderCode(null);
      }, 2000);
    } catch (error) {
      toast.error("Không thể sao chép mã bài", {
        description: "Đã xảy ra lỗi khi sao chép vào clipboard",
      });
    }
  };

  const handleSubmit = async () => {
    // Validate vendor - chỉ khi tạo khuôn mới
    if (dieAction === "create" && !vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị làm khuôn bế");
      return;
    }

    // Validate images - chỉ khi tạo khuôn mới
    if (dieAction === "create") {
      if (dieFiles.length === 0) {
        toast.error("Vui lòng chọn ít nhất một ảnh khuôn bế");
        return;
      }
    }

    // Validate die selection/creation
    if (dieAction === "select") {
      if (selectedDieIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một khuôn bế từ danh sách");
        return;
      }
    }

    try {
      // Step 1: Create vendor if needed - chỉ khi tạo khuôn mới
      let finalVendorId = vendorId;
      if (dieAction === "create" && !finalVendorId && vendorName.trim()) {
        const newVendor = await createVendor({
          name: vendorName.trim(),
          phone: null,
          email: null,
          address: null,
          note: null,
          vendorType: "die",
        });
        finalVendorId = newVendor.id;
      }

      // Step 2: Create die if needed (but don't assign yet)
      if (dieAction === "create") {
        // Get image from dieFiles (first file) or dieImage
        const imageToUpload =
          dieFiles.length > 0 ? dieFiles[0] : dieImage || undefined;

        const estimatedReceiveAt = receivedAtManual
          ? convertLocalDateTimeToISO(receivedAtManual)
          : formatLocalDateTimeWithOffset(new Date(Date.now() + 24 * 60 * 60 * 1000));

        const calculatedDieSize =
          dieCategory === "decal" && selectedDecalDieSizes.length > 0
            ? selectedDecalDieSizes.join(", ")
            : dieSize || undefined;

        const newDie = await createDie({
          vendorId: finalVendorId || undefined,
          estimatedReceiveAt: estimatedReceiveAt,
          isReusable: isReusable,
          image: imageToUpload,
          FirstProofingOrderId: proofingOrderId,
          name: dieName || undefined,
          code: dieCode || undefined,
          type: dieType || undefined,
          size: calculatedDieSize,
          category: dieCategory || "box",
          length: dieLength,
          width: dieWidth,
          height: dieHeight,
        } as any);

        if (newDie?.id) {
          // Invalidate and refetch dies list to show newly created die
          queryClient.invalidateQueries({ queryKey: ["dies"] });
          queryClient.invalidateQueries({
            queryKey: ["dies", "search"],
          });

          // If replacing, use replaceDie API. Otherwise assign
          if (mode === "replace" && replacingDieId) {
            await replaceDie({
              proofingOrderId,
              currentDieId: replacingDieId,
              data: {
                newDieId: newDie.id,
                notes: newDieNote?.trim() || null,
              },
            });
          } else {
            // Assign the newly created die to the proofing order immediately with notes
            await assignDie({
              proofingOrderId,
              data: {
                dieId: newDie.id,
                isNewDie: false,
                notes: newDieNote?.trim() || undefined,
              },
            });
          }

          const successMessage =
            mode === "replace" ? "Thay thế khuôn thành công" :
            mode === "add" ? "Thêm khuôn thành công" :
            "Đã tạo và xuất khuôn bế thành công";

          toast.success(successMessage);
          onSuccess?.();
          onOpenChange(false);
        }
        return;
      }

      // If replacing, use replaceDie API. Otherwise assign
      if (mode === "replace" && replacingDieId) {
        const newDieId = selectedDieIds[0];
        if (!newDieId) {
          toast.error("Vui lòng chọn khuôn bế mới");
          return;
        }
        await replaceDie({
          proofingOrderId,
          currentDieId: replacingDieId,
          data: {
            newDieId,
            notes: dieNotes[newDieId]?.trim() || null,
          },
        });
      } else {
        for (const dieId of selectedDieIds) {
          await assignDie({
            proofingOrderId,
            data: {
              dieId,
              isNewDie: false,
              notes: dieNotes[dieId]?.trim() || undefined,
            },
          });
        }
      }

      const successMessage = 
        mode === "replace" ? "Thay thế khuôn thành công" : 
        mode === "add" ? "Thêm khuôn thành công" : 
        "Đã ghi nhận xuất khuôn bế thành công";
        
      toast.success(successMessage);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in die export process:", error);
      toast.error("Đã xảy ra lỗi trong quá trình xử lý", {
        description: getErrorMessage(error),
      });
    }
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  const isSubmitting =
    recordingDie || creatingDie || assigningDie || creatingVendor || replacingDie;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle>
            {mode === "replace" ? "Thay thế khuôn bế" : mode === "add" ? "Thêm khuôn bế" : "Xuất khuôn bế"}
          </DialogTitle>
        </DialogHeader>

        {/* MAIN LAYOUT */}
        {dieAction === "create" ? (
          /* CREATE NEW DIE MODE: Full-width 2-column layout without empty left void */
          <div className="flex-1 min-h-0 overflow-y-auto p-4 border rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-medium cursor-pointer"
                    onClick={() => {
                      setDieAction("select");
                      setSelectedDieIds([]);
                    }}
                  >
                    Chọn khuôn cũ
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs font-semibold cursor-pointer shadow-none"
                    onClick={() => setDieAction("create")}
                  >
                    Đặt khuôn mới
                  </Button>
                </div>
                <span className="text-xs text-slate-500">
                  Điền đầy đủ thông tin bên dưới để tạo & xuất khuôn mới
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN: Phân loại, Tham chiếu kích thước & Ảnh */}
              <div className="space-y-5">
                {/* Phân loại khuôn bế */}
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <Label htmlFor="create-die-category" className="text-xs font-bold text-slate-800">
                    Phân loại khuôn bế <span className="text-destructive">*</span>
                  </Label>
                  <Select value={dieCategory} onValueChange={setDieCategory}>
                    <SelectTrigger id="create-die-category" className="h-9 text-xs font-medium bg-white border-slate-200">
                      <SelectValue placeholder="Chọn phân loại khuôn..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="box" className="text-xs">Hộp (Khuôn Hộp)</SelectItem>
                      <SelectItem value="decal" className="text-xs">Decal (Khuôn Decal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selection of Decal Die Sizes (when category === 'decal') */}
                {dieCategory === "decal" && (
                  <div className="space-y-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span>Đánh dấu kích thước Decal lưu vào khuôn</span>
                        <Badge className="bg-amber-600 text-white text-[10px]">Lưu API dieSizes</Badge>
                      </Label>
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Tích chọn những kích thước bài decal cần lưu vào thông tin khuôn bế này:
                    </p>
                    {candidateDecalSizes.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {candidateDecalSizes.map((opt, idx) => {
                          const isChecked = selectedDecalDieSizes.includes(opt.value);
                          return (
                            <label
                              key={idx}
                              className={cn(
                                "flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer transition-all",
                                isChecked
                                  ? "bg-amber-100/80 border-amber-400 font-semibold text-amber-950 shadow-xs"
                                  : "bg-white border-amber-200/70 text-slate-700 hover:bg-amber-50/50"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDecalDieSizes((prev) => [...prev, opt.value]);
                                  } else {
                                    setSelectedDecalDieSizes((prev) => prev.filter((s) => s !== opt.value));
                                  }
                                }}
                              />
                              <span className="font-bold tabular-nums">{opt.value}</span>
                              <span className="text-[11px] text-slate-500 font-normal">({opt.label})</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 italic">
                        Hãy nhập kích thước Dài / Rộng ở phần dưới để tạo tùy chọn kích thước khuôn Decal.
                      </p>
                    )}
                  </div>
                )}

                {/* Reference table: design dimensions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Kích thước mã hàng (tham chiếu)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      {allDesignDimensions.length} mã hàng
                    </span>
                  </h4>

                  {allDesignDimensions.length > 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/30 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-slate-100/70 text-slate-700">
                            <th className="text-left px-3 py-1.5 font-bold">Mã hàng</th>
                            <th className="text-left px-3 py-1.5 font-bold">Loại</th>
                            <th className="text-center px-3 py-1.5 font-bold">D × R × C (mm)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allDesignDimensions.map((d, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{d.code || "—"}</td>
                              <td className="px-3 py-1.5 text-slate-600">{d.designTypeName || "—"}</td>
                              <td className="px-3 py-1.5 text-center font-semibold text-slate-900 tabular-nums">
                                {d.length ?? "?"} × {d.width ?? "—"} × {d.height ?? "?"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Không có thông tin kích thước từ mã hàng
                    </p>
                  )}
                </div>

                {/* Editable die dimensions */}
                <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-800">
                    Kích thước khuôn bế (mm)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-600">Dài (mm)</Label>
                      <Input
                        type="number"
                        placeholder="Dài"
                        value={dieLength || ""}
                        onChange={(e) => setDieLength(e.target.value ? Number(e.target.value) : undefined)}
                        className="h-8 text-xs bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-600">Rộng (mm)</Label>
                      <Input
                        type="number"
                        placeholder="Rộng"
                        value={dieWidth || ""}
                        onChange={(e) => setDieWidth(e.target.value ? Number(e.target.value) : undefined)}
                        className="h-8 text-xs bg-white border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-600">Cao (mm)</Label>
                      <Input
                        type="number"
                        placeholder="Cao"
                        value={dieHeight || ""}
                        onChange={(e) => setDieHeight(e.target.value ? Number(e.target.value) : undefined)}
                        className="h-8 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-800">Ảnh khuôn bế (tùy chọn)</Label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="die-image-upload"
                      className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors"
                    >
                      <Upload className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Tải ảnh khuôn</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP (Tối đa 5MB)</span>
                      <input
                        id="die-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDieImage(file);
                            setDieFiles([file]);
                            const preview = URL.createObjectURL(file);
                            setDieImagePreview(preview);
                          }
                        }}
                      />
                    </label>

                    {(dieImagePreview || dieImage) && (
                      <div className="relative w-20 h-20 rounded-xl border border-slate-200 bg-white p-1 overflow-hidden shrink-0">
                        <img
                          src={dieImagePreview || (dieImage ? URL.createObjectURL(dieImage) : "")}
                          alt="Die preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setDieImage(null);
                            setDieFiles([]);
                            setDieImagePreview(null);
                          }}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Vendor, Receiving Date, Options & Note */}
              <div className="space-y-5 border-t lg:border-t-0 lg:border-l lg:pl-6 border-slate-100 pt-4 lg:pt-0">
                {/* Vendor selector / creation */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-800">
                    Đơn vị làm khuôn (Nhà cung cấp) <span className="text-destructive">*</span>
                  </Label>
                  {!isCreatingVendor ? (
                    <div className="flex gap-2">
                      <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="flex-1 justify-between h-9 text-xs bg-white border-slate-200"
                            disabled={loadingVendors}
                          >
                            <span className="truncate">
                              {selectedVendor ? selectedVendor.name : "Chọn nhà cung cấp..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0">
                          <Command>
                            <CommandInput placeholder="Tìm nhà cung cấp..." className="h-9 text-xs" />
                            <CommandList>
                              <CommandEmpty>
                                <div className="py-3 text-center text-xs">
                                  <p className="mb-2 text-slate-500">Không tìm thấy nhà cung cấp</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsCreatingVendor(true);
                                      setVendorSearchOpen(false);
                                    }}
                                    className="gap-1 h-7 text-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tạo mới NCC
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {vendors?.map((vendor) => (
                                  <CommandItem
                                    key={vendor.id}
                                    value={vendor.name || ""}
                                    onSelect={() => {
                                      setVendorId(vendor.id);
                                      setVendorSearchOpen(false);
                                    }}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3.5 w-3.5",
                                        vendorId === vendor.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="font-medium">{vendor.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreatingVendor(true)}
                        className="h-9 w-9 shrink-0 border-slate-200"
                        title="Tạo mới nhà cung cấp"
                      >
                        <Plus className="h-4 w-4 text-slate-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Tạo nhà cung cấp mới</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreatingVendor(false)}
                          className="h-6 px-2 text-xs text-slate-500"
                        >
                          Hủy
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Tên nhà cung cấp *"
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="Số điện thoại"
                          value={vendorPhone}
                          onChange={(e) => setVendorPhone(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Estimated Receiving Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedReceiveAt" className="text-xs font-bold text-slate-800">
                    Thời gian dự kiến nhận khuôn
                  </Label>
                  <Input
                    id="estimatedReceiveAt"
                    type="datetime-local"
                    value={receivedAtManual}
                    onChange={(e) => setReceivedAtManual(e.target.value)}
                    className="h-9 text-xs bg-white border-slate-200"
                  />
                </div>

                {/* Reusable Toggle */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Label className="text-xs font-bold text-slate-800">Tùy chọn tái sử dụng khuôn</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isReusable ? "default" : "outline"}
                      onClick={() => setIsReusable(true)}
                      className="flex-1 h-8 text-xs font-semibold shadow-none"
                    >
                      Lưu kho tái sử dụng
                    </Button>
                    <Button
                      type="button"
                      variant={!isReusable ? "destructive" : "outline"}
                      onClick={() => setIsReusable(false)}
                      className="flex-1 h-8 text-xs font-semibold shadow-none"
                    >
                      Khuôn dùng 1 lần
                    </Button>
                  </div>
                </div>

                {/* Export Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="newDieNote" className="text-xs font-bold text-slate-800">Ghi chú xuất khuôn mới</Label>
                  <Textarea
                    id="newDieNote"
                    rows={3}
                    placeholder="Nhập ghi chú xuất cho khuôn mới này..."
                    value={newDieNote}
                    onChange={(e) => setNewDieNote(e.target.value)}
                    className="text-xs min-h-[70px] bg-white border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SELECT EXISTING DIE MODE: Split Left/Right Panels */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[7fr,5fr] gap-4 overflow-hidden">
            {/* LEFT PANEL: SELECT DIES */}
            <div className="flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
              {/* Left Panel Top Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 text-xs font-semibold cursor-pointer shadow-none"
                      onClick={() => setDieAction("select")}
                    >
                      Chọn khuôn cũ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        setDieAction("create");
                        setSelectedDieIds([]);
                      }}
                    >
                      Đặt khuôn mới
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBrowsingDie(true)}
                  className="h-7 text-xs font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  <Search className="h-3.5 w-3.5 mr-1" />
                  Duyệt kho khuôn bế
                </Button>
              </div>

              {/* Inline Search Bar */}
              <div className="px-3 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center gap-2">
                <div className="w-[130px] shrink-0">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-7 text-xs font-semibold bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Phân loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Tất cả loại</SelectItem>
                      <SelectItem value="box" className="text-xs">Khuôn Hộp</SelectItem>
                      <SelectItem value="decal" className="text-xs">Khuôn Decal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative flex-1 min-w-[130px]">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Mã hàng / Mã khuôn..."
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value)}
                    className="pl-8 h-7 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="relative w-[120px]">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Mã bình bài..."
                    value={proofingOrderCode}
                    onChange={(e) => setProofingOrderCode(e.target.value)}
                    className="pl-8 h-7 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="relative w-[110px]">
                  <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Kích thước..."
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="pl-8 h-7 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="relative w-[120px]">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Tên KH..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-8 h-7 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
                {(designCode.trim() || customerName.trim() || size.trim() || proofingOrderCode.trim()) && (
                  <Button variant="ghost" size="sm" onClick={() => { setDesignCode(""); setCustomerName(""); setSize(""); setProofingOrderCode(""); }} className="h-7 text-xs text-rose-600 px-1.5">
                    Xóa
                  </Button>
                )}
              </div>

              {/* Die cards list */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {isLoadingDies ? (
                  <div className="flex h-full items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="text-xs text-slate-500">Đang tìm kiếm khuôn bế...</span>
                  </div>
                ) : availableDies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <Package className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Không tìm thấy khuôn bế phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3 max-w-xs">
                      Thử từ khóa khác hoặc bấm nút dưới để đặt khuôn mới / duyệt kho khuôn
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsBrowsingDie(true)}>
                        <Search className="h-3.5 w-3.5 mr-1" />
                        Duyệt kho khuôn
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={() => setDieAction("create")}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Đặt khuôn mới
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {availableDies.map((die) => {
                      const isSelected = die.id ? selectedDieIds.includes(die.id) : false;
                      const isBox = (die as any).category === "box" || !(die as any).category;
                      const matchesDim = designDimensions.length > 0 ? matchesDimensions(die.size, designDimensions) : false;

                      return (
                        <div
                          key={die.id}
                          className={cn(
                            "relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer group",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : matchesDim
                                ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                                : "border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50/50"
                          )}
                          onClick={() => {
                            if (die.id) toggleDieSelection(die.id);
                          }}
                        >
                          {/* Image */}
                          <div className="relative w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
                            {die.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.code || "Khuôn bế"}
                                className="w-full h-full object-contain cursor-zoom-in"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageUrl(die.imageUrl || null);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono font-bold text-slate-900 truncate">
                                {die.code || `Khuôn #${die.id}`}
                              </span>
                              {isBox ? (
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[9px] px-1 py-0 font-medium shrink-0">
                                  Hộp
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] px-1 py-0 font-bold shrink-0">
                                  Decal
                                </Badge>
                              )}
                              {matchesDim && (
                                <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 shrink-0">
                                  Gợi ý
                                </Badge>
                              )}
                            </div>

                            <div className="font-semibold text-slate-800 text-[11px] truncate">
                              Kích thước: {formatDieSize(die) || "—"}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {die.vendorName ? `NCC: ${die.vendorName}` : "Nội bộ"}
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className="shrink-0">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary border-primary" : "border-slate-300 group-hover:border-primary/50"
                              )}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: SELECTED DIES & EXPORT NOTES */}
            <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden shadow-sm">
              <div className="px-3.5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Ghi chú xuất khuôn ({selectedDieIds.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedDieIds.length > 0 ? `Đã chọn ${selectedDieIds.length} khuôn` : "Chưa chọn khuôn"}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                {selectedDieIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">Chưa chọn khuôn nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mb-3">
                      Hãy chọn ít nhất 1 khuôn bên trái hoặc bấm nút bên dưới để chọn từ kho khuôn bế
                    </p>
                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => setIsBrowsingDie(true)}>
                      <Search className="h-3.5 w-3.5 mr-1" />
                      Duyệt kho khuôn bế
                    </Button>
                  </div>
                ) : (
                  selectedDieIds.map((dieId) => {
                    const die = allDies.find((d) => d.id === dieId);
                    return (
                      <div key={dieId} className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {die?.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.code || "Die"}
                                className="w-8 h-8 rounded border object-contain shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-xs text-slate-900 truncate">
                                {die?.code || `Khuôn #${dieId}`}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {formatDieSize(die) || "—"}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-rose-600"
                            onClick={() => toggleDieSelection(dieId)}
                            title="Bỏ chọn khuôn này"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Textarea
                          value={dieNotes[dieId] || ""}
                          onChange={(e) => setDieNotes((prev) => ({ ...prev, [dieId]: e.target.value }))}
                          placeholder="Thêm ghi chú xuất cho khuôn này..."
                          className="text-xs min-h-[50px] resize-none bg-slate-50/50 border-slate-200"
                          rows={2}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <DialogFooter className="border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 bg-white shrink-0">
          <Button variant="outline" className="h-8 text-xs font-semibold px-5 rounded-lg" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="h-8 text-xs font-semibold px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (dieAction === "create" && !vendorId && !vendorName.trim()) ||
              (dieAction === "create" && dieFiles.length === 0) ||
              (dieAction === "select" && selectedDieIds.length === 0)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thông tin"
            )}
          </Button>
        </DialogFooter>

        {/* Image Preview Dialog */}
        {previewImageUrl && (
          <ImageViewerDialog
            open={!!previewImageUrl}
            onOpenChange={(open) => !open && setPreviewImageUrl(null)}
            imageUrl={previewImageUrl}
            title="Preview khuôn bế"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
