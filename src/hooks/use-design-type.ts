import {
  CreateDesignTypeRequest,
  DesignTypeEntity,
  DesignTypeQueryParams,
  UpdateDesignTypeRequest,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
const designTypeCrud = createCrudHooks<
  DesignTypeEntity,
  CreateDesignTypeRequest,
  UpdateDesignTypeRequest,
  number,
  DesignTypeQueryParams,
  DesignTypeEntity[]
>({
  rootKey: "design-types",
  basePath: API_SUFFIX.DESIGN_TYPES,
  messages: {
    createSuccess: "Đã tạo loại thiết kế thành công",
    updateSuccess: "Đã cập nhật loại thiết kế thành công",
    deleteSuccess: "Đã xoá loại thiết kế thành công",
    uploadSuccess: "Đã import loại thiết kế",
    downloadSuccess: "Đã tải xuống template loại thiết kế",
  },
});

// export ra cho page dùng
export const designTypeKeys = designTypeCrud.keys;

export const useDesignTypes = designTypeCrud.useList;
export const useDesignType = designTypeCrud.useDetail;
export const useCreateDesignType = designTypeCrud.useCreate;
export const useUpdateDesignType = designTypeCrud.useUpdate;
export const useDeleteDesignType = designTypeCrud.useDelete;
export const useUploadDesignTypes = designTypeCrud.useUpload;
export const useDownloadDesignTypes = designTypeCrud.useDownload;
