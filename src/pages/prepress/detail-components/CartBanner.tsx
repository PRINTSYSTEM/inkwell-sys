import React from "react";
import { useProofingCart } from "@/context/proofing-cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Trash2, CheckCircle2, Loader2, X } from "lucide-react";
import { useAddDesignsToProofingOrder } from "@/hooks/use-proofing-order";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDesignDimensions } from "@/utils/format-die-size";

function formatDesignCreatedDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

interface CartBannerProps {
  proofingOrderId: number;
}

export function CartBanner({ proofingOrderId }: CartBannerProps) {
  const queryClient = useQueryClient();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useProofingCart();
  const { mutateAsync: addDesigns, isPending: isSubmitting } = useAddDesignsToProofingOrder();

  const handleQtyChange = (readyDesignId: number, value: string, maxQty?: number) => {
    if (value === "") {
      updateQuantity(readyDesignId, null);
      return;
    }
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      // Clamp between 0 and maxQty
      const clamped = Math.max(0, maxQty !== undefined ? Math.min(parsed, maxQty) : parsed);
      updateQuantity(readyDesignId, clamped);
    }
  };

  const handleConfirm = async () => {
    const itemsToAdd = cartItems.filter((item) => item.quantity !== null && item.quantity > 0);
    if (itemsToAdd.length === 0) {
      toast.warning("Vui lòng nhập số lượng lớn hơn 0 cho ít nhất một thiết kế");
      return;
    }

    try {
      const payload = {
        id: proofingOrderId,
        request: {
          materialTypeId: null,
          items: cartItems
            .map((item) => ({
              readyDesignId: item.readyDesignId ?? null,
              orderDetailId: item.orderDetailId ?? null,
              quantity: item.quantity ?? 0,
            }))
            .filter((item) => item.quantity > 0),
        },
        suppressToast: true,
      };

      await addDesigns(payload);

      // Successfully added! Now remove only the confirmed items from the cart
      itemsToAdd.forEach((item) => {
        removeFromCart(item.readyDesignId);
      });

      // Refetch queries
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders", "available-bins"] });

      toast.success("Thành công", {
        description: `Đã nạp ${itemsToAdd.length} thiết kế vào bài bình`,
      });
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err.response?.data?.message || err.message || "Không thể thêm thiết kế vào bài bình",
      });
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/20 shadow-md">
      <CardHeader className="pb-3 px-6 pt-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
          <ShoppingCart className="h-4.5 w-4.5 text-blue-600" />
          Giỏ thiết kế chờ ghép bài ({cartItems.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          disabled={isSubmitting}
          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 font-medium"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa toàn bộ giỏ
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="rounded-md border border-blue-100 bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-blue-50/50">
              <TableRow className="h-8">
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1">Ảnh</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1">Mã hàng</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1">Kích thước</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1">Tên thiết kế / Loại</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1">Chất liệu</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1 text-right w-24">Số lượng</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1 text-center w-28">Ngày thiết kế</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1 text-center w-28">SL thêm</TableHead>
                <TableHead className="h-8 text-xs font-semibold text-blue-900 py-1 text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item) => {
                const maxQty = item.availableQuantity ?? 1000;
                const qtyVal = item.quantity === null ? "" : item.quantity;
                return (
                  <TableRow key={item.readyDesignId} className="h-10 hover:bg-blue-50/10">
                    <TableCell className="py-1">
                      {item.designImageUrl ? (
                        <img
                          src={item.designImageUrl}
                          alt={item.designCode}
                          className="h-8 w-8 object-cover rounded border"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-muted-foreground">
                          No Pic
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-1 text-xs font-bold text-foreground">
                      {item.designCode}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDesignDimensions(item.length, item.width, item.height)}
                    </TableCell>
                    <TableCell className="py-1 text-xs">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]" title={item.designName}>
                        {item.designName}
                      </div>
                      {item.designTypeName && (
                        <div className="text-[10px] text-muted-foreground">{item.designTypeName}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-muted-foreground max-w-[150px] truncate">
                      {item.materialTypeName || "—"}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-right font-medium">
                      {maxQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center whitespace-nowrap">
                      {formatDesignCreatedDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          min="0"
                          max={maxQty}
                          placeholder="Nhập SL..."
                          value={qtyVal}
                          onChange={(e) => handleQtyChange(item.readyDesignId, e.target.value, maxQty)}
                          className="h-8 text-xs text-center w-24 px-1 py-0.5 border-blue-200 focus-visible:ring-blue-400"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-1 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.readyDesignId)}
                        disabled={isSubmitting}
                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting || !cartItems.some((i) => i.quantity !== null && i.quantity > 0)}
            className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang nạp vào bài bình...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Xác nhận thêm vào bài
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
