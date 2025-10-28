import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Palette, Factory, Calculator, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { mockOrders, mockCustomers, mockDesigns, mockProductions, mockPayments } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

const stats = [
  {
    title: 'Tổng khách hàng',
    value: mockCustomers.length,
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Đơn hàng đang xử lý',
    value: mockOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
    icon: FileText,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: 'Đang thiết kế',
    value: mockDesigns.filter(d => d.status !== 'approved').length,
    icon: Palette,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    title: 'Đang sản xuất',
    value: mockProductions.filter(p => p.status === 'in_progress').length,
    icon: Factory,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
];

const statusLabels = {
  new: 'Mới',
  designing: 'Đang thiết kế',
  waiting_approval: 'Chờ duyệt',
  waiting_deposit: 'Chờ cọc',
  in_production: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  designing: 'bg-purple-100 text-purple-800',
  waiting_approval: 'bg-yellow-100 text-yellow-800',
  waiting_deposit: 'bg-orange-100 text-orange-800',
  in_production: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const recentOrders = mockOrders.slice(0, 5);
  const pendingPayments = mockPayments.filter(p => p.status === 'pending').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Tổng quan hệ thống PrintSys</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders & Payments */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Đơn hàng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Thanh toán chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{payment.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{payment.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-accent">
                      {payment.amount.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.type === 'deposit' ? 'Tiền cọc' : 'Thanh toán'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Cảnh báo cần xử lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <span className="text-warning">•</span>
              <span>Có 1 đơn hàng sắp đến hạn giao (DH001 - 30/12/2024)</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <span className="text-warning">•</span>
              <span>Có 1 đơn hàng chờ thanh toán tiền cọc (DH002)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
