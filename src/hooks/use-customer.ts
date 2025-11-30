import type {
  CustomerResponse,
  CustomerSummaryResponsePagedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/Schema/customer.schema";
import { createCrudHooks } from "./use-base";
import { CustomerListParams } from "@/Schema";

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
  basePath: "/api/customers",
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
