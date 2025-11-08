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
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'import': return 'text-green-600';
      case 'export': return 'text-red-600';
      case 'adjust': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{material.name}</h1>
            <p className="text-muted-foreground">Mã: {material.code}</p>
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
          <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Material Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tên nguyên liệu</p>
                  <p className="font-medium">{material.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã</p>
                  <p className="font-medium">{material.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Danh mục</p>
                  <p className="font-medium">{material.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đơn vị</p>
                  <p className="font-medium">{material.unit}</p>
                </div>
                {material.supplier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                    <p className="font-medium">{material.supplier}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tồn kho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái</span>
                  {getStockBadge(material)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng hiện tại</p>
                  <p className="text-2xl font-bold">{material.currentStock} {material.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tồn kho tối thiểu</p>
                  <p className="font-medium">{material.minStock} {material.unit}</p>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Giá trị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.unitPrice && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Giá nhập trung bình</p>
                      <p className="text-xl font-bold">
                        {material.unitPrice.toLocaleString('vi-VN')}đ/{material.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng giá trị tồn kho</p>
                      <p className="font-medium">
                        {(material.currentStock * material.unitPrice).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Giao dịch gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {materialTransactions.length > 0 ? (
                <div className="space-y-3">
                  {materialTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.type === 'import' ? 'Nhập kho' : transaction.type === 'export' ? 'Xuất kho' : 'Điều chỉnh'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.performedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
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

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              {materialTransactions.length > 0 ? (
                <div className="space-y-3">
                  {materialTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.type === 'import' ? 'Nhập kho' : transaction.type === 'export' ? 'Xuất kho' : 'Điều chỉnh'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.performedAt).toLocaleString('vi-VN')} - {transaction.performedBy}
                          </p>
                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
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