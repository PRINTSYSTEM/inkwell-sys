import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Phone, MapPin } from 'lucide-react';
import { mockCustomers } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

export default function Customers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
            <p className="text-muted-foreground mt-1">Danh sách khách hàng và thông tin liên hệ</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm khách hàng
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm khách hàng..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockCustomers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{customer.code}</Badge>
                      </div>
                      <Badge className="bg-primary/10 text-primary">{customer.folder}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="flex-1">{customer.address}</span>
                    </div>
                    {customer.taxCode && (
                      <div className="text-sm text-muted-foreground">
                        MST: {customer.taxCode}
                      </div>
                    )}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Tạo: {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
