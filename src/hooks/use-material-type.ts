// src/hooks/material-type.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { useToast } from "@/hooks/use-toast";
import type {
  MaterialTypeResponse, // = MaterialTypeResponse
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  BulkCreateMaterialTypeRequest,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";

export type MaterialTypeListParams = {
  status?: string;
};

export type MaterialTypeListResponse = MaterialTypeResponse[];

const materialTypeCrud = createCrudHooks<
  MaterialTypeResponse,
  CreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  number,
  MaterialTypeListParams,
  MaterialTypeListResponse
>({
  rootKey: "material-types",
  basePath: "/designs/materials",
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
  getItemsFromResponse: getMaterialTypeItems,
} = materialTypeCrud;

// === Nâng cao: list theo designTypeId ===
// GET /designs/materials/design-type/{designTypeId}?status=...
export const useMaterialsByDesignType = (
  designTypeId?: number,
  status?: string
) => {
  return useQuery<MaterialTypeResponse[]>({
    queryKey: ["materials-by-design-type", designTypeId, status],
    queryFn: async () => {
      if (!designTypeId) return [];
      const res = await apiRequest.get<MaterialTypeResponse[]>(
        API_SUFFIX.MATERIAL_TYPES_BY_DESIGN_TYPE(designTypeId),
        { params: { status } }
      );
      return res.data;
    },
    enabled: !!designTypeId,
    staleTime: 30_000,
  });
};

// === Nâng cao: bulk add ===
// POST /designs/materials/bulk
export const useBulkAddMaterials = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
