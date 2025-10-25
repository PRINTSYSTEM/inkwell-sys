import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { mockPayments } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const typeLabels = {
  deposit: 'Tiền cọc',
  final: 'Thanh toán cuối',
  refund: 'Hoàn tiền',
};

const statusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

export default function Accounting() {
  const totalPending = mockPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPaid = mockPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý kế toán</h1>
          <p className="text-muted-foreground mt-1">Thanh toán, công nợ và báo cáo tài chính</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng chờ thanh toán
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {totalPending.toLocaleString('vi-VN')} ₫
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng đã thanh toán
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {totalPaid.toLocaleString('vi-VN')} ₫
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Danh sách thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày thanh toán</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[payment.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payment.amount.toLocaleString('vi-VN')} ₫
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status]}>
                          {statusLabels[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.paidAt ? (
                          new Date(payment.paidAt).toLocaleDateString('vi-VN')
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {payment.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <Button size="sm">Xác nhận đã thanh toán</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
