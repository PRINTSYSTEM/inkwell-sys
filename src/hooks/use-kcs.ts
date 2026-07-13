import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX, normalizeParams } from "@/apis/util.api";

export interface KcsProductionOrderResponse {
  productionOrderId: number;
  status: string | null;
  proofingOrderId: number;
  proofingOrderCode: string | null;
  proofingOrderCompletedAt: string | null;
  designTypeId: number | null;
  designTypeName: string | null;
  designTypeCode: string | null;
  proofingOrderImages: {
    id: number;
    imageUrl: string;
    thumbnailUrl: string | null;
    sortOrder: number;
  }[] | null;
  items: {
    productionOrderItemId: number;
    designId: number;
    designCode: string | null;
    designName: string | null;
    designImageUrl: string | null;
    customerId: number | null;
    customerCode: string | null;
    customerName: string | null;
    customerCompanyName: string | null;
    inputQty: number;
    outputQty: number;
    defectQty: number;
    orderDetailId: number | null;
  }[];
}

export interface KcsProductionOrdersPaginate {
  size: number;
  page: number;
  total: number;
  totalPages: number;
  items: KcsProductionOrderResponse[] | null;
}

export interface KcsProductionOrdersParams {
  pageNumber?: number;
  pageSize?: number;
  proofingCompletedFromDate?: string;
  proofingCompletedToDate?: string;
  designTypeId?: number | null;
  search?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface KcsDesignTypeSummaryResponse {
  designTypeId: number;
  designTypeName: string | null;
  designTypeCode: string | null;
  productionOrderCount: number;
  totalItemCount: number;
}

export interface KcsDesignTypeSummaryParams {
  proofingCompletedFromDate?: string;
  proofingCompletedToDate?: string;
}

export interface PrintLabelResponse {
  customerName: string | null;
  customerCode: string | null;
  designCode: string | null;
  designName: string | null;
  quantity: number;
  productionOrderCode: string | null;
  designImageUrl: string | null;
}

// 1. Fetch KCS production orders
export const useKcsProductionOrders = (params: KcsProductionOrdersParams) => {
  return useQuery<KcsProductionOrdersPaginate>({
    queryKey: ["kcs-production-orders", params],
    queryFn: async () => {
      const res = await apiRequest.get<KcsProductionOrdersPaginate>(
        API_SUFFIX.PRODUCTION_ORDERS_KCS,
        {
          params: normalizeParams(params as Record<string, unknown>),
        }
      );
      return res.data;
    },
  });
};

// 2. Fetch KCS design type summary
export const useKcsDesignTypeSummary = (params: KcsDesignTypeSummaryParams) => {
  return useQuery<KcsDesignTypeSummaryResponse[]>({
    queryKey: ["kcs-design-type-summary", params],
    queryFn: async () => {
      const res = await apiRequest.get<KcsDesignTypeSummaryResponse[]>(
        API_SUFFIX.PRODUCTION_ORDERS_KCS_SUMMARY,
        {
          params: normalizeParams(params as Record<string, unknown>),
        }
      );
      return res.data ?? [];
    },
  });
};
