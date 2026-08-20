import type { ProductionOrderResponse } from "./production.schema";

export type PrintOrderStatus =
  | "not_dispatched"
  | "waiting"
  | "printing"
  | "completed"
  | "returned";

export interface PrintOrderResponse {
  id: number;
  productionOrderId: number;
  status: PrintOrderStatus;
  statusDisplayName?: string;
  dispatchedByName?: string;
  dispatchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  returnedByName?: string | null;
  returnedAt?: string | null;
  returnReason?: string | null;
  returnType?: string | null;
  returnTypeDisplayName?: string | null;
  sortOrder?: number;
  isPaused?: boolean | null;
  pauseReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  inputQty?: number;
  outputQty?: number;
  impositionCompletedAt?: string | null;
  impositionDate?: string | null;
  designTypeId?: number | null;
  designTypeCode?: string | null;
  designTypeName?: string | null;
  materialTypeName?: string | null;
  totalQuantity?: number | null;
  paperSizeName?: string | null;
  itemCount?: number | null;
  basisWeight?: number | null;
  requiresFluteCheck?: boolean;
  fluteMaterialName?: string | null;
  isPaperReady?: boolean | null;
  isFluteReady?: boolean | null;
  productionOrder?: ProductionOrderResponse;
}

export interface PrintOrderResponsePaginate {
  items: PrintOrderResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PrintOrderCountsResponse {
  notDispatched?: number;
  notQueued?: number;
  queued?: number;
  waiting?: number;
  printing: number;
  returned: number;
  completed?: number;
  completedToday: number;
}

export interface PostPrintCountsResponse {
  active: number;
}

export interface DispatchPrintOrdersRequest {
  printOrderIds: number[];
}

export interface EnqueuePrintOrdersRequest {
  printOrderIds: number[];
}

export interface PausePrintOrderRequest {
  reason: string;
}

export interface CompletePrintOrderRequest {
  outputQty?: number;
}

export interface ReturnPrintOrderRequest {
  reason: string;
}

export interface ReorderPrintOrdersRequest {
  printOrderIds: number[];
}

export interface ReturnToProofingRequest {
  reason: string;
}

export interface PrintOrderHistoryItem {
  id: number;
  productionOrderId: number;
  printOrderId: number;
  eventType: string;
  eventTypeDisplayName: string;
  reason?: string | null;
  userId: number;
  userName?: string | null;
  createdAt: string;
}

export interface PrintOrderListParams {
  pageNumber?: number;
  pageSize?: number;
  tab?: "processing" | "completed" | string;
  status?: string;
  designTypeId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DispatchCandidateDesignTypeSummary {
  designTypeId: number;
  code: string;
  name: string;
  count: number;
}

export interface DispatchCandidateSummaryResponse {
  total: number;
  eligible: number;
  missingKem: number;
  missingKhuon: number;
  missingGiay: number;
  missingFlute: number;
  byDesignType: DispatchCandidateDesignTypeSummary[];
}
