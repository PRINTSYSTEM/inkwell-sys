// src/hooks/use-plate-export.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { createCrudHooks } from "./use-base";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import type {
  PlateExportResponse,
  PlateExportResponsePaginate,
  PlateExportListParams,
  UpdatePlateExportRequest,
} from "@/Schema";

// Create CRUD hooks base
const {
  api: plateExportCrudApi,
  keys: plateExportKeys,
  useList: usePlateExportListBase,
  useDetail: usePlateExportDetailBase,
} = createCrudHooks<
  PlateExportResponse,
  never, // Create not available
  UpdatePlateExportRequest,
  number,
  PlateExportListParams,
  PlateExportResponsePaginate
>({
  rootKey: "plate-exports",
  basePath: API_SUFFIX.PLATE_EXPORTS,
  getItems: (resp) => resp.items ?? [],
  messages: {},
});

// ===== Base hooks =====

export const usePlateExports = (params?: PlateExportListParams) => {
  // Normalize params to remove empty strings before passing to API
  const normalizedParams = params
    ? (normalizeParams(params as Record<string, unknown>) as PlateExportListParams)
    : ({} as PlateExportListParams);
  return usePlateExportListBase(normalizedParams);
};

export const usePlateExport = (id: number | null, enabled = true) =>
  usePlateExportDetailBase(id, enabled);

// ===== Update PlateExport price (inline edit for accounting) =====
// PUT /api/plate-exports/:id
export const useUpdatePlateExport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePlateExportRequest }) => {
      const response = await apiRequest.put<PlateExportResponse>(
        `${API_SUFFIX.PLATE_EXPORTS}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plateExportKeys.all });
      toast.success("Đã cập nhật thông tin phiếu xuất kẽm");
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error("Không thể cập nhật phiếu xuất kẽm", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Receive Plate Export =====
// PUT /api/proofing-orders/plates/:plateExportId/receive
export const useReceivePlate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plateExportId: number) => {
      const response = await apiRequest.put<PlateExportResponse>(
        API_SUFFIX.PROOFING_PLATE_RECEIVE(plateExportId)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plateExportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["productions"] });
      queryClient.invalidateQueries({ queryKey: ["print-orders"] });
      toast.success("Đã xác nhận nhận kẽm thành công");
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error("Không thể xác nhận nhận kẽm", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// Export for custom usage
export { plateExportCrudApi, plateExportKeys };

