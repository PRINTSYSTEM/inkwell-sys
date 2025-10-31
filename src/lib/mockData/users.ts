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

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export const users: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In real-world, password should be hashed
    fullName: 'Administrator',
    email: 'admin@inkwell.com',
    role: 'admin',
    department: 'Management',
    avatar: 'https://ui-avatars.com/api/?name=Administrator',
    permissions: ['all'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'manager1',
    password: 'manager123',
    fullName: 'Production Manager',
    email: 'production.manager@inkwell.com',
    role: 'production_manager',
    department: 'Production',
    avatar: 'https://ui-avatars.com/api/?name=Production+Manager',
    permissions: ['manage_production', 'view_reports', 'manage_staff'],
    isActive: true,
    createdAt: '2025-01-02T00:00:00Z'
  },
  {
    id: '7',
    username: 'shareholder1',
    password: 'shareholder123',
    fullName: 'Nguyễn Văn A - Cổ Đông',
    email: 'shareholder@inkwell.com',
    role: 'shareholder',
    department: 'Board',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A',
    permissions: ['view_all_readonly'],
    isActive: true,
    createdAt: '2025-01-07T00:00:00Z'
  },
  {
    id: '8',
    username: 'designmanager',
    password: 'designmanager123',
    fullName: 'Trần Thị B - Trưởng Phòng Thiết Kế',
    email: 'design.manager@inkwell.com',
    role: 'designer_manager',
    department: 'Design & Customer Service',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B',
    permissions: ['manage_customer_service', 'manage_designs', 'view_customer_info', 'manage_designers'],
    isActive: true,
    createdAt: '2025-01-08T00:00:00Z'
  },
  {
    id: '9',
    username: 'cskh1',
    password: 'cskh123',
    fullName: 'Lê Văn C - CSKH',
    email: 'customer.service@inkwell.com',
    role: 'customer_service',
    department: 'Customer Service',
    avatar: 'https://ui-avatars.com/api/?name=Le+Van+C',
    permissions: ['manage_customers', 'view_orders', 'handle_complaints'],
    isActive: true,
    createdAt: '2025-01-09T00:00:00Z'
  },
  {
    id: '3',
    username: 'designer1',
    password: 'designer123',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@inkwell.com',
    role: 'designer',
    department: 'Design',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen',
    permissions: ['manage_designs', 'view_projects'],
    isActive: true,
    createdAt: '2025-01-03T00:00:00Z'
  },
  {
    id: '4',
    username: 'accountant1',
    password: 'account123',
    fullName: 'Jane Doe',
    email: 'jane.doe@inkwell.com',
    role: 'accountant',
    department: 'Accounting',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Doe',
    permissions: ['manage_accounting', 'view_reports'],
    isActive: true,
    createdAt: '2025-01-04T00:00:00Z'
  },
  {
    id: '5',
    username: 'prepress1',
    password: 'prepress123',
    fullName: 'Michael Wang',
    email: 'michael.wang@inkwell.com',
    role: 'prepress',
    department: 'Prepress',
    avatar: 'https://ui-avatars.com/api/?name=Michael+Wang',
    permissions: ['manage_plates', 'view_designs'],
    isActive: true,
    createdAt: '2025-01-05T00:00:00Z'
  },
  {
    id: '6',
    username: 'operator1',
    password: 'operator123',
    fullName: 'David Johnson',
    email: 'david.johnson@inkwell.com',
    role: 'operator',
    department: 'Production',
    avatar: 'https://ui-avatars.com/api/?name=David+Johnson',
    permissions: ['view_production', 'record_operations'],
    isActive: true,
    createdAt: '2025-01-06T00:00:00Z'
  }
];

// Hàm helper để check đăng nhập
export const authenticateUser = (username: string, password: string): User | null => {
  console.log('authenticateUser called with:', username, password);
  console.log('Available users:', users.map(u => ({ username: u.username, password: u.password })));
  const user = users.find(u => u.username === username && u.password === password && u.isActive);
  console.log('Found user:', user);
  return user || null;
};

// Hàm helper để check quyền
export const checkPermission = (user: User, permission: string): boolean => {
  if (user.role === 'admin') return true;
  return user.permissions.includes(permission);
};

// Hàm helper để lấy user theo ID
export const getUserById = (id: string): User | null => {
  return users.find(u => u.id === id) || null;
};

// Hàm helper để lấy users theo department
export const getUsersByDepartment = (department: string): User[] => {
  return users.filter(u => u.department === department);
};