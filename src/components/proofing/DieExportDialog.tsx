"use client";

import { useState, useEffect } from "react";
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
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useRecordDieExportWithFile } from "@/hooks/use-proofing-order";
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
  const [dieFile, setDieFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [receivedAtType, setReceivedAtType] = useState<"manual" | "duration">(
    "duration"
  );
  const [durationHours, setDurationHours] = useState<number>(60);
  const [receivedAtManual, setReceivedAtManual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { mutate: recordDie, isPending: recordingDie } = useRecordDieExportWithFile();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
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

  // Calculate receivedAt based on type
  const receivedAt = receivedAtType === "manual" 
    ? (receivedAtManual ? new Date(receivedAtManual).toISOString() : null)
    : (() => {
        const sentAt = new Date();
        const received = new Date(sentAt.getTime() + durationHours * 60 * 1000);
        return received.toISOString();
      })();

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
    // Nếu không có file mới và không có file cũ, yêu cầu upload file
    if (!dieFile && !proofingOrder?.dieExport?.imageUrl) {
      toast.error("Vui lòng chọn ảnh khuôn bế");
      return;
    }

    // Record die export với file (nếu có)
    recordDie(
      {
        id: proofingOrderId,
        file: dieFile || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  const existingFileUrl = proofingOrder?.dieExport?.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Xuất khuôn bế</DialogTitle>
          <DialogDescription>
            Upload ảnh khuôn bế và ghi nhận thông tin khuôn bế cho lệnh bình bài này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
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
            disabled={recordingDie || (!dieFile && !existingFileUrl)}
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

