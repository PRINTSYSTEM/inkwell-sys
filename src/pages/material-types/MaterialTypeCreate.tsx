import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MaterialTypeEntity, CreateMaterialTypeRequest } from '@/Schema/material-type.schema';
import { useCreateMaterialType } from '@/hooks/use-material-type';

export default function MaterialTypeCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<CreateMaterialTypeRequest>({
    code: '',
    name: '',
    description: '',
    displayOrder: 1,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const data = await materialTypeService.getMaterialTypeById(Number(id));
          if (data) {
            setFormData({
              code: data.code || '',
              name: data.name || '',
              description: data.description || '',
              displayOrder: data.displayOrder || 1,
              status: data.status || 'active',
            });
          } else {
            toast({
              title: "Lỗi",
              description: "Không tìm thấy loại vật liệu",
              variant: "destructive",
            });
            navigate('/material-types');
          }
        } catch (error) {
          toast({
            title: "Lỗi", 
            description: "Không thể tải thông tin loại vật liệu",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [id, isEdit, toast, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'Mã vật liệu là bắt buộc';
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.code.trim())) {
      newErrors.code = 'Mã vật liệu phải là 1-10 ký tự in hoa, số';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên loại vật liệu là bắt buộc';
    }

    if (!formData.displayOrder || formData.displayOrder < 0) {
      newErrors.displayOrder = 'Thứ tự hiển thị phải >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      if (isEdit && id) {
        await materialTypeService.updateMaterialType(Number(id), formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật loại vật liệu",
        });
      } else {
        await materialTypeService.createMaterialType(formData);
        toast({
          title: "Thành công",
          description: "Đã tạo loại vật liệu mới",
        });
      }
      
      navigate('/material-types');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof CreateMaterialTypeRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/material-types')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Sửa loại vật liệu' : 'Thêm loại vật liệu mới'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Mã loại vật liệu *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                  placeholder="VD: NM, PVC, PP..."
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">
                  Thứ tự hiển thị *
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => updateFormData('displayOrder', parseInt(e.target.value) || 0)}
                  className={errors.displayOrder ? 'border-red-500' : ''}
                />
                {errors.displayOrder && (
                  <p className="text-sm text-red-600">{errors.displayOrder}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Tên loại vật liệu *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="VD: Nhãn metaline, PVC trong..."
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Trạng thái
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateFormData('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang sử dụng</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Mô tả chi tiết về loại vật liệu này..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/material-types')}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}