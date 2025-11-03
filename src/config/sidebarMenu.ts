import { Role } from '@/lib/mockData/data/users';

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  roles: Role[];
}

export const sidebarMenu: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    roles: ['admin', 'shareholder', 'designer_manager', 'customer_service', 'production_manager', 'accountant', 'designer', 'prepress', 'operator']
  },
  {
    label: 'Production',
    path: '/production',
    icon: 'factory',
    roles: ['admin', 'shareholder', 'production_manager', 'operator', 'prepress']
  },
  {
    label: 'Design',
    path: '/design',
    icon: 'palette',
    roles: ['admin', 'shareholder', 'designer', 'designer_manager', 'prepress']
  },
  {
    label: 'Tạo mã thiết kế',
    path: '/design/code-generator',
    icon: 'code',
    roles: ['admin', 'designer', 'designer_manager', 'customer_service']
  },
  {
    label: 'Quản lý loại thiết kế',
    path: '/design-types',
    icon: 'settings',
    roles: ['admin', 'shareholder', 'designer_manager']
  },
  {
    label: 'Bình bài',
    path: '/prepress',
    icon: 'layers',
    roles: ['admin', 'prepress']
  },
  {
    label: 'Tạo lệnh bình bài',
    path: '/prepress/create-print-order',
    icon: 'print',
    roles: ['admin', 'prepress']
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: 'shopping_cart',
    roles: ['admin', 'shareholder', 'designer_manager', 'customer_service', 'accountant', 'designer']
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: 'people',
    roles: ['admin', 'shareholder', 'designer_manager', 'customer_service']
  },
  {
    label: 'Accounting',
    path: '/accounting',
    icon: 'account_balance',
    roles: ['admin', 'shareholder', 'accountant']
  },
  {
    label: 'Báo cáo công nợ',
    path: '/accounting/debt-report',
    icon: 'warning',
    roles: ['admin', 'shareholder', 'accountant']
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: 'people',
    roles: ['admin', 'production_manager']
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'bar_chart',
    roles: ['admin', 'production_manager', 'accountant']
  },
];