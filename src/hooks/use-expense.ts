// src/hooks/use-expense.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import type {
  ExpenseCategoryResponse,
  ExpenseCategoryResponseIPaginate,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  PaymentMethodResponse,
  PaymentMethodResponseIPaginate,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
} from "@/Schema/accounting.schema";

// ================== EXPENSE CATEGORY ==================

export interface ExpenseCategoriesParams {
  pageNumber?: number;
  pageSize?: number;
  type?: string;
  isActive?: boolean;
  search?: string;
}

export const useExpenseCategories = (params?: ExpenseCategoriesParams) => {
  return useQuery({
    queryKey: ["expense-categories", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<ExpenseCategoryResponseIPaginate>(
        API_SUFFIX.EXPENSE_CATEGORIES,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useExpenseCategory = (
  id: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["expense-category", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<ExpenseCategoryResponse>(
        API_SUFFIX.EXPENSE_CATEGORY_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpenseCategoryRequest) => {
      const res = await apiRequest.post<ExpenseCategoryResponse>(
        API_SUFFIX.EXPENSE_CATEGORIES,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Tạo danh mục chi phí thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateExpenseCategoryRequest;
    }) => {
      const res = await apiRequest.put<ExpenseCategoryResponse>(
        API_SUFFIX.EXPENSE_CATEGORY_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["expense-category", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Cập nhật danh mục chi phí thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.EXPENSE_CATEGORY_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Xóa danh mục chi phí thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== PAYMENT METHOD ==================

export interface PaymentMethodsParams {
  pageNumber?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

export const usePaymentMethods = (params?: PaymentMethodsParams) => {
  return useQuery({
    queryKey: ["payment-methods", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<PaymentMethodResponseIPaginate>(
        API_SUFFIX.PAYMENT_METHODS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const usePaymentMethod = (
  id: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["payment-method", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<PaymentMethodResponse>(
        API_SUFFIX.PAYMENT_METHOD_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePaymentMethodRequest) => {
      const res = await apiRequest.post<PaymentMethodResponse>(
        API_SUFFIX.PAYMENT_METHODS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Tạo phương thức thanh toán thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePaymentMethodRequest;
    }) => {
      const res = await apiRequest.put<PaymentMethodResponse>(
        API_SUFFIX.PAYMENT_METHOD_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payment-method", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Cập nhật phương thức thanh toán thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.PAYMENT_METHOD_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Xóa phương thức thanh toán thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

