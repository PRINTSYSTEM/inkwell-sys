import { BaseService, ServiceError } from './BaseService';
import { ApiResponse, QueryParams, ServiceOptions } from './types';
import {
  Customer,
  CustomerListItem,
  CustomerListResponse,
  CustomerRequest,
  CustomerSearchParams,
  validateCustomer,
  validateCustomerListResponse,
  validateCustomerRequest,
  validateCustomerSearchParams,
  canCreateOrderForCustomer,
  isDebtStatusCritical,
  calculateDebtRatio
} from '../Schema/customer.schema';

export class CustomerService extends BaseService {
  constructor() {
    super('customers'); // Will use /api/customers endpoints
  }

  /**
   * Get all customers with pagination and filtering
   */
  async getCustomers(
    params: CustomerSearchParams = {},
    options: ServiceOptions = {}
  ): Promise<ApiResponse<CustomerListResponse>> {
    try {
      // Validate and prepare search parameters
      const searchParams = validateCustomerSearchParams(params);
      
      const response = await this.request<CustomerListResponse>({
        method: 'GET',
        url: '/customers',
        params: searchParams
      }, options);

      if (response.success && response.data) {
        // API returns CustomerListResponse with items array
        const data = response.data;
        
        // Convert CustomerListItem to include missing fields for UI compatibility
        const enhancedItems = (data.items || []).map(item => ({
          ...item,
          // Add missing fields with defaults for UI compatibility
          representativeName: item.name, // Use name as representative name if not provided
          phone: '', // Will be populated from full customer data if needed
          taxCode: undefined,
          address: '',
          createdAt: new Date().toISOString(),
          createdBy: 'Unknown',
          folder: item.code
        }));

        return {
          success: true,
          data: {
            items: enhancedItems,
            totalCount: data.totalCount || 0,
            pageNumber: data.pageNumber || 1,
            pageSize: data.pageSize || 10,
            totalPages: data.totalPages || 1,
            hasPreviousPage: data.hasPreviousPage || false,
            hasNextPage: data.hasNextPage || false
          },
          message: `Retrieved ${data.totalCount || 0} customers`
        };
      }

      throw new ServiceError('Failed to retrieve customers', {
        code: 'FETCH_FAILED',
        status: 500
      });
    } catch (error) {
      console.error('CustomerService.getCustomers error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: number, options: ServiceOptions = {}): Promise<ApiResponse<Customer>> {
    try {
      if (!id || id <= 0) {
        throw new ServiceError('Invalid customer ID', {
          code: 'INVALID_ID',
          status: 400
        });
      }

      const response = await this.request<Customer>({
        method: 'GET',
        url: `/customers/${id}`
      }, options);

      if (response.success && response.data) {
        // Validate response structure
        const validatedData = validateCustomer(response.data);
        
        return {
          success: true,
          data: validatedData,
          message: 'Customer retrieved successfully'
        };
      }

      throw new ServiceError('Customer not found', {
        code: 'NOT_FOUND',
        status: 404
      });
    } catch (error) {
      console.error(`CustomerService.getCustomerById(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(
    customerData: CustomerRequest,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<Customer>> {
    try {
      // Validate input data
      const validatedData = validateCustomerRequest(customerData);
      
      // Business validation
      this.validateBusinessRules(validatedData);

      const response = await this.request<Customer>({
        method: 'POST',
        url: '/customers',
        data: validatedData
      }, { ...options, skipCache: true });

      if (response.success && response.data) {
        const validatedResponse = validateCustomer(response.data);
        
        // Clear cache to ensure fresh data on next fetch
        this.clearCache();
        
        return {
          success: true,
          data: validatedResponse,
          message: 'Customer created successfully'
        };
      }

      throw new ServiceError('Failed to create customer', {
        code: 'CREATE_FAILED',
        status: 500
      });
    } catch (error) {
      console.error('CustomerService.createCustomer error:', error);
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(
    id: number,
    customerData: Partial<CustomerRequest>,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<Customer>> {
    try {
      if (!id || id <= 0) {
        throw new ServiceError('Invalid customer ID', {
          code: 'INVALID_ID',
          status: 400
        });
      }

      const response = await this.request<Customer>({
        method: 'PUT',
        url: `/customers/${id}`,
        data: customerData
      }, { ...options, skipCache: true });

      if (response.success && response.data) {
        const validatedResponse = validateCustomer(response.data);
        
        // Clear cache to ensure fresh data
        this.clearCache();
        
        return {
          success: true,
          data: validatedResponse,
          message: 'Customer updated successfully'
        };
      }

      throw new ServiceError('Failed to update customer', {
        code: 'UPDATE_FAILED',
        status: 500
      });
    } catch (error) {
      console.error(`CustomerService.updateCustomer(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Delete customer (if supported by API)
   */
  async deleteCustomer(id: number, options: ServiceOptions = {}): Promise<ApiResponse<void>> {
    try {
      if (!id || id <= 0) {
        throw new ServiceError('Invalid customer ID', {
          code: 'INVALID_ID',
          status: 400
        });
      }

      const response = await this.request<void>({
        method: 'DELETE',
        url: `/customers/${id}`
      }, { ...options, skipCache: true });

      if (response.success) {
        // Clear cache to ensure fresh data
        this.clearCache();
        
        return {
          success: true,
          data: undefined,
          message: 'Customer deleted successfully'
        };
      }

      throw new ServiceError('Failed to delete customer', {
        code: 'DELETE_FAILED',
        status: 500
      });
    } catch (error) {
      console.error(`CustomerService.deleteCustomer(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Search customers by text
   */
  async searchCustomers(
    searchText: string,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<CustomerListResponse>> {
    return this.getCustomers({ search: searchText }, options);
  }

  /**
   * Filter customers by debt status
   */
  async getCustomersByDebtStatus(
    debtStatus: string,
    options: ServiceOptions = {}
  ): Promise<ApiResponse<CustomerListResponse>> {
    return this.getCustomers({ debtStatus }, options);
  }

  /**
   * Get customers with critical debt status
   */
  async getCriticalDebtCustomers(
    options: ServiceOptions = {}
  ): Promise<ApiResponse<CustomerListItem[]>> {
    try {
      const response = await this.getCustomers({ 
        debtStatus: 'blocked,overdue' // Assuming API supports multiple statuses
      }, options);

      if (response.success && response.data) {
        // Filter customers with critical debt status
        const criticalCustomers = response.data.items?.filter(customer => 
          isDebtStatusCritical(customer.debtStatus)
        ) || [];

        return {
          success: true,
          data: criticalCustomers,
          message: `Found ${criticalCustomers.length} customers with critical debt status`
        };
      }

      return {
        success: false,
        data: [],
        message: 'Failed to retrieve customers'
      };
    } catch (error) {
      console.error('CustomerService.getCriticalDebtCustomers error:', error);
      throw error;
    }
  }

  /**
   * Check if customer can create new orders
   */
  async canCustomerCreateOrder(id: number): Promise<ApiResponse<{ canCreate: boolean; reason?: string }>> {
    try {
      const customerResponse = await this.getCustomerById(id);
      
      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          data: { canCreate: false, reason: 'Customer not found' },
          message: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const canCreate = canCreateOrderForCustomer(customer);
      const debtRatio = calculateDebtRatio(customer.currentDebt || 0, customer.maxDebt || 0);

      let reason: string | undefined;
      if (!canCreate) {
        if (isDebtStatusCritical(customer.debtStatus || '')) {
          reason = `Customer has critical debt status: ${customer.debtStatus}`;
        } else if ((customer.currentDebt || 0) > (customer.maxDebt || 0)) {
          reason = `Customer exceeded debt limit: ${customer.currentDebt}/${customer.maxDebt} (${debtRatio.toFixed(1)}%)`;
        }
      }

      return {
        success: true,
        data: { canCreate, reason },
        message: canCreate ? 'Customer can create orders' : 'Customer cannot create orders'
      };
    } catch (error) {
      console.error(`CustomerService.canCustomerCreateOrder(${id}) error:`, error);
      throw error;
    }
  }

  /**
   * Business validation rules
   */
  private validateBusinessRules(customerData: CustomerRequest): void {
    const errors: string[] = [];

    // Validate debt limits
    if ((customerData.currentDebt || 0) > (customerData.maxDebt || 0)) {
      errors.push('Current debt cannot exceed maximum debt limit');
    }

    // Validate tax code format (basic validation)
    if (customerData.taxCode && !/^\d{10}(\d{3})?$/.test(customerData.taxCode)) {
      errors.push('Tax code must be 10 or 13 digits');
    }

    // Validate phone format (basic validation)
    if (customerData.phone && !/^(\+84|84|0)[0-9]{8,9}$/.test(customerData.phone.replace(/\s/g, ''))) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      throw new ServiceError('Validation failed', {
        code: 'VALIDATION_ERROR',
        status: 400,
        errors: { customer: errors }
      });
    }
  }

  /**
   * Get customer statistics (summary data)
   */
  async getCustomerStats(): Promise<ApiResponse<{
    total: number;
    byDebtStatus: Record<string, number>;
    totalDebt: number;
    averageDebt: number;
  }>> {
    try {
      // Fetch customers in pages (schema limits pageSize to <= 100)
      const pageSize = 100;
  let pageNumber = 1;
  const allCustomers: CustomerListItem[] = [];

      while (true) {
        const response = await this.getCustomers({ pageNumber, pageSize });
        if (!response.success || !response.data) {
          throw new ServiceError('Failed to retrieve customer statistics', {
            code: 'STATS_FAILED',
            status: 500
          });
        }

        allCustomers.push(...(response.data.items || []));

        // Stop if no more pages
        if (!response.data.hasNextPage) break;

        pageNumber += 1;
      }

      const totalCount = allCustomers.length;
      const stats = {
        total: totalCount,
        byDebtStatus: {} as Record<string, number>,
        totalDebt: 0,
        averageDebt: 0
      };

      // Calculate statistics
      allCustomers.forEach(customer => {
        const debtStatus = customer.debtStatus || 'unknown';
        stats.byDebtStatus[debtStatus] = (stats.byDebtStatus[debtStatus] || 0) + 1;
        stats.totalDebt += customer.currentDebt || 0;
      });

      stats.averageDebt = stats.total > 0 ? stats.totalDebt / stats.total : 0;

  // (averageDebt already calculated above)

      return {
        success: true,
        data: stats,
        message: 'Customer statistics retrieved successfully'
      };
    } catch (error) {
      console.error('CustomerService.getCustomerStats error:', error);
      throw error;
    }
  }
}

export default CustomerService;