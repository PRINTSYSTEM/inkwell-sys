import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, X, Settings } from 'lucide-react';
import { MaterialType } from '@/types';

export default function CreateMaterialType() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materialType: '' as MaterialType | '',
    isActive: true,
    specifications: [''],
    units: ['']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create material type
    console.log('Creating material type:', {
      ...formData,
      specifications: formData.specifications.filter(s => s.trim() !== ''),
      units: formData.units.filter(u => u.trim() !== '')
    });
    
    // Simulate success and redirect
    navigate('/material-types');
  };

  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, '']
    }));
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => i === index ? value : spec)
    }));
  };

  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...prev.units, '']
    }));
  };

  const removeUnit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const updateUnit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map((unit, i) => i === index ? value : unit)
    }));
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

  const isFormValid = formData.name && formData.description && formData.materialType &&
                    formData.specifications.some(s => s.trim() !== '') &&
                    formData.units.some(u => u.trim() !== '');

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
            <h1 className="text-3xl font-bold text-foreground">Thêm loại nguyên liệu thô mới</h1>
            <p className="text-muted-foreground mt-1">Tạo phân loại chi tiết cho nguyên liệu thô để quản lý kho hiệu quả</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Tên loại nguyên liệu thô *</Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Ví dụ: Giấy Kraft Nâu, Decal PP Trắng..."
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea 
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Mô tả chi tiết về loại nguyên liệu thô này, ứng dụng và đặc tính..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="materialType">Loại nguyên liệu chính *</Label>
                <Select value={formData.materialType} onValueChange={(value) => setFormData(prev => ({...prev, materialType: value as MaterialType}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại nguyên liệu chính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paper">Giấy</SelectItem>
                    <SelectItem value="plastic">Nhựa</SelectItem>
                    <SelectItem value="ink">Mực in</SelectItem>
                    <SelectItem value="glue">Keo dán</SelectItem>
                    <SelectItem value="coating">Phủ bóng</SelectItem>
                    <SelectItem value="foil">Kim tuyến</SelectItem>
                    <SelectItem value="ribbon">Dây cột</SelectItem>
                    <SelectItem value="hardware">Phụ kiện</SelectItem>
                    <SelectItem value="packaging">Bao bì</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))}
                />
                <Label htmlFor="isActive">Kích hoạt ngay</Label>
              </div>
            </CardContent>
          </Card>

          {/* Cấu hình */}
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình thông số</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thông số kỹ thuật */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Thông số kỹ thuật cần thiết *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={spec}
                        onChange={(e) => updateSpecification(index, e.target.value)}
                        placeholder="Ví dụ: Định lượng (gsm), Kích thước (cm)..."
                      />
                      {formData.specifications.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeSpecification(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Đơn vị tính */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Đơn vị tính hỗ trợ *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.units.map((unit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={unit}
                        onChange={(e) => updateUnit(index, e.target.value)}
                        placeholder="Ví dụ: tờ, kg, m, cuộn..."
                      />
                      {formData.units.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeUnit(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {formData.name && formData.materialType && (
          <Card>
            <CardHeader>
              <CardTitle>Xem trước</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <Settings className="h-8 w-8 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{formData.name}</h3>
                    {formData.materialType && (
                      <Badge variant="secondary">
                        {getTypeLabel(formData.materialType)}
                      </Badge>
                    )}
                    <Badge variant={formData.isActive ? "outline" : "secondary"}>
                      {formData.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {formData.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Thông số kỹ thuật:</span>
                      <div className="mt-1">
                        {formData.specifications.filter(s => s.trim()).map((spec, i) => (
                          <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Đơn vị tính:</span>
                      <div className="mt-1">
                        {formData.units.filter(u => u.trim()).map((unit, i) => (
                          <Badge key={i} variant="secondary" className="mr-1 mb-1 text-xs">
                            {unit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nút hành động */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/material-types')}>
            Hủy
          </Button>
          <Button type="submit" disabled={!isFormValid}>
            <Save className="h-4 w-4 mr-2" />
            Lưu loại nguyên liệu
          </Button>
        </div>
      </form>
    </div>
  );
}