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
import type {
  DebtReportArSummaryParams,
  DebtReportArDetailParams,
  DebtReportArAgingParams,
  DebtReportApSummaryParams,
  DebtReportApDetailParams,
  DebtReportApAgingParams,
  DebtReportCollectionScheduleParams,
} from "@/Schema";

// ================== AR (Accounts Receivable) ==================

export const useARSummary = (params?: DebtReportArSummaryParams) => {
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

export const useARDetail = (params?: DebtReportArDetailParams) => {
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

export const useARAging = (params?: DebtReportArAgingParams) => {
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

export const useExportARAging = (params?: DebtReportArAgingParams) => {
  return useQuery({
    queryKey: ["ar-aging-export", params],
    enabled: false,
    queryFn: async () => {
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

export const useAPSummary = (params?: DebtReportApSummaryParams) => {
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

export const useAPDetail = (params?: DebtReportApDetailParams) => {
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

export const useAPAging = (params?: DebtReportApAgingParams) => {
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

export const useCollectionSchedule = (params?: DebtReportCollectionScheduleParams) => {
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

