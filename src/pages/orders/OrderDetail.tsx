import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  User, 
  MapPin, 
  DollarSign, 
  FileText, 
  Factory,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { mockOrders, mockDesigns, mockProductions, mockPayments } from '@/lib/mockData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import AutoDesignCode from '@/components/AutoDesignCode';

const statusLabels = {
  new: 'Mới',
  designing: 'Đang thiết kế',
  design_approved: 'Thiết kế đã duyệt',
  waiting_quote: 'Chờ báo giá',
  quoted: 'Đã báo giá',
  deposited: 'Đã đặt cọc',
  prepress_ready: 'Sẵn sàng bình bài',
  in_production: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  waiting_approval: 'Chờ duyệt',
  waiting_deposit: 'Chờ đặt cọc',
};

const statusColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  designing: 'bg-purple-100 text-purple-800 border-purple-200',
  design_approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  waiting_quote: 'bg-amber-100 text-amber-800 border-amber-200',
  quoted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  deposited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  prepress_ready: 'bg-teal-100 text-teal-800 border-teal-200',
  in_production: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  waiting_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_deposit: 'bg-orange-100 text-orange-800 border-orange-200',
};

const workflowSteps = [
  { key: 'new', label: 'Tạo đơn', icon: FileText },
  { key: 'designing', label: 'Thiết kế', icon: Edit },
  { key: 'design_approved', label: 'Duyệt thiết kế', icon: CheckCircle },
  { key: 'waiting_quote', label: 'Chờ báo giá', icon: Clock },
  { key: 'quoted', label: 'Đã báo giá', icon: DollarSign },
  { key: 'deposited', label: 'Đã đặt cọc', icon: DollarSign },
  { key: 'prepress_ready', label: 'Bình bài', icon: Edit },
  { key: 'in_production', label: 'Sản xuất', icon: Factory },
  { key: 'completed', label: 'Hoàn thành', icon: Package },
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Helper functions to extract information from description
  const extractDimensions = (description: string): string => {
    const patterns = [
      /(\d+x\d+x\d+\s*mm)/i,
      /(\d+\s*x\s*\d+\s*x\s*\d+\s*mm)/i,
      /(\d+\s*x\s*\d+\s*mm)/i,
      /kích thước[:\s]*([^,\n]+)/i,
      /KT[:\s]*([^,\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1].trim();
    }
    return '';
  };

  const extractVolume = (description: string): string => {
    const patterns = [
      /(\d+\s*ml)/i,
      /(\d+\s*lít)/i,
      /(\d+\s*l)/i,
      /dung tích[:\s]*([^,\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1].trim();
    }
    return '';
  };

  const extractWeight = (description: string): string => {
    const patterns = [
      /(\d+\s*kg)/i,
      /(\d+\s*g)/i,
      /trọng lượng[:\s]*([^,\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) return match[1].trim();
    }
    return '';
  };

  // Find order data
  const order = mockOrders.find(o => o.id === id);
  const design = mockDesigns.find(d => d.orderId === id);
  const production = mockProductions.find(p => p.orderId === id);
  const payments = mockPayments.filter(p => p.orderId === id);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
          <Button onClick={() => navigate('/orders')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: keyof typeof statusLabels) => (
    <Badge variant="outline" className={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  );

  const getCurrentStepIndex = () => {
    return workflowSteps.findIndex(step => step.key === order.status);
  };

  const currentStepIndex = getCurrentStepIndex();

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
            <h1 className="text-3xl font-bold text-foreground">Đơn hàng {order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">{order.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiến độ đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {workflowSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : isCurrent
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs mt-2 text-center ${
                    isCurrent ? 'font-medium text-blue-700' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStepIndex / (workflowSteps.length - 1)) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="design">Thiết kế</TabsTrigger>
          <TabsTrigger value="production">Sản xuất</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Thông tin đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Mã đơn hàng</label>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Mô tả sản phẩm</label>
                  <p>{order.description}</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Số lượng</label>
                  <p className="font-medium">{order.quantity.toLocaleString()} sản phẩm</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Ngày tạo</label>
                  <p>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Người tạo</label>
                  <p>{order.createdBy}</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Tên khách hàng</label>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Địa chỉ giao hàng
                  </label>
                  <p>{order.deliveryAddress}</p>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Ngày giao hàng
                  </label>
                  <p className="font-medium">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Thông tin tài chính
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Tổng giá trị</label>
                  <p className="text-2xl font-bold text-green-600">
                    {order.totalAmount ? formatCurrency(order.totalAmount) : 'Chưa báo giá'}
                  </p>
                </div>
                {order.depositAmount && (
                  <>
                    <Separator />
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-muted-foreground">Tiền đặt cọc</label>
                      <p className="font-medium">{formatCurrency(order.depositAmount)}</p>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-muted-foreground">Trạng thái đặt cọc</label>
                      <Badge variant={order.depositPaid ? "default" : "destructive"}>
                        {order.depositPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa đơn hàng
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Xem thiết kế
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Factory className="h-4 w-4 mr-2" />
                  Theo dõi sản xuất
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Quản lý thanh toán
                </Button>
              </CardContent>
            </Card>

            {/* Auto Design Code Generator */}
            <AutoDesignCode 
              design={{
                id: order.id,
                designCode: '',
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: order.customerId || '',
                customerName: order.customerName,
                designType: order.designType || 'H',
                designName: order.description || '',
                dimensions: extractDimensions(order.description || ''),
                quantity: order.quantity || 0,
                requirements: order.description || '',
                notes: order.notes || '',
                assignedTo: '',
                assignedBy: '',
                assignedAt: new Date().toISOString(),
                status: 'pending' as const,
                priority: 'medium' as const,
                progressImages: [],
                files: [],
                finalFiles: [],
                createdAt: order.createdAt,
                updatedAt: order.createdAt,
                dueDate: order.deliveryDate,
                deliveryDate: order.deliveryDate,
                comments: [],
                revisionCount: 0,
              }}
              onSaved={(updated) => {
                // Handle saving if needed
                console.log('Design code saved:', updated.designCode);
              }}
            />
          </div>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thiết kế sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {design ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Trạng thái thiết kế</h3>
                      <Badge variant="outline" className="mt-1">
                        {design.status === 'approved' ? 'Đã duyệt' : 
                         design.status === 'in_progress' ? 'Đang thực hiện' :
                         design.status === 'review' ? 'Chờ duyệt' : 
                         design.status === 'revision' ? 'Yêu cầu sửa' :
                         design.status === 'delivered' ? 'Đã giao' : 'Chờ bắt đầu'}
                      </Badge>
                    </div>
                    <Button size="sm">
                      Xem thiết kế
                    </Button>
                  </div>
                  
                  {design.files.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">File thiết kế</h4>
                      <div className="space-y-2">
                        {design.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Tải lên: {new Date(file.uploadedAt).toLocaleDateString('vi-VN')} bởi {file.uploadedBy}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">Tải về</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {design.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Ghi chú</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{design.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có thiết kế</h3>
                  <p className="text-muted-foreground mb-4">Đơn hàng này chưa bắt đầu quá trình thiết kế</p>
                  <Button>Bắt đầu thiết kế</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản xuất</CardTitle>
            </CardHeader>
            <CardContent>
              {production ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Trạng thái</h4>
                      <Badge variant="outline">
                        {production.status === 'in_progress' ? 'Đang sản xuất' :
                         production.status === 'completed' ? 'Hoàn thành' : 'Chờ bắt đầu'}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Người phụ trách</h4>
                      <p>{production.assignedTo || 'Chưa phân công'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tiến độ sản xuất</h4>
                    <Progress value={production.progress} className="h-3 mb-2" />
                    <p className="text-sm text-muted-foreground">{production.progress}% hoàn thành</p>
                  </div>
                  
                  {production.startedAt && (
                    <div>
                      <h4 className="font-medium mb-2">Ngày bắt đầu</h4>
                      <p>{new Date(production.startedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  
                  {production.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Ghi chú sản xuất</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{production.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa bắt đầu sản xuất</h3>
                  <p className="text-muted-foreground mb-4">Đơn hàng này chưa chuyển sang giai đoạn sản xuất</p>
                  <Button>Bắt đầu sản xuất</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {payment.type === 'deposit' ? 'Tiền đặt cọc' : 
                             payment.type === 'final' ? 'Thanh toán cuối' : 'Hoàn tiền'}
                          </h4>
                          <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                            {payment.status === 'paid' ? 'Đã thanh toán' : 
                             payment.status === 'pending' ? 'Chờ thanh toán' : 'Quá hạn'}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        {payment.paidAt && (
                          <p className="text-sm text-muted-foreground">
                            Thanh toán: {new Date(payment.paidAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                        )}
                      </div>
                      {payment.status === 'pending' && (
                        <Button size="sm">Xác nhận thanh toán</Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có giao dịch</h3>
                  <p className="text-muted-foreground mb-4">Chưa có giao dịch thanh toán nào cho đơn hàng này</p>
                  <Button>Tạo phiếu thu</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}