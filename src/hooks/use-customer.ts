import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/apis/customer.api';
import type {
  Customer,
  CustomerListResponse,
} from '@/Schema/customer.schema';
import type { CreateCustomerRequest } from '@/apis/customer.api';

// Query Keys
const QUERY_KEYS = {
  customers: (params?: { pageNumber?: number; pageSize?: number; search?: string }) => ['customers', params],
  customer: (id: number) => ['customer', id],
} as const;

// useCustomers Hook
export const useCustomers = (params?: {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}) => {
  const finalParams = {
    pageNumber: params?.pageNumber ?? 1,
    pageSize: params?.pageSize ?? 10,
    search: params?.search ?? '',
  } as const;

  return useQuery<CustomerListResponse>({
    queryKey: QUERY_KEYS.customers(finalParams),
    queryFn: () => getCustomers(finalParams),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// useCustomer Hook (single customer)
export const useCustomer = (id: number, enabled = true) => {
  return useQuery<Customer>({
    queryKey: QUERY_KEYS.customer(id),
    queryFn: () => getCustomerById(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// useCreateCustomer Mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: (newCustomer) => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // Optimistically update cache
      queryClient.setQueryData(QUERY_KEYS.customer(newCustomer.id), newCustomer);

      toast({
        title: "Thành công",
        description: `Đã tạo khách hàng ${newCustomer.companyName || newCustomer.representativeName} thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo khách hàng",
        variant: "destructive",
      });
    },
  });
};

// useUpdateCustomer Mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCustomerRequest> }) =>
      updateCustomer(id, data),
    onSuccess: (updatedCustomer) => {
      // Update specific customer in cache
      queryClient.setQueryData(QUERY_KEYS.customer(updatedCustomer.id), updatedCustomer);
      
      // Update customer in customers list cache
      queryClient.setQueriesData(
        { queryKey: ['customers'] },
        (oldData: CustomerListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.map((customer) =>
              customer.id === updatedCustomer.id ? updatedCustomer : customer
            ),
          };
        }
      );

      toast({
        title: "Thành công",
        description: `Đã cập nhật khách hàng thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật khách hàng",
        variant: "destructive",
      });
    },
  });
};

// useDeleteCustomer Mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.customer(deletedId) });
      
      // Update customers list cache
      queryClient.setQueriesData(
        { queryKey: ['customers'] },
        (oldData: CustomerListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((customer) => customer.id !== deletedId),
            totalCount: oldData.totalCount - 1,
          };
        }
      );

      toast({
        title: "Thành công",
        description: "Đã xóa khách hàng thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa khách hàng",
        variant: "destructive",
      });
    },
  });
};