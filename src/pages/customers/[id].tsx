import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  TrendingUp
} from 'lucide-react';
import { mockCustomers, mockOrders } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<Customer | null>(null);

  useEffect(() => {
    const foundCustomer = mockCustomers.find(c => c.id === id);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      setEditForm(foundCustomer);
    }
  }, [id]);

  const customerOrders = mockOrders.filter(order => order.customerId === id);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(customer);
  };

  const handleSave = () => {
    if (editForm) {
      // Trong thực tế, sẽ gọi API để cập nhật
      setCustomer(editForm);
      setIsEditing(false);
      console.log('Cập nhật khách hàng:', editForm);
    }
  };

  const handleInputChange = (field: keyof Customer, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/customers')} className="gap-2">
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

  const statusLabels = {
    new: 'Mới',
    designing: 'Đang thiết kế',
    waiting_approval: 'Chờ duyệt',
    waiting_deposit: 'Chờ cọc',
    in_production: 'Đang sản xuất',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    designing: 'bg-purple-100 text-purple-800',
    waiting_approval: 'bg-yellow-100 text-yellow-800',
    waiting_deposit: 'bg-orange-100 text-orange-800',
    in_production: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/customers')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chi tiết khách hàng</h1>
            <p className="text-muted-foreground mt-1">Thông tin và lịch sử đơn hàng</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
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
                    value={editForm?.code || ''}
                    disabled={true}
                    className="font-mono bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Mã không thể thay đổi</p>
                </div>
                <div className="space-y-2">
                  <Label>Tên viết tắt</Label>
                  <div className="p-2 bg-muted rounded-md border">
                    <Badge variant="outline" className="font-mono font-semibold">
                      {customer.code.replace(/^\d{4}/, '')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Được tạo từ mã khách hàng</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="representativeName">Tên người đại diện</Label>
                <Input
                  id="representativeName"
                  value={editForm?.representativeName || ''}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Tên công ty</Label>
                <Input
                  id="companyName"
                  value={editForm?.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Không bắt buộc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                <Input
                  id="folder"
                  value={editForm?.folder || ''}
                  onChange={(e) => handleInputChange('folder', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxCode">Mã số thuế</Label>
                  <Input
                    id="taxCode"
                    value={editForm?.taxCode || ''}
                    onChange={(e) => handleInputChange('taxCode', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Không bắt buộc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={editForm?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={editForm?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ngày tạo</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Người tạo</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {customer.createdBy}
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
                Lịch sử đơn hàng ({customerOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders.length > 0 ? (
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
                      {customerOrders.map((order) => (
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng đơn hàng</span>
                  <span className="font-medium">{customerOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đơn hoàn thành</span>
                  <span className="font-medium">
                    {customerOrders.filter(o => o.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đang xử lý</span>
                  <span className="font-medium">
                    {customerOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
                  </span>
                </div>
              </div>
              
              <hr />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giá trị</span>
                  <span className="font-medium">
                    {customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã thanh toán</span>
                  <span className="font-medium text-green-600">
                    {customerOrders
                      .filter(o => o.depositPaid)
                      .reduce((sum, order) => sum + (order.depositAmount || 0), 0)
                      .toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chờ thanh toán</span>
                  <span className="font-medium text-orange-600">
                    {customerOrders
                      .filter(o => !o.depositPaid && o.status !== 'cancelled')
                      .reduce((sum, order) => sum + (order.depositAmount || order.totalAmount || 0), 0)
                      .toLocaleString('vi-VN')} ₫
                  </span>
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