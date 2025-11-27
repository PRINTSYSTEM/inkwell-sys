// import {
//   bulkAddMaterials,
//   BulkAddMaterialsRequest,
// } from "@/apis/material-type.api";

import { API_SUFFIX } from "@/apis/util.api";
import { CreateMaterialTypeRequest, MaterialTypeEntity } from "@/Schema";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { http } from "@/lib/http"; // nếu file http export là `api` thì đổi về { api } và dùng api.get
import { createCrudHooks } from "./use-base";

// ================== Generic CRUD cho MaterialType ==================

const materialTypeCrud = createCrudHooks<
  MaterialTypeEntity,
  CreateMaterialTypeRequest,
  Partial<CreateMaterialTypeRequest>,
  number,
  { status?: string },
  MaterialTypeEntity[]
>({
  rootKey: "material-types",
  basePath: API_SUFFIX.MATERIAL_TYPES,
  messages: {
    createSuccess: "Đã tạo loại vật liệu thành công",
    updateSuccess: "Đã cập nhật loại vật liệu thành công",
    deleteSuccess: "Đã xóa loại vật liệu thành công",
    createError: "Không thể tạo loại vật liệu",
    updateError: "Không thể cập nhật loại vật liệu",
    deleteError: "Không thể xóa loại vật liệu",
  },
});

// Export chung cho chỗ khác nếu cần
export const materialTypeApi = materialTypeCrud.api;
export const MATERIAL_TYPE_KEYS = {
  all: materialTypeCrud.keys.all,
  materialTypes: (params?: { status?: string }) =>
    materialTypeCrud.keys.list(params ?? {}),
  materialType: (id: number) => materialTypeCrud.keys.detail(id),
} as const;

// ============= Hooks CRUD chính (dùng generic) =============

export const useMaterialTypes = materialTypeCrud.useList; // (params?: { status?: string })
export const useMaterialType = materialTypeCrud.useDetail; // (id: number, enabled?: boolean)
export const useCreateMaterialType = materialTypeCrud.useCreate;
export const useUpdateMaterialType = materialTypeCrud.useUpdate;
export const useDeleteMaterialType = materialTypeCrud.useDelete;

// ================== Bulk add ==================

// export const useBulkAddMaterials = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: (data: BulkAddMaterialsRequest) => bulkAddMaterials(data),
//     onSuccess: () => {
//       // invalidate tất cả materials-by-design-type
//       queryClient.invalidateQueries({
//         queryKey: ["materials-by-design-type"],
//       });
//       // và list tổng
//       queryClient.invalidateQueries({
//         queryKey: MATERIAL_TYPE_KEYS.all,
//       });

//       toast({
//         title: "Thành công",
//         description: "Đã thêm nhiều chất liệu thành công",
//       });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Lỗi",
//         description: error.message || "Không thể thêm chất liệu",
//         variant: "destructive",
//       });
//     },
//   });
// };

// ================== Queries custom ==================

// Lấy danh sách chất liệu theo loại thiết kế
export const useMaterialsByDesignType = (
  designTypeId?: number,
  status?: string
) => {
  return useQuery({
    queryKey: ["materials-by-design-type", designTypeId, status],
    queryFn: () => {
      if (!designTypeId) return [];
      return http.get<MaterialTypeEntity[]>(
        `${API_SUFFIX.MATERIAL_TYPES}/design-type/${designTypeId}`,
        status ? { status } : undefined
      );
    },
    enabled: !!designTypeId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
