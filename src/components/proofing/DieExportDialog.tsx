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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRecordDieExportWithFile } from "@/hooks/use-proofing-order";
import { useActiveDieVendors, useCreateVendor } from "@/hooks/use-vendor";
import {
  useCreateDieFromDieExport,
  useDies,
  useDiesByProofingOrder,
} from "@/hooks/use-die";
import type { ProofingOrderResponse } from "@/Schema/proofing-order.schema";
import type { CreateDieRequest } from "@/Schema";
import { getErrorMessage } from "@/services/BaseService";

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
  const [dieAction, setDieAction] = useState<"select" | "create">("create");
  const [selectedDieId, setSelectedDieId] = useState<number | null>(null);
  const [dieSearchOpen, setDieSearchOpen] = useState(false);
  const [dieName, setDieName] = useState<string>("");
  const [dieSize, setDieSize] = useState<string>("");
  const [diePrice, setDiePrice] = useState<number | undefined>(undefined);

  const { data: vendors, isLoading: loadingVendors } = useActiveDieVendors();
  const { mutate: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: recordDie, isPending: recordingDie } =
    useRecordDieExportWithFile();
  const { mutate: createDieFromDieExport, isPending: creatingDie } =
    useCreateDieFromDieExport();

  // Fetch available dies for selection
  const { data: diesData, isLoading: loadingDies } = useDies({
    isUsable: true,
    pageSize: 100,
  });
  const availableDies = diesData?.items || [];

  // Fetch dies already assigned to this proofing order
  const { data: assignedDies } = useDiesByProofingOrder(proofingOrderId, open);

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
      setDieAction("create");
      setSelectedDieId(null);
      setDieSearchOpen(false);
      setDieName("");
      setDieSize("");
      setDiePrice(undefined);
    }
  }, [open]);

  // Cleanup image preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  // Helper function to format local datetime with timezone offset
  // Returns format: "YYYY-MM-DDTHH:mm:ss+HH:mm" (e.g., "2025-01-01T10:00:00+07:00")
  const formatLocalDateTimeWithOffset = useCallback((date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    // Get timezone offset in minutes and convert to hours and minutes
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes <= 0 ? "+" : "-"; // Note: getTimezoneOffset() returns negative for positive offsets

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${pad(offsetHours)}:${pad(offsetMins)}`;
  }, []);

  // Helper function to convert datetime-local string to local datetime with offset
  const convertLocalDateTimeToISO = useCallback(
    (localDateTime: string): string => {
      // datetime-local format: "YYYY-MM-DDTHH:mm" (no timezone)
      // Parse as local time
      const date = new Date(localDateTime);
      // Format with local timezone offset
      return formatLocalDateTimeWithOffset(date);
    },
    [formatLocalDateTimeWithOffset]
  );

  // Calculate receivedAt from manual input
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
        vendorType: "die", // Specify vendor type as die
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

    // Validate all files
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      // Kiểm tra file ảnh
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

    // Reset input
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

  const handleSubmit = () => {
    if (!vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị làm khuôn bế");
      return;
    }

    // Nếu không có file mới và không có ảnh cũ, yêu cầu upload file
    if (
      dieFiles.length === 0 &&
      !proofingOrder?.dieExport?.imageUrl &&
      (!proofingOrder?.dieExport?.images ||
        proofingOrder.dieExport.images.length === 0)
    ) {
      toast.error("Vui lòng chọn ít nhất một ảnh khuôn bế");
      return;
    }

    // Validate die selection/creation
    if (dieAction === "select" && !selectedDieId) {
      toast.error("Vui lòng chọn khuôn bế từ danh sách");
      return;
    }

    if (dieAction === "create" && !dieName.trim()) {
      toast.error("Vui lòng nhập tên khuôn bế");
      return;
    }

    // sentAt is current local time, format with timezone offset
    const sentAt = formatLocalDateTimeWithOffset(new Date());
    // estimatedReceiveAt is same as receivedAt for now
    const estimatedReceiveAt = receivedAt;

    // Record die export với files (nếu có)
    recordDie(
      {
        id: proofingOrderId,
        files: dieFiles.length > 0 ? dieFiles : undefined,
        notes: notes.trim() || undefined,
        dieVendorId: vendorId || undefined,
        dieCount: dieCount,
        sentAt: sentAt,
        estimatedReceiveAt: estimatedReceiveAt || undefined,
        receivedAt: receivedAt || undefined,
      },
      {
        onSuccess: (response) => {
          // If creating die from die export and dieExportId exists
          if (dieAction === "create" && response?.dieExport?.id) {
            const dieExportId = response.dieExport.id;
            const createDieData: CreateDieRequest = {
              name: dieName.trim(),
              size: dieSize.trim() || undefined,
              price: diePrice || undefined,
              vendorId: vendorId || undefined,
              notes: notes.trim() || undefined,
            };

            createDieFromDieExport(
              {
                dieExportId,
                data: createDieData,
              },
              {
                onSuccess: () => {
                  onSuccess?.();
                  onOpenChange(false);
                },
                onError: () => {
                  // Die export was recorded but die creation failed
                  // Still call onSuccess to refresh the page
                  onSuccess?.();
                  onOpenChange(false);
                },
              }
            );
          } else {
            // Just record die export, no die creation needed
            onSuccess?.();
            onOpenChange(false);
          }
        },
      }
    );
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  const existingImages = proofingOrder?.dieExport?.images || [];
  const existingImageUrl = proofingOrder?.dieExport?.imageUrl; // Fallback for old data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Xuất khuôn bế</DialogTitle>
          <DialogDescription>
            Upload ảnh khuôn bế và ghi nhận thông tin khuôn bế cho lệnh bình bài
            này.
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
              onValueChange={(value) => setDieCount(Number(value))}
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
          </div>

          {/* Đơn vị làm khuôn */}
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
                            <p className="mb-2">Không tìm thấy nhà cung cấp</p>
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

          {/* Ảnh khuôn bế */}
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
                {/* Preview existing images */}
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
                {/* Fallback for old single imageUrl */}
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

                {/* Preview new images */}
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

                {/* Add more images button */}
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

          {/* Chọn hoặc tạo khuôn bế */}
          <div className="space-y-2">
            <Label>Khuôn bế</Label>
            <div className="flex gap-2 mb-2">
              <Button
                variant={dieAction === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDieAction("select");
                  setSelectedDieId(null);
                  setDieName("");
                  setDieSize("");
                  setDiePrice(undefined);
                }}
              >
                Chọn khuôn có sẵn
              </Button>
              <Button
                variant={dieAction === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setDieAction("create");
                  setSelectedDieId(null);
                }}
              >
                Tạo khuôn mới
              </Button>
            </div>

            {dieAction === "select" ? (
              <Popover open={dieSearchOpen} onOpenChange={setDieSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={loadingDies}
                  >
                    {selectedDieId
                      ? availableDies.find((d) => d.id === selectedDieId)
                          ?.name || "Chọn khuôn..."
                      : "Chọn khuôn bế..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm kiếm khuôn bế..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-4 text-center text-sm">
                          Không tìm thấy khuôn bế
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {availableDies.map((die) => (
                          <CommandItem
                            key={die.id}
                            value={die.name || ""}
                            onSelect={() => {
                              setSelectedDieId(die.id || null);
                              setDieSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDieId === die.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{die.name}</span>
                              {die.size && (
                                <span className="text-xs text-muted-foreground">
                                  Kích thước: {die.size}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-3">
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
              </div>
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
              recordingDie ||
              creatingDie ||
              (dieFiles.length === 0 &&
                existingImages.length === 0 &&
                !existingImageUrl) ||
              (!vendorId && !vendorName.trim()) ||
              (dieAction === "select" && !selectedDieId) ||
              (dieAction === "create" && !dieName.trim())
            }
          >
            {recordingDie || creatingDie ? (
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
    </Dialog>
  );
}
