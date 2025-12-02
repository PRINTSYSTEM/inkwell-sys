import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  OrderResponse,
  OrderResponsePagedResponse,
  OrderListParams,
  CreateOrderRequest,
  UpdateOrderRequest,
} from "@/Schema";
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

  // Không cần trả data ra ngoài, chỉ cần download file
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.ORDER_EXCEL(id),
        null,
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-${id}.xlsx`; // có thể đổi tên tuỳ ý
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);

      toast({
        title: "Thành công",
        description: "Đã tạo và tải file Excel cho đơn hàng",
      });
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
    loading,
    error,
    mutate,
    reset,
  };
};

export { orderCrudApi, orderKeys };
