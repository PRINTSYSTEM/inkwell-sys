import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Package, Settings } from 'lucide-react';
import { mockMaterialTypeCategories } from '@/lib/mockData';
import { MaterialType, MaterialTypeCategory } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function MaterialTypes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Lọc loại nguyên liệu
  const filteredCategories = mockMaterialTypeCategories.filter(category => {
    const matchSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       category.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || category.materialType === filterType;
    const matchStatus = filterStatus === 'all' || 
                       (filterStatus === 'active' && category.isActive) ||
                       (filterStatus === 'inactive' && !category.isActive);
    
    return matchSearch && matchType && matchStatus;
  });

  // Thống kê
  const totalCategories = mockMaterialTypeCategories.length;
  const activeCategories = mockMaterialTypeCategories.filter(c => c.isActive).length;
  const categoriesByType = mockMaterialTypeCategories.reduce((acc, cat) => {
    acc[cat.materialType] = (acc[cat.materialType] || 0) + 1;
    return acc;
  }, {} as Record<MaterialType, number>);

  const getTypeBadgeColor = (type: MaterialType) => {
    const colors = {
      paper: 'bg-blue-100 text-blue-800',
      plastic: 'bg-green-100 text-green-800',
      ink: 'bg-purple-100 text-purple-800',
      glue: 'bg-orange-100 text-orange-800',
      coating: 'bg-cyan-100 text-cyan-800',
      foil: 'bg-yellow-100 text-yellow-800',
      ribbon: 'bg-pink-100 text-pink-800',
      hardware: 'bg-gray-100 text-gray-800',
      packaging: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: MaterialType) => {
    const labels = {
      paper: 'Giấy',
      plastic: 'Nhựa',
      ink: 'Mực in',
      glue: 'Keo dán',
      coating: 'Phủ bóng',
      foil: 'Kim tuyến',
      ribbon: 'Dây cột',
      hardware: 'Phụ kiện',
      packaging: 'Bao bì'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý loại nguyên liệu thô</h1>
          <p className="text-muted-foreground mt-1">Phân loại chi tiết các nguyên liệu thô để quản lý kho và tính toán thiết kế</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/inventory')}>
            <Package className="h-4 w-4 mr-2" />
            Quay lại kho
          </Button>
          <Button onClick={() => navigate('/material-types/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm loại nguyên liệu
          </Button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng loại</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold">{activeCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Edit className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giấy</p>
                <p className="text-2xl font-bold">{categoriesByType.paper || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nhựa</p>
                <p className="text-2xl font-bold">{categoriesByType.plastic || 0}</p>
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
                placeholder="Tìm kiếm loại nguyên liệu..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as MaterialType | 'all')}>
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
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge className={getTypeBadgeColor(category.materialType)}>
                            {getTypeLabel(category.materialType)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      {category.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Tạm dừng</Badge>
                      )}
                    </div>

                    {/* Thông số kỹ thuật */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Thông số kỹ thuật:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.specifications.slice(0, 3).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {category.specifications.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.specifications.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Đơn vị tính */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Đơn vị tính:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.units.map((unit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {unit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/material-types/${category.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Chi tiết
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/material-types/${category.id}/edit`)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy loại nguyên liệu</h3>
              <p className="text-muted-foreground mb-4">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              <Button onClick={() => navigate('/material-types/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm loại nguyên liệu mới
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}