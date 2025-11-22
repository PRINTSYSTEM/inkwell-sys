import { bulkAddMaterials, BulkAddMaterialsRequest } from '@/apis/material-type.api';
// Bulk add materials hook
export const useBulkAddMaterials = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: BulkAddMaterialsRequest) => bulkAddMaterials(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-by-design-type'] });
      toast({
        title: 'Thành công',
        description: 'Đã thêm nhiều chất liệu thành công',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thêm chất liệu',
        variant: 'destructive',
      });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getMaterialTypes,
  getMaterialTypeById,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
  getDesignTypes,
  getDesignTypeById,
  createDesignType,
  updateDesignType,
  deleteDesignType,
  type MaterialType,
  type MaterialTypesResponse,
  type CreateMaterialTypeRequest,
  type DesignType,
  type DesignTypesResponse,
  type CreateDesignTypeRequest,
} from '@/apis/material-type.api';

// Query Keys
const MATERIAL_TYPE_KEYS = {
  materialTypes: (params?: { pageNumber?: number; pageSize?: number; designTypeId?: number; status?: string }) => ['material-types', params],
  materialType: (id: number) => ['material-type', id],
} as const;

const DESIGN_TYPE_KEYS = {
  designTypes: (params?: { pageNumber?: number; pageSize?: number; status?: string }) => ['design-types', params],
  designType: (id: number) => ['design-type', id],
} as const;

// Material Type Hooks
// Lấy danh sách chất liệu theo loại thiết kế
export const useMaterialsByDesignType = (designTypeId?: number, status?: string) => {
  return useQuery({
    queryKey: ['materials-by-design-type', designTypeId, status],
    queryFn: () => {
      if (!designTypeId) return [];
      return fetch(`designs/materials/design-type/${designTypeId}${status ? `?status=${status}` : ''}`)
        .then(res => res.json());
    },
    enabled: !!designTypeId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
export const useMaterialTypes = (params?: {
  pageNumber?: number;
  pageSize?: number;
  designTypeId?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: MATERIAL_TYPE_KEYS.materialTypes(params),
    queryFn: () => getMaterialTypes(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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

export const useCreateMaterialType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMaterialTypeRequest) => createMaterialType(data),
    onSuccess: (newMaterialType) => {
      queryClient.invalidateQueries({ queryKey: ['material-types'] });
      queryClient.setQueryData(MATERIAL_TYPE_KEYS.materialType(newMaterialType.id), newMaterialType);

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
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMaterialTypeRequest> }) =>
      updateMaterialType(id, data),
    onSuccess: (updatedMaterialType) => {
      queryClient.setQueryData(MATERIAL_TYPE_KEYS.materialType(updatedMaterialType.id), updatedMaterialType);
      
      queryClient.setQueriesData(
        { queryKey: ['material-types'] },
        (oldData: MaterialTypesResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((item) =>
              item.id === updatedMaterialType.id ? updatedMaterialType : item
            ),
          };
        }
      );

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
      queryClient.removeQueries({ queryKey: MATERIAL_TYPE_KEYS.materialType(deletedId) });
      
      queryClient.setQueriesData(
        { queryKey: ['material-types'] },
        (oldData: MaterialTypesResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((item) => item.id !== deletedId),
            totalCount: oldData.totalCount - 1,
          };
        }
      );

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

// Design Type Hooks
export const useDesignTypes = (params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: DESIGN_TYPE_KEYS.designTypes(params),
    queryFn: () => getDesignTypes(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useDesignType = (id: number, enabled = true) => {
  return useQuery({
    queryKey: DESIGN_TYPE_KEYS.designType(id),
    queryFn: () => getDesignTypeById(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useCreateDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDesignTypeRequest) => createDesignType(data),
    onSuccess: (newDesignType) => {
      queryClient.invalidateQueries({ queryKey: ['design-types'] });
      queryClient.setQueryData(DESIGN_TYPE_KEYS.designType(newDesignType.id), newDesignType);

      toast({
        title: "Thành công",
        description: `Đã tạo loại thiết kế ${newDesignType.name} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo loại thiết kế",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDesignTypeRequest> }) =>
      updateDesignType(id, data),
    onSuccess: (updatedDesignType) => {
      queryClient.setQueryData(DESIGN_TYPE_KEYS.designType(updatedDesignType.id), updatedDesignType);
      
      queryClient.setQueriesData(
        { queryKey: ['design-types'] },
        (oldData: DesignTypesResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((item) =>
              item.id === updatedDesignType.id ? updatedDesignType : item
            ),
          };
        }
      );

      toast({
        title: "Thành công",
        description: `Đã cập nhật loại thiết kế thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật loại thiết kế",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteDesignType(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: DESIGN_TYPE_KEYS.designType(deletedId) });
      
      queryClient.setQueriesData(
        { queryKey: ['design-types'] },
        (oldData: DesignTypesResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((item) => item.id !== deletedId),
            totalCount: oldData.totalCount - 1,
          };
        }
      );

      toast({
        title: "Thành công",
        description: "Đã xóa loại thiết kế thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa loại thiết kế",
        variant: "destructive",
      });
    },
  });
};