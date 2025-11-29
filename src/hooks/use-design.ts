import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import type {
  DesignResponse,
  DesignResponsePagedResponse,
  DesignListParams,
  MyDesignListParams,
  DesignTimelineEntryResponse,
} from "@/Schema/design.schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async"; // <== hook async bạn đã có

// ================== CRUD BASE (createCrudHooks) ==================

const {
  api: designCrudApi,
  keys: designKeys,
  useList: useDesignListBase,
  useDetail: useDesignDetailBase,
  useUpdate: useUpdateDesignBase,
} = createCrudHooks<
  DesignResponse,
  any, // không có POST /designs, nên không dùng create
  any,
  number,
  DesignListParams,
  DesignResponsePagedResponse
>({
  rootKey: "designs",
  basePath: API_SUFFIX.DESIGNS, // dùng suffix thay vì hardcode "/api/designs"
  getItems: (resp) => resp.items ?? [],
  messages: {
    updateSuccess: "Đã cập nhật thiết kế thành công",
  },
});

// ===== Base list/detail/update =====

export const useDesigns = (params?: DesignListParams) =>
  useDesignListBase(params ?? ({} as DesignListParams));

export const useDesign = (id: number | null, enabled = true) =>
  useDesignDetailBase(id, enabled);

export const useUpdateDesign = () => useUpdateDesignBase();

// ================== EXTRA QUERIES ==================

// GET /api/designs/my
export const useMyDesigns = (params?: MyDesignListParams) => {
  return useQuery({
    queryKey: [designKeys.all[0], "my", params ?? {}],
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePagedResponse>(
        API_SUFFIX.MY_DESIGNS,
        { params }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/designs/user/{userId}
export const useDesignsByUser = (
  userId: number | null,
  params?: {
    status?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: [designKeys.all[0], "user", userId, params ?? {}],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePagedResponse>(
        API_SUFFIX.DESIGN_BY_USER(userId as number),
        { params }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// GET /api/designs/{id}/timeline
export const useDesignTimeline = (id: number | null, enabled = true) => {
  return useQuery({
    queryKey: [designKeys.detail(id as number), "timeline"],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<DesignTimelineEntryResponse[]>(
        API_SUFFIX.DESIGN_TIMELINE(id as number)
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// ================== ACTIONS / MUTATIONS (dùng useAsyncCallback) ==================

// POST /api/designs/{id}/timeline (multipart/form-data)
export const useAddDesignTimelineEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignTimelineEntryResponse,
    [{ id: number; file: File; description?: string }]
  >(async ({ id, file, description }) => {
    const formData = new FormData();
    formData.append("File", file);
    if (description) formData.append("Description", description);

    const res = await apiRequest.post<DesignTimelineEntryResponse>(
      API_SUFFIX.DESIGN_TIMELINE(id),
      formData
    );
    return res.data;
  });

  const mutate = async (payload: {
    id: number;
    file: File;
    description?: string;
  }) => {
    try {
      const result = await execute(payload);

      // invalidates timeline + detail
      queryClient.invalidateQueries({
        queryKey: [designKeys.detail(payload.id), "timeline"],
      });
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });

      toast({
        title: "Thành công",
        description: "Đã thêm file/timeline cho thiết kế",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể thêm timeline",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /api/designs/{id}/upload-design-file
export const useUploadDesignFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    string,
    [{ id: number; file: File }]
  >(async ({ id, file }) => {
    const formData = new FormData();
    formData.append("File", file);

    const res = await apiRequest.post<string>(
      API_SUFFIX.DESIGN_UPLOAD_FILE(id),
      formData
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; file: File }) => {
    try {
      const result = await execute(payload);

      // refresh detail
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });

      toast({
        title: "Thành công",
        description: "Đã upload file thiết kế",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể upload file thiết kế",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /api/designs/{id}/upload-design-image
export const useUploadDesignImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    string,
    [{ id: number; file: File }]
  >(async ({ id, file }) => {
    const formData = new FormData();
    formData.append("File", file);

    const res = await apiRequest.post<string>(
      API_SUFFIX.DESIGN_UPLOAD_IMAGE(id),
      formData
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; file: File }) => {
    try {
      const result = await execute(payload);

      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });

      toast({
        title: "Thành công",
        description: "Đã upload hình thiết kế",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể upload hình",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /api/designs/{id}/generate-excel
export const useGenerateDesignExcel = () => {
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    string,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post<string>(
      API_SUFFIX.DESIGN_GENERATE_EXCEL(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      toast({
        title: "Thành công",
        description: "Đã tạo file Excel cho thiết kế",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tạo file Excel",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

export { designCrudApi, designKeys };
