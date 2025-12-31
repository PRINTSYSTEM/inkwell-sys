import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { TruncatedText } from "@/components/ui/truncated-text";
import { toast } from "sonner";
import { Upload, X, AlertCircle } from "lucide-react";

interface DesignFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => void;
  mode?: "create" | "edit";
  initialData?: {
    fileUrl?: string;
    imageUrl?: string;
  };
}

// Helper function to check if file is an image
const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

// Helper function to check if file is a design file (.ai)
const isDesignFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith(".ai") || file.type === "application/postscript";
};

export function DesignFileUploadDialog({
  open,
  onOpenChange,
  onUpload,
  mode = "create",
  initialData,
}: DesignFileUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Reset files when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFiles([]);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    // Phân loại files mới
    const newDesignFiles = newFiles.filter((f) => isDesignFile(f));
    const newImageFiles = newFiles.filter((f) => isImageFile(f));
    
    // Kiểm tra số lượng
    if (newDesignFiles.length > 1) {
      toast.error("Lỗi", {
        description: "Chỉ được chọn 1 file thiết kế (.ai)",
      });
      e.target.value = ""; // Reset input
      return;
    }
    
    if (newImageFiles.length > 1) {
      toast.error("Lỗi", {
        description: "Chỉ được chọn 1 file ảnh",
      });
      e.target.value = ""; // Reset input
      return;
    }
    
    // Kiểm tra tổng số file
    if (newFiles.length > 2) {
      toast.error("Lỗi", {
        description: "Chỉ được chọn tối đa 1 file thiết kế và 1 file ảnh",
      });
      e.target.value = ""; // Reset input
      return;
    }
    
    // Kiểm tra nếu đã có file cùng loại thì thay thế
    setSelectedFiles((prev) => {
      let updated = [...prev];
      
      // Thay thế file design nếu có
      if (newDesignFiles.length > 0) {
        updated = updated.filter((f) => !isDesignFile(f));
        updated.push(newDesignFiles[0]);
      }
      
      // Thay thế file ảnh nếu có
      if (newImageFiles.length > 0) {
        updated = updated.filter((f) => !isImageFile(f));
        updated.push(newImageFiles[0]);
      }
      
      return updated;
    });
    
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Cleanup object URL if it's an image
      if (isImageFile(prev[index])) {
        const url = URL.createObjectURL(prev[index]);
        URL.revokeObjectURL(url);
      }
      return newFiles;
    });
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      onOpenChange(false);
    }
  };

  // Classify files
  const designFile = selectedFiles.find((f) => isDesignFile(f));
  const imageFile = selectedFiles.find((f) => isImageFile(f));
  const hasBothFiles = designFile && imageFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="space-y-4 py-4 flex-1 min-h-0 flex flex-col">
          {/* Chọn nhiều file cùng lúc */}
          <div className="space-y-2 flex-shrink-0">
            <Label htmlFor="files" className="text-sm font-medium">
              Chọn file thiết kế và ảnh <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
              <Input
                id="files"
                type="file"
                accept=".ai,image/*"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Chọn 1 file .ai và 1 file ảnh (JPG, PNG, ...)
              </p>
            </div>
          </div>

          {/* Hiển thị danh sách file đã chọn */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 flex-1 min-h-0 flex flex-col">
              <Label className="text-sm font-medium flex-shrink-0">Files đã chọn:</Label>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2 pr-4">
                  {selectedFiles.map((file, index) => {
                    const isImage = isImageFile(file);
                    const isDesign = isDesignFile(file);
                    const fileType = isDesign
                      ? "File thiết kế"
                      : isImage
                        ? "Ảnh"
                        : "File khác";

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 min-w-0"
                      >
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded border shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded border bg-background flex items-center justify-center shrink-0">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <TruncatedText
                            text={file.name}
                            className="text-sm font-medium"
                          />
                          <p className="text-xs text-muted-foreground">
                            {fileType} • {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {!hasBothFiles && (
                <p className="text-xs text-amber-600 flex items-center gap-1 flex-shrink-0 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  Cần có ít nhất 1 file .ai và 1 file ảnh
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 flex-shrink-0 border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasBothFiles}
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
