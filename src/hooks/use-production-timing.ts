import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  ProductionOrderScheduleResponse,
  ProductionConfigItem,
  ProductionDelayReportPaginate,
  ProductionDelaySummaryResponse,
} from "@/Schema";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

/**
 * Hook to get detailed schedule/milestones timeline for a production order
 */
export const useProductionOrderSchedule = (
  id: number | null,
  enabled = true
) => {
  return useQuery<ProductionOrderScheduleResponse>({
    queryKey: ["production-orders", "schedule", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const resp = await apiRequest.get<ProductionOrderScheduleResponse>(
        API_SUFFIX.PRODUCTION_ORDER_SCHEDULE(id)
      );
      return resp.data;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch 20 production step deadline/warning configuration items
 */
export const useProductionConfig = () => {
  return useQuery<ProductionConfigItem[]>({
    queryKey: ["system-settings", "production-config"],
    queryFn: async () => {
      const resp = await apiRequest.get<ProductionConfigItem[]>(
        API_SUFFIX.PRODUCTION_CONFIG
      );
      return resp.data;
    },
  });
};

/**
 * Hook to update production step configuration dictionary
 */
export const useUpdateProductionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, Record<string, string>>({
    mutationFn: async (payload: Record<string, string>) => {
      const resp = await apiRequest.put(
        API_SUFFIX.PRODUCTION_CONFIG,
        payload
      );
      return resp.data;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật cấu hình thời gian sản xuất");
      queryClient.invalidateQueries({
        queryKey: ["system-settings", "production-config"],
      });
      queryClient.invalidateQueries({
        queryKey: ["production-orders"],
      });
    },
    onError: (err: ApiError) => {
      const message =
        err?.response?.data?.message || err?.message || "Cập nhật thất bại";
      toast.error(message);
    },
  });
};

/**
 * Hook to fetch paginated production delay log reports
 */
export const useProductionDelayReport = (params: Record<string, any> = {}) => {
  const normalized = normalizeParams(params);
  return useQuery<ProductionDelayReportPaginate>({
    queryKey: ["production-orders", "delay-report", normalized],
    queryFn: async () => {
      const resp = await apiRequest.get<ProductionDelayReportPaginate>(
        API_SUFFIX.PRODUCTION_DELAY_REPORT,
        { params: normalized }
      );
      return resp.data;
    },
  });
};

/**
 * Hook to fetch production delay summary stats and charts
 */
export const useProductionDelaySummary = (params: Record<string, any> = {}) => {
  const normalized = normalizeParams(params);
  return useQuery<ProductionDelaySummaryResponse>({
    queryKey: ["production-orders", "delay-summary", normalized],
    queryFn: async () => {
      const resp = await apiRequest.get<ProductionDelaySummaryResponse>(
        API_SUFFIX.PRODUCTION_DELAY_SUMMARY,
        { params: normalized }
      );
      return resp.data;
    },
  });
};
