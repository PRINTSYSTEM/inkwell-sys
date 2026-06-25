import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type {
  MaterialSpecResponse,
  MaterialSpecResponseIPaginate,
  CreateMaterialSpecRequest,
  UpdateMaterialSpecRequest,
  MaterialSpecListParams,
} from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

// ========== MATERIAL SPEC KEYS ==========

const materialSpecKeys = {
  all: ["materialSpecs"] as const,
  lists: () => [...materialSpecKeys.all, "list"] as const,
  list: (params?: MaterialSpecListParams) =>
    [...materialSpecKeys.lists(), normalizeParams(params || {})] as const,
  details: () => [...materialSpecKeys.all, "detail"] as const,
  detail: (id: number) => [...materialSpecKeys.details(), id] as const,
  byMaterialType: (materialTypeId: number) =>
    [...materialSpecKeys.all, "by-material-type", materialTypeId] as const,
  byVendor: (vendorId: number) =>
    [...materialSpecKeys.all, "by-vendor", vendorId] as const,
};

// ========== QUERIES ==========

export const useMaterialSpecs = (params?: MaterialSpecListParams) => {
  return useQuery<MaterialSpecResponseIPaginate>({
    queryKey: materialSpecKeys.list(params),
    queryFn: async () => {
      const response = await apiRequest.get<MaterialSpecResponseIPaginate>(
        API_SUFFIX.MATERIAL_SPECS,
        {
          params: normalizeParams(params || {}),
        }
      );
      return response.data;
    },
  });
};

export const useMaterialSpec = (id: number | null, enabled = true) => {
  return useQuery<MaterialSpecResponse>({
    queryKey: materialSpecKeys.detail(id!),
    queryFn: async () => {
      const response = await apiRequest.get<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPEC_BY_ID(id!)
      );
      return response.data;
    },
    enabled: enabled && id !== null,
  });
};

export const useMaterialSpecsByMaterialType = (
  materialTypeId: number | null,
  enabled = true
) => {
  return useQuery<MaterialSpecResponse[]>({
    queryKey: materialSpecKeys.byMaterialType(materialTypeId!),
    queryFn: async () => {
      const response = await apiRequest.get<MaterialSpecResponse[]>(
        API_SUFFIX.MATERIAL_SPECS_BY_MATERIAL_TYPE(materialTypeId!)
      );
      return response.data;
    },
    enabled: enabled && materialTypeId !== null,
  });
};

export const useMaterialSpecsByVendor = (
  vendorId: number | null,
  enabled = true
) => {
  return useQuery<MaterialSpecResponse[]>({
    queryKey: materialSpecKeys.byVendor(vendorId!),
    queryFn: async () => {
      const response = await apiRequest.get<MaterialSpecResponse[]>(
        API_SUFFIX.MATERIAL_SPECS_BY_VENDOR(vendorId!)
      );
      return response.data;
    },
    enabled: enabled && vendorId !== null,
  });
};

// ========== MUTATIONS ==========

export const useCreateMaterialSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<MaterialSpecResponse, ApiError, CreateMaterialSpecRequest>({
    mutationFn: async (data: CreateMaterialSpecRequest) => {
      const response = await apiRequest.post<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPECS,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialSpecKeys.all });
      toast.success("Tạo cấu hình định lượng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo cấu hình định lượng thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useUpdateMaterialSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MaterialSpecResponse,
    ApiError,
    { id: number; data: UpdateMaterialSpecRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiRequest.put<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPEC_BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: materialSpecKeys.all });
      queryClient.invalidateQueries({ queryKey: materialSpecKeys.detail(id) });
      toast.success("Cập nhật cấu hình định lượng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Cập nhật cấu hình định lượng thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useDeleteMaterialSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.MATERIAL_SPEC_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialSpecKeys.all });
      toast.success("Xóa cấu hình định lượng thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xóa cấu hình định lượng thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};
