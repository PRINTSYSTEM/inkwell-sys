import React, { useState } from 'react';
import { 
  PageLayout, 
  SectionLayout, 
  ContentLayout, 
  SidebarLayout, 
  GridItem,
  type SidebarItem,
  type SidebarGroup,
  type PageAction
} from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  Plus, 
  Download, 
  RefreshCw,
  Search,
  Filter,
  User,
  Building,
  Calendar
} from 'lucide-react';

export const LayoutExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sample sidebar configuration
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    }
  ];

  const sidebarGroups: SidebarGroup[] = [
    {
      id: 'management',
      label: 'Quản lý',
      items: [
        {
          id: 'employees',
          label: 'Nhân viên',
          icon: Users,
          active: activeTab === 'employees',
          onClick: () => setActiveTab('employees'),
          badge: { text: '23', variant: 'secondary' }
        },
        {
          id: 'departments',
          label: 'Phòng ban',
          icon: Building,
          active: activeTab === 'departments',
          onClick: () => setActiveTab('departments')
        },
        {
          id: 'projects',
          label: 'Dự án',
          icon: FileText,
          active: activeTab === 'projects',
          onClick: () => setActiveTab('projects'),
          badge: { text: '5', variant: 'destructive' }
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Báo cáo',
      items: [
        {
          id: 'reports',
          label: 'Báo cáo',
          icon: BarChart3,
          active: activeTab === 'reports',
          onClick: () => setActiveTab('reports')
        },
        {
          id: 'calendar',
          label: 'Lịch làm việc',
          icon: Calendar,
          active: activeTab === 'calendar',
          onClick: () => setActiveTab('calendar')
        }
      ]
    }
  ];

  // Page actions
  const pageActions: PageAction[] = [
    {
      id: 'add',
      label: 'Thêm mới',
      icon: Plus,
      onClick: () => console.log('Add new'),
      variant: 'default'
    },
    {
      id: 'export',
      label: 'Xuất file',
      icon: Download,
      onClick: () => console.log('Export'),
      variant: 'outline'
    },
    {
      id: 'refresh',
      label: 'Làm mới',
      icon: RefreshCw,
      onClick: () => console.log('Refresh'),
      variant: 'ghost'
    }
  ];

  const renderDashboardContent = () => (
    <ContentLayout variant="grid" columns={4} responsive={{ sm: 1, md: 2, lg: 4 }}>
      <GridItem span={1} card>
        <div className="text-center p-4">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">156</div>
          <div className="text-sm text-muted-foreground">Nhân viên</div>
        </div>
      </GridItem>
      
      <GridItem span={1} card>
        <div className="text-center p-4">
          <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">24</div>
          <div className="text-sm text-muted-foreground">Dự án</div>
        </div>
      </GridItem>
      
      <GridItem span={1} card>
        <div className="text-center p-4">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold">87%</div>
          <div className="text-sm text-muted-foreground">Hiệu suất</div>
        </div>
      </GridItem>
      
      <GridItem span={1} card>
        <div className="text-center p-4">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-muted-foreground">Nhiệm vụ</div>
        </div>
      </GridItem>
      
      <GridItem span={4}>
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ hiệu suất</CardTitle>
            <CardDescription>Theo dõi hiệu suất làm việc theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chart placeholder</span>
            </div>
          </CardContent>
        </Card>
      </GridItem>
    </ContentLayout>
  );

  const renderEmployeesContent = () => (
    <div className="space-y-6">
      {/* Search and filters */}
      <SectionLayout
        title="Tìm kiếm và lọc"
        variant="bordered"
        actions={[
          {
            id: 'search',
            label: 'Tìm kiếm',
            icon: Search,
            onClick: () => console.log('Search')
          },
          {
            id: 'filter',
            label: 'Lọc',
            icon: Filter,
            onClick: () => console.log('Filter')
          }
        ]}
      >
        <ContentLayout variant="flex" gap="md">
          <Input placeholder="Tìm kiếm nhân viên..." className="flex-1" />
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </ContentLayout>
      </SectionLayout>

      {/* Employee list */}
      <SectionLayout
        title="Danh sách nhân viên"
        description="Quản lý thông tin nhân viên trong hệ thống"
        badge={{ text: '156', variant: 'secondary' }}
        actions={[
          {
            id: 'add-employee',
            label: 'Thêm nhân viên',
            icon: Plus,
            onClick: () => console.log('Add employee')
          }
        ]}
      >
        <ContentLayout variant="grid" columns={3} responsive={{ sm: 1, md: 2, lg: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GridItem key={i} card>
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Nhân viên {i}</div>
                    <div className="text-sm text-muted-foreground">Designer</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Phòng ban:</span>
                    <span>Thiết kế</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hiệu suất:</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                </div>
              </div>
            </GridItem>
          ))}
        </ContentLayout>
      </SectionLayout>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'employees':
        return renderEmployeesContent();
      case 'departments':
        return (
          <SectionLayout title="Phòng ban" variant="card">
            <div className="p-8 text-center text-muted-foreground">
              Nội dung quản lý phòng ban
            </div>
          </SectionLayout>
        );
      case 'projects':
        return (
          <SectionLayout title="Dự án" variant="card">
            <div className="p-8 text-center text-muted-foreground">
              Nội dung quản lý dự án
            </div>
          </SectionLayout>
        );
      case 'reports':
        return (
          <SectionLayout title="Báo cáo" variant="card">
            <div className="p-8 text-center text-muted-foreground">
              Nội dung báo cáo và thống kê
            </div>
          </SectionLayout>
        );
      case 'calendar':
        return (
          <SectionLayout title="Lịch làm việc" variant="card">
            <div className="p-8 text-center text-muted-foreground">
              Nội dung lịch làm việc
            </div>
          </SectionLayout>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarLayout
      items={sidebarItems}
      groups={sidebarGroups}
      header={
        <div className="flex items-center space-x-2">
          <img
            src="/images/logo.png"
            alt="QUANG DAT DESIGN - PRINTING"
            className="h-8 w-auto object-contain"
          />
          {!sidebarCollapsed && (
            <div>
              <div className="font-semibold text-sm">Quang Đạt</div>
              <div className="text-xs text-muted-foreground">v2.0</div>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <div className="text-sm font-medium">Admin User</div>
              <div className="text-xs text-muted-foreground">admin@inkwell.com</div>
            </div>
          )}
        </div>
      }
      onToggle={setSidebarCollapsed}
    >
      <PageLayout
        title={activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'employees' ? 'Quản lý nhân viên' :
               activeTab === 'departments' ? 'Quản lý phòng ban' :
               activeTab === 'projects' ? 'Quản lý dự án' :
               activeTab === 'reports' ? 'Báo cáo' :
               'Lịch làm việc'}
        description={
          activeTab === 'dashboard' ? 'Tổng quan hoạt động hệ thống' :
          activeTab === 'employees' ? 'Quản lý thông tin và hiệu suất nhân viên' :
          'Nội dung trang ' + activeTab
        }
        breadcrumbs={[
          { label: 'Trang chủ' },
          { label: activeTab === 'dashboard' ? 'Dashboard' : 
                   activeTab === 'employees' ? 'Nhân viên' :
                   activeTab }
        ]}
        actions={pageActions}
        badge={
          activeTab === 'employees' ? { text: '156 nhân viên', variant: 'secondary' } :
          activeTab === 'projects' ? { text: '5 cần xử lý', variant: 'destructive' } :
          undefined
        }
        maxWidth="7xl"
        padding={false}
        className="bg-muted/30"
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </PageLayout>
    </SidebarLayout>
  );
};