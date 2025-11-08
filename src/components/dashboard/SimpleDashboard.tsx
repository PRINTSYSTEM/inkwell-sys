import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DashboardMetrics, 
  AlertsWidget, 
  QuickActionsWidget, 
  RecentActivityWidget,
  createEmployeeMetrics,
  createSampleAlerts,
  type QuickAction,
  type ActivityItem
} from '@/components/dashboard';
import { 
  Users, 
  Plus, 
  FileText, 
  Settings, 
  Download,
  Calendar,
  Eye
} from 'lucide-react';

interface SimpleDashboardProps {
  className?: string;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ className }) => {
  const navigate = useNavigate();

  // Sample data - này sẽ được thay thế bằng data thực từ API
  const employeeData = {
    totalEmployees: 25,
    activeEmployees: 23,
    productivity: 87,
    inProgress: 12,
    pending: 3,
    completed: 45,
    totalTasks: 60
  };

  const metrics = createEmployeeMetrics(employeeData);
  const alerts = createSampleAlerts();

  const quickActions: QuickAction[] = [
    {
      id: 'add-employee',
      label: 'Thêm nhân viên',
      description: 'Tạo hồ sơ nhân viên mới',
      icon: Plus,
      onClick: () => navigate('/admin/employees/new'),
      variant: 'default'
    },
    {
      id: 'view-reports',
      label: 'Xem báo cáo',
      description: 'Báo cáo hiệu suất và thống kê',
      icon: FileText,
      onClick: () => navigate('/admin/reports'),
      variant: 'outline'
    },
    {
      id: 'manage-users',
      label: 'Quản lý người dùng',
      description: 'Phân quyền và vai trò',
      icon: Users,
      onClick: () => navigate('/admin/users'),
      variant: 'outline',
      badge: { text: '5', variant: 'destructive' }
    },
    {
      id: 'settings',
      label: 'Cài đặt hệ thống',
      description: 'Cấu hình và tùy chỉnh',
      icon: Settings,
      onClick: () => navigate('/admin/settings'),
      variant: 'ghost'
    }
  ];

  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'create',
      title: 'Tạo hồ sơ nhân viên mới - Nguyễn Thị B',
      description: 'Phòng ban: Thiết kế, Vị trí: Designer',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: {
        id: 'admin1',
        name: 'Admin',
        avatar: undefined
      },
      target: {
        type: 'employee',
        name: 'Nguyễn Thị B',
        id: 'emp-001'
      }
    },
    {
      id: '2',
      type: 'complete',
      title: 'Hoàn thành đánh giá hiệu suất Q4',
      description: 'Đánh giá 25 nhân viên, điểm trung bình: 8.2/10',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'manager1',
        name: 'Trần Văn Manager',
        avatar: undefined
      },
      target: {
        type: 'report',
        name: 'Báo cáo Q4',
        id: 'report-001'
      }
    },
    {
      id: '3',
      type: 'update',
      title: 'Cập nhật thông tin phòng ban',
      description: 'Thay đổi cấu trúc tổ chức phòng IT',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: 'hr1',
        name: 'Lê Thị HR',
        avatar: undefined
      },
      target: {
        type: 'setting',
        name: 'Cấu trúc tổ chức',
        id: 'org-001'
      }
    }
  ];

  const handleDismissAlert = async (alertId: string) => {
    console.log('Dismiss alert:', alertId);
    // Implement API call to dismiss alert
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Tổng quan hoạt động và quản lý hệ thống
          </p>
        </div>
      </div>

      {/* Metrics */}
      <DashboardMetrics metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Alerts and Quick Actions */}
        <div className="space-y-6">
          <AlertsWidget
            alerts={alerts}
            onDismiss={handleDismissAlert}
            onViewAll={() => navigate('/admin/alerts')}
          />
          
          <QuickActionsWidget
            actions={quickActions}
            columns={1}
          />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityWidget
            activities={recentActivities}
            maxItems={8}
            onViewAll={() => navigate('/admin/activity')}
            onItemClick={(activity) => {
              if (activity.target?.type === 'employee') {
                navigate(`/admin/employees/${activity.target.id}`);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};