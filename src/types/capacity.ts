export type SlaStatusType = "ok" | "warning" | "late" | "inactive";

export interface ProductionStepSla {
  id?: number;
  stepName?: string;
  stageId?: number;
  stageCode?: string;
  flowId?: number | null;
  readyAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  waitingMinutes?: number | null;
  waitingStatus?: SlaStatusType;
  processingMinutes?: number | null;
  processingStatus?: SlaStatusType;
  overdueMinutes?: number | null;
}

export interface CapacityKpiSummaryResponse {
  totalOrders: number;
  scheduledOrders: number;
  unscheduledOrders: number;
  overloadedStagesCount: number;
  nearCapacityStagesCount: number;
  avgUtilizationPercent: number;
}

export interface CapacityStageSummaryResponse {
  stageId: number;
  stageCode: string;
  stageName: string;
  workDate: string;
  orderCount: number;
  demandHours: number;
  capacityHours: number;
  differenceHours: number;
  utilizationPercent: number;
  isOverloaded: boolean;
  status: string; // e.g. "Quá tải", "Gần đầy", "Bình thường"
}

export interface CapacityWeeklyHeatmapItem {
  stageId: number;
  stageCode: string;
  stageName: string;
  dailyUtilization: Record<string, number>; // date -> utilization percent (e.g. "2026-09-12": 72.0)
}

export interface CapacityReallocationCandidate {
  productionOrderId: number;
  proofingOrderCode: string;
  estimatedHours: number;
  deadline: string;
  priorityDisplay: string;
  suggestedTargetDate: string;
  suggestedTargetDateDisplay: string;
}

export interface CapacityReallocationSuggestionsResponse {
  stageId: number;
  stageCode: string;
  stageName: string;
  workDate: string;
  isOverloaded: boolean;
  demandHours: number;
  capacityHours: number;
  excessHours: number;
  candidates: CapacityReallocationCandidate[];
}

export interface CapacityReallocationItem {
  productionOrderId: number;
  targetWorkDate: string;
}

export interface CapacitySimulationRequest {
  reallocations: CapacityReallocationItem[];
}

export interface CapacitySimulationResponse {
  success: boolean;
  message?: string;
  originalOverloadHours?: number;
  reducedOverloadHours?: number;
  remainingOverloadHours?: number;
}
