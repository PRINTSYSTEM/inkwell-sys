import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle, TrendingUp, Eye, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Copy, Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMaterials, useDeleteMaterial } from '@/hooks/use-material';
import type { MaterialResponse } from '@/Schema/material.schema';

export default function InventoryIndex() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'normal'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: materialsData, isLoading } = useMaterials({
    page: currentPage,
    size: itemsPerPage,
    search: searchTerm || undefined,
  });

  const deleteMaterial = useDeleteMaterial();

  const materials = materialsData?.items ?? [];
  const totalMaterials = materialsData?.total ?? 0;
  const totalPages = materialsData?.totalPages ?? 1;

  const lowStockCount = useMemo(
    () => materials.filter((m: MaterialResponse) => m.currentStock <= m.minStock).length,
    [materials]
  );

  const totalValue = useMemo(
    () => materials.reduce((sum: number, m: MaterialResponse) => sum + (m.currentStock ?? 0) * (m.unitPrice ?? 0), 0),
    [materials]
  );

  const filteredMaterials = useMemo(
    () => materials.filter((material: MaterialResponse) => {
      if (filterStock === 'all') return true;
      if (filterStock === 'low') return (material.currentStock ?? 0) <= (material.minStock ?? 0);
      return (material.currentStock ?? 0) > (material.minStock ?? 0);
    }),
    [materials, filterStock]
  );

  const getStockStatus = (material: MaterialResponse) => {
    const stock = material.currentStock ?? 0;
    const min = material.minStock ?? 0;
    if (stock <= min * 0.5) return 'critical';
    if (stock <= min) return 'low';
    return 'normal';
  };

  const getStockBadge = (material: MaterialResponse) => {
    const status = getStockStatus(material);
    if (status === 'critical') return <Badge variant="destructive">Rất thấp</Badge>;
    if (status === 'low') return <Badge variant="secondary">Thấp</Badge>;
    return <Badge variant="outline">Bình thường</Badge>;
  };

  const handleDelete = (materialId: number) => {
    deleteMaterial.mutate(materialId);
  };

  const typeLabel = (type?: string) => {
    if (type === 'cuon') return 'Cuộn';
    if (type === 'to') return 'Tờ';
    return type ?? '—';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý kho</h1>
          <p className="text-muted-foreground mt-1">Quản lý nguyên liệu và vật tư sản xuất</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/inventory/templates')}>
            <Package className="h-4 w-4 mr-2" />
            Mẫu sản phẩm
          </Button>
          <Button onClick={() => navigate('/inventory/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nguyên liệu
          </Button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng nguyên liệu</p>
                <p className="text-2xl font-bold">{totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá trị tồn kho</p>
                <p className="text-2xl font-bold">{totalValue.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã nguyên liệu..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Select value={filterStock} onValueChange={(value) => { setFilterStock(value as 'all' | 'low' | 'normal'); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tình trạng kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low">Sắp hết</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredMaterials.map((material: MaterialResponse) => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{material.name}</h3>
                            <Badge variant="outline">{material.code}</Badge>
                            {getStockBadge(material)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {material.materialTypeName ?? '—'} • {typeLabel(material.type)}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tồn kho:</span>
                              <span className="ml-2 font-medium">
                                {material.currentStock ?? 0} {material.unit ?? ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tối thiểu:</span>
                              <span className="ml-2 font-medium">
                                {material.minStock ?? 0} {material.unit ?? ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Đơn giá:</span>
                              <span className="ml-2 font-medium">
                                {(material.unitPrice ?? 0).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Nhà cung cấp:</span>
                              <span className="ml-2 font-medium">{material.vendorName ?? '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/inventory/${material.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Chi tiết
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success(`Chỉnh sửa nguyên liệu ${material.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`Sao chép nguyên liệu ${material.id}`)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(`Xuất dữ liệu nguyên liệu ${material.id}`)}>
                            <Download className="h-4 w-4 mr-2" />
                            Xuất dữ liệu
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(material.id!)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa nguyên liệu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalMaterials > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages} (tổng {totalMaterials} nguyên liệu)
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

          {!isLoading && filteredMaterials.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy nguyên liệu</h3>
              <p className="text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
