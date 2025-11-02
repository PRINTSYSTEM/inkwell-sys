import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Clock, CheckCircle, AlertCircle, XCircle, MoreHorizontal, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Design } from '@/types';
import { designService, users } from '@/lib/mockData';

const statusConfig = {
  pending: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  review: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  revision: { label: 'Cần sửa', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  delivered: { label: 'Đã giao', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
};

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-600' },
};

export default function AllDesignsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [designerFilter, setDesignerFilter] = useState<string>('all');
  const [designTypeFilter, setDesignTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const data = await designService.getAll();
        setDesigns(data);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách thiết kế",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDesigns();
  }, [toast]);

  const getDesignerName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.fullName || 'Không xác định';
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.designCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || design.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || design.priority === priorityFilter;
    const matchesDesigner = designerFilter === 'all' || design.assignedTo === designerFilter;
    const matchesDesignType = designTypeFilter === 'all' || design.designType === designTypeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDesigner && matchesDesignType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const handleViewDetail = (designId: string) => {
    navigate(`/design/detail/${designId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tất cả thiết kế</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và theo dõi tất cả thiết kế trong hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã thiết kế, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                {Object.entries(priorityConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={designTypeFilter} onValueChange={setDesignTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thiết kế" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="T">Túi giấy</SelectItem>
                <SelectItem value="C">Nhãn giấy</SelectItem>
                <SelectItem value="D">Decal</SelectItem>
                <SelectItem value="H">Hộp giấy</SelectItem>
                <SelectItem value="R">Decal cuộn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={designerFilter} onValueChange={setDesignerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Thiết kế viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NV</SelectItem>
                {users.filter(u => u.role === 'designer' || u.role === 'designer_manager').map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách thiết kế ({filteredDesigns.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã thiết kế</TableHead>
                  <TableHead>Tên thiết kế</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thiết kế viên</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hạn hoàn thành</TableHead>
                  <TableHead className="w-16">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesigns.map((design) => {
                  const status = statusConfig[design.status];
                  const priority = priorityConfig[design.priority];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow 
                      key={design.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetail(design.id)}
                    >
                      <TableCell>
                        <div className="font-mono text-sm">{design.designCode}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{design.designName}</div>
                        <div className="text-xs text-muted-foreground">
                          {design.designType} • {design.dimensions} • {design.quantity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{design.customerName}</div>
                        <div className="text-xs text-muted-foreground">#{design.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getDesignerName(design.assignedTo).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getDesignerName(design.assignedTo)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${priority.color} text-xs`}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {design.dueDate ? (
                          <div className={new Date(design.dueDate) < new Date() ? 'text-red-600' : 'text-muted-foreground'}>
                            {formatDate(design.dueDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Chưa đặt</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(design.id);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${design.orderId}`);
                            }}>
                              <FileText className="mr-2 h-4 w-4" />
                              Xem đơn hàng
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implement assign action
                            }}>
                              <User className="mr-2 h-4 w-4" />
                              Chỉ định lại
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && filteredDesigns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || designerFilter !== 'all' || designTypeFilter !== 'all'
                ? 'Không tìm thấy thiết kế phù hợp với bộ lọc'
                : 'Chưa có thiết kế nào'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}