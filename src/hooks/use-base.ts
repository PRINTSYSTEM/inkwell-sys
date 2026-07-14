// src/hooks/use-base.ts
// Generic CRUD hooks factory với TanStack Query
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { crudApi } from "@/lib/http";
import {
  createCrudKeys,
  invalidateRelatedQueries,
  RELATED_QUERIES,
} from "@/lib/crud-key";
import { ServiceError } from "@/services/BaseService";
import { AxiosError } from "axios";

// ===== TYPES =====

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
  /** Root key cho query cache (vd: "orders", "designs") */
  rootKey: string;
  /** Base API path (vd: "/api/orders") */
  basePath: string;
  /** Hàm extract items từ response (cho paged response) */
  getItems?: (resp: TListResponse) => TEntity[];
  /** Hàm lấy ID từ entity */
  getId?: (entity: TEntity) => TId;
  /** Custom messages cho toast */
  messages?: MessagesConfig;
};

// ===== HELPER FUNCTIONS =====

/**
 * Lấy error message từ error object
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Đã xảy ra lỗi không xác định"
): string => {
  if (error instanceof ServiceError) {
    if (error.errors) {
      return Object.values(error.errors).flat().join(", ");
    }
    return error.message;
  }

  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    const data = axiosError.response?.data;
    if (data && typeof data === "object") {
      return data.Error || data.error || data.message || axiosError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/**
 * Invalidate cache cho entity và các entity liên quan
 */
const invalidateEntityQueries = (
  queryClient: QueryClient,
  rootKey: string
): void => {
  const relatedKeys = RELATED_QUERIES[rootKey] ?? [rootKey];
  invalidateRelatedQueries(queryClient, relatedKeys);
};

// ===== MAIN FACTORY =====

export function createCrudHooks<
  TEntity,
  TCreate,
  TUpdate = Partial<TCreate>,
  TId = number,
  TListParams = Record<string, unknown>,
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

  // API instance
  const api = crudApi<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TListParams,
    TListResponse
  >(basePath);

  // Query keys
  const keys = createCrudKeys<TListParams, TId>(rootKey);

  // Helper: resolve entity ID
  const resolveId = (entity: TEntity): TId | undefined => {
    if (getId) return getId(entity);
    return (entity as Record<string, unknown>)?.id as TId | undefined;
  };

  // Helper: extract items từ response
  const extractItems = (data: TListResponse | undefined): TEntity[] => {
    if (!data) return [];
    if (getItems) return getItems(data);
    return Array.isArray(data) ? data : [];
  };

  // ===== LIST =====
  const useList = (params?: TListParams) => {
    return useQuery<TListResponse>({
      queryKey: keys.list(params ?? ({} as TListParams)),
      queryFn: () => api.list(params),
      staleTime: 5 * 60 * 1000, // 5 phút
    });
  };

  // List với items đã extract
  const useListItems = (params?: TListParams) => {
    const query = useList(params);
    return {
      ...query,
      items: extractItems(query.data),
    };
  };

  // ===== DETAIL =====
  const useDetail = (id: TId | null, enabled = true) => {
    return useQuery<TEntity>({
      queryKey: keys.detail(id as TId),
      queryFn: () => api.get(id as TId),
      enabled: enabled && id !== null,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
  };

  // ===== CREATE =====
  const useCreate = () => {
    const queryClient = useQueryClient();

    return useMutation<TEntity, ServiceError | Error, TCreate & { suppressToast?: boolean }>({
      mutationFn: (variables) => {
        const { suppressToast, ...payload } = variables as any;
        return api.create(payload);
      },
      onSuccess: (created, variables) => {
        // Cache detail ngay lập tức
        const entityId = resolveId(created);
        if (entityId !== undefined) {
          queryClient.setQueryData(keys.detail(entityId), created);
        }

        // Invalidate related queries
        invalidateEntityQueries(queryClient, rootKey);

        if (!(variables as any)?.suppressToast) {
          toast.success("Thành công", {
            description: messages?.createSuccess ?? "Đã tạo mới thành công",
          });
        }
      },
      onError: (error) => {
        console.log("🚀 ~ useCreate ~ error:", error);

        toast.error("Lỗi", {
          description:
            getErrorMessage(error, messages?.createError) ||
            "Không thể tạo mới",
        });
      },
    });
  };

  // ===== UPDATE =====
  const useUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation<
      TEntity,
      ServiceError | Error,
      { id: TId; data: TUpdate; suppressToast?: boolean }
    >({
      mutationFn: ({ id, data }) => api.update(id, data),
      onSuccess: (updated, variables) => {
        // Cache detail ngay lập tức
        const entityId = resolveId(updated);
        if (entityId !== undefined) {
          queryClient.setQueryData(keys.detail(entityId), updated);
        }

        // Invalidate related queries
        invalidateEntityQueries(queryClient, rootKey);

        if (!variables?.suppressToast) {
          toast.success("Thành công", {
            description: messages?.updateSuccess ?? "Đã cập nhật thành công",
          });
        }
      },
      onError: (error) => {
        toast.error("Lỗi", {
          description:
            getErrorMessage(error, messages?.updateError) ||
            "Không thể cập nhật",
        });
      },
    });
  };

  // ===== DELETE =====
  const useDelete = () => {
    const queryClient = useQueryClient();

    return useMutation<void, ServiceError | Error, TId | { id: TId; suppressToast?: boolean }>({
      mutationFn: (variables) => {
        const id = typeof variables === "object" && variables !== null && "id" in variables ? (variables as any).id : variables;
        return api.delete(id);
      },
      onSuccess: (_, variables) => {
        const id = typeof variables === "object" && variables !== null && "id" in variables ? (variables as any).id : variables;
        const suppressToast = typeof variables === "object" && variables !== null && "suppressToast" in variables ? (variables as any).suppressToast : false;

        // Xóa cache detail
        queryClient.removeQueries({
          queryKey: keys.detail(id),
        });

        // Invalidate related queries
        invalidateEntityQueries(queryClient, rootKey);

        if (!suppressToast) {
          toast.success("Thành công", {
            description: messages?.deleteSuccess ?? "Đã xoá thành công",
          });
        }
      },
      onError: (error) => {
        toast.error("Lỗi", {
          description:
            getErrorMessage(error, messages?.deleteError) || "Không thể xoá",
        });
      },
    });
  };

  // ===== UPLOAD =====
  const useUpload = () => {
    const queryClient = useQueryClient();

    return useMutation<
      unknown,
      ServiceError | Error,
      { formData: FormData; subPath?: string }
    >({
      mutationFn: ({ formData, subPath }) => api.upload(formData, subPath),
      onSuccess: () => {
        // Invalidate related queries
        invalidateEntityQueries(queryClient, rootKey);

        toast.success("Thành công", {
          description: messages?.uploadSuccess ?? "Đã tải lên thành công",
        });
      },
      onError: (error) => {
        toast.error("Lỗi", {
          description:
            getErrorMessage(error, messages?.uploadError) ||
            "Không thể tải lên",
        });
      },
    });
  };

  // ===== DOWNLOAD =====
  const useDownload = () => {
    return useMutation<
      void,
      ServiceError | Error,
      { subPath?: string; filename?: string }
    >({
      mutationFn: ({ subPath, filename }) => api.download(subPath, filename),
      onSuccess: () => {
        toast.success("Thành công", {
          description: messages?.downloadSuccess ?? "Đã tải xuống thành công",
        });
      },
      onError: (error) => {
        toast.error("Lỗi", {
          description:
            getErrorMessage(error, messages?.downloadError) ||
            "Không thể tải xuống",
        });
      },
    });
  };

  // ===== RETURN =====
  return {
    // API & Keys (để sử dụng ngoài hooks nếu cần)
    api,
    keys,

    // Query hooks
    useList,
    useListItems,
    useDetail,

    // Mutation hooks
    useCreate,
    useUpdate,
    useDelete,
    useUpload,
    useDownload,

    // Utility
    extractItems,
    resolveId,
  };
}
