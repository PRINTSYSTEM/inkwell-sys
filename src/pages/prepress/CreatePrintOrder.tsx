import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  FileText, 
  Calendar,
  Package,
  CheckCircle,
  Plus,
  Filter
} from 'lucide-react';
import { getDesignTypeName, getDesignTypeDescription, designTypeConfigs } from '@/lib/mockData';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Order, PrepressOrder } from '@/types';

// Chỉ các đơn hàng đã đặt cọc mới hiển thị cho bình bài
const depositedOrders = mockOrders.filter(order => order.status === 'deposited');

export default function PrepressCreatePrintOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignType, setSelectedDesignType] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [prepressOrderInfo, setPrepressOrderInfo] = useState({
    title: '',
    printQuantity: '',
    paperType: '',
    printMachine: '',
    priority: 'normal',
    notes: ''
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Danh sách loại thiết kế cho filter
  const designTypes = [
    { value: 'all', label: 'Tất cả loại thiết kế' },
    ...designTypeConfigs.map(config => ({
      value: config.code,
      label: config.name,
      description: config.description
    }))
  ];

  // Filter orders based on search term and design type
  const filteredOrders = depositedOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDesignType = selectedDesignType === 'all' || order.designType === selectedDesignType;
    
    return matchesSearch && matchesDesignType;
  });

  // Group orders by design type for visual organization
  const ordersByDesignType = filteredOrders.reduce((acc, order) => {
    const type = order.designType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(order);
    return acc;
  }, {} as Record<string, typeof filteredOrders>);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handleCreatePrepressOrder = () => {
    if (selectedOrders.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đơn hàng');
      return;
    }

    if (!prepressOrderInfo.title || !prepressOrderInfo.printQuantity || 
        !prepressOrderInfo.paperType || !prepressOrderInfo.printMachine) {
      toast.error('Vui lòng điền đầy đủ thông tin lệnh bình bài');
      return;
    }

    setIsCreatingOrder(true);
    
    // Simulate API call
    setTimeout(() => {
      const selectedOrderList = mockOrders.filter(order => selectedOrders.includes(order.id));
      
      // Cập nhật trạng thái đơn hàng thành 'prepress_ready'
      selectedOrderList.forEach(order => {
        order.status = 'prepress_ready';
      });

      toast.success(`Đã tạo lệnh bình bài "${prepressOrderInfo.title}" với ${selectedOrders.length} đơn hàng`);
      setIsCreatingOrder(false);
      setShowCreateDialog(false);
      setSelectedOrders([]);
      setPrepressOrderInfo({
        title: '',
        printQuantity: '',
        paperType: '',
        printMachine: '',
        priority: 'normal',
        notes: ''
      });
      
      // Quay về trang prepress chính
      navigate('/prepress');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tạo lệnh bình bài</h1>
          <p className="text-muted-foreground">
            Chọn các đơn hàng đã đặt cọc theo loại thiết kế để tạo lệnh bình bài
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/prepress')}
          >
            Quay lại
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            disabled={selectedOrders.length === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo lệnh bình bài ({selectedOrders.length})
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Đơn hàng đã đặt cọc - Phân loại theo thiết kế
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gom các đơn hàng cùng loại thiết kế để tối ưu việc in ấn
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã đơn hàng, tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter theo loại thiết kế */}
            <Select value={selectedDesignType} onValueChange={setSelectedDesignType}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Lọc theo loại thiết kế" />
              </SelectTrigger>
              <SelectContent>
                {designTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={handleSelectAll}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {selectedOrders.length === filteredOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>

          {/* Thông tin thống kê */}
          <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
              <div className="text-sm text-muted-foreground">Đơn hàng hiển thị</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{selectedOrders.length}</div>
              <div className="text-sm text-muted-foreground">Đã chọn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(ordersByDesignType).length}
              </div>
              <div className="text-sm text-muted-foreground">Loại thiết kế</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredOrders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Tổng số lượng</div>
            </div>
          </div>

          {/* Orders grouped by Design Type */}
          {selectedDesignType === 'all' ? (
            // Hiển thị theo nhóm loại thiết kế
            <div className="space-y-6">
              {Object.entries(ordersByDesignType).map(([designType, orders]) => {
                const designTypeLabel = getDesignTypeName(designType);
                
                return (
                  <div key={designType} className="border rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {designTypeLabel} ({orders.length} đơn hàng)
                      </h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const orderIds = orders.map(o => o.id);
                          const allSelected = orderIds.every(id => selectedOrders.includes(id));
                          if (allSelected) {
                            setSelectedOrders(prev => prev.filter(id => !orderIds.includes(id)));
                          } else {
                            setSelectedOrders(prev => [...new Set([...prev, ...orderIds])]);
                          }
                        }}
                      >
                        {orders.every(o => selectedOrders.includes(o.id)) ? 'Bỏ chọn nhóm' : 'Chọn nhóm'}
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Chọn</TableHead>
                          <TableHead>Mã đơn hàng</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Ngày giao</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className={selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => handleOrderSelect(order.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{order.description}</TableCell>
                            <TableCell>{order.quantity?.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {order.deliveryDate}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                                Chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          ) : (
            // Hiển thị dạng bảng đơn giản khi filter theo 1 loại
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Mã đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Ngày giao</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className={selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleOrderSelect(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.description}</TableCell>
                      <TableCell>{order.quantity?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {order.deliveryDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy đơn hàng nào</p>
              {selectedDesignType !== 'all' && (
                <p className="text-sm">Thử chọn loại thiết kế khác hoặc tìm kiếm với từ khóa khác</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Prepress Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo lệnh bình bài</DialogTitle>
            <DialogDescription>
              Tạo lệnh bình bài cho {selectedOrders.length} đơn hàng đã chọn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Prepress Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên lệnh bình bài *</Label>
                <Input
                  placeholder="Ví dụ: Lệnh in 001 - Name Card Bristol"
                  value={prepressOrderInfo.title}
                  onChange={(e) => setPrepressOrderInfo(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượng in *</Label>
                <Input
                  placeholder="Ví dụ: 1000"
                  value={prepressOrderInfo.printQuantity}
                  onChange={(e) => setPrepressOrderInfo(prev => ({
                    ...prev,
                    printQuantity: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giấy *</Label>
                <Select 
                  value={prepressOrderInfo.paperType} 
                  onValueChange={(value) => setPrepressOrderInfo(prev => ({
                    ...prev,
                    paperType: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại giấy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bristol-300">Bristol 300gsm</SelectItem>
                    <SelectItem value="couche-250">Couche 250gsm</SelectItem>
                    <SelectItem value="couche-300">Couche 300gsm</SelectItem>
                    <SelectItem value="art-200">Art Paper 200gsm</SelectItem>
                    <SelectItem value="art-250">Art Paper 250gsm</SelectItem>
                    <SelectItem value="duplex-250">Duplex 250gsm</SelectItem>
                    <SelectItem value="kraft-150">Kraft 150gsm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Máy in *</Label>
                <Select 
                  value={prepressOrderInfo.printMachine} 
                  onValueChange={(value) => setPrepressOrderInfo(prev => ({
                    ...prev,
                    printMachine: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn máy in" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offset-1">Offset 1 - Heidelberg</SelectItem>
                    <SelectItem value="offset-2">Offset 2 - KBA</SelectItem>
                    <SelectItem value="digital-1">Digital 1 - Xerox</SelectItem>
                    <SelectItem value="digital-2">Digital 2 - Canon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Độ ưu tiên</Label>
              <Select 
                value={prepressOrderInfo.priority} 
                onValueChange={(value) => setPrepressOrderInfo(prev => ({
                  ...prev,
                  priority: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú về tối ưu hóa, lý do gom chung..."
                value={prepressOrderInfo.notes}
                onChange={(e) => setPrepressOrderInfo(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                rows={3}
              />
            </div>

            {/* Selected Orders Summary */}
            <div className="space-y-2">
              <Label>Đơn hàng được chọn ({selectedOrders.length})</Label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {mockOrders
                  .filter(order => selectedOrders.includes(order.id))
                  .map(order => (
                    <div key={order.id} className="flex justify-between items-center py-1 text-sm border-b last:border-b-0">
                      <div>
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="ml-2 text-muted-foreground">({getDesignTypeName(order.designType)})</span>
                        <div className="text-xs text-muted-foreground">{order.description}</div>
                      </div>
                      <span className="text-muted-foreground">{order.quantity?.toLocaleString()}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreatePrepressOrder}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? 'Đang tạo...' : 'Tạo lệnh bình bài'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
