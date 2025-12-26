"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useRecordPlateExport } from "@/hooks/use-proofing-order";
import {
  useActivePlateVendors,
  useCreatePlateVendor,
} from "@/hooks/use-plate-vendor";
import type { RecordPlateExportRequest } from "@/Schema";

interface PlateExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofingOrderId: number;
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

export function PlateExportDialog({
  open,
  onOpenChange,
  proofingOrderId,
  onSuccess,
}: PlateExportDialogProps) {
  const [plateCount, setPlateCount] = useState<number>(1);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState<string>("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [receivedAtType, setReceivedAtType] = useState<"manual" | "duration">(
    "duration"
  );
  const [durationHours, setDurationHours] = useState<number>(60);
  const [receivedAtManual, setReceivedAtManual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: vendors, isLoading: loadingVendors } = useActivePlateVendors();
  const { mutate: createVendor, isPending: creatingVendor } =
    useCreatePlateVendor();
  const { mutate: recordPlate, isPending: recordingPlate } =
    useRecordPlateExport();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setPlateCount(1);
      setVendorId(null);
      setVendorName("");
      setIsCreatingVendor(false);
      setVendorSearchOpen(false);
      setReceivedAtType("duration");
      setDurationHours(60);
      setReceivedAtManual("");
      setNotes("");
    }
  }, [open]);

  // Calculate receivedAt based on type
  const receivedAt = useMemo(() => {
    if (receivedAtType === "manual") {
      return receivedAtManual
        ? new Date(receivedAtManual).toISOString()
        : null;
    } else {
      // duration: sentAt + durationHours
      const sentAt = new Date();
      const received = new Date(sentAt.getTime() + durationHours * 60 * 1000);
      return received.toISOString();
    }
  }, [receivedAtType, receivedAtManual, durationHours]);

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

  const handleSubmit = () => {
    if (!vendorId && !vendorName.trim()) {
      toast.error("Vui lòng chọn hoặc nhập đơn vị ghi kẽm");
      return;
    }

    const sentAt = new Date().toISOString();

    const request: RecordPlateExportRequest = {
      plateCount,
      plateVendorId: vendorId,
      vendorName: vendorId ? undefined : vendorName.trim() || undefined,
      sentAt,
      receivedAt: receivedAt || undefined,
      notes: notes.trim() || undefined,
    };

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
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xuất bản kẽm</DialogTitle>
          <DialogDescription>
            Ghi nhận thông tin xuất bản kẽm cho lệnh bình bài này.
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
                <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      disabled={loadingVendors}
                    >
                      {selectedVendor ? selectedVendor.name : "Chọn nhà cung cấp..."}
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

          {/* Thời gian có kẽm */}
          <div className="space-y-2">
            <Label>Thời gian có kẽm</Label>
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
                    <SelectItem key={option.value} value={option.value.toString()}>
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
          <Button onClick={handleSubmit} disabled={recordingPlate}>
            {recordingPlate ? (
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

