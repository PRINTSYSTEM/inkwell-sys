import React, { useEffect, useState } from 'react';
import { MaterialService } from '@/services/materialService';
import { Material } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MaterialServiceTest: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testMaterialService = async () => {
      try {
        setLoading(true);
        
        // Test getting materials with pagination
        const materialsResponse = await MaterialService.getMaterials({
          page: 1,
          pageSize: 5,
          sortBy: 'currentStock',
          sortOrder: 'asc'
        });
        
        console.log('Materials response:', materialsResponse);
        setMaterials(materialsResponse.data);
        
        // Test getting low stock materials
        const lowStock = await MaterialService.getLowStockMaterials();
        console.log('Low stock materials:', lowStock);
        setLowStockMaterials(lowStock);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error testing material service:', err);
      } finally {
        setLoading(false);
      }
    };

    testMaterialService();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Đang tải dữ liệu Material Service...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-red-500">Lỗi: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>📋 Material Service Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Top 5 Materials (sorted by stock - low to high):
              </h3>
              <div className="space-y-2">
                {materials.map(material => (
                  <div key={material.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <strong>{material.name}</strong>
                      <span className="text-gray-500 ml-2">({material.code})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={material.currentStock <= material.minStock ? 'destructive' : 'secondary'}>
                        Stock: {material.currentStock}/{material.minStock}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {material.unitPrice.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                ⚠️ Low Stock Materials ({lowStockMaterials.length}):
              </h3>
              {lowStockMaterials.length > 0 ? (
                <div className="space-y-2">
                  {lowStockMaterials.map(material => (
                    <div key={material.id} className="flex justify-between items-center p-3 border border-red-200 rounded bg-red-50">
                      <div>
                        <strong className="text-red-700">{material.name}</strong>
                        <span className="text-gray-600 ml-2">({material.code})</span>
                      </div>
                      <Badge variant="destructive">
                        {material.currentStock} ≤ {material.minStock}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-green-600 p-3 border border-green-200 rounded bg-green-50">
                  ✅ Tất cả materials đều có đủ tồn kho
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};