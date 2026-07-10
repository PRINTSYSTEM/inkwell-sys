import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_SUFFIX, normalizeParams } from "@/apis";
import { apiRequest } from "@/lib/http";

export interface OutsourceOrderResponse {
  id?: number;
  proofingOrderId?: number | null;
  proofingOrderCode?: string | null;
  name?: string | null;
  size?: string | null;
  printingVendorId?: number | null;
  printingVendorName?: string | null;
  vendorId?: number | null;
  vendorName?: string | null;
  outsourceCost?: number | null;
  completedAt?: string | null;
  accountingConfirmedAt?: string | null;
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  status?: string | null;
}

export interface OutsourceOrderListParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  vendorId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface OutsourceOrderPaginate {
  size?: number;
  page?: number;
  total?: number;
  totalPages?: number;
  items?: OutsourceOrderResponse[] | null;
}

export type UpdateOutsourceOrderRequest = Partial<Pick<
  OutsourceOrderResponse,
  "name" | "size" | "outsourceCost" | "completedAt" | "accountingConfirmedAt"
>>;

export const outsourceOrderKeys = {
  all: ["outsource-orders"] as const,
  list: (params?: OutsourceOrderListParams) => ["outsource-orders", "list", params] as const,
};

export const useOutsourceOrders = (params?: OutsourceOrderListParams) => {
  const normalizedParams = params
    ? (normalizeParams(params as Record<string, unknown>) as OutsourceOrderListParams)
    : undefined;

  return useQuery({
    queryKey: outsourceOrderKeys.list(normalizedParams),
    queryFn: async () => {
      const response = await apiRequest.get<OutsourceOrderPaginate | OutsourceOrderResponse[]>(
        API_SUFFIX.OUTSOURCE_ORDERS,
        { params: normalizedParams }
      );
      return Array.isArray(response.data) ? { items: response.data } : response.data;
    },
  });
};

export const useUpdateOutsourceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOutsourceOrderRequest }) => {
      const response = await apiRequest.put<OutsourceOrderResponse>(
        API_SUFFIX.OUTSOURCE_ORDER_BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: outsourceOrderKeys.all });
      toast.success("Đã cập nhật chi phí nhà in");
    },
    onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error("Không thể cập nhật chi phí nhà in", {
        description: error.response?.data?.message || error.message,
      });
    },
  });
};
