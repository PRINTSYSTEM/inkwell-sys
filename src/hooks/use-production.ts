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
} from "@/Schema";
import { useAsyncCallback } from "@/hooks/use-async";

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
  basePath: "/api/productions/orders",
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

// PUT /api/productions/steps/:id/status - Update production step status
export const useUpdateProductionStep = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionStepResponse,
    [{ id: number; data: UpdateProductionStepRequest }]
  >(async ({ id, data }) => {
    const res = await apiRequest.put<ProductionStepResponse>(
      `/api/productions/steps/${id}/status`,
      data
    );
    return res.data;
  });

  const mutate = async (payload: {
    id: number;
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
