import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Clock, CheckCircle, AlertCircle, XCircle, MoreHorizontal, FileText, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useDesigns, useDeleteDesign } from '@/hooks/use-design';
import type { Design, DesignListResponse, DesignQueryParams } from '@/Schema';

const statusConfig = {
  pending: { label: 'Chờ làm', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: 'Đang làm', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  review: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  revision: { label: 'Cần sửa', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  delivered: { label: 'Đã giao', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
} as const;

export default function AllDesignsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all_status');
  const [designTypeFilter, setDesignTypeFilter] = useState<string>('all_types');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Prepare query parameters
  const queryParams: DesignQueryParams = {
    pageNumber: currentPage,
    pageSize: pageSize,
    ...(statusFilter !== 'all_status' && { status: statusFilter }),
    ...(searchTerm && { search: searchTerm }),
  };
  
  // React Query hooks
  const { data: designsResponse, isLoading, error, refetch } = useDesigns(queryParams);
  const deleteDesignMutation = useDeleteDesign();
  
  // Extract data from response
  const designs = designsResponse?.items || [];
  const totalCount = designsResponse?.totalCount || 0;
  const totalPages = designsResponse?.totalPages || 0;
  const hasNextPage = designsResponse?.hasNextPage || false;
  const hasPreviousPage = designsResponse?.hasPreviousPage || false;
  
  // Handle error
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thiết kế",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Client-side filtering for search and design type (since API may not support all filters)
  const filteredDesigns = designs.filter(design => {
    const matchesSearch = !searchTerm || 
      design.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.designer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      design.designType?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDesignType = designTypeFilter === 'all_types' || 
      design.designType?.code === designTypeFilter;
    
    return matchesSearch && matchesDesignType;
  });
  
  // Handle delete design
  const handleDeleteDesign = async (designId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết kế này?')) {
      deleteDesignMutation.mutate(designId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleViewDetail = (designId: number) => {
    navigate(`/design/detail/${designId}`);
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã, tên thiết kế viên..."
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
                <SelectItem value="all_status">Tất cả trạng thái</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={designTypeFilter} onValueChange={setDesignTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thiết kế" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">Tất cả loại</SelectItem>
                <SelectItem value="T">Túi giấy</SelectItem>
                <SelectItem value="C">Nhãn giấy</SelectItem>
                <SelectItem value="D">Decal</SelectItem>
                <SelectItem value="H">Hộp giấy</SelectItem>
                <SelectItem value="R">Decal cuộn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách thiết kế ({totalCount})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã thiết kế</TableHead>
                    <TableHead>Loại thiết kế</TableHead>
                    <TableHead>Thiết kế viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="w-16">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDesigns.map((design) => {
                    const status = statusConfig[design.designStatus as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow 
                        key={design.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetail(design.id)}
                      >
                        <TableCell>
                          <div className="font-mono text-sm">{design.code}</div>
                          <div className="text-xs text-muted-foreground">
                            Đơn #{design.orderId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{design.designType?.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {design.materialType?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {design.designer?.fullName.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{design.designer?.fullName || 'Chưa phân công'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{design.quantity?.toLocaleString() || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {design.dimensions || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(design.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {!isLoading && filteredDesigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all_status' || designTypeFilter !== 'all_types'
                    ? 'Không tìm thấy thiết kế phù hợp với bộ lọc'
                    : 'Chưa có thiết kế nào'
                  }
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} thiết kế
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <div className="text-sm">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}