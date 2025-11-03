import {
  Employee,
  EmployeeMetrics,
  EmployeeAssignment,
  WorkTimelineEntry,
  PerformanceComparison,
  EmployeeDashboard,
  Achievement,
  DepartmentPerformance,
  WorkloadDistribution
} from '@/types/employee';

// Mock assignment data
const mockAssignments: EmployeeAssignment[] = [
  {
    id: 'assign-001',
    employeeId: 'user-des001',
    employeeName: 'Trần Thị B',
    designId: 'design-001',
    designName: 'Túi giấy sinh nhật ABC',
    designCode: 'DC001',
    assignedBy: 'user-dm001',
    assignedAt: '2024-11-01T09:00:00Z',
    dueDate: '2024-11-05T17:00:00Z',
    deadline: '2024-11-05T17:00:00Z',
    status: 'in_progress',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    progress: 65,
    notes: 'Khách hàng yêu cầu thiết kế màu sắc tươi sáng'
  },
  {
    id: 'assign-002',
    employeeId: 'user-des001',
    employeeName: 'Trần Thị B',
    designId: 'design-002',
    designName: 'Nhãn dán sản phẩm XYZ',
    designCode: 'DC002',
    assignedBy: 'user-dm001',
    assignedAt: '2024-10-28T14:00:00Z',
    dueDate: '2024-11-03T12:00:00Z',
    deadline: '2024-11-03T12:00:00Z',
    status: 'review',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 4,
    progress: 90,
    notes: 'Cần review lần cuối trước khi gửi khách'
  },
  {
    id: 'assign-003',
    employeeId: 'user-des002',
    employeeName: 'Lê Văn C',
    designId: 'design-003',
    designName: 'Brochure công ty DEF',
    designCode: 'DC003',
    assignedBy: 'user-dm001',
    assignedAt: '2024-10-25T10:00:00Z',
    dueDate: '2024-10-30T17:00:00Z',
    deadline: '2024-10-30T17:00:00Z',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 12,
    actualHours: 10,
    progress: 100,
    rating: 9,
    completedAt: '2024-10-29T16:30:00Z',
    notes: 'Hoàn thành trước deadline, chất lượng tốt'
  },
  {
    id: 'assign-004',
    employeeId: 'user-des002',
    employeeName: 'Lê Văn C',
    designId: 'design-004',
    designName: 'Logo thương hiệu mới',
    designCode: 'DC004',
    assignedBy: 'user-dm001',
    assignedAt: '2024-10-25T10:00:00Z',
    dueDate: '2024-11-02T16:00:00Z',
    deadline: '2024-11-02T16:00:00Z',
    status: 'completed',
    priority: 'low',
    estimatedHours: 12,
    actualHours: 10,
    progress: 100,
    rating: 8,
    completedAt: '2024-11-01T15:30:00Z',
    notes: 'Hoàn thành sớm hơn dự kiến'
  },
  {
    id: 'assign-005',
    employeeId: 'user-des002',
    employeeName: 'Lê Văn C',
    designId: 'design-005',
    designName: 'Poster quảng cáo sự kiện',
    designCode: 'DC005',
    assignedBy: 'user-dm001',
    assignedAt: '2024-11-02T08:00:00Z',
    dueDate: '2024-11-08T17:00:00Z',
    deadline: '2024-11-08T17:00:00Z',
    status: 'assigned',
    priority: 'urgent',
    estimatedHours: 6,
    progress: 0,
    notes: 'Sự kiện quan trọng, cần hoàn thành đúng deadline'
  }
];

// Mock timeline data
const mockTimeline: WorkTimelineEntry[] = [
  {
    id: 'timeline-001',
    type: 'assignment',
    designId: 'design-001',
    designName: 'Túi giấy sinh nhật ABC',
    description: 'Được gán thiết kế mới',
    timestamp: '2024-11-01T09:00:00Z',
    performedBy: 'user-dm001',
    performedByName: 'Nguyễn Văn A',
    metadata: { priority: 'high', estimatedHours: 8 }
  },
  {
    id: 'timeline-002',
    type: 'status_change',
    designId: 'design-001',
    designName: 'Túi giấy sinh nhật ABC',
    description: 'Bắt đầu thực hiện thiết kế',
    timestamp: '2024-11-01T10:30:00Z',
    performedBy: 'user-des001',
    performedByName: 'Trần Thị B',
    metadata: { oldStatus: 'assigned', newStatus: 'in_progress' }
  },
  {
    id: 'timeline-003',
    type: 'completion',
    designId: 'design-003',
    designName: 'Brochure công ty DEF',
    description: 'Hoàn thành thiết kế',
    timestamp: '2024-11-01T15:30:00Z',
    performedBy: 'user-des002',
    performedByName: 'Lê Văn C',
    metadata: { actualHours: 10, estimatedHours: 12 }
  }
];

// Mock achievements
const mockAchievements: Achievement[] = [
  {
    id: 'achieve-001',
    title: 'Hoàn thành sớm',
    description: 'Hoàn thành 5 thiết kế sớm hơn deadline',
    category: 'speed',
    earnedAt: '2024-10-15T00:00:00Z'
  },
  {
    id: 'achieve-002',
    title: 'Chất lượng cao',
    description: 'Đạt điểm chất lượng trung bình 95/100',
    category: 'quality',
    earnedAt: '2024-10-30T00:00:00Z'
  },
  {
    id: 'achieve-003',
    title: 'Năng suất cao',
    description: 'Hoàn thành 25 thiết kế trong tháng',
    category: 'productivity',
    earnedAt: '2024-10-31T00:00:00Z'
  }
];

export class EmployeePerformanceService {
  // Get employee assignments
  static async getEmployeeAssignments(employeeId: string, status?: EmployeeAssignment['status']): Promise<EmployeeAssignment[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let assignments = mockAssignments.filter(assign => assign.employeeId === employeeId);
    
    if (status) {
      assignments = assignments.filter(assign => assign.status === status);
    }

    // Add mock additional data for assignments
    return assignments.map(assignment => ({
      ...assignment,
      designCode: assignment.designCode || `DC${assignment.designId.split('-')[1].padStart(3, '0')}`,
      deadline: assignment.deadline || assignment.dueDate,
      progress: assignment.progress || (
        assignment.status === 'completed' ? 100 :
        assignment.status === 'in_progress' ? Math.floor(Math.random() * 80) + 20 :
        assignment.status === 'review' ? Math.floor(Math.random() * 20) + 80 : 0
      ),
      rating: assignment.status === 'completed' ? Math.floor(Math.random() * 3) + 8 : undefined
    })).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }

  // Get all assignments (for managers)
  static async getAllAssignments(filters?: {
    employeeId?: string;
    status?: EmployeeAssignment['status'];
    priority?: EmployeeAssignment['priority'];
    departmentId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<EmployeeAssignment[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    let assignments = [...mockAssignments];

    if (filters?.employeeId) {
      assignments = assignments.filter(assign => assign.employeeId === filters.employeeId);
    }

    if (filters?.status) {
      assignments = assignments.filter(assign => assign.status === filters.status);
    }

    if (filters?.priority) {
      assignments = assignments.filter(assign => assign.priority === filters.priority);
    }

    if (filters?.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      assignments = assignments.filter(assign => {
        const assignDate = new Date(assign.assignedAt);
        return assignDate >= startDate && assignDate <= endDate;
      });
    }

    return assignments.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }

  // Create new assignment
  static async createAssignment(assignmentData: Omit<EmployeeAssignment, 'id'>): Promise<EmployeeAssignment> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAssignment: EmployeeAssignment = {
      id: `assign-${Date.now()}`,
      ...assignmentData
    };

    mockAssignments.push(newAssignment);
    return newAssignment;
  }

  // Update assignment
  static async updateAssignment(id: string, updates: Partial<EmployeeAssignment>): Promise<EmployeeAssignment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const assignmentIndex = mockAssignments.findIndex(assign => assign.id === id);
    if (assignmentIndex === -1) {
      throw new Error('Assignment not found');
    }

    const updatedAssignment = {
      ...mockAssignments[assignmentIndex],
      ...updates
    };

    mockAssignments[assignmentIndex] = updatedAssignment;
    return updatedAssignment;
  }

  // Get employee work timeline
  static async getEmployeeTimeline(employeeId: string, limit = 20): Promise<WorkTimelineEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // In real implementation, would filter by employee assignments
    return mockTimeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Calculate employee metrics
  static async calculateEmployeeMetrics(employeeId: string, period?: { start: string; end: string }): Promise<EmployeeMetrics> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const assignments = mockAssignments.filter(assign => assign.employeeId === employeeId);
    
    let filteredAssignments = assignments;
    if (period) {
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      filteredAssignments = assignments.filter(assign => {
        const assignDate = new Date(assign.assignedAt);
        return assignDate >= startDate && assignDate <= endDate;
      });
    }

    const totalDesigns = filteredAssignments.length;
    const completedDesigns = filteredAssignments.filter(assign => assign.status === 'completed').length;
    const inProgressDesigns = filteredAssignments.filter(assign => assign.status === 'in_progress').length;
    const pendingDesigns = filteredAssignments.filter(assign => assign.status === 'assigned').length;

    const completedWithTime = filteredAssignments.filter(assign => 
      assign.status === 'completed' && assign.actualHours && assign.estimatedHours
    );

    const averageCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, assign) => sum + (assign.actualHours || 0), 0) / completedWithTime.length
      : 0;

    const completionRate = totalDesigns > 0 ? (completedDesigns / totalDesigns) * 100 : 0;

    // Calculate workload score (based on current assignments and capacity)
    const currentLoad = inProgressDesigns + pendingDesigns;
    const workloadScore = Math.min(currentLoad * 20, 100); // Simple calculation

    // Calculate average score (based on completed assignments rating)
    const completedWithRating = filteredAssignments.filter(assign => 
      assign.status === 'completed' && assign.rating
    );
    const averageScore = completedWithRating.length > 0
      ? completedWithRating.reduce((sum, assign) => sum + (assign.rating || 0), 0) / completedWithRating.length
      : Math.random() * 3 + 7; // Mock: 7-10 range

    // Calculate quality score
    const qualityScore = Math.min(averageScore * 10, 100);

    return {
      totalDesigns,
      completedDesigns,
      inProgressDesigns,
      pendingDesigns,
      averageCompletionTime,
      completionRate,
      workloadScore,
      averageScore,
      qualityScore,
      lastActivityDate: new Date().toISOString().split('T')[0],
      monthlyMetrics: [
        { month: '2024-10', designsCompleted: 18, averageTime: 2.5, qualityScore: 88 },
        { month: '2024-09', designsCompleted: 20, averageTime: 2.9, qualityScore: 90 }
      ]
    };
  }

  // Get performance comparison
  static async getPerformanceComparison(employeeId: string): Promise<PerformanceComparison> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentMetrics = await this.calculateEmployeeMetrics(employeeId);
    
    // Mock previous period data
    const previousMetrics: EmployeeMetrics = {
      totalDesigns: 45,
      completedDesigns: 40,
      inProgressDesigns: 3,
      pendingDesigns: 2,
      averageCompletionTime: 3.1,
      completionRate: 88.9,
      workloadScore: 60,
      averageScore: 8.5,
      qualityScore: 85,
      lastActivityDate: '2024-09-30',
      monthlyMetrics: [
        { month: '2024-09', designsCompleted: 20, averageTime: 2.9, qualityScore: 90 },
        { month: '2024-08', designsCompleted: 22, averageTime: 3.2, qualityScore: 85 }
      ]
    };

    return {
      employeeId,
      employeeName: 'Trần Thị B', // Would fetch from user data
      currentPeriod: currentMetrics,
      previousPeriod: previousMetrics,
      improvement: {
        completionRate: currentMetrics.completionRate - previousMetrics.completionRate,
        averageTime: previousMetrics.averageCompletionTime - currentMetrics.averageCompletionTime,
        workloadManagement: currentMetrics.workloadScore - previousMetrics.workloadScore
      },
      ranking: {
        departmentRank: 2,
        companyRank: 5,
        totalInDepartment: 8,
        totalInCompany: 30
      }
    };
  }

  // Get employee dashboard data
  static async getEmployeeDashboard(employeeId: string): Promise<EmployeeDashboard> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // This would fetch from UserManagementService in real implementation
    const employee = {
      id: employeeId,
      fullName: 'Trần Thị B',
      // ... other employee data
    } as Employee;

    const currentAssignments = await this.getEmployeeAssignments(employeeId, 'in_progress');
    const recentWork = await this.getEmployeeTimeline(employeeId, 10);
    const performance = await this.calculateEmployeeMetrics(employeeId);
    
    const upcomingDeadlines = mockAssignments
      .filter(assign => assign.employeeId === employeeId && assign.dueDate)
      .filter(assign => new Date(assign.dueDate!) > new Date())
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    return {
      employee,
      currentAssignments,
      recentWork,
      performance,
      upcomingDeadlines,
      achievements: mockAchievements
    };
  }

  // Get department performance overview
  static async getDepartmentPerformance(departmentId: string): Promise<DepartmentPerformance> {
    await new Promise(resolve => setTimeout(resolve, 700));

    // Mock department employees (would fetch from UserManagementService)
    const departmentEmployees = [
      { id: 'user-des001', fullName: 'Trần Thị B', currentWorkload: 68 },
      { id: 'user-des002', fullName: 'Lê Văn C', currentWorkload: 85 },
      { id: 'user-des003', fullName: 'Phạm Văn D', currentWorkload: 45 }
    ] as Employee[];

    const totalEmployees = departmentEmployees.length;
    const activeEmployees = departmentEmployees.filter(emp => emp.status === 'active').length;
    
    // Calculate department totals
    const departmentAssignments = mockAssignments.filter(assign => 
      departmentEmployees.some(emp => emp.id === assign.employeeId)
    );

    const totalDesigns = departmentAssignments.length;
    const completedDesigns = departmentAssignments.filter(assign => assign.status === 'completed').length;
    
    const completedWithTime = departmentAssignments.filter(assign => 
      assign.status === 'completed' && assign.actualHours && assign.estimatedHours
    );
    
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, assign) => sum + (assign.actualHours || 0), 0) / completedWithTime.length
      : 0;

    const productivityScore = totalDesigns > 0 ? (completedDesigns / totalDesigns) * 100 : 0;

    const workloadDistribution: WorkloadDistribution[] = departmentEmployees.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.fullName,
      currentWorkload: emp.currentWorkload,
      assignedDesigns: mockAssignments.filter(assign => assign.employeeId === emp.id && assign.status !== 'completed').length,
      capacity: 100
    }));

    return {
      departmentId,
      departmentName: 'Phòng Thiết kế',
      totalEmployees,
      activeEmployees,
      totalDesigns,
      completedDesigns,
      avgCompletionTime,
      productivityScore,
      workloadDistribution,
      topPerformers: departmentEmployees.slice(0, 3)
    };
  }

  // Get workload analysis
  static async getWorkloadAnalysis(employeeIds?: string[]): Promise<WorkloadDistribution[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const employees = [
      { id: 'user-des001', fullName: 'Trần Thị B' },
      { id: 'user-des002', fullName: 'Lê Văn C' },
      { id: 'user-des003', fullName: 'Phạm Văn D' }
    ];

    const targetEmployees = employeeIds 
      ? employees.filter(emp => employeeIds.includes(emp.id))
      : employees;

    return targetEmployees.map(emp => {
      const assignments = mockAssignments.filter(assign => 
        assign.employeeId === emp.id && assign.status !== 'completed'
      );

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        currentWorkload: Math.min(assignments.length * 15, 100),
        assignedDesigns: assignments.length,
        capacity: 100
      };
    });
  }

  // Get upcoming deadlines
  static async getUpcomingDeadlines(employeeId?: string, days = 7): Promise<EmployeeAssignment[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    let assignments = mockAssignments.filter(assign => 
      assign.dueDate && 
      assign.status !== 'completed' &&
      new Date(assign.dueDate) <= futureDate &&
      new Date(assign.dueDate) > now
    );

    if (employeeId) {
      assignments = assignments.filter(assign => assign.employeeId === employeeId);
    }

    return assignments.sort((a, b) => 
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
  }

  // Generate productivity report
  static async generateProductivityReport(params: {
    employeeIds?: string[];
    departmentId?: string;
    period: { start: string; end: string };
  }): Promise<{
    summary: {
      totalDesigns: number;
      completedDesigns: number;
      averageCompletionTime: number;
      productivityScore: number;
    };
    employeeBreakdown: Array<{
      employeeId: string;
      employeeName: string;
      metrics: EmployeeMetrics;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // In real implementation, would calculate based on actual data
    return {
      summary: {
        totalDesigns: 150,
        completedDesigns: 135,
        averageCompletionTime: 3.2,
        productivityScore: 90
      },
      employeeBreakdown: [
        {
          employeeId: 'user-des001',
          employeeName: 'Trần Thị B',
          metrics: await this.calculateEmployeeMetrics('user-des001', params.period)
        },
        {
          employeeId: 'user-des002',
          employeeName: 'Lê Văn C',
          metrics: await this.calculateEmployeeMetrics('user-des002', params.period)
        }
      ]
    };
  }

  // Update assignment status
  static async updateAssignmentStatus(assignmentId: string, status: EmployeeAssignment['status']): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const assignment = mockAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    assignment.status = status;
    
    if (status === 'completed') {
      assignment.completedAt = new Date().toISOString();
      assignment.progress = 100;
    } else if (status === 'in_progress') {
      assignment.progress = Math.min(assignment.progress || 0, 80);
    }

    return true;
  }

  // Get employee metrics
  static async getEmployeeMetrics(employeeId: string): Promise<EmployeeMetrics> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.calculateEmployeeMetrics(employeeId);
  }

  // Assign new work to employee
  static async assignWork(employeeId: string, designId: string, assignmentData: {
    priority: 'low' | 'medium' | 'high';
    estimatedHours: number;
    dueDate: string;
    notes?: string;
  }): Promise<EmployeeAssignment> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAssignment: EmployeeAssignment = {
      id: `assign-${Date.now()}`,
      employeeId,
      employeeName: 'Employee Name', // Would fetch from user service
      designId,
      designName: 'Design Name', // Would fetch from design service
      designCode: `DC${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      assignedBy: 'current-manager-id',
      assignedAt: new Date().toISOString(),
      dueDate: assignmentData.dueDate,
      deadline: assignmentData.dueDate,
      status: 'pending',
      priority: assignmentData.priority,
      estimatedHours: assignmentData.estimatedHours,
      progress: 0,
      notes: assignmentData.notes
    };

    mockAssignments.push(newAssignment);
    return newAssignment;
  }

  // Get employee workload analysis
  static async getEmployeeWorkloadAnalysis(employeeId: string): Promise<{
    current: number;
    capacity: number;
    assignments: EmployeeAssignment[];
    recommendations: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const assignments = await this.getEmployeeAssignments(employeeId);
    const activeAssignments = assignments.filter(a => 
      a.status === 'pending' || a.status === 'in_progress'
    );

    const currentWorkload = activeAssignments.reduce((sum, a) => 
      sum + (a.estimatedHours || 0), 0
    );

    const capacity = 40; // 40 hours per week capacity
    const utilizationRate = (currentWorkload / capacity) * 100;

    const recommendations = [];
    if (utilizationRate > 90) {
      recommendations.push('Nhân viên đang quá tải, cần phân bổ lại công việc');
    } else if (utilizationRate < 50) {
      recommendations.push('Nhân viên còn dư thời gian, có thể gán thêm công việc');
    }

    return {
      current: Math.round(utilizationRate),
      capacity: 100,
      assignments: activeAssignments,
      recommendations
    };
  }
}

export default EmployeePerformanceService;