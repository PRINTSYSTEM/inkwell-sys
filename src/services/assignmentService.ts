// src/services/assignmentService.ts
// Service for assignment management API calls

import { BaseService, ServiceError } from "./BaseService";
import type { ApiResponse } from "./types";
import type {
    Assignment,
    AssignmentTemplate,
    WorkloadBalance,
    AssignmentSuggestion,
    AssignmentFilter,
    AssignmentMetrics,
    TeamWorkload,
    AssignmentFormData,
    AssignmentHistory,
    AssignmentBulkAction,
} from "@/types/assignment";

// API response types
interface AssignmentsResponse {
    assignments: Assignment[];
    total: number;
    page: number;
    pageSize: number;
}

interface CreateAssignmentRequest {
    title: string;
    description: string;
    type: Assignment["type"];
    priority: Assignment["priority"];
    assignedTo?: string;
    estimatedHours: number;
    deadline: string;
    requirements: string[];
    skills: string[];
    materials: string[];
    tags: string[];
    complexity: Assignment["complexity"];
    designId?: string;
    clientId?: string;
    collaborators?: string[];
    dependencies?: string[];
}

interface UpdateAssignmentRequest extends Partial<CreateAssignmentRequest> {
    status?: Assignment["status"];
    progress?: number;
    actualHours?: number;
}

class AssignmentManagementServiceClass extends BaseService {
    constructor() {
        super("assignments");
    }

    /**
     * Get assignments with optional filters
     */
    async getAssignments(
        filter?: AssignmentFilter,
        page: number = 1,
        pageSize: number = 50
    ): Promise<AssignmentsResponse> {
        try {
            const queryParams: Record<string, string> = {
                pageNumber: String(page),
                pageSize: String(pageSize),
            };

            if (filter) {
                if (filter.status?.length)
                    queryParams.status = filter.status.join(",");
                if (filter.type?.length) queryParams.type = filter.type.join(",");
                if (filter.priority?.length)
                    queryParams.priority = filter.priority.join(",");
                if (filter.assignedTo?.length)
                    queryParams.assignedTo = filter.assignedTo.join(",");
                if (filter.department?.length)
                    queryParams.department = filter.department.join(",");
                if (filter.overdue !== undefined)
                    queryParams.overdue = String(filter.overdue);
                if (filter.unassigned !== undefined)
                    queryParams.unassigned = String(filter.unassigned);
                if (filter.dateRange) {
                    queryParams.startDate = filter.dateRange.start;
                    queryParams.endDate = filter.dateRange.end;
                }
            }

            const queryString = new URLSearchParams(queryParams).toString();

            const res = await this.request<AssignmentsResponse>({
                method: "GET",
                url: `/${this.resourceName}?${queryString}`,
            });

            if (!res.success || !res.data) {
                // Return empty result structure for graceful fallback
                return {
                    assignments: [],
                    total: 0,
                    page: 1,
                    pageSize: 50,
                };
            }

            return res.data;
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
            return {
                assignments: [],
                total: 0,
                page: 1,
                pageSize: 50,
            };
        }
    }

    /**
     * Get assignment by ID
     */
    async getAssignmentById(id: string): Promise<Assignment | null> {
        try {
            const res = await this.request<Assignment>({
                method: "GET",
                url: `/${this.resourceName}/${id}`,
            });

            if (!res.success || !res.data) {
                return null;
            }

            return res.data;
        } catch (error) {
            console.error(`Failed to fetch assignment ${id}:`, error);
            return null;
        }
    }

    /**
     * Create new assignment
     */
    async createAssignment(data: AssignmentFormData): Promise<Assignment> {
        const request: CreateAssignmentRequest = {
            title: data.title,
            description: data.description,
            type: data.type,
            priority: data.priority,
            assignedTo: data.assignedTo,
            estimatedHours: data.estimatedHours,
            deadline: data.deadline,
            requirements: data.requirements,
            skills: data.skills,
            materials: data.materials,
            tags: data.tags,
            complexity: data.complexity,
            designId: data.designId,
            clientId: data.clientId,
            collaborators: data.collaborators,
            dependencies: data.dependencies,
        };

        const res = await this.request<Assignment>({
            method: "POST",
            url: `/${this.resourceName}`,
            data: request,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to create assignment", {
                code: "CREATE_ASSIGNMENT_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Update assignment
     */
    async updateAssignment(
        id: string,
        data: UpdateAssignmentRequest
    ): Promise<Assignment> {
        const res = await this.request<Assignment>({
            method: "PUT",
            url: `/${this.resourceName}/${id}`,
            data,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to update assignment", {
                code: "UPDATE_ASSIGNMENT_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Assign assignment to employee
     */
    async assignToEmployee(
        assignmentId: string,
        employeeId: string
    ): Promise<Assignment> {
        const res = await this.request<Assignment>({
            method: "POST",
            url: `/${this.resourceName}/${assignmentId}/assign`,
            data: { employeeId },
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to assign", {
                code: "ASSIGN_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Get assignment history
     */
    async getAssignmentHistory(assignmentId: string): Promise<AssignmentHistory[]> {
        try {
            const res = await this.request<AssignmentHistory[]>({
                method: "GET",
                url: `/${this.resourceName}/${assignmentId}/history`,
            });

            if (!res.success || !res.data) {
                return [];
            }

            return res.data;
        } catch (error) {
            console.error(
                `Failed to fetch history for assignment ${assignmentId}:`,
                error
            );
            return [];
        }
    }

    /**
     * Get assignment templates
     */
    async getAssignmentTemplates(): Promise<AssignmentTemplate[]> {
        try {
            const res = await this.request<AssignmentTemplate[]>({
                method: "GET",
                url: `/${this.resourceName}/templates`,
            });

            if (!res.success || !res.data) {
                return [];
            }

            return res.data;
        } catch (error) {
            console.error("Failed to fetch assignment templates:", error);
            return [];
        }
    }

    /**
     * Create assignment from template
     */
    async createFromTemplate(
        templateId: string,
        data: Partial<AssignmentFormData>
    ): Promise<Assignment> {
        const res = await this.request<Assignment>({
            method: "POST",
            url: `/${this.resourceName}/from-template/${templateId}`,
            data,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(
                res.message || "Failed to create from template",
                { code: "CREATE_FROM_TEMPLATE_FAILED" }
            );
        }

        return res.data;
    }

    /**
     * Get team workload (all departments or specific)
     */
    async getTeamWorkload(departmentId?: string): Promise<TeamWorkload[]> {
        try {
            const url = departmentId
                ? `/${this.resourceName}/workload?departmentId=${departmentId}`
                : `/${this.resourceName}/workload`;

            const res = await this.request<TeamWorkload[]>({
                method: "GET",
                url,
            });

            if (!res.success || !res.data) {
                return [];
            }

            return res.data;
        } catch (error) {
            console.error("Failed to fetch team workload:", error);
            return [];
        }
    }

    /**
     * Get employee workload
     */
    async getEmployeeWorkload(employeeId: string): Promise<WorkloadBalance | null> {
        try {
            const res = await this.request<WorkloadBalance>({
                method: "GET",
                url: `/${this.resourceName}/workload/employee/${employeeId}`,
            });

            if (!res.success || !res.data) {
                return null;
            }

            return res.data;
        } catch (error) {
            console.error(
                `Failed to fetch workload for employee ${employeeId}:`,
                error
            );
            return null;
        }
    }

    /**
     * Get assignment suggestions (AI-based recommendations)
     */
    async getAssignmentSuggestions(
        assignmentId: string
    ): Promise<AssignmentSuggestion[]> {
        try {
            const res = await this.request<AssignmentSuggestion[]>({
                method: "GET",
                url: `/${this.resourceName}/${assignmentId}/suggestions`,
            });

            if (!res.success || !res.data) {
                return [];
            }

            return res.data;
        } catch (error) {
            console.error(
                `Failed to fetch suggestions for assignment ${assignmentId}:`,
                error
            );
            return [];
        }
    }

    /**
     * Get assignment metrics
     */
    async getAssignmentMetrics(
        dateRange?: { start: string; end: string }
    ): Promise<AssignmentMetrics> {
        try {
            let url = `/${this.resourceName}/metrics`;
            if (dateRange) {
                url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const res = await this.request<AssignmentMetrics>({
                method: "GET",
                url,
            });

            if (!res.success || !res.data) {
                // Return default empty metrics
                return {
                    total: 0,
                    byStatus: {
                        unassigned: 0,
                        assigned: 0,
                        in_progress: 0,
                        review: 0,
                        completed: 0,
                        cancelled: 0,
                    },
                    byPriority: {
                        low: 0,
                        medium: 0,
                        high: 0,
                        urgent: 0,
                    },
                    byType: {
                        design: 0,
                        review: 0,
                        production: 0,
                        quality_check: 0,
                        maintenance: 0,
                    },
                    avgCompletionTime: 0,
                    onTimeRate: 0,
                    overdue: 0,
                    unassigned: 0,
                };
            }

            return res.data;
        } catch (error) {
            console.error("Failed to fetch assignment metrics:", error);
            return {
                total: 0,
                byStatus: {
                    unassigned: 0,
                    assigned: 0,
                    in_progress: 0,
                    review: 0,
                    completed: 0,
                    cancelled: 0,
                },
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    urgent: 0,
                },
                byType: {
                    design: 0,
                    review: 0,
                    production: 0,
                    quality_check: 0,
                    maintenance: 0,
                },
                avgCompletionTime: 0,
                onTimeRate: 0,
                overdue: 0,
                unassigned: 0,
            };
        }
    }

    /**
     * Bulk action on assignments
     */
    async bulkAction(action: AssignmentBulkAction): Promise<Assignment[]> {
        const res = await this.request<Assignment[]>({
            method: "POST",
            url: `/${this.resourceName}/bulk`,
            data: action,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Bulk action failed", {
                code: "BULK_ACTION_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Delete assignment
     */
    async deleteAssignment(id: string): Promise<void> {
        const res = await this.request({
            method: "DELETE",
            url: `/${this.resourceName}/${id}`,
        });

        if (!res.success) {
            throw new ServiceError(res.message || "Failed to delete assignment", {
                code: "DELETE_ASSIGNMENT_FAILED",
            });
        }
    }

    /**
     * Update assignment status
     */
    async updateStatus(
        id: string,
        status: Assignment["status"],
        notes?: string
    ): Promise<Assignment> {
        const res = await this.request<Assignment>({
            method: "PUT",
            url: `/${this.resourceName}/${id}/status`,
            data: { status, notes },
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to update status", {
                code: "UPDATE_STATUS_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Update assignment progress
     */
    async updateProgress(
        id: string,
        progress: number,
        notes?: string
    ): Promise<Assignment> {
        const res = await this.request<Assignment>({
            method: "PUT",
            url: `/${this.resourceName}/${id}/progress`,
            data: { progress, notes },
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to update progress", {
                code: "UPDATE_PROGRESS_FAILED",
            });
        }

        return res.data;
    }
}

// Export singleton instance
export const AssignmentManagementService = new AssignmentManagementServiceClass();
