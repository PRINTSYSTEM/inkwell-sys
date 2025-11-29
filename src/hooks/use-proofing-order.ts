import { useQuery } from "@tanstack/react-query";
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
} from "@/Schema/proofing-order.schema";
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
