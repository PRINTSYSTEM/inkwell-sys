// src/hooks/use-debt-notification.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import { useAsyncCallback } from "@/hooks/use-async";
import { z } from "zod";
import {
  CreateDebtNotificationRequestSchema,
  DebtNotificationResponseSchema,
  DebtNotificationResponseIPaginateSchema,
  DebtNotificationPreviewResponseSchema,
} from "@/Schema/generated";

type CreateDebtNotificationRequest = z.infer<
  typeof CreateDebtNotificationRequestSchema
>;
type DebtNotificationResponse = z.infer<typeof DebtNotificationResponseSchema>;
type DebtNotificationResponseIPaginate = z.infer<
  typeof DebtNotificationResponseIPaginateSchema
>;
type DebtNotificationPreviewResponse = z.infer<
  typeof DebtNotificationPreviewResponseSchema
>;
import type { DebtNotificationListParams } from "@/Schema";

// ===== Query Keys =====

export const debtNotificationKeys = {
  all: ["debt-notifications"] as const,
  list: (params?: DebtNotificationListParams) =>
    ["debt-notifications", "list", params] as const,
  detail: (id: number | null) => ["debt-notifications", "detail", id] as const,
  preview: (id: number | null) =>
    ["debt-notifications", "preview", id] as const,
};

// ===== GET /api/debt-notifications =====
// Lấy danh sách thông báo công nợ

export const useDebtNotifications = (params?: DebtNotificationListParams) => {
  return useQuery({
    queryKey: debtNotificationKeys.list(params),
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<DebtNotificationResponseIPaginate>(
        API_SUFFIX.DEBT_NOTIFICATIONS,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===== POST /api/debt-notifications =====
// Tạo thông báo công nợ

export const useCreateDebtNotification = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DebtNotificationResponse,
    [CreateDebtNotificationRequest]
  >(async (data: CreateDebtNotificationRequest) => {
    const res = await apiRequest.post<DebtNotificationResponse>(
      API_SUFFIX.DEBT_NOTIFICATIONS,
      data
    );
    return res.data;
  });

  const mutate = async (data: CreateDebtNotificationRequest) => {
    try {
      const result = await execute(data);

      queryClient.invalidateQueries({
        queryKey: debtNotificationKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã tạo thông báo công nợ",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tạo thông báo công nợ";

      toast.error("Lỗi", {
        description: message,
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

// ===== GET /api/debt-notifications/:id/preview =====
// Xem trước thông báo công nợ

export const useDebtNotificationPreview = (
  id: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: debtNotificationKeys.preview(id),
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<DebtNotificationPreviewResponse>(
        API_SUFFIX.DEBT_NOTIFICATION_PREVIEW(id as number)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
