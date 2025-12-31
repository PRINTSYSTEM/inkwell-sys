import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

import type {
  UserResponse,
  UserResponsePagedResponse,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateMyProfileRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UserKpiResponse,
  TeamKpiSummaryResponse,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";

const rootKey = "users";

const {
  api: userCrudApi,
  keys: userKeys,
  useList: useUserListBase,
  useDetail: useUserDetailBase,
  useCreate: useCreateUserBase,
  useUpdate: useUpdateUserBase,
  useDelete: useDeleteUserBase,
} = createCrudHooks<
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  number,
  UserListParams,
  UserResponsePagedResponse
>({
  rootKey,
  basePath: API_SUFFIX.USERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo người dùng thành công",
    updateSuccess: "Đã cập nhật người dùng thành công",
    deleteSuccess: "Đã xoá người dùng thành công",
  },
});

// ====== Export base hooks ======

export const useUsers = (params?: UserListParams) =>
  useUserListBase(params ?? ({} as UserListParams));

export const useUser = (id: number | null, enabled = true) =>
  useUserDetailBase(id, enabled);

export const useCreateUser = () => useCreateUserBase();
export const useUpdateUser = () => useUpdateUserBase();
export const useDeleteUser = () => useDeleteUserBase();

// ====== Extra hooks theo swagger ======

// GET /users/username/{username}
export const useUserByUsername = (username: string | null, enabled = true) => {
  return useQuery({
    queryKey: [rootKey, "by-username", username],
    enabled: enabled && !!username,
    queryFn: async () => {
      const res = await apiRequest.get<UserResponse>(
        API_SUFFIX.USER_BY_USERNAME(username as string)
      );
      return res.data;
    },
  });
};

// GET /users/me
export const useMyProfile = (enabled = true) => {
  return useQuery({
    queryKey: [rootKey, "me"],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<UserResponse>(API_SUFFIX.USER_ME);
      return res.data;
    },
  });
};

// PUT /users/me
export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  const { data, loading, error, execute, reset } = useAsyncCallback<
    UserResponse,
    [UpdateMyProfileRequest]
  >(async (data) => {
    const res = await apiRequest.put<UserResponse>(API_SUFFIX.USER_ME, data);
    return res.data;
  });

  const mutate = async (payload: UpdateMyProfileRequest) => {
    try {
      const result = await execute(payload);
      
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: [rootKey, "me"] });
      queryClient.invalidateQueries({ queryKey: [rootKey] });

      toast.success("Thành công", {
        description: "Đã cập nhật thông tin cá nhân thành công",
      });
      
      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật thông tin",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /users/{id}/change-password
export const useChangeUserPassword = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [{ id: number; data: ChangePasswordRequest }]
  >(async ({ id, data }) => {
    await apiRequest.post(API_SUFFIX.USER_CHANGE_PASSWORD(id), data);
  });

  const mutate = async (payload: {
    id: number;
    data: ChangePasswordRequest;
  }) => {
    try {
      await execute(payload);

      toast.success("Thành công", {
        description: "Đã đổi mật khẩu thành công",
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể đổi mật khẩu",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /users/{id}/reset-password (Admin only)
export const useResetPassword = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [{ id: number; data: ResetPasswordRequest }]
  >(async ({ id, data }) => {
    await apiRequest.post(API_SUFFIX.USER_RESET_PASSWORD(id), data);
  });

  const mutate = async (payload: {
    id: number;
    data: ResetPasswordRequest;
  }) => {
    try {
      await execute(payload);

      toast.success("Thành công", {
        description: "Đã reset mật khẩu thành công",
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể reset mật khẩu",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /users/{id}/department-reset-password (Department head)
export const useDepartmentResetPassword = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [{ id: number; data: ResetPasswordRequest }]
  >(async ({ id, data }) => {
    await apiRequest.post(API_SUFFIX.USER_DEPARTMENT_RESET_PASSWORD(id), data);
  });

  const mutate = async (payload: {
    id: number;
    data: ResetPasswordRequest;
  }) => {
    try {
      await execute(payload);

      toast.success("Thành công", {
        description: "Đã reset mật khẩu thành công",
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể reset mật khẩu",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// ====== KPI Hooks ======

// GET /users/{id}/kpi
export const useUserKpi = (
  userId: number | null,
  fromDate?: string,
  toDate?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [rootKey, "kpi", userId, fromDate, toDate],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const res = await apiRequest.get<UserKpiResponse>(
        API_SUFFIX.USER_KPI(userId as number, fromDate, toDate)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /users/kpi/team
export const useTeamKpi = (
  fromDate?: string,
  toDate?: string,
  role?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [rootKey, "kpi", "team", fromDate, toDate, role],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<TeamKpiSummaryResponse>(
        API_SUFFIX.USER_KPI_TEAM(fromDate, toDate, role)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export { userCrudApi, userKeys };
