import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  OrderResponse,
  OrderResponsePagedResponse,
  OrderListParams,
  CreateOrderRequest,
  UpdateOrderRequest,
  CreateOrderWithExistingDesignsRequest,
  AddDesignToOrderRequest,
  OrderResponseForDesignerPagedResponse,
  UserRole,
} from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { normalizeParams } from "@/apis/util.api";
import { ROLE } from "@/constants";

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

// Wrapper for admin/base list with enabled parameter
const useOrderListBaseWithEnabled = (
  params?: OrderListParams,
  enabled = true
) => {
  return useQuery<OrderResponsePagedResponse>({
    queryKey: orderKeys.list(params ?? ({} as OrderListParams)),
    enabled,
    queryFn: async () => {
      const res = await orderCrudApi.list(params ?? ({} as OrderListParams));
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

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
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
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
// ================== ORDER: TẠO TỪ EXISTING DESIGNS ==================
// POST /orders/with-existing-designs

export const useCreateOrderWithExistingDesigns = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [CreateOrderWithExistingDesignsRequest]
  >(async (payload) => {
    const res = await apiRequest.post<OrderResponse>(
      API_SUFFIX.ORDERS_WITH_EXISTING_DESIGNS,
      payload
    );
    return res.data;
  });

  const mutate = async (payload: CreateOrderWithExistingDesignsRequest) => {
    try {
      const result = await execute(payload);

      // Cập nhật cache
      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast({
        title: "Thành công",
        description: "Đã tạo đơn hàng từ thiết kế có sẵn",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo đơn hàng từ thiết kế có sẵn",
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

// ================== ORDER: THÊM THIẾT KẾ VÀO ĐƠN ==================
// PUT /orders/{id}/add-design

export const useAddDesignToOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [{ id: number; payload: AddDesignToOrderRequest }]
  >(async ({ id, payload }) => {
    const res = await apiRequest.put<OrderResponse>(
      API_SUFFIX.ORDER_ADD_DESIGN(id),
      payload
    );
    return res.data;
  });

  const mutate = async (args: {
    id: number;
    payload: AddDesignToOrderRequest;
  }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast({
        title: "Thành công",
        description: "Đã thêm thiết kế vào đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể thêm thiết kế vào đơn",
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
// ================== ORDER: LIST FOR DESIGNER ==================
// GET /orders/for-designer

const useOrdersForDesigner = (params?: OrderListParams, enabled = true) => {
  return useQuery<OrderResponseForDesignerPagedResponse>({
    queryKey: [orderKeys.all[0], "for-designer", params],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<OrderResponseForDesignerPagedResponse>(
        API_SUFFIX.ORDERS_FOR_DESIGNER,
        { params }
      );
      return res.data;
    },
  });
};

// ================== ORDER: LIST FOR ACCOUNTING ==================
// GET /orders/for-accounting

const useOrdersForAccounting = (params?: OrderListParams, enabled = true) => {
  return useQuery<OrderResponsePagedResponse>({
    queryKey: [orderKeys.all[0], "for-accounting", params],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<OrderResponsePagedResponse>(
        API_SUFFIX.ORDERS_FOR_ACCOUNTING,
        { params }
      );
      return res.data;
    },
  });
};

// ================== ORDER: EXPORT INVOICE / DELIVERY NOTE ==================
// POST /orders/{id}/export-invoice
// POST /orders/{id}/export-delivery-note

export const useExportOrderInvoice = () => {
  const { toast } = useToast();

  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.ORDER_EXPORT_INVOICE(id),
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
      link.download = `order-${id}-invoice.xlsx`;
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
        description: "Đã xuất hoá đơn đơn hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất hoá đơn",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useExportOrderDeliveryNote = () => {
  const { toast } = useToast();

  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.ORDER_EXPORT_DELIVERY_NOTE(id),
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
      link.download = `order-${id}-delivery-note.xlsx`;
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
        description: "Đã xuất phiếu giao hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất phiếu giao hàng",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useOrdersByRole = (role: UserRole, params?: OrderListParams) => {
  const finalParams = normalizeParams(params ?? ({} as OrderListParams));

  // Determine which hook should be enabled based on role
  const isAdminRole =
    role === ROLE.ADMIN ||
    role === ROLE.MANAGER ||
    role === ROLE.PROOFER ||
    role === ROLE.PRODUCTION ||
    role === ROLE.PRODUCTION_LEAD ||
    role === ROLE.ACCOUNTING_LEAD;
  const isDesignerRole = role === ROLE.DESIGN || role === ROLE.DESIGN_LEAD;
  const isAccountingRole = role === ROLE.ACCOUNTING;

  // Call all hooks unconditionally to satisfy Rules of Hooks
  // But only enable the query for the current role to optimize performance
  const adminResult = useOrderListBaseWithEnabled(finalParams, isAdminRole);
  const designerResult = useOrdersForDesigner(finalParams, isDesignerRole);
  const accountingResult = useOrdersForAccounting(
    finalParams,
    isAccountingRole
  );

  // Return the appropriate result based on role
  if (isDesignerRole) {
    return designerResult;
  }

  if (isAccountingRole) {
    return accountingResult;
  }

  // Default to admin/base for admin roles and others
  return adminResult;
};
