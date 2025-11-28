import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  basePath: "/api/productions",
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

// GET /api/productions/proofing-order/{proofingOrderId}
export const useProductionsByProofingOrder = (
  proofingOrderId: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: [productionKeys.all[0], "by-proofing", proofingOrderId],
    enabled: enabled && !!proofingOrderId,
    queryFn: async () => {
      const res = await apiRequest.get<ProductionResponse[]>(
        API_SUFFIX.PRODUCTIONS_BY_PROOFING_ORDER(proofingOrderId)
      );
      return res.data;
    },
  });
};

// POST /api/productions/{id}/start
export const useStartProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: StartProductionRequest;
    }) => {
      const res = await apiRequest.post<ProductionResponse>(
        API_SUFFIX.PRODUCTION_START(id),
        data ?? {}
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(data.id),
      });
      toast({
        title: "Thành công",
        description: "Đã bắt đầu sản xuất",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể bắt đầu sản xuất",
        variant: "destructive",
      });
    },
  });
};

// POST /api/productions/{id}/complete
export const useCompleteProduction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: CompleteProductionRequest;
    }) => {
      const res = await apiRequest.post<ProductionResponse>(
        API_SUFFIX.PRODUCTION_COMPLETE(id),
        data ?? {}
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(data.id),
      });
      toast({
        title: "Thành công",
        description: "Đã hoàn thành sản xuất",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn thành sản xuất",
        variant: "destructive",
      });
    },
  });
};

export { productionCrudApi, productionKeys };
