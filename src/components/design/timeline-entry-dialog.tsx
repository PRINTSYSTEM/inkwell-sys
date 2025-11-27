import { useState } from "react";
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
import { Upload } from "lucide-react";

interface TimelineEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (image: File, description: string) => void;
}

export function TimelineEntryDialog({
  open,
  onOpenChange,
  onAdd,
}: TimelineEntryDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (imageFile && description.trim()) {
      onAdd(imageFile, description);
      onOpenChange(false);
      setImageFile(null);
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm timeline mới</DialogTitle>
          <DialogDescription>
            Upload hình ảnh và mô tả công việc đã thực hiện
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hình ảnh */}
          <div className="space-y-2">
            <Label htmlFor="timeline-image" className="text-sm font-medium">
              Hình ảnh <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
              <Input
                id="timeline-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {imageFile && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(imageFile) || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Đã chọn:{" "}
                    <span className="font-medium">{imageFile.name}</span>
                  </p>
                </div>
              )}
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
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length} ký tự
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!imageFile || !description.trim()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Thêm timeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
