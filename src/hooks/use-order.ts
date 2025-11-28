import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  OrderResponse,
  OrderResponsePagedResponse,
  OrderListParams,
  CreateOrderRequest,
  UpdateOrderRequest,
} from "@/Schema/order.schema";
import { API_SUFFIX } from "@/apis";

const {
  api: orderCrudApi,
  keys: orderKeys,
  useList: useOrderListBase,
  useDetail: useOrderDetailBase,
  useCreate: useCreateOrderBase,
  useUpdate: useUpdateOrderBase,
} = createCrudHooks<
  OrderResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  number,
  OrderListParams,
  OrderResponsePagedResponse
>({
  rootKey: "orders",
  basePath: "/api/orders",
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo đơn hàng thành công",
    updateSuccess: "Đã cập nhật đơn hàng thành công",
  },
});

export const useOrders = (params?: OrderListParams) =>
  useOrderListBase(params ?? ({} as OrderListParams));

export const useOrder = (id: number | null, enabled = true) =>
  useOrderDetailBase(id, enabled);

export const useCreateOrder = () => useCreateOrderBase();
export const useUpdateOrder = () => useUpdateOrderBase();

// POST /api/orders/{id}/generate-excel
export const useGenerateOrderExcel = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest.post<string>(API_SUFFIX.ORDER_EXCEL(id));
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo file Excel cho đơn hàng",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo file Excel",
        variant: "destructive",
      });
    },
  });
};

export { orderCrudApi, orderKeys };
