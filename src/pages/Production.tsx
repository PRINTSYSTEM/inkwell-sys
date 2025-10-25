import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { mockProductions } from '@/lib/mockData';

const statusLabels = {
  pending: 'Chưa bắt đầu',
  in_progress: 'Đang sản xuất',
  completed: 'Hoàn thành',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export default function Production() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý sản xuất</h1>
          <p className="text-muted-foreground mt-1">Theo dõi tiến độ và phân công sản xuất</p>
        </div>

        <div className="grid gap-6">
          {mockProductions.map((production) => (
            <Card key={production.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {production.orderNumber}
                      <Badge className={statusColors[production.status]}>
                        {statusLabels[production.status]}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{production.customerName}</p>
                  </div>
                  {production.status === 'pending' && (
                    <Button className="gap-2">
                      <Play className="h-4 w-4" />
                      Bắt đầu sản xuất
                    </Button>
                  )}
                  {production.status === 'in_progress' && (
                    <Button variant="outline" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Đánh dấu hoàn thành
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {production.assignedTo && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phân công cho:</span>
                    <span className="font-medium">{production.assignedTo}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-medium">{production.progress}%</span>
                  </div>
                  <Progress value={production.progress} className="h-2" />
                </div>

                {production.notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{production.notes}</p>
                  </div>
                )}

                {production.issues && production.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Sự cố ({production.issues.length})
                    </h4>
                    <div className="space-y-2">
                      {production.issues.map((issue) => (
                        <div key={issue.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                          <p className="text-sm">{issue.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Báo cáo: {new Date(issue.reportedAt).toLocaleString('vi-VN')} bởi {issue.reportedBy}
                          </p>
                          {!issue.resolved && (
                            <Button size="sm" variant="outline" className="mt-2">
                              Đánh dấu đã giải quyết
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Báo sự cố
                  </Button>
                  {production.status === 'in_progress' && (
                    <Button variant="outline">Cập nhật tiến độ</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
