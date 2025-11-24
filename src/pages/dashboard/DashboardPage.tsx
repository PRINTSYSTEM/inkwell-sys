import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Package, Activity } from 'lucide-react';
import { payments } from '@/lib/mockData';
import { useOrders } from '@/hooks/use-order';
import { useCustomers } from '@/hooks/use-customer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

export default function Dashboard() {
    // Lấy danh sách khách hàng thật
    const { data: customersData, isLoading: loadingCustomers } = useCustomers({ pageSize: 100 });
    const customers = customersData?.items || [];
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Lấy danh sách đơn hàng thật
  const { data: ordersData, isLoading: loadingOrders } = useOrders({ pageSize: 100 });
  const orders = ordersData?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Chào mừng, {user?.fullName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Từ các đơn hàng đã thanh toán</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOrders ? '...' : orders.length}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số đơn hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCustomers ? '...' : customers.length}
            </div>
            <p className="text-xs text-muted-foreground">Khách hàng đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Tác vụ hôm nay</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => navigate('/orders/create')} className="w-full justify-start">
              Tạo đơn hàng mới
            </Button>
            <Button onClick={() => navigate('/customers/create')} variant="outline" className="w-full justify-start">
              Thêm khách hàng
            </Button>
            <Button onClick={() => navigate('/designs')} variant="outline" className="w-full justify-start">
              Xem thiết kế
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bạn đang đăng nhập với quyền: <strong>{user?.role}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Phiên bản: 1.0.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
