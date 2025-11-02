import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Info, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DesignTypeEntity, DesignTypeCreateRequest } from '@/types';
import { designTypesService } from '@/lib/mockData';

export default function DesignTypeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [designType, setDesignType] = useState<DesignTypeEntity | null>(null);
  
  const [formData, setFormData] = useState<DesignTypeCreateRequest>({
    code: '',
    name: '',
    description: '',
    codeFormat: '{customerCode}-{designType}-{number:3}-{date:YYMMDD}',
    isActive: true,
    sortOrder: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (isEdit && id) {
        try {
          setLoading(true);
          const data = await designTypesService.getById(id);
          if (data) {
            setDesignType(data);
            setFormData({
              code: data.code,
              name: data.name,
              description: data.description || '',
              codeFormat: data.codeFormat,
              isActive: data.isActive,
              sortOrder: data.sortOrder,
            });
          } else {
            toast({
              title: "Lỗi",
              description: "Không tìm thấy loại thiết kế",
              variant: "destructive",
            });
            navigate('/design-types');
          }
        } catch (error) {
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin loại thiết kế",
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

    if (!formData.code.trim()) {
      newErrors.code = 'Mã thiết kế là bắt buộc';
    } else if (!/^[A-Z0-9]{1,5}$/.test(formData.code.trim())) {
      newErrors.code = 'Mã thiết kế phải là 1-5 ký tự in hoa, số';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên loại thiết kế là bắt buộc';
    }

    if (!formData.codeFormat.trim()) {
      newErrors.codeFormat = 'Format mã thiết kế là bắt buộc';
    } else if (!formData.codeFormat.includes('{customerCode}') || 
               !formData.codeFormat.includes('{designType}')) {
      newErrors.codeFormat = 'Format phải chứa {customerCode} và {designType}';
    }

    if (formData.sortOrder < 1) {
      newErrors.sortOrder = 'Thứ tự phải lớn hơn 0';
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
        await designTypesService.update(id, formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật loại thiết kế",
        });
      } else {
        await designTypesService.create(formData);
        toast({
          title: "Thành công",
          description: "Đã tạo loại thiết kế mới",
        });
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

  const updateFormData = (field: keyof DesignTypeCreateRequest, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generate preview code
  const generatePreviewCode = () => {
    try {
      if (!formData.code) return '';
      return designTypesService.generateDesignCode(
        formData.code,
        'EXAMPLE',
        1,
        new Date()
      );
    } catch {
      return formData.codeFormat
        .replace('{customerCode}', 'EXAMPLE')
        .replace('{designType}', formData.code)
        .replace('{number:3}', '001')
        .replace('{date:YYMMDD}', '251103');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/design-types')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? 'Chỉnh sửa loại thiết kế' : 'Thêm loại thiết kế mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit 
                ? `Cập nhật thông tin cho: ${designType?.name}` 
                : 'Tạo loại thiết kế và cấu hình format mã thiết kế'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Mã loại thiết kế *</Label>
                    <Input
                      id="code"
                      placeholder="VD: T, H, C..."
                      value={formData.code}
                      onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                      className={errors.code ? 'border-destructive' : ''}
                      maxLength={5}
                    />
                    {errors.code && (
                      <p className="text-sm text-destructive">{errors.code}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      1-5 ký tự in hoa hoặc số
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Thứ tự hiển thị *</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      min="1"
                      value={formData.sortOrder}
                      onChange={(e) => updateFormData('sortOrder', parseInt(e.target.value) || 1)}
                      className={errors.sortOrder ? 'border-destructive' : ''}
                    />
                    {errors.sortOrder && (
                      <p className="text-sm text-destructive">{errors.sortOrder}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Tên loại thiết kế *</Label>
                  <Input
                    id="name"
                    placeholder="VD: Túi giấy, Hộp giấy..."
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về loại thiết kế này..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateFormData('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Kích hoạt</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cấu hình mã thiết kế</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codeFormat">Format mã thiết kế *</Label>
                  <Input
                    id="codeFormat"
                    placeholder="{customerCode}-{designType}-{number:3}-{date:YYMMDD}"
                    value={formData.codeFormat}
                    onChange={(e) => updateFormData('codeFormat', e.target.value)}
                    className={errors.codeFormat ? 'border-destructive' : ''}
                  />
                  {errors.codeFormat && (
                    <p className="text-sm text-destructive">{errors.codeFormat}</p>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Các biến có thể sử dụng:</strong>
                    <br />• <code>{'{customerCode}'}</code> - Mã khách hàng
                    <br />• <code>{'{designType}'}</code> - Mã loại thiết kế
                    <br />• <code>{'{number:3}'}</code> - Số thứ tự (3 chữ số)
                    <br />• <code>{'{date:YYMMDD}'}</code> - Ngày tạo (YYMMDD)
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Xem trước
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.code && (
                  <div className="space-y-2">
                    <Label>Mã loại thiết kế</Label>
                    <Badge variant="outline" className="font-mono">
                      {formData.code}
                    </Badge>
                  </div>
                )}

                {formData.name && (
                  <div className="space-y-2">
                    <Label>Tên</Label>
                    <p className="text-sm">{formData.name}</p>
                  </div>
                )}

                {formData.codeFormat && formData.code && (
                  <div className="space-y-2">
                    <Label>Mã thiết kế mẫu</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm font-mono">
                        {generatePreviewCode()}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Với khách hàng EXAMPLE, thiết kế số 1
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Badge variant={formData.isActive ? "default" : "secondary"}>
                    {formData.isActive ? "Hoạt động" : "Tạm dừng"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}