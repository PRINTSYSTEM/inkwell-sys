import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download } from 'lucide-react';
import { mockAttendance } from '@/lib/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusLabels = {
  present: 'Có mặt',
  late: 'Đi trễ',
  absent: 'Vắng',
  overtime: 'Tăng ca',
};

const statusColors = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-red-100 text-red-800',
  overtime: 'bg-blue-100 text-blue-800',
};

export default function Attendance() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý chấm công</h1>
            <p className="text-muted-foreground mt-1">Theo dõi giờ làm và tính công nhân viên</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Chọn tháng
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Có mặt hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đi trễ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">1</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng giờ tăng ca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0.5</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bảng chấm công - {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ vào</TableHead>
                    <TableHead>Giờ ra</TableHead>
                    <TableHead className="text-center">Giờ công</TableHead>
                    <TableHead className="text-center">Tăng ca</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.userName}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{record.checkIn || '-'}</TableCell>
                      <TableCell>{record.checkOut || '-'}</TableCell>
                      <TableCell className="text-center font-medium">{record.workHours}h</TableCell>
                      <TableCell className="text-center font-medium text-primary">
                        {record.overtimeHours > 0 ? `${record.overtimeHours}h` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status]}>
                          {statusLabels[record.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.notes || '-'}
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
