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
import type { ProofingOrderResponse } from "@/Schema/proofing-order.schema";

interface DieExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofingOrderId: number;
  proofingOrder?: ProofingOrderResponse | null;
  onSuccess?: () => void;
}

// Options for time duration (30 minutes to 3 hours)
const TIME_DURATION_OPTIONS = [
  { value: 30, label: "30 phút" },
  { value: 60, label: "1 giờ" },
  { value: 90, label: "1.5 giờ" },
  { value: 120, label: "2 giờ" },
  { value: 150, label: "2.5 giờ" },
  { value: 180, label: "3 giờ" },
];

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
  const [dieFile, setDieFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [receivedAtType, setReceivedAtType] = useState<"manual" | "duration">(
    "duration"
  );
  const [durationHours, setDurationHours] = useState<number>(60);
  const [receivedAtManual, setReceivedAtManual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: vendors, isLoading: loadingVendors } = useActiveDieVendors();
  const { mutate: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: recordDie, isPending: recordingDie } =
    useRecordDieExportWithFile();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDieCount(1);
      setVendorId(null);
      setVendorName("");
      setIsCreatingVendor(false);
      setVendorSearchOpen(false);
      setDieFile(null);
      setImagePreview(null);
      setReceivedAtType("duration");
      setDurationHours(60);
      setReceivedAtManual("");
      setNotes("");
    }
  }, [open]);

  // Cleanup image preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
  const convertLocalDateTimeToISO = useCallback((localDateTime: string): string => {
    // datetime-local format: "YYYY-MM-DDTHH:mm" (no timezone)
    // Parse as local time
    const date = new Date(localDateTime);
    // Format with local timezone offset
    return formatLocalDateTimeWithOffset(date);
  }, [formatLocalDateTimeWithOffset]);

  // Calculate receivedAt based on type
  const receivedAt = useMemo(() => {
    if (receivedAtType === "manual") {
      return receivedAtManual
        ? convertLocalDateTimeToISO(receivedAtManual)
        : null;
    } else {
      // duration: sentAt + durationHours
      // sentAt is current local time
      const sentAt = new Date();
      const received = new Date(sentAt.getTime() + durationHours * 60 * 1000);
      // Format with local timezone offset
      return formatLocalDateTimeWithOffset(received);
    }
  }, [receivedAtType, receivedAtManual, durationHours, convertLocalDateTimeToISO, formatLocalDateTimeWithOffset]);

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
            description: error?.response?.data?.message || error.message,
          });
        },
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra file ảnh
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 10MB");
        return;
      }
      setDieFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveFile = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setDieFile(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị làm khuôn bế");
      return;
    }

    // Nếu không có file mới và không có file cũ, yêu cầu upload file
    if (!dieFile && !proofingOrder?.dieExport?.imageUrl) {
      toast.error("Vui lòng chọn ảnh khuôn bế");
      return;
    }

    // sentAt is current local time, format with timezone offset
    const sentAt = formatLocalDateTimeWithOffset(new Date());
    // estimatedReceiveAt is same as receivedAt for now
    const estimatedReceiveAt = receivedAt;

    // Record die export với file (nếu có)
    recordDie(
      {
        id: proofingOrderId,
        file: dieFile || undefined,
        notes: notes.trim() || undefined,
        dieVendorId: vendorId || undefined,
        dieCount: dieCount,
        sentAt: sentAt,
        estimatedReceiveAt: estimatedReceiveAt || undefined,
        receivedAt: receivedAt || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  const existingFileUrl = proofingOrder?.dieExport?.imageUrl;

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
            <Label htmlFor="dieFile">
              Ảnh khuôn bế <span className="text-destructive">*</span>
            </Label>
            {!dieFile && !existingFileUrl && (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="dieFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="dieFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click để chọn ảnh hoặc kéo thả vào đây
                  </span>
                  <span className="text-xs text-muted-foreground">
                    File ảnh (JPG, PNG, ...) - tối đa 10MB
                  </span>
                </label>
              </div>
            )}
            {(dieFile || existingFileUrl || imagePreview) && (
              <div className="space-y-2">
                {/* Preview ảnh */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  {(imagePreview || existingFileUrl) && (
                    <div className="mb-3">
                      <img
                        src={imagePreview || existingFileUrl || ""}
                        alt="Preview ảnh khuôn bế"
                        className="w-full max-h-64 object-contain rounded-lg border bg-background"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {dieFile && (
                      <>
                        <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {dieFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(dieFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {existingFileUrl && !dieFile && (
                      <div className="w-full">
                        <p className="text-xs text-muted-foreground">
                          Ảnh đã được lưu
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="dieFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="dieFile">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        {existingFileUrl && !dieFile
                          ? "Thay đổi ảnh"
                          : "Chọn ảnh khác"}
                      </span>
                    </Button>
                  </label>
                  {dieFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thời gian có khuôn */}
          <div className="space-y-2">
            <Label>Thời gian có khuôn</Label>
            <div className="flex gap-2 mb-2">
              <Button
                variant={receivedAtType === "duration" ? "default" : "outline"}
                size="sm"
                onClick={() => setReceivedAtType("duration")}
              >
                Chọn thời gian
              </Button>
              <Button
                variant={receivedAtType === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setReceivedAtType("manual")}
              >
                Nhập thủ công
              </Button>
            </div>
            {receivedAtType === "duration" ? (
              <Select
                value={durationHours.toString()}
                onValueChange={(value) => setDurationHours(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_DURATION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="datetime-local"
                value={receivedAtManual}
                onChange={(e) => setReceivedAtManual(e.target.value)}
              />
            )}
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
              recordingDie ||
              (!dieFile && !existingFileUrl) ||
              (!vendorId && !vendorName.trim())
            }
          >
            {recordingDie ? (
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
