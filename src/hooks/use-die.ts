// src/hooks/use-die.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import type {
  DieResponse,
  DieResponsePaginate,
  DieListParams,
  CreateDieRequest,
  UpdateDieRequest,
  AssignDieToProofingOrderRequest,
  ProofingOrderDieResponse,
} from "@/Schema";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

// Create CRUD hooks base
const {
  api: dieCrudApi,
  keys: dieKeys,
  useList: useDieListBase,
  useDetail: useDieDetailBase,
  useUpdate: useUpdateDieBase,
  useDelete: useDeleteDieBase,
} = createCrudHooks<
  DieResponse,
  never, // Create handled separately due to form-data
  UpdateDieRequest,
  number,
  DieListParams,
  DieResponsePaginate
>({
  rootKey: "dies",
  basePath: API_SUFFIX.DIES,
  getItems: (resp) => resp.items ?? [],
  messages: {
    updateSuccess: "Đã cập nhật khuôn bế thành công",
    deleteSuccess: "Đã xóa khuôn bế thành công",
  },
});

// ===== Base hooks =====

export const useDies = (params?: DieListParams) =>
  useDieListBase(params ?? ({} as DieListParams));

export const useDie = (id: number | null, enabled = true) =>
  useDieDetailBase(id, enabled);

export const useUpdateDie = () => useUpdateDieBase();
export const useDeleteDie = () => useDeleteDieBase();

// ===== Create Die (with form-data for image) =====
// POST /api/dies
export const useCreateDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      size?: string;
      price?: number;
      vendorId?: number;
      notes?: string;
      image?: File;
    }) => {
      const formData = new FormData();
      formData.append("Name", data.name);
      if (data.size != null) {
        formData.append("Size", data.size);
      }
      if (data.price != null) {
        formData.append("Price", data.price.toString());
      }
      if (data.vendorId != null) {
        formData.append("VendorId", data.vendorId.toString());
      }
      if (data.notes != null) {
        formData.append("Notes", data.notes);
      }
      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await apiRequest.post<DieResponse>(
        API_SUFFIX.DIES,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      toast.success("Đã tạo khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể tạo khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Upload Die Image =====
// POST /api/dies/:id/image
export const useUploadDieImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: File }) => {
      const formData = new FormData();
      formData.append("image", image);

      const response = await apiRequest.post<DieResponse>(
        API_SUFFIX.DIE_IMAGE(id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({ queryKey: dieKeys.detail(variables.id) });
      toast.success("Đã tải lên ảnh khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể tải lên ảnh khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Create Die from Die Export =====
// POST /api/dies/from-die-export/:dieExportId
export const useCreateDieFromDieExport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dieExportId,
      data,
    }: {
      dieExportId: number;
      data: CreateDieRequest;
    }) => {
      const response = await apiRequest.post<DieResponse>(
        API_SUFFIX.DIE_FROM_DIE_EXPORT(dieExportId),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      toast.success("Đã tạo khuôn bế từ xuất khuôn thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể tạo khuôn bế từ xuất khuôn", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Search Dies =====
// GET /api/dies/search
export const useSearchDies = (params?: {
  proofingOrderCode?: string;
  customerName?: string;
  designName?: string;
  dieName?: string;
  isUsable?: boolean;
  location?: string;
  pageNumber?: number;
  pageSize?: number;
}) => {
  return useQuery<DieResponsePaginate>({
    queryKey: [dieKeys.all[0], "search", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<DieResponsePaginate>(
        API_SUFFIX.DIE_SEARCH,
        { params: normalizedParams }
      );
      return res.data;
    },
    enabled: !!params && Object.keys(params).length > 0,
  });
};

// ===== Proofing Order Die Operations =====

// GET /api/dies/proofing-order/:proofingOrderId
export const useDiesByProofingOrder = (
  proofingOrderId: number | null,
  enabled = true
) => {
  return useQuery<ProofingOrderDieResponse[]>({
    queryKey: [dieKeys.all[0], "by-proofing-order", proofingOrderId],
    enabled: enabled && !!proofingOrderId,
    queryFn: async () => {
      const res = await apiRequest.get<ProofingOrderDieResponse[]>(
        API_SUFFIX.DIES_BY_PROOFING_ORDER(proofingOrderId as number)
      );
      return res.data;
    },
  });
};

// POST /api/dies/proofing-order/:proofingOrderId/assign
export const useAssignDieToProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proofingOrderId,
      data,
    }: {
      proofingOrderId: number;
      data: AssignDieToProofingOrderRequest;
    }) => {
      const response = await apiRequest.post<ProofingOrderDieResponse>(
        API_SUFFIX.DIE_ASSIGN_TO_PROOFING_ORDER(proofingOrderId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({
        queryKey: [dieKeys.all[0], "by-proofing-order", variables.proofingOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["proofing-orders", variables.proofingOrderId],
      });
      toast.success("Đã gán khuôn bế vào bình bài thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể gán khuôn bế vào bình bài", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// DELETE /api/dies/proofing-order/:proofingOrderId/die/:dieId
export const useRemoveDieFromProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proofingOrderId,
      dieId,
    }: {
      proofingOrderId: number;
      dieId: number;
    }) => {
      await apiRequest.delete(
        API_SUFFIX.DIE_REMOVE_FROM_PROOFING_ORDER(proofingOrderId, dieId)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({
        queryKey: [dieKeys.all[0], "by-proofing-order", variables.proofingOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["proofing-orders", variables.proofingOrderId],
      });
      toast.success("Đã gỡ khuôn bế khỏi bình bài thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể gỡ khuôn bế khỏi bình bài", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// POST /api/dies/proofing-order-die/:proofingOrderDieId/return
export const useReturnDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proofingOrderDieId: number) => {
      const response = await apiRequest.post<ProofingOrderDieResponse>(
        API_SUFFIX.DIE_PROOFING_ORDER_DIE_RETURN(proofingOrderDieId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      toast.success("Đã trả khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể trả khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// POST /api/dies/proofing-order-die/:proofingOrderDieId/take-out
export const useTakeOutDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proofingOrderDieId: number) => {
      const response = await apiRequest.post<ProofingOrderDieResponse>(
        API_SUFFIX.DIE_PROOFING_ORDER_DIE_TAKE_OUT(proofingOrderDieId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      toast.success("Đã lấy khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể lấy khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// Export for custom usage
export { dieCrudApi, dieKeys };
