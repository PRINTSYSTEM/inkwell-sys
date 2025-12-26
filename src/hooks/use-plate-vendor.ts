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
  PlateVendorResponse,
  PlateVendorResponsePagedResponse,
  CreatePlateVendorRequest,
  UpdatePlateVendorRequest,
} from "@/Schema/plate-vendor.schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

// Plate vendor list params
export type PlateVendorListParams = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
};

const {
  api: plateVendorCrudApi,
  keys: plateVendorKeys,
  useList: usePlateVendorListBase,
  useDetail: usePlateVendorDetailBase,
  useCreate: useCreatePlateVendorBase,
  useUpdate: useUpdatePlateVendorBase,
  useDelete: useDeletePlateVendorBase,
} = createCrudHooks<
  PlateVendorResponse,
  CreatePlateVendorRequest,
  UpdatePlateVendorRequest,
  number,
  PlateVendorListParams,
  PlateVendorResponsePagedResponse
>({
  rootKey: "plate-vendors",
  basePath: API_SUFFIX.PLATE_VENDORS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo nhà cung cấp ghi kẽm thành công",
    updateSuccess: "Đã cập nhật nhà cung cấp ghi kẽm thành công",
    deleteSuccess: "Đã xóa nhà cung cấp ghi kẽm thành công",
    deleteError: "Không thể xóa nhà cung cấp ghi kẽm",
    createError: "Không thể tạo nhà cung cấp ghi kẽm",
    updateError: "Không thể cập nhật nhà cung cấp ghi kẽm",
  },
});

export const usePlateVendors = (params?: PlateVendorListParams) =>
  usePlateVendorListBase(params ?? ({} as PlateVendorListParams));

export const usePlateVendor = (id: number | null, enabled = true) =>
  usePlateVendorDetailBase(id, enabled);

export const useCreatePlateVendor = () => useCreatePlateVendorBase();
export const useUpdatePlateVendor = () => useUpdatePlateVendorBase();
export const useDeletePlateVendor = () => useDeletePlateVendorBase();

// GET /plate-vendors/active
// Lấy danh sách nhà cung cấp ghi kẽm đang hoạt động
export const useActivePlateVendors = () => {
  return useQuery({
    queryKey: [plateVendorKeys.all[0], "active"],
    queryFn: async () => {
      const res = await apiRequest.get<PlateVendorResponse[]>(
        API_SUFFIX.PLATE_VENDORS_ACTIVE
      );
      return res.data;
    },
  });
};

// Export for custom usage
export { plateVendorCrudApi, plateVendorKeys };

