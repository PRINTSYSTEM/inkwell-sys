import {
  DesignAssignment,
  CreateDesignAssignment,
  UpdateDesignAssignment,
  DesignAssignmentFilter,
  DesignAssignmentStats,
  DesignAssignmentStatus,
  DesignAssignmentPriority,
  validateSchema,
  DesignAssignmentSchema,
  CreateDesignAssignmentSchema,
  UpdateDesignAssignmentSchema,
  DesignAssignmentFilterSchema,
} from "@/Schema";

// Mock data - sẽ được thay thế bằng API calls thực tế
const mockAssignments: DesignAssignment[] = [
  {
    id: "da-001",
    designCodeId: "dc-001",
    designerId: "emp-001",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-11-01"),
    deadline: new Date("2024-11-15"),
    startedAt: new Date("2024-11-02"),
    status: "in_progress",
    priority: "high",
    progressPercentage: 65,
    estimatedHours: 40,
    actualHours: 26,
    title: "Thiết kế hộp đóng gói sản phẩm A",
    description:
      "Thiết kế hộp đóng gói cho sản phẩm mới của khách hàng ABC Corp",
    notes: "Khách hàng yêu cầu màu sắc tươi sáng và có logo nổi bật",
    revisionCount: 2,
    lastRevisionDate: new Date("2024-11-05"),
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-06"),
  },
  {
    id: "da-002",
    designCodeId: "dc-002",
    designerId: "emp-002",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-11-03"),
    deadline: new Date("2024-11-20"),
    status: "pending",
    priority: "medium",
    progressPercentage: 0,
    estimatedHours: 30,
    title: "Thiết kế nhãn chai nước",
    description: "Thiết kế nhãn mới cho dòng nước uống premium",
    revisionCount: 0,
    createdAt: new Date("2024-11-03"),
    updatedAt: new Date("2024-11-03"),
  },
  {
    id: "da-003",
    designCodeId: "dc-003",
    designerId: "emp-001",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-10-28"),
    deadline: new Date("2024-11-08"),
    startedAt: new Date("2024-10-29"),
    completedAt: new Date("2024-11-07"),
    status: "completed",
    priority: "urgent",
    progressPercentage: 100,
    estimatedHours: 20,
    actualHours: 18,
    title: "Banner quảng cáo tết",
    description: "Thiết kế banner cho chiến dịch marketing tết nguyên đán",
    notes: "Hoàn thành sớm hơn deadline 1 ngày",
    revisionCount: 1,
    lastRevisionDate: new Date("2024-11-02"),
    createdAt: new Date("2024-10-28"),
    updatedAt: new Date("2024-11-07"),
  },
  {
    id: "da-004",
    designCodeId: "dc-004",
    designerId: "emp-002",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-11-04"),
    deadline: new Date("2024-11-02"), // Overdue
    startedAt: new Date("2024-11-05"),
    status: "review",
    priority: "high",
    progressPercentage: 90,
    estimatedHours: 25,
    actualHours: 30,
    title: "Thiết kế catalogue sản phẩm",
    description: "Thiết kế catalogue cho dòng sản phẩm mới",
    notes: "Cần review và feedback từ khách hàng",
    revisionCount: 3,
    lastRevisionDate: new Date("2024-11-06"),
    createdAt: new Date("2024-11-04"),
    updatedAt: new Date("2024-11-06"),
  },
  {
    id: "da-005",
    designCodeId: "dc-005",
    designerId: "emp-003",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-11-05"),
    deadline: new Date("2024-11-25"),
    status: "pending",
    priority: "low",
    progressPercentage: 0,
    estimatedHours: 35,
    title: "Thiết kế logo công ty mới",
    description: "Thiết kế identity brand cho startup công nghệ",
    revisionCount: 0,
    createdAt: new Date("2024-11-05"),
    updatedAt: new Date("2024-11-05"),
  },
  {
    id: "da-006",
    designCodeId: "dc-006",
    designerId: "emp-003",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-11-01"),
    deadline: new Date("2024-11-18"),
    startedAt: new Date("2024-11-02"),
    status: "revision",
    priority: "medium",
    progressPercentage: 75,
    estimatedHours: 28,
    actualHours: 22,
    title: "Thiết kế website landing page",
    description: "Thiết kế UI/UX cho trang landing page campaign",
    notes: "Cần sửa đổi theo feedback của client",
    revisionCount: 2,
    lastRevisionDate: new Date("2024-11-06"),
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-06"),
  },
  {
    id: "da-007",
    designCodeId: "dc-007",
    designerId: "emp-004",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-10-30"),
    deadline: new Date("2024-11-12"),
    startedAt: new Date("2024-10-31"),
    status: "in_progress",
    priority: "high",
    progressPercentage: 50,
    estimatedHours: 45,
    actualHours: 20,
    title: "Thiết kế packaging cho dòng mỹ phẩm",
    description: "Thiết kế bao bì cho 5 sản phẩm skincare cao cấp",
    notes: "Yêu cầu phong cách luxury, minimalist",
    revisionCount: 1,
    lastRevisionDate: new Date("2024-11-04"),
    createdAt: new Date("2024-10-30"),
    updatedAt: new Date("2024-11-06"),
  },
  {
    id: "da-008",
    designCodeId: "dc-008",
    designerId: "emp-004",
    assignedBy: "emp-manager-001",
    assignedAt: new Date("2024-10-25"),
    deadline: new Date("2024-11-10"),
    startedAt: new Date("2024-10-26"),
    completedAt: new Date("2024-11-09"),
    status: "completed",
    priority: "medium",
    progressPercentage: 100,
    estimatedHours: 32,
    actualHours: 35,
    title: "Thiết kế brochure triển lãm",
    description: "Thiết kế brochure cho gian hàng triển lãm quốc tế",
    notes: "Hoàn thành đúng deadline",
    revisionCount: 2,
    lastRevisionDate: new Date("2024-11-05"),
    createdAt: new Date("2024-10-25"),
    updatedAt: new Date("2024-11-09"),
  },
];

export class DesignAssignmentService {
  /**
   * Get assignments by designer ID
   */
  static async getAssignmentsByDesigner(
    designerId: string,
    filter?: Partial<DesignAssignmentFilter>
  ): Promise<{ data: DesignAssignment[]; total: number }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

      let filteredAssignments = mockAssignments.filter(
        (assignment) => assignment.designerId === designerId
      );

      // Apply additional filters
      if (filter) {
        if (filter.status) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.status === filter.status
          );
        }

        if (filter.priority) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.priority === filter.priority
          );
        }

        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filteredAssignments = filteredAssignments.filter(
            (assignment) =>
              assignment.title.toLowerCase().includes(searchLower) ||
              assignment.description?.toLowerCase().includes(searchLower)
          );
        }

        if (filter.dateFrom) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.assignedAt >= filter.dateFrom!
          );
        }

        if (filter.dateTo) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.assignedAt <= filter.dateTo!
          );
        }
      }

      // Apply sorting
      const sortBy = filter?.sortBy || "assignedAt";
      const sortOrder = filter?.sortOrder || "desc";

      filteredAssignments.sort((a, b) => {
        const aValue = a[sortBy as keyof DesignAssignment];
        const bValue = b[sortBy as keyof DesignAssignment];

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedAssignments = filteredAssignments.slice(
        startIndex,
        startIndex + limit
      );

      return {
        data: paginatedAssignments,
        total: filteredAssignments.length,
      };
    } catch (error) {
      console.error("Error fetching assignments by designer:", error);
      throw new Error("Failed to fetch assignments");
    }
  }

  /**
   * Get assignments by department
   */
  static async getAssignmentsByDepartment(
    departmentId: string,
    filter?: Partial<DesignAssignmentFilter>
  ): Promise<{ data: DesignAssignment[]; total: number }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // In real implementation, this would filter by designers in the department
      // For now, return all assignments with filters applied
      let filteredAssignments = [...mockAssignments];

      // Apply filters (same logic as getAssignmentsByDesigner)
      if (filter) {
        if (filter.designerId) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.designerId === filter.designerId
          );
        }

        if (filter.status) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.status === filter.status
          );
        }

        if (filter.priority) {
          filteredAssignments = filteredAssignments.filter(
            (assignment) => assignment.priority === filter.priority
          );
        }

        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filteredAssignments = filteredAssignments.filter(
            (assignment) =>
              assignment.title.toLowerCase().includes(searchLower) ||
              assignment.description?.toLowerCase().includes(searchLower)
          );
        }
      }

      return {
        data: filteredAssignments,
        total: filteredAssignments.length,
      };
    } catch (error) {
      console.error("Error fetching assignments by department:", error);
      throw new Error("Failed to fetch department assignments");
    }
  }

  /**
   * Create new assignment
   */
  static async createAssignment(
    assignmentData: CreateDesignAssignment
  ): Promise<DesignAssignment> {
    try {
      const validation = validateSchema(
        CreateDesignAssignmentSchema,
        assignmentData
      );
      if (!validation.success) {
        throw new Error(
          `Validation error: ${validation.errors.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newAssignment: DesignAssignment = {
        ...validation.data,
        id: `da-${Date.now()}`,
        progressPercentage: 0,
        revisionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAssignments.push(newAssignment);
      return newAssignment;
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw error;
    }
  }

  /**
   * Update assignment status and other fields
   */
  static async updateAssignmentStatus(
    assignmentId: string,
    updateData: Partial<UpdateDesignAssignment>
  ): Promise<DesignAssignment> {
    try {
      const validation = validateSchema(
        UpdateDesignAssignmentSchema,
        updateData
      );
      if (!validation.success) {
        throw new Error(
          `Validation error: ${validation.errors.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const assignmentIndex = mockAssignments.findIndex(
        (a) => a.id === assignmentId
      );
      if (assignmentIndex === -1) {
        throw new Error("Assignment not found");
      }

      const updatedAssignment = {
        ...mockAssignments[assignmentIndex],
        ...validation.data,
        updatedAt: new Date(),
      };

      // Auto-set completion date when status changes to completed
      if (updateData.status === "completed" && !updatedAssignment.completedAt) {
        updatedAssignment.completedAt = new Date();
        updatedAssignment.progressPercentage = 100;
      }

      // Auto-set started date when status changes to in_progress
      if (updateData.status === "in_progress" && !updatedAssignment.startedAt) {
        updatedAssignment.startedAt = new Date();
      }

      mockAssignments[assignmentIndex] = updatedAssignment;
      return updatedAssignment;
    } catch (error) {
      console.error("Error updating assignment:", error);
      throw error;
    }
  }

  /**
   * Get designer workload statistics
   */
  static async getDesignerWorkload(designerId: string): Promise<{
    activeAssignments: number;
    totalWorkload: number; // percentage
    overdueAssignments: number;
    completedThisMonth: number;
    averageCompletionTime: number; // in days
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const designerAssignments = mockAssignments.filter(
        (assignment) => assignment.designerId === designerId
      );

      const activeStatuses: DesignAssignmentStatus[] = [
        "pending",
        "in_progress",
        "review",
        "revision",
      ];
      const activeAssignments = designerAssignments.filter((assignment) =>
        activeStatuses.includes(assignment.status)
      );

      const now = new Date();
      const overdueAssignments = activeAssignments.filter(
        (assignment) => assignment.deadline < now
      ).length;

      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedThisMonth = designerAssignments.filter(
        (assignment) =>
          assignment.status === "completed" &&
          assignment.completedAt &&
          assignment.completedAt >= thisMonth
      ).length;

      // Calculate average completion time for completed assignments
      const completedAssignments = designerAssignments.filter(
        (assignment) =>
          assignment.status === "completed" &&
          assignment.startedAt &&
          assignment.completedAt
      );

      let averageCompletionTime = 0;
      if (completedAssignments.length > 0) {
        const totalDays = completedAssignments.reduce((sum, assignment) => {
          const days = Math.ceil(
            (assignment.completedAt!.getTime() -
              assignment.startedAt!.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        averageCompletionTime = totalDays / completedAssignments.length;
      }

      // Calculate total workload as percentage (simplified)
      const totalWorkload = Math.min(activeAssignments.length * 25, 100);

      return {
        activeAssignments: activeAssignments.length,
        totalWorkload,
        overdueAssignments,
        completedThisMonth,
        averageCompletionTime,
      };
    } catch (error) {
      console.error("Error getting designer workload:", error);
      throw new Error("Failed to get designer workload");
    }
  }

  /**
   * Get assignment statistics for a department
   */
  static async getDepartmentStats(
    departmentId: string
  ): Promise<DesignAssignmentStats> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // In real implementation, filter by department
      const assignments = mockAssignments;

      const total = assignments.length;
      const pending = assignments.filter((a) => a.status === "pending").length;
      const inProgress = assignments.filter(
        (a) => a.status === "in_progress"
      ).length;
      const review = assignments.filter((a) => a.status === "review").length;
      const completed = assignments.filter(
        (a) => a.status === "completed"
      ).length;

      const now = new Date();
      const overdue = assignments.filter(
        (a) =>
          a.deadline < now && !["completed", "cancelled"].includes(a.status)
      ).length;

      // Calculate completion rate
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Calculate average completion time
      const completedAssignments = assignments.filter(
        (a) => a.status === "completed" && a.startedAt && a.completedAt
      );

      let averageCompletionTime = 0;
      if (completedAssignments.length > 0) {
        const totalHours = completedAssignments.reduce((sum, assignment) => {
          const hours =
            (assignment.completedAt!.getTime() -
              assignment.startedAt!.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        averageCompletionTime = totalHours / completedAssignments.length;
      }

      return {
        total,
        pending,
        inProgress,
        review,
        completed,
        overdue,
        averageCompletionTime,
        completionRate,
      };
    } catch (error) {
      console.error("Error getting department stats:", error);
      throw new Error("Failed to get department statistics");
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(
    assignmentId: string
  ): Promise<DesignAssignment | null> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const assignment = mockAssignments.find((a) => a.id === assignmentId);
      return assignment || null;
    } catch (error) {
      console.error("Error getting assignment by ID:", error);
      throw new Error("Failed to get assignment");
    }
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(assignmentId: string): Promise<boolean> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const assignmentIndex = mockAssignments.findIndex(
        (a) => a.id === assignmentId
      );
      if (assignmentIndex === -1) {
        throw new Error("Assignment not found");
      }

      mockAssignments.splice(assignmentIndex, 1);
      return true;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      throw new Error("Failed to delete assignment");
    }
  }
}
