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

      // TODO: Replace with actual API endpoint when available
      // For now, return mock data structure
      // const res = await apiRequest.get<NotificationsResponsePaginate>(
      //   NOTIFICATIONS_ENDPOINT,
      //   { params: normalizedParams }
      // );
      // return res.data;

      // Mock response for now
      return {
        items: [],
        total: 0,
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 10,
        totalPages: 0,
      } as NotificationsResponsePaginate;
    },
    staleTime: 30 * 1000, // 30 seconds for real-time updates
  });
};

// ================== GET NOTIFICATION BY ID ==================
export const useNotification = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["notification", id],
    queryFn: async () => {
      if (!id) return null;
      // TODO: Replace with actual API endpoint
      // const res = await apiRequest.get<Notification>(
      //   `${NOTIFICATIONS_ENDPOINT}/${id}`
      // );
      // return res.data;
      return null;
    },
    enabled: enabled && id !== null,
  });
};

// ================== MARK NOTIFICATION AS READ ==================
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.put<Notification>(
        `${NOTIFICATIONS_ENDPOINT}/${id}/read`
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
      const res = await apiRequest.put(`${NOTIFICATIONS_ENDPOINT}/read-all`);
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
      // TODO: Replace with actual API endpoint
      // await apiRequest.delete(`${NOTIFICATIONS_ENDPOINT}/${id}`);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
