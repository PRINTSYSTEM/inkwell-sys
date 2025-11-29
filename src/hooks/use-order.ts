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
import { useAsyncCallback } from "@/hooks/use-async";

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
  basePath: API_SUFFIX.ORDERS,
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

// POST /orders/{id}/generate-excel
export const useGenerateOrderExcel = () => {
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    string,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post<string>(API_SUFFIX.ORDER_EXCEL(id));
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);
      toast({
        title: "Thành công",
        description: "Đã tạo file Excel cho đơn hàng",
      });
      return result;
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tạo file Excel",
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

export { orderCrudApi, orderKeys };
