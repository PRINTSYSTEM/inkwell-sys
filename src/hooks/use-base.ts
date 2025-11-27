// src/lib/crud-hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { crudApi } from "@/lib/http";
import { createCrudKeys } from "@/lib/crud-key";

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

export function createCrudHooks<
  TEntity,
  TCreate,
  TUpdate = Partial<TCreate>,
  TId = number,
  TListParams = any,
  TListResponse = TEntity[]
>(config: {
  rootKey: string; // ví dụ: "design-types"
  basePath: string; // ví dụ: "/designs/types"
  /**
   * Nếu list API trả không phải TEntity[] mà là { items, totalCount } thì
   * dùng getItems để extract array khi cần.
   */
  getItems?: (resp: TListResponse) => TEntity[];
  messages?: MessagesConfig;
}) {
  const { rootKey, basePath, getItems, messages } = config;

  const api = crudApi<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TListParams,
    TListResponse
  >(basePath);

  const keys = createCrudKeys<TListParams, TId>(rootKey);

  // ===== LIST =====
  const useList = (params?: TListParams) => {
    return useQuery<TListResponse>({
      queryKey: keys.list(params ?? ({} as TListParams)),
      queryFn: () => api.list(params),
      staleTime: 5 * 60 * 1000,
    });
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

    return useMutation({
      mutationFn: (data: TCreate) => api.create(data),
      onSuccess: (created: any) => {
        if ((created as any)?.id !== undefined) {
          queryClient.setQueryData(keys.detail((created as any).id), created);
        }

        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.createSuccess ?? "Đã tạo mới thành công",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Lỗi",
          description:
            error.message || messages?.createError || "Không thể tạo mới",
          variant: "destructive",
        });
      },
    });
  };

  // ===== UPDATE =====
  const useUpdate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: ({ id, data }: { id: TId; data: TUpdate }) =>
        api.update(id, data),
      onSuccess: (updated: any) => {
        if ((updated as any)?.id !== undefined) {
          queryClient.setQueryData(keys.detail((updated as any).id), updated);
        }

        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.updateSuccess ?? "Đã cập nhật thành công",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Lỗi",
          description:
            error.message || messages?.updateError || "Không thể cập nhật",
          variant: "destructive",
        });
      },
    });
  };

  // ===== DELETE =====
  const useDelete = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
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
      onError: (error: Error) => {
        toast({
          title: "Lỗi",
          description:
            error.message || messages?.deleteError || "Không thể xoá",
          variant: "destructive",
        });
      },
    });
  };

  // ===== UPLOAD (import, upload file...) =====
  const useUpload = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: ({
        formData,
        subPath,
      }: {
        formData: FormData;
        subPath?: string;
      }) => api.upload(formData, subPath),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });

        toast({
          title: "Thành công",
          description: messages?.uploadSuccess ?? "Đã tải lên thành công",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Lỗi",
          description:
            error.message || messages?.uploadError || "Không thể tải lên",
          variant: "destructive",
        });
      },
    });
  };

  // ===== DOWNLOAD (export file...) =====
  const useDownload = () => {
    const { toast } = useToast();

    return useMutation({
      mutationFn: ({
        subPath,
        filename,
      }: {
        subPath?: string;
        filename?: string;
      }) => api.download(subPath, filename),
      onSuccess: () => {
        toast({
          title: "Thành công",
          description: messages?.downloadSuccess ?? "Đã tải xuống thành công",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Lỗi",
          description:
            error.message || messages?.downloadError || "Không thể tải xuống",
          variant: "destructive",
        });
      },
    });
  };

  return {
    api,
    keys,
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
    useUpload,
    useDownload,
    // optional helper: lấy items từ list response nếu cần
    getItemsFromResponse: (resp: TListResponse): TEntity[] => {
      if (getItems) return getItems(resp);
      // mặc định: resp là array
      return (resp as unknown as TEntity[]) ?? [];
    },
  };
}
