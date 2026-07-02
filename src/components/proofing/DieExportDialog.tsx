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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
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
      isUsable: true,
      pageSize: 100,
      pageNumber: 1,
    };
  }, [
    open,
    dieAction,
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
      setDieImage(null);
      setDieImagePreview(null);
      setIsReusable(true);
    }
  }, [open, initialSelectedDieIds, initialSize]);

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

        const newDie = await createDie({
          vendorId: finalVendorId || undefined,
          estimatedReceiveAt: estimatedReceiveAt,
          isReusable: isReusable,
          image: imageToUpload,
          FirstProofingOrderId: proofingOrderId,
          name: dieName || undefined,
          code: dieCode || undefined,
          type: dieType || undefined,
          size: dieSize || undefined,
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

        {/* MAIN SPLIT LAYOUT */}
        <div className="flex-1 gap-4 overflow-hidden grid grid-cols-[7fr,5fr]">
          {/* LEFT: EXISTING DIE SELECTION + OVERVIEW */}
          <div className="flex-1 flex flex-col overflow-hidden border rounded-lg bg-background">
            <div className="border-b px-4 py-3 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Chọn khuôn bế</p>
                <p className="text-xs text-muted-foreground">
                  {mode === "replace" ? "Chọn một khuôn bế mới để thay thế." : mode === "add" ? "Chọn một khuôn bế để thêm vào." : "Chọn đúng số lượng khuôn cần xuất theo mã bài."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground bg-muted/20">
                  <span>Đã chọn</span>
                  <span className="font-semibold text-foreground">
                    {selectedDieIds.length}
                  </span>
                  <span>khuôn</span>
                </div>
              </div>
            </div>

            {/* toggle select/create and actions - compact, always visible */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3 border-b bg-muted/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  variant={dieAction === "select" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full font-medium"
                  onClick={() => {
                    setDieAction("select");
                    setSelectedDieIds([]);
                  }}
                >
                  Chọn khuôn cũ
                </Button>
                <Button
                  variant={dieAction === "create" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full font-medium"
                  onClick={() => {
                    setDieAction("create");
                    setSelectedDieIds([]);
                  }}
                >
                  Đặt khuôn mới
                </Button>
              </div>
              
              {dieAction === "select" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBrowsingDie(true)}
                  className="h-8 text-xs rounded-full font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Duyệt kho khuôn
                </Button>
              )}
            </div>

            {/* CONTENT AREA LEFT: either die grid or compact hint when creating */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 py-3 gap-3">
              {dieAction === "select" ? (
                <>
                  {/* Search Section */}
                  <div className="shrink-0 space-y-3 pb-3 border-b">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Design Code Search */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="design-code-search"
                          className="text-xs font-medium"
                        >
                          Mã hàng
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="design-code-search"
                            placeholder="Nhập mã hàng..."
                            value={designCode}
                            onChange={(e) => setDesignCode(e.target.value)}
                            className="pl-8 h-8 text-xs transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Proofing Order Code Search */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="proofing-order-code-search"
                          className="text-xs font-medium"
                        >
                          Mã bình bài
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="proofing-order-code-search"
                            placeholder="Nhập mã bình bài..."
                            value={proofingOrderCode}
                            onChange={(e) => setProofingOrderCode(e.target.value)}
                            className="pl-8 h-8 text-xs transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Size Search */}
                      <div className="space-y-1">
                        <Label htmlFor="size-search" className="text-xs font-medium">
                          Kích thước
                        </Label>
                        <div className="relative">
                          <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="size-search"
                            placeholder="Nhập kích thước..."
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="pl-8 h-8 text-xs transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Customer Name Search */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="customer-name-search"
                          className="text-xs font-medium"
                        >
                          Tên khách hàng
                        </Label>
                        <div className="relative">
                          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="customer-name-search"
                            placeholder="Nhập tên khách hàng..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="pl-8 h-8 text-xs transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search Actions */}
                    {(designCode.trim() || customerName.trim() || size.trim() || proofingOrderCode.trim()) && (
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-muted-foreground">
                          {isLoadingDies ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Đang tìm kiếm...
                            </span>
                          ) : searchError ? (
                            <span className="text-destructive">
                              Đã xảy ra lỗi khi tìm kiếm
                            </span>
                          ) : availableDies.length > 0 ? (
                            <>
                              Tìm thấy{" "}
                              <span className="font-semibold text-foreground">
                                {availableDies.length}
                              </span>{" "}
                              khuôn bế phù hợp
                            </>
                          ) : (
                            "Không tìm thấy khuôn bế nào"
                          )}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDesignCode("");
                            setCustomerName("");
                            setSize("");
                            setProofingOrderCode("");
                          }}
                          className="h-6 px-2 text-[10px] hover:bg-muted"
                        >
                          Xóa bộ lọc
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Die table */}
                  <div className="flex-1 overflow-hidden">
                    {isLoadingDies ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : availableDies.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center text-sm text-muted-foreground border rounded-lg px-4 py-6 max-w-xs">
                          {(designCode.trim() || customerName.trim() || size.trim() || proofingOrderCode.trim())
                            ? "Không tìm thấy khuôn bế phù hợp. Thử từ khóa khác hoặc tạo khuôn mới."
                            : "Không có khuôn bế có sẵn. Vui lòng tạo khuôn mới."}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-1">
                          {availableDies.map((die) => {
                            const isSelected = die.id
                              ? selectedDieIds.includes(die.id)
                              : false;
                            const canSelect = !isSelected;
                            const selectionIndex = isSelected
                              ? selectedDieIds.indexOf(die.id!) + 1
                              : null;

                            // Check if die matches design dimensions for highlighting
                            const matchesDim =
                              designDimensions.length > 0
                                ? matchesDimensions(die.size, designDimensions)
                                : false;
                            const isRecommended = matchesDim;

                            return (
                              <div
                                key={die.id}
                                className={cn(
                                  "group relative flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer",
                                  isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : canSelect
                                      ? "border-border bg-background hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
                                      : "border-border bg-muted/20 opacity-50 cursor-not-allowed",
                                  isRecommended &&
                                    !isSelected &&
                                    canSelect &&
                                    "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
                                )}
                                onClick={() => {
                                  if (die.id && (canSelect || isSelected)) {
                                    toggleDieSelection(die.id);
                                  }
                                }}
                              >
                                {/* Selection indicator */}
                                {selectionIndex && (
                                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg z-10">
                                    {selectionIndex}
                                  </div>
                                )}

                                {/* Recommended badge */}
                                {isRecommended && !isSelected && (
                                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-medium rounded-full">
                                    Gợi ý
                                  </div>
                                )}

                                {/* Image */}
                                <div className="relative flex-shrink-0 w-16 h-16 bg-muted/50 rounded-md overflow-hidden border">
                                  {die.imageUrl ? (
                                    <img
                                      src={die.imageUrl}
                                      alt={die.code || "Khuôn bế"}
                                      className="w-full h-full object-contain cursor-zoom-in"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImageUrl(
                                          die.imageUrl || null,
                                        );
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate">
                                        {die.code || "—"}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">
                                        Kích thước:
                                      </span>
                                      <span className="text-foreground">
                                        {formatDieSize(die) || "—"}
                                      </span>
                                    </div>
                                  </div>

                                  {die.vendorName && (
                                    <div className="mt-1.5 text-xs text-muted-foreground truncate">
                                      <span className="font-medium">NCC:</span>{" "}
                                      <span className="text-foreground">
                                        {die.vendorName}
                                      </span>
                                    </div>
                                  )}

                                  {die.firstProofingOrderCode && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <span className="font-medium">
                                        Được sử dụng trong mã bài:
                                      </span>{" "}
                                      <span className="text-foreground font-semibold">
                                        {die.firstProofingOrderCode}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 hover:bg-primary/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyProofingOrderCode(
                                            die.firstProofingOrderCode || "",
                                          );
                                        }}
                                        title="Sao chép mã bài"
                                      >
                                        {copiedProofingOrderCode ===
                                        die.firstProofingOrderCode ? (
                                          <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                {/* Selection checkbox */}
                                <div className="flex-shrink-0">
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : canSelect
                                          ? "border-muted-foreground/30 group-hover:border-primary/50"
                                          : "border-muted-foreground/20",
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected summary */}
                  {selectedDieIds.length > 0 && (
                    <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
                      <p className="mb-1 text-xs font-medium">
                        Đã chọn {selectedDieIds.length} khuôn:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDieIds.map((dieId) => {
                          const die = availableDies.find((d) => d.id === dieId);
                          return (
                            <span
                              key={dieId}
                              className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px]"
                            >
                              <span>{die?.code || `Khuôn #${dieId}`}</span>
                              <button
                                type="button"
                                className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDieSelection(dieId);
                                }}
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <p className="max-w-xs">
                    Bạn đang ở chế độ{" "}
                    <span className="font-medium text-foreground">
                      Tạo khuôn mới
                    </span>
                    . Điền thông tin khuôn bế ở panel bên phải. Sau khi lưu,
                    khuôn mới sẽ tự động nằm trong danh sách khuôn.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CREATE DIE + VENDOR + META or NOTES (SCROLLABLE COLUMN) */}
          <div className="flex flex-col overflow-hidden border rounded-lg bg-background">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">
                {dieAction === "create" ? "Thông tin khuôn & đơn vị làm khuôn" : "Ghi chú xuất khuôn"}
              </p>
              <p className="text-xs text-muted-foreground">
                {dieAction === "create" ? "Thiết kế form gọn, chia nhóm để tránh scroll quá dài." : "Thêm ghi chú cho từng khuôn bế đã chọn."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {dieAction === "create" ? (
                <>
                  {/* Die Dimensions - Reference table + editable inputs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">
                        Kích thước mã hàng (tham chiếu)
                      </h4>
                    </div>

                    {/* Reference table: all designs' dimensions */}
                    {allDesignDimensions.length > 0 ? (
                      <div className="rounded-md border bg-muted/30 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-2 py-1.5 font-semibold text-[13px] text-muted-foreground">
                                Mã hàng
                              </th>
                              <th className="text-left px-2 py-1.5 font-semibold text-[13px] text-muted-foreground">
                                Loại
                              </th>
                              <th className="text-center px-2 py-1.5 font-semibold text-[13px] text-muted-foreground">
                                D × R × C (mm)
                              </th>
                              <th className="px-1 py-1.5"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {allDesignDimensions.map((d, idx) => (
                              <tr
                                key={idx}
                                className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-2 py-1.5">
                                  <span className="font-mono font-bold text-[13px]">
                                    {d.code || "—"}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5">
                                  <span className="text-[13px] text-muted-foreground">
                                    {d.designTypeName || "—"}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <span className="font-medium text-[13px] tabular-nums">
                                    {d.length ?? "?"} × {d.width ?? "—"} ×{" "}
                                    {d.height ?? "?"}
                                  </span>
                                </td>
                                <td className="px-1 py-1 text-right">
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Không có thông tin kích thước từ mã hàng
                      </p>
                    )}

                    {/* Editable die dimension inputs */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Kích thước khuôn (có thể chỉnh)
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground/70">
                            Dài (mm)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Dài"
                            value={dieLength || ""}
                            onChange={(e) =>
                              setDieLength(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground/70">
                            Rộng (mm)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Rộng"
                            value={dieWidth || ""}
                            onChange={(e) =>
                              setDieWidth(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground/70">
                            Cao (mm)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Cao"
                            value={dieHeight || ""}
                            onChange={(e) =>
                              setDieHeight(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Vendor selection / creation */}
              <div className="space-y-3 pt-4 border-t">
                    <div className="space-y-1.5">
                      {!isCreatingVendor ? (
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-sm font-medium whitespace-nowrap">
                            Đơn vị làm khuôn <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex-1 max-w-[240px] flex gap-2">
                            <Popover
                              open={vendorSearchOpen}
                              onOpenChange={setVendorSearchOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="flex-1 justify-between h-8 text-sm px-2 overflow-hidden"
                                  disabled={loadingVendors}
                                >
                                  <span className="truncate">
                                    {selectedVendor
                                      ? selectedVendor.name
                                      : "Chọn nhà cung cấp..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[360px] p-0">
                                <Command>
                                  <CommandInput placeholder="Tìm kiếm nhà cung cấp..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      <div className="py-4 text-center text-sm">
                                        <p className="mb-2">
                                          Không tìm thấy nhà cung cấp
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setIsCreatingVendor(true);
                                            setVendorSearchOpen(false);
                                          }}
                                          className="gap-2"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Tạo mới
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
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              vendorId === vendor.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                              {vendor.name}
                                            </span>
                                            {vendor.phone && (
                                              <span className="text-[10px] text-muted-foreground">
                                                {vendor.phone}
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                      <CommandItem
                                        onSelect={() => {
                                          setIsCreatingVendor(true);
                                          setVendorSearchOpen(false);
                                        }}
                                        className="text-primary"
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tạo nhà cung cấp mới
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setIsCreatingVendor(true)}
                              className="h-8 w-8 flex-shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-md border bg-muted/40 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium">
                              Tạo nhà cung cấp mới
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsCreatingVendor(false);
                                setVendorName("");
                                setVendorPhone("");
                                setVendorEmail("");
                                setVendorAddress("");
                                setVendorNote("");
                              }}
                              className="h-6 px-2 text-[11px]"
                            >
                              Hủy
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label
                                className="text-[11px]"
                                htmlFor="vendorName"
                              >
                                Tên nhà cung cấp *
                              </Label>
                              <Input
                                id="vendorName"
                                placeholder="VD: Cơ sở khuôn bế A"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label
                                className="text-[11px]"
                                htmlFor="vendorPhone"
                              >
                                Số điện thoại
                              </Label>
                              <Input
                                id="vendorPhone"
                                placeholder="VD: 0909 xxx xxx"
                                value={vendorPhone}
                                onChange={(e) => setVendorPhone(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label
                                className="text-[11px]"
                                htmlFor="vendorEmail"
                              >
                                Email
                              </Label>
                              <Input
                                id="vendorEmail"
                                type="email"
                                placeholder="email@vendor.com"
                                value={vendorEmail}
                                onChange={(e) => setVendorEmail(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label
                                className="text-[11px]"
                                htmlFor="vendorAddress"
                              >
                                Địa chỉ
                              </Label>
                              <Input
                                id="vendorAddress"
                                placeholder="Địa chỉ kho / xưởng"
                                value={vendorAddress}
                                onChange={(e) =>
                                  setVendorAddress(e.target.value)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]" htmlFor="vendorNote">
                              Ghi chú
                            </Label>
                            <Textarea
                              id="vendorNote"
                              rows={2}
                              placeholder="Thông tin thêm: người liên hệ, thời gian giao nhận, điều khoản thanh toán..."
                              value={vendorNote}
                              onChange={(e) => setVendorNote(e.target.value)}
                              className="text-sm min-h-[56px]"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={handleCreateVendor}
                              disabled={!vendorName.trim() || creatingVendor}
                              className="h-8 px-3 text-xs"
                            >
                              {creatingVendor ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Lưu nhà cung cấp"
                              )}
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Sau khi tạo, nhà cung cấp sẽ xuất hiện trong danh
                            sách.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">Ảnh khuôn bế</h4>
                    </div>
                    <div className="flex flex-wrap gap-3 items-start">

                      {/* New Image Previews */}
                      {dieFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative group border rounded-lg bg-muted/30 overflow-hidden w-24 h-24 flex-shrink-0"
                        >
                          <img
                            src={imagePreviews[index]}
                            alt={`Preview ${file.name}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-[9px] text-white text-center truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}

                      {/* Upload Button Box */}
                      <div className="flex-shrink-0">
                        <Input
                          id="dieFiles"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="dieFiles"
                          className="cursor-pointer border-2 border-dashed border-muted-foreground/20 rounded-lg w-24 h-24 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                          <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-[10px] text-muted-foreground font-medium group-hover:text-primary transition-colors text-center px-1">
                            Thêm ảnh
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Receive At & Is Reusable */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">
                        Thông tin bổ sung
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between gap-4 py-1">
                        <Label htmlFor="estimatedReceiveAt" className="text-sm font-medium whitespace-nowrap">
                          Dự kiến nhận khuôn
                        </Label>
                        <div className="flex-1 max-w-[240px] space-y-1">
                          <Input
                            id="estimatedReceiveAt"
                            type="datetime-local"
                            value={receivedAtManual}
                            onChange={(e) => setReceivedAtManual(e.target.value)}
                            className="h-9 text-sm"
                          />
                          {receivedAt && (
                            <p className="text-[10px] text-muted-foreground text-right">
                              Dự kiến:{" "}
                              {new Date(receivedAt).toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 py-2">
                        <Label className="text-xs font-medium">Tùy chọn Lưu Khuôn</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={isReusable ? "default" : "outline"}
                            onClick={() => setIsReusable(true)}
                            className="flex-1 h-9 text-sm"
                          >
                            Lưu Khuôn
                          </Button>
                          <Button
                            type="button"
                            variant={!isReusable ? "destructive" : "outline"}
                            onClick={() => setIsReusable(false)}
                            className="flex-1 h-9 text-sm"
                          >
                            Dùng 1 lần
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {isReusable 
                            ? "✓ Lưu vào kho để tái sử dụng." 
                            : "⚠ Khuôn dùng một lần."}
                        </p>
                      </div>

                      <div className="space-y-1.5 py-2">
                        <Label htmlFor="newDieNote" className="text-xs font-medium">Ghi chú xuất khuôn mới</Label>
                        <Textarea
                          id="newDieNote"
                          rows={2}
                          placeholder="Nhập ghi chú xuất cho khuôn mới này..."
                          value={newDieNote}
                          onChange={(e) => setNewDieNote(e.target.value)}
                          className="text-sm min-h-[56px]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {selectedDieIds.length > 0 ? (
                    selectedDieIds.map((dieId) => {
                      const die = allDies.find((d) => d.id === dieId);
                      return (
                        <div key={dieId} className="flex gap-3 p-3 rounded-md border bg-muted/10 shadow-sm">
                          {/* Image */}
                          <div className="relative flex-shrink-0 w-16 h-16 bg-muted/50 rounded-md overflow-hidden border">
                            {die?.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.code || "Khuôn bế"}
                                className="w-full h-full object-contain cursor-zoom-in bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageUrl(die.imageUrl || null);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 flex flex-col min-w-0">
                            <div className="text-sm font-semibold text-primary truncate mb-1" title={die?.code || `Khuôn #${dieId}`}>
                              {die?.code || `Khuôn #${dieId}`}
                            </div>
                            <Textarea
                              value={dieNotes[dieId] || ""}
                              onChange={(e) =>
                                setDieNotes((prev) => ({
                                  ...prev,
                                  [dieId]: e.target.value,
                                }))
                              }
                              placeholder="Nhập ghi chú xuất khuôn này..."
                              className="text-xs resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <p className="max-w-xs">
                        Chưa chọn khuôn nào. Hãy chọn ít nhất 1 khuôn bên trái để thêm ghi chú.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: always visible */}
        <DialogFooter className="border-t px-4 py-3 flex items-center justify-between gap-3 bg-muted/20">
          <Button variant="outline" className="rounded-full px-6 font-medium" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="rounded-full px-6 font-semibold shadow-sm"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
