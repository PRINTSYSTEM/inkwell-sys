import { User, UserRole } from './index';

// Employee performance metrics
export interface EmployeeMetrics {
  totalDesigns: number;
  completedDesigns: number;
  inProgressDesigns: number;
  pendingDesigns: number;
  averageCompletionTime: number; // in days
  completionRate: number; // percentage
  workloadScore: number; // 0-100
  averageScore: number; // 0-10 rating
  qualityScore: number; // 0-100 percentage
  lastActivityDate: string;
  monthlyMetrics: MonthlyMetrics[];
}

export interface MonthlyMetrics {
  month: string; // YYYY-MM
  designsCompleted: number;
  averageTime: number;
  qualityScore: number;
}

// Department structure
export interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string;
  managerName: string;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Employee with extended information
export interface Employee extends User {
  department: string;
  departmentName: string;
  managerId?: string;
  managerName?: string;
  hireDate: string;
  metrics: EmployeeMetrics;
  skills: string[];
  certifications: string[];
  currentWorkload: number; // 0-100
  availability: 'available' | 'busy' | 'unavailable';
}

// Employee assignment tracking
export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  designId: string;
  designName: string;
  designCode?: string;
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  deadline?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  actualHours?: number;
  progress?: number;
  rating?: number;
  notes?: string;
  completedAt?: string;
}

// Department performance overview
export interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  activeEmployees: number;
  totalDesigns: number;
  completedDesigns: number;
  avgCompletionTime: number;
  productivityScore: number;
  workloadDistribution: WorkloadDistribution[];
  topPerformers: Employee[];
}

export interface WorkloadDistribution {
  employeeId: string;
  employeeName: string;
  currentWorkload: number;
  assignedDesigns: number;
  capacity: number;
}

// User management filters and search
export interface UserFilters {
  department?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'suspended';
  searchQuery?: string;
  skillSearch?: string;
  workloadRange?: { min: number; max: number };
  hireDate?: { start: string; end: string };
}

export interface UserListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Bulk operations
export interface BulkUserOperation {
  operation: 'activate' | 'deactivate' | 'assign_role' | 'change_department' | 'delete';
  userIds: string[];
  params?: {
    newRole?: UserRole;
    newDepartment?: string;
    reason?: string;
  };
}

// Employee work timeline
export interface WorkTimelineEntry {
  id: string;
  type: 'assignment' | 'completion' | 'review' | 'comment' | 'status_change';
  designId: string;
  designName: string;
  description: string;
  timestamp: string;
  performedBy: string;
  performedByName: string;
  metadata?: Record<string, unknown>;
}

// Performance comparison
export interface PerformanceComparison {
  employeeId: string;
  employeeName: string;
  currentPeriod: EmployeeMetrics;
  previousPeriod: EmployeeMetrics;
  improvement: {
    completionRate: number;
    averageTime: number;
    workloadManagement: number;
  };
  ranking: {
    departmentRank: number;
    companyRank: number;
    totalInDepartment: number;
    totalInCompany: number;
  };
}

// Employee dashboard data
export interface EmployeeDashboard {
  employee: Employee;
  currentAssignments: EmployeeAssignment[];
  recentWork: WorkTimelineEntry[];
  performance: EmployeeMetrics;
  upcomingDeadlines: EmployeeAssignment[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  earnedAt: string;
  category: 'productivity' | 'quality' | 'speed' | 'collaboration';
}

// Manager dashboard overview
export interface ManagerDashboard {
  department: Department;
  performance: DepartmentPerformance;
  employees: Employee[];
  recentAssignments: EmployeeAssignment[];
  pendingReviews: EmployeeAssignment[];
  alerts: DepartmentAlert[];
}

export interface DepartmentAlert {
  id: string;
  type: 'overload' | 'deadline' | 'performance' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  employeeId?: string;
  employeeName?: string;
  actionRequired: boolean;
  createdAt: string;
}

// Role and permission management
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  departmentRestricted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDetail[];
}

export interface PermissionDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemCritical: boolean;
}