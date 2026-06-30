import { createCrudHooks } from "./use-base";
import type {
  SupplierCatalogResponse,
  CreateSupplierCatalogRequest,
} from "@/Schema/supplier-catalog.schema";
import { API_SUFFIX } from "@/apis";
import type { SupplierCatalogListParams } from "@/Schema/generated-params";

const {
  api: supplierCatalogCrudApi,
  keys: supplierCatalogKeys,
  useList: useSupplierCatalogListBase,
  useDetail: useSupplierCatalogDetailBase,
  useCreate: useCreateSupplierCatalogBase,
  useDelete: useDeleteSupplierCatalogBase,
} = createCrudHooks<
  SupplierCatalogResponse,
  CreateSupplierCatalogRequest,
  any, // No update request type
  number,
  SupplierCatalogListParams,
  SupplierCatalogResponse[]
>({
  rootKey: "supplier-catalogs",
  basePath: API_SUFFIX.SUPPLIER_CATALOGS,
  getItems: (resp) => resp || [],
  messages: {
    createSuccess: "Đã liên kết vật tư vào danh mục NCC thành công",
    deleteSuccess: "Đã gỡ liên kết vật tư khỏi danh mục NCC thành công",
  },
});

export const useSupplierCatalogs = (params?: SupplierCatalogListParams) =>
  useSupplierCatalogListBase(params ?? ({} as SupplierCatalogListParams));

export const useSupplierCatalog = (id: number | null, enabled = true) =>
  useSupplierCatalogDetailBase(id, enabled);

export const useCreateSupplierCatalog = () => useCreateSupplierCatalogBase();
export const useDeleteSupplierCatalog = () => useDeleteSupplierCatalogBase();

export { supplierCatalogCrudApi, supplierCatalogKeys };
