import { Role } from '@/lib/mockData/users';

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
    roles: ['admin', 'production_manager', 'accountant', 'designer', 'prepress', 'operator']
  },
  {
    label: 'Production',
    path: '/production',
    icon: 'factory',
    roles: ['admin', 'production_manager', 'operator']
  },
  {
    label: 'Design',
    path: '/design',
    icon: 'palette',
    roles: ['admin', 'designer', 'prepress']
  },
  {
    label: 'Prepress',
    path: '/prepress',
    icon: 'layers',
    roles: ['admin', 'prepress', 'production_manager']
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: 'shopping_cart',
    roles: ['admin', 'production_manager', 'accountant']
  },
  {
    label: 'Accounting',
    path: '/accounting',
    icon: 'account_balance',
    roles: ['admin', 'accountant']
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