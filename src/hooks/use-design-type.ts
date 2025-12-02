// src/hooks/design-type.hooks.ts
import type {
  DesignTypeResponse, // = DesignTypeResponse
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";

// BE: GET /designs/types?status=...
export type DesignTypeListParams = {
  status?: string;
};

// BE: GET trả về DesignTypeResponse[]
export type DesignTypeListResponse = DesignTypeResponse[];

const designTypeCrud = createCrudHooks<
  DesignTypeResponse,
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
  number,
  DesignTypeListParams,
  DesignTypeListResponse
>({
  rootKey: "design-types",
  basePath: API_SUFFIX.DESIGN_TYPES,
  messages: {
    createSuccess: "Đã tạo loại thiết kế thành công",
    updateSuccess: "Đã cập nhật loại thiết kế thành công",
    deleteSuccess: "Đã xóa loại thiết kế thành công",
  },
});

export const {
  api: designTypeApi,
  keys: designTypeKeys,
  useList: useDesignTypeList,
  useDetail: useDesignTypeDetail,
  useCreate: useCreateDesignType,
  useUpdate: useUpdateDesignType,
  useDelete: useDeleteDesignType,
  useUpload: useUploadDesignType,
  useDownload: useDownloadDesignType,
  getItemsFromResponse: getDesignTypeItems,
} = designTypeCrud;

// Alias thân thiện cho UI
export const useDesignTypes = useDesignTypeList;
export const useDesignType = useDesignTypeDetail;
