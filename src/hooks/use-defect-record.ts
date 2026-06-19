// src/hooks/use-defect-record.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  DefectRecordResponse,
  CreateDefectRecordRequest,
  UpdateDefectRecordRequest,
  DefectRecordListParams,
  DefectRecordResponsePaginate,
  DefectRecordSummaryByUserResponse,
} from "@/Schema";

// Defect Record CRUD hooks
const {
  api: defectRecordCrudApi,
  keys: defectRecordKeys,
  useList: useDefectRecordListBase,
  useDetail: useDefectRecordDetailBase,
  useCreate: useCreateDefectRecordBase,
  useUpdate: useUpdateDefectRecordBase,
  useDelete: useDeleteDefectRecordBase,
} = createCrudHooks<
  DefectRecordResponse,
  CreateDefectRecordRequest,
  UpdateDefectRecordRequest,
  number,
  DefectRecordListParams,
  DefectRecordResponsePaginate
>({
  rootKey: "defect-records",
  basePath: API_SUFFIX.DEFECT_RECORDS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã ghi nhận lỗi sản xuất thành công",
    updateSuccess: "Đã cập nhật bản ghi lỗi thành công",
    deleteSuccess: "Đã xóa bản ghi lỗi thành công",
    createError: "Không thể ghi nhận lỗi sản xuất",
    updateError: "Không thể cập nhật bản ghi lỗi",
    deleteError: "Không thể xóa bản ghi lỗi",
  },
});

// Export CRUD hooks
export const useDefectRecords = (params?: DefectRecordListParams) =>
  useDefectRecordListBase(params ?? ({} as DefectRecordListParams));

export const useDefectRecord = (id: number | null, enabled = true) =>
  useDefectRecordDetailBase(id, enabled);

export const useCreateDefectRecord = () => useCreateDefectRecordBase();
export const useUpdateDefectRecord = () => useUpdateDefectRecordBase();
export const useDeleteDefectRecord = () => useDeleteDefectRecordBase();

// Custom hook: Defect records summary by user (for accounting deduction reports)
export const useDefectSummaryByUser = (
  params?: { fromDate?: string; toDate?: string; defectSource?: string },
  enabled = true
) => {
  return useQuery({
    queryKey: ["defect-records", "summary-by-user", params],
    enabled,
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<DefectRecordSummaryByUserResponse[]>(
        API_SUFFIX.DEFECT_RECORDS_SUMMARY_BY_USER,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Custom hook: Defect records by production order
export const useDefectRecordsByProductionOrder = (
  productionOrderId: number | null,
  params?: DefectRecordListParams,
  enabled = true
) => {
  return useQuery({
    queryKey: ["defect-records", "by-production-order", productionOrderId, params],
    enabled: enabled && !!productionOrderId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<DefectRecordResponsePaginate>(
        API_SUFFIX.DEFECT_RECORDS_BY_PRODUCTION_ORDER(productionOrderId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export { defectRecordCrudApi, defectRecordKeys };
