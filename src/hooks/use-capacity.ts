import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX, normalizeParams } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import type {
  CapacityKpiSummaryResponse,
  CapacityStageSummaryResponse,
  CapacityWeeklyHeatmapItem,
  CapacityReallocationSuggestionsResponse,
  CapacitySimulationRequest,
  CapacitySimulationResponse,
} from "@/types/capacity";

// GET /api/v1/capacity/kpi-summary
export const useCapacityKpiSummary = () => {
  return useQuery({
    queryKey: ["capacity", "kpi-summary"],
    queryFn: async () => {
      const res = await apiRequest.get<CapacityKpiSummaryResponse>(
        API_SUFFIX.CAPACITY_KPI_SUMMARY
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// GET /api/v1/capacity/summary
export const useCapacitySummary = (params?: {
  fromDate?: string;
  toDate?: string;
}) => {
  const cleanParams = normalizeParams((params ?? {}) as Record<string, unknown>);
  return useQuery({
    queryKey: ["capacity", "summary", cleanParams],
    queryFn: async () => {
      const res = await apiRequest.get<CapacityStageSummaryResponse[]>(
        API_SUFFIX.CAPACITY_SUMMARY,
        { params: cleanParams }
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// GET /api/v1/capacity/weekly-heatmap
export const useCapacityWeeklyHeatmap = (params?: { startDate?: string }) => {
  const cleanParams = normalizeParams((params ?? {}) as Record<string, unknown>);
  return useQuery({
    queryKey: ["capacity", "weekly-heatmap", cleanParams],
    queryFn: async () => {
      const res = await apiRequest.get<CapacityWeeklyHeatmapItem[]>(
        API_SUFFIX.CAPACITY_WEEKLY_HEATMAP,
        { params: cleanParams }
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// GET /api/v1/capacity/stages/{stageId}/reallocation-suggestions
export const useCapacityReallocationSuggestions = (
  stageId: number | null,
  workDate?: string,
  enabled = true
) => {
  const cleanParams = normalizeParams({ workDate });
  return useQuery({
    queryKey: ["capacity", "reallocation-suggestions", stageId, cleanParams],
    enabled: enabled && !!stageId,
    queryFn: async () => {
      const res = await apiRequest.get<CapacityReallocationSuggestionsResponse>(
        API_SUFFIX.CAPACITY_STAGE_REALLOCATION(stageId as number),
        { params: cleanParams }
      );
      return res.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

// POST /api/v1/capacity/simulate
export const useSimulateCapacityReallocation = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    CapacitySimulationResponse,
    [CapacitySimulationRequest]
  >(async (payload) => {
    const res = await apiRequest.post<CapacitySimulationResponse>(
      API_SUFFIX.CAPACITY_SIMULATE,
      payload
    );
    return res.data;
  });

  const mutate = async (payload: CapacitySimulationRequest) => {
    try {
      const result = await execute(payload);
      toast.success("Mô phỏng thành công", {
        description: `Giảm ${result.reducedOverloadHours || 0} giờ quá tải`,
      });
      return result;
    } catch (err: unknown) {
      const errorMsg = (err as any)?.response?.data?.message || "Không thể mô phỏng dời lịch";
      toast.error("Lỗi mô phỏng", { description: errorMsg });
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
