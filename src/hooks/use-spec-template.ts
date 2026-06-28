import { createCrudHooks } from "./use-base";
import type {
  SpecificationTemplateResponse,
  CreateSpecificationTemplateRequest,
  UpdateSpecificationTemplateRequest,
} from "@/Schema/spec-template.schema";
import { API_SUFFIX } from "@/apis";
import type { SpecTemplateListParams } from "@/Schema/generated-params";

const {
  api: specTemplateCrudApi,
  keys: specTemplateKeys,
  useList: useSpecTemplateListBase,
  useDetail: useSpecTemplateDetailBase,
  useCreate: useCreateSpecTemplateBase,
  useUpdate: useUpdateSpecTemplateBase,
  useDelete: useDeleteSpecTemplateBase,
} = createCrudHooks<
  SpecificationTemplateResponse,
  CreateSpecificationTemplateRequest,
  UpdateSpecificationTemplateRequest,
  number,
  SpecTemplateListParams,
  SpecificationTemplateResponse[]
>({
  rootKey: "spec-templates",
  basePath: API_SUFFIX.SPEC_TEMPLATES,
  getItems: (resp) => resp || [],
  messages: {
    createSuccess: "Đã tạo thuộc tính tùy biến thành công",
    updateSuccess: "Đã cập nhật thuộc tính tùy biến thành công",
    deleteSuccess: "Đã xóa thuộc tính tùy biến thành công",
  },
});

export const useSpecTemplates = (params?: SpecTemplateListParams) =>
  useSpecTemplateListBase(params ?? ({} as SpecTemplateListParams));

export const useSpecTemplate = (id: number | null, enabled = true) =>
  useSpecTemplateDetailBase(id, enabled);

export const useCreateSpecTemplate = () => useCreateSpecTemplateBase();
export const useUpdateSpecTemplate = () => useUpdateSpecTemplateBase();
export const useDeleteSpecTemplate = () => useDeleteSpecTemplateBase();

export { specTemplateCrudApi, specTemplateKeys };
