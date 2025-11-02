import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Settings, ToggleLeft, ToggleRight, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { DesignTypeEntity } from '@/types';
import { mockDesignTypes, designTypesService } from '@/lib/mockData';

export default function DesignTypesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [designTypes, setDesignTypes] = useState<DesignTypeEntity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        const data = await designTypesService.getAll();
        setDesignTypes(data);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại thiết kế",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await designTypesService.update(id, { isActive });
      setDesignTypes(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isActive, updatedAt: new Date().toISOString() } : item
        )
      );
      toast({
        title: "Thành công",
        description: `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} loại thiết kế`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await designTypesService.delete(id);
      setDesignTypes(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Thành công",
        description: "Đã xóa loại thiết kế",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa loại thiết kế",
        variant: "destructive",
      });
    }
  };

  const filteredDesignTypes = designTypes.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý loại thiết kế</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình các loại thiết kế và format mã thiết kế
          </p>
        </div>
        <Button 
          onClick={() => navigate('/design-types/create')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm loại thiết kế
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Danh sách loại thiết kế ({filteredDesignTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mã</TableHead>
                  <TableHead>Tên loại thiết kế</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Format mã</TableHead>
                  <TableHead className="w-24">Trạng thái</TableHead>
                  <TableHead className="w-24">Thứ tự</TableHead>
                  <TableHead className="w-32">Cập nhật</TableHead>
                  <TableHead className="w-20">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignTypes.map((designType) => (
                  <TableRow key={designType.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {designType.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {designType.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {designType.description || '-'}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {designType.codeFormat}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={designType.isActive}
                          onCheckedChange={(checked) => handleToggleActive(designType.id, checked)}
                        />
                        <Badge variant={designType.isActive ? "default" : "secondary"}>
                          {designType.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {designType.sortOrder}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(designType.updatedAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/design-types/${designType.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Xác nhận xóa
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa loại thiết kế <strong>{designType.name}</strong>?
                                <br />
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(designType.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredDesignTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có loại thiết kế nào'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}