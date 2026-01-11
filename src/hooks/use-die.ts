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
  ReplaceDieRequest,
  DieExportResponse,
  UpdateDieStatusRequest,
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
// Official schema fields (postApidies_Body): Price, VendorId, Notes, EstimatedReceiveAt, ReceivedAt, IsReusable, image
// Additional fields (via .passthrough()): Name, Code, Type, Size, Length, Width, Height
// Note: Code and Type are required by the UI but not in the official schema - API accepts them via passthrough
export type CreateDieFormData = {
  name?: string;
  code?: string; // Optional - not required by official schema, sent via passthrough
  type?: string; // Optional - not required by official schema, sent via passthrough
  size?: string; // Sent via passthrough
  length?: number; // Sent via passthrough
  width?: number; // Sent via passthrough
  height?: number; // Sent via passthrough
  price?: number; // Official schema field
  vendorId?: number; // Official schema field
  notes?: string; // Official schema field
  estimatedReceiveAt?: string; // Official schema field
  receivedAt?: string; // Official schema field
  isReusable?: boolean; // Official schema field
  image?: File; // Official schema field
};

export const useCreateDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDieFormData) => {
      const formData = new FormData();
      if (data.name != null) {
        formData.append("Name", data.name as string);
      }
      if (data.code != null && data.code !== "") {
        formData.append("Code", data.code as string);
      }
      if (data.type != null && data.type !== "") {
        formData.append("Type", data.type as string);
      }
      if (data.length != null) {
        formData.append("Length", data.length.toString());
      }
      if (data.width != null) {
        formData.append("Width", data.width.toString());
      }
      if (data.height != null) {
        formData.append("Height", data.height.toString());
      }
      if (data.size != null && data.size !== "") {
        formData.append("Size", data.size as string);
      }
      if (data.price != null) {
        formData.append("Price", data.price.toString());
      }
      if (data.vendorId != null) {
        formData.append("VendorId", data.vendorId.toString());
      }
      if (data.notes != null && data.notes !== "") {
        formData.append("Notes", data.notes as string);
      }
      if (data.estimatedReceiveAt) {
        formData.append("EstimatedReceiveAt", data.estimatedReceiveAt);
      }
      if (data.receivedAt) {
        formData.append("ReceivedAt", data.receivedAt);
      }
      if (data.isReusable !== undefined) {
        formData.append("IsReusable", data.isReusable.toString());
      }
      if (data.image) {
        formData.append("image", data.image as File);
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
      data: CreateDieRequest; // code and type are required in CreateDieRequest
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
// GET /api/dies
// Endpoint supports: q (general search), isUsable, location, designId, designTypeId, pageNumber, pageSize
export const useSearchDies = (params?: {
  proofingOrderCode?: string;
  customerName?: string;
  designName?: string;
  dieName?: string;
  designId?: number;
  designTypeId?: number;
  isUsable?: boolean;
  location?: string;
  pageNumber?: number;
  pageSize?: number;
}) => {
  return useQuery<DieResponsePaginate>({
    queryKey: [dieKeys.all[0], "search", params],
    queryFn: async () => {
      // Combine multiple search terms into q parameter for general search
      const searchTerms: string[] = [];
      if (params?.dieName?.trim()) {
        searchTerms.push(params.dieName.trim());
      }
      if (params?.designName?.trim()) {
        searchTerms.push(params.designName.trim());
      }
      if (params?.customerName?.trim()) {
        searchTerms.push(params.customerName.trim());
      }
      if (params?.proofingOrderCode?.trim()) {
        searchTerms.push(params.proofingOrderCode.trim());
      }

      const searchQuery: DieListParams = {
        q: searchTerms.length > 0 ? searchTerms.join(" ") : undefined, // Use q parameter for general search
        isUsable: params?.isUsable ?? undefined,
        location: params?.location || undefined,
        designId: params?.designId ?? undefined,
        designTypeId: params?.designTypeId ?? undefined,
        pageNumber: params?.pageNumber || 1,
        pageSize: params?.pageSize || 10,
      };

      const normalizedParams = normalizeParams(searchQuery);
      const res = await apiRequest.get<DieResponsePaginate>(API_SUFFIX.DIES, {
        params: normalizedParams,
      });
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
  return useQuery<DieExportResponse[]>({
    queryKey: [dieKeys.all[0], "by-proofing-order", proofingOrderId],
    enabled: enabled && !!proofingOrderId,
    queryFn: async () => {
      const res = await apiRequest.get<DieExportResponse[]>(
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
      const response = await apiRequest.post<DieExportResponse>(
        API_SUFFIX.DIE_ASSIGN_TO_PROOFING_ORDER(proofingOrderId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({
        queryKey: [
          dieKeys.all[0],
          "by-proofing-order",
          variables.proofingOrderId,
        ],
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
        queryKey: [
          dieKeys.all[0],
          "by-proofing-order",
          variables.proofingOrderId,
        ],
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

// POST /api/dies/die-export/:dieExportId/return
export const useReturnDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dieExportId: number) => {
      const response = await apiRequest.post<DieExportResponse>(
        API_SUFFIX.DIE_PROOFING_ORDER_DIE_RETURN(dieExportId)
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

// POST /api/dies/die-export/:dieExportId/take-out
export const useTakeOutDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dieExportId: number) => {
      const response = await apiRequest.post<DieExportResponse>(
        API_SUFFIX.DIE_PROOFING_ORDER_DIE_TAKE_OUT(dieExportId)
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

// PUT /api/dies/proofing-order/:proofingOrderId/die/:currentDieId
// NOTE: Endpoint exists in OpenAPI but validation script cannot extract path from function body
export const useReplaceDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proofingOrderId,
      currentDieId,
      data,
    }: {
      proofingOrderId: number;
      currentDieId: number;
      data: ReplaceDieRequest;
    }) => {
      const response = await apiRequest.put<DieExportResponse>(
        API_SUFFIX.DIE_REPLACE(proofingOrderId, currentDieId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({
        queryKey: [
          dieKeys.all[0],
          "by-proofing-order",
          variables.proofingOrderId,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["proofing-orders", variables.proofingOrderId],
      });
      toast.success("Đã thay thế khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể thay thế khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Update Die Status =====
// PUT /api/dies/:id/status
export const useUpdateDieStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateDieStatusRequest;
    }) => {
      const response = await apiRequest.put<DieResponse>(
        API_SUFFIX.DIE_UPDATE_STATUS(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dieKeys.all });
      queryClient.invalidateQueries({ queryKey: dieKeys.detail(variables.id) });
      toast.success("Đã cập nhật trạng thái khuôn bế thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Không thể cập nhật trạng thái khuôn bế", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Get Related Dies =====
// GET /api/dies/related?designId={designId}
export const useRelatedDies = (
  designId: number | null,
  enabled: boolean = true
) => {
  return useQuery<DieResponse[]>({
    queryKey: [dieKeys.all[0], "related", designId],
    enabled: enabled && !!designId,
    queryFn: async () => {
      const res = await apiRequest.get<DieResponse[]>(API_SUFFIX.DIES_RELATED, {
        params: { designId: designId as number },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Export for custom usage
export { dieCrudApi, dieKeys };
