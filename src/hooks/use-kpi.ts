import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";

export type KpiGroupBy = "Lsx" | "Stage" | "Flow" | "Date" | "Week" | "Month";

export interface KpiReportItem {
  stageId?: number;
  stageCode?: string;
  stageName?: string;
  flowId?: number | string;
  flowCode?: string;
  flowName?: string;
  productionOrderId?: number;
  orderCode?: string;
  dateLabel?: string;
  totalPrintSheets: number;
  totalWorkers: number;
  avgProductivity: number;
  weightedKpiAchievementPercent: number;
  completedStepsCount: number;
  totalStepsInGroup: number;
}

export interface KpiReportSummary {
  totalPrintSheets: number;
  totalWorkers: number;
  overallAvgProductivity: number;
  overallWeightedKpiPercent: number;
  totalCompletedSteps: number;
}

export interface KpiReportResponse {
  fromDate: string;
  toDate: string;
  groupBy: KpiGroupBy;
  items: KpiReportItem[];
  summary: KpiReportSummary;
}

export interface KpiDrilldownItem {
  stepId: number;
  productionOrderId: number;
  orderCode: string;
  stageCode: string;
  stageName: string;
  completedAt: string;
  printSheetCount: number;
  workerCount: number;
  actualProductivity: number;
  kpiAchievementPercent: number;
  targetSheetsPerWorker: number;
}

export interface KpiTrendItem {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totalPrintSheets: number;
  totalWorkers: number;
  weightedKpiAchievementPercent: number;
  changePercent: number;
  trendDirection: "up" | "down" | "flat";
}

export interface KpiTrendResponse {
  groupBy: string;
  stageId?: number;
  items: KpiTrendItem[];
}

export interface KpiReportParams {
  fromDate?: string;
  toDate?: string;
  groupBy?: KpiGroupBy;
  stageId?: number;
  flowId?: number | string;
  productionOrderId?: number;
}

// GET /api/kpi/report
export const useKpiReport = (params: KpiReportParams) => {
  return useQuery<KpiReportResponse>({
    queryKey: ["kpi-report", params],
    queryFn: async () => {
      const res = await apiRequest.get<KpiReportResponse>(API_SUFFIX.KPI_REPORT, {
        params,
      });
      return res.data;
    },
  });
};

// GET /api/kpi/drilldown
export const useKpiDrilldown = (
  groupBy?: KpiGroupBy,
  groupKey?: string | number,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery<KpiDrilldownItem[]>({
    queryKey: ["kpi-drilldown", groupBy, groupKey, fromDate, toDate],
    enabled: !!groupBy && groupKey !== undefined && groupKey !== null,
    queryFn: async () => {
      const res = await apiRequest.get<KpiDrilldownItem[]>(API_SUFFIX.KPI_DRILLDOWN, {
        params: { groupBy, groupKey, fromDate, toDate },
      });
      return res.data || [];
    },
  });
};

// GET /api/kpi/trend
export const useKpiTrend = (
  groupBy: "Week" | "Month" = "Week",
  stageId?: number,
  periods: number = 12
) => {
  return useQuery<KpiTrendResponse>({
    queryKey: ["kpi-trend", groupBy, stageId, periods],
    queryFn: async () => {
      const res = await apiRequest.get<KpiTrendResponse>(API_SUFFIX.KPI_TREND, {
        params: { groupBy, stageId, periods },
      });
      return res.data;
    },
  });
};

// GET /api/kpi/lsx/{lsxId}
export const useLsxKpiReport = (
  lsxId: number | null,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery<KpiReportResponse>({
    queryKey: ["kpi-lsx-report", lsxId, fromDate, toDate],
    enabled: !!lsxId,
    queryFn: async () => {
      const res = await apiRequest.get<KpiReportResponse>(
        API_SUFFIX.KPI_LSX_REPORT(lsxId!),
        { params: { fromDate, toDate } }
      );
      return res.data;
    },
  });
};
