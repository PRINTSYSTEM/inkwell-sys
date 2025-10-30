import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowUpRight
} from 'lucide-react';
import { orders, customers, payments, productions } from '@/lib/mockData';

export default function Dashboard() {
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order => order.status === 'new').length;
  
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

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Tổng quan hệ thống quản lý in ấn
          </p>
        </div>
        <Button>
          <Calendar className='mr-2 h-4 w-4' />
          Xuất báo cáo
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
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

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đơn hàng</CardTitle>
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

        <Card>
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

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sản xuất</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{productionInProgress}</div>
            <p className='text-xs text-muted-foreground'>
              Đơn hàng đang sản xuất
            </p>
          </CardContent>
        </Card>
      </div>

      {overduePayments > 0 && (
        <Alert className='border-red-200'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong className='text-red-600'>Cảnh báo thanh toán:</strong> Có {overduePayments} thanh toán quá hạn cần xử lý
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Đơn hàng theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Hoàn thành</span>
                <Badge variant='default'>{completedOrders}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Đang sản xuất</span>
                <Badge variant='secondary'>{orders.filter(o => o.status === 'in_production').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Đang thiết kế</span>
                <Badge variant='outline'>{orders.filter(o => o.status === 'designing').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Chờ xử lý</span>
                <Badge variant='destructive'>{pendingOrders}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Sản xuất theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Chờ sản xuất</span>
                <Badge variant='outline'>{productions.filter(p => p.status === 'pending').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Đang sản xuất</span>
                <Badge variant='secondary'>{productions.filter(p => p.status === 'in_progress').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Hoàn thành</span>
                <Badge variant='default'>{productions.filter(p => p.status === 'completed').length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Thanh toán theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Đã thanh toán</span>
                <Badge variant='default'>{payments.filter(p => p.status === 'paid').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Chờ thanh toán</span>
                <Badge variant='outline'>{payments.filter(p => p.status === 'pending').length}</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Quá hạn</span>
                <Badge variant='destructive'>{payments.filter(p => p.status === 'overdue').length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            Hoạt động gần đây
            <Button variant='outline' size='sm'>
              Xem tất cả
              <ArrowUpRight className='ml-2 h-4 w-4' />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className='flex items-center space-x-4'>
                <div className='flex-shrink-0'>
                  {order.status === 'completed' ? (
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  ) : order.status === 'in_production' ? (
                    <Clock className='h-4 w-4 text-blue-600' />
                  ) : (
                    <Clock className='h-4 w-4 text-orange-600' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900'>
                    Đơn hàng #{order.orderNumber}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {order.customerName} - {order.totalAmount ? formatCurrency(order.totalAmount) : 'Chưa báo giá'}
                  </p>
                </div>
                <Badge variant={
                  order.status === 'completed' ? 'default' :
                  order.status === 'in_production' ? 'secondary' : 'outline'
                }>
                  {order.status === 'completed' ? 'Hoàn thành' :
                   order.status === 'in_production' ? 'Sản xuất' :
                   order.status === 'designing' ? 'Thiết kế' :
                   order.status === 'waiting_approval' ? 'Chờ duyệt' : 'Mới'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
