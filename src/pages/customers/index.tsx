import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Edit, Building2, Phone, MapPin, FileText, ChevronLeft, ChevronRight, MoreHorizontal, Copy, Trash2, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';
import { mockCustomers } from '@/lib/mockData';
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 items per page
  const navigate = useNavigate();

  const filteredCustomers = mockCustomers.filter(customer =>
    (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    customer.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.taxCode && customer.taxCode.includes(searchTerm)) ||
    // Thêm tìm kiếm theo tên viết tắt từ mã
    customer.code.replace(/^\d{4}/, '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateCustomer = () => {
    navigate('/customers/create');
  };

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: string) => {
    toast.success(`Đang chuyển đến chỉnh sửa khách hàng ${customerId}`);
    // navigate(`/customers/${customerId}/edit`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    toast.success(`Đã đánh dấu xóa khách hàng ${customerId}`);
  };

  const handleDuplicateCustomer = (customerId: string) => {
    toast.success(`Đang sao chép thông tin khách hàng ${customerId}`);
  };

  const handleSendEmail = (customerId: string) => {
    toast.success(`Đang mở email để liên hệ khách hàng ${customerId}`);
  };

  const handleExportCustomer = (customerId: string) => {
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
                  <TableHead>Người đại diện</TableHead>
                  <TableHead>Tên công ty</TableHead>
                  <TableHead>Mã số thuế</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Công nợ</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => {
                  // Tách tên viết tắt từ mã khách hàng
                  const shortName = customer.code.replace(/^\d{4}/, '');
                  
                  return (
                    <TableRow key={customer.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-mono">{customer.code}</span>
                          <Badge variant="outline" className="font-mono font-semibold text-xs">
                            {shortName}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.representativeName}</p>
                          <p className="text-sm text-muted-foreground">Folder: {customer.folder}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.companyName ? (
                          <p className="font-medium">{customer.companyName}</p>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Cá nhân</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.taxCode ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{customer.taxCode}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Không có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hiện tại:</span>
                            <span className={`font-medium ${customer.currentDebt > customer.maxDebt ? 'text-red-600' : 'text-green-600'}`}>
                              {customer.currentDebt.toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tối đa:</span>
                            <span className="font-medium">{customer.maxDebt.toLocaleString('vi-VN')}₫</span>
                          </div>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1 max-w-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-sm line-clamp-2">{customer.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-muted-foreground">bởi {customer.createdBy}</p>
                        </div>
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
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredCustomers.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCustomers.length)} trong tổng số {filteredCustomers.length} khách hàng
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
          
          {filteredCustomers.length === 0 && (
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
            <div className="text-3xl font-bold">{mockCustomers.length}</div>
            <p className="text-xs text-muted-foreground">
              +{mockCustomers.filter(c => new Date(c.createdAt) > new Date('2024-05-01')).length} trong tháng này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Có mã số thuế
            </CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockCustomers.filter(c => c.taxCode).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockCustomers.filter(c => c.taxCode).length / mockCustomers.length) * 100)}% tổng số khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Khách hàng mới
            </CardTitle>
            <Plus className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockCustomers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Trong 30 ngày qua
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}