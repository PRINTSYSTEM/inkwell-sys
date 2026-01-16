// src/hooks/design-type.hooks.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import type {
  DesignTypeResponse, // = DesignTypeResponse
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
  DesignTypeListParams,
  DesignTypeListResponse,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";

const designTypeCrud = createCrudHooks<
  DesignTypeResponse,
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
  number,
  DesignTypeListParams,
  DesignTypeListResponse
>({
  rootKey: "design-types",
  basePath: API_SUFFIX.DESIGN_TYPES,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo loại thiết kế thành công",
    updateSuccess: "Đã cập nhật loại thiết kế thành công",
    deleteSuccess: "Đã xóa loại thiết kế thành công",
  },
});

export const {
  api: designTypeApi,
  keys: designTypeKeys,
  useList: useDesignTypeList,
  useDetail: useDesignTypeDetail,
  useCreate: useCreateDesignType,
  useUpdate: useUpdateDesignType,
  useDelete: useDeleteDesignType,
  useUpload: useUploadDesignType,
  useDownload: useDownloadDesignType,
  extractItems: getDesignTypeItems,
} = designTypeCrud;

// Alias thân thiện cho UI
export const useDesignTypes = useDesignTypeList;
export const useDesignType = useDesignTypeDetail;

// ===== Explicit by-id hooks (to match OpenAPI + validate-hooks) =====
// GET /designs/types/:id
export const useDesignTypeById = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: [designTypeKeys.all[0], "by-id", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<DesignTypeResponse>(
        API_SUFFIX.DESIGN_TYPE_BY_ID(id as number)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// PUT /designs/types/:id
export const useUpdateDesignTypeById = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute, reset } = useAsyncCallback<
    DesignTypeResponse,
    [number, UpdateDesignTypeRequest]
  >(async (id: number, payload: UpdateDesignTypeRequest) => {
    const res = await apiRequest.put<DesignTypeResponse>(
      API_SUFFIX.DESIGN_TYPE_BY_ID(id),
      payload
    );
    return res.data;
  });

  const mutate = async (id: number, payload: UpdateDesignTypeRequest) => {
    try {
      const result = await execute(id, payload);
      queryClient.invalidateQueries({ queryKey: designTypeKeys.all });
      toast.success("Thành công", { description: "Đã cập nhật loại thiết kế" });
      return result;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        e?.response?.data?.message || e?.message || "Không thể cập nhật loại thiết kế";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// DELETE /designs/types/:id
export const useDeleteDesignTypeById = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      await apiRequest.delete(API_SUFFIX.DESIGN_TYPE_BY_ID(id));
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      queryClient.invalidateQueries({ queryKey: designTypeKeys.all });
      toast.success("Thành công", { description: "Đã xóa loại thiết kế" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        e?.response?.data?.message || e?.message || "Không thể xóa loại thiết kế";
      toast.error("Lỗi", { description: message });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};
