import type {
  CustomerResponse,
  CustomerSummaryResponsePaginate,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerDebtHistoryResponse,
  CustomerDebtHistoryResponsePaginate,
  CustomerMonthlyDebtResponse,
  CustomerDebtSummaryResponse,
  CustomerStatisticsResponse,
  CustomerOrdersResponsePagedResponse,
  CustomerAddress,
  CustomerAddressResponsePaginate,
  CreateCustomerAddressRequest,
  UpdateCustomerAddressRequest,
  CustomerFavoriteStatsResponse,
} from "@/Schema/customer.schema";
import { createCrudHooks } from "./use-base";
import {
  CustomerListParams,
  CustomerDebtHistoryParams,
  CustomerMonthlyDebtParams,
  CustomerDebtSummaryParams,
  OrderResponsePaginate,
  CustomerOrdersParams,
} from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { normalizeParams } from "@/apis/util.api";

// Không có DELETE trong swagger → vẫn dùng createCrudHooks nhưng KHÔNG export useDelete.
const {
  api: customerCrudApi,
  keys: customerKeys,
  useList: useCustomerListBase,
  useDetail: useCustomerDetailBase,
  useCreate: useCreateCustomerBase,
  useUpdate: useUpdateCustomerBase,
  useDelete: useDeleteCustomerBase,
} = createCrudHooks<
  CustomerResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  number,
  CustomerListParams,
  CustomerSummaryResponsePaginate
>({
  rootKey: "customers",
  basePath: API_SUFFIX.CUSTOMERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo khách hàng thành công",
    updateSuccess: "Đã cập nhật khách hàng thành công",
    deleteSuccess: "Đã xóa khách hàng thành công",
    deleteError: "Không thể xóa khách hàng",
    createError: "Không thể tạo khách hàng",
    updateError: "Không thể cập nhật khách hàng",
  },
});

export const useCustomers = (params?: CustomerListParams) =>
  useCustomerListBase(params ?? ({} as CustomerListParams));

export const useCustomer = (id: number | null, enabled = true) =>
  useCustomerDetailBase(id, enabled);

export const useCreateCustomer = () => useCreateCustomerBase();
export const useUpdateCustomer = () => useUpdateCustomerBase();
export const useDeleteCustomer = () => useDeleteCustomerBase();

// Nếu cần crudApi cho custom endpoint sau này
export const customerApi = customerCrudApi;
export const customerQueryKeys = customerKeys;

// ================== EXPORT DEBT COMPARISON ==================
// POST /customers/{id}/export-debt-comparison
// Xuất file thống kê công nợ của khách hàng

export const useExportDebtComparison = () => {
  const { loading, error, execute, reset } = useAsyncCallback<void, [number]>(
    async (customerId: number) => {
      const res = await apiRequest.post<ArrayBuffer>(
        API_SUFFIX.CUSTOMER_EXPORT_DEBT_COMPARISON(customerId),
        null,
        { responseType: "arraybuffer" }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debt-comparison-customer-${customerId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  );

  const mutate = async (customerId: number) => {
    try {
      await execute(customerId);

      toast.success("Thành công", {
        description: "Đã xuất báo cáo đối chiếu công nợ",
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xuất báo cáo đối chiếu công nợ";

      toast.error("Lỗi", {
        description: message,
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

// ================== CHECK DUPLICATE COMPANY ==================
// DEPRECATED: Endpoint not found in OpenAPI schema
// TODO: Remove or implement when endpoint is available
// This endpoint was commented out because it doesn't exist in the OpenAPI specification
// export const useCheckDuplicateCompany = () => {
//   const { execute, loading, error } = useAsyncCallback<boolean, [string]>(
//     async (name: string) => {
//       const res = await apiRequest.get<boolean>(
//         API_SUFFIX.CUSTOMER_CHECK_DUPLICATE_COMPANY(name)
//       );
//       return res.data;
//     }
//   );

//   return {
//     check: execute,
//     loading,
//     error,
//   };
// };

// ================== GET CUSTOMER DEBT HISTORY ==================
// GET /customers/{id}/debt-history

export const useCustomerDebtHistory = (
  customerId: number | null,
  params?: CustomerDebtHistoryParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["customers", customerId, "debt-history", params],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      // API returns CustomerDebtHistoryResponsePaginate
      const res = await apiRequest.get<CustomerDebtHistoryResponsePaginate>(
        API_SUFFIX.CUSTOMER_DEBT_HISTORY(customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ================== GET CUSTOMER MONTHLY DEBT ==================
// GET /customers/{id}/monthly-debt

export const useCustomerMonthlyDebt = (
  customerId: number | null,
  params?: CustomerMonthlyDebtParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["customers", customerId, "monthly-debt", params],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<CustomerMonthlyDebtResponse>(
        API_SUFFIX.CUSTOMER_MONTHLY_DEBT(customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ================== GET CUSTOMER DEBT SUMMARY ==================
// GET /customers/{id}/debt-summary

export const useCustomerDebtSummary = (
  customerId: number | null,
  params?: CustomerDebtSummaryParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["customers", customerId, "debt-summary", params],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<CustomerDebtSummaryResponse>(
        API_SUFFIX.CUSTOMER_DEBT_SUMMARY(customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ================== GET CUSTOMER ORDERS ==================
export function useCustomerOrders(
  params: CustomerOrdersParams & { enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: ["customerOrders", queryParams],
    queryFn: async () => {
      const normalizedParams = normalizeParams(queryParams ?? {});
      const res = await apiRequest.get<CustomerOrdersResponsePagedResponse>(
        API_SUFFIX.CUSTOMER_ORDERS(queryParams.customerId as number),
        { params: normalizedParams }
      );
      return res.data;
    },
    enabled: enabled && !!queryParams.customerId,
  });
}

// ================== GET CUSTOMER STATISTICS ==================
// GET /customers/{id}/statistics
export const useCustomerStatistics = (
  customerId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["customers", customerId, "statistics"],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const res = await apiRequest.get<CustomerStatisticsResponse>(
        API_SUFFIX.CUSTOMER_STATISTICS(customerId as number)
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ================== GET CUSTOMER FAVORITE STATS ==================
// GET /customers/{id}/favorite-stats
export function useCustomerFavoriteStats(
  customerId: number,
  enabled: boolean = true
) {
  return useQuery<CustomerFavoriteStatsResponse>({
    queryKey: ["customerFavoriteStats", customerId],
    queryFn: async () => {
      const res = await apiRequest.get<CustomerFavoriteStatsResponse>(
        API_SUFFIX.CUSTOMER_FAVORITE_STATS(customerId)
      );
      return res.data;
    },
    enabled: enabled && !!customerId,
  });
}

// ================== CUSTOMER ADDRESSES (Sổ địa chỉ) ==================

// GET /customers/{id}/addresses  → trả về CustomerAddressResponsePaginate
export const useCustomerAddresses = (
  customerId: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["customers", customerId, "addresses"],
    enabled: enabled && !!customerId,
    queryFn: async () => {
      const res = await apiRequest.get<CustomerAddressResponsePaginate | CustomerAddress[]>(
        API_SUFFIX.CUSTOMER_ADDRESSES(customerId as number),
        { params: { pageNumber: 1, pageSize: 50 } }
      );
      // Handle cả 2 case: server trả paginate object HOẶC plain array
      let items: CustomerAddress[];
      if (Array.isArray(res.data)) {
        items = res.data as CustomerAddress[];
      } else {
        items = (res.data?.items ?? []) as CustomerAddress[];
      }
      // NOTE (backend bug): isActive luôn = false dù mới tạo → KHÔNG filter theo isActive
      // Xem: https://checkafe.online/api/customers/{id}/addresses trả isActive=false cho tất cả
      return items;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// POST /customers/{id}/addresses
export const useCreateCustomerAddress = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerAddressRequest) => {
      const res = await apiRequest.post<CustomerAddress>(
        API_SUFFIX.CUSTOMER_ADDRESSES(customerId),
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "addresses"],
      });
      toast.success("Đã thêm địa chỉ giao hàng");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// PUT /customers/{id}/addresses/{addressId}
export const useUpdateCustomerAddress = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      data,
    }: {
      addressId: number;
      data: UpdateCustomerAddressRequest;
    }) => {
      const res = await apiRequest.put<CustomerAddress>(
        API_SUFFIX.CUSTOMER_ADDRESS_BY_ID(customerId, addressId),
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "addresses"],
      });
      toast.success("Đã cập nhật địa chỉ giao hàng");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// "Xóa" địa chỉ: Swagger không có DELETE → dùng PUT với isActive=false
export const useDeleteCustomerAddress = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: number) => {
      await apiRequest.put(
        API_SUFFIX.CUSTOMER_ADDRESS_BY_ID(customerId, addressId),
        { isActive: false } as UpdateCustomerAddressRequest
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "addresses"],
      });
      toast.success("Đã xóa địa chỉ giao hàng");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// Đặt mặc định: dùng PUT với isDefault=true
export const useSetDefaultCustomerAddress = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: number) => {
      const res = await apiRequest.put<CustomerAddress>(
        API_SUFFIX.CUSTOMER_ADDRESS_BY_ID(customerId, addressId),
        { isDefault: true } as UpdateCustomerAddressRequest
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "addresses"],
      });
      toast.success("Đã đặt địa chỉ mặc định");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

