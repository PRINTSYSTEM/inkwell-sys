import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

import type {
  ProductionOrderResponse,
  ProductionOrderResponsePaginate,
  ProductionStepResponse,
  CreateProductionOrderRequest,
  UpdateProductionStepRequest,
  ProductionListParams,
  AssignProductionStepRequest,
  ProductionPendingMaterialParams,
  BulkUpdateProductionOrderItemsRequest,
} from "@/Schema";
import { useAsyncCallback } from "@/hooks/use-async";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { invalidateRelatedQueries } from "@/lib/crud-key";

// Production Order CRUD hooks (new API structure)
const {
  api: productionOrderCrudApi,
  keys: productionOrderKeys,
  useList: useProductionOrderListBase,
  useDetail: useProductionOrderDetailBase,
  useCreate: useCreateProductionOrderBase,
} = createCrudHooks<
  ProductionOrderResponse,
  CreateProductionOrderRequest,
  never, // No update endpoint for production orders
  number,
  ProductionListParams,
  ProductionOrderResponsePaginate
>({
  rootKey: "production-orders",
  basePath: API_SUFFIX.PRODUCTION_ORDERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo lệnh sản xuất thành công",
    updateSuccess: "Đã cập nhật lệnh sản xuất thành công",
  },
});

// Production order hooks
export const useProductionOrders = (params?: ProductionListParams) =>
  useProductionOrderListBase(params ?? ({} as ProductionListParams));

export const useProductionOrder = (id: number | null, enabled = true) =>
  useProductionOrderDetailBase(id, enabled);

export const useCreateProductionOrder = () => useCreateProductionOrderBase();

export const usePendingMaterialProductionOrders = (
  params?: ProductionPendingMaterialParams
) => {
  return useQuery<ProductionOrderResponsePaginate>({
    queryKey: [...productionOrderKeys.all, "pending-material", params],
    queryFn: async () => {
      const res = await apiRequest.get<ProductionOrderResponsePaginate>(
        "/production-orders/pending-material",
        {
          params: normalizeParams((params ?? {}) as Record<string, unknown>),
        }
      );
      return res.data;
    },
  });
};
export const useProductionOrdersByOrder = (
  orderId: number | null,
  params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
    sortColumn?: string;
    sortOrder?: string;
  },
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["production-orders", "by-order", orderId, params],
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<ProductionOrderResponsePaginate>(
        API_SUFFIX.PRODUCTION_ORDERS_BY_ORDER(orderId as number),
        { params },
      );
      return res.data;
    },
  });
};

// PUT /api/production-orders/steps/:stepId/status - Update production step status
export const useUpdateProductionStep = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionStepResponse,
    [{ stepId: number; data: UpdateProductionStepRequest }]
  >(async ({ stepId, data }) => {
    const res = await apiRequest.put<ProductionStepResponse>(
      API_SUFFIX.PRODUCTION_STEP_STATUS(stepId),
      data,
    );
    return res.data;
  });

  const mutate = async (payload: {
    stepId: number;
    data: UpdateProductionStepRequest;
  }) => {
    try {
      const result = await execute(payload);

      // Invalidate all production order, print order, and post-print queries so all screens refresh simultaneously
      invalidateRelatedQueries(queryClient, [
        "production-orders",
        "productions",
        "print-orders",
        "post-print",
      ]);

      toast.success("Thành công", {
        description: "Đã cập nhật trạng thái bước sản xuất",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật trạng thái bước sản xuất",
      });
      throw err;
    }
  };

  return {
    data,
    isPending: loading,
    error,
    mutate,
    reset,
  };
};

// DELETE /api/production-orders/:id - Delete (cancel) a production order
// Fetches the full order first to get steps, resets all to "ready", then deletes.
export const useDeleteProductionOrder = () => {
  const queryClient = useQueryClient();

  const mutate = async (productionOrderId: number) => {
    try {
      // Delete the production order directly
      await apiRequest.delete(API_SUFFIX.PRODUCTION_ORDER_BY_ID(productionOrderId));

      // Invalidate all related query keys to ensure the list, prepress/proofing, and order states are refreshed
      invalidateRelatedQueries(queryClient, [
        "production-orders",
        "productions",
        "proofing-orders",
        "orders",
      ]);

      toast.success("Thành công", {
        description: "Đã hủy lệnh sản xuất",
      });
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hủy lệnh sản xuất",
      });
      throw err;
    }
  };

  return { mutate };
};

// PUT /api/production-orders/:productionOrderId/items/:itemId - Update production order item (design)
export const useUpdateProductionOrderItem = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    any,
    [
      {
        productionOrderId: number;
        itemId: number;
        data: { outputQty?: number; defectQty?: number; notes?: string };
      },
    ]
  >(async ({ productionOrderId, itemId, data }) => {
    const res = await apiRequest.put<any>(
      `/production-orders/${productionOrderId}/items/${itemId}`,
      data,
    );
    return res.data;
  });

  const mutate = async (payload: {
    productionOrderId: number;
    itemId: number;
    data: { outputQty?: number; defectQty?: number; notes?: string };
  }) => {
    try {
      const result = await execute(payload);

      // Invalidate production order queries to refresh data
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật số lượng thiết kế",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật số lượng thiết kế",
      });
      throw err;
    }
  };

  return {
    data,
    isPending: loading,
    error,
    mutate,
    reset,
  };
};

// PUT /api/production-orders/:productionOrderId/items/bulk - Bulk update production order items (designs)
export const useBulkUpdateProductionOrderItems = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    any,
    [
      {
        productionOrderId: number;
        data: BulkUpdateProductionOrderItemsRequest;
      },
    ]
  >(async ({ productionOrderId, data }) => {
    const res = await apiRequest.put<any>(
      `/production-orders/${productionOrderId}/items/bulk`,
      data,
    );
    return res.data;
  });

  const mutate = async (payload: {
    productionOrderId: number;
    data: BulkUpdateProductionOrderItemsRequest;
  }) => {
    try {
      const result = await execute(payload);

      // Invalidate production order queries to refresh data
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật số lượng thiết kế hàng loạt",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật số lượng thiết kế hàng loạt",
      });
      throw err;
    }
  };

  return {
    data,
    isPending: loading,
    error,
    mutate,
    mutateAsync: mutate,
    reset,
  };
};

// PUT /api/production-orders/steps/:stepId/assign - Assign worker to production step
export const useAssignProductionWorker = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionStepResponse,
    [{ stepId: number; data: AssignProductionStepRequest }]
  >(async ({ stepId, data }) => {
    const res = await apiRequest.put<ProductionStepResponse>(
      API_SUFFIX.PRODUCTION_STEP_ASSIGN(stepId),
      data,
    );
    return res.data;
  });

  const mutate = async (payload: {
    stepId: number;
    data: AssignProductionStepRequest;
  }) => {
    try {
      const result = await execute(payload);

      // Invalidate production order queries so step assignment is refreshed
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.all,
      });

      toast.success("Thành công", {
        description: "Đã cập nhật người phụ trách cho bước sản xuất",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật người phụ trách cho bước sản xuất",
      });
      throw err;
    }
  };

  return {
    data,
    isPending: loading,
    error,
    mutate,
    mutateAsync: mutate, // Alias for async/await usage
    reset,
  };
};

// Legacy hooks for backward compatibility (deprecated - use useUpdateProductionStep instead)
// These are kept for components that haven't been migrated yet
export const useStartProduction = () => {
  console.warn(
    "useStartProduction is deprecated. Use useUpdateProductionStep to update step status instead.",
  );
  // Return a no-op hook for backward compatibility
  return {
    data: null,
    isPending: false,
    error: null,
    mutate: async () => {
      throw new Error(
        "useStartProduction is deprecated. Please use useUpdateProductionStep instead.",
      );
    },
    reset: () => {},
  };
};

export const useCompleteProduction = () => {
  console.warn(
    "useCompleteProduction is deprecated. Use useUpdateProductionStep to update step status instead.",
  );
  // Return a no-op hook for backward compatibility
  return {
    data: null,
    isPending: false,
    error: null,
    mutate: async () => {
      throw new Error(
        "useCompleteProduction is deprecated. Please use useUpdateProductionStep instead.",
      );
    },
    reset: () => {},
  };
};

export const usePostPrintProductionOrders = (params?: ProductionListParams) => {
  return useQuery<ProductionOrderResponsePaginate>({
    queryKey: [...productionOrderKeys.all, "post-print", params],
    queryFn: async () => {
      const res = await apiRequest.get<ProductionOrderResponsePaginate>(
        API_SUFFIX.PRODUCTION_POST_PRINT,
        {
          params: normalizeParams((params ?? {}) as Record<string, unknown>),
        }
      );
      return res.data;
    },
  });
};

export const usePostPrintCounts = () => {
  return useQuery<{ active: number }>({
    queryKey: [...productionOrderKeys.all, "post-print-counts"],
    queryFn: async () => {
      const res = await apiRequest.get<{ active: number }>(
        API_SUFFIX.PRODUCTION_POST_PRINT_COUNTS
      );
      return res.data;
    },
    refetchInterval: 15000,
  });
};

export { productionOrderCrudApi, productionOrderKeys };
