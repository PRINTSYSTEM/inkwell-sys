import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, Calculator } from 'lucide-react';
import { mockProductTemplates, productCategories } from '@/lib/mockData';
import { ProductCategory, ProductTemplate, MaterialRequirement } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function ProductTemplates() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');

  // Lọc templates
  const filteredTemplates = mockProductTemplates.filter(template => {
    const matchSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = filterCategory === 'all' || template.category === filterCategory;
    
    return matchSearch && matchCategory;
  });

  const getCategoryInfo = (categoryId: ProductCategory) => {
    return productCategories.find(c => c.id === categoryId);
  };

  const getCategoryBadgeColor = (category: ProductCategory) => {
    const colors = {
      bag: 'bg-blue-100 text-blue-800',
      decal: 'bg-green-100 text-green-800', 
      box: 'bg-orange-100 text-orange-800',
      paper: 'bg-purple-100 text-purple-800',
      label: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const calculateMaterialCost = (template: ProductTemplate) => {
    return template.materialRequirements.reduce((sum: number, req: MaterialRequirement) => sum + req.estimatedCost, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mẫu sản phẩm</h1>
          <p className="text-muted-foreground mt-1">Quản lý mẫu sản phẩm và công thức nguyên liệu</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/inventory')}>
            <Package className="h-4 w-4 mr-2" />
            Quay lại kho
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm mẫu sản phẩm
          </Button>
        </div>
      </div>

      {/* Thống kê theo loại sản phẩm */}
      <div className="grid gap-4 md:grid-cols-5">
        {productCategories.map((category) => {
          const count = mockProductTemplates.filter(t => t.category === category.id).length;
          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setFilterCategory(category.id)}>
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">mẫu sản phẩm</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm mẫu sản phẩm..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as ProductCategory | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Loại sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {productCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredTemplates.map((template) => {
              const categoryInfo = getCategoryInfo(template.category);
              const totalCost = calculateMaterialCost(template);
              
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-medium">{template.name}</h3>
                          <Badge className={getCategoryBadgeColor(template.category)}>
                            {categoryInfo?.name}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.description}
                        </p>

                        {/* Thông số kỹ thuật */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {Object.entries(template.specifications).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-xs text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="ml-2 text-sm font-medium">{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Nguyên liệu cần thiết */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Nguyên liệu cần thiết (cho {template.baseQuantity} sản phẩm):
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {template.materialRequirements.map((req, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>
                                  {req.materialName} ({req.materialCode})
                                </span>
                                <span className="font-medium">
                                  {req.quantity} {req.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 text-right">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Chi phí nguyên liệu</p>
                          <p className="text-2xl font-bold text-green-600">
                            {totalCost.toLocaleString('vi-VN')}đ
                          </p>
                          <p className="text-xs text-muted-foreground">
                            cho {template.baseQuantity} sản phẩm
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full">
                            <Calculator className="h-4 w-4 mr-2" />
                            Tính toán
                          </Button>
                          <Button size="sm" className="w-full">
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy mẫu sản phẩm</h3>
              <p className="text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}