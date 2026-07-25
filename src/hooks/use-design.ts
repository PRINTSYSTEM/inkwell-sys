import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import type {
  DesignResponse,
  DesignResponsePaginate,
  DesignListParams,
  MyDesignListParams,
  DesignTimelineEntryResponse,
  DesignTimelineEntryResponsePaginate,
  UpdateDesignRequest,
  DesignByCustomerParams,
  DesignSaleParams,
  RevertDesignRequest,
  DesignUserParams,
  CreateDesignStandaloneRequest,
  ReprintDesignRequest,
  ReadyDesignResponse,
  ReadyDesignResponsePaginate,
  ReadyDesignListParams,
  UpdateReadyDesignRequest,
} from "@/Schema";
import { createCrudHooks, getErrorMessage } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async"; // <== hook async bạn đã có

// ================== CRUD BASE (createCrudHooks) ==================

const {
  api: designCrudApi,
  keys: designKeys,
  useList: useDesignListBase,
  useDetail: useDesignDetailBase,
  useCreate: useCreateDesignBase,
  useUpdate: useUpdateDesignBase,
} = createCrudHooks<
  DesignResponse,
  CreateDesignStandaloneRequest,
  UpdateDesignRequest,
  number,
  DesignListParams,
  DesignResponsePaginate
>({
  rootKey: "designs",
  basePath: API_SUFFIX.DESIGNS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo thiết kế độc lập thành công",
    updateSuccess: "Đã cập nhật thiết kế thành công",
  },
});

// ===== Base list/detail/create/update =====

export const useDesigns = (params?: DesignListParams) =>
  useDesignListBase(params ?? ({} as DesignListParams));

export const useDesign = (id: number | null, enabled = true) =>
  useDesignDetailBase(id, enabled);

export const useCreateDesign = () => useCreateDesignBase();

export const useUpdateDesign = () => useUpdateDesignBase();

// ================== EXTRA QUERIES ==================

// GET /api/designs/my
export const useMyDesigns = (params?: MyDesignListParams) => {
  return useQuery({
    queryKey: [designKeys.all[0], "my", params ?? {}],
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePaginate>(
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
  params?: DesignUserParams,
  enabled = true
) => {
  return useQuery({
    queryKey: [designKeys.all[0], "user", userId, params ?? {}],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePaginate>(
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
      // API returns DesignTimelineEntryResponsePaginate
      const res = await apiRequest.get<DesignTimelineEntryResponsePaginate>(
        API_SUFFIX.DESIGN_TIMELINE(id as number)
      );
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

// ================== ACTIONS / MUTATIONS (dùng useAsyncCallback) ==================

// POST /api/designs/{id}/timeline (multipart/form-data)
export const useAddDesignTimelineEntry = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignTimelineEntryResponse,
    [{ id: number; file?: File | null; description?: string }]
  >(async ({ id, file, description }) => {
    const formData = new FormData();
    if (file) {
      formData.append("File", file);
    }
    if (description) formData.append("Description", description);

    const res = await apiRequest.post<DesignTimelineEntryResponse>(
      API_SUFFIX.DESIGN_TIMELINE(id),
      formData
    );
    return res.data;
  });

  const mutate = async (payload: {
    id: number;
    file?: File | null;
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

      toast.success("Thành công", {
        description: "Đã thêm file/timeline cho thiết kế",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể thêm timeline",
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

      toast.success("Thành công", {
        description: "Đã tải lên file thiết kế",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải lên file thiết kế",
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

      toast.success("Thành công", {
        description: "Đã upload hình thiết kế",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload hình",
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
  // Không cần trả data ra ngoài, chỉ cần download file
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.DESIGN_GENERATE_EXCEL(id),
        null,
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `design-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);

      toast.success("Thành công", {
        description: "Đã tạo và tải file Excel cho thiết kế",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo file Excel",
      });
      throw err;
    }
  };

  return {
    loading,
    error,
    mutate,
    reset,
  };
};

// GET /api/designs/by-customer/:id
export const useDesignsByCustomer = (params?: DesignByCustomerParams) => {
  return useQuery({
    queryKey: [designKeys.all[0], "by-customer", params ?? {}],
    enabled: !!params?.customerId, // Only query when customerId is provided
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePaginate>(
        API_SUFFIX.DESIGN_BY_CUSTOMER(params?.customerId as number),
        { params }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// POST /api/designs/{id}/revert-to-waiting
export const useRevertDesign = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignResponse,
    [{ id: number; reason: string }]
  >(async ({ id, reason }) => {
    const res = await apiRequest.post<DesignResponse>(
      API_SUFFIX.DESIGN_REVERT_TO_WAITING(id),
      { reason } as RevertDesignRequest
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; reason: string }) => {
    try {
      const result = await execute(payload);

      // Invalidate design detail and related queries
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });
      queryClient.invalidateQueries({
        queryKey: [designKeys.all[0], "my"],
      });
      queryClient.invalidateQueries({
        queryKey: designKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã hoàn nguyên thiết kế về trạng thái chờ",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn nguyên thiết kế",
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
// GET /api/designs/sale
export const useDesignsSale = (params?: DesignSaleParams) => {
  return useQuery({
    queryKey: [designKeys.all[0], "sale", params ?? {}],
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponsePaginate>(
        API_SUFFIX.DESIGNS_SALE,
        { params }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// POST /api/designs/{id}/reprint
export const useReprintDesign = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignResponse,
    [{ id: number; quantity: number; notes?: string; isUrgent?: boolean }]
  >(async ({ id, quantity, notes, isUrgent }) => {
    const res = await apiRequest.post<DesignResponse>(
      API_SUFFIX.DESIGN_REPRINT(id),
      { quantity, notes, isUrgent } as ReprintDesignRequest
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; quantity: number; notes?: string; isUrgent?: boolean }) => {
    try {
      const result = await execute(payload);

      // Invalidate design detail and related queries
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });
      queryClient.invalidateQueries({
        queryKey: designKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["ready-designs"],
      });

      toast.success("Thành công", {
        description: "Đã yêu cầu tái bản thiết kế thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể yêu cầu tái bản thiết kế",
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

// GET /api/ready-designs
export const useReadyDesigns = (params?: ReadyDesignListParams) => {
  return useQuery({
    queryKey: ["ready-designs", params ?? {}],
    queryFn: async () => {
      const res = await apiRequest.get<ReadyDesignResponsePaginate>(
        API_SUFFIX.READY_DESIGNS,
        { params }
      );
      return res.data;
    },
  });
};

// PUT /api/ready-designs/{id}
export const useUpdateReadyDesign = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ReadyDesignResponse,
    [{ id: number; data: UpdateReadyDesignRequest }]
  >(async ({ id, data }) => {
    const res = await apiRequest.put<ReadyDesignResponse>(
      API_SUFFIX.READY_DESIGNS_BY_ID(id),
      data
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; data: UpdateReadyDesignRequest }) => {
    try {
      const result = await execute(payload);

      // Invalidate ready-designs list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["ready-designs"],
      });

      toast.success("Thành công", {
        description: "Đã cập nhật thiết kế trong kho sẵn sàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật thiết kế",
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

// DELETE /api/ready-designs/{id}
export const useDeleteReadyDesign = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.delete(API_SUFFIX.READY_DESIGNS_BY_ID(id));
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      // Invalidate ready-designs list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["ready-designs"] });

      toast.success("Đã xóa thiết kế", {
        description: "Thiết kế đã được xóa khỏi kho sẵn sàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message || error?.message || "Không thể xóa thiết kế",
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

// POST /api/designs/{id}/cancel-from-pool
export const useCancelDesignFromPool = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post(API_SUFFIX.DESIGN_CANCEL_FROM_POOL(id));
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["ready-designs"] });
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      queryClient.invalidateQueries({ queryKey: ["design-detail"] });

      toast.success("Thành công", {
        description: "Thiết kế đã được hủy và xóa khỏi kho sẵn sàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hủy thiết kế khỏi kho",
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

// POST /api/ready-designs/{id}/reset-available-quantity
export const useResetReadyDesignAvailableQuantity = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    void,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post(
      API_SUFFIX.READY_DESIGN_RESET_AVAILABLE_QUANTITY(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      // Invalidate ready-designs list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["ready-designs"] });
      queryClient.invalidateQueries({ queryKey: designKeys.all });

      toast.success("Thành công", {
        description: "Đã cập nhật số lượng khả dụng và hoàn tất đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật số lượng khả dụng",
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

// PUT /api/designs/{id}/cancel
export const useCancelDesign = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.put<DesignResponse>(
      API_SUFFIX.DESIGN_CANCEL(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      // Invalidate design detail query
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(id),
      });

      // Invalidate general list queries for designs
      queryClient.invalidateQueries({
        queryKey: designKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã hủy thiết kế thành công",
      });

      return result;
    } catch (err: unknown) {
      toast.error("Lỗi", {
        description: getErrorMessage(err, "Không thể hủy thiết kế"),
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

// POST /api/designs/{id}/mark-urgent
export const useMarkDesignUrgent = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post<DesignResponse>(
      API_SUFFIX.DESIGN_MARK_URGENT(id),
      null
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      // Invalidate design detail query
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(id),
      });

      // Invalidate general list queries for designs
      queryClient.invalidateQueries({
        queryKey: designKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã báo gấp thiết kế thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg = error.response?.data?.message || error.message || "Lỗi không xác định";
      toast.error("Thất bại", {
        description: msg,
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

// PUT /api/designs/{id}/code
export const useUpdateDesignCode = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    DesignResponse,
    [{ id: number; code: string }]
  >(async ({ id, code }) => {
    const res = await apiRequest.put<DesignResponse>(
      API_SUFFIX.DESIGN_UPDATE_CODE(id),
      { code }
    );
    return res.data;
  });

  const mutate = async (payload: { id: number; code: string }) => {
    try {
      const result = await execute(payload);

      // Invalidate design detail query
      queryClient.invalidateQueries({
        queryKey: designKeys.detail(payload.id),
      });

      // Invalidate design list queries
      queryClient.invalidateQueries({
        queryKey: designKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật mã thiết kế thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật mã thiết kế",
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




