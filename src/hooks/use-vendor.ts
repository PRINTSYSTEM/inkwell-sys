import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

import type {
  VendorResponse,
  VendorResponsePaginate,
  VendorCountOptionResponsePaginate,
  CreateVendorRequest,
  UpdateVendorRequest,
  SettleVendorDebtRequest,
  SettleVendorDebtBatchItem,
  VendorDebtHistoryResponse,
} from "@/Schema/vendor.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type { VendorListParams } from "@/Schema";

const {
  api: vendorCrudApi,
  keys: vendorKeys,
  useList: useVendorListBase,
  useDetail: useVendorDetailBase,
  useCreate: useCreateVendorBase,
  useUpdate: useUpdateVendorBase,
  useDelete: useDeleteVendorBase,
} = createCrudHooks<
  VendorResponse,
  CreateVendorRequest,
  UpdateVendorRequest,
  number,
  VendorListParams,
  VendorResponsePaginate
>({
  rootKey: "vendors",
  basePath: API_SUFFIX.VENDORS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo nhà cung cấp thành công",
    updateSuccess: "Đã cập nhật nhà cung cấp thành công",
    deleteSuccess: "Đã xóa nhà cung cấp thành công",
    deleteError: "Không thể xóa nhà cung cấp",
    createError: "Không thể tạo nhà cung cấp",
    updateError: "Không thể cập nhật nhà cung cấp",
  },
});

export const useVendors = (params?: VendorListParams) =>
  useVendorListBase(params ?? ({} as VendorListParams));

export const useVendor = (id: number | null, enabled = true) =>
  useVendorDetailBase(id, enabled);

export const useCreateVendor = () => useCreateVendorBase();
export const useUpdateVendor = () => useUpdateVendorBase();
export const useDeleteVendor = () => useDeleteVendorBase();

// GET /vendors?isActive=true&vendorType=plate
// Lấy danh sách nhà cung cấp đang hoạt động theo loại
// Note: Sử dụng endpoint /vendors với query params thay vì /vendors/active
// vì endpoint /vendors/active không có trong OpenAPI schema
export const useActiveVendors = (vendorType?: "plate" | "die" | "printing" | "material" | "paper" | "ink" | "film" | "solvent" | "glue" | "accessory") => {
  return useQuery({
    queryKey: [vendorKeys.all[0], "active", vendorType],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        isActive: true,
        pageNumber: 1,
        pageSize: 100, // Lấy tất cả vendors active
      };

      if (vendorType) {
        params.vendorType = vendorType.toUpperCase();
      }

      const normalizedParams = normalizeParams(params);
      const res = await apiRequest.get<VendorResponsePaginate>(
        API_SUFFIX.VENDORS,
        { params: normalizedParams }
      );

      // Filter theo vendorType ở client side nếu cần
      let vendors = res.data.items ?? [];
      if (vendorType) {
        vendors = vendors.filter(
          (v) => v.vendorType?.toLowerCase() === vendorType.toLowerCase()
        );
      }

      return vendors;
    },
  });
};

// Alias for backward compatibility - get active plate vendors
export const useActivePlateVendors = () => useActiveVendors("plate");

// Alias for die vendors
export const useActiveDieVendors = () => useActiveVendors("die");

// Alias for printing vendors
export const useActivePrintingVendors = () => useActiveVendors("printing");

// GET /vendors/plate-count-options
export const usePlateCountOptions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [vendorKeys.all[0], "plate-count-options"],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<VendorCountOptionResponsePaginate>(
        API_SUFFIX.VENDORS_PLATE_COUNT_OPTIONS
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /vendors/{id}/debt/settlements
export const useVendorDebtSettlements = (vendorId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["vendor-settlements", vendorId],
    enabled: enabled && !!vendorId,
    queryFn: async () => {
      const res = await apiRequest.get<VendorDebtHistoryResponse[]>(
        API_SUFFIX.VENDOR_DEBT_SETTLEMENTS(vendorId)
      );
      return res.data;
    },
  });
};

// POST /vendors/{id}/debt/settle
export const useSettleVendorDebt = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; vendorId: number; vendorName: string; currentDebt: number },
    ApiError,
    { id: number; data: SettleVendorDebtRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest.post<{ message: string; vendorId: number; vendorName: string; currentDebt: number }>(
        API_SUFFIX.VENDOR_SETTLE_DEBT(id),
        data
      );
      return res.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", id] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-settlements", id] });
      toast.success(data.message || "Tất toán công nợ thành công");
    },
  });
};

// POST /vendors/debt/settle-batch
export const useSettleVendorDebtBatch = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; successCount: number },
    ApiError,
    SettleVendorDebtBatchItem[]
  >({
    mutationFn: async (data) => {
      const res = await apiRequest.post<{ message: string; successCount: number }>(
        API_SUFFIX.VENDOR_SETTLE_DEBT_BATCH,
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-settlements"] });
      toast.success(data.message || `Tất toán hàng loạt thành công ${data.successCount} nhà cung cấp`);
    },
  });
};

// DELETE /vendors/debt/settlements/{historyId}
export const useDeleteVendorDebtSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { historyId: number; vendorId: number }
  >({
    mutationFn: async ({ historyId }) => {
      await apiRequest.delete(
        API_SUFFIX.VENDOR_DELETE_DEBT_SETTLEMENT(historyId)
      );
    },
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-settlements", vendorId] });
      toast.success("Hoàn tác tất toán công nợ thành công");
    },
  });
};

export interface VendorOtherCostsParams {
  fromDate?: string;
  toDate?: string;
}

// GET /vendors/{id}/debt/other-costs
export const useVendorOtherCosts = (
  vendorId: number,
  params?: VendorOtherCostsParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["vendor-other-costs", vendorId, params],
    enabled: enabled && !!vendorId,
    queryFn: async () => {
      const res = await apiRequest.get<VendorDebtHistoryResponse[]>(
        API_SUFFIX.VENDOR_OTHER_COSTS(vendorId),
        { params }
      );
      return res.data;
    },
  });
};

export interface CreateVendorOtherCostRequest {
  amount: number;
  note: string;
  recordedAt?: string | null;
}

// POST /vendors/{id}/debt/other-cost
export const useCreateVendorOtherCost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; vendorId: number; vendorName: string; currentDebt: number },
    ApiError,
    { vendorId: number; data: CreateVendorOtherCostRequest }
  >({
    mutationFn: async ({ vendorId, data }) => {
      const res = await apiRequest.post<{ message: string; vendorId: number; vendorName: string; currentDebt: number }>(
        API_SUFFIX.VENDOR_OTHER_COST(vendorId),
        data
      );
      return res.data;
    },
    onSuccess: (data, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-other-costs", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-settlements", vendorId] });
      toast.success(data.message || "Ghi nhận chi phí khác vào công nợ thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Ghi nhận chi phí khác thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// DELETE /vendors/debt/other-costs/{historyId}
export const useDeleteVendorOtherCost = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { historyId: number; vendorId: number }
  >({
    mutationFn: async ({ historyId }) => {
      await apiRequest.delete(
        API_SUFFIX.VENDOR_DELETE_OTHER_COST(historyId)
      );
    },
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(vendorId) });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["ap-summary"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail"] });
      queryClient.invalidateQueries({ queryKey: ["ap-detail-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-other-costs", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-settlements", vendorId] });
      toast.success("Xóa khoản chi phí khác thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xóa khoản chi phí khác thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// Export for custom usage
export { vendorCrudApi, vendorKeys };
