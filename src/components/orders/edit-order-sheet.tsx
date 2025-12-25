// src/components/orders/edit-order-sheet.tsx
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, FileText, DollarSign, User, Tag } from "lucide-react";
import type { OrderResponse } from "@/Schema/order.schema";
import type { UpdateOrderRequest } from "@/Schema";
import { useUpdateOrder, useUsers } from "@/hooks";
import { orderStatusLabels, formatCurrency } from "@/lib/status-utils";
import { ROLE } from "@/constants";
import { useAuth } from "@/hooks/use-auth";

type EditOrderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderResponse;
};

// Helper: format ISO -> value cho input datetime-local (YYYY-MM-DDTHH:mm)
function toDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Helper: value từ input datetime-local -> ISO string
function fromDateTimeLocalValue(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// Helper: format number to currency input (remove formatting)
function formatCurrencyInput(value: number | null | undefined): string {
  if (!value || value === 0) return "";
  return value.toString();
}

// Helper: parse currency input to number
function parseCurrencyInput(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const num = Number(value.replace(/[^\d]/g, ""));
  return Number.isNaN(num) ? null : num;
}

export function EditOrderSheet({
  open,
  onOpenChange,
  order,
}: EditOrderSheetProps) {
  const { user } = useAuth();
  const canViewPrice = user?.role !== ROLE.DESIGN && user?.role !== ROLE.DESIGN_LEAD;
  const canUpdateStatus = user?.role === ROLE.ADMIN || user?.role === ROLE.ACCOUNTING_LEAD;

  // Form state
  const [status, setStatus] = useState<string>(order.status || "");
  const [deliveryAddress, setDeliveryAddress] = useState(
    order.deliveryAddress || ""
  );
  const [deliveryDateLocal, setDeliveryDateLocal] = useState(
    toDateTimeLocalValue(order.deliveryDate?.toString())
  );
  const [totalAmount, setTotalAmount] = useState(
    formatCurrencyInput(order.totalAmount)
  );
  const [depositAmount, setDepositAmount] = useState(
    formatCurrencyInput(order.depositAmount)
  );
  const [note, setNote] = useState(order.note || "");
  const [assignedToUserId, setAssignedToUserId] = useState<string>(
    order.assignedTo?.toString() || ""
  );

  // Fetch users for assignment
  const { data: usersData } = useUsers({
    page: 1,
    size: 100,
    isActive: true,
  });
  const users = usersData?.items || [];

  const { mutateAsync: updateOrder, isPending } = useUpdateOrder();

  // Reset form mỗi lần mở sheet
  useEffect(() => {
    if (open) {
      setStatus(order.status || "");
      setDeliveryAddress(order.deliveryAddress || "");
      setDeliveryDateLocal(
        toDateTimeLocalValue(order.deliveryDate?.toString())
      );
      setTotalAmount(formatCurrencyInput(order.totalAmount));
      setDepositAmount(formatCurrencyInput(order.depositAmount));
      setNote(order.note || "");
      setAssignedToUserId(order.assignedTo?.toString() || "");
    }
  }, [
    open,
    order.status,
    order.deliveryAddress,
    order.deliveryDate,
    order.totalAmount,
    order.depositAmount,
    order.note,
    order.assignedTo,
  ]);

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const payload: UpdateOrderRequest = {};

    // Status
    if (canUpdateStatus && status && status !== order.status) {
      payload.status = status;
    }

    // Delivery address
    payload.deliveryAddress = deliveryAddress.trim()
      ? deliveryAddress.trim()
      : null;

    // Delivery date
    const deliveryDateIso = fromDateTimeLocalValue(deliveryDateLocal);
    payload.deliveryDate = deliveryDateIso;

    // Total amount
    if (canViewPrice) {
      const total = parseCurrencyInput(totalAmount);
      if (total !== null && total !== order.totalAmount) {
        payload.totalAmount = total;
      }
    }

    // Deposit amount
    if (canViewPrice) {
      const deposit = parseCurrencyInput(depositAmount);
      if (deposit !== null && deposit !== order.depositAmount) {
        payload.depositAmount = deposit;
      }
    }

    // Note
    payload.note = note.trim() ? note.trim() : null;

    // Assigned user
    const currentAssignedId = order.assignedTo?.toString() || "";
    const newAssignedId = assignedToUserId || "";
    if (newAssignedId !== currentAssignedId) {
      payload.assignedToUserId = newAssignedId ? Number(newAssignedId) : null;
    }

    await updateOrder({
      id: order.id!,
      data: payload,
    });

    handleClose();
  };

  // Get status options
  const statusOptions = Object.entries(orderStatusLabels).map(([key, label]) => ({
    value: key,
    label,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Chỉnh sửa đơn hàng</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin đơn hàng {order.code}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 mt-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="delivery">Giao hàng</TabsTrigger>
              <TabsTrigger value="financial">Tài chính</TabsTrigger>
            </TabsList>

            {/* Tab 1: Thông tin cơ bản */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Trạng thái và phân công
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canUpdateStatus && (
                    <div className="space-y-2">
                      <Label>Trạng thái đơn hàng</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Người phụ trách</Label>
                    <Select
                      value={assignedToUserId || "none"}
                      onValueChange={(value) => setAssignedToUserId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người phụ trách" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không phân công</SelectItem>
                        {users
                          .filter((user) => user.id)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id!.toString()}>
                              {user.fullName || user.username || `User ${user.id}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ghi chú
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Ghi chú đơn hàng</Label>
                    <Textarea
                      placeholder="Thông tin thêm cho đơn hàng, lưu ý giao nhận..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Giao hàng */}
            <TabsContent value="delivery" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Địa chỉ giao hàng</Label>
                    <Textarea
                      placeholder="Nhập địa chỉ giao hàng"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ngày giao dự kiến
                    </Label>
                    <Input
                      type="datetime-local"
                      value={deliveryDateLocal}
                      onChange={(e) => setDeliveryDateLocal(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Để trống nếu chưa xác định ngày giao
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Tài chính */}
            <TabsContent value="financial" className="space-y-4 mt-4">
              {canViewPrice ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Thông tin thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tổng tiền (VND)</Label>
                      <Input
                        type="text"
                        placeholder="Nhập tổng tiền"
                        value={totalAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, "");
                          setTotalAmount(value);
                        }}
                        onBlur={(e) => {
                          const num = parseCurrencyInput(e.target.value);
                          if (num !== null) {
                            setTotalAmount(num.toLocaleString("vi-VN"));
                          }
                        }}
                      />
                      {totalAmount && (
                        <p className="text-xs text-muted-foreground">
                          Hiện tại: {formatCurrency(order.totalAmount || 0)}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Tiền đặt cọc (VND)</Label>
                      <Input
                        type="text"
                        placeholder="Nhập tiền đặt cọc"
                        value={depositAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, "");
                          setDepositAmount(value);
                        }}
                        onBlur={(e) => {
                          const num = parseCurrencyInput(e.target.value);
                          if (num !== null) {
                            setDepositAmount(num.toLocaleString("vi-VN"));
                          }
                        }}
                      />
                      {depositAmount && (
                        <p className="text-xs text-muted-foreground">
                          Hiện tại: {formatCurrency(order.depositAmount || 0)}
                        </p>
                      )}
                    </div>

                    {totalAmount && depositAmount && (
                      <>
                        <Separator />
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Còn lại:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                (parseCurrencyInput(totalAmount) || 0) -
                                  (parseCurrencyInput(depositAmount) || 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Bạn không có quyền xem và chỉnh sửa thông tin tài chính
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="mt-6 flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
