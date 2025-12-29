// src/hooks/material-type.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type {
  MaterialTypeResponse, // = MaterialTypeResponse
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  BulkCreateMaterialTypeRequest,
  MaterialTypeListParams,
  MaterialTypeResponsePagedResponse,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";

const materialTypeCrud = createCrudHooks<
  MaterialTypeResponse,
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  number,
  MaterialTypeListParams,
  MaterialTypeResponsePagedResponse
>({
  rootKey: "material-types",
  basePath: API_SUFFIX.MATERIAL_TYPES,
  messages: {
    createSuccess: "Đã tạo chất liệu thành công",
    updateSuccess: "Đã cập nhật chất liệu thành công",
    deleteSuccess: "Đã xóa chất liệu thành công",
  },
});

export const {
  api: materialTypeApi,
  keys: materialTypeKeys,
  useList: useMaterialTypeList,
  useDetail: useMaterialTypeDetail,
  useCreate: useCreateMaterialType,
  useUpdate: useUpdateMaterialType,
  useDelete: useDeleteMaterialType,
  useUpload: useUploadMaterialType,
  useDownload: useDownloadMaterialType,
  extractItems: getMaterialTypeItems,
} = materialTypeCrud;

// === Nâng cao: list theo designTypeId ===
// GET /designs/materials/design-type/{designTypeId}?status=...
// API returns paginated response: { items: MaterialTypeResponse[], size, page, total, totalPages }
type MaterialsByDesignTypeResponse = MaterialTypeResponse[] | {
  items: MaterialTypeResponse[] | null;
  size: number;
  page: number;
  total: number;
  totalPages: number;
};

export const useMaterialsByDesignType = (
  designTypeId?: number,
  status?: string
) => {
  return useQuery<MaterialTypeResponse[]>({
    queryKey: ["materials-by-design-type", designTypeId, status],

    enabled: !!designTypeId,

    queryFn: async () => {
      const res = await apiRequest.get<MaterialsByDesignTypeResponse>(
        API_SUFFIX.MATERIAL_TYPES_BY_DESIGN_TYPE(designTypeId!),
        { params: { status: status || "" } }
      );
      
      // Handle paginated response: extract items array
      if (typeof res.data === 'object' && !Array.isArray(res.data) && 'items' in res.data) {
        const paginatedData = res.data as { items?: MaterialTypeResponse[] | null };
        return Array.isArray(paginatedData.items) ? paginatedData.items : [];
      }
      
      // Handle direct array response
      return Array.isArray(res.data) ? res.data : [];
    },

    placeholderData: [],
  });
};

// === Nâng cao: bulk add ===
// POST /designs/materials/bulk
export const useBulkAddMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCreateMaterialTypeRequest) => {
      const res = await apiRequest.post<MaterialTypeResponse[]>(
        API_SUFFIX.MATERIAL_TYPES_BULK,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialTypeKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type"],
      });

      toast.success("Thành công", {
        description: "Đã thêm nhiều chất liệu thành công",
      });
    },
    onError: (error: Error) => {
      toast.error("Lỗi", {
        description: error.message || "Không thể thêm chất liệu",
      });
    },
  });
};
