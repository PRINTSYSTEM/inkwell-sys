import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  ProductionResponse,
  ProductionResponsePagedResponse,
  ProductionListParams,
  CreateProductionRequest,
  UpdateProductionRequest,
  StartProductionRequest,
  CompleteProductionRequest,
} from "@/Schema/production.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";

const {
  api: productionCrudApi,
  keys: productionKeys,
  useList: useProductionListBase,
  useDetail: useProductionDetailBase,
  useCreate: useCreateProductionBase,
  useUpdate: useUpdateProductionBase,
} = createCrudHooks<
  ProductionResponse,
  CreateProductionRequest,
  UpdateProductionRequest,
  number,
  ProductionListParams,
  ProductionResponsePagedResponse
>({
  rootKey: "productions",
  basePath: API_SUFFIX.PRODUCTIONS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo lệnh sản xuất thành công",
    updateSuccess: "Đã cập nhật lệnh sản xuất thành công",
  },
});

export const useProductions = (params?: ProductionListParams) =>
  useProductionListBase(params ?? ({} as ProductionListParams));

export const useProduction = (id: number | null, enabled = true) =>
  useProductionDetailBase(id, enabled);

export const useCreateProduction = () => useCreateProductionBase();
export const useUpdateProduction = () => useUpdateProductionBase();

// GET /productions/proofing-order/{proofingOrderId}
export const useProductionsByProofingOrder = (
  proofingOrderId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [productionKeys.all[0], "by-proofing", proofingOrderId],
    enabled: enabled && !!proofingOrderId,
    queryFn: async () => {
      const res = await apiRequest.get<ProductionResponse[]>(
        API_SUFFIX.PRODUCTIONS_BY_PROOFING_ORDER(proofingOrderId as number)
      );
      return res.data;
    },
  });
};

// POST /productions/{id}/start
export const useStartProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionResponse,
    [{ id: number; data?: StartProductionRequest }]
  >(async ({ id, data }) => {
    const res = await apiRequest.post<ProductionResponse>(
      API_SUFFIX.PRODUCTION_START(id),
      data ?? {}
    );
    return res.data;
  });

  const mutate = async (payload: {
    id: number;
    data?: StartProductionRequest;
  }) => {
    try {
      const result = await execute(payload);

      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(result.id),
      });

      toast({
        title: "Thành công",
        description: "Đã bắt đầu sản xuất",
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

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// POST /productions/{id}/complete
export const useCompleteProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProductionResponse,
    [{ id: number; data?: CompleteProductionRequest }]
  >(async ({ id, data }) => {
    const res = await apiRequest.post<ProductionResponse>(
      API_SUFFIX.PRODUCTION_COMPLETE(id),
      data ?? {}
    );
    return res.data;
  });

  const mutate = async (payload: {
    id: number;
    data?: CompleteProductionRequest;
  }) => {
    try {
      const result = await execute(payload);

      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(result.id),
      });

      toast({
        title: "Thành công",
        description: "Đã hoàn thành sản xuất",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể hoàn thành sản xuất",
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

export { productionCrudApi, productionKeys };
