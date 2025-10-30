import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { MaterialType } from '@/types';

export default function CreateMaterial() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '' as MaterialType | '',
    category: '',
    specification: '',
    unit: '',
    unitPrice: '',
    supplier: '',
    minStock: '',
    currentStock: '',
    location: '',
    notes: ''
  });

  // Tự động tạo mã nguyên liệu
  const generateMaterialCode = (type: MaterialType) => {
    const prefix = {
      paper: 'MAT',
      plastic: 'PLT', 
      ink: 'INK',
      glue: 'GLU',
      coating: 'COT',
      foil: 'FOL',
      ribbon: 'RIB',
      hardware: 'HRD',
      packaging: 'PKG'
    };
    
    const typePrefix = prefix[type] || 'MAT';
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${typePrefix}${randomNum}`;
  };

  const handleTypeChange = (type: MaterialType) => {
    setFormData(prev => ({
      ...prev,
      type,
      code: generateMaterialCode(type)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to create material
    
    // Simulate success and redirect
    navigate('/inventory');
  };

  const isFormValid = formData.code && formData.name && formData.type && 
                    formData.category && formData.specification && formData.unit &&
                    formData.unitPrice && formData.supplier && formData.minStock &&
                    formData.currentStock && formData.location;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thêm nguyên liệu mới</h1>
            <p className="text-muted-foreground mt-1">Nhập thông tin nguyên liệu vào kho</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Loại nguyên liệu *</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
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
                <div>
                  <Label htmlFor="code">Mã nguyên liệu *</Label>
                  <Input 
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                    placeholder="Mã tự động tạo"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Tên nguyên liệu *</Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Ví dụ: Giấy Kraft nâu"
                />
              </div>

              <div>
                <Label htmlFor="category">Phân loại chi tiết *</Label>
                <Input 
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                  placeholder="Ví dụ: Giấy kraft, Decal PP, Mực UV..."
                />
              </div>

              <div>
                <Label htmlFor="specification">Thông số kỹ thuật *</Label>
                <Input 
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData(prev => ({...prev, specification: e.target.value}))}
                  placeholder="Ví dụ: 250gsm, khổ 65x92cm"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Nhà cung cấp *</Label>
                <Input 
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({...prev, supplier: e.target.value}))}
                  placeholder="Tên nhà cung cấp"
                />
              </div>
            </CardContent>
          </Card>

          {/* Thông tin kho */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Đơn vị tính *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tờ">Tờ</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="lít">Lít</SelectItem>
                      <SelectItem value="m">Mét</SelectItem>
                      <SelectItem value="m2">Mét vuông</SelectItem>
                      <SelectItem value="cuộn">Cuộn</SelectItem>
                      <SelectItem value="hộp">Hộp</SelectItem>
                      <SelectItem value="thùng">Thùng</SelectItem>
                      <SelectItem value="cái">Cái</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unitPrice">Đơn giá (VNĐ) *</Label>
                  <Input 
                    id="unitPrice"
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({...prev, unitPrice: e.target.value}))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Mức tồn kho tối thiểu *</Label>
                  <Input 
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({...prev, minStock: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="currentStock">Tồn kho hiện tại *</Label>
                  <Input 
                    id="currentStock"
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData(prev => ({...prev, currentStock: e.target.value}))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Vị trí trong kho *</Label>
                <Input 
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                  placeholder="Ví dụ: Kho A-01, Kệ B-02"
                />
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea 
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Ghi chú thêm về nguyên liệu..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {formData.name && formData.code && (
          <Card>
            <CardHeader>
              <CardTitle>Xem trước</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{formData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.code} • {formData.category}
                  </p>
                  {formData.unitPrice && formData.unit && (
                    <p className="text-sm text-muted-foreground">
                      {Number(formData.unitPrice).toLocaleString('vi-VN')}đ/{formData.unit}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nút hành động */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory')}>
            Hủy
          </Button>
          <Button type="submit" disabled={!isFormValid}>
            <Save className="h-4 w-4 mr-2" />
            Lưu nguyên liệu
          </Button>
        </div>
      </form>
    </div>
  );
}