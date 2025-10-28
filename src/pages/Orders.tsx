import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar, Package } from 'lucide-react';
import { mockOrders } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export default function Orders() {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
            <p className="text-muted-foreground mt-1">Theo dõi và quản lý toàn bộ đơn hàng</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo đơn hàng
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm đơn hàng..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày giao</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {order.quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(order.deliveryDate).toLocaleDateString('vi-VN')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.totalAmount
                          ? `${order.totalAmount.toLocaleString('vi-VN')} ₫`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
