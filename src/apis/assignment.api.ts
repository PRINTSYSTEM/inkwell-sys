import {
  Assignment,
  AssignmentTemplate,
  WorkloadBalance,
  AssignmentSuggestion,
  AssignmentFilter,
  AssignmentBulkAction,
  AssignmentHistory,
  AssignmentMetrics,
  TeamWorkload,
  AssignmentBoard,
  AssignmentFormData,
  AssignmentComment,
  AssignmentNotification,
  EmployeeAvailability,
  AssignmentMilestone
} from '@/types/assignment';
import { notificationService } from '@/services/notificationService';

class AssignmentManagementService {
  // Get assignments with filtering and pagination
  static async getAssignments(
    filter?: AssignmentFilter,
    page = 1,
    limit = 20
  ): Promise<{ assignments: Assignment[]; total: number; pages: number }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let assignments = this.generateMockAssignments();

    // Apply filters
    if (filter) {
      if (filter.status?.length) {
        assignments = assignments.filter((a) => filter.status!.includes(a.status));
      }
      if (filter.type?.length) {
        assignments = assignments.filter((a) => filter.type!.includes(a.type));
      }
      if (filter.priority?.length) {
        assignments = assignments.filter((a) => filter.priority!.includes(a.priority));
      }
      if (filter.assignedTo?.length) {
        assignments = assignments.filter((a) => a.assignedTo && filter.assignedTo!.includes(a.assignedTo));
      }
      if (filter.unassigned) {
        assignments = assignments.filter((a) => !a.assignedTo);
      }
      if (filter.overdue) {
        const now = new Date();
        assignments = assignments.filter((a) => new Date(a.deadline) < now && a.status !== 'completed');
      }
    }

    const total = assignments.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedAssignments = assignments.slice(start, start + limit);

    return {
      assignments: paginatedAssignments,
      total,
      pages,
    };
  }

  // Create new assignment
  static async createAssignment(data: AssignmentFormData): Promise<Assignment> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newAssignment: Assignment = {
      id: `assignment_${Date.now()}`,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      status: data.assignedTo ? 'assigned' : 'unassigned',
      assignedTo: data.assignedTo,
      assignedBy: 'current_user',
      estimatedHours: data.estimatedHours,
      deadline: data.deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requirements: data.requirements,
      skills: data.skills,
      materials: data.materials,
      progress: 0,
      milestones: [],
      tags: data.tags,
      department: 'dept_design',
      complexity: data.complexity,
      collaborators: data.collaborators,
      dependencies: data.dependencies,
      designId: data.designId,
      clientId: data.clientId,
    };

    // Send notification to assigned employee
    if (newAssignment.assignedTo) {
      await notificationService.sendAssignmentNotification(newAssignment.assignedTo, newAssignment.title, newAssignment.id, 'created');
    }

    return newAssignment;
  }

  // Update assignment
  static async updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const assignment = this.generateMockAssignments().find((a) => a.id === id);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const updatedAssignment: Assignment = {
      ...assignment,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Send notification if assignment is updated
    if (updatedAssignment.assignedTo) {
      await notificationService.sendAssignmentNotification(updatedAssignment.assignedTo, updatedAssignment.title, updatedAssignment.id, 'updated');
    }

    return updatedAssignment;
  }

  // Assign task to employee
  static async assignTask(assignmentId: string, employeeId: string): Promise<Assignment> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const assignment = this.generateMockAssignments().find((a) => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const updatedAssignment = {
      ...assignment,
      assignedTo: employeeId,
      status: 'assigned' as const,
      updatedAt: new Date().toISOString(),
    };

    // Send notification to newly assigned employee
    await notificationService.sendAssignmentNotification(employeeId, assignment.title, assignmentId, 'created');

    return updatedAssignment;
  }

  // Get assignment suggestions for optimal distribution
  static async getAssignmentSuggestions(assignmentId: string, considerWorkload = true): Promise<AssignmentSuggestion[]> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const suggestions: AssignmentSuggestion[] = [
      {
        assignmentId,
        employeeId: 'emp_001',
        employeeName: 'Nguyễn Văn A',
        confidence: 0.92,
        reasons: ['Có kinh nghiệm 5 năm với loại công việc này', 'Tỷ lệ hoàn thành đúng hạn 95%', 'Hiện tại workload ở mức 70%'],
        concerns: [],
        estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        workloadImpact: 0.15,
        skillMatch: 0.95,
        availabilityScore: 0.85,
      },
      {
        assignmentId,
        employeeId: 'emp_002',
        employeeName: 'Trần Thị B',
        confidence: 0.88,
        reasons: ['Chuyên môn phù hợp 90%', 'Có sẵn thời gian trong tuần tới'],
        concerns: ['Đang có 2 dự án ưu tiên cao'],
        estimatedCompletion: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        workloadImpact: 0.25,
        skillMatch: 0.9,
        availabilityScore: 0.7,
      },
      {
        assignmentId,
        employeeId: 'emp_003',
        employeeName: 'Lê Văn C',
        confidence: 0.75,
        reasons: ['Có thể học hỏi kỹ năng mới', 'Workload hiện tại thấp'],
        concerns: ['Cần thời gian làm quen với công việc', 'Chưa có kinh nghiệm với loại dự án này'],
        estimatedCompletion: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        workloadImpact: 0.3,
        skillMatch: 0.6,
        availabilityScore: 0.95,
      },
    ];

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Get team workload balance
  static async getTeamWorkload(departmentId?: string): Promise<TeamWorkload[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const departments = departmentId ? [departmentId] : ['dept_design', 'dept_production', 'dept_marketing'];

    return departments.map((deptId) => ({
      departmentId: deptId,
      departmentName: this.getDepartmentName(deptId),
      totalCapacity: 320, // 8 employees * 40 hours
      totalLoad: 250 + Math.random() * 100,
      utilizationRate: (250 + Math.random() * 100) / 320,
      employees: this.generateMockWorkloadBalance(deptId),
      recommendations: this.generateWorkloadRecommendations(),
    }));
  }

  // Bulk assign/reassign tasks
  static async bulkAssignTasks(action: AssignmentBulkAction): Promise<Assignment[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const assignments = this.generateMockAssignments().filter((a) => action.assignmentIds.includes(a.id));

    return assignments.map((assignment) => ({
      ...assignment,
      ...action.data,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Get assignment templates
  static async getAssignmentTemplates(): Promise<AssignmentTemplate[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return [
      {
        id: 'template_001',
        name: 'Thiết kế Logo',
        description: 'Template cho các dự án thiết kế logo',
        type: 'design',
        estimatedHours: 8,
        requirements: ['Brief khách hàng', 'Tài liệu thương hiệu'],
        skills: ['Adobe Illustrator', 'Typography', 'Brand Design'],
        complexity: 'medium',
        defaultMilestones: [
          {
            title: 'Nghiên cứu và concept',
            description: 'Tìm hiểu thương hiệu và tạo concept',
            dueDate: '2 days',
          },
          {
            title: 'Thiết kế drafts',
            description: 'Tạo 3-5 phương án thiết kế',
            dueDate: '4 days',
          },
          {
            title: 'Hoàn thiện',
            description: 'Tinh chỉnh và xuất file cuối',
            dueDate: '6 days',
          },
        ],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'template_002',
        name: 'Review Chất lượng',
        description: 'Template cho các task review chất lượng',
        type: 'review',
        estimatedHours: 4,
        requirements: ['File thiết kế hoàn chỉnh', 'Checklist chất lượng'],
        skills: ['Quality Control', 'Attention to Detail'],
        complexity: 'simple',
        defaultMilestones: [
          {
            title: 'Kiểm tra kỹ thuật',
            description: 'Đánh giá chất lượng kỹ thuật',
            dueDate: '1 day',
          },
          {
            title: 'Báo cáo',
            description: 'Tạo báo cáo và feedback',
            dueDate: '2 days',
          },
        ],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Get assignment history
  static async getAssignmentHistory(assignmentId: string): Promise<AssignmentHistory[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return [
      {
        id: 'history_001',
        assignmentId,
        action: 'created',
        performedBy: 'manager_001',
        performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        details: 'Tạo task mới từ template "Thiết kế Logo"',
      },
      {
        id: 'history_002',
        assignmentId,
        action: 'assigned',
        performedBy: 'manager_001',
        performedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        details: 'Phân công cho Nguyễn Văn A',
      },
    ];
  }

  // Get assignment metrics
  static async getAssignmentMetrics(departmentId?: string, timeframe = 30): Promise<AssignmentMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const total = 45 + Math.floor(Math.random() * 20);

    return {
      total,
      byStatus: {
        unassigned: Math.floor(total * 0.1),
        assigned: Math.floor(total * 0.2),
        in_progress: Math.floor(total * 0.4),
        review: Math.floor(total * 0.1),
        completed: Math.floor(total * 0.15),
        cancelled: Math.floor(total * 0.05),
      },
      byPriority: {
        low: Math.floor(total * 0.3),
        medium: Math.floor(total * 0.4),
        high: Math.floor(total * 0.2),
        urgent: Math.floor(total * 0.1),
      },
      byType: {
        design: Math.floor(total * 0.5),
        review: Math.floor(total * 0.2),
        production: Math.floor(total * 0.2),
        quality_check: Math.floor(total * 0.05),
        maintenance: Math.floor(total * 0.05),
      },
      avgCompletionTime: 3.5 + Math.random() * 2,
      onTimeRate: 0.85 + Math.random() * 0.1,
      overdue: Math.floor(total * 0.08),
      unassigned: Math.floor(total * 0.1),
    };
  }

  // Get assignment boards (Kanban-style)
  static async getAssignmentBoards(): Promise<AssignmentBoard[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return [
      {
        id: 'board_default',
        name: 'Bảng công việc chính',
        description: 'Bảng theo dõi tất cả assignments',
        columns: [
          {
            id: 'col_unassigned',
            title: 'Chưa phân công',
            status: 'unassigned',
            assignments: [],
            color: '#gray-500',
          },
          {
            id: 'col_assigned',
            title: 'Đã phân công',
            status: 'assigned',
            assignments: [],
            color: '#blue-500',
          },
          {
            id: 'col_in_progress',
            title: 'Đang thực hiện',
            status: 'in_progress',
            assignments: [],
            color: '#yellow-500',
          },
          {
            id: 'col_review',
            title: 'Đang review',
            status: 'review',
            assignments: [],
            color: '#purple-500',
          },
          {
            id: 'col_completed',
            title: 'Hoàn thành',
            status: 'completed',
            assignments: [],
            color: '#green-500',
          },
        ],
        filters: {},
        groupBy: 'status',
        sortBy: 'priority',
        isDefault: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Add comment to assignment
  static async addAssignmentComment(assignmentId: string, content: string, isInternal = false): Promise<AssignmentComment> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      id: `comment_${Date.now()}`,
      assignmentId,
      authorId: 'current_user',
      authorName: 'Current User',
      content,
      createdAt: new Date().toISOString(),
      isInternal,
    };
  }

  // Get employee availability
  static async getEmployeeAvailability(employeeId?: string): Promise<EmployeeAvailability[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const employees = employeeId ? [employeeId] : ['emp_001', 'emp_002', 'emp_003', 'emp_004'];

    return employees.map((empId) => ({
      employeeId: empId,
      weeklyCapacity: 40,
      currentWeekLoad: 25 + Math.random() * 20,
      nextWeekLoad: 20 + Math.random() * 25,
      vacationDays: [],
      busyDates: [],
      preferredWorkload: 35,
      overtimeAllowed: true,
    }));
  }

  // Private helper methods
  private static generateMockAssignments(): Assignment[] {
    const assignments: Assignment[] = [];
    const types: Assignment['type'][] = ['design', 'review', 'production', 'quality_check'];
    const priorities: Assignment['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const statuses: Assignment['status'][] = ['unassigned', 'assigned', 'in_progress', 'review', 'completed'];

    for (let i = 1; i <= 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const daysOffset = Math.random() * 14; // 0-14 days from now

      assignments.push({
        id: `assignment_${i.toString().padStart(3, '0')}`,
        title: `Task ${i} - ${types[Math.floor(Math.random() * types.length)]}`,
        description: `Mô tả chi tiết cho task ${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status,
        assignedTo: status !== 'unassigned' ? `emp_${(i % 10 + 1).toString().padStart(3, '0')}` : undefined,
        assignedBy: 'manager_001',
        estimatedHours: 4 + Math.random() * 16,
        actualHours: status === 'completed' ? 3 + Math.random() * 18 : undefined,
        deadline: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - (14 - daysOffset) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        requirements: ['Requirement 1', 'Requirement 2'],
        skills: ['Skill A', 'Skill B'],
        materials: ['Material X', 'Material Y'],
        progress: status === 'completed' ? 100 : Math.random() * 80,
        milestones: [],
        tags: ['urgent', 'client-project'],
        department: 'dept_design',
        complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)] as Assignment['complexity'],
        designId: `design_${i}`,
        clientName: `Client ${String.fromCharCode(65 + (i % 26))}`,
      });
    }

    return assignments;
  }

  private static generateMockWorkloadBalance(departmentId: string): WorkloadBalance[] {
    return Array.from({ length: 6 }, (_, i) => ({
      employeeId: `emp_${departmentId}_${i + 1}`,
      employeeName: `Nhân viên ${i + 1}`,
      currentLoad: 20 + Math.random() * 25,
      capacity: 40,
      utilizationRate: (20 + Math.random() * 25) / 40,
      assignments: [],
      availability: {
        employeeId: `emp_${departmentId}_${i + 1}`,
        weeklyCapacity: 40,
        currentWeekLoad: 20 + Math.random() * 20,
        nextWeekLoad: 15 + Math.random() * 25,
        vacationDays: [],
        busyDates: [],
        preferredWorkload: 35,
        overtimeAllowed: true,
      },
      skills: ['Design', 'Adobe Creative Suite', 'Typography'],
      department: this.getDepartmentName(departmentId),
      performance: {
        averageRating: 3.5 + Math.random() * 1.5,
        completionRate: 0.8 + Math.random() * 0.2,
        onTimeRate: 0.75 + Math.random() * 0.25,
      },
    }));
  }

  private static generateWorkloadRecommendations() {
    return [
      {
        type: 'redistribute' as const,
        priority: 'medium' as const,
        description: 'Cân bằng lại workload giữa các nhân viên',
        impact: 'Giảm 15% thời gian overdue',
        actionItems: ['Chuyển 2 task từ Nhân viên A sang Nhân viên B'],
        affectedEmployees: ['emp_001', 'emp_002'],
      },
    ];
  }

  private static getDepartmentName(departmentId: string): string {
    const names: Record<string, string> = {
      dept_design: 'Phòng Thiết kế',
      dept_production: 'Phòng Sản xuất',
      dept_marketing: 'Phòng Marketing',
    };
    return names[departmentId] || 'Phòng ban';
  }
}

export { AssignmentManagementService };
export const assignmentApi = AssignmentManagementService;

export default AssignmentManagementService;
