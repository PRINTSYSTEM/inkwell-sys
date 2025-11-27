import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Design,
  DesignListResponse,
  DesignQueryParams,
  CreateDesignRequest,
  UpdateDesignRequest,
  CreateTimelineEntry,
  TimelineEntry,
} from "@/Schema";
import * as designApi from "@/apis/design.api";
import { API_SUFFIX } from "@/apis/util.api";
import { createCrudHooks } from "./use-base";

// ================== Generic CRUD cho Design ==================

const designCrud = createCrudHooks<
  Design,
  CreateDesignRequest,
  UpdateDesignRequest,
  number,
  DesignQueryParams,
  DesignListResponse
>({
  rootKey: "designs",
  basePath: API_SUFFIX.DESIGNS, // ví dụ: "/designs"
  messages: {
    createSuccess: "Đã tạo design mới thành công",
    updateSuccess: "Đã cập nhật design thành công",
    deleteSuccess: "Đã xóa design thành công",
    uploadSuccess: "Đã upload file thành công",
    downloadSuccess: "Đã tải file thành công",
    createError: "Không thể tạo design",
    updateError: "Không thể cập nhật design",
    deleteError: "Không thể xóa design",
    uploadError: "Không thể upload file",
    downloadError: "Không thể tải file",
  },
});

// ================== Query Keys (mở rộng từ generic) ==================

export const designKeys = {
  ...designCrud.keys, // all, list(params), detail(id)

  // Extra keys giống bản cũ
  my: () => [...designCrud.keys.all, "my"] as const,
  myList: (params: DesignQueryParams | {}) =>
    [...designCrud.keys.all, "my", params] as const,
  timeline: (id: number) =>
    [...designCrud.keys.detail(id), "timeline"] as const,
  employees: () => [...designCrud.keys.all, "employees"] as const,
} as const;

// ================== Hooks dùng generic CRUD ==================

/**
 * Lấy danh sách designs (có pagination / filter) – dùng generic useList
 */
export const useDesigns = (params?: DesignQueryParams) => {
  return designCrud.useList(params);
};

/**
 * Lấy chi tiết 1 design theo id – dùng generic useDetail
 */
export const useDesign = (id: number, enabled: boolean = true) => {
  return designCrud.useDetail(id, enabled);
};

/**
 * Tạo design – dùng generic useCreate
 */
export const useCreateDesign = designCrud.useCreate;

/**
 * Cập nhật design – dùng generic useUpdate
 * mutationFn({ id, data })
 */
export const useUpdateDesign = designCrud.useUpdate;

/**
 * Xoá design – dùng generic useDelete
 * mutationFn(id)
 */
export const useDeleteDesign = designCrud.useDelete;

// ================== Hooks custom thêm (không nằm trong CRUD chung) ==================

/**
 * Lấy danh sách design "của tôi" (được assign cho user hiện tại)
 */
export const useMyDesigns = (params?: DesignQueryParams) => {
  return useQuery({
    queryKey: designKeys.myList(params || {}),
    queryFn: () => designApi.getMyDesigns(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Lấy timeline của 1 design
 */
export const useDesignTimeline = (id: number, enabled: boolean = true) => {
  return useQuery<TimelineEntry[]>({
    queryKey: designKeys.timeline(id),
    queryFn: () => designApi.getTimelineEntries(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Thêm timeline entry cho 1 design
 */
export const useAddTimelineEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, entry }: { id: number; entry: CreateTimelineEntry }) =>
      designApi.addTimelineEntry(id, entry),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });

      toast({
        title: "Thành công",
        description: "Đã thêm mục thời gian thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể thêm mục thời gian",
        variant: "destructive",
      });
    },
  });
};

/**
 * Generate file Excel (export) – vẫn dùng designApi.generateDesignExcel
 * Nếu sau này endpoint dùng /download chung, có thể chuyển sang designCrud.useDownload
 */
export const useGenerateExcel = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: designApi.generateDesignExcel,
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo file Excel thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể tạo file Excel",
        variant: "destructive",
      });
    },
  });
};

/**
 * Upload file design
 * (nếu endpoint phù hợp /designs/:id/upload thì có thể dùng luôn designCrud.useUpload)
 */
export const useUploadDesignFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      designApi.uploadDesignFile(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });

      toast({
        title: "Thành công",
        description: "Đã upload file design thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể upload file",
        variant: "destructive",
      });
    },
  });
};

/**
 * Danh sách nhân viên có liên quan tới design
 */
export const useDesignEmployees = () => {
  return useQuery({
    queryKey: designKeys.employees(),
    queryFn: () => designApi.getDesignEmployees(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Danh sách design theo nhân viên (employee designs)
 */
export const useEmployeeDesigns = (params?: DesignQueryParams) => {
  return useQuery({
    queryKey: designCrud.keys.list(params || {}),
    queryFn: () => designApi.getEmployeeDesigns(params),
    staleTime: 10 * 60 * 1000,
  });
};
