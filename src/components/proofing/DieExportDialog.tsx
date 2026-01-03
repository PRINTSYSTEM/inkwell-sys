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
  const [dieSize, setDieSize] = useState<string>("");
  const [diePrice, setDiePrice] = useState<number | undefined>(undefined);
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

  // Fetch dies already assigned to this proofing order
  const { data: assignedDies } = useDiesByProofingOrder(proofingOrderId, open);
  const assignedDieIds = useMemo(
    () => new Set(assignedDies?.map((ad) => ad.dieId).filter(Boolean) || []),
    [assignedDies]
  );

  // Filter out already assigned dies from results
  const availableDies = useMemo(
    () => allDies.filter((die) => die.id && !assignedDieIds.has(die.id)),
    [allDies, assignedDieIds]
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDieCount(1);
      setVendorId(null);
      setVendorName("");
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
        phone: null,
        email: null,
        address: null,
        note: null,
        vendorType: "die",
      },
      {
        onSuccess: (newVendor) => {
          setVendorId(newVendor.id);
          setIsCreatingVendor(false);
          setVendorName("");
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
      if (
        dieFiles.length === 0 &&
        !proofingOrder?.dieExport?.imageUrl &&
        (!proofingOrder?.dieExport?.images ||
          proofingOrder.dieExport.images.length === 0)
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
      if (!dieName.trim()) {
        toast.error("Vui lòng nhập tên khuôn bế");
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
              name: dieName.trim(),
              size: dieSize.trim() || undefined,
              price: diePrice || undefined,
              vendorId: finalVendorId || undefined,
              notes: notes.trim() || undefined,
              image: dieImage || undefined,
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
      const sentAt = formatLocalDateTimeWithOffset(new Date());
      const estimatedReceiveAt = receivedAt;

      await new Promise<void>((resolve, reject) => {
        recordDie(
          {
            id: proofingOrderId,
            files: dieFiles.length > 0 ? dieFiles : undefined,
            notes: notes.trim() || undefined,
            dieVendorId: finalVendorId || undefined,
            dieCount: dieCount,
            sentAt: sentAt,
            estimatedReceiveAt: estimatedReceiveAt || undefined,
            receivedAt: receivedAt || undefined,
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
  const existingImages = proofingOrder?.dieExport?.images || [];
  const existingImageUrl = proofingOrder?.dieExport?.imageUrl;

  const isSubmitting =
    recordingDie || creatingDie || assigningDie || creatingVendor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Xuất khuôn bế</DialogTitle>
          <DialogDescription>
            Chọn khuôn bế có sẵn hoặc tạo khuôn mới, sau đó ghi nhận thông tin
            xuất khuôn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Số lượng khuôn */}
          <div className="space-y-2">
            <Label htmlFor="dieCount">
              Số lượng khuôn <span className="text-destructive">*</span>
            </Label>
            <Select
              value={dieCount.toString()}
              onValueChange={(value) => {
                const newCount = Number(value);
                setDieCount(newCount);
                // Limit selected dies to new count
                if (selectedDieIds.length > newCount) {
                  setSelectedDieIds((prev) => prev.slice(0, newCount));
                }
              }}
            >
              <SelectTrigger id="dieCount">
                <SelectValue placeholder="Chọn số lượng khuôn" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} khuôn
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Đã chọn: {selectedDieIds.length} / {dieCount} khuôn
            </p>
          </div>

          {/* Chọn hoặc tạo khuôn bế */}
          <div className="space-y-2">
            <Label>Khuôn bế</Label>
            <div className="flex gap-2 mb-2">
              <Button
                variant={dieAction === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDieAction("select");
                  setSelectedDieIds([]);
                  setDieName("");
                  setDieSize("");
                  setDiePrice(undefined);
                  setDieImage(null);
                  if (dieImagePreview) {
                    URL.revokeObjectURL(dieImagePreview);
                    setDieImagePreview(null);
                  }
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

            {dieAction === "select" ? (
              <div className="space-y-3">
                {/* Search dies */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm khuôn bế (tên, kích thước, vị trí)..."
                    value={dieSearchTerm}
                    onChange={(e) => setDieSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Die grid */}
                {isLoadingDies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : availableDies.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                    {dieSearchTerm.trim()
                      ? "Không tìm thấy khuôn bế phù hợp"
                      : "Không có khuôn bế có sẵn. Vui lòng tạo khuôn mới."}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto p-2 border rounded-lg">
                    {availableDies.map((die) => {
                      const isSelected = die.id
                        ? selectedDieIds.includes(die.id)
                        : false;
                      const canSelect =
                        !isSelected && selectedDieIds.length < dieCount;

                      return (
                        <div
                          key={die.id}
                          className={cn(
                            "relative border rounded-lg overflow-hidden cursor-pointer transition-all",
                            isSelected
                              ? "ring-2 ring-primary border-primary"
                              : canSelect
                                ? "hover:border-primary hover:shadow-md"
                                : "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (die.id && canSelect) {
                              toggleDieSelection(die.id);
                            } else if (die.id && isSelected) {
                              toggleDieSelection(die.id);
                            }
                          }}
                        >
                          {/* Die image */}
                          <div className="aspect-square bg-muted/30 relative h-24">
                            {die.imageUrl ? (
                              <img
                                src={die.imageUrl}
                                alt={die.name || "Khuôn bế"}
                                className="w-full h-full object-contain cursor-zoom-in"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageUrl(die.imageUrl || null);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          {/* Die info */}
                          <div className="p-1.5 space-y-0.5">
                            <p className="font-medium text-xs truncate">
                              {die.name || "—"}
                            </p>
                            {die.size && (
                              <p className="text-xs text-muted-foreground truncate">
                                {die.size}
                              </p>
                            )}
                            {die.location && (
                              <p className="text-xs text-muted-foreground truncate">
                                📍 {die.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedDieIds.length > 0 && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Đã chọn {selectedDieIds.length} khuôn:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDieIds.map((dieId) => {
                        const die = availableDies.find((d) => d.id === dieId);
                        return (
                          <div
                            key={dieId}
                            className="flex items-center gap-2 px-2 py-1 bg-background border rounded text-sm"
                          >
                            <span>{die?.name || `Khuôn #${dieId}`}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDieSelection(dieId);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                <div className="space-y-2">
                  <Label htmlFor="dieName">
                    Tên khuôn bế <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dieName"
                    placeholder="Nhập tên khuôn bế..."
                    value={dieName}
                    onChange={(e) => setDieName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dieSize">Kích thước</Label>
                    <Input
                      id="dieSize"
                      placeholder="VD: 100x200"
                      value={dieSize}
                      onChange={(e) => setDieSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diePrice">Giá (VND)</Label>
                    <Input
                      id="diePrice"
                      type="number"
                      placeholder="Nhập giá..."
                      value={diePrice || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setDiePrice(undefined);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setDiePrice(numValue);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dieImage">Ảnh khuôn bế</Label>
                  <Input
                    id="dieImage"
                    type="file"
                    accept="image/*"
                    onChange={handleDieImageChange}
                  />
                  {dieImagePreview && (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={dieImagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => {
                          setDieImage(null);
                          if (dieImagePreview) {
                            URL.revokeObjectURL(dieImagePreview);
                            setDieImagePreview(null);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Đơn vị làm khuôn - chỉ hiện khi tạo khuôn mới */}
          {dieAction === "create" && (
            <div className="space-y-2">
              <Label>
                Đơn vị làm khuôn <span className="text-destructive">*</span>
              </Label>
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
                        className="flex-1 justify-between"
                        disabled={loadingVendors}
                      >
                        {selectedVendor
                          ? selectedVendor.name
                          : "Chọn nhà cung cấp..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
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
                                {vendor.name}
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
                    onClick={() => setIsCreatingVendor(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Mới
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tên nhà cung cấp..."
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingVendor(false);
                        setVendorName("");
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreateVendor}
                      disabled={!vendorName.trim() || creatingVendor}
                    >
                      {creatingVendor ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Lưu"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nhập tên nhà cung cấp và nhấn "Lưu" để tạo mới
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Ảnh khuôn bế - chỉ hiển thị khi tạo khuôn mới */}
          {dieAction === "create" && (
            <div className="space-y-2">
              <Label htmlFor="dieFiles">
                Ảnh khuôn bế <span className="text-destructive">*</span>
              </Label>
              {dieFiles.length === 0 &&
                existingImages.length === 0 &&
                !existingImageUrl && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click để chọn ảnh hoặc kéo thả vào đây
                      </span>
                      <span className="text-xs text-muted-foreground">
                        File ảnh (JPG, PNG, ...) - tối đa 10MB mỗi file
                      </span>
                    </label>
                  </div>
                )}
              {(dieFiles.length > 0 ||
                existingImages.length > 0 ||
                existingImageUrl) && (
                <div className="space-y-3">
                  {existingImages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ảnh đã lưu:
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {existingImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden bg-muted/30"
                          >
                            <img
                              src={imageUrl}
                              alt={`Ảnh khuôn bế ${index + 1}`}
                              className="w-full h-32 object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {existingImageUrl && existingImages.length === 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ảnh đã lưu:
                      </Label>
                      <div className="border rounded-lg overflow-hidden bg-muted/30">
                        <img
                          src={existingImageUrl}
                          alt="Ảnh khuôn bế"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {dieFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ảnh mới:
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {dieFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden bg-muted/30"
                          >
                            <img
                              src={imagePreviews[index]}
                              alt={`Preview ${file.name}`}
                              className="w-full h-32 object-contain"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
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
          )}

          {/* Thời gian có khuôn */}
          <div className="space-y-2">
            <Label htmlFor="receivedAt">Thời gian có khuôn</Label>
            <Input
              id="receivedAt"
              type="datetime-local"
              value={receivedAtManual}
              onChange={(e) => setReceivedAtManual(e.target.value)}
            />
            {receivedAt && (
              <p className="text-xs text-muted-foreground">
                Dự kiến có khuôn:{" "}
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

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú về khuôn bế, mã khuôn..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (dieAction === "create" &&
                dieFiles.length === 0 &&
                existingImages.length === 0 &&
                !existingImageUrl) ||
              (dieAction === "create" && !vendorId && !vendorName.trim()) ||
              (dieAction === "select" &&
                (selectedDieIds.length === 0 ||
                  selectedDieIds.length !== dieCount)) ||
              (dieAction === "create" && !dieName.trim())
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
      </DialogContent>

      {/* Image Preview Dialog */}
      {previewImageUrl && (
        <ImageViewerDialog
          open={!!previewImageUrl}
          onOpenChange={(open) => !open && setPreviewImageUrl(null)}
          imageUrl={previewImageUrl}
          title="Preview khuôn bế"
        />
      )}
    </Dialog>
  );
}
