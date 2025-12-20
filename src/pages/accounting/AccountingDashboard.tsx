import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Clock,
  CheckCircle,
  Eye,
  CreditCard,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrdersByRole } from "@/hooks/use-order";
import {
  useAccountingByOrder,
  useCreateAccountingForOrder,
  useConfirmPayment,
} from "@/hooks/use-accounting";
import { useAuth } from "@/hooks/use-auth";
import {
  formatCurrency,
  formatDate,
  paymentStatusLabels,
  getStatusColorClass,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/status-utils";
import type { OrderResponse, UserRole } from "@/Schema";
import type { ConfirmPaymentRequest } from "@/Schema/accounting.schema";
import { ROLE } from "@/constants";

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null
  );
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Fetch orders for accounting
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useOrdersByRole((user?.role as UserRole) ?? ROLE.ACCOUNTING, {
    pageNumber,
    pageSize,
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Accounting hooks
  const { mutate: createAccounting, loading: creatingAccounting } =
    useCreateAccountingForOrder();
  const { mutate: confirmPayment, loading: confirmingPayment } =
    useConfirmPayment();

  // Get accounting data for selected order
  const { data: accountingData, isLoading: accountingLoading } =
    useAccountingByOrder(selectedOrder?.id ?? null, !!selectedOrder);

  const orders = ordersData?.items ?? [];
  const totalCount = ordersData?.total ?? 0;

  // Calculate stats from orders
  const stats = {
    totalOrders: totalCount,
    pendingPayment: orders.filter(
      (o) =>
        o.status === "waiting_for_deposit" || o.status === "deposit_received"
    ).length,
    completed: orders.filter((o) => o.status === "completed").length,
    totalAmount: orders.reduce(
      (sum, o) => sum + (typeof o.totalAmount === "number" ? o.totalAmount : 0),
      0
    ),
  };

  const handleOpenPaymentDialog = async (order: OrderResponse) => {
    setSelectedOrder(order);
    setPaymentAmount("");
    setPaymentMethod("bank_transfer");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!accountingData?.id || !paymentAmount) return;

    const payload: ConfirmPaymentRequest = {
      amount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod,
      notes: paymentNotes || undefined,
    };

    try {
      await confirmPayment(accountingData.id, payload);
      setPaymentDialogOpen(false);
      refetchOrders();
    } catch {
      // Error handled in hook
    }
  };

  const handleCreateAccounting = async (orderId: number) => {
    try {
      await createAccounting(orderId);
      refetchOrders();
    } catch {
      // Error handled in hook
    }
  };

  const getPaymentStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const label = paymentStatusLabels[status] ?? status;
    const colorClass = getStatusColorClass(status);

    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const label = orderStatusLabels[status] ?? status;
    const colorClass = getStatusColorClass(status);

    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Danh sách đơn hàng cần xử lý
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thanh toán và theo dõi công nợ
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng đơn hàng
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">đơn hàng</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ thanh toán
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {stats.pendingPayment}
            </div>
            <p className="text-xs text-muted-foreground">đơn cần xử lý</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoàn thành
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">đơn đã thanh toán</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng giá trị
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">trang hiện tại</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="waiting_for_deposit">Chờ đặt cọc</SelectItem>
                <SelectItem value="deposit_received">Đã nhận cọc</SelectItem>
                <SelectItem value="debt_approved">Đã duyệt công nợ</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Không có đơn hàng nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Đã cọc</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Trạng thái đơn</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const remaining =
                      (order.totalAmount ?? 0) - (order.depositAmount ?? 0);

                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {order.code ?? `#${order.id}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.customer?.name ?? "—"}
                            </p>
                            {order.customer?.companyName && (
                              <p className="text-xs text-muted-foreground">
                                {order.customer.companyName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(order.depositAmount)}
                        </TableCell>
                        <TableCell
                          className={
                            remaining > 0 ? "text-red-600" : "text-green-600"
                          }
                        >
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell>
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {remaining > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPaymentDialog(order)}
                                disabled={creatingAccounting}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Thanh toán
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {orders.length} / {totalCount} đơn hàng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={orders.length < pageSize}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
            <DialogDescription>
              Đơn hàng: {selectedOrder?.code ?? `#${selectedOrder?.id}`}
            </DialogDescription>
          </DialogHeader>

          {accountingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="font-medium">
                    {accountingData?.customerName ??
                      selectedOrder?.customer?.name ??
                      "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      accountingData?.totalAmount ?? selectedOrder?.totalAmount
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã cọc:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      accountingData?.deposit ?? selectedOrder?.depositAmount
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Còn lại:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(
                      accountingData?.remainingAmount ??
                        (selectedOrder?.totalAmount ?? 0) -
                          (selectedOrder?.depositAmount ?? 0)
                    )}
                  </span>
                </div>
                {accountingData?.paymentStatus && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Trạng thái TT:
                    </span>
                    {getPaymentStatusBadge(accountingData.paymentStatus)}
                  </div>
                )}
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền thanh toán</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Nhập số tiền..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Phương thức thanh toán</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thanh toán..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                confirmingPayment || !paymentAmount || !accountingData?.id
              }
            >
              {confirmingPayment && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xác nhận thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
