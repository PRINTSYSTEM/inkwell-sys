import { createCrudHooks } from "./use-base";
import type {
  SupplierTypeResponse,
  SupplierTypeResponseIPaginate,
  CreateSupplierTypeRequest,
  UpdateSupplierTypeRequest,
} from "@/Schema/supplier-type.schema";
import { API_SUFFIX } from "@/apis";
import type { SupplierTypeListParams } from "@/Schema/generated-params";

const {
  api: supplierTypeCrudApi,
  keys: supplierTypeKeys,
  useList: useSupplierTypeListBase,
  useDetail: useSupplierTypeDetailBase,
  useCreate: useCreateSupplierTypeBase,
  useUpdate: useUpdateSupplierTypeBase,
  useDelete: useDeleteSupplierTypeBase,
} = createCrudHooks<
  SupplierTypeResponse,
  CreateSupplierTypeRequest,
  UpdateSupplierTypeRequest,
  number,
  SupplierTypeListParams,
  SupplierTypeResponseIPaginate
>({
  rootKey: "supplier-types",
  basePath: API_SUFFIX.SUPPLIER_TYPES,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo loại nhà cung cấp thành công",
    updateSuccess: "Đã cập nhật loại nhà cung cấp thành công",
    deleteSuccess: "Đã xóa loại nhà cung cấp thành công",
  },
});

export const useSupplierTypes = (params?: SupplierTypeListParams) =>
  useSupplierTypeListBase(params ?? ({} as SupplierTypeListParams));

export const useSupplierType = (id: number | null, enabled = true) =>
  useSupplierTypeDetailBase(id, enabled);

export const useCreateSupplierType = () => useCreateSupplierTypeBase();
export const useUpdateSupplierType = () => useUpdateSupplierTypeBase();
export const useDeleteSupplierType = () => useDeleteSupplierTypeBase();

export { supplierTypeCrudApi, supplierTypeKeys };
