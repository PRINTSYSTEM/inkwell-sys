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
import type { postApidies_Body } from "@/Schema";
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

export const useCreateDie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: postApidies_Body) => {
      const formData = new FormData();

      const d = data as Record<string, unknown>;

      const name = (d.Name ?? d.name) as string | undefined;
      if (name != null && name !== "") {
        formData.append("Name", name);
      }
      const code = (d.Code ?? d.code) as string | undefined;
      if (code != null && code !== "") {
        formData.append("Code", code);
      }
      const type = (d.Type ?? d.type) as string | undefined;
      if (type != null && type !== "") {
        formData.append("Type", type);
      }
      const length = (d.Length ?? d.length) as number | undefined;
      if (length != null) {
        formData.append("Length", length.toString());
      }
      const width = (d.Width ?? d.width) as number | undefined;
      if (width != null) {
        formData.append("Width", width.toString());
      }
      const height = (d.Height ?? d.height) as number | undefined;
      if (height != null) {
        formData.append("Height", height.toString());
      }

      const size = (d.Size ?? d.size) as string | undefined;
      if (size != null && size !== "") {
        formData.append("Size", size);
      }
      const price = (d.Price ?? d.price) as number | undefined;
      if (price != null) {
        formData.append("Price", price.toString());
      }
      const vendorId = (d.VendorId ?? d.vendorId) as number | undefined;
      if (vendorId != null) {
        formData.append("VendorId", vendorId.toString());
      }
      const notes = (d.Notes ?? d.notes) as string | undefined;
      if (notes != null && notes !== "") {
        formData.append("Notes", notes);
      }
      const estimatedReceiveAt = (d.EstimatedReceiveAt ??
        d.estimatedReceiveAt) as string | undefined;
      if (estimatedReceiveAt) {
        formData.append("EstimatedReceiveAt", estimatedReceiveAt);
      }
      const receivedAt = (d.ReceivedAt ?? d.receivedAt) as string | undefined;
      if (receivedAt) {
        formData.append("ReceivedAt", receivedAt);
      }
      const isReusable = (d.IsReusable ?? d.isReusable) as boolean | undefined;
      if (isReusable !== undefined) {
        formData.append("IsReusable", isReusable.toString());
      }
      const firstProofingOrderId = (d.FirstProofingOrderId ??
        d.firstProofingOrderId) as number | undefined;
      if (firstProofingOrderId != null) {
        formData.append(
          "FirstProofingOrderId",
          firstProofingOrderId.toString()
        );
      }

      const image = (d.image ?? d.Image) as File | undefined;
      if (image) {
        formData.append("image", image);
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
// Uses DieListParams schema with fields: designCode, size, customerName, designName, q, code, etc.
// Supports both DieListParams schema and legacy format (dieName maps to q or code)
export const useSearchDies = (
  params?: DieListParams | {
    dieName?: string;
    designName?: string;
    customerName?: string;
  proofingOrderCode?: string;
  designId?: number;
  designTypeId?: number;
  isUsable?: boolean;
  location?: string;
  pageNumber?: number;
  pageSize?: number;
  }
) => {
  return useQuery<DieResponsePaginate>({
    queryKey: [dieKeys.all[0], "search", params],
    queryFn: async () => {
      // Convert legacy format to DieListParams if needed
      let searchQuery: DieListParams;
      
      if (params && "dieName" in params) {
        // Legacy format - convert to schema format
        const legacyParams = params as {
          dieName?: string;
          designName?: string;
          customerName?: string;
          proofingOrderCode?: string;
          designId?: number;
          designTypeId?: number;
          isUsable?: boolean;
          location?: string;
          pageNumber?: number;
          pageSize?: number;
        };
        
        // Combine search terms into q parameter (general search)
      const searchTerms: string[] = [];
        if (legacyParams.dieName?.trim()) {
          searchTerms.push(legacyParams.dieName.trim());
      }
        if (legacyParams.designName?.trim()) {
          searchTerms.push(legacyParams.designName.trim());
      }
        if (legacyParams.customerName?.trim()) {
          searchTerms.push(legacyParams.customerName.trim());
      }
        if (legacyParams.proofingOrderCode?.trim()) {
          searchTerms.push(legacyParams.proofingOrderCode.trim());
      }

        searchQuery = {
          q: searchTerms.length > 0 ? searchTerms.join(" ") : "",
          isUsable: legacyParams.isUsable ?? undefined,
          location: legacyParams.location || "",
          designId: legacyParams.designId ?? undefined,
          designTypeId: legacyParams.designTypeId ?? undefined,
          pageNumber: legacyParams.pageNumber ?? 1,
          pageSize: legacyParams.pageSize ?? 10,
        };
      } else {
        // Already in DieListParams format
        searchQuery = {
          ...params,
          pageNumber: params?.pageNumber ?? 1,
          pageSize: params?.pageSize ?? 10,
        } as DieListParams;
      }

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

// ===== Get Related Dies by Proofing Order =====
// GET /api/dies/related/proofing-order/:proofingOrderId
export const useRelatedDiesByProofingOrder = (
  proofingOrderId: number | null,
  params?: {
    relevance?: string;
    customer?: string;
  },
  enabled: boolean = true
) => {
  return useQuery<DieResponse[]>({
    queryKey: [
      dieKeys.all[0],
      "related-proofing-order",
      proofingOrderId,
      params,
    ],
    enabled: enabled && !!proofingOrderId,
    queryFn: async () => {
      const res = await apiRequest.get<DieResponse[]>(
        API_SUFFIX.DIES_RELATED_BY_PROOFING_ORDER(proofingOrderId as number),
        {
          params: {
            relevance: params?.relevance,
            customer: params?.customer,
          },
        }
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Export for custom usage
export { dieCrudApi, dieKeys };
