import { useQuery, useMutation } from "@tanstack/react-query";
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
  basePath: "/api/proofing-orders",
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

// POST /api/proofing-orders/from-designs
export const useCreateProofingOrderFromDesigns = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProofingOrderFromDesignsRequest) => {
      const res = await apiRequest.post<ProofingOrderResponse>(
        API_SUFFIX.PROOFING_FROM_DESIGNS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo bình bài từ danh sách thiết kế",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo bình bài",
        variant: "destructive",
      });
    },
  });
};

// GET /api/proofing-orders/available-designs
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
