import { CreditCard, Wallet, ShoppingCart, Calendar, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CustomerResponse } from '@/Schema';

interface CustomerSummaryProps {
  customer: CustomerResponse;
  totalOrders: number;
  ordersThisMonth: number;
  totalRevenue: number;
  lastOrderDate: string | null;
  onTabChange?: (tab: string) => void;
}

export function CustomerSummary({
  customer,
  totalOrders,
  ordersThisMonth,
  totalRevenue,
  lastOrderDate,
  onTabChange,
}: CustomerSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentDebt = customer.currentDebt || 0;
  const maxDebt = customer.maxDebt || 0;
  const debtProgress = maxDebt > 0 
    ? Math.min((currentDebt / maxDebt) * 100, 100) 
    : 0;

  const getDebtProgressColor = () => {
    if (debtProgress >= 90) return 'bg-destructive';
    if (debtProgress >= 70) return 'bg-warning';
    return 'bg-success';
  };

  const kpis = [
    {
      label: 'Công nợ hiện tại',
      value: formatCurrency(currentDebt),
      icon: CreditCard,
      extra: maxDebt > 0 ? (
        <div className="mt-1.5">
          <Progress value={debtProgress} className={cn("h-1.5", debtProgress >= 90 ? "[&>div]:bg-destructive" : debtProgress >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-success")} />
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {debtProgress.toFixed(0)}% / {formatCurrency(maxDebt)}
          </span>
        </div>
      ) : undefined,
      tab: 'debt',
    },
    {
      label: 'Hạn mức công nợ',
      value: maxDebt > 0 ? formatCurrency(maxDebt) : 'Chưa đặt',
      icon: Wallet,
      tab: 'debt',
    },
    {
      label: 'Tổng đơn hàng',
      value: totalOrders > 0 ? totalOrders.toString() : '0',
      subValue: ordersThisMonth > 0 ? `+${ordersThisMonth} tháng này` : undefined,
      icon: ShoppingCart,
      tab: 'orders',
    },
    {
      label: 'Doanh thu',
      value: totalRevenue > 0 ? formatCurrency(totalRevenue) : '0 ₫',
      icon: TrendingUp,
      tab: 'orders',
    },
    {
      label: 'Đơn gần nhất',
      value: lastOrderDate
        ? new Date(lastOrderDate).toLocaleDateString('vi-VN')
        : 'Chưa có',
      icon: Calendar,
      tab: 'orders',
    },
    {
      label: 'Trạng thái',
      value: customer.debtStatus === 'good' 
        ? 'Bình thường' 
        : customer.debtStatus === 'warning' 
        ? 'Cảnh báo' 
        : customer.debtStatus === 'overdue'
        ? 'Quá hạn'
        : 'Chưa xác định',
      icon: Receipt,
      tab: 'debt',
    },
  ];

  return (
    <div className="px-6 py-3 border-b bg-muted/30">
      <div className="grid grid-cols-6 gap-3">
        {kpis.map((kpi, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-sm transition-shadow border-0 bg-background"
            onClick={() => onTabChange?.(kpi.tab)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-sm font-semibold truncate">{kpi.value}</p>
                  {kpi.subValue && (
                    <p className="text-[11px] text-success">{kpi.subValue}</p>
                  )}
                  {kpi.extra}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
