import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, TrendingUp, DollarSign, Search, Download, Building2, Phone, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { checkDebtStatus, formatCurrency, getDebtAlert } from '@/lib/utils';

export default function DebtReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'warning' | 'blocked'>('all');

  // Lọc khách hàng theo tìm kiếm và trạng thái
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = 
      (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customer.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || customer.debtStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Thống kê tổng quan
  const stats = {
    totalCustomers: mockCustomers.length,
    goodStatus: mockCustomers.filter(c => c.debtStatus === 'good').length,
    warningStatus: mockCustomers.filter(c => c.debtStatus === 'warning').length,
    blockedStatus: mockCustomers.filter(c => c.debtStatus === 'blocked').length,
    totalCurrentDebt: mockCustomers.reduce((sum, c) => sum + c.currentDebt, 0),
    totalMaxDebt: mockCustomers.reduce((sum, c) => sum + c.maxDebt, 0),
  };

  // Danh sách cảnh báo
  const alerts = mockCustomers
    .map(customer => getDebtAlert(customer))
    .filter(alert => alert !== null);

  const handleExportReport = () => {
    // Simulate export functionality
    console.log('Exporting debt report...');
    alert('Báo cáo công nợ đã được xuất thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo Công nợ</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý công nợ khách hàng
          </p>
        </div>
        <Button onClick={handleExportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng KH</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">khách hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tình trạng tốt</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.goodStatus}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.goodStatus / stats.totalCustomers) * 100)}% khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần theo dõi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warningStatus}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.warningStatus / stats.totalCustomers) * 100)}% khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị chặn</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blockedStatus}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.blockedStatus / stats.totalCustomers) * 100)}% khách hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cảnh báo nợ xấu */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Cảnh báo công nợ</h3>
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.includes('🚫') ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tổng công nợ */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tổng công nợ hiện tại</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalCurrentDebt)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tổng hạn mức cho phép</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalMaxDebt)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tỷ lệ sử dụng</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((stats.totalCurrentDebt / stats.totalMaxDebt) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết công nợ khách hàng</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm khách hàng..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Tất cả
              </Button>
              <Button 
                variant={filterStatus === 'warning' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('warning')}
              >
                Cảnh báo
              </Button>
              <Button 
                variant={filterStatus === 'blocked' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('blocked')}
              >
                Bị chặn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Công nợ hiện tại</TableHead>
                  <TableHead>Hạn mức</TableHead>
                  <TableHead>Tỷ lệ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const debtInfo = checkDebtStatus(customer);
                  const debtRatio = (customer.currentDebt / customer.maxDebt) * 100;
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.representativeName}</p>
                          <p className="text-sm text-muted-foreground">{customer.code}</p>
                          {customer.companyName && (
                            <p className="text-xs text-muted-foreground">{customer.companyName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${customer.currentDebt > customer.maxDebt ? 'text-red-600' : ''}`}>
                          {formatCurrency(customer.currentDebt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(customer.maxDebt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${debtRatio > 100 ? 'text-red-600' : debtRatio > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {Math.round(debtRatio)}%
                          </span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${debtRatio > 100 ? 'bg-red-500' : debtRatio > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(debtRatio, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            customer.debtStatus === 'good' ? 'default' : 
                            customer.debtStatus === 'warning' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {customer.debtStatus === 'good' ? 'Tốt' : 
                           customer.debtStatus === 'warning' ? 'Cảnh báo' : 
                           'Bị chặn'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {debtInfo.message}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}