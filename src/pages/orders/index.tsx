import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Calendar, Package, Filter, ChevronDown, Factory, ChevronLeft, ChevronRight, Edit, Copy, Trash2, Printer, Download, Layers } from 'lucide-react';
import { mockOrders } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/lib/permissions';

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
};

const statusColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  designing: 'bg-purple-100 text-purple-800 border-purple-200',
  design_approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  waiting_quote: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-orange-100 text-orange-800 border-orange-200',
  deposited: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  prepress_ready: 'bg-teal-100 text-teal-800 border-teal-200',
  in_production: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const priorityOrders = mockOrders.filter(order => 
  order.status === 'quoted' || 
  order.status === 'design_approved' ||
  (order.deliveryDate && new Date(order.deliveryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
);

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 items per page

  // Get permissions for current user
  const permissions = usePermissions(user?.role || 'operator');

  // Filter orders based on role permissions and search
  const filteredOrders = mockOrders
    .filter(order => {
      // Role-based filtering theo workflow mới
      switch (permissions.permissions.dataScope) {
        case 'financial-only':
          // Kế toán chỉ thấy đơn từ khi thiết kế đã được duyệt trở đi
          return ['design_approved', 'waiting_quote', 'quoted', 'deposited'].includes(order.status);
        case 'design-only':
          // Designer chỉ thấy đơn đang thiết kế hoặc chờ duyệt thiết kế
          return ['new', 'designing', 'design_approved'].includes(order.status);
        case 'technical-only':
          // Bình bài chỉ thấy đơn đã đặt cọc
          return order.status === 'deposited';
        case 'production-only':
          // Operator chỉ thấy đơn đã có lệnh bình bài
          return ['prepress_ready', 'in_production'].includes(order.status);
        case 'production-management':
          // Production manager thấy đơn trong sản xuất và hoàn thành
          return ['prepress_ready', 'in_production', 'completed'].includes(order.status);
        default:
          return true; // Admin, sales thấy tất cả
      }
    })
    .filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .map(order => permissions.filterOrderData(order)); // Apply data masking

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCreateOrder = () => {
    navigate('/orders/create');
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    toast.success(`Đang chuyển đến chỉnh sửa đơn hàng ${orderId}`);
    // navigate(`/orders/${orderId}/edit`); // Uncomment when edit page is created
  };

  const handleDuplicateOrder = (orderId: string) => {
    toast.success(`Đang sao chép đơn hàng ${orderId}`);
    // Logic to duplicate order
  };

  const handleDeleteOrder = (orderId: string) => {
    toast.success(`Đã đánh dấu xóa đơn hàng ${orderId}`);
    // Logic to delete order
  };

  const handlePrintOrder = (orderId: string) => {
    toast.success(`Đang in đơn hàng ${orderId}`);
    // Logic to print order
  };

  const handleExportOrder = (orderId: string) => {
    toast.success(`Đang xuất PDF đơn hàng ${orderId}`);
    // Logic to export order
  };

  const handleSendToPrepress = (orderId: string) => {
    toast.success(`Đã gửi đơn hàng ${orderId} đến bình bài`);
    // Logic: Chuyển status từ 'deposited' -> 'prepress_ready'
    // navigate('/prepress/create-print-order'); // Có thể chuyển đến trang tạo lệnh bình bài
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === '***' || amount === undefined) {
      return '***'; // Hiển thị ẩn cho những role không có quyền xem giá
    }
    if (typeof amount === 'string') {
      return amount; // Return as-is if already formatted
    }
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

  // Calculate statistics
  const totalOrders = mockOrders.length;
  const newOrders = mockOrders.filter(o => o.status === 'new').length;
  const inProductionOrders = mockOrders.filter(o => o.status === 'in_production').length;
  const completedOrders = mockOrders.filter(o => o.status === 'completed').length;
  const totalRevenue = mockOrders
    .filter(o => o.totalAmount)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý toàn bộ đơn hàng</p>
        </div>
        {permissions.permissions.canViewAllOrders && (
          <Button onClick={handleCreateOrder} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo đơn hàng
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +{newOrders} đơn mới
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang sản xuất</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProductionOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((inProductionOrders / totalOrders) * 100)}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedOrders / totalOrders) * 100)}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Giá trị tất cả đơn hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Orders Alert */}
      {priorityOrders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Đơn hàng cần chú ý ({priorityOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorityOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-sm text-muted-foreground">{order.customerName}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    Xem
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách đơn hàng</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm kiếm đơn hàng..." 
                  className="pl-10 w-80"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Trạng thái</TableHead>
                {permissions.permissions.canViewPricing && <TableHead>Giá trị</TableHead>}
                {permissions.permissions.canViewCustomerInfo && <TableHead>Ngày giao</TableHead>}
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="max-w-xs truncate" title={order.description}>
                    {order.description}
                  </TableCell>
                  <TableCell>{order.quantity.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  {permissions.permissions.canViewPricing && (
                    <TableCell>
                      {order.totalAmount ? formatCurrency(order.totalAmount) : '—'}
                    </TableCell>
                  )}
                  {permissions.permissions.canViewCustomerInfo && (
                    <TableCell>
                      {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        {permissions.permissions.canEdit && (
                          <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicateOrder(order.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Sao chép đơn hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintOrder(order.id)}>
                          <Printer className="h-4 w-4 mr-2" />
                          In đơn hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportOrder(order.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Xuất PDF
                        </DropdownMenuItem>
                        {/* Nút gửi đến bình bài cho đơn đã đặt cọc */}
                        {order.status === 'deposited' && (
                          <DropdownMenuItem onClick={() => handleSendToPrepress(order.id)}>
                            <Layers className="h-4 w-4 mr-2" />
                            Gửi đến bình bài
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.info('Đang theo dõi tiến độ sản xuất...')}>
                          <Package className="h-4 w-4 mr-2" />
                          Theo dõi sản xuất
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Đang cập nhật tiến độ...')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Cập nhật tiến độ
                        </DropdownMenuItem>
                        {permissions.permissions.canDelete && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa đơn hàng
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn hàng
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 text-center text-sm"
                  />
                  <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Chưa có đơn hàng nào được tạo'
                }
              </p>
              <Button onClick={handleCreateOrder}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn hàng đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}