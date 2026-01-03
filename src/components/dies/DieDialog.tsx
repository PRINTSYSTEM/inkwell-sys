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
import { useActiveDieVendors, useCreateVendor } from "@/hooks/use-vendor";
import { useCreateDie, useUpdateDie, useUploadDieImage } from "@/hooks/use-die";
import type { DieResponse } from "@/Schema";

interface DieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  die?: DieResponse | null;
  onSuccess?: () => void;
}

export function DieDialog({
  open,
  onOpenChange,
  die,
  onSuccess,
}: DieDialogProps) {
  const isEdit = !!die;
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState<number | undefined>(0);
  const [location, setLocation] = useState("");
  const [isUsable, setIsUsable] = useState(true);
  const [notes, setNotes] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: vendors, isLoading: loadingVendors } = useActiveDieVendors();
  const { mutate: createVendor, isPending: creatingVendor } = useCreateVendor();
  const { mutate: createDie, isPending: creatingDie } = useCreateDie();
  const { mutate: updateDie, isPending: updatingDie } = useUpdateDie();
  const { mutate: uploadImage, isPending: uploadingImage } =
    useUploadDieImage();

  // Reset form when dialog opens/closes or die changes
  useEffect(() => {
    if (open) {
      if (die) {
        setName(die.name || "");
        setSize(die.size || "");
        setPrice(die.price ?? 0);
        setLocation(die.location || "");
        setIsUsable(die.isUsable ?? true);
        setNotes(die.notes || "");
        setVendorId(die.vendorId ?? null);
        setImagePreview(die.imageUrl || null);
        setImage(null);
      } else {
        setName("");
        setSize("");
        setPrice(0);
        setLocation("");
        setIsUsable(true);
        setNotes("");
        setVendorId(null);
        setImagePreview(null);
        setImage(null);
      }
      setVendorName("");
      setIsCreatingVendor(false);
    }
  }, [open, die]);

  // Cleanup image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setImage(file);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(isEdit && die?.imageUrl ? die.imageUrl : null);
  };

  const handleCreateVendor = () => {
    if (!vendorName.trim()) {
      toast.error("Vui lòng nhập tên nhà cung cấp");
      return;
    }

    createVendor(
      {
        name: vendorName.trim(),
        vendorType: "die",
        isActive: true,
      },
      {
        onSuccess: (newVendor) => {
          if (newVendor.id) {
            setVendorId(newVendor.id);
            setVendorName("");
            setIsCreatingVendor(false);
            toast.success("Đã tạo nhà cung cấp thành công");
          }
        },
      }
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên khuôn bế");
      return;
    }

    if (isEdit && die?.id) {
      // Update die
      updateDie(
        {
          id: die.id,
          data: {
            name: name.trim(),
            size: size.trim() || null,
            price: price ?? null,
            location: location.trim() || null,
            isUsable,
            notes: notes.trim() || null,
          },
        },
        {
          onSuccess: async (updatedDie) => {
            // Upload image if there's a new image
            if (image && updatedDie.id) {
              uploadImage(
                { id: updatedDie.id, image },
                {
                  onSuccess: () => {
                    onSuccess?.();
                    onOpenChange(false);
                  },
                }
              );
            } else {
              onSuccess?.();
              onOpenChange(false);
            }
          },
        }
      );
    } else {
      // Create die
      if (!vendorId) {
        toast.error("Vui lòng chọn nhà cung cấp");
        return;
      }

      createDie(
        {
          name: name.trim(),
          size: size.trim() || "",
          price: price ?? 0,
          vendorId,
          notes: notes.trim() || "",
          image: image || null,
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

  const isLoading = creatingDie || updatingDie || uploadingImage;
  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa khuôn bế" : "Thêm khuôn bế mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin khuôn bế"
              : "Điền thông tin để tạo khuôn bế mới"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tên khuôn bế */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên khuôn bế <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên khuôn bế..."
            />
          </div>

          {/* Nhà cung cấp - chỉ hiển thị khi tạo mới */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Nhà cung cấp <span className="text-destructive">*</span>
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
                        <CommandInput placeholder="Tìm nhà cung cấp..." />
                        <CommandList>
                          <CommandEmpty>
                            Không tìm thấy nhà cung cấp
                          </CommandEmpty>
                          <CommandGroup>
                            {vendors?.map((vendor) => (
                              <CommandItem
                                key={vendor.id}
                                value={vendor.name || ""}
                                onSelect={() => {
                                  setVendorId(vendor.id ?? null);
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
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingVendor(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo mới
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

          {/* Kích thước và Giá */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Kích thước</Label>
              <Input
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Nhập kích thước..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input
                id="price"
                type="number"
                value={price ?? ""}
                onChange={(e) =>
                  setPrice(e.target.value ? parseFloat(e.target.value) : 0)
                }
                placeholder="Nhập giá..."
              />
            </div>
          </div>

          {/* Vị trí - chỉ hiển thị khi edit */}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="location">Vị trí lưu kho</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhập vị trí lưu kho..."
              />
            </div>
          )}

          {/* Trạng thái - chỉ hiển thị khi edit */}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="isUsable">Trạng thái</Label>
              <Select
                value={isUsable ? "usable" : "unusable"}
                onValueChange={(value) => setIsUsable(value === "usable")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usable">Sử dụng được</SelectItem>
                  <SelectItem value="unusable">Không sử dụng được</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ảnh khuôn bế */}
          <div className="space-y-2">
            <Label htmlFor="image">Ảnh khuôn bế</Label>
            {!imagePreview ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
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
            ) : (
              <div className="relative">
                <div className="relative w-full h-48 rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
