import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Edit, Building2, ChevronLeft, ChevronRight, MoreHorizontal, Copy, Trash2, Mail, Download, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomerService } from '@/services';
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerListItem } from '@/Schema/customer.schema';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    totalDebt: 0,
    averageDebt: 0
  });
  const itemsPerPage = 10; // 10 items per page
  const navigate = useNavigate();

  // Load customer statistics
  const loadCustomerStats = async () => {
    try {
      const customerService = getCustomerService();
      const statsResponse = await customerService.getCustomerStats();
      
      if (statsResponse.success && statsResponse.data) {
        const data = statsResponse.data;
        
        setStats({
          total: data.total,
          totalDebt: data.totalDebt,
          averageDebt: data.averageDebt
        });
      }
    } catch (error) {
      console.error('Error loading customer stats:', error);
    }
  };

  // Load customers when component mounts or dependencies change
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const customerService = getCustomerService();
        const response = await customerService.getCustomers({
          pageNumber: currentPage,
          pageSize: itemsPerPage,
          search: searchTerm || undefined
        });

        if (response.success && response.data) {
          setCustomers(response.data.items || []);
          setTotalCount(response.data.totalCount || 0);
        } else {
          toast.error('Không thể tải danh sách khách hàng');
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Lỗi khi tải danh sách khách hàng');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [currentPage, searchTerm]);

  // Load stats on mount
  useEffect(() => {
    loadCustomerStats();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateCustomer = () => {
    navigate('/customers/create');
  };

  const handleViewCustomer = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: number) => {
    toast.success(`Đang chuyển đến chỉnh sửa khách hàng ${customerId}`);
    // navigate(`/customers/${customerId}/edit`);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    try {
      const customerService = getCustomerService();
      const response = await customerService.deleteCustomer(customerId);
      
      if (response.success) {
        toast.success('Xóa khách hàng thành công');
        // Refresh the customer list
        await loadCustomers();
      } else {
        toast.error('Không thể xóa khách hàng');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Lỗi khi xóa khách hàng');
    }
  };

  const handleDuplicateCustomer = (customerId: number) => {
    toast.success(`Đang sao chép thông tin khách hàng ${customerId}`);
  };

  const handleSendEmail = (customerId: number) => {
    toast.success(`Đang mở email để liên hệ khách hàng ${customerId}`);
  };

  const handleExportCustomer = (customerId: number) => {
    toast.success(`Đang xuất thông tin khách hàng ${customerId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
          <p className="text-muted-foreground mt-1">Danh sách khách hàng và thông tin liên hệ</p>
        </div>
        <Button onClick={handleCreateCustomer} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm theo tên, mã KH, người đại diện, SĐT, mã số thuế..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>Tên công ty</TableHead>
                  <TableHead>Trạng thái nợ</TableHead>
                  <TableHead>Công nợ hiện tại</TableHead>
                  <TableHead>Hạn mức nợ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Không tìm thấy khách hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => {
                    // Tách tên viết tắt từ mã khách hàng (nếu có)
                    const shortName = customer.code?.replace(/^\d{4}/, '') || '';
                  
                  return (
                    <TableRow key={customer.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-mono">{customer.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{customer.name}</p>
                      </TableCell>
                      <TableCell>
                        {customer.companyName ? (
                          <p className="font-medium">{customer.companyName}</p>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Cá nhân</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            customer.debtStatus === 'good' ? 'default' : 
                            customer.debtStatus === 'warning' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {customer.debtStatus === 'good' ? 'Tốt' : 
                           customer.debtStatus === 'warning' ? 'Cảnh báo' : 
                           'Bị chặn'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${(customer.currentDebt || 0) > (customer.maxDebt || 0) ? 'text-red-600' : 'text-green-600'}`}>
                          {(customer.currentDebt || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{(customer.maxDebt || 0).toLocaleString('vi-VN')} ₫</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(customer.id)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Gửi email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateCustomer(customer.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Sao chép
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportCustomer(customer.id)}>
                              <Download className="h-4 w-4 mr-2" />
                              Xuất dữ liệu
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa khách hàng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} trong tổng số {totalCount} khách hàng
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
          </div>
          
          {!loading && customers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng khách hàng
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số khách hàng trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng công nợ
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalDebt.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng công nợ hiện tại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ trung bình
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(stats.averageDebt).toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs text-muted-foreground">
              Trung bình mỗi khách hàng
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}