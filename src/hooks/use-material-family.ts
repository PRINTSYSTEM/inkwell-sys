import { createCrudHooks } from "./use-base";
import type {
  MaterialFamilyResponse,
  MaterialFamilyResponseIPaginate,
  CreateMaterialFamilyRequest,
  UpdateMaterialFamilyRequest,
} from "@/Schema/material-family.schema";
import { API_SUFFIX } from "@/apis";
import type { MaterialFamilieListParams } from "@/Schema/generated-params";

const {
  api: materialFamilyCrudApi,
  keys: materialFamilyKeys,
  useList: useMaterialFamilyListBase,
  useDetail: useMaterialFamilyDetailBase,
  useCreate: useCreateMaterialFamilyBase,
  useUpdate: useUpdateMaterialFamilyBase,
  useDelete: useDeleteMaterialFamilyBase,
} = createCrudHooks<
  MaterialFamilyResponse,
  CreateMaterialFamilyRequest,
  UpdateMaterialFamilyRequest,
  number,
  MaterialFamilieListParams,
  MaterialFamilyResponseIPaginate
>({
  rootKey: "material-families",
  basePath: API_SUFFIX.MATERIAL_FAMILIES,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo nhóm vật tư thành công",
    updateSuccess: "Đã cập nhật nhóm vật tư thành công",
    deleteSuccess: "Đã xóa nhóm vật tư thành công",
  },
});

export const useMaterialFamilies = (params?: MaterialFamilieListParams) =>
  useMaterialFamilyListBase(params ?? ({} as MaterialFamilieListParams));

export const useMaterialFamily = (id: number | null, enabled = true) =>
  useMaterialFamilyDetailBase(id, enabled);

export const useCreateMaterialFamily = () => useCreateMaterialFamilyBase();
export const useUpdateMaterialFamily = () => useUpdateMaterialFamilyBase();
export const useDeleteMaterialFamily = () => useDeleteMaterialFamilyBase();

export { materialFamilyCrudApi, materialFamilyKeys };
