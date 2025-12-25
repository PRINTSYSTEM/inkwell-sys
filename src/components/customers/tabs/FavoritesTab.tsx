import { Layers, Package, Hash, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerFavoriteStats } from '@/hooks/use-customer';

interface FavoritesTabProps {
  customerId: number;
  isActive?: boolean;
}

export function FavoritesTab({ customerId, isActive = true }: FavoritesTabProps) {
  const { data: stats, isLoading, totalOrders } = useCustomerFavoriteStats(customerId, isActive);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="py-3 px-4">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || totalOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Sparkles className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">Chưa có dữ liệu thống kê</p>
        <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi khách hàng có đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top Design Types */}
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top Loại thiết kế</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {stats.topDesignTypes.length > 0 ? (
              stats.topDesignTypes.map((item, index) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span className="truncate max-w-[120px]">{item.name}</span>
                    </span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-1.5" />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Top Material Types */}
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top Chất liệu</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {stats.topMaterialTypes.length > 0 ? (
              stats.topMaterialTypes.map((item, index) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span className="truncate max-w-[120px]">{item.name}</span>
                    </span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-1.5" />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Common Quantities */}
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Số lượng thường đặt</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.commonQuantities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.commonQuantities.map((qty) => (
                  <Badge key={qty} variant="secondary" className="text-sm px-3 py-1">
                    {qty.toLocaleString('vi-VN')}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Info */}
      <Card className="border-dashed">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tổng đơn hàng đã phân tích:</span>
            <span className="font-medium">{totalOrders} đơn</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
