import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";
import { normalizeParams } from "@/apis/util.api";
import type {
  Notification,
  NotificationFilter,
} from "@/Schema/notification.schema";

// Add notification endpoints to API_SUFFIX if not exists
// For now, we'll use a placeholder endpoint
const NOTIFICATIONS_ENDPOINT = "/notifications";

export interface NotificationsParams extends Partial<NotificationFilter> {
  pageNumber?: number;
  pageSize?: number;
}

export interface NotificationsResponsePaginate {
  items: Notification[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ================== GET NOTIFICATIONS LIST ==================
export const useNotifications = (params?: NotificationsParams) => {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );

      const res = await apiRequest.get<NotificationsResponsePaginate>(
        API_SUFFIX.NOTIFICATIONS,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// ================== GET NOTIFICATION BY ID ==================
export const useNotification = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["notification", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiRequest.get<Notification>(
        API_SUFFIX.NOTIFICATION_BY_ID(id)
      );
      return res.data;
    },
    enabled: enabled && id !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// ================== MARK NOTIFICATION AS READ ==================
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.put<Notification>(
        API_SUFFIX.NOTIFICATION_READ(id)
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["debt-notifications"] });
    },
  });
};

// ================== MARK ALL AS READ ==================
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest.put(API_SUFFIX.NOTIFICATION_READ_ALL);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["debt-notifications"] });
    },
  });
};

// ================== DELETE NOTIFICATION ==================
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.NOTIFICATION_BY_ID(id));
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
