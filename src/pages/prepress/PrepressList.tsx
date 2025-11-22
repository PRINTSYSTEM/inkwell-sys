import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus,
  Printer, 
  FileText, 
  Calendar,
  Package,
  CheckCircle,
  Clock,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Factory,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { mockPrepressOrders } from '@/lib/mockData';
import { toast } from 'sonner';

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

export default function PrepressIndex() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Số đơn hàng đã đặt cọc chờ bình bài
  const deposittedOrders = mockOrders.filter(order => order.status === 'deposited');

  const filteredPrepressOrders = mockPrepressOrders.filter(order =>
    order.prepressOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.paperType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.printMachine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredPrepressOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredPrepressOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreatePrepressOrder = () => {
    navigate('/prepress/create-print-order');
  };

  const handleViewOrder = (orderId: string) => {
    toast.info(`Xem chi tiết lệnh bình bài ${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    toast.info(`Chỉnh sửa lệnh bình bài ${orderId}`);
  };

  const handleDeleteOrder = (orderId: string) => {
    toast.success(`Đã xóa lệnh bình bài ${orderId}`);
  };

  const handleSendToProduction = (orderId: string) => {
    toast.success(`Đã gửi lệnh ${orderId} đến sản xuất`);
  };

  const getPriorityBadge = (priority: keyof typeof priorityColors) => (
    <Badge variant="outline" className={priorityColors[priority]}>
      {priority === 'low' ? 'Thấp' : 
       priority === 'medium' ? 'Trung bình' :
       priority === 'high' ? 'Cao' : 'Khẩn cấp'}
    </Badge>
  );

  const getStatusBadge = (status: keyof typeof statusColors) => (
    <Badge variant="outline" className={statusColors[status]}>
      {status === 'pending' ? 'Chờ xử lý' :
       status === 'in_progress' ? 'Đang thực hiện' : 'Hoàn thành'}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Bình bài</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý lệnh bình bài từ các đơn hàng đã đặt cọc
          </p>
        </div>
        <Button onClick={handleCreatePrepressOrder} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo lệnh bình bài
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn chờ bình bài</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deposittedOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              đơn hàng đã đặt cọc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lệnh đang thực hiện</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPrepressOrders.filter(o => o.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              lệnh bình bài
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPrepressOrders.filter(o => o.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              lệnh đã xong
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lượng</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPrepressOrders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              sản phẩm đã bình bài
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for orders waiting */}
      {deposittedOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Có {deposittedOrders.length} đơn hàng chờ tạo lệnh bình bài
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-blue-700">
                Các đơn hàng đã được khách hàng đặt cọc và sẵn sàng để tạo lệnh bình bài.
              </p>
              <Button onClick={handleCreatePrepressOrder} variant="outline" size="sm">
                Tạo lệnh ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách lệnh bình bài</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm lệnh bình bài..." 
                className="pl-10 w-80"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lệnh</TableHead>
                <TableHead>Số đơn hàng</TableHead>
                <TableHead>Loại giấy</TableHead>
                <TableHead>Máy in</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Độ ưu tiên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người phụ trách</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-primary" />
                      {order.prepressOrderNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {order.orderIds.map((orderId) => {
                        const orderInfo = mockOrders.find(o => o.id === orderId);
                        return (
                          <Badge key={orderId} variant="outline" className="text-xs">
                            {orderInfo?.orderNumber || orderId}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{order.paperType}</TableCell>
                  <TableCell>{order.printMachine}</TableCell>
                  <TableCell>{order.quantity.toLocaleString()}</TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {order.assignedTo.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm">{order.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Chưa giao</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p className="text-xs text-muted-foreground">bởi {order.createdBy}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrder(order.prepressOrderNumber)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditOrder(order.prepressOrderNumber)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {order.status === 'completed' && (
                          <DropdownMenuItem onClick={() => handleSendToProduction(order.prepressOrderNumber)}>
                            <Factory className="h-4 w-4 mr-2" />
                            Gửi đến sản xuất
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.info('Đang in lệnh bình bài...')}>
                          <Printer className="h-4 w-4 mr-2" />
                          In lệnh bình bài
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Đang xuất PDF...')}>
                          <Download className="h-4 w-4 mr-2" />
                          Xuất PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteOrder(order.prepressOrderNumber)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa lệnh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredPrepressOrders.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPrepressOrders.length)} trong tổng số {filteredPrepressOrders.length} lệnh bình bài
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

          {filteredPrepressOrders.length === 0 && (
            <div className="text-center py-8">
              <Printer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có lệnh bình bài</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Không tìm thấy lệnh bình bài nào phù hợp'
                  : 'Chưa có lệnh bình bài nào được tạo'
                }
              </p>
              <Button onClick={handleCreatePrepressOrder}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo lệnh bình bài đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}