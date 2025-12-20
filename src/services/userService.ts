// src/services/userService.ts
// Service for user management API calls

import { BaseService, ServiceError } from "./BaseService";
import type { ApiResponse } from "./types";
import type { Employee, EmployeeMetrics, UserFilters } from "@/types/employee";

// Response types matching backend
export interface UserResponse {
    id: number;
    username: string;
    fullName: string;
    role: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserKpiResponse {
    userId: number;
    fullName: string;
    role: string;
    fromDate: string;
    toDate: string;
    // KPI cho Designer
    totalDesignsAssigned: number;
    designsCompleted: number;
    designsInProgress: number;
    designCompletionRate: number;
    averageDesignTimeHours: number;
    // KPI cho Bộ phận bình bài
    totalProofingOrdersAssigned: number;
    proofingOrdersCompleted: number;
    proofingOrdersInProgress: number;
    proofingCompletionRate: number;
    // KPI cho Sản xuất
    totalProductionsAssigned: number;
    productionsCompleted: number;
    productionsInProgress: number;
    productionCompletionRate: number;
    // KPI chung
    totalOrdersHandled: number;
    totalRevenueGenerated: number;
}

export interface TeamKpiSummaryResponse {
    fromDate: string;
    toDate: string;
    userKpis: UserKpiResponse[];
    totalDesignsCompleted: number;
    totalProofingOrdersCompleted: number;
    totalProductionsCompleted: number;
    totalRevenue: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface GetUsersParams {
    pageNumber?: number;
    pageSize?: number;
    role?: string;
    isActive?: boolean;
}

export interface UpdateUserParams {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    notes?: string;
}

// Valid roles list for runtime validation
const VALID_ROLES = [
    "admin",
    "manager",
    "accounting",
    "accounting_lead",
    "design",
    "design_lead",
    "proofer",
    "production",
    "production_lead",
] as const;

type ValidRole = typeof VALID_ROLES[number];

/**
 * Validate and transform role string to valid Employee role
 */
function validateRole(roleString: string): Employee["role"] {
    const lowerRole = roleString.toLowerCase();
    if (VALID_ROLES.includes(lowerRole as ValidRole)) {
        return lowerRole as Employee["role"];
    }
    // Default to a safe fallback for unknown roles
    console.warn(`Unknown role "${roleString}", defaulting to "design"`);
    return "design";
}

/**
 * Transform backend UserResponse to frontend Employee type
 */
function transformToEmployee(user: UserResponse): Employee {
    return {
        id: String(user.id),
        username: user.username,
        fullName: user.fullName,
        email: user.email || "",
        phone: user.phone,
        role: validateRole(user.role),
        status: user.isActive ? "active" : "inactive",
        permissions: [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy: "",
        updatedBy: "",
        // Employee-specific fields with defaults
        department: "",
        departmentName: "",
        hireDate: user.createdAt,
        metrics: {
            totalDesigns: 0,
            completedDesigns: 0,
            inProgressDesigns: 0,
            pendingDesigns: 0,
            averageCompletionTime: 0,
            completionRate: 0,
            workloadScore: 0,
            averageScore: 0,
            qualityScore: 0,
            lastActivityDate: user.updatedAt,
            monthlyMetrics: [],
        },
        skills: [],
        certifications: [],
        currentWorkload: 0,
        availability: "available",
    };
}

/**
 * Transform KPI response to EmployeeMetrics
 */
function transformKpiToMetrics(kpi: UserKpiResponse): EmployeeMetrics {
    const totalDesigns = kpi.totalDesignsAssigned;
    const completedDesigns = kpi.designsCompleted;
    const inProgressDesigns = kpi.designsInProgress;

    return {
        totalDesigns,
        completedDesigns,
        inProgressDesigns,
        pendingDesigns: Math.max(0, totalDesigns - completedDesigns - inProgressDesigns),
        averageCompletionTime: kpi.averageDesignTimeHours / 24, // Convert hours to days
        completionRate: kpi.designCompletionRate,
        workloadScore: Math.min(100, (inProgressDesigns / Math.max(1, totalDesigns)) * 100),
        averageScore: 0, // Not provided by backend
        qualityScore: kpi.designCompletionRate, // Use completion rate as quality proxy
        lastActivityDate: kpi.toDate,
        monthlyMetrics: [],
    };
}

class UserManagementServiceClass extends BaseService {
    constructor() {
        super("users");
    }

    /**
     * Get paginated list of users
     */
    async getUsers(params: GetUsersParams = {}): Promise<{
        users: Employee[];
        total: number;
        page: number;
        pageSize: number;
    }> {
        const { pageNumber = 1, pageSize = 50, role, isActive } = params;

        const queryParams: Record<string, string> = {
            pageNumber: String(pageNumber),
            pageSize: String(pageSize),
        };

        if (role) queryParams.role = role;
        if (isActive !== undefined) queryParams.isActive = String(isActive);

        const queryString = new URLSearchParams(queryParams).toString();

        const res: ApiResponse<PaginatedResponse<UserResponse>> = await this.request<
            PaginatedResponse<UserResponse>
        >({
            method: "GET",
            url: `/${this.resourceName}?${queryString}`,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to fetch users", {
                code: "FETCH_USERS_FAILED",
            });
        }

        return {
            users: res.data.items.map(transformToEmployee),
            total: res.data.totalItems,
            page: res.data.pageNumber,
            pageSize: res.data.pageSize,
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<Employee> {
        const res: ApiResponse<UserResponse> = await this.request<UserResponse>({
            method: "GET",
            url: `/${this.resourceName}/${id}`,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "User not found", {
                code: "USER_NOT_FOUND",
                status: 404,
            });
        }

        return transformToEmployee(res.data);
    }

    /**
     * Update user
     */
    async updateUser(id: string, data: UpdateUserParams): Promise<Employee> {
        const res: ApiResponse<UserResponse> = await this.request<UserResponse>({
            method: "PUT",
            url: `/${this.resourceName}/${id}`,
            data,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to update user", {
                code: "UPDATE_USER_FAILED",
            });
        }

        return transformToEmployee(res.data);
    }

    /**
     * Get user KPI metrics
     */
    async getUserKpi(
        userId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<EmployeeMetrics> {
        const params: Record<string, string> = {};
        if (fromDate) params.fromDate = fromDate.toISOString();
        if (toDate) params.toDate = toDate.toISOString();

        const queryString = new URLSearchParams(params).toString();
        const url = queryString
            ? `/${this.resourceName}/${userId}/kpi?${queryString}`
            : `/${this.resourceName}/${userId}/kpi`;

        const res: ApiResponse<UserKpiResponse> = await this.request<UserKpiResponse>({
            method: "GET",
            url,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to fetch KPI", {
                code: "FETCH_KPI_FAILED",
            });
        }

        return transformKpiToMetrics(res.data);
    }

    /**
     * Get team KPI summary
     */
    async getTeamKpi(
        fromDate?: Date,
        toDate?: Date,
        role?: string
    ): Promise<TeamKpiSummaryResponse> {
        const params: Record<string, string> = {};
        if (fromDate) params.fromDate = fromDate.toISOString();
        if (toDate) params.toDate = toDate.toISOString();
        if (role) params.role = role;

        const queryString = new URLSearchParams(params).toString();
        const url = queryString
            ? `/${this.resourceName}/kpi/team?${queryString}`
            : `/${this.resourceName}/kpi/team`;

        const res: ApiResponse<TeamKpiSummaryResponse> =
            await this.request<TeamKpiSummaryResponse>({
                method: "GET",
                url,
            });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to fetch team KPI", {
                code: "FETCH_TEAM_KPI_FAILED",
            });
        }

        return res.data;
    }

    /**
     * Get list of designers
     */
    async getDesigners(): Promise<Employee[]> {
        const res: ApiResponse<UserResponse[]> = await this.request<UserResponse[]>({
            method: "GET",
            url: `/${this.resourceName}/designers`,
        });

        if (!res.success || !res.data) {
            throw new ServiceError(res.message || "Failed to fetch designers", {
                code: "FETCH_DESIGNERS_FAILED",
            });
        }

        return res.data.map(transformToEmployee);
    }
}

// Export singleton instance
export const UserManagementService = new UserManagementServiceClass();
