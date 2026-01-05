import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRecordDieExportWithFile } from "@/hooks/use-proofing-order";
import { useActiveDieVendors, useCreateVendor } from "@/hooks/use-vendor";
import {
  useCreateDie,
  useSearchDies,
  useAssignDieToProofingOrder,
  useDiesByProofingOrder,
  useDies,
} from "@/hooks/use-die";
import type { ProofingOrderResponse } from "@/Schema/proofing-order.schema";
import type { DieResponse } from "@/Schema";
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

interface DieExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofingOrderId: number;
  proofingOrder?: ProofingOrderResponse | null;
  onSuccess?: () => void;
}

export function DieExportDialog({
  open,
  onOpenChange,
  proofingOrderId,
  proofingOrder,
  onSuccess,
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
  const [notes, setNotes] = useState<string>("");
  const [dieAction, setDieAction] = useState<"select" | "create">("select");

  // For selecting existing dies
  const [selectedDieIds, setSelectedDieIds] = useState<number[]>([]);
  const [dieSearchTerm, setDieSearchTerm] = useState<string>("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // For creating new die
  const [dieName, setDieName] = useState<string>("");
  const [dieCode, setDieCode] = useState<string>("");
  const [dieType, setDieType] = useState<string>("");
  const [dieSize, setDieSize] = useState<string>("");
  const [diePrice, setDiePrice] = useState<number | undefined>(undefined);
  const [dieLength, setDieLength] = useState<number | undefined>(undefined);
  const [dieWidth, setDieWidth] = useState<number | undefined>(undefined);
  const [dieHeight, setDieHeight] = useState<number | undefined>(undefined);
  const [dieImage, setDieImage] = useState<File | null>(null);
  const [dieImagePreview, setDieImagePreview] = useState<string | null>(null);

  const { data: vendors, isLoading: loadingVendors } = useActiveDieVendors();
  const { mutate: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: recordDie, isPending: recordingDie } =
    useRecordDieExportWithFile();
  const { mutate: createDie, isPending: creatingDie } = useCreateDie();
  const { mutate: assignDie, isPending: assigningDie } =
    useAssignDieToProofingOrder();

  // Get dies - use search when there's a search term, otherwise use list
  const { data: searchDiesData, isLoading: loadingSearchDies } = useSearchDies(
    open && dieSearchTerm.trim()
      ? {
          dieName: dieSearchTerm.trim(),
          isUsable: true,
          pageSize: 100,
        }
      : undefined
  );

  const { data: diesData, isLoading: loadingDies } = useDies(
    open && !dieSearchTerm.trim()
      ? {
          isUsable: true,
          pageSize: 100,
        }
      : undefined
  );

  const searchDies = searchDiesData?.items || [];
  const listDies = diesData?.items || [];
  const allDies = dieSearchTerm.trim() ? searchDies : listDies;
  const isLoadingDies = dieSearchTerm.trim() ? loadingSearchDies : loadingDies;
  // #region agent log
  useEffect(() => {
    if (open) {
      fetch(
        "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "DieExportDialog.tsx:138",
            message: "API data received",
            data: {
              searchDiesCount: searchDies.length,
              listDiesCount: listDies.length,
              allDiesCount: allDies.length,
              isLoadingDies,
              dieSearchTerm,
              open,
              hasSearchTerm: !!dieSearchTerm.trim(),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
    }
  }, [
    open,
    searchDies.length,
    listDies.length,
    allDies.length,
    isLoadingDies,
    dieSearchTerm,
  ]);
  // #endregion

  // Fetch dies already assigned to this proofing order
  const { data: assignedDies } = useDiesByProofingOrder(proofingOrderId, open);
  const assignedDieIds = useMemo(
    () => new Set(assignedDies?.map((ad) => ad.dieId).filter(Boolean) || []),
    [assignedDies]
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
    []
  );

  // Helper function to check if die matches design type
  const matchesDesignType = useCallback(
    (
      dieName: string | null | undefined,
      dieType: string | null | undefined,
      designTypes: string[]
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
      // #region agent log
      if (designTypes.length > 0) {
        fetch(
          "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "DieExportDialog.tsx:203",
              message: "matchesDesignType check",
              data: { dieName, dieType, designTypes, matches },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "post-fix",
              hypothesisId: "C",
            }),
          }
        ).catch(() => {});
      }
      // #endregion
      return matches;
    },
    []
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
      }>
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
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "DieExportDialog.tsx:295",
              message: "Dimension match check",
              data: {
                dieSize,
                dieSizeNormalized,
                formatted,
                formattedLower,
                result,
                dim,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "post-fix",
              hypothesisId: "D",
            }),
          }
        ).catch(() => {});
        // #endregion
        return result;
      });
      return matches;
    },
    [formatDimensions]
  );

  // Filter out already assigned dies and filter by design type and size
  const availableDies = useMemo(() => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "DieExportDialog.tsx:230",
        message: "Filtering starts",
        data: {
          allDiesCount: allDies.length,
          assignedDieIdsCount: assignedDieIds.size,
          designTypesCount: designTypes.length,
          designDimensionsCount: designDimensions.length,
          designTypes: designTypes,
          designDimensions: designDimensions,
          assignedDieIds: Array.from(assignedDieIds),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    let filtered = allDies.filter(
      (die) => die.id && !assignedDieIds.has(die.id)
    );
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "DieExportDialog.tsx:233",
        message: "After assigned filter",
        data: {
          filteredCount: filtered.length,
          filteredIds: filtered.map((d) => d.id),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion

    // Filter by design type if we have design types
    if (designTypes.length > 0) {
      const beforeDesignTypeFilter = filtered.length;
      filtered = filtered.filter((die) => {
        const matches = matchesDesignType(die.name, die.type, designTypes);
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "DieExportDialog.tsx:240",
              message: "Design type check",
              data: {
                dieId: die.id,
                dieName: die.name,
                dieType: die.type,
                matches,
                designTypes,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "post-fix",
              hypothesisId: "C",
            }),
          }
        ).catch(() => {});
        // #endregion
        return matches;
      });
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "DieExportDialog.tsx:245",
            message: "After design type filter",
            data: {
              beforeCount: beforeDesignTypeFilter,
              afterCount: filtered.length,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C",
          }),
        }
      ).catch(() => {});
      // #endregion
    }

    // Filter by dimensions if we have dimensions
    if (designDimensions.length > 0) {
      const beforeDimensionsFilter = filtered.length;
      filtered = filtered.filter((die) => {
        const matches = matchesDimensions(die.size, designDimensions);
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "DieExportDialog.tsx:252",
              message: "Dimensions check",
              data: {
                dieId: die.id,
                dieSize: die.size,
                matches,
                designDimensions,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "D",
            }),
          }
        ).catch(() => {});
        // #endregion
        return matches;
      });
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "DieExportDialog.tsx:257",
            message: "After dimensions filter",
            data: {
              beforeCount: beforeDimensionsFilter,
              afterCount: filtered.length,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
    }

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "DieExportDialog.tsx:262",
        message: "Final availableDies",
        data: {
          finalCount: filtered.length,
          finalIds: filtered.map((d) => d.id),
          allDiesSample: allDies.slice(0, 3).map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            size: d.size,
          })),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion
    return filtered;
  }, [
    allDies,
    assignedDieIds,
    designTypes,
    designDimensions,
    matchesDesignType,
    matchesDimensions,
  ]);

  // Auto-fill die name, code, type and size when creating new die based on proofing order designs
  useEffect(() => {
    if (
      open &&
      dieAction === "create" &&
      proofingOrderDesigns.length > 0 &&
      !dieName &&
      !dieCode &&
      !dieType &&
      !dieSize
    ) {
      // Get first design to auto-fill
      const firstDesign = proofingOrderDesigns[0];
      if (firstDesign) {
        // Auto-generate die name: Mã số + kích thước
        const designTypeName = firstDesign.designType?.name || "";
        const dimensions = formatDimensions(
          firstDesign.length || 0,
          firstDesign.width,
          firstDesign.height || 0
        );
        const suggestedName = `${designTypeName} ${dimensions}`;
        // Auto-generate code from design code
        const suggestedCode = firstDesign.code || "";
        // Auto-generate type from design type
      }
    }
  }, [
    open,
    dieAction,
    proofingOrderDesigns,
    formatDimensions,
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
      setReceivedAtManual("");
      setNotes("");
      setDieAction("select");
      setSelectedDieIds([]);
      setDieSearchTerm("");
      setDieName("");
      setDieSize("");
      setDiePrice(undefined);
      setDieLength(undefined);
      setDieWidth(undefined);
      setDieHeight(undefined);
      setDieImage(null);
      setDieImagePreview(null);
    }
  }, [open]);

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
    [formatLocalDateTimeWithOffset]
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

    createVendor(
      {
        name: vendorName.trim(),
        phone: vendorPhone.trim() || null,
        email: vendorEmail.trim() || null,
        address: vendorAddress.trim() || null,
        note: vendorNote.trim() || null,
        vendorType: "die",
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
      }
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
        if (prev.length >= dieCount) {
          toast.error(`Chỉ có thể chọn tối đa ${dieCount} khuôn`);
          return prev;
        }
        return [...prev, dieId];
      }
    });
  };

  const handleSubmit = async () => {
    // Validate vendor - chỉ khi tạo khuôn mới
    if (dieAction === "create" && !vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị làm khuôn bế");
      return;
    }

    // Validate images - chỉ khi tạo khuôn mới
    if (dieAction === "create") {
      const firstDieExport = proofingOrder?.dieExports?.[0];
      if (
        dieFiles.length === 0 &&
        !firstDieExport?.imageUrl &&
        (!firstDieExport || (firstDieExport && !firstDieExport.imageUrl))
      ) {
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
      if (selectedDieIds.length !== dieCount) {
        toast.error(
          `Số lượng khuôn đã chọn (${selectedDieIds.length}) không khớp với số lượng khuôn (${dieCount})`
        );
        return;
      }
    }

    if (dieAction === "create") {
      if (!dieCode.trim()) {
        toast.error("Vui lòng nhập mã khuôn bế");
        return;
      }
      if (!dieType.trim()) {
        toast.error("Vui lòng nhập loại khuôn bế");
        return;
      }
    }

    try {
      // Step 1: Create vendor if needed - chỉ khi tạo khuôn mới
      let finalVendorId = vendorId;
      if (dieAction === "create" && !finalVendorId && vendorName.trim()) {
        await new Promise<void>((resolve, reject) => {
          createVendor(
            {
              name: vendorName.trim(),
              phone: null,
              email: null,
              address: null,
              note: null,
              vendorType: "die",
            },
            {
              onSuccess: (newVendor) => {
                finalVendorId = newVendor.id;
                resolve();
              },
              onError: (error) => {
                reject(error);
              },
            }
          );
        });
      }

      // Step 2: Create die if needed
      let createdDieIds: number[] = [];
      if (dieAction === "create") {
        // Create die first
        await new Promise<void>((resolve, reject) => {
          createDie(
            {
              name: dieName.trim() || undefined,
              code: dieCode.trim(),
              type: dieType.trim(),
              size: dieSize.trim() || undefined,
              price: diePrice ?? undefined,
              vendorId: finalVendorId || undefined,
              notes: notes.trim() || undefined,
              image: dieImage || undefined,
              length: dieLength,
              width: dieWidth,
              height: dieHeight,
            },
            {
              onSuccess: (newDie) => {
                if (newDie.id) {
                  createdDieIds = [newDie.id];
                }
                resolve();
              },
              onError: (error) => {
                toast.error("Không thể tạo khuôn bế", {
                  description: getErrorMessage(error),
                });
                reject(error);
              },
            }
          );
        });

        // Assign created die to proofing order
        if (createdDieIds.length > 0) {
          for (const dieId of createdDieIds) {
            await new Promise<void>((resolve, reject) => {
              assignDie(
                {
                  proofingOrderId,
                  data: {
                    dieId,
                    isNewDie: true,
                    notes: notes.trim() || undefined,
                  },
                },
                {
                  onSuccess: () => resolve(),
                  onError: (error) => {
                    toast.error("Không thể gán khuôn bế vào bình bài", {
                      description: getErrorMessage(error),
                    });
                    reject(error);
                  },
                }
              );
            });
          }
        }
      } else {
        // Step 3: Assign selected dies to proofing order
        for (const dieId of selectedDieIds) {
          await new Promise<void>((resolve, reject) => {
            assignDie(
              {
                proofingOrderId,
                data: {
                  dieId,
                  isNewDie: false,
                  notes: notes.trim() || undefined,
                },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => {
                  toast.error("Không thể gán khuôn bế vào bình bài", {
                    description: getErrorMessage(error),
                  });
                  reject(error);
                },
              }
            );
          });
        }
      }

      // Step 4: Record die export
      // Collect all die IDs (either created or selected)
      const allDieIds = dieAction === "create" ? createdDieIds : selectedDieIds;

      if (allDieIds.length === 0) {
        toast.error("Không có khuôn bế nào để ghi nhận xuất");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        recordDie(
          {
            id: proofingOrderId,
            dieIds: allDieIds,
            notes: notes.trim() || undefined,
          },
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              toast.error("Không thể ghi nhận xuất khuôn bế", {
                description: getErrorMessage(error),
              });
              reject(error);
            },
          }
        );
      });

      toast.success("Đã ghi nhận xuất khuôn bế thành công");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Errors are already handled in individual steps
      console.error("Error in die export process:", error);
    }
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);
  const firstDieExport = proofingOrder?.dieExports?.[0];
  const existingImages: string[] = []; // dieExports doesn't have images array, use imageUrl instead
  const existingImageUrl = firstDieExport?.imageUrl;

  const isSubmitting =
    recordingDie || creatingDie || assigningDie || creatingVendor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle>Xuất khuôn bế</DialogTitle>
        </DialogHeader>

        {/* MAIN SPLIT LAYOUT */}
        <div className="flex-1 grid grid-cols-[7fr,5fr] gap-4 overflow-hidden">
          {/* LEFT: EXISTING DIE SELECTION + OVERVIEW */}
          <div className="flex flex-col overflow-hidden border rounded-lg bg-background">
            <div className="border-b px-4 py-3 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Chọn khuôn bế</p>
                <p className="text-xs text-muted-foreground">
                  Chọn đúng số lượng khuôn cần xuất theo mã bài.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dieCount" className="text-xs">
                    Số lượng khuôn
                  </Label>
                  <Select
                    value={dieCount.toString()}
                    onValueChange={(value) => {
                      const newCount = Number(value);
                      setDieCount(newCount);
                      if (selectedDieIds.length > newCount) {
                        setSelectedDieIds((prev) => prev.slice(0, newCount));
                      }
                    }}
                  >
                    <SelectTrigger id="dieCount" className="h-8 w-32 text-xs">
                      <SelectValue placeholder="Số lượng" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} khuôn
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                  <span>Đã chọn</span>
                  <span className="font-semibold text-foreground">
                    {selectedDieIds.length}/{dieCount}
                  </span>
                  <span>khuôn</span>
                </div>
              </div>
            </div>

            {/* toggle select/create - compact, always visible */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3 border-b bg-muted/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  variant={dieAction === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDieAction("select");
                    setSelectedDieIds([]);
                  }}
                >
                  Chọn khuôn có sẵn
                </Button>
                <Button
                  variant={dieAction === "create" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDieAction("create");
                    setSelectedDieIds([]);
                  }}
                >
                  Tạo khuôn mới
                </Button>
              </div>
            </div>

            {/* CONTENT AREA LEFT: either die grid or compact hint when creating */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 py-3 gap-3">
              {dieAction === "select" ? (
                <>
                  {/* Search dies */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm khuôn theo mã, kích thước, tên, vị trí..."
                      value={dieSearchTerm}
                      onChange={(e) => setDieSearchTerm(e.target.value)}
                      className="pl-9 text-sm"
                    />
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
                          {dieSearchTerm.trim()
                            ? "Không tìm thấy khuôn bế phù hợp. Thử từ khóa khác hoặc tạo khuôn mới."
                            : "Không có khuôn bế có sẵn. Vui lòng tạo khuôn mới."}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-20">Ảnh</TableHead>
                              <TableHead>Mã khuôn</TableHead>
                              <TableHead>Kích thước</TableHead>
                              <TableHead>Nhà cung cấp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {availableDies.map((die) => {
                              const isSelected = die.id
                                ? selectedDieIds.includes(die.id)
                                : false;
                              const canSelect =
                                !isSelected && selectedDieIds.length < dieCount;
                              const selectionIndex = isSelected
                                ? selectedDieIds.indexOf(die.id!) + 1
                                : null;

                              return (
                                <TableRow
                                  key={die.id}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-primary/5 hover:bg-primary/10"
                                      : canSelect
                                        ? "hover:bg-muted/50"
                                        : "opacity-50 cursor-not-allowed"
                                  )}
                                  onClick={() => {
                                    if (die.id && (canSelect || isSelected)) {
                                      toggleDieSelection(die.id);
                                    }
                                  }}
                                >
                                  <TableCell className="w-20">
                                    <div className="relative w-16 h-16 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                                      {die.imageUrl ? (
                                        <>
                                          <img
                                            src={die.imageUrl}
                                            alt={die.name || "Khuôn bế"}
                                            className="w-full h-full object-contain cursor-zoom-in"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPreviewImageUrl(
                                                die.imageUrl || null
                                              );
                                            }}
                                          />
                                          {selectionIndex && (
                                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                                              {selectionIndex}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {die.code || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {formatDieSize(die)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                      {die.vendorName || "—"}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
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
                              <span>
                                {die?.code || die?.name || `Khuôn #${dieId}`}
                              </span>
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

          {/* RIGHT: CREATE DIE + VENDOR + META (SCROLLABLE COLUMN) */}
          <div className="flex flex-col overflow-hidden border rounded-lg bg-background">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">
                Thông tin khuôn &amp; đơn vị làm khuôn
              </p>
              <p className="text-xs text-muted-foreground">
                Thiết kế form gọn, chia nhóm để tránh scroll quá dài.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {dieAction === "create" ? (
                <>
                  {/* Thông tin cơ bản */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">
                        Thông tin cơ bản
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dieCode">
                          Mã khuôn bế{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="dieCode"
                          placeholder="VD: KB-1234"
                          value={dieCode}
                          onChange={(e) => setDieCode(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dieType">
                          Loại khuôn bế{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="dieType"
                          placeholder="VD: Khuôn bế hộp cứng"
                          value={dieType}
                          onChange={(e) => setDieType(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dieName">Tên khuôn bế</Label>
                        <Input
                          id="dieName"
                          placeholder="Tên gợi nhớ (tự động gợi ý từ mã bài)"
                          value={dieName}
                          onChange={(e) => setDieName(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kích thước */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">Kích thước</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="dieLength" className="text-xs">
                          Dài (mm)
                        </Label>
                        <Input
                          id="dieLength"
                          type="number"
                          min={0}
                          value={dieLength ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const next = value ? Number(value) : undefined;
                            setDieLength(next);
                            const length = next;
                            const width = dieWidth;
                            const height = dieHeight;
                            if (length && height) {
                              setDieSize(
                                formatDimensions(length, width ?? 0, height)
                              );
                            }
                          }}
                          className="h-9 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dieWidth" className="text-xs">
                          Rộng (mm)
                        </Label>
                        <Input
                          id="dieWidth"
                          type="number"
                          min={0}
                          value={dieWidth ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const next = value ? Number(value) : undefined;
                            setDieWidth(next);
                            const length = dieLength;
                            const width = next;
                            const height = dieHeight;
                            if (length && height) {
                              setDieSize(
                                formatDimensions(length, width ?? 0, height)
                              );
                            }
                          }}
                          className="h-9 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dieHeight" className="text-xs">
                          Cao (mm)
                        </Label>
                        <Input
                          id="dieHeight"
                          type="number"
                          min={0}
                          value={dieHeight ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const next = value ? Number(value) : undefined;
                            setDieHeight(next);
                            const length = dieLength;
                            const width = dieWidth;
                            const height = next;
                            if (length && height) {
                              setDieSize(
                                formatDimensions(length, width ?? 0, height)
                              );
                            }
                          }}
                          className="h-9 text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="dieSize"
                        className="text-xs text-muted-foreground"
                      >
                        Kích thước tổng hợp
                      </Label>
                      <Input
                        id="dieSize"
                        placeholder="Tự động từ Dài × Rộng × Cao"
                        value={dieSize}
                        onChange={(e) => setDieSize(e.target.value)}
                        className="h-9 text-sm font-mono bg-muted/50"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Vendor selection / creation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">
                        Đơn vị làm khuôn{" "}
                        <span className="text-destructive">*</span>
                      </h4>
                    </div>
                    <div className="space-y-1.5">
                      {!isCreatingVendor ? (
                        <div className="flex gap-2">
                          <Popover
                            open={vendorSearchOpen}
                            onOpenChange={setVendorSearchOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="flex-1 justify-between h-8"
                                disabled={loadingVendors}
                              >
                                {selectedVendor
                                  ? selectedVendor.name
                                  : "Chọn nhà cung cấp..."}
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
                                              : "opacity-0"
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
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
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
                            sách để tái sử dụng.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Die images */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">Ảnh khuôn bế</h4>
                    </div>
                    <div className="space-y-1.5">
                      {dieFiles.length === 0 && !existingImageUrl ? (
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
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
                            className="cursor-pointer flex flex-col items-center gap-1"
                          >
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Click để chọn ảnh hoặc kéo thả vào đây
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              File ảnh (JPG, PNG, ...) - tối đa 10MB mỗi file
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {existingImageUrl && (
                            <div className="space-y-1.5">
                              <Label className="text-[11px] text-muted-foreground">
                                Ảnh đã lưu:
                              </Label>
                              <div className="border rounded-md bg-muted/30 overflow-hidden">
                                <img
                                  src={existingImageUrl}
                                  alt="Ảnh khuôn bế"
                                  className="h-28 w-full object-contain"
                                />
                              </div>
                            </div>
                          )}
                          {dieFiles.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-[11px] text-muted-foreground">
                                Ảnh mới:
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {dieFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="relative group border rounded-md bg-muted/30 overflow-hidden"
                                  >
                                    <img
                                      src={imagePreviews[index]}
                                      alt={`Preview ${file.name}`}
                                      className="h-24 w-full object-contain"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveFile(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-[10px] text-white truncate">
                                      {file.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              id="dieFiles"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <label htmlFor="dieFiles">
                              <Button variant="outline" size="sm" asChild>
                                <span>Thêm ảnh</span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time & notes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <h4 className="text-sm font-semibold">
                        Thông tin bổ sung
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="receivedAt" className="text-xs">
                          Thời gian có khuôn
                        </Label>
                        <Input
                          id="receivedAt"
                          type="datetime-local"
                          value={receivedAtManual}
                          onChange={(e) => setReceivedAtManual(e.target.value)}
                          className="h-9 text-sm"
                        />
                        {receivedAt && (
                          <p className="text-[11px] text-muted-foreground">
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
                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs">
                          Ghi chú
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Nhập ghi chú về khuôn bế, yêu cầu gia công..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <p className="max-w-xs">
                    Đang ở chế độ{" "}
                    <span className="font-medium text-foreground">
                      Chọn khuôn có sẵn
                    </span>
                    . Khi cần làm khuôn mới, hãy bấm nút{" "}
                    <span className="font-medium">Tạo khuôn mới</span> ở panel
                    bên trái. Form tạo khuôn sẽ hiển thị tại đây.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t px-4 py-3 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (dieAction === "create" &&
                    dieFiles.length === 0 &&
                    !existingImageUrl) ||
                  (dieAction === "create" && !vendorId && !vendorName.trim()) ||
                  (dieAction === "create" &&
                    (!dieCode.trim() || !dieType.trim())) ||
                  (dieAction === "select" &&
                    (selectedDieIds.length === 0 ||
                      selectedDieIds.length !== dieCount))
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
          </div>
        </div>

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
