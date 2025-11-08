import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  DollarSign,
  ShoppingCart,
  Package,
  Bell
} from 'lucide-react';
import { MetricData } from './DashboardMetrics';

export const createEmployeeMetrics = (data: {
  totalEmployees: number;
  activeEmployees: number;
  productivity: number;
  inProgress: number;
  pending: number;
  completed: number;
  totalTasks: number;
}): MetricData[] => {
  return [
    {
      label: 'Tổng nhân viên',
      value: data.totalEmployees,
      icon: Users,
      description: `+${data.activeEmployees} đang hoạt động`,
      variant: 'default'
    },
    {
      label: 'Hiệu suất',
      value: `${data.productivity}%`,
      icon: TrendingUp,
      trend: {
        value: '+5% so với tháng trước',
        isPositive: true
      },
      variant: 'success'
    },
    {
      label: 'Đang xử lý',
      value: data.inProgress,
      icon: Clock,
      description: `${data.pending} chờ review`,
      variant: 'warning'
    },
    {
      label: 'Hoàn thành',
      value: data.completed,
      icon: CheckCircle,
      description: data.totalTasks > 0 ? `${Math.round((data.completed / data.totalTasks) * 100)}% tỷ lệ hoàn thành` : '0% tỷ lệ hoàn thành',
      variant: 'success'
    }
  ];
};

export const createRevenueMetrics = (data: {
  totalRevenue: number;
  monthlyGrowth: number;
  orderCount: number;
  avgOrderValue: number;
}): MetricData[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return [
    {
      label: 'Doanh thu',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      trend: {
        value: `${data.monthlyGrowth > 0 ? '+' : ''}${data.monthlyGrowth}% so với tháng trước`,
        isPositive: data.monthlyGrowth > 0
      },
      variant: data.monthlyGrowth > 0 ? 'success' : 'destructive'
    },
    {
      label: 'Đơn hàng',
      value: data.orderCount,
      icon: ShoppingCart,
      description: 'Đơn hàng mới trong tháng',
      variant: 'default'
    },
    {
      label: 'Giá trị TB',
      value: formatCurrency(data.avgOrderValue),
      icon: Target,
      description: 'Giá trị trung bình mỗi đơn',
      variant: 'default'
    },
    {
      label: 'Chờ xử lý',
      value: Math.floor(data.orderCount * 0.15),
      icon: AlertTriangle,
      description: 'Đơn hàng cần xử lý',
      variant: 'warning'
    }
  ];
};

export const createInventoryMetrics = (data: {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}): MetricData[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return [
    {
      label: 'Tổng sản phẩm',
      value: data.totalItems,
      icon: Package,
      description: 'Sản phẩm trong kho',
      variant: 'default'
    },
    {
      label: 'Sắp hết hàng',
      value: data.lowStockItems,
      icon: AlertTriangle,
      description: 'Cần nhập thêm',
      variant: 'warning'
    },
    {
      label: 'Hết hàng',
      value: data.outOfStockItems,
      icon: AlertTriangle,
      description: 'Cần nhập ngay',
      variant: 'destructive'
    },
    {
      label: 'Giá trị kho',
      value: formatCurrency(data.totalValue),
      icon: DollarSign,
      description: 'Tổng giá trị tồn kho',
      variant: 'success'
    }
  ];
};

export const createNotificationMetrics = (data: {
  totalNotifications: number;
  unreadCount: number;
  urgentCount: number;
  recentCount: number;
}): MetricData[] => {
  return [
    {
      label: 'Tổng thông báo',
      value: data.totalNotifications,
      icon: Bell,
      description: 'Tất cả thông báo',
      variant: 'default'
    },
    {
      label: 'Chưa đọc',
      value: data.unreadCount,
      icon: AlertTriangle,
      description: 'Cần xem',
      variant: data.unreadCount > 0 ? 'warning' : 'default'
    },
    {
      label: 'Khẩn cấp',
      value: data.urgentCount,
      icon: AlertTriangle,
      description: 'Ưu tiên cao',
      variant: data.urgentCount > 0 ? 'destructive' : 'success'
    },
    {
      label: 'Hôm nay',
      value: data.recentCount,
      icon: Activity,
      description: 'Thông báo mới',
      variant: 'default'
    }
  ];
};