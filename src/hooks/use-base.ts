// src/lib/crud-hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { crudApi } from "@/lib/http";
import { createCrudKeys } from "@/lib/crud-key";
import { ServiceError, serviceUtils } from "@/services/BaseService";

type MessagesConfig = {
  createSuccess?: string;
  updateSuccess?: string;
  deleteSuccess?: string;
  uploadSuccess?: string;
  downloadSuccess?: string;
  createError?: string;
  updateError?: string;
  deleteError?: string;
  uploadError?: string;
  downloadError?: string;
};

type CrudHooksConfig<
  TEntity,
  TCreate,
  TUpdate,
  TId,
  TListParams,
  TListResponse
> = {
  rootKey: string;
  basePath: string;
  getItems?: (resp: TListResponse) => TEntity[];
  getId?: (entity: TEntity) => TId;
  messages?: MessagesConfig;
};

export function createCrudHooks<
  TEntity,
  TCreate,
  TUpdate = Partial<TCreate>,
  TId = number,
  TListParams = any,
  TListResponse = TEntity[]
>(
  config: CrudHooksConfig<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TListParams,
    TListResponse
  >
) {
  const { rootKey, basePath, getItems, getId, messages } = config;

  const api = crudApi<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TListParams,
    TListResponse
  >(basePath);

  const keys = createCrudKeys<TListParams, TId>(rootKey);

  const resolveId = (entity: TEntity): TId | undefined => {
    if (getId) return getId(entity);
    const anyEntity = entity as any;
    return anyEntity?.id as TId | undefined;
  };

  const getErrorMessage = (error: unknown, fallback?: string) => {
    if (error instanceof ServiceError) {
      return serviceUtils.formatErrorMessage(error);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback ?? "Đã xảy ra lỗi không xác định";
  };

  // ===== LIST =====
  const useList = (params?: TListParams) => {
    return useQuery<TListResponse>({
      queryKey: keys.list(params ?? ({} as TListParams)),
      queryFn: () => api.list(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Optional: trả luôn TEntity[]
  const useListItems = (params?: TListParams) => {
    const query = useList(params);
    const items: TEntity[] =
      query.data != null
        ? getItems
          ? getItems(query.data)
          : (query.data as unknown as TEntity[]) ?? []
        : [];
    return { ...query, items };
  };

  // ===== DETAIL =====
  const useDetail = (id: TId | null, enabled: boolean = true) => {
    return useQuery<TEntity>({
      queryKey: keys.detail(id as TId),
      queryFn: () => api.get(id as TId),
      enabled: enabled && id !== null,
    });
  };

  // ===== CREATE =====
  const useCreate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<TEntity, ServiceError | Error, TCreate>({
      mutationFn: (data: TCreate) => api.create(data),
      onSuccess: (created) => {
        const id = resolveId(created);
        if (id !== undefined) {
          queryClient.setQueryData(keys.detail(id), created);
        }

        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.createSuccess ?? "Đã tạo mới thành công",
        });
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description:
            getErrorMessage(error, messages?.createError) ||
            "Không thể tạo mới",
          variant: "destructive",
        });
      },
    });
  };

  // ===== UPDATE =====
  const useUpdate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<
      TEntity,
      ServiceError | Error,
      { id: TId; data: TUpdate }
    >({
      mutationFn: ({ id, data }) => api.update(id, data),
      onSuccess: (updated) => {
        const id = resolveId(updated);
        if (id !== undefined) {
          queryClient.setQueryData(keys.detail(id), updated);
        }

        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.updateSuccess ?? "Đã cập nhật thành công",
        });
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description:
            getErrorMessage(error, messages?.updateError) ||
            "Không thể cập nhật",
          variant: "destructive",
        });
      },
    });
  };

  // ===== DELETE =====
  const useDelete = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<void, ServiceError | Error, TId>({
      mutationFn: (id: TId) => api.delete(id),
      onSuccess: (_, deletedId) => {
        queryClient.removeQueries({
          queryKey: keys.detail(deletedId as any),
        });

        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.deleteSuccess ?? "Đã xoá thành công",
        });
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description:
            getErrorMessage(error, messages?.deleteError) || "Không thể xoá",
          variant: "destructive",
        });
      },
    });
  };

  // ===== UPLOAD =====
  const useUpload = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<
      unknown,
      ServiceError | Error,
      { formData: FormData; subPath?: string }
    >({
      mutationFn: ({ formData, subPath }) => api.upload(formData, subPath),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.uploadSuccess ?? "Đã tải lên thành công",
        });
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description:
            getErrorMessage(error, messages?.uploadError) ||
            "Không thể tải lên",
          variant: "destructive",
        });
      },
    });
  };

  // ===== DOWNLOAD =====
  const useDownload = () => {
    const { toast } = useToast();

    return useMutation<
      void,
      ServiceError | Error,
      { subPath?: string; filename?: string }
    >({
      mutationFn: ({ subPath, filename }) => api.download(subPath, filename),
      onSuccess: () => {
        toast({
          title: "Thành công",
          description: messages?.downloadSuccess ?? "Đã tải xuống thành công",
        });
      },
      onError: (error) => {
        toast({
          title: "Lỗi",
          description:
            getErrorMessage(error, messages?.downloadError) ||
            "Không thể tải xuống",
          variant: "destructive",
        });
      },
    });
  };

  return {
    api,
    keys,
    useList,
    useListItems,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
    useUpload,
    useDownload,
    getItemsFromResponse: (resp: TListResponse): TEntity[] => {
      if (getItems) return getItems(resp);
      return (resp as unknown as TEntity[]) ?? [];
    },
  };
}
