import { createCrudHooks } from "./use-base";
import type {
  SpecValueResponse,
  CreateSpecValueRequest,
  UpdateSpecValueRequest,
} from "@/Schema/spec-value.schema";
import { API_SUFFIX } from "@/apis";
import type { SpecValueListParams } from "@/Schema/generated-params";

const {
  api: specValueCrudApi,
  keys: specValueKeys,
  useList: useSpecValueListBase,
  useDetail: useSpecValueDetailBase,
  useCreate: useCreateSpecValueBase,
  useUpdate: useUpdateSpecValueBase,
  useDelete: useDeleteSpecValueBase,
} = createCrudHooks<
  SpecValueResponse,
  CreateSpecValueRequest,
  UpdateSpecValueRequest,
  number,
  SpecValueListParams,
  SpecValueResponse[]
>({
  rootKey: "spec-values",
  basePath: API_SUFFIX.SPEC_VALUES,
  getItems: (resp) => resp || [],
  messages: {
    createSuccess: "Đã tạo giá trị thông số thành công",
    updateSuccess: "Đã cập nhật giá trị thông số thành công",
    deleteSuccess: "Đã xóa giá trị thông số thành công",
  },
});

export const useSpecValues = (params?: SpecValueListParams) =>
  useSpecValueListBase(params ?? ({} as SpecValueListParams));

export const useSpecValue = (id: number | null, enabled = true) =>
  useSpecValueDetailBase(id, enabled);

export const useCreateSpecValue = () => useCreateSpecValueBase();
export const useUpdateSpecValue = () => useUpdateSpecValueBase();
export const useDeleteSpecValue = () => useDeleteSpecValueBase();

export { specValueCrudApi, specValueKeys };
