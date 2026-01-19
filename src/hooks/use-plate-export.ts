// src/hooks/use-plate-export.ts
import { useQuery } from "@tanstack/react-query";
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

// Export for custom usage
export { plateExportCrudApi, plateExportKeys };
