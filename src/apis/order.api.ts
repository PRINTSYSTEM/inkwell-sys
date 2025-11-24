import { api } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreateOrderRequest,
  Order,
  OrderListResponse,
  OrderQueryParams,
  UpdateOrderRequest,
} from "@/Schema";

// Order API Functions
export const getOrders = async (
  params?: OrderQueryParams
): Promise<OrderListResponse> => {
  return api.paginated<Order>(API_SUFFIX.ORDERS, params);
};

export const getOrderById = async (id: number): Promise<Order> => {
  return api.get<Order>(`${API_SUFFIX.ORDERS}/${id}`);
};

export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  return api.post<Order>(API_SUFFIX.ORDERS, data);
};

export const updateOrder = async (
  id: number,
  data: UpdateOrderRequest
): Promise<Order> => {
  return api.put<Order>(`${API_SUFFIX.ORDERS}/${id}`, data);
};

export const deleteOrder = async (id: number): Promise<void> => {
  return api.delete<void>(`${API_SUFFIX.ORDERS}/${id}`);
};

// Order Statistics
export const getOrderStats = async (): Promise<{
  totalOrders: number;
  inProduction: number;
  completed: number;
  totalValue: number;
}> => {
  return api.get(API_SUFFIX.ORDERS_STATS);
};

// Order Export
export const exportOrders = async (params?: {
  customerId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ fileUrl: string }> => {
  return api.get<{ fileUrl: string }>(API_SUFFIX.ORDERS_EXPORT, params);
};

// Upload Excel File
export const uploadOrderExcel = async (
  orderId: number,
  file: File
): Promise<{ fileUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  return api.upload<{ fileUrl: string }>(
    API_SUFFIX.ORDER_UPLOAD_EXCEL(orderId),
    formData
  );
};
