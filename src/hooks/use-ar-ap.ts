// src/hooks/use-ar-ap.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  ARSummaryResponse,
  ARSummaryResponseIPaginate,
  ARDetailResponse,
  ARDetailResponseIPaginate,
  ARAgingResponse,
  ARAgingResponseIPaginate,
  APSummaryResponse,
  APSummaryResponseIPaginate,
  APDetailResponse,
  APDetailResponseIPaginate,
  APAgingResponse,
  APAgingResponseIPaginate,
  CollectionScheduleResponse,
  CollectionScheduleResponseIPaginate,
} from "@/Schema/accounting.schema";

// ================== AR (Accounts Receivable) ==================

export interface ARSummaryParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  search?: string;
}

export const useARSummary = (params?: ARSummaryParams) => {
  return useQuery({
    queryKey: ["ar-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARSummaryResponseIPaginate>(
        API_SUFFIX.AR_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export interface ARDetailParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  orderId?: number;
  search?: string;
}

export const useARDetail = (params?: ARDetailParams) => {
  return useQuery({
    queryKey: ["ar-detail", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARDetailResponseIPaginate>(
        API_SUFFIX.AR_DETAIL,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export interface ARAgingParams {
  pageNumber?: number;
  pageSize?: number;
  asOfDate?: string;
  customerId?: number;
  search?: string;
}

export const useARAging = (params?: ARAgingParams) => {
  return useQuery({
    queryKey: ["ar-aging", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ARAgingResponseIPaginate>(
        API_SUFFIX.AR_AGING,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useExportARAging = () => {
  return useQuery({
    queryKey: ["ar-aging-export"],
    enabled: false,
    queryFn: async (params?: ARAgingParams) => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<Blob>(API_SUFFIX.AR_AGING_EXPORT, {
        params: normalizedParams,
        responseType: "blob",
      });
      return res.data;
    },
  });
};

// ================== AP (Accounts Payable) ==================

export interface APSummaryParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  vendorId?: number;
  search?: string;
}

export const useAPSummary = (params?: APSummaryParams) => {
  return useQuery({
    queryKey: ["ap-summary", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APSummaryResponseIPaginate>(
        API_SUFFIX.AP_SUMMARY,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export interface APDetailParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  vendorId?: number;
  orderId?: number;
  search?: string;
}

export const useAPDetail = (params?: APDetailParams) => {
  return useQuery({
    queryKey: ["ap-detail", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APDetailResponseIPaginate>(
        API_SUFFIX.AP_DETAIL,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export interface APAgingParams {
  pageNumber?: number;
  pageSize?: number;
  asOfDate?: string;
  vendorId?: number;
  search?: string;
}

export const useAPAging = (params?: APAgingParams) => {
  return useQuery({
    queryKey: ["ap-aging", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<APAgingResponseIPaginate>(
        API_SUFFIX.AP_AGING,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== COLLECTION SCHEDULE ==================

export interface CollectionScheduleParams {
  pageNumber?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  search?: string;
}

export const useCollectionSchedule = (params?: CollectionScheduleParams) => {
  return useQuery({
    queryKey: ["collection-schedule", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<CollectionScheduleResponseIPaginate>(
        API_SUFFIX.COLLECTION_SCHEDULE,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

