// hooks/design-type.hook.ts (hoặc file tương đương)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import designTypeApi from "@/apis/design-type.api";
import {
  CreateDesignTypeRequest,
  DesignTypeEntity,
  DesignTypeQueryParams,
} from "@/Schema";

export const designTypeKeys = {
  all: ["design-types"] as const,
  lists: () => [...designTypeKeys.all, "list"] as const,
  list: (params: DesignTypeQueryParams) =>
    [...designTypeKeys.lists(), params] as const,
  details: () => [...designTypeKeys.all, "detail"] as const,
  detail: (id: number) => [...designTypeKeys.details(), id] as const,
} as const;

export const useDesignTypes = (params?: DesignTypeQueryParams) => {
  return useQuery<DesignTypeEntity[]>({
    queryKey: designTypeKeys.list(params || {}),
    queryFn: () => designTypeApi.getDesignTypes(params),
    staleTime: 5 * 60 * 1000,
  });
};
export const useCreateDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDesignTypeRequest) =>
      designTypeApi.createDesignType(data),
    onSuccess: (newDesignType) => {
      // cache chi tiết (nếu anh có dùng detail)
      queryClient.setQueryData(
        designTypeKeys.detail(newDesignType.id),
        newDesignType
      );

      // cập nhật tất cả list đang cache: DesignTypeEntity[]
      queryClient.setQueriesData(
        { queryKey: designTypeKeys.all },
        (oldData: DesignTypeEntity[] | undefined) => {
          if (!oldData) {
            // chưa có cache list -> tạo mới array
            return [newDesignType];
          }
          // trả về array mới, KHÔNG đổi shape
          return [newDesignType, ...oldData];
        }
      );

      toast({
        title: "Thành công",
        description: `Đã tạo loại thiết kế ${newDesignType.name} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo loại thiết kế",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateDesignTypeRequest>;
    }) => designTypeApi.updateDesignType(id, data),
    onSuccess: () => {
      // chỉ cần refetch lại tất cả query liên quan tới design-types
      queryClient.invalidateQueries({
        queryKey: designTypeKeys.all,
      });

      toast({
        title: "Thành công",
        description: `Đã cập nhật loại thiết kế thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật loại thiết kế",
        variant: "destructive",
      });
    },
  });
};
export const useDeleteDesignType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => designTypeApi.deleteDesignType(id),
    onSuccess: (_, deletedId) => {
      // xoá cache chi tiết (nếu có dùng)
      queryClient.removeQueries({
        queryKey: designTypeKeys.detail(deletedId),
      });

      // refetch lại tất cả list "design-types"
      queryClient.invalidateQueries({
        queryKey: designTypeKeys.all,
      });

      toast({
        title: "Thành công",
        description: "Đã xóa loại thiết kế thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa loại thiết kế",
        variant: "destructive",
      });
    },
  });
};
