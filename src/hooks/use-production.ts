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
} from "@/Schema";
import { useAsyncCallback } from "@/hooks/use-async";
import { API_SUFFIX } from "@/apis";

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
export const useProductionOrdersByOrder = (
  orderId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["production-orders", "by-order", orderId],
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<ProductionOrderResponse[]>(
        API_SUFFIX.PRODUCTION_ORDERS_BY_ORDER(orderId as number)
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
      data
    );
    return res.data;
  });

  const mutate = async (payload: {
    stepId: number;
    data: UpdateProductionStepRequest;
  }) => {
    try {
      const result = await execute(payload);

      // Invalidate production order queries to refresh step data
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.all,
      });

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

// PUT /api/production-orders/:productionOrderId/items/:itemId - Update production order item (design)
export const useUpdateProductionOrderItem = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    any,
    [{ productionOrderId: number; itemId: number; data: { outputQty?: number; defectQty?: number; notes?: string } }]
  >(async ({ productionOrderId, itemId, data }) => {
    const res = await apiRequest.put<any>(
      `/production-orders/${productionOrderId}/items/${itemId}`,
      data
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

// PUT /api/production-orders/steps/:stepId/assign - Assign worker to production step
export const useAssignProductionWorker = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionStepResponse,
    [{ stepId: number; data: AssignProductionStepRequest }]
  >(async ({ stepId, data }) => {
    const res = await apiRequest.put<ProductionStepResponse>(
      API_SUFFIX.PRODUCTION_STEP_ASSIGN(stepId),
      data
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
    "useStartProduction is deprecated. Use useUpdateProductionStep to update step status instead."
  );
  // Return a no-op hook for backward compatibility
  return {
    data: null,
    isPending: false,
    error: null,
    mutate: async () => {
      throw new Error(
        "useStartProduction is deprecated. Please use useUpdateProductionStep instead."
      );
    },
    reset: () => {},
  };
};

export const useCompleteProduction = () => {
  console.warn(
    "useCompleteProduction is deprecated. Use useUpdateProductionStep to update step status instead."
  );
  // Return a no-op hook for backward compatibility
  return {
    data: null,
    isPending: false,
    error: null,
    mutate: async () => {
      throw new Error(
        "useCompleteProduction is deprecated. Please use useUpdateProductionStep instead."
      );
    },
    reset: () => {},
  };
};

export { productionOrderCrudApi, productionOrderKeys };
