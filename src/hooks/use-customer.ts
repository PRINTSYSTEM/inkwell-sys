import type {
  CustomerResponse,
  CustomerSummaryResponsePagedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerDebtHistoryResponse,
  CustomerDebtHistoryResponsePagedResponse,
  CustomerMonthlyDebtResponse,
  CustomerDebtSummaryResponse,
  CustomerStatisticsResponse,
  CustomerOrdersResponsePagedResponse,
} from "@/Schema/customer.schema";
import { createCrudHooks } from "./use-base";
import {
  CustomerListParams,
  CustomerDebtHistoryParams,
  CustomerMonthlyDebtParams,
  CustomerDebtSummaryParams,
  OrderResponsePagedResponse,
  CustomerOrdersParams,
} from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { normalizeParams } from "@/apis/util.api";

// Không có DELETE trong swagger → vẫn dùng createCrudHooks nhưng KHÔNG export useDelete.
const {
  api: customerCrudApi,
  keys: customerKeys,
  useList: useCustomerListBase,
  useDetail: useCustomerDetailBase,
  useCreate: useCreateCustomerBase,
  useUpdate: useUpdateCustomerBase,
} = createCrudHooks<
  CustomerResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  number,
  CustomerListParams,
  CustomerSummaryResponsePagedResponse
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
export const useCheckDuplicateCompany = () => {
  const { execute, loading, error } = useAsyncCallback<boolean, [string]>(
    async (name: string) => {
      const res = await apiRequest.get<boolean>(
        API_SUFFIX.CUSTOMER_CHECK_DUPLICATE_COMPANY(name)
      );
      return res.data;
    }
  );

  return {
    check: execute,
    loading,
    error,
  };
};

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
      const res =
        await apiRequest.get<CustomerDebtHistoryResponsePagedResponse>(
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
// TODO: Implement when API endpoint is available
export function useCustomerFavoriteStats(
  customerId: number,
  enabled: boolean = true
) {
  return useQuery<{
    topDesignTypes: Array<{ name: string; count: number; percentage: number }>;
    topMaterialTypes: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    commonQuantities: number[];
  }>({
    queryKey: ["customerFavoriteStats", customerId],
    queryFn: async () => {
      // Placeholder - return empty stats until API is implemented
      return {
        topDesignTypes: [],
        topMaterialTypes: [],
        commonQuantities: [],
      };
    },
    enabled: enabled && !!customerId,
  });
}
