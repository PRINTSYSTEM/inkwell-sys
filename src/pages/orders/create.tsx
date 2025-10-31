import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, Save, User, Package, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { mockCustomers } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkDebtStatus, formatCurrency } from '@/lib/utils';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    quantity: '',
    totalAmount: '',
    depositAmount: '',
    deliveryAddress: '',
    deliveryDate: '',
    notes: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);

  const handleCustomerSelect = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId,
        deliveryAddress: customer.address, // Auto-fill delivery address
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerId || !formData.description || !formData.quantity) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra trạng thái công nợ khách hàng
    if (selectedCustomer) {
      const debtStatus = checkDebtStatus(selectedCustomer);
      if (!debtStatus.canCreateOrder) {
        toast({
          title: "Không thể tạo đơn hàng",
          description: debtStatus.message,
          variant: "destructive",
        });
        return;
      }
    }

    // Generate order number (in real app, this would be from backend)
    const orderNumber = `DH${String(Date.now()).slice(-3).padStart(3, '0')}`;

    // Simulate API call
    try {
      toast({
        title: "Thành công",
        description: `Đơn hàng ${orderNumber} đã được tạo thành công`,
      });
      
      // Navigate to order detail page (in real app, use returned order ID)
      navigate('/orders');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo đơn hàng",
        variant: "destructive",
      });
    }
  };

  const calculateDepositPercentage = () => {
    if (formData.totalAmount && formData.depositAmount) {
      const total = parseFloat(formData.totalAmount);
      const deposit = parseFloat(formData.depositAmount);
      return ((deposit / total) * 100).toFixed(1);
    }
    return '0';
  };

  const formatInputCurrency = (amount: string) => {
    if (!amount) return '';
    const number = parseFloat(amount.replace(/[^\d]/g, ''));
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tạo đơn hàng mới</h1>
            <p className="text-muted-foreground mt-1">Nhập thông tin đơn hàng mới</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Chọn khách hàng *</Label>
                <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {customer.companyName || customer.representativeName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {customer.code} - {customer.phone}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Thông tin khách hàng</h4>
                      <Badge variant="outline">{selectedCustomer.code}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tên: </span>
                        <span>{selectedCustomer.companyName || selectedCustomer.representativeName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Người đại diện: </span>
                        <span>{selectedCustomer.representativeName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Điện thoại: </span>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Địa chỉ: </span>
                        <span>{selectedCustomer.address}</span>
                      </div>
                      {selectedCustomer.taxCode && (
                        <div>
                          <span className="text-muted-foreground">MST: </span>
                          <span>{selectedCustomer.taxCode}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div>
                        <span className="text-muted-foreground">Công nợ hiện tại: </span>
                        <span className={`font-medium ${selectedCustomer.currentDebt > selectedCustomer.maxDebt ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(selectedCustomer.currentDebt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hạn mức: </span>
                        <span className="font-medium">{formatCurrency(selectedCustomer.maxDebt)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trạng thái: </span>
                        <Badge 
                          variant={
                            selectedCustomer.debtStatus === 'good' ? 'default' : 
                            selectedCustomer.debtStatus === 'warning' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {selectedCustomer.debtStatus === 'good' ? 'Tốt' : 
                           selectedCustomer.debtStatus === 'warning' ? 'Cảnh báo' : 
                           'Bị chặn'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    const debtStatus = checkDebtStatus(selectedCustomer);
                    if (debtStatus.status !== 'good') {
                      return (
                        <Alert variant={debtStatus.status === 'blocked' ? 'destructive' : 'default'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {debtStatus.message}
                            {debtStatus.status === 'blocked' && (
                              <div className="mt-2 font-medium">
                                ⚠️ Không thể tạo đơn hàng mới cho khách hàng này!
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Địa chỉ giao hàng</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Nhập địa chỉ giao hàng..."
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mặc định sẽ lấy địa chỉ của khách hàng
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Ngày giao hàng dự kiến</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tóm tắt đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Khách hàng</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer ? 
                    (selectedCustomer.companyName || selectedCustomer.representativeName) : 
                    'Chưa chọn khách hàng'
                  }
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.quantity ? `${parseInt(formData.quantity).toLocaleString()} sản phẩm` : '—'}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tổng giá trị</Label>
                <p className="text-lg font-bold text-green-600">
                  {formData.totalAmount ? 
                    new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(parseFloat(formData.totalAmount)) : 
                    'Chưa báo giá'
                  }
                </p>
              </div>

              {formData.depositAmount && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Tiền đặt cọc</Label>
                    <p className="font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(parseFloat(formData.depositAmount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateDepositPercentage()}% tổng giá trị
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Ngày giao hàng</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.deliveryDate ? 
                    new Date(formData.deliveryDate).toLocaleDateString('vi-VN') : 
                    'Chưa xác định'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả sản phẩm *</Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả chi tiết sản phẩm (kích thước, chất liệu, màu sắc...)"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Nhập số lượng sản phẩm"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                />

                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thêm cho đơn hàng..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Thông tin tài chính
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Tổng giá trị đơn hàng (VNĐ)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="Nhập tổng giá trị đơn hàng"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Có thể để trống nếu chưa báo giá
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">Tiền đặt cọc (VNĐ)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  placeholder="Nhập số tiền đặt cọc"
                  value={formData.depositAmount}
                  onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                />
                {formData.totalAmount && formData.depositAmount && (
                  <p className="text-xs text-muted-foreground">
                    Chiếm {calculateDepositPercentage()}% tổng giá trị
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
            Hủy
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Tạo đơn hàng
          </Button>
        </div>
      </form>
    </div>
  );
}