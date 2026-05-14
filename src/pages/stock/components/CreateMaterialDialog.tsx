import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateMaterial } from "@/hooks/use-material";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (materialId: number) => void;
  defaultMaterialTypeId?: number;
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultMaterialTypeId,
}: CreateMaterialDialogProps) {
  const { data: materialTypesData } = useMaterialTypeList({ page: 1, size: 1000 });
  const materialTypes = materialTypesData?.items || [];

  const { mutate: createMaterial, isPending } = useCreateMaterial();

  const [formData, setFormData] = useState({
    name: "",
    materialTypeId: defaultMaterialTypeId || 0,
    length: 0,
    width: 0,
    height: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Vui lòng nhập tên vật liệu");
      return;
    }

    if (!formData.materialTypeId) {
      toast.error("Vui lòng chọn loại chất liệu");
      return;
    }

    createMaterial(
      {
        name: formData.name,
        materialTypeId: formData.materialTypeId,
        length: formData.length,
        width: formData.width,
        height: formData.height || undefined,
        quantity: 0,
      },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          if (data.id) onSuccess?.(data.id);
          // Reset form
          setFormData({
            name: "",
            materialTypeId: defaultMaterialTypeId || 0,
            length: 0,
            width: 0,
            height: 0,
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo vật liệu mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên vật liệu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Giấy Kraft 250gsm khổ A3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Loại chất liệu *</Label>
            <Select
              value={formData.materialTypeId.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, materialTypeId: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại chất liệu" />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id?.toString() || ""}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Dài (mm) *</Label>
              <Input
                id="length"
                type="number"
                min="0"
                value={formData.length}
                onChange={(e) =>
                  setFormData({ ...formData, length: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Rộng (mm) *</Label>
              <Input
                id="width"
                type="number"
                min="0"
                value={formData.width}
                onChange={(e) =>
                  setFormData({ ...formData, width: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Cao/Dày (mm)</Label>
            <Input
              id="height"
              type="number"
              min="0"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: parseFloat(e.target.value) })
              }
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo mới
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
