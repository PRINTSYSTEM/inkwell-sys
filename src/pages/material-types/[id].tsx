import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Settings, Package } from 'lucide-react';
import { mockMaterialTypeCategories, mockMaterials } from '@/lib/mockData';
import { MaterialType } from '@/types';

export default function MaterialTypeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const category = mockMaterialTypeCategories.find(c => c.id === id);
  
  if (!category) {
    return (
      <div className="text-center py-8">
        <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Không tìm thấy loại nguyên liệu</h3>
        <Button onClick={() => navigate('/material-types')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Lấy các nguyên liệu thuộc loại này
  const relatedMaterials = mockMaterials.filter(m => m.type === category.materialType);

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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/material-types')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <Badge className={getTypeBadgeColor(category.materialType)}>
                {getTypeLabel(category.materialType)}
              </Badge>
              {category.isActive ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Hoạt động
                </Badge>
              ) : (
                <Badge variant="secondary">Tạm dừng</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{category.description}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/material-types/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Thông tin cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin loại nguyên liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tên loại</label>
              <p className="text-sm mt-1">{category.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
              <p className="text-sm mt-1">{category.description}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Loại nguyên liệu chính</label>
              <div className="mt-1">
                <Badge className={getTypeBadgeColor(category.materialType)}>
                  {getTypeLabel(category.materialType)}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
              <div className="mt-1">
                {category.isActive ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge variant="secondary">Tạm dừng</Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày tạo</label>
              <p className="text-sm mt-1">
                {new Date(category.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Cập nhật lần cuối</label>
              <p className="text-sm mt-1">
                {new Date(category.updatedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cấu hình */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình thông số</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Thông số kỹ thuật cần thiết</label>
              <div className="mt-2 space-y-2">
                {category.specifications.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{spec}</span>
                    <Badge variant="outline" className="text-xs">Bắt buộc</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Đơn vị tính hỗ trợ</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {category.units.map((unit, index) => (
                  <Badge key={index} variant="secondary">
                    {unit}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nguyên liệu liên quan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nguyên liệu thuộc loại này ({relatedMaterials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatedMaterials.length > 0 ? (
            <div className="space-y-3">
              {relatedMaterials.map((material) => (
                <div key={material.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{material.name}</h4>
                        <Badge variant="outline">{material.code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {material.category} • {material.specification}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tồn kho:</span>
                          <span className="ml-2 font-medium">
                            {material.currentStock} {material.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Đơn giá:</span>
                          <span className="ml-2 font-medium">
                            {material.unitPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Nhà cung cấp:</span>
                          <span className="ml-2 font-medium">{material.supplier}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vị trí:</span>
                          <span className="ml-2 font-medium">{material.location}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/inventory/${material.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có nguyên liệu nào</h3>
              <p className="text-muted-foreground mb-4">Chưa có nguyên liệu nào thuộc loại này</p>
              <Button onClick={() => navigate('/inventory/create')}>
                <Package className="h-4 w-4 mr-2" />
                Thêm nguyên liệu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}