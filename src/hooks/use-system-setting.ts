import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import type {
  SystemSettingResponse,
  UpdateSystemSettingRequest,
} from "@/Schema";
import { toast } from "sonner";

export const systemSettingKeys = {
  all: ["system-settings"] as const,
  detail: (key: string) => [...systemSettingKeys.all, key] as const,
};

export function useSystemSettings() {
  return useQuery<SystemSettingResponse[]>({
    queryKey: systemSettingKeys.all,
    queryFn: () => http.get<SystemSettingResponse[]>(API_SUFFIX.SYSTEM_SETTINGS),
  });
}

export function useSystemSetting(key: string | null) {
  return useQuery<SystemSettingResponse>({
    queryKey: systemSettingKeys.detail(key || ""),
    queryFn: () =>
      http.get<SystemSettingResponse>(
        API_SUFFIX.SYSTEM_SETTING_BY_KEY(key || "")
      ),
    enabled: !!key,
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation<
    SystemSettingResponse,
    Error,
    { key: string; payload: UpdateSystemSettingRequest },
    {
      previousSettings?: SystemSettingResponse[];
      previousSetting?: SystemSettingResponse;
    }
  >({
    mutationFn: ({ key, payload }) =>
      http.put<SystemSettingResponse>(
        API_SUFFIX.SYSTEM_SETTING_BY_KEY(key),
        payload
      ),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: systemSettingKeys.all });
      await queryClient.cancelQueries({
        queryKey: systemSettingKeys.detail(variables.key),
      });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<
        SystemSettingResponse[]
      >(systemSettingKeys.all);
      const previousSetting = queryClient.getQueryData<SystemSettingResponse>(
        systemSettingKeys.detail(variables.key)
      );

      // Optimistically update the list
      if (previousSettings) {
        queryClient.setQueryData<SystemSettingResponse[]>(
          systemSettingKeys.all,
          previousSettings.map((s) =>
            s.key === variables.key
              ? {
                  ...s,
                  value: variables.payload.value,
                  description: variables.payload.description,
                }
              : s
          )
        );
      }

      // Optimistically update the detail query
      if (previousSetting) {
        queryClient.setQueryData<SystemSettingResponse>(
          systemSettingKeys.detail(variables.key),
          {
            ...previousSetting,
            value: variables.payload.value,
            description: variables.payload.description,
          }
        );
      }

      return { previousSettings, previousSetting };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousSettings) {
        queryClient.setQueryData(
          systemSettingKeys.all,
          context.previousSettings
        );
      }
      if (context?.previousSetting) {
        queryClient.setQueryData(
          systemSettingKeys.detail(variables.key),
          context.previousSetting
        );
      }

      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Không thể cập nhật thiết lập";
      toast.error("Lỗi", { description: message });
    },
    onSuccess: () => {
      toast.success("Thành công", {
        description: "Cập nhật thiết lập thành công",
      });
    },
    onSettled: (data, error, variables) => {
      // Invalidate both lists and detail
      queryClient.invalidateQueries({ queryKey: systemSettingKeys.all });
      queryClient.invalidateQueries({
        queryKey: systemSettingKeys.detail(variables.key),
      });
    },
  });
}
