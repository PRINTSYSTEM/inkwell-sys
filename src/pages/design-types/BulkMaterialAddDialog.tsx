import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENTITY_CONFIG } from "@/config/entities.config";
import { useBulkAddMaterials } from "@/hooks/use-material-type";

interface MaterialForm {
  code: string;
  name: string;
  displayOrder: number;
  description: string;
  price: number;
  pricePerCm2: number;
  status: "active" | "inactive";
}

export function BulkMaterialAddDialog({
  designTypeId,
  onSuccess,
}: {
  designTypeId: number;
  onSuccess?: () => void;
}) {
  const [materials, setMaterials] = useState<MaterialForm[]>([
    {
      code: "",
      name: "",
      displayOrder: 0,
      description: "",
      price: 0,
      pricePerCm2: 0,
      status: Object.keys(ENTITY_CONFIG.commonStatuses.values)[0] as
        | "active"
        | "inactive",
    },
  ]);
  const [open, setOpen] = useState(false);
  const bulkAdd = useBulkAddMaterials();

  const handleChange = (
    idx: number,
    field: keyof MaterialForm,
    value: string | number | "active" | "inactive"
  ) => {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[idx][field] = value as never;
      return copy;
    });
  };

  const handleAddRow = () => {
    setMaterials((prev) => [
      ...prev,
      {
        code: "",
        name: "",
        displayOrder: 0,
        description: "",
        price: 0,
        pricePerCm2: 0,
        status: "active",
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    await bulkAdd.mutateAsync({ designTypeId, materials });
    setOpen(false);
    setMaterials([
      {
        code: "",
        name: "",
        displayOrder: 0,
        description: "",
        price: 0,
        pricePerCm2: 0,
        status: "active",
      },
    ]);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Thêm nhiều chất liệu</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm nhiều chất liệu cho loại thiết kế</DialogTitle>
          <DialogDescription>
            Nhập thông tin từng chất liệu, sau đó nhấn "Thêm tất cả" để lưu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {materials.map((mat, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 shadow-sm bg-white relative"
            >
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveRow(idx)}
                  disabled={materials.length === 1}
                >
                  Xóa
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã</label>
                  <Input
                    value={mat.code}
                    onChange={(e) => handleChange(idx, "code", e.target.value)}
                    placeholder="Mã chất liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tên chất liệu
                  </label>
                  <Input
                    value={mat.name}
                    onChange={(e) => handleChange(idx, "name", e.target.value)}
                    placeholder="Tên chất liệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Thứ tự
                  </label>
                  <Input
                    type="number"
                    value={mat.displayOrder}
                    onChange={(e) =>
                      handleChange(idx, "displayOrder", Number(e.target.value))
                    }
                    placeholder="Thứ tự"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mô tả
                  </label>
                  <Input
                    value={mat.description}
                    onChange={(e) =>
                      handleChange(idx, "description", e.target.value)
                    }
                    placeholder="Mô tả"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá</label>
                  <Input
                    type="number"
                    value={mat.price}
                    onChange={(e) =>
                      handleChange(idx, "price", Number(e.target.value))
                    }
                    placeholder="Giá"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá/cm2
                  </label>
                  <Input
                    type="number"
                    value={mat.pricePerCm2}
                    onChange={(e) =>
                      handleChange(idx, "pricePerCm2", Number(e.target.value))
                    }
                    placeholder="Giá/cm2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={mat.status}
                    onChange={(e) =>
                      handleChange(idx, "status", e.target.value)
                    }
                    className="border rounded px-2 py-1 w-full"
                  >
                    {Object.entries(ENTITY_CONFIG.commonStatuses.values).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={handleAddRow}>
            Thêm chất liệu
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={bulkAdd.isPending}>
            Thêm tất cả
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
