import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  ProofingOrderResponse,
  ProofingOrderResponsePagedResponse,
  ProofingOrderListParams,
  CreateProofingOrderRequest,
  CreateProofingOrderFromDesignsRequest,
  UpdateProofingOrderRequest,
} from "@/Schema";
import type { DesignResponse } from "@/Schema/design.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";

const {
  api: proofingCrudApi,
  keys: proofingKeys,
  useList: useProofingOrderListBase,
  useDetail: useProofingOrderDetailBase,
  useCreate: useCreateProofingOrderBase,
  useUpdate: useUpdateProofingOrderBase,
} = createCrudHooks<
  ProofingOrderResponse,
  CreateProofingOrderRequest,
  UpdateProofingOrderRequest,
  number,
  ProofingOrderListParams,
  ProofingOrderResponsePagedResponse
>({
  rootKey: "proofing-orders",
  basePath: API_SUFFIX.PROOFING_ORDERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo bình bài thành công",
    updateSuccess: "Đã cập nhật bình bài thành công",
  },
});

export const useProofingOrders = (params?: ProofingOrderListParams) =>
  useProofingOrderListBase(params ?? ({} as ProofingOrderListParams));

export const useProofingOrder = (id: number | null, enabled = true) =>
  useProofingOrderDetailBase(id, enabled);

export const useCreateProofingOrder = () => useCreateProofingOrderBase();
export const useUpdateProofingOrder = () => useUpdateProofingOrderBase();

// POST /proofing-orders/from-designs
export const useCreateProofingOrderFromDesigns = () => {
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [CreateProofingOrderFromDesignsRequest]
  >(async (payload) => {
    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_FROM_DESIGNS,
      payload
    );
    return res.data;
  });

  const mutate = async (payload: CreateProofingOrderFromDesignsRequest) => {
    try {
      const result = await execute(payload);

      toast({
        title: "Thành công",
        description: "Đã tạo bình bài từ danh sách thiết kế",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tạo bình bài",
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

// GET /proofing-orders/available-designs
export const useAvailableDesignsForProofing = (materialTypeId?: number) => {
  return useQuery({
    queryKey: [proofingKeys.all[0], "available-designs", materialTypeId],
    queryFn: async () => {
      const res = await apiRequest.get<DesignResponse[]>(
        API_SUFFIX.PROOFING_AVAILABLE_DESIGNS,
        {
          params: materialTypeId ? { materialTypeId } : undefined,
        }
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export { proofingCrudApi, proofingKeys };
// ================== PROOFING FOR PRODUCTION ==================
// GET /proofing-orders/for-production

export const useProofingOrdersForProduction = (params?: {
  pageNumber?: number;
  pageSize?: number;
}) => {
  return useQuery<ProofingOrderResponsePagedResponse>({
    queryKey: [proofingKeys.all[0], "for-production", params],
    queryFn: async () => {
      const res = await apiRequest.get<ProofingOrderResponsePagedResponse>(
        API_SUFFIX.PROOFING_FOR_PRODUCTION,
        { params }
      );
      return res.data;
    },
  });
};

// ================== UPLOAD / DOWNLOAD FILE ==================
// POST /proofing-orders/{id}/upload-file
// GET  /proofing-orders/{id}/download-file

export const useUploadProofingFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("proofingFile", file);

    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPLOAD_FILE(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; file: File }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast({
        title: "Thành công",
        description: "Đã upload file bình bài",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể upload file bình bài",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useDownloadProofingFile = () => {
  const { toast } = useToast();

  const { loading, error, execute, reset } = useAsyncCallback<
    void,
    [{ proofingOrderId: number; filename?: string }]
  >(async ({ proofingOrderId, filename }) => {
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.PROOFING_DOWNLOAD_FILE(proofingOrderId),
      { responseType: "arraybuffer" }
    );

    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename ?? `proofing-${proofingOrderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

  const mutate = async (args: {
    proofingOrderId: number;
    filename?: string;
  }) => {
    try {
      await execute(args);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải file bình bài",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};
// ================== COMPLETE / START / COMPLETE PRODUCTION ==================
// PUT /proofing-orders/{id}/complete
// PUT /proofing-orders/{id}/start-production
// PUT /proofing-orders/{id}/complete-production

export const useCompleteProofingOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_COMPLETE(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast({
        title: "Thành công",
        description: "Đã hoàn tất bình bài",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể hoàn tất bình bài",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useStartProductionFromProofing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_START_PRODUCTION(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast({
        title: "Thành công",
        description: "Đã bắt đầu sản xuất cho bình bài",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể bắt đầu sản xuất",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useCompleteProductionFromProofing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_COMPLETE_PRODUCTION(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast({
        title: "Thành công",
        description: "Đã hoàn tất sản xuất cho bình bài",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể hoàn tất sản xuất",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};
