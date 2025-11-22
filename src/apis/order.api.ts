import { api } from '@/lib/http';
import { API_SUFFIX } from './util.api';

// Order API Types
export interface CreateOrderRequest {
  customerId: number;
  assignedToUserId: number;
  deliveryAddress: string;
  totalAmount: number;
  depositAmount: number;
  deliveryDate: string;
  note: string;
  designRequests: {
    designTypeId: number;
    materialTypeId: number;
    assignedDesignerId: number;
    quantity: number;
    dimensions: string;
    requirements: string;
    additionalNotes: string;
  }[];
}

export interface UpdateOrderRequest {
  id: number;
  customerId?: number;
  assignedToUserId?: number;
  deliveryAddress?: string;
  totalAmount?: number;
  depositAmount?: number;
  deliveryDate?: string;
  note?: string;
  status?: string;
}

export interface OrdersResponse {
  items: Order[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Order {
  id: number;
  code: string;
  customerId: number;
  customer: {
    id: number;
    code: string;
    name: string;
    companyName: string;
    debtStatus: string;
    currentDebt: number;
    maxDebt: number;
  };
  createdBy: number;
  creator: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
  };
  assignedTo: number;
  assignedUser: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
  };
  status: string;
  deliveryAddress: string;
  totalAmount: number;
  depositAmount: number;
  deliveryDate: string;
  excelFileUrl: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  designs: Design[];
}

export interface Design {
  id: number;
  code: string;
  orderId: number;
  designStatus: string;
  designerId: number;
  designer: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
  };
  designTypeId: number;
  designType: {
    id: number;
    code: string;
    name: string;
    displayOrder: number;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: number;
      username: string;
      fullName: string;
      role: string;
      email: string;
      phone: string;
    };
  };
  materialTypeId: number;
  materialType: {
    id: number;
    code: string;
    name: string;
    displayOrder: number;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: number;
      username: string;
      fullName: string;
      role: string;
      email: string;
      phone: string;
    };
  };
  quantity: number;
  dimensions: string;
  requirements: string;
  additionalNotes: string;
  designFileUrl: string;
  excelFileUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  timelineEntries: {
    id: number;
    fileUrl: string;
    description: string;
    createdAt: string;
    createdBy: {
      id: number;
      username: string;
      fullName: string;
      role: string;
      email: string;
      phone: string;
    };
  }[];
}

// Order API Functions
export const getOrders = async (params?: {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  status?: string;
}): Promise<OrdersResponse> => {
  return api.paginated<Order>(API_SUFFIX.ORDERS, params);
};

export const getOrderById = async (id: number): Promise<Order> => {
  return api.get<Order>(`${API_SUFFIX.ORDERS}/${id}`);
};

export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  return api.post<Order>(API_SUFFIX.ORDERS, data);
};

export const updateOrder = async (data: UpdateOrderRequest): Promise<Order> => {
  const { id, ...updateData } = data;
  return api.put<Order>(`${API_SUFFIX.ORDERS}/${id}`, updateData);
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
export const uploadOrderExcel = async (orderId: number, file: File): Promise<{ fileUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  return api.upload<{ fileUrl: string }>(API_SUFFIX.ORDER_UPLOAD_EXCEL(orderId), formData);
};