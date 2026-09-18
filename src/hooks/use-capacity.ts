import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import type {
  CapacityKpiSummaryResponse,
  CapacityStageSummaryResponse,
  CapacityWeeklyHeatmapItem,
  CapacityReallocationSuggestionsResponse,
  CapacitySimulationRequest,
  CapacitySimulationResponse,
} from "@/types/capacity";

// ==========================================
// LEGACY CAPACITY HOOKS
// ==========================================

export const useCapacityKpiSummary = () => {
  return useQuery<CapacityKpiSummaryResponse>({
    queryKey: ["capacity-kpi-summary"],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<CapacityKpiSummaryResponse>(
          API_SUFFIX.CAPACITY_KPI_SUMMARY
        );
        return res.data;
      } catch (err) {
        return {
          totalOrders: 0,
          scheduledOrders: 0,
          unscheduledOrders: 0,
          overloadedStagesCount: 0,
          nearCapacityStagesCount: 0,
          avgUtilizationPercent: 0,
        };
      }
    },
  });
};

export const useCapacitySummary = (params?: { fromDate?: string; toDate?: string }) => {
  return useQuery<CapacityStageSummaryResponse[]>({
    queryKey: ["capacity-summary", params],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<CapacityStageSummaryResponse[]>(
          API_SUFFIX.CAPACITY_SUMMARY,
          { params }
        );
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
  });
};

export const useCapacityWeeklyHeatmap = (params?: { startDate?: string }) => {
  return useQuery<CapacityWeeklyHeatmapItem[]>({
    queryKey: ["capacity-weekly-heatmap", params],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<CapacityWeeklyHeatmapItem[]>(
          API_SUFFIX.CAPACITY_WEEKLY_HEATMAP,
          { params }
        );
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
  });
};

export const useCapacityReallocationSuggestions = (stageId: number, date?: string) => {
  return useQuery<CapacityReallocationSuggestionsResponse | null>({
    queryKey: ["capacity-reallocation-suggestions", stageId, date],
    enabled: !!stageId,
    queryFn: async () => {
      try {
        const res = await apiRequest.get<CapacityReallocationSuggestionsResponse>(
          API_SUFFIX.CAPACITY_STAGE_REALLOCATION(stageId),
          { params: { date } }
        );
        return res.data || null;
      } catch (err) {
        return null;
      }
    },
  });
};

export const useSimulateCapacityReallocation = () => {
  const queryClient = useQueryClient();

  const { loading, execute } = useAsyncCallback<
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
    const result = await execute(payload);
    queryClient.invalidateQueries({ queryKey: ["capacity-summary"] });
    queryClient.invalidateQueries({ queryKey: ["capacity-weekly-heatmap"] });
    return result;
  };

  return {
    isPending: loading,
    mutate,
  };
};

// ==========================================
// NEW DAILY WORKER CAPACITY PLANNING HOOKS
// ==========================================

export interface WorkerCapacitySummaryItem {
  stageId: number;
  stageCode: string;
  stageName: string;
  workDate: string;
  availableWorkerCount: number;
  requiredWorkerCount: number;
  totalPrintSheets: number;
  targetSheetsPerWorker: number;
  status: "no_work" | "sufficient" | "short" | "surplus";
  surplusWorkers: number;
  shortageWorkers: number;
}

export interface StageWorkerDetailItem {
  productionOrderId: number;
  orderCode: string;
  printSheetCount: number;
  requiredWorkers: number;
  schedulingDay: string;
}

export interface SaveWorkerCapacityPayload {
  stageId: number;
  workDate: string;
  availableWorkerCount: number;
  isActive?: boolean;
}

export interface BulkSaveWorkerCapacityPayload {
  items: SaveWorkerCapacityPayload[];
  copyFromPreviousWeek?: boolean;
  applyRange?: boolean;
}

// GET /api/capacity/worker-summary?fromDate=...&toDate=...
export const useWorkerCapacitySummary = (fromDate?: string, toDate?: string) => {
  return useQuery<WorkerCapacitySummaryItem[]>({
    queryKey: ["capacity-worker-summary", fromDate, toDate],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<WorkerCapacitySummaryItem[]>(
          API_SUFFIX.CAPACITY_WORKER_SUMMARY,
          { params: { fromDate, toDate } }
        );
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
  });
};

// GET /api/capacity/worker-summary/daily?date=...
export const useWorkerCapacityDaily = (date?: string) => {
  return useQuery<WorkerCapacitySummaryItem[]>({
    queryKey: ["capacity-worker-summary-daily", date],
    queryFn: async () => {
      try {
        const res = await apiRequest.get<WorkerCapacitySummaryItem[]>(
          API_SUFFIX.CAPACITY_WORKER_SUMMARY_DAILY,
          { params: { date } }
        );
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
  });
};

// GET /api/capacity/stages/{stageId}/worker-details?date=...
export const useStageWorkerDetails = (stageId: number | null, date?: string) => {
  return useQuery<StageWorkerDetailItem[]>({
    queryKey: ["capacity-stage-worker-details", stageId, date],
    enabled: !!stageId,
    queryFn: async () => {
      try {
        const res = await apiRequest.get<StageWorkerDetailItem[]>(
          API_SUFFIX.CAPACITY_STAGE_WORKER_DETAILS(stageId!),
          { params: { date } }
        );
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
  });
};

// POST /api/capacity/worker-config
export const useSaveWorkerConfig = () => {
  const queryClient = useQueryClient();

  const { loading, execute } = useAsyncCallback<
    any,
    [SaveWorkerCapacityPayload]
  >(async (payload) => {
    const res = await apiRequest.post(API_SUFFIX.CAPACITY_WORKER_CONFIG, payload);
    return res.data;
  });

  const mutate = async (payload: SaveWorkerCapacityPayload) => {
    const result = await execute(payload);
    queryClient.invalidateQueries({ queryKey: ["capacity-worker-summary"] });
    queryClient.invalidateQueries({ queryKey: ["capacity-worker-summary-daily"] });
    return result;
  };

  return {
    isPending: loading,
    mutate,
  };
};

// POST /api/capacity/worker-config/bulk
export const useBulkSaveWorkerConfig = () => {
  const queryClient = useQueryClient();

  const { loading, execute } = useAsyncCallback<
    any,
    [BulkSaveWorkerCapacityPayload]
  >(async (payload) => {
    const res = await apiRequest.post(API_SUFFIX.CAPACITY_WORKER_CONFIG_BULK, payload);
    return res.data;
  });

  const mutate = async (payload: BulkSaveWorkerCapacityPayload) => {
    const result = await execute(payload);
    queryClient.invalidateQueries({ queryKey: ["capacity-worker-summary"] });
    queryClient.invalidateQueries({ queryKey: ["capacity-worker-summary-daily"] });
    return result;
  };

  return {
    isPending: loading,
    mutate,
  };
};
