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
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Building2,
  Phone,
  MapPin,
  FileText,
  Calendar,
  User,
  Package,
  TrendingUp,
  Eye,
  Loader2,
} from "lucide-react";
import { useCustomer, useUpdateCustomer, useOrders } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ZodError } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  orderStatusLabels,
  formatCurrency,
  formatDate,
  customerTypeLabels,
} from "@/lib/status-utils";

import { CustomerResponse, UpdateCustomerRequestSchema } from "@/Schema";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [editForm, setEditForm] = useState<CustomerResponse | null>(null);

  const customerId = parseInt(id || "0");
  const { data, isLoading, error } = useCustomer(customerId, !!id);
  const { mutateAsync: updateCustomer, isPending } = useUpdateCustomer();

  // Fetch orders for this customer
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
    customerId: customerId || undefined,
    pageNumber: 1,
    pageSize: 100, // Get all orders for this customer
  });

  const orders = useMemo(() => ordersData?.items ?? [], [ordersData?.items]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const totalDeposit = orders.reduce(
      (sum, order) => sum + (order.depositAmount || 0),
      0
    );
    const remainingDebt = totalAmount - totalDeposit;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const inProgressOrders = orders.filter(
      (order) =>
        order.status !== "completed" &&
        order.status !== "cancelled" &&
        order.status !== "invoice_issued"
    ).length;

    return {
      totalOrders,
      totalAmount,
      totalDeposit,
      remainingDebt,
      completedOrders,
      inProgressOrders,
    };
  }, [orders]);

  useEffect(() => {
    if (isLoading) return;
    if (error) {
      toast.error("Lỗi khi tải thông tin khách hàng");
      navigate("/customers");
      return;
    }
    if (data) {
      setCustomer(data);
      setEditForm(data);
    }
  }, [isLoading, error, data, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(customer);
  };

  const handleSave = async () => {
    if (!editForm || !editForm.id) return;

    try {
      // Prepare update data (only changed fields)
      const updateData = {
        name: editForm.name || editForm.representativeName,
        companyName: editForm.companyName || undefined,
        representativeName: editForm.representativeName,
        phone: editForm.phone,
        taxCode: editForm.taxCode || undefined,
        address: editForm.address,
        type: editForm.type,
        currentDebt: editForm.currentDebt,
        maxDebt: editForm.maxDebt,
      };

      // Validate data using Zod schema
      UpdateCustomerRequestSchema.parse(updateData);

      // Use updateCustomer hook
      await updateCustomer({
        id: editForm.id,
        data: updateData,
      });

      setIsEditing(false);
      setCustomer(editForm);
    } catch (error) {
      console.error("Error updating customer:", error);

      if (error instanceof ZodError) {
        // Handle validation errors
        const validationErrors = error.errors
          .map((err) => err.message)
          .join(", ");
        toast.error(`Dữ liệu không hợp lệ: ${validationErrors}`);
      } else if (error instanceof Error) {
        toast.error(`Lỗi khi cập nhật khách hàng: ${error.message}`);
      } else {
        toast.error("Lỗi không xác định khi cập nhật khách hàng");
      }
    }
  };

  const handleInputChange = (
    field: keyof CustomerResponse,
    value: string | number
  ) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              Đang tải thông tin khách hàng...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Chi tiết khách hàng
            </h1>
            <p className="text-muted-foreground mt-1">
              Thông tin và lịch sử đơn hàng
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Lưu
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã khách hàng</Label>
                  <Input
                    id="code"
                    value={editForm?.code || ""}
                    disabled={true}
                    className="font-mono bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mã không thể thay đổi
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeName">Tên người đại diện</Label>
                <Input
                  id="representativeName"
                  value={editForm?.representativeName || ""}
                  onChange={(e) =>
                    handleInputChange("representativeName", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Tên công ty</Label>
                <Input
                  id="companyName"
                  value={editForm?.companyName || ""}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="Không bắt buộc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Tên khách hàng</Label>
                <Input
                  id="name"
                  value={editForm?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxCode">Mã số thuế</Label>
                  <Input
                    id="taxCode"
                    value={editForm?.taxCode || ""}
                    onChange={(e) =>
                      handleInputChange("taxCode", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="Không bắt buộc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={editForm?.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loại khách hàng</Label>
                {isEditing ? (
                  <Select
                    value={editForm?.type || ""}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Chọn loại khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Khách lẻ</SelectItem>
                      <SelectItem value="company">Khách công ty</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    {editForm?.type && customerTypeLabels[editForm.type] ? (
                      <Badge
                        className={
                          editForm.type === "company"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400"
                        }
                      >
                        {customerTypeLabels[editForm.type]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Chưa có</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={editForm?.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ngày tạo</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Người tạo</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {customer.createdBy?.fullName ||
                      customer.createdBy?.username ||
                      "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lịch sử đơn hàng ({stats.totalOrders})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Giá trị</TableHead>
                        <TableHead>Đã cọc</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-primary hover:underline"
                            >
                              {order.code}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={order.status || ""}
                              label={
                                orderStatusLabels[order.status || ""] || "N/A"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(order.depositAmount)}
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <Link to={`/orders/${order.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có đơn hàng nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* TODO: Implement orders section when OrderService is available
              {orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Số đơn hàng</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Giá trị</TableHead>
                        <TableHead>Ngày giao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: unknown) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.totalAmount?.toLocaleString('vi-VN')} ₫</TableCell>
                          <TableCell>{new Date(order.deliveryDate).toLocaleDateString('vi-VN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có đơn hàng nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Thống kê
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tổng đơn hàng
                    </p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tổng giá trị
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Đã cọc</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalDeposit)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Công nợ</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.remainingDebt)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                    <p className="text-xs text-muted-foreground">Hoàn thành</p>
                    <p className="text-lg font-semibold">
                      {stats.completedOrders}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                    <p className="text-xs text-muted-foreground">Đang xử lý</p>
                    <p className="text-lg font-semibold">
                      {stats.inProgressOrders}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{customer.phone}</p>
                  <p className="text-xs text-muted-foreground">Số điện thoại</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm">{customer.address}</p>
                  <p className="text-xs text-muted-foreground">Địa chỉ</p>
                </div>
              </div>

              {customer.taxCode && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-mono text-sm">{customer.taxCode}</p>
                    <p className="text-xs text-muted-foreground">Mã số thuế</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
