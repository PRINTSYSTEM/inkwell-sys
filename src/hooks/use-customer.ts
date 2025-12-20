import type {
  CustomerResponse,
  CustomerSummaryResponsePagedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/Schema/customer.schema";
import { createCrudHooks } from "./use-base";
import { CustomerListParams } from "@/Schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/http";

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
  const { toast } = useToast();

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

      toast({
        title: "Thành công",
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

      toast({
        title: "Lỗi",
        description: message,
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
