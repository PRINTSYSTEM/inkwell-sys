// src/hooks/use-auth.ts

import { useAuthContext } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import type { LoginRequest, LoginResponse, RolesResponse } from "@/Schema/auth.schema";

export const useAuth = () => useAuthContext();

// POST /auth/login
export const useLogin = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    LoginResponse,
    [LoginRequest]
  >(async (payload: LoginRequest) => {
    const res = await apiRequest.post<LoginResponse>(API_SUFFIX.AUTH_LOGIN, payload);
    return res.data;
  });

  const mutate = async (payload: LoginRequest) => {
    try {
      return await execute(payload);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        e?.response?.data?.message || e?.message || "Không thể đăng nhập";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// GET /auth/roles
export const useAuthRoles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["auth", "roles"],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<RolesResponse>(API_SUFFIX.AUTH_ROLES);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
