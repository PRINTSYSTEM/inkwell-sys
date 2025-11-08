import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle, TrendingUp, Eye, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Copy, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { mockMaterials } from '@/lib/mockData';
import { Material, MaterialType } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function InventoryIndex() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'normal'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 items per page

  const handleEditMaterial = (materialId: string) => {
    toast.success(`Đang chuyển đến chỉnh sửa nguyên liệu ${materialId}`);
  };

  const handleDeleteMaterial = (materialId: string) => {
    toast.success(`Đã đánh dấu xóa nguyên liệu ${materialId}`);
  };

  const handleDuplicateMaterial = (materialId: string) => {
    toast.success(`Đang sao chép nguyên liệu ${materialId}`);
  };

  const handleExportMaterial = (materialId: string) => {
    toast.success(`Đang xuất dữ liệu nguyên liệu ${materialId}`);
  };

  // Lọc nguyên liệu
  const filteredMaterials = mockMaterials.filter(material => {
    const matchSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       material.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || material.type === filterType;
    
    const matchStock = filterStock === 'all' || 
                      (filterStock === 'low' && material.currentStock <= material.minStock) ||
                      (filterStock === 'normal' && material.currentStock > material.minStock);
    
    return matchSearch && matchType && matchStock;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: 'filterType' | 'filterStock', value: string) => {
    if (type === 'filterType') {
      setFilterType(value as MaterialType | 'all');
    } else {
      setFilterStock(value as 'all' | 'low' | 'normal');
    }
    setCurrentPage(1);
  };

  // Thống kê
  const totalMaterials = mockMaterials.length;
  const lowStockCount = mockMaterials.filter(m => m.currentStock <= m.minStock).length;
  const totalValue = mockMaterials.reduce((sum, m) => sum + (m.currentStock * m.unitPrice), 0);

  const getStockStatus = (material: Material) => {
    if (material.currentStock <= material.minStock * 0.5) return 'critical';
    if (material.currentStock <= material.minStock) return 'low';
    return 'normal';
  };

  const getStockBadge = (material: Material) => {
    const status = getStockStatus(material);
    if (status === 'critical') return <Badge variant="destructive">Rất thấp</Badge>;
    if (status === 'low') return <Badge variant="secondary">Thấp</Badge>;
    return <Badge variant="outline">Bình thường</Badge>;
  };

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
                placeholder="Tìm kiếm theo tên, mã, hoặc loại nguyên liệu..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(value) => handleFilterChange('filterType', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại nguyên liệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="paper">Giấy</SelectItem>
                <SelectItem value="plastic">Nhựa</SelectItem>
                <SelectItem value="ink">Mực in</SelectItem>
                <SelectItem value="glue">Keo dán</SelectItem>
                <SelectItem value="foil">Kim tuyến</SelectItem>
                <SelectItem value="ribbon">Dây cột</SelectItem>
                <SelectItem value="hardware">Phụ kiện</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={(value) => handleFilterChange('filterStock', value)}>
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
            {paginatedMaterials.map((material) => (
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
                            {material.category} • {material.specification}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Tồn kho:</span>
                              <span className="ml-2 font-medium">
                                {material.currentStock} {material.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tối thiểu:</span>
                              <span className="ml-2 font-medium">
                                {material.minStock} {material.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Đơn giá:</span>
                              <span className="ml-2 font-medium">
                                {material.unitPrice.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vị trí:</span>
                              <span className="ml-2 font-medium">{material.location}</span>
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
                          <DropdownMenuItem onClick={() => handleEditMaterial(material.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateMaterial(material.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportMaterial(material.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Xuất dữ liệu
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMaterial(material.id)}
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
          {filteredMaterials.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMaterials.length)} trong tổng số {filteredMaterials.length} nguyên liệu
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

          {filteredMaterials.length === 0 && (
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