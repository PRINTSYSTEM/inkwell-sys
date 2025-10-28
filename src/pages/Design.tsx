import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockDesigns } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

const statusLabels = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang thiết kế',
  waiting_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
};

export default function Design() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý thiết kế</h1>
          <p className="text-muted-foreground mt-1">Theo dõi tiến độ và file thiết kế</p>
        </div>
        <Button onClick={() => navigate('/design/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo thiết kế mới
        </Button>
      </div>

        <div className="grid gap-6">
          {mockDesigns.map((design) => (
            <Card key={design.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {design.orderNumber}
                      <Badge className={statusColors[design.status]}>
                        {statusLabels[design.status]}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{design.customerName}</p>
                  </div>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload file
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {design.notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{design.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">File thiết kế ({design.files.length})</h3>
                  <div className="space-y-2">
                    {design.files.length > 0 ? (
                      design.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Tải lên: {new Date(file.uploadedAt).toLocaleDateString('vi-VN')} bởi {file.uploadedBy}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Tải xuống</Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có file thiết kế nào</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Cập nhật: {new Date(design.updatedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {design.status === 'in_progress' && (
                      <Button variant="outline">Gửi duyệt</Button>
                    )}
                    {design.status === 'waiting_approval' && (
                      <>
                        <Button variant="outline">Từ chối</Button>
                        <Button>Duyệt thiết kế</Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}
