import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, UserPlus, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCustomers } from '@/lib/mockData';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateCustomerForm {
  companyName: string;
  representativeName: string;
  taxCode: string;
  phone: string;
  address: string;
}

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerForm>({
    companyName: '',
    representativeName: '',
    taxCode: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState<Partial<CreateCustomerForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Tạo tên viết tắt từ họ tên người đại diện
  const generateShortName = (fullName: string): string => {
    if (!fullName.trim()) return '';
    
    return fullName
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  // Tạo mã khách hàng preview
  const generatePreviewCode = (representativeName: string): string => {
    if (!representativeName.trim()) return '';
    
    const shortName = generateShortName(representativeName);
    
    // Tìm STT tiếp theo
    const existingNumbers = mockCustomers
      .map(c => c.code)
      .map(code => {
        const match = code.match(/^(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => b - a);
    
    const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
    return `${nextNumber.toString().padStart(4, '0')}${shortName}`;
  };

  const handleInputChange = (field: keyof CreateCustomerForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Cập nhật preview mã khách hàng khi thay đổi tên người đại diện
    if (field === 'representativeName') {
      setGeneratedCode(generatePreviewCode(value));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateCustomerForm> = {};

    if (!form.representativeName.trim()) {
      newErrors.representativeName = 'Tên người đại diện là bắt buộc';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(form.phone)) {
      newErrors.phone = 'Số điện thoại không đúng định dạng';
    }

    if (!form.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }

    if (form.taxCode && !/^[0-9]{10}$/.test(form.taxCode)) {
      newErrors.taxCode = 'Mã số thuế phải có 10 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCustomerCode = () => {
    if (!form.representativeName.trim()) {
      alert('Vui lòng nhập tên người đại diện trước');
      return;
    }
    
    const previewCode = generatePreviewCode(form.representativeName);
    setGeneratedCode(previewCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCustomer = {
        id: `c${Date.now()}`,
        code: generatedCode || generatePreviewCode(form.representativeName),
        companyName: form.companyName || undefined,
        representativeName: form.representativeName,
        taxCode: form.taxCode || undefined,
        phone: form.phone,
        address: form.address,
        folder: generatedCode || generatePreviewCode(form.representativeName),
        createdAt: new Date().toISOString(),
        createdBy: 'Trần Thị CSKH' // Trong thực tế sẽ lấy từ context user
      };
      
      console.log('Tạo khách hàng mới:', newCustomer);
      
      setSubmitSuccess(true);
      
      // Redirect sau 2 giây
      setTimeout(() => {
        navigate('/customers');
      }, 2000);
      
    } catch (error) {
      console.error('Lỗi tạo khách hàng:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  if (submitSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/customers')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tạo khách hàng thành công!</h3>
            <p className="text-muted-foreground mb-4">
              Khách hàng <strong>{form.representativeName}</strong> đã được tạo với mã <strong>{generatedCode || generatePreviewCode(form.representativeName)}</strong>
            </p>
            <p className="text-sm text-muted-foreground">Đang chuyển về danh sách khách hàng...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thêm khách hàng mới</h1>
          <p className="text-muted-foreground mt-1">Nhập thông tin khách hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="representativeName">
                      Tên người đại diện <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="representativeName"
                        value={form.representativeName}
                        onChange={(e) => handleInputChange('representativeName', e.target.value)}
                        placeholder="VD: Nguyễn Minh Phúc"
                        className={errors.representativeName ? 'border-red-500' : ''}
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={generateCustomerCode}
                        className="whitespace-nowrap"
                        disabled={!form.representativeName.trim()}
                      >
                        Preview
                      </Button>
                    </div>
                    {errors.representativeName && (
                      <p className="text-sm text-red-500">{errors.representativeName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tên người đại diện sẽ được dùng để tạo mã khách hàng
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mã khách hàng (tự động)</Label>
                    <div className="p-2 bg-muted rounded-md border">
                      <span className="font-mono text-sm">
                        {generatedCode || (form.representativeName ? generatePreviewCode(form.representativeName) : 'Nhập tên người đại diện để xem preview')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: [STT][Tên viết tắt] - VD: 0001MP (Minh Phúc)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Tên công ty</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="VD: Công ty TNHH ABC (không bắt buộc)"
                      className={errors.companyName ? 'border-red-500' : ''}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-500">{errors.companyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Có thể để trống nếu là cá nhân hoặc doanh nghiệp tư nhân
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxCode">Mã số thuế</Label>
                    <Input
                      id="taxCode"
                      value={form.taxCode}
                      onChange={(e) => handleInputChange('taxCode', e.target.value)}
                      placeholder="VD: 0123456789 (không bắt buộc)"
                      className={errors.taxCode ? 'border-red-500' : ''}
                    />
                    {errors.taxCode && (
                      <p className="text-sm text-red-500">{errors.taxCode}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="VD: 0901234567"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ đầy đủ"
                    rows={3}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info & Actions */}
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Lưu ý:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Tên người đại diện là bắt buộc để tạo mã khách hàng</li>
                  <li>Mã khách hàng tự động theo format: [STT 4 chữ số][Tên viết tắt]</li>
                  <li>Tên viết tắt được tạo từ chữ cái đầu của họ tên</li>
                  <li>Tên công ty không bắt buộc (cá nhân hoặc doanh nghiệp tư nhân)</li>
                  <li>Số điện thoại phải đúng định dạng Việt Nam</li>
                  <li>Mã số thuế có 10 chữ số (không bắt buộc)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tên người đại diện</p>
                  <p className="font-medium">{form.representativeName || 'Chưa nhập'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã khách hàng (preview)</p>
                  <p className="font-medium font-mono">{generatedCode || (form.representativeName ? generatePreviewCode(form.representativeName) : 'Chưa có')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tên công ty</p>
                  <p className="font-medium">{form.companyName || 'Không có (cá nhân)'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{form.phone || 'Chưa nhập'}</p>
                </div>
                {form.taxCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mã số thuế</p>
                    <p className="font-medium font-mono">{form.taxCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Đang tạo...' : 'Tạo khách hàng'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}