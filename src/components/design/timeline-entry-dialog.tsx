import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Sparkles, Clipboard, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (image: File | null, description: string) => void;
}

const SMART_SUGGESTIONS = [
  "🎨 Bắt đầu thiết kế layout",
  "📐 Điều chỉnh kích thước",
  "🖌️ Chỉnh sửa màu sắc & họa tiết",
  "📩 Đã gửi thiết kế cho khách duyệt",
  "💬 Khách yêu cầu chỉnh sửa",
  "📑 Đã cập nhật file in chuẩn",
  "✅ Hoàn tất & chốt in",
];

export function TimelineEntryDialog({
  open,
  onOpenChange,
  onAdd,
}: TimelineEntryDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Handle paste image from clipboard (Ctrl + V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!open) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const file = new File([blob], `pasted_image_${Date.now()}.png`, {
            type: blob.type,
          });
          setImageFile(file);
          break;
        }
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      window.addEventListener("paste", handlePaste);
    } else {
      window.removeEventListener("paste", handlePaste);
    }
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [open, handlePaste]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
      }
    }
  };

  const handleSelectSuggestion = (text: string) => {
    const cleanText = text.replace(/^[^\s]+\s*/, ""); // Strip emoji if needed or keep full text
    if (!description.trim()) {
      setDescription(text);
    } else {
      setDescription((prev) => `${prev}. ${text}`);
    }
  };

  const handleSubmit = () => {
    if (description.trim()) {
      onAdd(imageFile, description.trim());
      onOpenChange(false);
      setImageFile(null);
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Thêm tiến trình timeline mới</span>
          </DialogTitle>
          <DialogDescription>
            Ghi nhận hoạt động, tải ảnh hoặc dán ảnh từ clipboard (Ctrl + V)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Gợi ý nhập nhanh */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Gợi ý nhập nhanh mô tả:
              </Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SMART_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="text-xs bg-secondary/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-transparent transition-all rounded-md px-2.5 py-1 text-secondary-foreground font-medium flex items-center gap-1"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả công việc <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="VD: Bắt đầu thiết kế layout, Hoàn thành chỉnh sửa màu sắc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {description.length} ký tự
            </p>
          </div>

          {/* Hình ảnh (Không bắt buộc) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="timeline-image" className="text-sm font-medium">
                Hình ảnh đính kèm{" "}
                <span className="text-muted-foreground font-normal">
                  (Không bắt buộc)
                </span>
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clipboard className="h-3 w-3" /> Hỗ trợ Ctrl + V hoặc kéo thả
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 transition-all text-center relative ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "hover:border-primary/40 border-muted-foreground/25"
              }`}
            >
              {!imageFile ? (
                <div className="flex flex-col items-center justify-center py-2 gap-2 cursor-pointer">
                  <Input
                    id="timeline-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="p-2 bg-muted rounded-full">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Nhấp chọn ảnh hoặc Kéo thả ảnh vào đây
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Hoặc sao chép ảnh và bấm <kbd className="px-1 bg-muted border rounded text-[10px]">Ctrl + V</kbd>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full h-44 object-contain rounded border bg-black/5 dark:bg-white/5"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-90 hover:opacity-100 shadow"
                    onClick={() => setImageFile(null)}
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Đã chọn: <span className="font-semibold text-foreground truncate max-w-[250px]">{imageFile.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="gap-2 bg-primary font-semibold"
          >
            <Upload className="h-4 w-4" />
            Thêm timeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
