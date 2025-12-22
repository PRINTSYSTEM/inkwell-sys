import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  User,
  Phone,
  Building2,
  Package,
  FileText,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { OrderWithAccounting } from "./InvoiceConfirmDialog";
import { OrderDetailResponse } from "@/Schema";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  CustomerTypeBadge,
} from "./StatusBadges";

interface OrderDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithAccounting | null;
  orderDetails?: OrderDetailResponse[];
}

export function OrderDetailDrawer({
  open,
  onOpenChange,
  order,
  orderDetails = [],
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const remainingAmount = order.totalAmount - order.depositAmount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Chi tiết đơn hàng
          </SheetTitle>
          <SheetDescription>{order.code}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-6">
          <div className="space-y-6">
            {/* Status Section */}
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusBadge
                status={order.status}
                statusType={order.statusType}
              />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Thông tin khách hàng
              </h4>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tên:</span>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                {order.customer.companyName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Công ty:
                    </span>
                    <span className="font-medium">
                      {order.customer.companyName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    SĐT:
                  </span>
                  <span className="font-medium">{order.customer.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Loại:</span>
                  <CustomerTypeBadge type={order.customer.type} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Info */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Thông tin thanh toán
              </h4>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tổng giá trị:
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Đã thanh toán:
                  </span>
                  <span className="font-medium text-success">
                    {formatCurrency(order.depositAmount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Còn lại:
                  </span>
                  <span
                    className={`font-bold ${
                      remainingAmount > 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Thời gian
              </h4>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ngày tạo:
                  </span>
                  <span className="text-sm">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ngày giao:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(order.deliveryDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cập nhật:
                  </span>
                  <span className="text-sm">{formatDate(order.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Order Details (Designs) */}
            {orderDetails.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Chi tiết sản phẩm
                  </h4>
                  <div className="space-y-2">
                    {orderDetails.map((detail) => (
                      <div
                        key={detail.id}
                        className="rounded-lg border bg-muted/30 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {detail.design?.designName}
                          </span>
                          <Badge variant="secondary">
                            {detail.design?.designType?.name}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Vật liệu: {detail.design?.materialType?.name}
                          </span>
                          <span>SL: {detail.quantity}</span>
                        </div>
                        <div className="text-right font-medium">
                          {formatCurrency(detail.totalPrice || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {order.note && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Ghi chú
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {order.note}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
