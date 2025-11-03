import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DesignCodeGenerator as CodeGenerator, 
  designCodeTemplates 
} from '@/services/designCodeService';
import { DesignCodeTemplate, GeneratedDesignCode } from '@/types/design-code';

export default function DesignCodeGeneratorComponent() {
  const [selectedTemplate, setSelectedTemplate] = useState<DesignCodeTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedCode, setGeneratedCode] = useState<GeneratedDesignCode | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (designCodeTemplates.length > 0) {
      setSelectedTemplate(designCodeTemplates[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      // Reset form values and set defaults
      const defaults: Record<string, string> = {};
      selectedTemplate.fields.forEach(field => {
        if (field.defaultValue) {
          defaults[field.key] = field.defaultValue;
        }
      });
      setFormValues(defaults);
      setGeneratedCode(null);
      setErrors([]);
    }
  }, [selectedTemplate]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateCode = () => {
    if (!selectedTemplate) return;

    const validationErrors = CodeGenerator.validateFields(selectedTemplate, formValues);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const result = CodeGenerator.generateCode(selectedTemplate, formValues);
      setGeneratedCode(result);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã sao chép mã thiết kế!');
    } catch (err) {
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  };

  const previewCode = () => {
    if (!selectedTemplate) return;
    const result = CodeGenerator.generateCode(selectedTemplate, formValues);
    return result.code;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tạo mã thiết kế</h1>
          <p className="text-muted-foreground">
            Tạo mã cấu trúc chuẩn cho các bảng thiết kế gửi khách hàng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection & Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chọn loại thiết kế</CardTitle>
              <CardDescription>
                Chọn template phù hợp với loại sản phẩm thiết kế
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select 
                    value={selectedTemplate?.id || ''} 
                    onValueChange={(value) => {
                      const template = designCodeTemplates.find(t => t.id === value);
                      setSelectedTemplate(template || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {designCodeTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Ví dụ:</p>
                      <code className="text-sm">{selectedTemplate.example}</code>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin thiết kế</CardTitle>
                <CardDescription>
                  Điền thông tin chi tiết để tạo mã thiết kế
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTemplate.fields.map(field => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select
                          value={formValues[field.key] || ''}
                          onValueChange={(value) => handleFieldChange(field.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Chọn ${field.label.toLowerCase()}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'date' ? (
                        <Input
                          id={field.key}
                          type="date"
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        />
                      ) : field.type === 'auto' ? (
                        <Input
                          id={field.key}
                          value={formValues[field.key] || ''}
                          disabled
                          placeholder="Tự động tạo"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}

                  {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Vui lòng kiểm tra lại:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={generateCode} className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tạo mã thiết kế
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const preview = previewCode();
                      toast.info(`Preview: ${preview}`);
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mã thiết kế đã tạo</CardTitle>
              <CardDescription>
                Sao chép mã này để sử dụng trong thiết kế
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedCode ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">Mã thiết kế:</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedCode.code)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Sao chép
                      </Button>
                    </div>
                    <code className="text-sm font-mono break-all">
                      {generatedCode.code}
                    </code>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Tạo lúc: {generatedCode.generatedAt.toLocaleString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có mã thiết kế nào được tạo</p>
                  <p className="text-sm">Điền thông tin và nhấn "Tạo mã thiết kế"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Codes History */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử mã đã tạo</CardTitle>
              <CardDescription>
                Các mã thiết kế đã tạo gần đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-4">
                <p className="text-sm">Tính năng đang phát triển</p>
                <p className="text-xs">Sẽ hiển thị lịch sử các mã đã tạo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}