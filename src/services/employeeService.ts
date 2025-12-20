// src/services/employeeService.ts
// Service for employee performance tracking

import { BaseService } from "./BaseService";
import type { ApiResponse } from "./types";
import type {
    Employee,
    EmployeeMetrics,
    EmployeeAssignment,
    MonthlyMetrics,
} from "@/types/employee";
import { UserManagementService } from "./userService";

// Assignment status from backend
type AssignmentStatus =
    | "pending"
    | "assigned"
    | "in_progress"
    | "review"
    | "completed"
    | "cancelled";

// Design response from backend
interface DesignResponse {
    id: number;
    designCode: string;
    designName: string;
    assignedTo: number;
    assignedBy: number;
    assignedAt: string;
    status: string;
    priority: string;
    dueDate?: string;
    completedAt?: string;
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
    notes?: string;
}

/**
 * Transform design to employee assignment
 */
function transformToAssignment(
    design: DesignResponse,
    employeeName: string
): EmployeeAssignment {
    const statusMap: Record<string, AssignmentStatus> = {
        pending: "pending",
        in_progress: "in_progress",
        review: "review",
        approved: "completed",
        delivered: "completed",
        revision: "in_progress",
    };

    const priorityMap: Record<string, EmployeeAssignment["priority"]> = {
        low: "low",
        medium: "medium",
        high: "high",
        urgent: "urgent",
    };

    return {
        id: String(design.id),
        employeeId: String(design.assignedTo),
        employeeName,
        designId: String(design.id),
        designName: design.designName,
        designCode: design.designCode,
        assignedBy: String(design.assignedBy),
        assignedAt: design.assignedAt,
        dueDate: design.dueDate,
        deadline: design.dueDate,
        status: statusMap[design.status] || "pending",
        priority: priorityMap[design.priority] || "medium",
        estimatedHours: design.estimatedHours || 0,
        actualHours: design.actualHours,
        progress: design.progress,
        notes: design.notes,
        completedAt: design.completedAt,
    };
}

class EmployeePerformanceServiceClass extends BaseService {
    constructor() {
        super("users"); // Uses users endpoint for employee data
    }

    /**
     * Get employee metrics (KPI) for a specific employee
     */
    async getEmployeeMetrics(employeeId: string): Promise<EmployeeMetrics> {
        try {
            // Use UserManagementService to get KPI data
            const metrics = await UserManagementService.getUserKpi(employeeId);
            return metrics;
        } catch (error) {
            // Return default metrics if not found
            console.warn(
                `Could not fetch metrics for employee ${employeeId}:`,
                error
            );
            return {
                totalDesigns: 0,
                completedDesigns: 0,
                inProgressDesigns: 0,
                pendingDesigns: 0,
                averageCompletionTime: 0,
                completionRate: 0,
                workloadScore: 0,
                averageScore: 0,
                qualityScore: 0,
                lastActivityDate: new Date().toISOString(),
                monthlyMetrics: [],
            };
        }
    }

    /**
     * Get employee metrics for a date range
     */
    async getEmployeeMetricsForPeriod(
        employeeId: string,
        fromDate: Date,
        toDate: Date
    ): Promise<EmployeeMetrics> {
        try {
            const metrics = await UserManagementService.getUserKpi(
                employeeId,
                fromDate,
                toDate
            );
            return metrics;
        } catch (error) {
            console.warn(
                `Could not fetch period metrics for employee ${employeeId}:`,
                error
            );
            return {
                totalDesigns: 0,
                completedDesigns: 0,
                inProgressDesigns: 0,
                pendingDesigns: 0,
                averageCompletionTime: 0,
                completionRate: 0,
                workloadScore: 0,
                averageScore: 0,
                qualityScore: 0,
                lastActivityDate: new Date().toISOString(),
                monthlyMetrics: [],
            };
        }
    }

    /**
     * Get employee assignments (designs assigned to them)
     */
    async getEmployeeAssignments(
        employeeId: string,
        status?: AssignmentStatus
    ): Promise<EmployeeAssignment[]> {
        try {
            // Get employee info first
            const employee = await UserManagementService.getUserById(employeeId);

            // Fetch designs assigned to this employee
            const queryParams: Record<string, string> = {
                assignedTo: employeeId,
            };
            if (status) queryParams.status = status;

            const queryString = new URLSearchParams(queryParams).toString();

            const res: ApiResponse<DesignResponse[]> = await this.request<
                DesignResponse[]
            >({
                method: "GET",
                url: `/designs?${queryString}`,
            });

            if (!res.success || !res.data) {
                return [];
            }

            return res.data.map((design) =>
                transformToAssignment(design, employee.fullName)
            );
        } catch (error) {
            console.warn(
                `Could not fetch assignments for employee ${employeeId}:`,
                error
            );
            return [];
        }
    }

    /**
     * Get all designers with their metrics
     */
    async getDesignersWithMetrics(): Promise<
        Array<{ employee: Employee; metrics: EmployeeMetrics }>
    > {
        try {
            const designers = await UserManagementService.getDesigners();

            const results = await Promise.all(
                designers.map(async (employee) => {
                    const metrics = await this.getEmployeeMetrics(employee.id);
                    return { employee, metrics };
                })
            );

            return results;
        } catch (error) {
            console.error("Could not fetch designers with metrics:", error);
            return [];
        }
    }

    /**
     * Get team performance summary
     */
    async getTeamPerformance(
        fromDate?: Date,
        toDate?: Date,
        role?: string
    ): Promise<{
        employees: Array<{ employee: Employee; metrics: EmployeeMetrics }>;
        teamTotals: {
            totalDesigns: number;
            completedDesigns: number;
            avgCompletionRate: number;
            avgCompletionTime: number;
        };
    }> {
        try {
            const teamKpi = await UserManagementService.getTeamKpi(
                fromDate,
                toDate,
                role
            );
            const { users } = await UserManagementService.getUsers({ role });

            const employees = users.map((employee) => {
                const kpi = teamKpi.userKpis.find(
                    (k) => String(k.userId) === employee.id
                );
                const metrics: EmployeeMetrics = kpi
                    ? {
                        totalDesigns: kpi.totalDesignsAssigned,
                        completedDesigns: kpi.designsCompleted,
                        inProgressDesigns: kpi.designsInProgress,
                        pendingDesigns:
                            kpi.totalDesignsAssigned -
                            kpi.designsCompleted -
                            kpi.designsInProgress,
                        averageCompletionTime: kpi.averageDesignTimeHours / 24,
                        completionRate: kpi.designCompletionRate,
                        workloadScore: 0,
                        averageScore: 0,
                        qualityScore: kpi.designCompletionRate,
                        lastActivityDate: teamKpi.toDate,
                        monthlyMetrics: [],
                    }
                    : employee.metrics;

                return { employee, metrics };
            });

            const teamTotals = {
                totalDesigns: teamKpi.userKpis.reduce(
                    (sum, k) => sum + k.totalDesignsAssigned,
                    0
                ),
                completedDesigns: teamKpi.totalDesignsCompleted,
                avgCompletionRate:
                    teamKpi.userKpis.length > 0
                        ? teamKpi.userKpis.reduce(
                            (sum, k) => sum + k.designCompletionRate,
                            0
                        ) / teamKpi.userKpis.length
                        : 0,
                avgCompletionTime:
                    teamKpi.userKpis.length > 0
                        ? teamKpi.userKpis.reduce(
                            (sum, k) => sum + k.averageDesignTimeHours,
                            0
                        ) /
                        teamKpi.userKpis.length /
                        24
                        : 0,
            };

            return { employees, teamTotals };
        } catch (error) {
            console.error("Could not fetch team performance:", error);
            return {
                employees: [],
                teamTotals: {
                    totalDesigns: 0,
                    completedDesigns: 0,
                    avgCompletionRate: 0,
                    avgCompletionTime: 0,
                },
            };
        }
    }

    /**
     * Update assignment/design status
     */
    async updateAssignmentStatus(
        assignmentId: string,
        status: AssignmentStatus
    ): Promise<void> {
        try {
            await this.request({
                method: "PUT",
                url: `/designs/${assignmentId}/status`,
                data: { status },
            });
        } catch (error) {
            console.error(
                `Could not update assignment ${assignmentId} status:`,
                error
            );
            throw error;
        }
    }

    /**
     * Get monthly metrics for an employee (for charts)
     */
    async getMonthlyMetrics(
        employeeId: string,
        months: number = 6
    ): Promise<MonthlyMetrics[]> {
        const now = new Date();

        // Build date ranges for all months
        const dateRanges = Array.from({ length: months }, (_, i) => {
            const index = months - 1 - i;
            const fromDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
            const toDate = new Date(now.getFullYear(), now.getMonth() - index + 1, 0);
            return { fromDate, toDate };
        });

        // Fetch all metrics in parallel
        const results = await Promise.all(
            dateRanges.map(async ({ fromDate, toDate }) => {
                const monthLabel = `${fromDate.getFullYear()}-${String(
                    fromDate.getMonth() + 1
                ).padStart(2, "0")}`;

                try {
                    const metrics = await this.getEmployeeMetricsForPeriod(
                        employeeId,
                        fromDate,
                        toDate
                    );

                    return {
                        month: monthLabel,
                        designsCompleted: metrics.completedDesigns,
                        averageTime: metrics.averageCompletionTime,
                        qualityScore: metrics.qualityScore,
                    };
                } catch {
                    return {
                        month: monthLabel,
                        designsCompleted: 0,
                        averageTime: 0,
                        qualityScore: 0,
                    };
                }
            })
        );

        return results;
    }
}

// Export singleton instance
export const EmployeePerformanceService = new EmployeePerformanceServiceClass();
