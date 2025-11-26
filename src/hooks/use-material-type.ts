import {
  bulkAddMaterials,
  BulkAddMaterialsRequest,
  getMaterialTypes,
  getMaterialTypeById,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
} from "@/apis/material-type.api";

import { api } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";
import { CreateMaterialTypeRequest, MaterialTypeEntity } from "@/Schema";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// ----------------- Query Keys -----------------
const MATERIAL_TYPE_KEYS = {
  all: ["material-types"] as const,
  materialTypes: (params?: { status?: string }) =>
    ["material-types", params ?? {}] as const,
  materialType: (id: number) => ["material-type", id] as const,
} as const;

const DESIGN_TYPE_KEYS = {
  designTypes: (params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
  }) => ["design-types", params],
  designType: (id: number) => ["design-type", id],
} as const;

// ----------------- Bulk add -----------------
export const useBulkAddMaterials = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BulkAddMaterialsRequest) => bulkAddMaterials(data),
    onSuccess: () => {
      // invalidate tất cả materials-by-design-type
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type"],
      });
      // và list tổng nếu có
      queryClient.invalidateQueries({
        queryKey: MATERIAL_TYPE_KEYS.all,
      });

      toast({
        title: "Thành công",
        description: "Đã thêm nhiều chất liệu thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm chất liệu",
        variant: "destructive",
      });
    },
  });
};

// ----------------- Queries -----------------
// Lấy danh sách chất liệu theo loại thiết kế
export const useMaterialsByDesignType = (
  designTypeId?: number,
  status?: string
) => {
  return useQuery({
    queryKey: ["materials-by-design-type", designTypeId, status],
    queryFn: () => {
      if (!designTypeId) return [];
      return api.get<MaterialTypeEntity[]>(
        `${API_SUFFIX.MATERIAL_TYPES}/design-type/${designTypeId}`
      );
    },
    enabled: !!designTypeId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useMaterialTypes = (params?: { status?: string }) => {
  return useQuery<MaterialTypeEntity[]>({
    queryKey: MATERIAL_TYPE_KEYS.materialTypes(params),
    queryFn: () => getMaterialTypes(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useMaterialType = (id: number, enabled = true) => {
  return useQuery({
    queryKey: MATERIAL_TYPE_KEYS.materialType(id),
    queryFn: () => getMaterialTypeById(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// ----------------- Mutations -----------------
export const useCreateMaterialType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMaterialTypeRequest) => createMaterialType(data),
    onSuccess: (newMaterialType) => {
      // cache detail
      queryClient.setQueryData(
        MATERIAL_TYPE_KEYS.materialType(newMaterialType.id),
        newMaterialType
      );

      // refetch tất cả list material-types
      queryClient.invalidateQueries({
        queryKey: MATERIAL_TYPE_KEYS.all,
      });

      // và theo design-type nếu cần
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type"],
      });

      toast({
        title: "Thành công",
        description: `Đã tạo loại vật liệu ${newMaterialType.name} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo loại vật liệu",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMaterialType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateMaterialTypeRequest>;
    }) => updateMaterialType(id, data),
    onSuccess: (updatedMaterialType) => {
      // cập nhật cache chi tiết
      queryClient.setQueryData(
        MATERIAL_TYPE_KEYS.materialType(updatedMaterialType.id),
        updatedMaterialType
      );

      // CÁCH 1 (đơn giản, ít bug): chỉ invalidate list
      queryClient.invalidateQueries({
        queryKey: MATERIAL_TYPE_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type"],
      });

      // --- Nếu muốn tự update cache list, dùng đoạn này thay cho invalidate ---
      // queryClient.setQueriesData(
      //   { queryKey: MATERIAL_TYPE_KEYS.all },
      //   (oldData: MaterialTypeEntity[] | undefined) => {
      //     if (!oldData) return oldData;
      //     return oldData.map((item) =>
      //       item.id === updatedMaterialType.id ? updatedMaterialType : item
      //     );
      //   }
      // );

      toast({
        title: "Thành công",
        description: `Đã cập nhật loại vật liệu thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật loại vật liệu",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMaterialType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteMaterialType(id),
    onSuccess: (_, deletedId) => {
      // xoá cache detail
      queryClient.removeQueries({
        queryKey: MATERIAL_TYPE_KEYS.materialType(deletedId),
      });

      // CÁCH 1: chỉ invalidate list
      queryClient.invalidateQueries({
        queryKey: MATERIAL_TYPE_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type"],
      });

      // --- Nếu muốn tự update list cache, dùng đoạn này thay cho invalidate ---
      // queryClient.setQueriesData(
      //   { queryKey: MATERIAL_TYPE_KEYS.all },
      //   (oldData: MaterialTypeEntity[] | undefined) => {
      //     if (!oldData) return oldData;
      //     return oldData.filter((item) => item.id !== deletedId);
      //   }
      // );

      toast({
        title: "Thành công",
        description: "Đã xóa loại vật liệu thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa loại vật liệu",
        variant: "destructive",
      });
    },
  });
};
