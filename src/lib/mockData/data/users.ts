import { User, Permission, UserRole, ROLE_PERMISSIONS } from "@/types";

export type Role =
  | "admin" // Administrator - Full access
  | "shareholder" // Cổ đông - View only như admin
  | "designer_manager" // CSKH - Trưởng phòng thiết kế (CSKH + Design quyền)
  | "customer_service" // CSKH - Chăm sóc khách hàng
  | "production_manager" // Production Manager
  | "accountant" // Accountant - Kế toán
  | "designer" // Designer Staff - Thiết kế
  | "prepress" // Prepress/Platemaking - Bình bài
  | "operator"; // Machine Operator - Sản xuất

export interface AuthUser extends User {
  username: string;
  password: string;
  fullName: string;
  department: string;
  permissions: Permission[];
  isActive: boolean;
}

const createMockUser = (
  data: Partial<User> & {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }
): User => {
  const now = new Date().toISOString();
  return {
    id: data.id,
    username: data.username || data.email.split("@")[0],
    fullName: data.fullName || data.name,
    email: data.email,
    name: data.name,
    role: data.role,
    permissions: data.permissions || [],
    status: data.status || "active",
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy || "system",
    updatedBy: data.updatedBy || "system",
    ...data,
  };
};

export const currentUser: User = createMockUser({
  id: "1",
  email: "admin@printsys.com",
  name: "Nguyễn Văn Admin",
  role: "admin",
  permissions: [
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "materials.view",
    "materials.create",
    "materials.edit",
    "materials.delete",
    "designs.view",
    "designs.create",
    "designs.edit",
    "designs.delete",
    "designs.assign",
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.delete",
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "production.view",
    "production.create",
    "production.edit",
    "production.delete",
    "accounting.view",
    "accounting.create",
    "accounting.edit",
    "accounting.delete",
    "reports.view",
    "reports.export",
    "settings.view",
    "settings.edit",
  ],
});

export const mockUsers: User[] = [
  currentUser,
  createMockUser({
    id: "2",
    email: "cskh1@printsys.com",
    name: "Trần Thị CSKH",
    role: "cskh",
  }),
  createMockUser({
    id: "3",
    email: "design1@printsys.com",
    name: "Lê Văn Thiết kế",
    role: "design",
  }),
  createMockUser({
    id: "4",
    email: "prod1@printsys.com",
    name: "Phạm Thị Sản xuất",
    role: "production",
  }),
  createMockUser({
    id: "5",
    email: "accounting1@printsys.com",
    name: "Hoàng Văn Kế toán",
    role: "accounting",
  }),
  createMockUser({
    id: "6",
    email: "hr1@printsys.com",
    name: "Võ Thị Nhân sự",
    role: "hr",
  }),
];

const createAuthUser = (data: {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  fullName: string;
  role: UserRole;
  department: string;
  permissions?: Permission[];
  isActive: boolean;
}): AuthUser => {
  const now = new Date().toISOString();
  const baseUser = createMockUser({
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    username: data.username,
    fullName: data.fullName,
    department: data.department,
    permissions: data.permissions || ROLE_PERMISSIONS[data.role] || [],
    status: data.isActive ? "active" : "inactive",
  });

  return {
    ...baseUser,
    username: data.username,
    password: data.password,
    fullName: data.fullName,
    department: data.department,
    permissions: data.permissions || ROLE_PERMISSIONS[data.role] || [],
    isActive: data.isActive,
  };
};

// Auth users for login
export const authUsers: AuthUser[] = [
  createAuthUser({
    id: "1",
    username: "admin",
    password: "admin123",
    email: "admin@printsys.com",
    name: "Nguyễn Văn Admin",
    fullName: "Nguyễn Văn Admin",
    role: "admin",
    department: "Administration",
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
  }),
  createAuthUser({
    id: "2",
    username: "cskh1",
    password: "cskh123",
    email: "cskh1@printsys.com",
    name: "Trần Thị CSKH",
    fullName: "Trần Thị CSKH",
    role: "cskh",
    department: "Customer Service",
    permissions: ROLE_PERMISSIONS.cskh,
    isActive: true,
  }),
  createAuthUser({
    id: "3",
    username: "designer1",
    password: "designer123",
    email: "designer1@printsys.com",
    name: "Lê Văn Thiết kế",
    fullName: "Lê Văn Thiết kế",
    role: "design",
    department: "Design",
    permissions: ROLE_PERMISSIONS.design,
    isActive: true,
  }),
  createAuthUser({
    id: "4",
    username: "shareholder1",
    password: "shareholder123",
    email: "shareholder1@printsys.com",
    name: "Nguyễn Văn Cổ đông",
    fullName: "Nguyễn Văn Cổ đông",
    role: "admin", // Shareholder có quyền như admin nhưng chỉ xem
    department: "Shareholders",
    permissions: ROLE_PERMISSIONS.admin.filter((p) => p.includes("view")),
    isActive: true,
  }),
  createAuthUser({
    id: "5",
    username: "designmanager",
    password: "designmanager123",
    email: "designmanager@printsys.com",
    name: "Trần Thị Trưởng phòng TK",
    fullName: "Trần Thị Trưởng phòng Thiết kế",
    role: "cskh", // CSKH + Design management
    department: "Design",
    permissions: [
      ...ROLE_PERMISSIONS.cskh,
      ...ROLE_PERMISSIONS.design,
      "designs.assign" as Permission,
    ],
    isActive: true,
  }),
  createAuthUser({
    id: "6",
    username: "accountant1",
    password: "account123",
    email: "accountant1@printsys.com",
    name: "Hoàng Văn Kế toán",
    fullName: "Hoàng Văn Kế toán",
    role: "accounting",
    department: "Finance",
    permissions: ROLE_PERMISSIONS.accounting,
    isActive: true,
  }),
  createAuthUser({
    id: "7",
    username: "prepress1",
    password: "prepress123",
    email: "prepress1@printsys.com",
    name: "Phạm Văn Bình bài",
    fullName: "Phạm Văn Bình bài",
    role: "production",
    department: "Prepress",
    permissions: ROLE_PERMISSIONS.production,
    isActive: true,
  }),
  createAuthUser({
    id: "8",
    username: "manager1",
    password: "manager123",
    email: "manager1@printsys.com",
    name: "Lê Thị Quản lý SX",
    fullName: "Lê Thị Quản lý Sản xuất",
    role: "production_manager",
    department: "Production",
    permissions: ROLE_PERMISSIONS.production_manager,
    isActive: true,
  }),
  createAuthUser({
    id: "9",
    username: "operator1",
    password: "operator123",
    email: "operator1@printsys.com",
    name: "Võ Văn Vận hành",
    fullName: "Võ Văn Vận hành máy",
    role: "production",
    department: "Production",
    permissions: ROLE_PERMISSIONS.production,
    isActive: true,
  }),
];

// Authentication functions
export const authenticateUser = (
  username: string,
  password: string
): User | null => {
  console.log("authenticateUser called with:", username, password);
  console.log(
    "Available users:",
    authUsers.map((u) => ({ username: u.username, password: u.password }))
  );
  const user = authUsers.find(
    (u) => u.username === username && u.password === password && u.isActive
  );
  console.log("Found user:", user);
  return user || null;
};

// Helper functions
export const checkPermission = (
  user: User,
  permission: Permission | string
): boolean => {
  const authUser = authUsers.find((u) => u.id === user.id);
  if (!authUser) return false;
  if (authUser.role === "admin") return true;
  return authUser.permissions.includes(permission as Permission);
};

export const getUserById = (id: string): User | null => {
  return mockUsers.find((u) => u.id === id) || null;
};

export const getUsersByDepartment = (department: string): AuthUser[] => {
  return authUsers.filter((u) => u.department === department);
};

// Aliased export for backward compatibility
export const users = mockUsers;
