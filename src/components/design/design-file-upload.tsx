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
import { Upload } from "lucide-react";

interface DesignFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, image: File) => void;
  mode?: "create" | "edit";
  initialData?: {
    fileUrl?: string;
    imageUrl?: string;
  };
}

export function DesignFileUploadDialog({
  open,
  onOpenChange,
  onUpload,
  mode = "create",
  initialData,
}: DesignFileUploadDialogProps) {
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (designFile && imageFile) {
      onUpload(designFile, imageFile);
      onOpenChange(false);
      setDesignFile(null);
      setImageFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Upload file thiết kế"
              : "Cập nhật file thiết kế"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Upload file .ai và hình ảnh chụp file thiết kế"
              : "Thay thế file .ai và hình ảnh hiện tại"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File thiết kế (.ai) */}
          <div className="space-y-2">
            <Label htmlFor="design-file" className="text-sm font-medium">
              File thiết kế (.ai) <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
              <Input
                id="design-file"
                type="file"
                accept=".ai"
                onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {designFile && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Đã chọn:{" "}
                  <span className="font-medium">{designFile.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Hình ảnh chụp */}
          <div className="space-y-2">
            <Label htmlFor="image-file" className="text-sm font-medium">
              Hình ảnh chụp file <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
              <Input
                id="image-file"
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
                    className="w-full h-32 object-cover rounded border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Đã chọn:{" "}
                    <span className="font-medium">{imageFile.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!designFile || !imageFile}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {mode === "create" ? "Upload" : "Cập nhật"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
