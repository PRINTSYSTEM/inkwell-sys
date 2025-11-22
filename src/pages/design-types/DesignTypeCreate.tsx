import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DesignTypeEntity, CreateDesignTypeRequest } from '@/Schema/design-type.schema';
import { useCreateDesignType, useDesignType, useUpdateDesignType } from '@/hooks/use-material-type';

export default function DesignTypeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const updateDesignType = useUpdateDesignType();
  const createDesignType = useCreateDesignType();
  const designTypeId = isEdit ? Number(id) : undefined;
  const { data: designType, isLoading: loading } = useDesignType(designTypeId!, isEdit);
  const [formData, setFormData] = useState<CreateDesignTypeRequest>({
    code: '',
    name: '',
    description: '',
    displayOrder: 1,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && designType) {
      setFormData({
        code: designType.code,
        name: designType.name,
        description: designType.description || '',
        displayOrder: designType.displayOrder,
        status: designType.status,
      });
    }
  }, [isEdit, designType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'Mã thiết kế là bắt buộc';
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.code.trim())) {
      newErrors.code = 'Mã thiết kế phải là 1-10 ký tự in hoa, số';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên loại thiết kế là bắt buộc';
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
        await updateDesignType.mutateAsync({ id: Number(id), data: formData });
        toast({
          title: "Thành công",
          description: "Đã cập nhật loại thiết kế",
        });
        navigate('/design-types');
      } else {
        await createDesignType.mutateAsync(formData);
        toast({
          title: "Thành công",
          description: "Đã tạo loại thiết kế mới",
        });
        navigate('/design-types');
      }
      
      navigate('/design-types');
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

  const updateFormData = (field: keyof CreateDesignTypeRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
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
            onClick={() => navigate('/design-types')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Sửa loại thiết kế' : 'Thêm loại thiết kế mới'}
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
                  Mã loại thiết kế *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                  placeholder="VD: T, H, C..."
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code}</p>
                )}
                <p className="text-xs text-gray-500">
                  1-10 ký tự in hoa hoặc số
                </p>
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
                Tên loại thiết kế *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="VD: Túi giấy, Hộp giấy, Catalog..."
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
                  <SelectItem value="active">Hoạt động</SelectItem>
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
                placeholder="Mô tả chi tiết về loại thiết kế này..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {formData.name && (
          <Card>
            <CardHeader>
              <CardTitle>Xem trước</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{formData.name}</p>
                  <p className="text-sm text-gray-600">Mã: {formData.code}</p>
                  {formData.description && (
                    <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={formData.status === 'active' ? "default" : "secondary"}>
                    {formData.status === 'active' ? "Hoạt động" : "Tạm dừng"}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">
                    Thứ tự: {formData.displayOrder}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/design-types')}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}