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
  returnedAt?: string;
  returnReason?: string;
  inputQty?: number;
  outputQty?: number;
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
  waiting: number;
  printing: number;
  returned: number;
  completedToday: number;
}

export interface PostPrintCountsResponse {
  active: number;
}

export interface DispatchPrintOrdersRequest {
  printOrderIds: number[];
}

export interface CompletePrintOrderRequest {
  outputQty?: number;
}

export interface ReturnPrintOrderRequest {
  reason: string;
}

export interface PrintOrderListParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  designTypeId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
