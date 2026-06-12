import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import type {
  OrderResponse,
  OrderResponsePaginate,
  OrderListParams,
  OrdersForDesignerListParams,
  OrdersForAccountingListParams,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderForAccountingRequest,
  AddDesignToOrderRequest,
  OrderResponseForDesignerPaginate,
  UserRole,
  OrdersMyListParams,
  OrderExportResponse,
  CashReceiptResponseIPaginate,
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
  OrderResponsePaginate
>({
  rootKey: "orders",
  basePath: API_SUFFIX.ORDERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo đơn hàng thành công",
    updateSuccess: "Đã cập nhật đơn hàng thành công",
  },
});

export const useOrders = (params?: OrderListParams) => {
  // IMPORTANT: normalizeParams handles empty strings correctly
  // String params should already be "" not undefined when passed to hook
  // Note: useOrderListBase uses crudApi.list which doesn't normalize,
  // so we normalize here before passing to the base hook
  const normalizedParams = params
    ? (normalizeParams(params as Record<string, unknown>) as OrderListParams)
    : ({} as OrderListParams);
  return useOrderListBase(normalizedParams);
};

// Wrapper for admin/base list with enabled parameter
const useOrderListBaseWithEnabled = (
  params?: OrderListParams,
  enabled = true
) => {
  return useQuery<OrderResponsePaginate>({
    queryKey: orderKeys.list(params ?? ({} as OrderListParams)),
    enabled,
    queryFn: async () => {
      // IMPORTANT: normalizeParams handles empty strings correctly
      // String params should already be "" not undefined when passed to hook
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await orderCrudApi.list(
        normalizedParams as OrderListParams
      );
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
  // Không cần trả data ra ngoài, chỉ cần download file
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.ORDER_GENERATE_EXCEL(id),
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
      link.download = `don-hang-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);

      toast.success("Thành công", {
        description: "Đã tạo và tải file Excel cho đơn hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo file Excel",
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

// ================== ORDER: THÊM THIẾT KẾ VÀO ĐƠN ==================
// PUT /orders/{id}/add-design

export const useAddDesignToOrder = () => {
  const queryClient = useQueryClient();

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

      toast.success("Thành công", {
        description: "Đã thêm thiết kế vào đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể thêm thiết kế vào đơn",
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

// ================== ORDER: XÓA ORDER DETAIL ==================
// DELETE /orders/{orderId}/designs/{orderDetailId}

export const useRemoveOrderDetail = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [{ orderId: number; orderDetailId: number }]
  >(async ({ orderId, orderDetailId }) => {
    const res = await apiRequest.delete<OrderResponse>(
      API_SUFFIX.ORDER_REMOVE_DESIGN(orderId, orderDetailId)
    );
    return res.data;
  });

  const mutate = async (args: {
    orderId: number;
    orderDetailId: number;
  }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast.success("Thành công", {
        description: "Đã xóa sản phẩm khỏi đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xóa sản phẩm khỏi đơn",
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

const useOrdersForDesigner = (
  params?: OrdersForDesignerListParams,
  enabled = true
) => {
  return useQuery<OrderResponseForDesignerPaginate>({
    queryKey: [orderKeys.all[0], "for-designer", params],
    enabled,
    queryFn: async () => {
      // IMPORTANT: normalizeParams handles empty strings correctly
      // String params should already be "" not undefined when passed to hook
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderResponseForDesignerPaginate>(
        API_SUFFIX.ORDERS_FOR_DESIGNER,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ================== ORDER: LIST FOR ACCOUNTING ==================
// GET /orders/for-accounting

export const useOrdersForAccounting = (
  params?: OrdersForAccountingListParams,
  enabled = true
) => {
  return useQuery<OrderResponsePaginate>({
    queryKey: [orderKeys.all[0], "for-accounting", params],
    enabled,
    queryFn: async () => {
      // IMPORTANT: normalizeParams handles empty strings correctly
      // String params should already be "" not undefined when passed to hook
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderResponsePaginate>(
        API_SUFFIX.ORDERS_FOR_ACCOUNTING,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ================== ORDER: LIST FOR SALE (QUOTES) ==================
// GET /orders/for-sale
export const useOrdersForSale = (
  params?: OrdersForAccountingListParams,
  enabled = true
) => {
  return useQuery<OrderResponsePaginate>({
    queryKey: [orderKeys.all[0], "for-sale", params],
    enabled,
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderResponsePaginate>(
        API_SUFFIX.ORDERS_FOR_SALE,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ================== ORDER: UPDATE FOR ACCOUNTING ==================
// PUT /orders/{id}/accounting

export const useUpdateOrderForAccounting = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [number, UpdateOrderForAccountingRequest]
  >(async (id: number, payload: UpdateOrderForAccountingRequest) => {
    const res = await apiRequest.put<OrderResponse>(
      API_SUFFIX.ORDER_UPDATE_FOR_ACCOUNTING(id),
      payload
    );
    return res.data;
  });

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const postApprovedCashReceiptForOrder = async (
    orderId: number,
    customerId: number | null | undefined
  ): Promise<"posted" | "missing_customer" | "not_found"> => {
    if (!customerId) return "missing_customer";

    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const receiptsRes = await apiRequest.get<CashReceiptResponseIPaginate>(
        API_SUFFIX.CASH_RECEIPTS,
        {
          params: {
            customerId,
            status: "approved",
            pageNumber: 1,
            pageSize: 50,
          },
        }
      );

      const matchedReceipts = (receiptsRes.data.items ?? []).filter(
        (receipt) => receipt.orderId === orderId && receipt.id != null
      );

      if (matchedReceipts.length > 0) {
        const receiptToPost = [...matchedReceipts].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (bTime !== aTime) return bTime - aTime;
          return (b.id ?? 0) - (a.id ?? 0);
        })[0];

        if (receiptToPost?.id != null) {
          await apiRequest.post(API_SUFFIX.CASH_RECEIPT_POST(receiptToPost.id));
          queryClient.invalidateQueries({ queryKey: ["cash-receipts"] });
          queryClient.invalidateQueries({ queryKey: ["cash-book"] });
          return "posted";
        }
      }

      if (attempt < MAX_RETRIES) {
        await sleep(500);
      }
    }

    return "not_found";
  };

  const mutate = async (
    id: number,
    payload: UpdateOrderForAccountingRequest
  ) => {
    try {
      const result = await execute(id, payload);
      const shouldPostCashReceipt =
        (payload.depositAmount != null && payload.depositAmount > 0) ||
        payload.paymentMethodId != null;
      let postReceiptResult: "posted" | "missing_customer" | "not_found" =
        "missing_customer";

      if (shouldPostCashReceipt) {
        try {
          postReceiptResult = await postApprovedCashReceiptForOrder(
            id,
            result.customerId
          );

          if (postReceiptResult === "missing_customer") {
            toast.warning("Đã cập nhật đơn hàng", {
              description:
                "Không xác định được khách hàng để tìm phiếu thu duyệt và ghi sổ tự động.",
            });
          } else if (postReceiptResult === "not_found") {
            toast.warning("Đã cập nhật đơn hàng", {
              description:
                "Chưa tìm thấy phiếu thu ở trạng thái duyệt để ghi sổ. Vui lòng thử lại sau.",
            });
          }
        } catch {
          toast.warning("Đã cập nhật đơn hàng", {
            description:
              "Không thể ghi sổ phiếu thu tự động. Vui lòng vào Phiếu thu để ghi sổ thủ công.",
          });
        }
      }

      // Invalidate order detail
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(id),
      });

      // Invalidate orders list
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      // Invalidate accounting queries
      queryClient.invalidateQueries({
        queryKey: ["accounting"],
      });

      toast.success("Thành công", {
        description:
          shouldPostCashReceipt && postReceiptResult === "posted"
            ? "Đã cập nhật đơn hàng và ghi sổ phiếu thu"
            : "Đã cập nhật đơn hàng thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật đơn hàng",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// ================== ORDER: UPDATE FOR SALE ==================
// PUT /orders/{id}/sale

export const useUpdateOrderForSale = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    any,
    [number, any]
  >(async (id: number, payload: any) => {
    const res = await apiRequest.put<OrderResponse>(
      API_SUFFIX.ORDER_UPDATE_FOR_SALE(id),
      payload
    );
    return res.data;
  });

  const mutate = async (id: number, payload: any) => {
    try {
      const result = await execute(id, payload);

      // Invalidate order detail
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(id),
      });

      // Invalidate orders list
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      toast.success("Thành công", {
        description: "Đã cập nhật đơn hàng (sale) thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message || error?.message ||
          "Không thể cập nhật đơn hàng (sale)",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// ================== ORDER: EXPORT INVOICE / DELIVERY NOTE ==================
// POST /orders/{id}/export-invoice
// POST /orders/{id}/export-delivery-note

export const useExportOrderInvoice = () => {
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
      link.download = `hoa-don-don-hang-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      toast.success("Thành công", {
        description: "Đã xuất hoá đơn đơn hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất hoá đơn",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useExportOrderDeliveryNote = () => {
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
      link.download = `phieu-giao-hang-don-hang-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      toast.success("Thành công", {
        description: "Đã xuất phiếu giao hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất phiếu giao hàng",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

export const useExportOrderPDF = () => {
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (id: number) => {
      const res = await apiRequest.get<ArrayBuffer>(
        API_SUFFIX.ORDER_EXPORT_PDF(id),
        {
          responseType: "arraybuffer",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `don-hang-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (id: number) => {
    try {
      await execute(id);
      toast.success("Thành công", {
        description: "Đã xuất PDF đơn hàng",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất PDF",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};

// ================== ORDER: EXPORT DATA ==================
// GET /orders/{id}/export-data

export const useGetOrderExportData = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderExportResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.get<OrderExportResponse>(
      API_SUFFIX.ORDER_EXPORT_DATA(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);
      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể lấy dữ liệu xuất",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// ================== ORDER: RECALCULATE TOTAL ==================
// POST /orders/{id}/recalculate-total

export const useRecalculateOrderTotal = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.post<OrderResponse>(
      API_SUFFIX.ORDER_RECALCULATE_TOTAL(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast.success("Thành công", {
        description: "Đã tính lại tổng tiền đơn hàng",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tính lại tổng tiền",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// ================== ORDER: VALIDATE EXPORT ==================
// GET /orders/{id}/validate-export

export const useValidateOrderExport = () => {
  const { data, loading, error, execute, reset } = useAsyncCallback<
    unknown,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.get<unknown>(
      API_SUFFIX.ORDER_VALIDATE_EXPORT(id)
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);
      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể validate xuất",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useMyOrders = (
  params?: OrdersMyListParams,
  enabled: boolean = true
) => {
  return useQuery<OrderResponsePaginate>({
    queryKey: [orderKeys.all[0], "my", params ?? {}],
    enabled,
    queryFn: async () => {
      // IMPORTANT: normalizeParams handles empty strings correctly
      // String params should already be "" not undefined when passed to hook
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<OrderResponsePaginate>(
        API_SUFFIX.ORDERS_MY,
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrdersByRole = (role: UserRole, params?: OrderListParams) => {
  // Determine which hook should be enabled based on role
  const isAdminRole =
    role === ROLE.ADMIN ||
    role === ROLE.MANAGER ||
    role === ROLE.PROOFER ||
    role === ROLE.PRODUCTION ||
    role === ROLE.PRODUCTION_LEAD ||
    role === ROLE.ACCOUNTING_LEAD ||
    role === ROLE.ACCOUNTING ||
    role === ROLE.SALE;
  const isDesignerRole = role === ROLE.DESIGN;
  const isDesignerLeadRole = role === ROLE.DESIGN_LEAD;

  // Convert params based on role - ensure string params use empty strings, not undefined
  // normalizeParams will be called inside each hook
  const adminParams: OrderListParams = {
    pageNumber: params?.pageNumber,
    pageSize: params?.pageSize,
    customerId: params?.customerId,
    status: params?.status || "",
    search: params?.search || "",
    startDate: params?.startDate || "",
    endDate: params?.endDate || "",
    sortColumn: params?.sortColumn || "",
    sortOrder: params?.sortOrder || "",
  };

  const designerParams: OrdersForDesignerListParams = {
    pageNumber: params?.pageNumber,
    pageSize: params?.pageSize,
    status: params?.status || "",
    search: params?.search || "",
    sortColumn: params?.sortColumn || "",
    sortOrder: params?.sortOrder || "",
  };

  const myOrdersParams: OrdersMyListParams = {
    pageNumber: params?.pageNumber,
    pageSize: params?.pageSize,
    status: params?.status || "",
    search: params?.search || "",
    startDate: params?.startDate || "",
    endDate: params?.endDate || "",
    sortColumn: params?.sortColumn || "",
    sortOrder: params?.sortOrder || "",
  };

  // Call all hooks unconditionally to satisfy Rules of Hooks
  // But only enable the query for the current role to optimize performance
  const adminResult = useOrderListBaseWithEnabled(adminParams, isAdminRole);
  const designerResult = useMyOrders(myOrdersParams, isDesignerRole);

  const designerLeadResult = useOrdersForDesigner(
    designerParams,
    isDesignerLeadRole
  );

  // Return the appropriate result based on role
  if (isDesignerRole) {
    return designerResult;
  }

  if (isDesignerLeadRole) {
    return designerLeadResult;
  }

  // Default to admin/base for admin roles and others
  return adminResult;
};

// ================== ORDER: CANCEL ORDER ==================
// POST /orders/{id}/cancel
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    OrderResponse,
    [number, { reason: string }]
  >(async (id: number, payload: { reason: string }) => {
    const res = await apiRequest.post<OrderResponse>(
      API_SUFFIX.ORDER_CANCEL(id),
      payload
    );
    return res.data;
  });

  const mutate = async (id: number, payload: { reason: string }) => {
    try {
      const result = await execute(id, payload);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast.success("Thành công", {
        description: "Đã hủy đơn hàng thành công",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hủy đơn hàng",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};
