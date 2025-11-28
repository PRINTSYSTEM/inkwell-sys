import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const {
  api: designCrudApi,
  keys: designKeys,
  useList: useDesignListBase,
  useDetail: useDesignDetailBase,
  useUpdate: useUpdateDesignBase,
} = createCrudHooks<
  DesignResponse,
  any, // không có POST /api/designs, nên không dùng create
  any,
  number,
  DesignListParams,
  DesignResponsePagedResponse
>({
  rootKey: "designs",
  basePath: "/api/designs",
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

// ===== Extra endpoints từ swagger =====

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
  params?: DesignListParams,
  enabled = true
) => {
  return useQuery({
    queryKey: [designKeys.all[0], "user", userId, params ?? {}],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePagedResponse>(
        API_SUFFIX.DESIGN_BY_USER(userId),
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
        API_SUFFIX.DESIGN_TIMELINE(id)
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// POST /api/designs/{id}/timeline (multipart/form-data)
export const useAddDesignTimelineEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      file,
      description,
    }: {
      id: number;
      file: File;
      description?: string;
    }) => {
      const formData = new FormData();
      formData.append("File", file);
      if (description) formData.append("Description", description);
      const res = await apiRequest.post<DesignTimelineEntryResponse>(
        API_SUFFIX.DESIGN_TIMELINE(id),
        formData
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [designKeys.detail(id), "timeline"],
      });
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(id),
      });
      toast({
        title: "Thành công",
        description: "Đã thêm file/timeline cho thiết kế",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể thêm timeline",
        variant: "destructive",
      });
    },
  });
};

// POST /api/designs/{id}/upload-design-file
export const useUploadDesignFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("File", file);
      const res = await apiRequest.post<string>(
        API_SUFFIX.DESIGN_UPLOAD_FILE(id),
        formData
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
      toast({
        title: "Thành công",
        description: "Đã upload file thiết kế",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload file thiết kế",
        variant: "destructive",
      });
    },
  });
};

// POST /api/designs/{id}/upload-design-image
export const useUploadDesignImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("File", file);
      const res = await apiRequest.post<string>(
        API_SUFFIX.DESIGN_UPLOAD_IMAGE(id),
        formData
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
      toast({
        title: "Thành công",
        description: "Đã upload hình thiết kế",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload hình",
        variant: "destructive",
      });
    },
  });
};

// POST /api/designs/{id}/generate-excel
export const useGenerateDesignExcel = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<string>(
        API_SUFFIX.DESIGN_GENERATE_EXCEL(id)
      );
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo file Excel cho thiết kế",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo file Excel",
        variant: "destructive",
      });
    },
  });
};

export { designCrudApi, designKeys };
