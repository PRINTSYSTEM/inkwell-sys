import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Package, History, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { mockMaterials, mockStockTransactions } from '@/lib/mockData';
import { Material } from '@/types';

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const material = mockMaterials.find(m => m.id === id);
  
  if (!material) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Không tìm thấy nguyên liệu</h3>
        <Button onClick={() => navigate('/inventory')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Lấy lịch sử giao dịch của nguyên liệu này
  const materialTransactions = mockStockTransactions
    .filter(t => t.materialId === id)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  const getStockStatus = (material: Material) => {
    if (material.currentStock <= material.minStock * 0.5) return 'critical';
    if (material.currentStock <= material.minStock) return 'low';
    return 'normal';
  };

  const getStockBadge = (material: Material) => {
    const status = getStockStatus(material);
    if (status === 'critical') return <Badge variant="destructive">Rất thấp</Badge>;
    if (status === 'low') return <Badge variant="secondary">Thấp</Badge>;
    return <Badge variant="outline">Bình thường</Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'import': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'export': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjust': return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'import': return 'text-green-600';
      case 'export': return 'text-red-600';
      case 'adjust': return 'text-blue-600';
      default: return 'text-foreground';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'import': return 'Nhập kho';
      case 'export': return 'Xuất kho';
      case 'adjust': return 'Điều chỉnh';
      default: return type;
    }
  };

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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">{material.name}</h1>
              <Badge variant="outline">{material.code}</Badge>
              {getStockBadge(material)}
            </div>
            <p className="text-muted-foreground mt-1">{material.category} • {material.specification}</p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin nguyên liệu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mã nguyên liệu</label>
                    <p className="text-sm mt-1">{material.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loại</label>
                    <p className="text-sm mt-1 capitalize">{material.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phân loại</label>
                    <p className="text-sm mt-1">{material.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Đơn vị</label>
                    <p className="text-sm mt-1">{material.unit}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Thông số kỹ thuật</label>
                  <p className="text-sm mt-1">{material.specification}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nhà cung cấp</label>
                  <p className="text-sm mt-1">{material.supplier}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vị trí kho</label>
                  <p className="text-sm mt-1">{material.location}</p>
                </div>
                {material.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ghi chú</label>
                    <p className="text-sm mt-1">{material.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin kho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tồn kho hiện tại</label>
                    <p className="text-2xl font-bold mt-1">
                      {material.currentStock} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mức tối thiểu</label>
                    <p className="text-2xl font-bold mt-1 text-orange-600">
                      {material.minStock} {material.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Đơn giá</label>
                    <p className="text-xl font-bold mt-1">
                      {material.unitPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Giá trị tồn kho</label>
                    <p className="text-xl font-bold mt-1 text-green-600">
                      {(material.currentStock * material.unitPrice).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
                
                {/* Progress bar cho tồn kho */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mức độ tồn kho</label>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>0</span>
                      <span>Tối thiểu: {material.minStock}</span>
                      <span>Hiện tại: {material.currentStock}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          material.currentStock <= material.minStock * 0.5 
                            ? 'bg-red-500' 
                            : material.currentStock <= material.minStock 
                              ? 'bg-orange-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (material.currentStock / (material.minStock * 2)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              {materialTransactions.length > 0 ? (
                <div className="space-y-4">
                  {materialTransactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                                {getTransactionLabel(transaction.type)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(transaction.performedAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {transaction.reason}
                            </p>
                            {transaction.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {transaction.notes}
                              </p>
                            )}
                            <p className="text-sm mt-2">
                              Thực hiện bởi: <span className="font-medium">{transaction.performedBy}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'export' || (transaction.type === 'adjust' && transaction.quantity < 0) ? '-' : '+'}
                            {Math.abs(transaction.quantity)} {transaction.unit}
                          </p>
                          {transaction.totalValue && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.totalValue.toLocaleString('vi-VN')}đ
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có giao dịch</h3>
                  <p className="text-muted-foreground">Lịch sử giao dịch sẽ hiển thị ở đây</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}