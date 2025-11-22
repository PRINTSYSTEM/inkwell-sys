import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';
import { mockPayments } from '@/lib/mockData';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function Accounting() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Calculate revenue statistics
  const totalRevenue = mockOrders
    .filter(o => o.totalAmount && o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingRevenue = mockOrders
    .filter(o => o.totalAmount && o.status !== 'completed' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const paidAmount = mockPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = mockPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = mockPayments.filter(payment => {
    if (payment.status !== 'pending') return false;
    const createdDate = new Date(payment.createdAt);
    const today = new Date();
    const daysPending = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysPending > 7; // Consider overdue after 7 days
  });

  // Filter payments
  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels = {
      paid: 'Đã thanh toán',
      pending: 'Chờ thanh toán',
      overdue: 'Quá hạn',
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      deposit: 'bg-blue-100 text-blue-800 border-blue-200',
      final: 'bg-purple-100 text-purple-800 border-purple-200',
      refund: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const labels = {
      deposit: 'Đặt cọc',
      final: 'Thanh toán cuối',
      refund: 'Hoàn tiền',
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  // Customer debt analysis
  const customerDebts = mockCustomers.map(customer => {
    const customerOrders = mockOrders.filter(o => o.customerId === customer.id);
    const customerPayments = mockPayments.filter(p => 
      customerOrders.some(o => o.orderNumber === p.orderNumber)
    );
    
    const totalOwed = customerOrders
      .filter(o => o.totalAmount)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const totalPaid = customerPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const debt = totalOwed - totalPaid;
    
    return {
      customer,
      totalOwed,
      totalPaid,
      debt,
      orderCount: customerOrders.length,
    };
  }).filter(item => item.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 5);

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Đã thanh toán',
    },
    {
      title: 'Chờ thu',
      value: pendingAmount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: `${mockPayments.filter(p => p.status === 'pending').length} giao dịch`,
    },
    {
      title: 'Quá hạn',
      value: overduePayments.reduce((sum, p) => sum + p.amount, 0),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: `${overduePayments.length} giao dịch`,
    },
    {
      title: 'Đã thu tháng này',
      value: paidAmount,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Thành công',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kế toán</h1>
          <p className="text-muted-foreground mt-1">Quản lý thanh toán và doanh thu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo phiếu thu
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(stat.value)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">
                  {overduePayments.length} khoản thanh toán quá hạn
                </p>
                <p className="text-sm text-red-700">
                  Tổng giá trị: {formatCurrency(overduePayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <Button size="sm" variant="outline">
                Xem chi tiết
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tiến độ doanh thu tháng 10/2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Mục tiêu: {formatCurrency(100000000)}</span>
              <span className="font-medium">{Math.round((totalRevenue / 100000000) * 100)}%</span>
            </div>
            <Progress value={(totalRevenue / 100000000) * 100} className="h-3" />
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Đã thu</p>
                <p className="font-medium text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chờ thu</p>
                <p className="font-medium text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Còn lại</p>
                <p className="font-medium">{formatCurrency(100000000 - totalRevenue)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quản lý thanh toán
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm kiếm giao dịch..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="deposit">Đặt cọc</SelectItem>
                  <SelectItem value="final">Thanh toán cuối</SelectItem>
                  <SelectItem value="refund">Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{getTypeBadge(payment.type)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Debt Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Công nợ khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerDebts.map((item) => (
                <div key={item.customer.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {item.customer.companyName || item.customer.representativeName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.orderCount} đơn
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng:</span>
                      <span>{formatCurrency(item.totalOwed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đã trả:</span>
                      <span className="text-green-600">{formatCurrency(item.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">Còn nợ:</span>
                      <span className="font-medium text-red-600">{formatCurrency(item.debt)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {customerDebts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Không có công nợ</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}