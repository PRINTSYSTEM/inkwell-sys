import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import type {
  UserResponse,
  UserResponsePagedResponse,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/Schema/user.schema";
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

// POST /users/{id}/change-password
export const useChangeUserPassword = () => {
  const { toast } = useToast();

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

      toast({
        title: "Thành công",
        description: "Đã đổi mật khẩu thành công",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể đổi mật khẩu",
        variant: "destructive",
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

export { userCrudApi, userKeys };
