/**
 * Centralized API exports for easy importing
 * Usage: import { api, customerApi, orderApi } from '@/apis'
 */

// Core API utilities
export { api, apiRequest, authUtils } from '@/lib/http';

// API constants
export { API_SUFFIX } from './util.api';

// Individual API modules
export * as customerApi from './customer.api';
export * as orderApi from './order.api';  
export * as designApi from './design.api';
export * as materialTypeApi from './material-type.api';

// Re-export commonly used types for convenience
export type {
  // Customer types
  CustomerListItem,
  CustomersResponse,
  CreateCustomerRequest
} from './customer.api';

export type {
  // Order types  
  Order,
  OrdersResponse,
  CreateOrderRequest,
  UpdateOrderRequest
} from './order.api';

export type {
  // Material & Design Type types
  MaterialType,
  MaterialTypesResponse, 
  CreateMaterialTypeRequest,
  DesignType,
  DesignTypesResponse,
  CreateDesignTypeRequest
} from './material-type.api';

// Usage examples:
/*
// Basic API calls
import { api } from '@/apis';
const users = await api.get<User[]>('/users');
const newUser = await api.post<User>('/users', userData);

// Specific API modules  
import { customerApi, orderApi } from '@/apis';
const customers = await customerApi.getCustomers();
const orders = await orderApi.getOrders({ status: 'pending' });

// Using constants
import { API_SUFFIX } from '@/apis';  
const response = await api.get(API_SUFFIX.CUSTOMERS);
*/