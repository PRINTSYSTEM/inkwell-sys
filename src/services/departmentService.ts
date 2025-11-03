import {
  Department,
  DepartmentPerformance,
  ManagerDashboard,
  DepartmentAlert,
  Employee
} from '@/types/employee';
import { UserManagementService } from './userService';
import { EmployeePerformanceService } from './employeeService';

// Mock department hierarchy data
const mockDepartmentHierarchy = {
  'dept-design': {
    parentId: null,
    children: ['dept-design-ui', 'dept-design-print'],
    level: 1
  },
  'dept-design-ui': {
    parentId: 'dept-design',
    children: [],
    level: 2
  },
  'dept-design-print': {
    parentId: 'dept-design',
    children: [],
    level: 2
  },
  'dept-production': {
    parentId: null,
    children: ['dept-production-prepress', 'dept-production-printing'],
    level: 1
  },
  'dept-production-prepress': {
    parentId: 'dept-production',
    children: [],
    level: 2
  },
  'dept-production-printing': {
    parentId: 'dept-production',
    children: [],
    level: 2
  }
};

// Mock alerts
const mockDepartmentAlerts: DepartmentAlert[] = [
  {
    id: 'alert-001',
    type: 'overload',
    severity: 'high',
    message: 'Nhân viên Lê Văn C đang có workload 85%, cần cân bằng lại công việc',
    employeeId: 'user-des002',
    employeeName: 'Lê Văn C',
    actionRequired: true,
    createdAt: '2024-11-03T08:00:00Z'
  },
  {
    id: 'alert-002',
    type: 'deadline',
    severity: 'medium',
    message: '3 thiết kế sắp đến deadline trong 2 ngày tới',
    actionRequired: true,
    createdAt: '2024-11-03T09:00:00Z'
  },
  {
    id: 'alert-003',
    type: 'performance',
    severity: 'low',
    message: 'Hiệu suất tổng thể phòng ban tăng 5% so với tháng trước',
    actionRequired: false,
    createdAt: '2024-11-02T16:00:00Z'
  }
];

export class DepartmentManagementService {
  // Get all departments
  static async getAllDepartments(): Promise<Department[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return UserManagementService.getDepartments();
  }

  // Get department by ID
  static async getDepartmentById(id: string): Promise<Department | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const departments = await this.getAllDepartments();
    return departments.find(dept => dept.id === id) || null;
  }

  // Get department hierarchy
  static async getDepartmentHierarchy(rootDepartmentId?: string): Promise<{
    department: Department;
    children: Array<{ department: Department; children: Department[] }>;
  }[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const departments = await this.getAllDepartments();
    
    // Filter root departments or specific department
    const rootDepts = rootDepartmentId 
      ? departments.filter(dept => dept.id === rootDepartmentId)
      : departments.filter(dept => !mockDepartmentHierarchy[dept.id]?.parentId);

    return rootDepts.map(dept => ({
      department: dept,
      children: departments
        .filter(child => mockDepartmentHierarchy[child.id]?.parentId === dept.id)
        .map(child => ({
          department: child,
          children: departments.filter(grandchild => 
            mockDepartmentHierarchy[grandchild.id]?.parentId === child.id
          )
        }))
    }));
  }

  // Get employees by department
  static async getDepartmentEmployees(departmentId: string): Promise<Employee[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return UserManagementService.getUsersByDepartment(departmentId);
  }

  // Get department manager
  static async getDepartmentManager(departmentId: string): Promise<Employee | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const department = await this.getDepartmentById(departmentId);
    if (!department?.managerId) {
      return null;
    }

    return UserManagementService.getUserById(department.managerId);
  }

  // Get departments managed by user
  static async getDepartmentsByManager(managerId: string): Promise<Department[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const departments = await this.getAllDepartments();
    return departments.filter(dept => dept.managerId === managerId);
  }

  // Get manager dashboard
  static async getManagerDashboard(managerId: string): Promise<ManagerDashboard> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const departments = await this.getDepartmentsByManager(managerId);
    
    // For now, assume manager manages one department
    const department = departments[0];
    if (!department) {
      throw new Error('No department found for this manager');
    }

    const [performance, employees, recentAssignments, alerts] = await Promise.all([
      EmployeePerformanceService.getDepartmentPerformance(department.id),
      this.getDepartmentEmployees(department.id),
      EmployeePerformanceService.getAllAssignments({ departmentId: department.id }),
      this.getDepartmentAlerts(department.id)
    ]);

    const pendingReviews = recentAssignments.filter(assign => assign.status === 'review');

    return {
      department,
      performance,
      employees,
      recentAssignments: recentAssignments.slice(0, 10),
      pendingReviews,
      alerts
    };
  }

  // Get department performance
  static async getDepartmentPerformance(departmentId: string, period?: { start: string; end: string }): Promise<DepartmentPerformance> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return EmployeePerformanceService.getDepartmentPerformance(departmentId);
  }

  // Get department alerts
  static async getDepartmentAlerts(departmentId: string, severity?: DepartmentAlert['severity']): Promise<DepartmentAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let alerts = [...mockDepartmentAlerts];
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Create department alert
  static async createDepartmentAlert(alertData: Omit<DepartmentAlert, 'id' | 'createdAt'>): Promise<DepartmentAlert> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newAlert: DepartmentAlert = {
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...alertData
    };

    mockDepartmentAlerts.push(newAlert);
    return newAlert;
  }

  // Dismiss alert
  static async dismissAlert(alertId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const alertIndex = mockDepartmentAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return false;
    }

    mockDepartmentAlerts.splice(alertIndex, 1);
    return true;
  }

  // Get workload distribution for department
  static async getDepartmentWorkload(departmentId: string): Promise<{
    overview: {
      totalCapacity: number;
      usedCapacity: number;
      availableCapacity: number;
      utilizationRate: number;
    };
    employees: Array<{
      employee: Employee;
      workload: number;
      capacity: number;
      assignments: number;
      efficiency: number;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const employees = await this.getDepartmentEmployees(departmentId);
    const workloadData = await EmployeePerformanceService.getWorkloadAnalysis(
      employees.map(emp => emp.id)
    );

    const employeeWorkloads = employees.map(emp => {
      const workload = workloadData.find(w => w.employeeId === emp.id);
      return {
        employee: emp,
        workload: workload?.currentWorkload || 0,
        capacity: workload?.capacity || 100,
        assignments: workload?.assignedDesigns || 0,
        efficiency: emp.metrics?.completionRate || 0
      };
    });

    const totalCapacity = employeeWorkloads.reduce((sum, emp) => sum + emp.capacity, 0);
    const usedCapacity = employeeWorkloads.reduce((sum, emp) => sum + emp.workload, 0);
    const availableCapacity = totalCapacity - usedCapacity;
    const utilizationRate = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      overview: {
        totalCapacity,
        usedCapacity,
        availableCapacity,
        utilizationRate
      },
      employees: employeeWorkloads
    };
  }

  // Reassign employee to different department
  static async reassignEmployee(employeeId: string, newDepartmentId: string, reason: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const department = await this.getDepartmentById(newDepartmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    await UserManagementService.updateUser(employeeId, {
      department: newDepartmentId,
      departmentName: department.name,
      managerId: department.managerId,
      managerName: department.managerName
    });

    // Create alert for the move
    await this.createDepartmentAlert({
      type: 'performance',
      severity: 'low',
      message: `Nhân viên đã được chuyển đến ${department.name}. Lý do: ${reason}`,
      employeeId,
      actionRequired: false
    });

    return true;
  }

  // Assign manager to department
  static async assignManager(departmentId: string, managerId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const manager = await UserManagementService.getUserById(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }

    // In real implementation, would update department in database
    // For now, this is a placeholder
    console.log(`Assigned manager ${manager.fullName} to department ${departmentId}`);

    return true;
  }

  // Get department comparison
  static async getDepartmentComparison(departmentIds: string[], period?: { start: string; end: string }): Promise<{
    departments: Array<{
      department: Department;
      performance: DepartmentPerformance;
      ranking: number;
    }>;
    metrics: {
      bestPerforming: string;
      mostImproved: string;
      averageProductivity: number;
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 700));

    const departments = await Promise.all(
      departmentIds.map(async id => ({
        department: await this.getDepartmentById(id),
        performance: await this.getDepartmentPerformance(id, period)
      }))
    );

    // Sort by productivity score
    const rankedDepartments = departments
      .filter(dept => dept.department !== null)
      .map((dept, index) => ({
        department: dept.department!,
        performance: dept.performance,
        ranking: index + 1
      }))
      .sort((a, b) => b.performance.productivityScore - a.performance.productivityScore)
      .map((dept, index) => ({ ...dept, ranking: index + 1 }));

    const averageProductivity = rankedDepartments.length > 0
      ? rankedDepartments.reduce((sum, dept) => sum + dept.performance.productivityScore, 0) / rankedDepartments.length
      : 0;

    return {
      departments: rankedDepartments,
      metrics: {
        bestPerforming: rankedDepartments[0]?.department.name || '',
        mostImproved: rankedDepartments[0]?.department.name || '', // Would calculate based on historical data
        averageProductivity
      }
    };
  }

  // Get department timeline (recent activities)
  static async getDepartmentTimeline(departmentId: string, limit = 20): Promise<Array<{
    id: string;
    type: 'assignment' | 'completion' | 'employee_joined' | 'employee_left' | 'performance_alert';
    title: string;
    description: string;
    timestamp: string;
    employeeId?: string;
    employeeName?: string;
    metadata?: Record<string, unknown>;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Mock timeline data
    return [
      {
        id: 'timeline-dept-001',
        type: 'assignment',
        title: 'Gán thiết kế mới',
        description: 'Trần Thị B được gán thiết kế "Túi giấy sinh nhật ABC"',
        timestamp: '2024-11-01T09:00:00Z',
        employeeId: 'user-des001',
        employeeName: 'Trần Thị B',
        metadata: { designName: 'Túi giấy sinh nhật ABC', priority: 'high' }
      },
      {
        id: 'timeline-dept-002',
        type: 'completion',
        title: 'Hoàn thành thiết kế',
        description: 'Lê Văn C hoàn thành thiết kế "Brochure công ty DEF"',
        timestamp: '2024-11-01T15:30:00Z',
        employeeId: 'user-des002',
        employeeName: 'Lê Văn C',
        metadata: { designName: 'Brochure công ty DEF', completedEarly: true }
      },
      {
        id: 'timeline-dept-003',
        type: 'performance_alert',
        title: 'Cảnh báo workload',
        description: 'Phát hiện nhân viên có workload cao cần can thiệp',
        timestamp: '2024-11-03T08:00:00Z',
        employeeId: 'user-des002',
        employeeName: 'Lê Văn C',
        metadata: { workload: 85, threshold: 80 }
      }
    ].slice(0, limit);
  }

  // Generate department report
  static async generateDepartmentReport(departmentId: string, period: { start: string; end: string }): Promise<{
    department: Department;
    summary: {
      totalEmployees: number;
      productivity: number;
      completionRate: number;
      averageWorkload: number;
    };
    topPerformers: Employee[];
    bottomPerformers: Employee[];
    recommendations: string[];
    alerts: DepartmentAlert[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [department, performance, employees, alerts] = await Promise.all([
      this.getDepartmentById(departmentId),
      this.getDepartmentPerformance(departmentId, period),
      this.getDepartmentEmployees(departmentId),
      this.getDepartmentAlerts(departmentId)
    ]);

    if (!department) {
      throw new Error('Department not found');
    }

    const averageWorkload = employees.length > 0
      ? employees.reduce((sum, emp) => sum + emp.currentWorkload, 0) / employees.length
      : 0;

    // Sort employees by performance
    const sortedEmployees = employees.sort((a, b) => 
      (b.metrics?.completionRate || 0) - (a.metrics?.completionRate || 0)
    );

    const recommendations = [
      'Cân bằng lại workload giữa các nhân viên',
      'Tăng cường training cho nhân viên có hiệu suất thấp',
      'Thiết lập quy trình review định kỳ'
    ];

    return {
      department,
      summary: {
        totalEmployees: employees.length,
        productivity: performance.productivityScore,
        completionRate: performance.totalDesigns > 0 
          ? (performance.completedDesigns / performance.totalDesigns) * 100 
          : 0,
        averageWorkload
      },
      topPerformers: sortedEmployees.slice(0, 3),
      bottomPerformers: sortedEmployees.slice(-3).reverse(),
      recommendations,
      alerts: alerts.filter(alert => alert.actionRequired)
    };
  }
}

export default DepartmentManagementService;