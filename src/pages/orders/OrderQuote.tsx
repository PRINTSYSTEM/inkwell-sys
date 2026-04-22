import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrder, useUpdateOrderForAccounting } from "@/hooks";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/status-utils";

export default function OrderQuotePage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id || "0");
  const navigate = useNavigate();

  const { data: order, isLoading: loadingOrder } = useOrder(orderId || null, !!orderId);
  const { mutate: updateOrder, loading: updating } = useUpdateOrderForAccounting();

  const [edits, setEdits] = useState<Record<number, { unitPrice: number | null; quantity: number | null }>>({});

  useEffect(() => {
    if (!order) return;
    const map: Record<number, { unitPrice: number | null; quantity: number | null }> = {};
    (order.orderDetails || []).forEach((od) => {
      map[od.id] = {
        unitPrice: od.unitPrice ?? null,
        quantity: od.quantity ?? null,
      };
    });
    setEdits(map);
  }, [order]);

  if (loadingOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return null;

  const handleChange = (id: number, field: "unitPrice" | "quantity", value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value === "" ? null : Number(value),
      },
    }));
  };

  const handleSaveQuote = async () => {
    if (!order) return;
    const details = Object.entries(edits).map(([k, v]) => ({
      orderDetailId: Number(k),
      unitPrice: v.unitPrice ?? 0,
      quantity: v.quantity ?? 0,
    }));

    // Validation: at least one positive unitPrice and quantity
    const hasPositive = details.some((d) => d.unitPrice > 0 && d.quantity > 0);
    if (!hasPositive) {
      toast.error("Vui lòng nhập đơn giá và số lượng hợp lệ cho ít nhất một sản phẩm");
      return;
    }

    try {
      await updateOrder(order.id, {
        status: "quoted",
        orderDetails: details,
      } as any);
      toast.success("Đã lưu báo giá");
      navigate(`/orders/${order.id}`);
    } catch (err) {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-2xl font-bold">Báo giá cho đơn {order.code}</h1>
          <p className="text-sm text-muted-foreground">Chỉnh đơn giá và số lượng, sau đó xác nhận báo giá.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <Card>
          <CardHeader>
            <CardTitle>Thiết kế trong đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thiết kế / Mã</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá (VND)</TableHead>
                  <TableHead>Tạm tính</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.orderDetails || []).map((od) => (
                  <TableRow key={od.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{od.design?.designName || od.productName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{od.design?.code || od.productCode || ""}</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={edits[od.id]?.quantity ?? ""}
                        onChange={(e) => handleChange(od.id, "quantity", e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={edits[od.id]?.unitPrice ?? ""}
                        onChange={(e) => handleChange(od.id, "unitPrice", e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency((edits[od.id]?.unitPrice || 0) * (edits[od.id]?.quantity || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="pt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
          <Button onClick={handleSaveQuote} disabled={updating}>{updating ? 'Đang lưu...' : 'Xác nhận báo giá'}</Button>
        </div>
      </div>
    </div>
  );
}
