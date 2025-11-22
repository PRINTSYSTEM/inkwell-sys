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
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customer';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer } from '@/apis/customer.api';
import { CustomerRequestSchema } from '@/Schema/customer.schema';
import { toast } from 'sonner';
import { ZodError } from 'zod';
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
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<unknown[]>([]);

  // Load customer data from API
  useEffect(() => {
    const loadCustomer = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const customerId = parseInt(id);
        
        if (isNaN(customerId)) {
          toast.error('ID khách hàng không hợp lệ');
          navigate('/customers');
          return;
        }

        const response = await import('@/apis/customer.api').then(m => m.getCustomerById(customerId));
        
        if (response.success && response.data) {
          setCustomer(response.data);
          setEditForm(response.data);
        } else {
          toast.error('Không tìm thấy khách hàng');
          navigate('/customers');
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        toast.error('Lỗi khi tải thông tin khách hàng');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id, navigate]);

  // TODO: Load customer orders from OrderService when available
  // const customerOrders = mockOrders.filter(order => order.customerId === id);

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
        maxDebt: editForm.maxDebt
      };

      // Validate data using Zod schema
      CustomerRequestSchema.parse(updateData);

      const response = await import('@/apis/customer.api').then(m => m.updateCustomer(editForm.id, updateData));
      
      if (response.success && response.data) {
        setCustomer(response.data);
        setEditForm(response.data);
        setIsEditing(false);
        toast.success('Cập nhật khách hàng thành công');
      } else {
        toast.error('Không thể cập nhật khách hàng');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      
      if (error instanceof ZodError) {
        // Handle validation errors
        const validationErrors = error.errors.map(err => err.message).join(', ');
        toast.error(`Dữ liệu không hợp lệ: ${validationErrors}`);
      } else if (error instanceof Error) {
        toast.error(`Lỗi khi cập nhật khách hàng: ${error.message}`);
      } else {
        toast.error('Lỗi không xác định khi cập nhật khách hàng');
      }
    }
  };

  const handleInputChange = (field: keyof Customer, value: string | number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  if (loading) {
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
                <Label htmlFor="name">Tên khách hàng</Label>
                <Input
                  id="name"
                  value={editForm?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
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
                <Label htmlFor="type">Loại khách hàng</Label>
                <Input
                  id="type"
                  value={editForm?.type || ''}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  disabled={!isEditing}
                  placeholder="good, warning, blocked"
                />
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
                    {customer.createdBy?.fullName || customer.createdBy?.username || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History - TODO: Implement when OrderService is available */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lịch sử đơn hàng (0)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có đơn hàng nào</p>
                <p className="text-sm">Sẽ hiển thị khi OrderService được triển khai</p>
              </div>
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

        {/* Statistics - Placeholder until OrderService is implemented */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Thống kê
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Thống kê đơn hàng</p>
                <p className="text-sm">Sẽ hiển thị khi OrderService được triển khai</p>
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