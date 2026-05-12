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
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRecordPlateExport, useUpdatePlateExport } from "@/hooks/use-proofing-order";
import { useActivePlateVendors, useCreateVendor, useActivePrintingVendors } from "@/hooks/use-vendor";
import type { RecordPlateExportRequest, PlateExportResponse, UpdatePlateExportRequest } from "@/Schema";


interface PlateExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofingOrderId: number;
  plateExport?: PlateExportResponse | null;
  onSuccess?: () => void;
}

export function PlateExportDialog({
  open,
  onOpenChange,
  proofingOrderId,
  plateExport,
  onSuccess,
}: PlateExportDialogProps) {
  const [plateCount, setPlateCount] = useState<number>(1);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState<string>("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [receivedAtManual, setReceivedAtManual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [productionMethod, setProductionMethod] = useState<"in_house" | "outsource">("in_house");
  const [printingVendorId, setPrintingVendorId] = useState<number | null>(null);


  const { data: vendors, isLoading: loadingVendors } = useActivePlateVendors();
  const { data: printingVendors, isLoading: loadingPrintingVendors } = useActivePrintingVendors();
  const { mutate: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: recordPlate, isPending: recordingPlate } =
    useRecordPlateExport();
  const { mutate: updatePlate, loading: updatingPlate } =
    useUpdatePlateExport();

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

  // Helper function to convert ISO datetime string to datetime-local format
  const convertISOToLocalDateTime = useCallback((isoString: string | null | undefined): string => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      // Format as "YYYY-MM-DDTHH:mm" for datetime-local input
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

  // Reset or map form data when dialog opens
  useEffect(() => {
    if (open) {
      if (plateExport) {
        // Map existing data when editing
        setPlateCount(plateExport.plateCount ?? 1);
        setVendorId(plateExport.plateVendorId ?? null);
        setVendorName(plateExport.vendorName ?? "");
        setIsCreatingVendor(!plateExport.plateVendorId && !!plateExport.vendorName);
        setVendorSearchOpen(false);
        // Use receivedAt or estimatedReceiveAt for the datetime input
        setReceivedAtManual(
          convertISOToLocalDateTime(plateExport.receivedAt ?? plateExport.estimatedReceiveAt)
        );
        setNotes(plateExport.notes ?? "");
        setProductionMethod((plateExport as any).productionMethod ?? "in_house");
        setPrintingVendorId((plateExport as any).printingVendorId ?? null);
      } else {
        // Reset to default when creating new
        setPlateCount(1);
        setVendorId(null);
        setVendorName("");
        setIsCreatingVendor(false);
        setVendorSearchOpen(false);
        setReceivedAtManual("");
        setNotes("");
        setProductionMethod("in_house");
        setPrintingVendorId(null);
      }
    }
  }, [open, plateExport, convertISOToLocalDateTime]);

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
        vendorType: "plate", // Specify vendor type as plate
      },
      {
        onSuccess: (newVendor) => {
          setVendorId(newVendor.id);
          setIsCreatingVendor(false);
          setVendorName("");
          toast.success("Đã tạo nhà cung cấp mới");
        },
        onError: (error: any) => {
          toast.error("Không thể tạo nhà cung cấp", {
            description:
              error?.response?.data?.message ||
              error?.message ||
              "Có lỗi xảy ra",
          });
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị ghi kẽm");
      return;
    }

    if (productionMethod === "outsource" && !printingVendorId) {
      toast.error("Vui lòng chọn đơn vị in ngoài");
      return;
    }

    // estimatedReceiveAt is same as receivedAt for now
    const estimatedReceiveAt = receivedAt;

    if (plateExport?.id) {
      // UPDATE EXISTING
      const updateRequest: UpdatePlateExportRequest = {
        plateCount,
        plateVendorId: vendorId || undefined,
        vendorName: vendorId ? undefined : vendorName.trim() || undefined,
        estimatedReceiveAt: estimatedReceiveAt || undefined,
        receivedAt: receivedAt || undefined,
        notes: notes.trim() || undefined,
        productionMethod,
        printingVendorId: productionMethod === "outsource" ? (printingVendorId || undefined) : undefined,
      } as any;

      updatePlate(plateExport.id, updateRequest).then(() => {
          onSuccess?.();
          onOpenChange(false);
      });
    } else {
      // RECORD NEW
      // sentAt is current local time, format with timezone offset
      const sentAt = formatLocalDateTimeWithOffset(new Date());

      const request: RecordPlateExportRequest = {
        plateCount,
        plateVendorId: vendorId,
        vendorName: vendorId ? undefined : vendorName.trim() || undefined,
        sentAt,
        estimatedReceiveAt: estimatedReceiveAt || undefined,
        receivedAt: receivedAt || undefined,
        notes: notes.trim() || undefined,
        productionMethod,
        printingVendorId: productionMethod === "outsource" ? (printingVendorId || undefined) : undefined,
      } as any;

      recordPlate(
        {
          id: proofingOrderId,
          request,
        },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
          },
        }
      );
    }
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plateExport ? "Sửa bản kẽm" : "Xuất bản kẽm"}
          </DialogTitle>
          <DialogDescription>
            {plateExport
              ? "Cập nhật thông tin xuất bản kẽm cho mã bài này."
              : "Ghi nhận thông tin xuất bản kẽm cho mã bài này."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Số lá kẽm */}
          <div className="space-y-2">
            <Label htmlFor="plateCount">
              Số lá kẽm <span className="text-destructive">*</span>
            </Label>
            <Select
              value={plateCount.toString()}
              onValueChange={(value) => setPlateCount(Number(value))}
            >
              <SelectTrigger id="plateCount">
                <SelectValue placeholder="Chọn số lá kẽm" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} lá
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Đơn vị ghi kẽm */}
          <div className="space-y-2">
            <Label>
              Đơn vị ghi kẽm <span className="text-destructive">*</span>
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
                  onClick={() => {
                    setIsCreatingVendor(true);
                    setVendorId(null);
                  }}
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

          {/* Hình thức sản xuất */}
          <div className="space-y-2">
            <Label htmlFor="productionMethod">Hình thức sản xuất</Label>
            <Select
              value={productionMethod === "in_house" ? "in_house" : printingVendorId ? `vendor_${printingVendorId}` : "in_house"}
              onValueChange={(value: string) => {
                if (value === "in_house") {
                  setProductionMethod("in_house");
                  setPrintingVendorId(null);
                } else if (value.startsWith("vendor_")) {
                  const vid = Number(value.replace("vendor_", ""));
                  setProductionMethod("outsource");
                  setPrintingVendorId(vid);
                }
              }}
            >
              <SelectTrigger id="productionMethod">
                <SelectValue placeholder="Chọn hình thức sản xuất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_house">In tại xưởng</SelectItem>
                {loadingPrintingVendors ? (
                  <SelectItem value="__loading" disabled>
                    Đang tải nhà in...
                  </SelectItem>
                ) : (
                  printingVendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={`vendor_${vendor.id}`}>
                      {vendor.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Thời gian có kẽm */}
          <div className="space-y-2">
            <Label htmlFor="receivedAt">Thời gian có kẽm</Label>
            <Input
              id="receivedAt"
              type="datetime-local"
              value={receivedAtManual}
              onChange={(e) => setReceivedAtManual(e.target.value)}
            />
            {receivedAt && (
              <p className="text-xs text-muted-foreground">
                Dự kiến có kẽm:{" "}
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
              placeholder="Nhập ghi chú nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={recordingPlate || updatingPlate}>
            {recordingPlate || updatingPlate ? (
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
