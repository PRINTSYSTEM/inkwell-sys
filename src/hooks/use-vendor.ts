import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  CreateVendorRequest,
  UpdateVendorRequest,
} from "@/Schema/vendor.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

// Vendor list params
export type VendorListParams = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  vendorType?: string; // Filter by vendor type (plate, die)
};

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
export const useActiveVendors = (vendorType?: "plate" | "die") => {
  return useQuery({
    queryKey: [vendorKeys.all[0], "active", vendorType],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        isActive: true,
        pageNumber: 1,
        pageSize: 1000, // Lấy tất cả vendors active
      };
      
      // Note: vendorType không có trong OpenAPI schema của /vendors endpoint
      // Có thể cần filter ở client side hoặc backend cần thêm query param này
      // Tạm thời comment lại để tránh lỗi
      // if (vendorType) {
      //   params.vendorType = vendorType;
      // }
      
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

// Export for custom usage
export { vendorCrudApi, vendorKeys };


