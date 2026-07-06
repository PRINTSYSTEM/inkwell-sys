import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Package, History, TrendingUp, TrendingDown, RotateCcw, Loader2 } from 'lucide-react';
import { useMaterial, useMaterialHistory } from '@/hooks/use-material';

const TXN_TYPE_LABELS: Record<string, string> = {
  stock_in: 'Nhập kho',
  stock_out: 'Xuất kho',
  return: 'Trả hàng',
  adjustment: 'Điều chỉnh',
  cut_in: 'Nhập từ cắt',
  cut_out: 'Xuất cắt',
  waste: 'Hao hụt',
  return_vendor: 'Trả NCC',
  transfer: 'Chuyển kho',
};

const TXN_TYPE_COLORS: Record<string, string> = {
  stock_in: 'text-green-600',
  stock_out: 'text-red-600',
  return: 'text-orange-600',
  adjustment: 'text-blue-600',
  cut_in: 'text-teal-600',
  cut_out: 'text-red-600',
  waste: 'text-gray-600',
  return_vendor: 'text-purple-600',
  transfer: 'text-cyan-600',
};

function getTxnIcon(type: string) {
  if (type === 'stock_in' || type === 'cut_in' || type === 'return') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (type === 'stock_out' || type === 'cut_out') return <TrendingDown className="h-4 w-4 text-red-600" />;
  if (type === 'adjustment' || type === 'transfer') return <RotateCcw className="h-4 w-4 text-blue-600" />;
  return <Package className="h-4 w-4 text-gray-600" />;
}

export default function InventoryDetail() {
  const { id: idStr } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = idStr ? parseInt(idStr) : null;

  const { data: material, isLoading: loadingMat } = useMaterial(id);
  const { data: historyData, isLoading: loadingHist } = useMaterialHistory(id);

  const transactions = useMemo(() => {
    if (!historyData?.items) return [];
    return [...historyData.items].sort(
      (a: any, b: any) => new Date(b.transactionDate || b.createdAt).getTime() - new Date(a.transactionDate || a.createdAt).getTime()
    );
  }, [historyData]);

  if (loadingMat) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  const stockStatus = () => {
    const stock = material.currentStock ?? 0;
    const min = material.minStock ?? 0;
    if (stock <= min * 0.5) return 'critical';
    if (stock <= min) return 'low';
    return 'normal';
  };

  const stockBadge = () => {
    const s = stockStatus();
    if (s === 'critical') return <Badge variant="destructive">Rất thấp</Badge>;
    if (s === 'low') return <Badge variant="secondary">Thấp</Badge>;
    return <Badge variant="outline">Bình thường</Badge>;
  };

  const renderTransaction = (tx: any, idx: number) => {
    const type = tx.transactionType ?? tx.type ?? 'adjustment';
    const qty = tx.quantity ?? 0;
    const isDecrease = type === 'stock_out' || type === 'cut_out' || type === 'waste' || type === 'return_vendor';
    const label = TXN_TYPE_LABELS[type] ?? type;
    const colorClass = TXN_TYPE_COLORS[type] ?? 'text-gray-600';
    const dateStr = tx.transactionDate ?? tx.createdAt;

    return (
      <div key={tx.id ?? idx} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          {getTxnIcon(type)}
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
              {dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '—'}
            </p>
            {tx.notes && <p className="text-sm text-muted-foreground mt-1">{tx.notes}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className={`font-medium ${colorClass}`}>
            {isDecrease ? '-' : '+'}{Math.abs(qty).toLocaleString('vi-VN')} {tx.unit ?? material.unit ?? ''}
          </p>
          {tx.totalPrice != null && (
            <p className="text-sm text-muted-foreground">
              {tx.totalPrice.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>
      </div>
    );
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
                  <p className="text-sm text-muted-foreground">Loại</p>
                  <p className="font-medium">{material.materialTypeName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đơn vị</p>
                  <p className="font-medium">{material.unit ?? '—'}</p>
                </div>
                {material.vendorName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                    <p className="font-medium">{material.vendorName}</p>
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
                  {stockBadge()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng hiện tại</p>
                  <p className="text-2xl font-bold">{material.currentStock ?? 0} {material.unit ?? ''}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tồn kho tối thiểu</p>
                  <p className="font-medium">{material.minStock ?? 0} {material.unit ?? ''}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Giá trị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(material.unitPrice ?? 0) > 0 && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Giá nhập trung bình</p>
                      <p className="text-xl font-bold">
                        {(material.unitPrice ?? 0).toLocaleString('vi-VN')}đ/{material.unit ?? ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng giá trị tồn kho</p>
                      <p className="font-medium">
                        {((material.currentStock ?? 0) * (material.unitPrice ?? 0)).toLocaleString('vi-VN')}đ
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
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx: any, idx: number) => renderTransaction(tx, idx))}
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
              {loadingHist ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx: any, idx: number) => renderTransaction(tx, idx))}
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
