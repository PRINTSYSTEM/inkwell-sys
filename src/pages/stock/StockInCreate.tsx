import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreateStockIn } from "@/hooks/use-stock";
import type { StockInItemRequest } from "@/Schema/stock.schema";
import { useVendors } from "@/hooks/use-vendor";
import { vendorTypeLabels } from "@/lib/status-utils";

export default function StockInCreatePage() {
  const navigate = useNavigate();
  const { mutate: createStockIn, isPending } = useCreateStockIn();
  const { data: vendorsData } = useVendors({ pageSize: 1000 });
  const allVendors = vendorsData?.items || [];

  const [formData, setFormData] = useState({
    type: "",
    supplierType: "" as string,
    supplierId: null as number | null,
    orderId: null as number | null,
    productionId: null as number | null,
    notes: "",
    stockInDate: new Date().toISOString().split("T")[0],
  });

  // Filter vendors based on selected supplier type
  const filteredVendors = formData.supplierType
    ? allVendors.filter(
        (vendor) =>
          vendor.vendorType?.toLowerCase() ===
          formData.supplierType.toLowerCase()
      )
    : allVendors;

  const [items, setItems] = useState<StockInItemRequest[]>([
    {
      itemName: "",
      itemCode: "",
      unit: "",
      quantity: 1,
      unitPrice: null,
      notes: "",
    },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        itemCode: "",
        unit: "",
        quantity: 1,
        unitPrice: null,
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof StockInItemRequest,
    value: string | number | null
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate items
    const validItems = items.filter(
      (item) => item.itemName.trim() && item.quantity > 0
    );

    if (validItems.length === 0) {
      alert("Vui lòng thêm ít nhất một vật phẩm");
      return;
    }

    createStockIn(
      {
        type: formData.type || undefined,
        supplierId: formData.supplierId || undefined,
        orderId: formData.orderId || undefined,
        productionId: formData.productionId || undefined,
        notes: formData.notes || undefined,
        stockInDate: formData.stockInDate
          ? new Date(formData.stockInDate).toISOString()
          : undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName,
          itemCode: item.itemCode || undefined,
          unit: item.unit || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice || undefined,
          notes: item.notes || undefined,
        })),
      },
      {
        onSuccess: () => {
          navigate("/stock/stock-ins");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tạo phiếu nhập kho</h1>
            <p className="text-muted-foreground mt-1">
              Tạo phiếu nhập kho mới cho vật liệu
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu nhập kho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Loại phiếu</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Chọn loại phiếu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Mua hàng</SelectItem>
                      <SelectItem value="return">Trả hàng</SelectItem>
                      <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockInDate">Ngày nhập kho</Label>
                  <Input
                    id="stockInDate"
                    type="date"
                    value={formData.stockInDate}
                    onChange={(e) =>
                      setFormData({ ...formData, stockInDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierType">Loại nhà cung cấp</Label>
                  <Select
                    value={formData.supplierType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        supplierType: value,
                        supplierId: null, // Reset supplier when type changes
                      })
                    }
                  >
                    <SelectTrigger id="supplierType">
                      <SelectValue placeholder="Chọn loại nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả</SelectItem>
                      {Object.entries(vendorTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierId">Nhà cung cấp</Label>
                  <Select
                    value={formData.supplierId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        supplierId: value ? Number(value) : null,
                      })
                    }
                    disabled={!formData.supplierType}
                  >
                    <SelectTrigger id="supplierId">
                      <SelectValue
                        placeholder={
                          formData.supplierType
                            ? "Chọn nhà cung cấp"
                            : "Chọn loại nhà cung cấp trước"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVendors.length === 0 ? (
                        <SelectItem value="" disabled>
                          Không có nhà cung cấp nào
                        </SelectItem>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id?.toString() || ""}
                          >
                            {vendor.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Nhập ghi chú..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách vật phẩm</CardTitle>
                <Button type="button" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vật phẩm
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-lg"
                >
                  <div className="col-span-4 space-y-2">
                    <Label>Tên vật phẩm *</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) =>
                        handleItemChange(index, "itemName", e.target.value)
                      }
                      placeholder="Nhập tên vật phẩm"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Mã vật phẩm</Label>
                    <Input
                      value={item.itemCode || ""}
                      onChange={(e) =>
                        handleItemChange(index, "itemCode", e.target.value)
                      }
                      placeholder="Mã vật phẩm"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Đơn vị</Label>
                    <Input
                      value={item.unit || ""}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                      placeholder="Đơn vị"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Giá</Label>
                    <Input
                      type="number"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unitPrice",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Giá"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo phiếu nhập kho"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
