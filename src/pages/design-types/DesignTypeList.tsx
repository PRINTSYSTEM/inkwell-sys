import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { DesignTypeEntity, DesignTypeStats } from '@/Schema/design-type.schema';
import { designTypeService } from '@/services/designTypeService';

export default function DesignTypesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [designTypes, setDesignTypes] = useState<DesignTypeEntity[]>([]);
  const [stats, setStats] = useState<DesignTypeStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesResponse, statsResponse] = await Promise.all([
        designTypeService.getDesignTypes({ pageSize: 1000 }),
        designTypeService.getDesignTypeStats()
      ]);
      
      setDesignTypes(typesResponse.data);
      setStats(statsResponse);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách loại thiết kế",
        variant: "destructive",
      });
      console.error('Error loading design types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: number) => {
    try {
      setDeleting(id);
      await designTypeService.deleteDesignType(id);
      
      toast({
        title: "Thành công",
        description: "Đã xóa loại thiết kế",
      });
      
      // Reload data
      await loadData();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa loại thiết kế",
        variant: "destructive",
      });
      console.error('Error deleting design type:', error);
    } finally {
      setDeleting(null);
    }
  };

  const filteredDesignTypes = designTypes.filter(dt =>
    dt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý loại thiết kế</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các loại thiết kế trong hệ thống
          </p>
        </div>
        <Button 
          onClick={() => navigate('/design-types/create')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm loại thiết kế
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng số</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500">loại thiết kế</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500">loại thiết kế</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tạm dừng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-gray-500">loại thiết kế</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên loại thiết kế</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesignTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Không tìm thấy loại thiết kế nào' : 'Chưa có loại thiết kế nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDesignTypes.map((designType) => (
                  <TableRow key={designType.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {designType.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {designType.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {designType.description || '-'}
                    </TableCell>
                    <TableCell>{designType.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={designType.status === 'active' ? 'default' : 'secondary'}>
                        {designType.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </TableCell>
                    <TableCell>{designType.createdBy.fullName}</TableCell>
                    <TableCell>
                      {new Date(designType.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/design-types/edit/${designType.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={deleting === designType.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Xác nhận xóa
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa loại thiết kế <strong>{designType.name}</strong>? 
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(designType.id)}
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}