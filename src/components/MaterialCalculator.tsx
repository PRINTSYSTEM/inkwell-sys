import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, AlertTriangle } from 'lucide-react';
import { mockProductTemplates, productCategories, mockMaterials } from '@/lib/mockData';
import { ProductCategory, ProductTemplate, MaterialRequirement } from '@/types';

interface MaterialCalculatorProps {
  onCalculationComplete?: (results: MaterialCalculationResult[]) => void;
}

interface MaterialCalculationResult extends MaterialRequirement {
  availableStock: number;
  shortage: number;
  stockStatus: 'sufficient' | 'low' | 'insufficient';
}

export default function MaterialCalculator({ onCalculationComplete }: MaterialCalculatorProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(100);
  const [results, setResults] = useState<MaterialCalculationResult[]>([]);

  // Lọc templates theo category
  const availableTemplates = mockProductTemplates.filter(t => 
    !selectedCategory || t.category === selectedCategory
  );

  const handleCalculate = () => {
    const template = mockProductTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Tính toán tỷ lệ từ baseQuantity của template
    const ratio = quantity / template.baseQuantity;

    const calculationResults: MaterialCalculationResult[] = template.materialRequirements.map(req => {
      const material = mockMaterials.find(m => m.id === req.materialId);
      const requiredQuantity = req.quantity * ratio;
      const availableStock = material?.currentStock || 0;
      const shortage = Math.max(0, requiredQuantity - availableStock);
      
      let stockStatus: 'sufficient' | 'low' | 'insufficient' = 'sufficient';
      if (shortage > 0) {
        stockStatus = 'insufficient';
      } else if (availableStock < requiredQuantity * 1.2) { // Cảnh báo nếu chỉ đủ 120%
        stockStatus = 'low';
      }

      return {
        ...req,
        quantity: requiredQuantity,
        estimatedCost: req.estimatedCost * ratio,
        availableStock,
        shortage,
        stockStatus
      };
    });

    setResults(calculationResults);
    onCalculationComplete?.(calculationResults);
  };

  const getTotalCost = () => {
    return results.reduce((sum, result) => sum + result.estimatedCost, 0);
  };

  const getShortageCount = () => {
    return results.filter(r => r.stockStatus === 'insufficient').length;
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'sufficient':
        return <Badge variant="outline" className="text-green-600 border-green-600">Đủ</Badge>;
      case 'low':
        return <Badge variant="secondary">Ít</Badge>;
      case 'insufficient':
        return <Badge variant="destructive">Thiếu</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tính toán nguyên liệu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Loại sản phẩm</Label>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value as ProductCategory);
                setSelectedTemplate(''); // Reset template khi đổi category
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Mẫu sản phẩm</Label>
              <Select 
                value={selectedTemplate} 
                onValueChange={setSelectedTemplate}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mẫu sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Số lượng</Label>
              <Input 
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Nhập số lượng"
                min={1}
              />
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={!selectedTemplate || !quantity}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Tính toán nguyên liệu
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          {/* Tóm tắt */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                    <p className="text-xl font-bold text-blue-600">
                      {getTotalCost().toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nguyên liệu thiếu</p>
                    <p className="text-xl font-bold text-orange-600">
                      {getShortageCount()} / {results.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calculator className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số lượng sản xuất</p>
                    <p className="text-xl font-bold text-green-600">
                      {quantity.toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chi tiết nguyên liệu */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết nguyên liệu cần thiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{result.materialName}</h4>
                          <Badge variant="outline">{result.materialCode}</Badge>
                          {getStockStatusBadge(result.stockStatus)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cần:</span>
                            <span className="ml-2 font-medium">
                              {result.quantity.toFixed(2)} {result.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tồn kho:</span>
                            <span className="ml-2 font-medium">
                              {result.availableStock} {result.unit}
                            </span>
                          </div>
                          {result.shortage > 0 && (
                            <div>
                              <span className="text-muted-foreground">Thiếu:</span>
                              <span className="ml-2 font-medium text-red-600">
                                {result.shortage.toFixed(2)} {result.unit}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Chi phí:</span>
                            <span className="ml-2 font-medium">
                              {result.estimatedCost.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}