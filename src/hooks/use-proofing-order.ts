import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

import type {
  ProofingOrderResponse,
  ProofingOrderResponsePagedResponse,
} from "@/Schema/proofing-order.schema";
import { ProofingOrderResponseSchema } from "@/Schema/proofing-order.schema";
import type { PaperSizeResponse } from "@/Schema/paper-size.schema";
import { PaperSizeResponseSchema } from "@/Schema/paper-size.schema";
import type {
  ProofingOrderListParams,
  CreateProofingOrderRequest,
  CreateProofingOrderFromDesignsRequest,
  UpdateProofingOrderRequest,
  OrderDetailResponse,
  RecordPlateExportRequest,
  RecordDieExportRequest,
} from "@/Schema";
import type { DesignResponse } from "@/Schema/design.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { normalizeParams } from "@/apis/util.api";

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
  const queryClient = useQueryClient();
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

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({
        queryKey: [proofingKeys.all[0], "available-order-details"],
      });

      toast({
        title: "Thành công",
        description: "Đã tạo bình bài từ danh sách thiết kế",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
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

// GET /proofing-orders/available-order-details
export const useAvailableOrderDetailsForProofing = (params?: {
  materialTypeId?: number | null;
}) => {
  return useQuery({
    // Use specific value in queryKey instead of object to ensure proper refetch
    queryKey: [
      proofingKeys.all[0],
      "available-order-details",
      params?.materialTypeId ?? null,
    ],
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});

      const res = await apiRequest.get<OrderDetailResponse[]>(
        API_SUFFIX.PROOFING_AVAILABLE_ORDER_DETAILS,
        { params: normalizedParams }
      );
      const orderDetails = res.data;

      // Transform OrderDetailResponse[] to expected structure
      const designs = orderDetails
        .filter((od) => od.design != null)
        .map((od) => {
          const design = od.design!;
          return {
            id: od.id!,
            code: design.code || "",
            name: design.designName || "",
            designTypeId: design.designTypeId || 0,
            designTypeName: design.designType?.name || "",
            materialTypeId: design.materialTypeId || 0,
            materialTypeName: design.materialType?.name || "",
            width: design.width || 0,
            height: design.height || 0,
            unit: "cm",
            quantity: od.quantity || 0,
            unitPrice: od.unitPrice || 0,
            orderId: od.orderId?.toString() || "",
            thumbnailUrl: design.designImageUrl || "",
            createdAt: design.createdAt || "",
          };
        });

      // Extract unique design types with counts
      const designTypeMap = new Map<
        number,
        { id: number; name: string; count: number }
      >();
      designs.forEach((d) => {
        const existing = designTypeMap.get(d.designTypeId);
        if (existing) {
          existing.count++;
        } else {
          designTypeMap.set(d.designTypeId, {
            id: d.designTypeId,
            name: d.designTypeName,
            count: 1,
          });
        }
      });

      // Extract unique material types with counts
      const materialTypeMap = new Map<
        number,
        { id: number; name: string; count: number }
      >();
      designs.forEach((d) => {
        const existing = materialTypeMap.get(d.materialTypeId);
        if (existing) {
          existing.count++;
        } else {
          materialTypeMap.set(d.materialTypeId, {
            id: d.materialTypeId,
            name: d.materialTypeName,
            count: 1,
          });
        }
      });

      return {
        designs,
        designTypeOptions: Array.from(designTypeMap.values()),
        materialTypeOptions: Array.from(materialTypeMap.values()),
        totalCount: designs.length,
      };
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
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload file bình bài",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useUploadProofingImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("imageFile", file);

    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPLOAD_IMAGE(proofingOrderId),
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
        description: "Đã upload ảnh bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload ảnh bình bài",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// PUT /proofing-orders/{id}/update-file
export const useUpdateProofingFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("proofingFile", file);

    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPDATE_FILE(proofingOrderId),
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
        description: "Đã cập nhật file bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật file bình bài",
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
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
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
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
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
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
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
    } catch (err: unknown) {
      const error = err as ApiError;
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn tất sản xuất",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};
export const usePaperSizes = () => {
  return useQuery({
    queryKey: ["paper-sizes"],
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.PAPER_SIZES);
      return z.array(PaperSizeResponseSchema).parse(response.data);
    },
  });
};

export const useRecordPlateExport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      request,
    }: {
      id: number;
      request: RecordPlateExportRequest;
    }) => {
      const response = await apiRequest.post(
        API_SUFFIX.PROOFING_RECORD_PLATE(id),
        request
      );
      return ProofingOrderResponseSchema.parse(response.data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      toast({
        title: "Ghi nhận xuất kẽm thành công",
        description: "Thông tin xuất kẽm đã được lưu lại.",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ghi nhận xuất kẽm thất bại",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRecordDieExport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      request,
    }: {
      id: number;
      request: RecordDieExportRequest;
    }) => {
      const response = await apiRequest.post(
        API_SUFFIX.PROOFING_RECORD_DIE(id),
        request
      );
      return ProofingOrderResponseSchema.parse(response.data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      toast({
        title: "Ghi nhận khuôn bế thành công",
        description: "Thông tin khuôn bế đã được lưu lại.",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ghi nhận khuôn bế thất bại",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });
};
export const useHandToProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest.put(
        API_SUFFIX.PROOFING_HAND_TO_PRODUCTION(id)
      );
      return ProofingOrderResponseSchema.parse(response.data);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["proofing-order", id] });
      toast({
        title: "Bàn giao sản xuất thành công",
        description: "Lệnh bình bài đã được chuyển sang bộ phận sản xuất.",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Bàn giao sản xuất thất bại",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    },
  });
};
