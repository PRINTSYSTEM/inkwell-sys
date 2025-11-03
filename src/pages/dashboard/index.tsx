import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Activity,
  Layers
} from 'lucide-react';
import { orders, customers, payments, productions } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/lib/permissions';
import { MaterialServiceTest } from '@/components/MaterialServiceTest';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { permissions, canAccessModule } = usePermissions(user?.role || 'operator');
  
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order => order.status === 'new').length;
  const depositedOrders = orders.filter(order => order.status === 'deposited').length; // Đơn chờ bình bài
  
  const overduePayments = payments.filter(payment => 
    payment.status === 'overdue'
  ).length;
  
  const productionInProgress = productions.filter(prod => 
    prod.status === 'in_progress'
  ).length;

  const monthlyGrowth = 12.5;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Role-specific welcome message
  const getRoleWelcome = () => {
    switch (user?.role) {
      case 'admin':
        return 'Quản trị viên - Toàn quyền hệ thống';
      case 'shareholder':
        return 'Cổ đông - Theo dõi tổng quan (View Only)';
      case 'designer_manager':
        return 'Trưởng phòng Thiết kế & CSKH - Quản lý khách hàng và thiết kế';
      case 'customer_service':
        return 'Chăm sóc khách hàng - Tư vấn và hỗ trợ';
      case 'accountant':
        return 'Kế toán - Quản lý tài chính (Không thấy thông tin thiết kế)';
      case 'designer':
        return 'Thiết kế - Sáng tạo nội dung (Không thấy giá tiền)';
      case 'prepress':
        return 'Bình bài - Chuẩn bị in ấn (Không biết khách hàng)';
      case 'production_manager':
        return 'Quản lý sản xuất - Điều phối quy trình';
      case 'operator':
        return 'Vận hành máy in - Thực hiện sản xuất';
      default:
        return 'Hệ thống quản lý in ấn';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Stats Cards Row - Đặt lên đầu trang */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {permissions.canViewFinancials && (
          <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={() => navigate('/accounting')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Tổng doanh thu</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatCurrency(totalRevenue)}</div>
              <p className='text-xs text-muted-foreground'>
                <span className='text-green-600 flex items-center'>
                  <TrendingUp className='mr-1 h-3 w-3' />
                  +{monthlyGrowth}%
                </span>
                so với tháng trước
              </p>
            </CardContent>
          </Card>
        )}

        {canAccessModule('orders') && (
          <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={() => navigate('/orders')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {user?.role === 'designer' ? 'Thiết kế của tôi' : 'Đơn hàng'}
              </CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalOrders}</div>
              <p className='text-xs text-muted-foreground'>
                {completedOrders} hoàn thành, {pendingOrders} chờ xử lý
              </p>
              <Progress value={(completedOrders / totalOrders) * 100} className='mt-2' />
            </CardContent>
          </Card>
        )}

        {canAccessModule('customers') && (
          <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={() => navigate('/customers')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Khách hàng</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalCustomers}</div>
              <p className='text-xs text-muted-foreground'>
                +2 khách hàng mới tháng này
              </p>
            </CardContent>
          </Card>
        )}

        {/* Card cho bình bài */}
        {user?.role === 'prepress' && (
          <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={() => navigate('/prepress')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Đơn chờ bình bài</CardTitle>
              <Layers className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{depositedOrders}</div>
              <p className='text-xs text-muted-foreground'>
                đơn đã đặt cọc
              </p>
            </CardContent>
          </Card>
        )}

        {canAccessModule('production') && (
          <Card className='cursor-pointer hover:shadow-md transition-shadow' onClick={() => navigate('/production')}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {user?.role === 'operator' ? 'Công việc của tôi' : 'Sản xuất'}
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{productionInProgress}</div>
              <p className='text-xs text-muted-foreground'>
                đang sản xuất
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Header và Welcome Message */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Dashboard</h1>
          <p className='text-muted-foreground'>
            {getRoleWelcome()}
          </p>
        </div>
        {canAccessModule('accounting') && (
          <Button onClick={() => navigate('/accounting')}>
            <Calendar className='mr-2 h-4 w-4' />
            Xuất báo cáo
          </Button>
        )}
      </div>

      {permissions.canViewFinancials && overduePayments > 0 && (
        <Alert className='border-red-200'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong className='text-red-600'>Cảnh báo thanh toán:</strong> Có {overduePayments} thanh toán quá hạn cần xử lý
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {canAccessModule('orders') && (
              <div className='flex items-center space-x-4'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Package className='h-4 w-4 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Đơn hàng mới được tạo</p>
                  <p className='text-xs text-muted-foreground'>2 phút trước</p>
                </div>
              </div>
            )}
            
            {canAccessModule('production') && (
              <div className='flex items-center space-x-4'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>
                    {user?.role === 'operator' ? 'Hoàn thành công đoạn in' : 'Sản xuất hoàn thành'}
                  </p>
                  <p className='text-xs text-muted-foreground'>15 phút trước</p>
                </div>
              </div>
            )}

            {permissions.canViewFinancials && (
              <div className='flex items-center space-x-4'>
                <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <Clock className='h-4 w-4 text-yellow-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Thanh toán sắp đến hạn</p>
                  <p className='text-xs text-muted-foreground'>1 giờ trước</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Material Service Test - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <MaterialServiceTest />
      )}
    </div>
  );
}
