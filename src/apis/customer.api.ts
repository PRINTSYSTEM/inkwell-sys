// Chỉ giữ lại các interface dùng cho API
import type {
  Customer,
  CustomerListItem,
  CustomerListResponse
} from '@/Schema/customer.schema';
export interface CreateCustomerRequest {
  name: string;
  companyName: string;
  representativeName: string;
  phone: string;
  address: string;
  taxCode: string;
  type: string;
  currentDebt: number;
  maxDebt: number;
}
import { api } from '@/lib/http';
import { API_SUFFIX } from './util.api';

// ...existing code...

// Customer API Functions
export const getCustomers = async (params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}): Promise<CustomerListResponse> => {
  return api.paginated<CustomerListItem>(API_SUFFIX.CUSTOMERS, params);
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  return api.get<Customer>(API_SUFFIX.CUSTOMER_BY_ID(id));
};

export const createCustomer = async (data: CreateCustomerRequest): Promise<Customer> => {
  return api.post<Customer>(API_SUFFIX.CUSTOMERS, data);
};

export const updateCustomer = async (id: number, data: Partial<CreateCustomerRequest>): Promise<Customer> => {
  return api.put<Customer>(API_SUFFIX.CUSTOMER_BY_ID(id), data);
};

export const deleteCustomer = async (id: number): Promise<void> => {
  return api.delete<void>(API_SUFFIX.CUSTOMER_BY_ID(id));
};