// src/hooks/use-material.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import { z } from "zod";
import type {
  MaterialResponse,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  MaterialResponseIPaginate,
} from "@/Schema/material.schema";
import { InventoryTransactionResponseIPaginateSchema } from "@/Schema/generated";
import type { MaterialListParams, MaterialHistoryParams } from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

export type InventoryTransactionResponseIPaginate = z.infer<
  typeof InventoryTransactionResponseIPaginateSchema
>;

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

// ========== MATERIAL KEYS ==========

const materialKeys = {
  all: ["materials"] as const,
  lists: () => [...materialKeys.all, "list"] as const,
  list: (params?: MaterialListParams) =>
    [...materialKeys.lists(), normalizeParams(params || {})] as const,
  details: () => [...materialKeys.all, "detail"] as const,
  detail: (id: number) => [...materialKeys.details(), id] as const,
  histories: () => [...materialKeys.all, "history"] as const,
  history: (id: number, params?: MaterialHistoryParams) =>
    [...materialKeys.histories(), id, normalizeParams(params || {})] as const,
};

// ========== QUERIES ==========

export const useMaterials = (
  params?: MaterialListParams & { page?: number; size?: number; search?: string }
) => {
  const mappedParams = { ...params };
  if (mappedParams.page !== undefined) {
    mappedParams.pageNumber = mappedParams.page;
    delete mappedParams.page;
  }
  if (mappedParams.size !== undefined) {
    mappedParams.pageSize = mappedParams.size;
    delete mappedParams.size;
  }
  if (mappedParams.search !== undefined) {
    mappedParams.name = mappedParams.search;
    delete mappedParams.search;
  }

  return useQuery<MaterialResponseIPaginate>({
    queryKey: materialKeys.list(mappedParams),
    queryFn: async () => {
      const response = await apiRequest.get<MaterialResponseIPaginate>(
        API_SUFFIX.MATERIALS,
        {
          params: normalizeParams(mappedParams || {}),
        }
      );
      return response.data;
    },
  });
};

export const useMaterial = (id: number | null, enabled = true) => {
  const numericId = Number(id);
  const isValidId = id !== null && id !== undefined && !Number.isNaN(numericId) && numericId > 0;

  return useQuery<MaterialResponse>({
    queryKey: materialKeys.detail(isValidId ? numericId : 0),
    queryFn: async () => {
      if (!isValidId) {
        throw new Error("Invalid material ID");
      }
      const response = await apiRequest.get<MaterialResponse>(
        API_SUFFIX.MATERIAL_BY_ID(numericId)
      );
      return response.data;
    },
    enabled: enabled && isValidId,
  });
};

export const useMaterialHistory = (
  id: number | null,
  params?: MaterialHistoryParams,
  enabled = true
) => {
  const numericId = Number(id);
  const isValidId = id !== null && id !== undefined && !Number.isNaN(numericId) && numericId > 0;

  return useQuery<InventoryTransactionResponseIPaginate>({
    queryKey: materialKeys.history(isValidId ? numericId : 0, params || {}),
    queryFn: async () => {
      if (!isValidId) {
        throw new Error("Invalid material ID");
      }
      const response = await apiRequest.get<InventoryTransactionResponseIPaginate>(
        API_SUFFIX.MATERIAL_HISTORY(numericId),
        {
          params: normalizeParams(params || {}),
        }
      );
      return response.data;
    },
    enabled: enabled && isValidId,
  });
};

// ========== MUTATIONS ==========

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation<MaterialResponse, ApiError, CreateMaterialRequest>({
    mutationFn: async (data: CreateMaterialRequest) => {
      const response = await apiRequest.post<MaterialResponse>(
        API_SUFFIX.MATERIALS,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success("Tạo chất liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Tạo chất liệu thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MaterialResponse,
    ApiError,
    { id: number; data: UpdateMaterialRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiRequest.put<MaterialResponse>(
        API_SUFFIX.MATERIAL_BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      queryClient.invalidateQueries({ queryKey: materialKeys.detail(id) });
      toast.success("Cập nhật chất liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Cập nhật chất liệu thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.MATERIAL_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success("Xóa chất liệu thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Xóa chất liệu thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};
