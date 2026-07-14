import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/http";
import { buildFilename, formatDateForFilename } from "@/utils/file-name";
import { createCrudHooks } from "./use-base";
import { DesignTypeCountResponseSchema } from "@/Schema/generated";

// Error type for API responses
type ApiError = {
  response?: { data?: { message?: string }; status?: number };
  message?: string;
};

import type {
  ProofingOrderResponse,
  ProofingOrderResponsePaginate,
  AvailableBinResponse,
  CompletedProofingOrderListParams,
} from "@/Schema/proofing-order.schema";
import { ProofingOrderResponseSchema } from "@/Schema/proofing-order.schema";
import type {
  PaperSizeResponse,
  CreatePaperSizeRequest,
} from "@/Schema/paper-size.schema";
import {
  PaperSizeResponseSchema,
  PaperSizeResponseIPaginateSchema,
} from "@/Schema/paper-size.schema";
import type {
  ProofingOrderListParams,
  UpdateProofingOrderRequest,
  OrderDetailResponse,
  OrderDetailResponsePaginate,
  RecordPlateExportRequest,
  RecordDieExportRequest,
  AddDesignsToProofingOrderRequest,
  RejectDesignRequest,
  ProofingOrderForProductionListParams,
  ProofingOrdersPauseParams,
  ProofingOrderAvailableOrderDetailsParams,
  UpdatePlateExportRequest,
  PlateExportResponse,
} from "@/Schema";
import { RecordDieExportRequestSchema } from "@/Schema";
import type { DesignResponse } from "@/Schema/design.schema";
import { API_SUFFIX } from "@/apis";
import { useAsyncCallback } from "@/hooks/use-async";
import { normalizeParams } from "@/apis/util.api";

type DesignTypeCountResponse = z.infer<typeof DesignTypeCountResponseSchema>;

const {
  api: proofingCrudApi,
  keys: proofingKeys,
  useList: useProofingOrderListBase,
  useDetail: useProofingOrderDetailBase,
  useCreate: useCreateProofingOrderBase,
  useUpdate: useUpdateProofingOrderBase,
  useDelete: useDeleteProofingOrderBase,
} = createCrudHooks<
  ProofingOrderResponse,
  unknown,
  UpdateProofingOrderRequest,
  number,
  ProofingOrderListParams,
  ProofingOrderResponsePaginate
>({
  rootKey: "proofing-orders",
  basePath: API_SUFFIX.PROOFING_ORDERS,
  getItems: (resp) => resp.items ?? [],
  messages: {
    createSuccess: "Đã tạo bình bài thành công",
    updateSuccess: "Đã cập nhật bình bài thành công",
    deleteSuccess: "Đã xóa bình bài thành công",
  },
});

export const useProofingOrders = (params?: ProofingOrderListParams) =>
  useProofingOrderListBase(params ?? ({} as ProofingOrderListParams));

export const useProofingOrder = (id: number | null, enabled = true) =>
  useProofingOrderDetailBase(id, enabled);

export const useCreateProofingOrder = () => useCreateProofingOrderBase();
export const useUpdateProofingOrder = () => useUpdateProofingOrderBase();
export const useDeleteProofingOrder = () => useDeleteProofingOrderBase();

// Note: POST /proofing-orders/from-designs endpoint has been removed from the API.
// Use the two-step approach instead:
// 1. Create proofing order with useCreateProofingOrder
// 2. Add designs with useAddDesignsToProofingOrder

// GET /proofing-orders/available-order-details
export const useAvailableOrderDetailsForProofing = (
  params?: ProofingOrderAvailableOrderDetailsParams,
) => {
  return useQuery({
    // Use specific value in queryKey instead of object to ensure proper refetch
    queryKey: [
      proofingKeys.all[0],
      "available-order-details",
      params?.materialTypeId ?? null,
      params?.designTypeId ?? null,
      params?.designCode ?? null,
      params?.pageNumber ?? 1,
      params?.pageSize ?? 10,
    ],
    queryFn: async () => {
      // 1. Fetch design types to resolve IDs
      const designTypesRes = await apiRequest.get<any>(API_SUFFIX.DESIGN_TYPES);
      const designTypes = Array.isArray(designTypesRes.data)
        ? designTypesRes.data
        : (designTypesRes.data.items ?? []);
      const nhanGiayType = designTypes.find((dt: any) =>
        dt.name.toLowerCase().includes("nhãn") || dt.name.toLowerCase().includes("nhan")
      );
      const tuiType = designTypes.find((dt: any) =>
        dt.name.toLowerCase().includes("túi") || dt.name.toLowerCase().includes("tui")
      );
      const nhanGiayId = nhanGiayType?.id || 0;
      const tuiId = tuiType?.id || 0;

      // 2. Resolve parameters for backend
      const normalizedParams = normalizeParams(params ?? {});
      const reqDesignTypeId = params?.designTypeId;
      
      let finalDesignTypeId = reqDesignTypeId;
      let needClientFiltering = false;
      
      if (reqDesignTypeId === 999001) {
        finalDesignTypeId = nhanGiayId;
        needClientFiltering = true;
      } else if (reqDesignTypeId === 999002) {
        finalDesignTypeId = tuiId;
        needClientFiltering = true;
      } else if (reqDesignTypeId === nhanGiayId || reqDesignTypeId === tuiId) {
        needClientFiltering = true;
      }
      
      const apiParams = { ...normalizedParams };
      if (finalDesignTypeId !== undefined && finalDesignTypeId !== null) {
        apiParams.designTypeId = finalDesignTypeId;
      }
      
      // If we are filtering client side, fetch a large list to do correct pagination
      if (needClientFiltering) {
        apiParams.pageSize = 1000;
        apiParams.pageNumber = 1;
      }

      // API returns OrderDetailResponsePaginate
      const res = await apiRequest.get<OrderDetailResponsePaginate>(
        API_SUFFIX.PROOFING_AVAILABLE_ORDER_DETAILS,
        { params: apiParams },
      );

      // Extract items from paginate response
      const orderDetails = res.data.items ?? [];

      // Transform OrderDetailResponse[] to expected structure
      let designs = orderDetails
        .filter((od) => {
          const hasDesign = od.design != null;
          if (!hasDesign) {
            console.warn("⚠️ OrderDetail missing design:", od.id);
          }
          return hasDesign;
        })
        .map((od, index) => {
          const design = od.design!;
          const isPoolDesign = od.orderDetailId == null;
          const rDesignId = od.readyDesignId ?? design.id;
          const qId = (od as any).queueItemId || (isPoolDesign ? `RD_${rDesignId}` : `OD_${od.id}`);
          const avForProofing = (od as any).availableForProofing ?? (design.availableQuantityForProofing != null ? design.availableQuantityForProofing : undefined);

          let designTypeId = design.designTypeId ?? 0;
          let designTypeName = design.designType?.name || "";
          
          const lowerDesignName = designTypeName.toLowerCase();
          const lowerMaterialName = (design.materialType?.name || "").toLowerCase();
          const isMetaline = lowerMaterialName.includes("metaline") || lowerMaterialName.includes("metalize");

          if (isMetaline) {
            if (lowerDesignName.includes("nhãn") || lowerDesignName.includes("nhan")) {
              designTypeId = 999001;
              designTypeName = "Nhãn Metaline";
            } else if (lowerDesignName.includes("túi") || lowerDesignName.includes("tui")) {
              designTypeId = 999002;
              designTypeName = "Túi Metaline";
            }
          }

          const designItem = {
            id: isPoolDesign ? -rDesignId : (od.id ?? 0),
            code: design.code || "",
            name: design.designName || "",
            designTypeId,
            designTypeName,
            materialTypeId: design.materialTypeId ?? 0,
            materialTypeName: design.materialType?.name || "",
            length: design.length ?? 0,
            width: design.width ?? undefined,
            height: design.height ?? 0,
            unit: "mm",
            quantity: od.quantity ?? 0,
            unitPrice: od.unitPrice ?? 0,
            availableQuantity: avForProofing,
            queueItemId: qId || undefined,
            readyDesignId: rDesignId,
            availableForProofing: avForProofing,
            orderId: od.orderId?.toString() || "",
            processClassificationOptionName:
              design.processClassification || undefined,
            sidesClassification: design.sidesClassification || undefined,
            laminationType: design.laminationType || undefined,
            thumbnailUrl: (design as any).designThumbnailUrl || design.designImageUrl || "",
            largeImageUrl: design.designImageUrl || "",
            createdAt: od.createdAt || design.createdAt || "",
            designId: od.designId || design?.id, // Store designId for fallback fetching if needed
             isUrgent: (od as any).isUrgent ?? (od as any).readyDesign?.isUrgent ?? (design as any).isUrgent ?? false,
            orderCode: od.orderCode || undefined,
            customerName:
              (design as any).customer?.name ||
              (design as any).customerName ||
              (od as any).customerName ||
              (od as any).order?.customerName ||
              (od as any).order?.customer?.name ||
              undefined,
            customerCompanyName:
              (design as any).customer?.companyName ||
              (design as any).customerCompanyName ||
              (od as any).customerCompanyName ||
              (od as any).order?.customerCompanyName ||
              (od as any).order?.customer?.companyName ||
              undefined,
            basisWeight: design.basisWeight ?? undefined,
            designerName: design.designer?.fullName || design.designer?.username || undefined,
            createdBy: (od as any).createdBy?.fullName || (od as any).createdBy?.username || undefined,
            proofingAllocations: od.proofingAllocations || undefined,
            specification: (() => {
              const rawSpec =
                (od as any).specification ||
                (design as any).specification ||
                (od as any).specifications ||
                (design as any).specifications;

              if (Array.isArray(rawSpec)) {
                return rawSpec.filter((s) => typeof s === "string" && s.trim());
              }

              if (typeof rawSpec === "string" && rawSpec.trim()) {
                // Check if it's a JSON array string
                if (rawSpec.trim().startsWith("[") && rawSpec.trim().endsWith("]")) {
                  try {
                    const parsed = JSON.parse(rawSpec);
                    if (Array.isArray(parsed)) {
                      return parsed.filter((s) => typeof s === "string" && s.trim());
                    }
                  } catch (e) {
                    // Not valid JSON, treat as single string
                  }
                }
                return [rawSpec.trim()];
              }

              return [];
            })(),
          };

          return designItem;
        });

      // 3. Perform 2-pass mapping to auto-fill missing customer name by matching customer code prefix (e.g. YV from 0428YV-N002)
      const getCustomerCode = (code: string): string => {
        const match = code.trim().match(/^\d{4}([A-Z]+)-/);
        return match ? match[1] : "";
      };

      const customerCodeMap = new Map<string, { name?: string; companyName?: string }>();
      
      // Pre-populate with known common codes in database as a safety net
      customerCodeMap.set("YV", { companyName: "CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI YAMATO VN" });
      customerCodeMap.set("VG", { companyName: "VITA GREEN" });
      customerCodeMap.set("GW", { companyName: "CÔNG TY TNHH SÀI GÒN YAMATO VN" });
      customerCodeMap.set("PN", { companyName: "VƯỢNG PHÁT NÔNG" });

      // Pass 1: Collect customer names for populated prefixes from other items in list
      designs.forEach((d) => {
        if (d.code && (d.customerName || d.customerCompanyName)) {
          const codePrefix = getCustomerCode(d.code);
          if (codePrefix && !customerCodeMap.has(codePrefix)) {
            customerCodeMap.set(codePrefix, {
              name: d.customerName,
              companyName: d.customerCompanyName,
            });
          }
        }
      });

      // Pass 2: Fallback fill for missing customer names
      designs = designs.map((d) => {
        if (d.code && !d.customerName && !d.customerCompanyName) {
          const codePrefix = getCustomerCode(d.code);
          const mappedCustomer = customerCodeMap.get(codePrefix);
          if (mappedCustomer) {
            return {
              ...d,
              customerName: mappedCustomer.name,
              customerCompanyName: mappedCustomer.companyName,
            };
          }
        }
        return d;
      });

      // Client-side filter
      if (needClientFiltering) {
        if (reqDesignTypeId === 999001) {
          designs = designs.filter((d) => d.designTypeId === 999001);
        } else if (reqDesignTypeId === 999002) {
          designs = designs.filter((d) => d.designTypeId === 999002);
        } else if (reqDesignTypeId === nhanGiayId) {
          designs = designs.filter((d) => d.designTypeId === nhanGiayId);
        } else if (reqDesignTypeId === tuiId) {
          designs = designs.filter((d) => d.designTypeId === tuiId);
        }
      }

      // Calculate totals for response based on filtered array
      const totalCount = designs.length;
      const requestedPage = params?.pageNumber ?? 1;
      const requestedPageSize = params?.pageSize ?? 10;
      const totalPages = Math.max(1, Math.ceil(totalCount / requestedPageSize));

      // Paginate client-side if we fetched large pageSize
      if (needClientFiltering) {
        const start = (requestedPage - 1) * requestedPageSize;
        const end = start + requestedPageSize;
        designs = designs.slice(start, end);
      }

      // Extract unique design types with counts (for types summary when params has no type filter)
      const designTypeMap = new Map<
        number,
        { id: number; name: string; count: number }
      >();
      designs.forEach((d) => {
        const existing = designTypeMap.get(d.designTypeId);
        if (existing) {
          existing.count++;
        } else {
          designTypeMap.set(d.designTypeId, {
            id: d.designTypeId,
            name: d.designTypeName,
            count: 1,
          });
        }
      });

      // Extract unique material types with counts
      const materialTypeMap = new Map<
        number,
        { id: number; name: string; count: number }
      >();
      designs.forEach((d) => {
        const existing = materialTypeMap.get(d.materialTypeId);
        if (existing) {
          existing.count++;
        } else {
          materialTypeMap.set(d.materialTypeId, {
            id: d.materialTypeId,
            name: d.materialTypeName,
            count: 1,
          });
        }
      });

      return {
        // Pagination meta
        size: requestedPageSize,
        page: requestedPage,
        total: totalCount,
        totalPages,
        designs,
        designTypeOptions: Array.from(designTypeMap.values()),
        materialTypeOptions: Array.from(materialTypeMap.values()),
        // Keep old field name for backward compatibility
        totalCount,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

// GET /proofing-orders/available-order-details/design-type-summary
export const useProofingAvailableOrderDetailsDesignTypeSummary = (
  enabled: boolean = true,
) => {
  return useQuery<DesignTypeCountResponse[]>({
    queryKey: [
      proofingKeys.all[0],
      "available-order-details",
      "design-type-summary",
    ],
    enabled,
    queryFn: async () => {
      // 1. Fetch design types to resolve IDs
      const designTypesRes = await apiRequest.get<any>(API_SUFFIX.DESIGN_TYPES);
      const designTypes = Array.isArray(designTypesRes.data)
        ? designTypesRes.data
        : (designTypesRes.data.items ?? []);

      // 2. Fetch all available designs
      const res = await apiRequest.get<OrderDetailResponsePaginate>(
        API_SUFFIX.PROOFING_AVAILABLE_ORDER_DETAILS,
        { params: { pageNumber: 1, pageSize: 1000 } }
      );
      const orderDetails = res.data.items ?? [];

      const counts: Record<number, number> = {};

      // Initialize count for all design types
      designTypes.forEach((dt: any) => {
        counts[dt.id] = 0;
      });
      counts[999001] = 0; // Nhãn Metaline
      counts[999002] = 0; // Túi Metaline

      orderDetails.forEach((od) => {
        const design = od.design;
        if (!design) return;

        let designTypeId = design.designTypeId;
        const designTypeName = design.designType?.name || "";
        const materialTypeName = design.materialType?.name || "";

        const lowerDesignName = designTypeName.toLowerCase();
        const lowerMaterialName = materialTypeName.toLowerCase();
        const isMetaline = lowerMaterialName.includes("metaline") || lowerMaterialName.includes("metalize");

        if (isMetaline) {
          if (lowerDesignName.includes("nhãn") || lowerDesignName.includes("nhan")) {
            designTypeId = 999001;
          } else if (lowerDesignName.includes("túi") || lowerDesignName.includes("tui")) {
            designTypeId = 999002;
          }
        }

        if (designTypeId != null) {
          counts[designTypeId] = (counts[designTypeId] || 0) + 1;
        }
      });

      return Object.entries(counts).map(([id, count]) => ({
        designTypeId: parseInt(id, 10),
        count,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export { proofingCrudApi, proofingKeys };

// ================== PROOFING BY ORDER ==================
// GET /proofing-orders/by-order/{orderId}
export const useProofingOrdersByOrder = (
  orderId: number | null,
  enabled = true,
) => {
  return useQuery<ProofingOrderResponse[]>({
    queryKey: [proofingKeys.all[0], "by-order", orderId],
    enabled: enabled && !!orderId,
    queryFn: async () => {
      const res = await apiRequest.get<
        ProofingOrderResponsePaginate | ProofingOrderResponse[]
      >(API_SUFFIX.PROOFING_BY_ORDER(orderId as number));

      // Handle both paginated response and array response
      if (Array.isArray(res.data)) {
        return res.data;
      }

      // If paginated response, extract items
      return res.data.items ?? [];
    },
  });
};

// ================== PROOFING FOR PRODUCTION ==================
// GET /proofing-orders/for-production

export const useProofingOrdersForProduction = (
  params?: ProofingOrderForProductionListParams,
) => {
  return useQuery<ProofingOrderResponsePaginate>({
    queryKey: [proofingKeys.all[0], "for-production", params],
    queryFn: async () => {
      const res = await apiRequest.get<ProofingOrderResponsePaginate>(
        API_SUFFIX.PROOFING_FOR_PRODUCTION,
        { params },
      );
      return res.data;
    },
  });
};

// ================== UPLOAD / DOWNLOAD FILE ==================
// POST /proofing-orders/{id}/upload-file
// GET  /proofing-orders/{id}/download-file

export const useUploadProofingFile = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("proofingFile", file);

    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPLOAD_FILE(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; file: File }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã tải lên file bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải lên file bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useUploadProofingImage = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("imageFile", file);

    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPLOAD_IMAGE(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; file: File }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã upload ảnh bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể upload ảnh bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useUploadProofingImages = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; files: File[] }]
  >(async ({ proofingOrderId, files }) => {
    const form = new FormData();
    files.forEach((file) => {
      form.append("files", file);
    });

    const res = await apiRequest.post<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPLOAD_IMAGES(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; files: File[] }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: `Đã tải lên ${args.files.length} ảnh bình bài`,
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải lên ảnh bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const useDeleteProofingImage = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; imageId: number }]
  >(async ({ proofingOrderId, imageId }) => {
    const res = await apiRequest.delete<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_DELETE_IMAGE(proofingOrderId, imageId),
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; imageId: number }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã xóa ảnh bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xóa ảnh bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// PUT /proofing-orders/{id}/update-file
export const useUpdateProofingFile = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("proofingFile", file);

    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPDATE_FILE(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; file: File }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã cập nhật file bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật file bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// PUT /proofing-orders/{id}/update-image
export const useUpdateProofingImage = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ proofingOrderId: number; file: File }]
  >(async ({ proofingOrderId, file }) => {
    const form = new FormData();
    form.append("imageFile", file);

    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_UPDATE_IMAGE(proofingOrderId),
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  });

  const mutate = async (args: { proofingOrderId: number; file: File }) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã cập nhật ảnh bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật ảnh bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

const getCachedProofingOrder = (queryClient: any, id: number) => {
  let order = queryClient.getQueryData(["proofing-orders", "detail", id]) as any;
  if (!order) {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ["proofing-orders"] });
    for (const query of queries) {
      const data = query.state.data as any;
      if (data?.items && Array.isArray(data.items)) {
        const found = data.items.find((item: any) => item.id === id);
        if (found) {
          order = found;
          break;
        }
      } else if (Array.isArray(data)) {
        const found = data.find((item: any) => item.id === id);
        if (found) {
          order = found;
          break;
        }
      }
    }
  }
  return order;
};

export const useDownloadProofingFile = () => {
  const queryClient = useQueryClient();
  const { loading, error, execute, reset } = useAsyncCallback<
    void,
    [{ proofingOrderId: number; filename?: string }]
  >(async ({ proofingOrderId, filename }) => {
    const res = await apiRequest.get<ArrayBuffer>(
      API_SUFFIX.PROOFING_DOWNLOAD_FILE(proofingOrderId),
      { responseType: "arraybuffer" },
    );

    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const order = getCachedProofingOrder(queryClient, proofingOrderId);
    const code = order?.code || `BB${String(proofingOrderId).padStart(5, '0')}`;
    const customer = order?.customerName || order?.order?.customerName || "Khách hàng";
    const date = formatDateForFilename(order?.createdAt || new Date());

    link.download = filename || buildFilename(["Bản bình bài", code, customer, date], "pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });

  const mutate = async (args: {
    proofingOrderId: number;
    filename?: string;
  }) => {
    try {
      await execute(args);
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải file bình bài",
      });
      throw err;
    }
  };

  return { loading, error, mutate, reset };
};
// ================== COMPLETE PROOFING ORDER ==================
// PUT /proofing-orders/{id}/complete

export const useCompleteProofingOrder = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [number]
  >(async (id: number) => {
    const res = await apiRequest.put<ProofingOrderResponse>(
      API_SUFFIX.PROOFING_COMPLETE(id),
    );
    return res.data;
  });

  const mutate = async (id: number) => {
    try {
      const result = await execute(id);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã hoàn tất bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn tất bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

// ================== PAUSE PROOFING ORDER ==================
// PUT /proofing-orders/{id}/pause
// Note: API accepts optional query parameter "reason"

export const usePauseProofingOrder = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    ProofingOrderResponse,
    [{ id: number } & ProofingOrdersPauseParams]
  >(async ({ id, ...params }) => {
    const url = params.reason
      ? `${API_SUFFIX.PROOFING_PAUSE(id)}?reason=${encodeURIComponent(params.reason)}`
      : API_SUFFIX.PROOFING_PAUSE(id);
    const res = await apiRequest.put<ProofingOrderResponse>(url);
    return res.data;
  });

  const mutate = async (args: { id: number } & ProofingOrdersPauseParams) => {
    try {
      const result = await execute(args);

      if (result.id != null) {
        queryClient.invalidateQueries({
          queryKey: proofingKeys.detail(result.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });

      toast.success("Thành công", {
        description: "Đã tạm dừng bình bài",
      });

      return result;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạm dừng bình bài",
      });
      throw err;
    }
  };

  return { data, loading, error, mutate, reset };
};

export const usePaperSizes = () => {
  return useQuery({
    queryKey: ["paper-sizes"],
    queryFn: async () => {
      const response = await apiRequest.get(API_SUFFIX.PAPER_SIZES, {
        params: { pageSize: 1000 }
      });
      const paginated = PaperSizeResponseIPaginateSchema.parse(response.data);
      // Return items array, or empty array if items is null/undefined
      return paginated.items || [];
    },
  });
};

export const useCreatePaperSize = () => {
  const queryClient = useQueryClient();
  const { data, loading, error, execute, reset } = useAsyncCallback<
    PaperSizeResponse,
    [CreatePaperSizeRequest]
  >(async (payload) => {
    const res = await apiRequest.post<PaperSizeResponse>(
      API_SUFFIX.PAPER_SIZES,
      payload,
    );
    return PaperSizeResponseSchema.parse(res.data);
  });

  const mutate = async (payload: CreatePaperSizeRequest) => {
    try {
      const newPaperSize = await execute(payload);
      // Invalidate and refetch paper sizes list
      await queryClient.invalidateQueries({ queryKey: ["paper-sizes"] });
      toast.success("Thành công", {
        description: "Đã tạo khổ giấy mới thành công",
      });
      return newPaperSize;
    } catch (err: unknown) {
      const error = err as ApiError;
      toast.error("Lỗi", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo khổ giấy mới",
      });
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

export const useRecordPlateExport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      request,
    }: {
      id: number;
      request: RecordPlateExportRequest;
    }) => {
      const response = await apiRequest.post(
        API_SUFFIX.PROOFING_RECORD_PLATE(id),
        request,
      );

      // Sử dụng safeParse để tránh throw error khi validation fail
      // Nếu API trả về 200, coi như thành công dù schema validation có thể fail
      const parseResult = ProofingOrderResponseSchema.safeParse(response.data);
      if (parseResult.success) {
        return parseResult.data;
      } else {
        // Log warning nhưng vẫn return response.data vì API đã trả về 200
        console.warn(
          "Schema validation failed for plate export response:",
          parseResult.error,
        );
        return response.data as ProofingOrderResponse;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      toast.success("Ghi nhận xuất kẽm thành công", {
        description: "Thông tin xuất kẽm đã được lưu lại.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Ghi nhận xuất kẽm thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== Update Plate Export =====
// PUT /api/plate-exports/:id
export const useUpdatePlateExport = () => {
  const queryClient = useQueryClient();

  const { data, loading, error, execute, reset } = useAsyncCallback<
    PlateExportResponse,
    [{ id: number; request: UpdatePlateExportRequest }]
  >(async ({ id, request }) => {
    const res = await apiRequest.put<PlateExportResponse>(
      API_SUFFIX.PLATE_EXPORT_UPDATE(id),
      request,
    );
    return res.data;
  });

  const mutate = async (id: number, request: UpdatePlateExportRequest) => {
    try {
      const result = await execute({ id, request });

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["proofing-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["plate-exports"],
      });

      toast.success("Thành công", {
        description: "Đã cập nhật thông tin xuất kẽm",
      });

      return result;
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật thông tin xuất kẽm";

      toast.error("Lỗi", {
        description: message,
      });

      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
};

// Record die export - API expects: dieIds (array), notes
export const useRecordDieExportWithFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dieIds,
      notes,
    }: {
      id: number;
      dieIds: number[];
      notes?: string | null;
    }) => {
      // Build request payload according to RecordDieExportRequest schema
      const requestPayload: RecordDieExportRequest = {
        dieIds,
        notes: notes || undefined,
      };

      // Validate request payload against schema
      const validationResult =
        RecordDieExportRequestSchema.safeParse(requestPayload);
      if (!validationResult.success) {
        throw new Error(
          `Invalid request payload: ${validationResult.error.message}`,
        );
      }

      const response = await apiRequest.post(
        API_SUFFIX.PROOFING_RECORD_DIE(id),
        validationResult.data,
      );

      // Validate response against schema
      const parseResult = ProofingOrderResponseSchema.safeParse(response.data);
      if (parseResult.success) {
        return parseResult.data;
      } else {
        // Log warning nhưng vẫn return response.data vì API đã trả về 200
        console.warn(
          "Schema validation failed for die export response:",
          parseResult.error,
        );
        return response.data as ProofingOrderResponse;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      toast.success("Ghi nhận khuôn bế thành công", {
        description: "Thông tin khuôn bế đã được lưu lại.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Ghi nhận khuôn bế thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};
export const useHandToProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest.put(
        API_SUFFIX.PROOFING_HAND_TO_PRODUCTION(id),
      );

      // Sử dụng safeParse để tránh throw error khi validation fail
      const parseResult = ProofingOrderResponseSchema.safeParse(response.data);
      if (parseResult.success) {
        return parseResult.data;
      } else {
        // Log warning nhưng vẫn return response.data vì API đã trả về 200
        console.warn(
          "Schema validation failed for hand to production response:",
          parseResult.error,
        );
        return response.data as ProofingOrderResponse;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proofing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["proofing-order", id] });
      toast.success("Bàn giao sản xuất thành công", {
        description: "mã bài đã được chuyển sang bộ phận sản xuất.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Bàn giao sản xuất thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ===== GET /proofing-orders/available-quantity/{designId} =====
// Lấy số lượng khả dụng của design cho bình bài

export const useAvailableQuantity = (
  designId: number | null,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [proofingKeys.all[0], "available-quantity", designId],
    enabled: enabled && !!designId,
    queryFn: async () => {
      const res = await apiRequest.get<unknown>(
        API_SUFFIX.PROOFING_AVAILABLE_QUANTITY(designId as number),
      );
      // API response could be a number or an object with quantity field
      // Log for debugging
      console.log(
        "Available quantity API response:",
        res.data,
        typeof res.data,
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ===== PATCH /proofing-orders/designs/{designId}/available-quantity =====
export const useUpdateAvailableQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      designId,
      newAvailableQuantity,
    }: {
      designId: number;
      newAvailableQuantity: number;
    }) => {
      const response = await apiRequest.patch<any>(
        API_SUFFIX.PROOFING_UPDATE_AVAILABLE_QUANTITY(designId),
        { newAvailableQuantity },
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({
        queryKey: [proofingKeys.all[0], "available-order-details"],
      });
      queryClient.invalidateQueries({
        queryKey: [proofingKeys.all[0], "available-quantity"],
      });
      queryClient.invalidateQueries({
        queryKey: proofingKeys.all,
      });

      toast.success("Thành công", {
        description: data.message || "Đã cập nhật số lượng có thể bình bài",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Lỗi", {
        description:
          error.response?.data?.message ||
          error.message ||
          "Không thể cập nhật số lượng có thể bình bài",
      });
    },
  });
};

// ================== ADD/REMOVE DESIGNS ==================
// POST /proofing-orders/{id}/designs
export const useAddDesignsToProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      request,
    }: {
      id: number;
      request: AddDesignsToProofingOrderRequest;
      suppressToast?: boolean;
    }) => {
      const response = await apiRequest.post<ProofingOrderResponse>(
        API_SUFFIX.PROOFING_ADD_DESIGNS(id),
        request,
      );

      const parseResult = ProofingOrderResponseSchema.safeParse(response.data);
      if (parseResult.success) {
        return parseResult.data;
      } else {
        console.warn(
          "Schema validation failed for add designs response:",
          parseResult.error,
        );
        return response.data as ProofingOrderResponse;
      }
    },
    onSuccess: (_, { id, request, suppressToast }) => {
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      // Invalidate available-order-details query to refresh the list
      queryClient.invalidateQueries({
        queryKey: [
          proofingKeys.all[0],
          "available-order-details",
          request.materialTypeId ?? null,
        ],
      });
      if (!suppressToast) {
        toast.success("Thành công", {
          description: "Đã Thêm thiết kế vào Bình Bài",
        });
      }
    },
    onError: (error: ApiError) => {
      // Specific handling for HTTP 409 Conflict – another operator allocated the design
      if (error.response?.status === 409) {
        toast.error("Lỗi", {
          description: "Thiết kế vừa được phân bổ bởi người dùng khác. Vui lòng tải lại dữ liệu.",
        });
        // Refresh queries to get latest data
        queryClient.invalidateQueries({ queryKey: proofingKeys.all });
        queryClient.invalidateQueries({
          queryKey: [proofingKeys.all[0], "available-order-details", null],
        });
      } else {
        toast.error("Lỗi", {
          description:
            error.response?.data?.message ||
            error.message ||
            "Không thể thêm design",
        });
      }
    },
  });
};

// DELETE /proofing-orders/{id}/designs/{designId}
export const useRemoveDesignFromProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proofingOrderId,
      proofingOrderDesignId,
    }: {
      proofingOrderId: number;
      proofingOrderDesignId: number;
    }) => {
      const response = await apiRequest.delete<ProofingOrderResponse>(
        API_SUFFIX.PROOFING_REMOVE_DESIGN(
          proofingOrderId,
          proofingOrderDesignId,
        ),
      );

      // If backend returns 204 No Content, order was deleted
      if (response.status === 204) {
        return null;
      }

      const parseResult = ProofingOrderResponseSchema.safeParse(response.data);
      if (parseResult.success) {
        return parseResult.data;
      } else {
        console.warn(
          "Schema validation failed for remove design response:",
          parseResult.error,
        );
        return response.data as ProofingOrderResponse;
      }
    },
    onSuccess: (_, { proofingOrderId }) => {
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({
        queryKey: proofingKeys.detail(proofingOrderId),
      });
      toast.success("Thành công", {
        description: "Đã xóa design khỏi bình bài",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Lỗi", {
        description:
          error.response?.data?.message ||
          error.message ||
          "Không thể xóa design",
      });
    },
  });
};

// POST /api/proofing-orders/designs/reject
export const useRejectDesignFromProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      designId,
      reason,
    }: {
      designId: number;
      reason?: string | null;
    }) => {
      await apiRequest.post<void>(API_SUFFIX.PROOFING_REJECT_DESIGN, {
        designId,
        reason: reason ?? null,
      } as RejectDesignRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({
        queryKey: [proofingKeys.all[0], "available-order-details"],
      });
      toast.success("Đã từ chối thiết kế", {
        description:
          "Thiết kế quay về hàng chờ sẵn sàng. Nếu muốn xóa khỏi đơn hàng, vui lòng thao tác tại trang chi tiết đơn.",
      });
    },
    onError: (error: ApiError) => {
      toast.error("Lỗi", {
        description:
          error.response?.data?.message ||
          error.message ||
          "Không thể từ chối thiết kế",
      });
    },
  });
};

// ================== CANCEL PROOFING ORDER ==================
// PUT /proofing-orders/{id}/cancel
export const useCancelProofingOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest.put<ProofingOrderResponse>(
        API_SUFFIX.PROOFING_CANCEL(id),
        { reason },
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      toast.success("Hủy hình bài thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Hủy hình bài thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};

// ================== GET AVAILABLE BINS ==================
// GET /proofing-orders/available-bins
export const useAvailableBins = (designTypeId?: number | null, enabled: boolean = true) => {
  return useQuery<AvailableBinResponse[]>({
    queryKey: [proofingKeys.all[0], "available-bins", designTypeId],
    enabled,
    queryFn: async () => {
      const res = await apiRequest.get<AvailableBinResponse[]>(
        API_SUFFIX.PROOFING_AVAILABLE_BINS,
        {
          params: { designTypeId: designTypeId ?? undefined }
        }
      );
      return res.data;
    },
  });
};

// ================== GET COMPLETED PROOFING ORDERS ==================
// GET /proofing-orders/completed
export const useCompletedProofingOrders = (params?: CompletedProofingOrderListParams) => {
  return useQuery({
    queryKey: [proofingKeys.all[0], "completed-proofing-orders", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(params ?? {});
      const res = await apiRequest.get<ProofingOrderResponsePaginate>(
        API_SUFFIX.PROOFING_COMPLETED_LIST,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

// ================== UPDATE PROOFING ORDER SCHEDULE STATUS ==================
// PUT /proofing-orders/{id}/schedule-status
export const useUpdateProofingOrderScheduleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      scheduleStatus,
    }: {
      id: number;
      scheduleStatus: string;
    }) => {
      const res = await apiRequest.put<ProofingOrderResponse>(
        API_SUFFIX.PROOFING_UPDATE_SCHEDULE_STATUS(id),
        { scheduleStatus }
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proofingKeys.all });
      queryClient.invalidateQueries({ queryKey: proofingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [proofingKeys.all[0], "completed-proofing-orders"] });
      toast.success("Cập nhật trạng thái điều lệnh thành công");
    },
    onError: (error: ApiError) => {
      toast.error("Cập nhật trạng thái thất bại", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};
