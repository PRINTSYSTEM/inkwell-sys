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
import { useCreateStockOut } from "@/hooks/use-stock";
import type { StockOutItemRequest } from "@/Schema/stock.schema";
import { useCustomers } from "@/hooks/use-customer";

export default function StockOutCreatePage() {
  const navigate = useNavigate();
  const { mutate: createStockOut, isPending } = useCreateStockOut();
  const { data: customersData } = useCustomers({ pageSize: 1000 });
  const customers = customersData?.items || [];

  const [formData, setFormData] = useState({
    type: "",
    customerId: null as number | null,
    orderId: null as number | null,
    productionId: null as number | null,
    deliveryNoteId: null as number | null,
    notes: "",
    stockOutDate: new Date().toISOString().split("T")[0],
  });

  const [items, setItems] = useState<StockOutItemRequest[]>([
    {
      itemName: "",
      itemCode: "",
      unit: "",
      quantity: 1,
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
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof StockOutItemRequest,
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

    createStockOut(
      {
        type: formData.type || undefined,
        customerId: formData.customerId || undefined,
        orderId: formData.orderId || undefined,
        productionId: formData.productionId || undefined,
        deliveryNoteId: formData.deliveryNoteId || undefined,
        notes: formData.notes || undefined,
        stockOutDate: formData.stockOutDate
          ? new Date(formData.stockOutDate).toISOString()
          : undefined,
        items: validItems.map((item) => ({
          itemName: item.itemName,
          itemCode: item.itemCode || undefined,
          unit: item.unit || undefined,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      },
      {
        onSuccess: () => {
          navigate("/stock/stock-outs");
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
            <h1 className="text-3xl font-bold">Tạo phiếu xuất kho</h1>
            <p className="text-muted-foreground mt-1">
              Tạo phiếu xuất kho mới cho vật liệu
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu xuất kho</CardTitle>
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
                      <SelectItem value="sale">Bán hàng</SelectItem>
                      <SelectItem value="production">Sản xuất</SelectItem>
                      <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockOutDate">Ngày xuất kho</Label>
                  <Input
                    id="stockOutDate"
                    type="date"
                    value={formData.stockOutDate}
                    onChange={(e) =>
                      setFormData({ ...formData, stockOutDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerId">Khách hàng</Label>
                  <Select
                    value={formData.customerId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        customerId: value ? Number(value) : null,
                      })
                    }
                  >
                    <SelectTrigger id="customerId">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id?.toString() || ""}
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
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
                  <div className="col-span-3 space-y-2">
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
              {isPending ? "Đang tạo..." : "Tạo phiếu xuất kho"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
