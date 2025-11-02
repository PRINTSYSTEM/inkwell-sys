import { User } from '@/types';

export type Role = 
  | 'admin' // Administrator - Full access
  | 'shareholder' // Cổ đông - View only như admin
  | 'designer_manager' // CSKH - Trưởng phòng thiết kế (CSKH + Design quyền)
  | 'customer_service' // CSKH - Chăm sóc khách hàng
  | 'production_manager' // Production Manager
  | 'accountant' // Accountant - Kế toán
  | 'designer' // Designer Staff - Thiết kế
  | 'prepress' // Prepress/Platemaking - Bình bài
  | 'operator'; // Machine Operator - Sản xuất

export interface AuthUser extends User {
  username: string;
  password: string;
  fullName: string;
  department: string;
  permissions: string[];
  isActive: boolean;
}

export const currentUser: User = {
  id: '1',
  email: 'admin@printsys.com',
  name: 'Nguyễn Văn Admin',
  role: 'admin',
};

export const mockUsers: User[] = [
  currentUser,
  { id: '2', email: 'cskh1@printsys.com', name: 'Trần Thị CSKH', role: 'cskh' },
  { id: '3', email: 'design1@printsys.com', name: 'Lê Văn Thiết kế', role: 'design' },
  { id: '4', email: 'prod1@printsys.com', name: 'Phạm Thị Sản xuất', role: 'production' },
  { id: '5', email: 'accounting1@printsys.com', name: 'Hoàng Văn Kế toán', role: 'accounting' },
  { id: '6', email: 'hr1@printsys.com', name: 'Võ Thị Nhân sự', role: 'hr' },
];

// Auth users for login
export const authUsers: AuthUser[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@printsys.com',
    name: 'Nguyễn Văn Admin',
    fullName: 'Nguyễn Văn Admin',
    role: 'admin',
    department: 'Administration',
    permissions: ['*'],
    isActive: true,
  },
  {
    id: '2',
    username: 'cskh1',
    password: 'cskh123',
    email: 'cskh1@printsys.com',
    name: 'Trần Thị CSKH',
    fullName: 'Trần Thị CSKH',
    role: 'cskh',
    department: 'Customer Service',
    permissions: ['customers', 'orders'],
    isActive: true,
  },
  {
    id: '3',
    username: 'design1',
    password: 'design123',
    email: 'design1@printsys.com',
    name: 'Lê Văn Thiết kế',
    fullName: 'Lê Văn Thiết kế',
    role: 'design',
    department: 'Design',
    permissions: ['designs'],
    isActive: true,
  },
];

// Authentication functions
export const authenticateUser = (username: string, password: string): User | null => {
  console.log('authenticateUser called with:', username, password);
  console.log('Available users:', authUsers.map(u => ({ username: u.username, password: u.password })));
  const user = authUsers.find(u => u.username === username && u.password === password && u.isActive);
  console.log('Found user:', user);
  return user || null;
};

// Helper functions
export const checkPermission = (user: User, permission: string): boolean => {
  const authUser = authUsers.find(u => u.id === user.id);
  if (!authUser) return false;
  if (authUser.role === 'admin') return true;
  return authUser.permissions.includes(permission);
};

export const getUserById = (id: string): User | null => {
  return mockUsers.find(u => u.id === id) || null;
};

export const getUsersByDepartment = (department: string): AuthUser[] => {
  return authUsers.filter(u => u.department === department);
};

// Aliased export for backward compatibility
export const users = mockUsers;