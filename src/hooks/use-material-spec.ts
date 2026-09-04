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

export const useMaterialSpecs = (
  materialTypeId: number | null,
  params?: MaterialSpecListParams
) => {
  return useQuery<MaterialSpecResponseIPaginate>({
    queryKey: [...materialSpecKeys.all, "paginated", materialTypeId, params],
    queryFn: async () => {
      const queryParams = {
        ...params,
        ...(materialTypeId ? { materialTypeId } : {}),
      };

      const response = await apiRequest.get<MaterialSpecResponseIPaginate>(
        API_SUFFIX.MATERIAL_SPECS_GLOBAL_PAGINATED,
        {
          params: normalizeParams(queryParams),
        }
      );
      return response.data;
    },
    enabled: true,
  });
};

export const useMaterialSpec = (
  materialTypeId: number | null,
  id: number | null,
  enabled = true
) => {
  return useQuery<MaterialSpecResponse>({
    queryKey: [...materialSpecKeys.all, "detail", materialTypeId, id],
    queryFn: async () => {
      const response = await apiRequest.get<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPEC_BY_ID(materialTypeId!, id!)
      );
      return response.data;
    },
    enabled: enabled && materialTypeId !== null && id !== null,
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
        API_SUFFIX.MATERIAL_SPECS(materialTypeId!)
      );
      return response.data;
    },
    enabled: enabled && materialTypeId !== null,
  });
};

// ========== MUTATIONS ==========

export const useCreateMaterialSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MaterialSpecResponse,
    ApiError,
    { materialTypeId: number; data: CreateMaterialSpecRequest }
  >({
    mutationFn: async ({ materialTypeId, data }) => {
      const response = await apiRequest.post<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPECS(materialTypeId),
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
    { materialTypeId: number; id: number; data: UpdateMaterialSpecRequest }
  >({
    mutationFn: async ({ materialTypeId, id, data }) => {
      const response = await apiRequest.put<MaterialSpecResponse>(
        API_SUFFIX.MATERIAL_SPEC_BY_ID(materialTypeId, id),
        data
      );
      return response.data;
    },
    onSuccess: (_, { materialTypeId, id }) => {
      queryClient.invalidateQueries({ queryKey: materialSpecKeys.all });
      queryClient.invalidateQueries({ queryKey: [...materialSpecKeys.all, "detail", materialTypeId, id] });
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

  return useMutation<void, ApiError, { materialTypeId: number; id: number }>({
    mutationFn: async ({ materialTypeId, id }) => {
      await apiRequest.delete(API_SUFFIX.MATERIAL_SPEC_BY_ID(materialTypeId, id));
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
