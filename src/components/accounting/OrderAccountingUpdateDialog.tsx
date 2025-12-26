import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateOrderForAccounting } from "@/hooks/use-order";
import type { OrderResponse, UpdateOrderForAccountingRequest } from "@/Schema/order.schema";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

type OrderAccountingUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponse | null;
  onSuccess?: () => void;
};

export function OrderAccountingUpdateDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: OrderAccountingUpdateDialogProps) {
  const { mutate: updateOrder, loading } = useUpdateOrderForAccounting();

  const [formData, setFormData] = useState<UpdateOrderForAccountingRequest>({
    status: null,
    deliveryAddress: null,
    totalAmount: null,
    depositAmount: null,
    deliveryDate: null,
    note: null,
    assignedToUserId: null,
    customerName: null,
    customerCompanyName: null,
    customerPhone: null,
    customerEmail: null,
    customerTaxCode: null,
    customerAddress: null,
    recipientCustomerId: null,
    recipientName: null,
    recipientPhone: null,
    recipientAddress: null,
    paymentDueDate: null,
    orderDetails: null,
  });

  // Initialize form data when order is available
  useEffect(() => {
    if (open && order) {
      // Format dates for input (YYYY-MM-DDTHH:mm)
      const formatDateTimeForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return "";
        try {
          return format(new Date(dateStr), "yyyy-MM-dd'T'HH:mm");
        } catch {
          return "";
        }
      };

      setFormData({
        status: order.status || null,
        deliveryAddress: order.deliveryAddress || null,
        totalAmount: order.totalAmount || null,
        depositAmount: order.depositAmount || null,
        deliveryDate: order.deliveryDate ? formatDateTimeForInput(order.deliveryDate) : null,
        note: order.note || null,
        assignedToUserId: order.assignedTo?.id || null,
        customerName: order.customer?.name || null,
        customerCompanyName: order.customer?.companyName || null,
        customerPhone: order.customer?.phone || null,
        customerEmail: order.customer?.email || null,
        customerTaxCode: order.customer?.taxCode || null,
        customerAddress: order.customer?.address || null,
        recipientCustomerId: order.recipientCustomerId || null,
        recipientName: order.recipientName || null,
        recipientPhone: order.recipientPhone || null,
        recipientAddress: order.recipientAddress || null,
        paymentDueDate: order.paymentDueDate ? formatDateTimeForInput(order.paymentDueDate) : null,
        orderDetails: null, // Not editing order details in this dialog
      });
    }
  }, [open, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Convert date strings back to ISO format
    const payload: UpdateOrderForAccountingRequest = {
      ...formData,
      deliveryDate: formData.deliveryDate
        ? new Date(formData.deliveryDate).toISOString()
        : null,
      paymentDueDate: formData.paymentDueDate
        ? new Date(formData.paymentDueDate).toISOString()
        : null,
      // Convert empty strings to null
      status: formData.status?.trim() || null,
      deliveryAddress: formData.deliveryAddress?.trim() || null,
      note: formData.note?.trim() || null,
      customerName: formData.customerName?.trim() || null,
      customerCompanyName: formData.customerCompanyName?.trim() || null,
      customerPhone: formData.customerPhone?.trim() || null,
      customerEmail: formData.customerEmail?.trim() || null,
      customerTaxCode: formData.customerTaxCode?.trim() || null,
      customerAddress: formData.customerAddress?.trim() || null,
      recipientName: formData.recipientName?.trim() || null,
      recipientPhone: formData.recipientPhone?.trim() || null,
      recipientAddress: formData.recipientAddress?.trim() || null,
    };

    try {
      await updateOrder(order.id, payload);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleChange = (
    field: keyof UpdateOrderForAccountingRequest,
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin đơn hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin đơn hàng {order.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Thông tin thanh toán</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Tổng giá trị (VND)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.totalAmount ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "totalAmount",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="depositAmount">Đã thanh toán (VND)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.depositAmount ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "depositAmount",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="paymentDueDate">Hạn thanh toán</Label>
                <Input
                  id="paymentDueDate"
                  type="datetime-local"
                  value={formData.paymentDueDate ?? ""}
                  onChange={(e) => handleChange("paymentDueDate", e.target.value || null)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Thông tin giao hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryAddress">Địa chỉ giao hàng</Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress ?? ""}
                  onChange={(e) => handleChange("deliveryAddress", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Ngày giao dự kiến</Label>
                <Input
                  id="deliveryDate"
                  type="datetime-local"
                  value={formData.deliveryDate ?? ""}
                  onChange={(e) => handleChange("deliveryDate", e.target.value || null)}
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Thông tin khách hàng</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Tên khách hàng</Label>
                <Input
                  id="customerName"
                  value={formData.customerName ?? ""}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerCompanyName">Tên công ty</Label>
                <Input
                  id="customerCompanyName"
                  value={formData.customerCompanyName ?? ""}
                  onChange={(e) => handleChange("customerCompanyName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Số điện thoại</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone ?? ""}
                  onChange={(e) => handleChange("customerPhone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail ?? ""}
                  onChange={(e) => handleChange("customerEmail", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerTaxCode">Mã số thuế</Label>
                <Input
                  id="customerTaxCode"
                  value={formData.customerTaxCode ?? ""}
                  onChange={(e) => handleChange("customerTaxCode", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Địa chỉ</Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress ?? ""}
                  onChange={(e) => handleChange("customerAddress", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Thông tin người nhận</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientName">Tên người nhận</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName ?? ""}
                  onChange={(e) => handleChange("recipientName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="recipientPhone">Số điện thoại</Label>
                <Input
                  id="recipientPhone"
                  value={formData.recipientPhone ?? ""}
                  onChange={(e) => handleChange("recipientPhone", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="recipientAddress">Địa chỉ nhận hàng</Label>
                <Input
                  id="recipientAddress"
                  value={formData.recipientAddress ?? ""}
                  onChange={(e) => handleChange("recipientAddress", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Ghi chú</h3>
            <div>
              <Label htmlFor="note">Ghi chú đơn hàng</Label>
              <Textarea
                id="note"
                rows={4}
                value={formData.note ?? ""}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

