import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { toast } from "sonner";
import type {
  CustomerOpeningBalanceResponse,
  VendorOpeningBalanceResponse,
  ImportResultResponse,
} from "@/Schema";

// ==========================================
// CUSTOMER OPENING BALANCES HOOKS
// ==========================================

export const useCustomerOpeningBalances = () => {
  return useQuery<CustomerOpeningBalanceResponse[]>({
    queryKey: ["opening-balances", "customers"],
    queryFn: async () => {
      const res = await apiRequest.get<CustomerOpeningBalanceResponse[]>(
        "/opening-balances/customers"
      );
      return res.data;
    },
  });
};

export const useCustomerOpeningBalance = (customerId: number | null, enabled = true) => {
  return useQuery<CustomerOpeningBalanceResponse>({
    queryKey: ["opening-balances", "customers", customerId],
    queryFn: async () => {
      const res = await apiRequest.get<CustomerOpeningBalanceResponse>(
        `/opening-balances/customers/${customerId}`
      );
      return res.data;
    },
    enabled: enabled && customerId !== null,
  });
};

export const useUpdateCustomerOpeningBalance = () => {
  const queryClient = useQueryClient();
  return useMutation<
    CustomerOpeningBalanceResponse,
    Error,
    { customerId: number; amount: number; asOfDate: string; note?: string | null }
  >({
    mutationFn: async ({ customerId, ...data }) => {
      const res = await apiRequest.put<CustomerOpeningBalanceResponse>(
        `/opening-balances/customers/${customerId}`,
        data
      );
      return res.data;
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "customers"] });
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "customers", customerId] });
      // Invalidate customer debt statement since opening balance changed
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      toast.success("Cập nhật số dư đầu kỳ thành công");
    },
    onError: (err) => {
      toast.error(`Lỗi cập nhật: ${err.message}`);
    },
  });
};

export const useDeleteCustomerOpeningBalance = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (customerId) => {
      await apiRequest.delete(`/opening-balances/customers/${customerId}`);
    },
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "customers"] });
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
      toast.success("Xóa số dư đầu kỳ thành công");
    },
    onError: (err) => {
      toast.error(`Lỗi xóa: ${err.message}`);
    },
  });
};

export const useImportCustomerOpeningBalances = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ImportResultResponse,
    Error,
    Array<{ customerCode: string; amount: number; asOfDate: string; note?: string | null }>
  >({
    mutationFn: async (data) => {
      const res = await apiRequest.post<ImportResultResponse>(
        "/opening-balances/customers/import",
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.errorCount === 0) {
        queryClient.invalidateQueries({ queryKey: ["opening-balances", "customers"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast.success(`Import thành công ${data.successCount} khách hàng!`);
      } else {
        toast.error(`Import thất bại: có ${data.errorCount} lỗi xảy ra.`);
      }
    },
    onError: (err) => {
      toast.error(`Lỗi import: ${err.message}`);
    },
  });
};

// ==========================================
// VENDOR OPENING BALANCES HOOKS
// ==========================================

export const useVendorOpeningBalances = () => {
  return useQuery<VendorOpeningBalanceResponse[]>({
    queryKey: ["opening-balances", "vendors"],
    queryFn: async () => {
      const res = await apiRequest.get<VendorOpeningBalanceResponse[]>(
        "/opening-balances/vendors"
      );
      return res.data;
    },
  });
};

export const useVendorOpeningBalance = (vendorId: number | null, enabled = true) => {
  return useQuery<VendorOpeningBalanceResponse>({
    queryKey: ["opening-balances", "vendors", vendorId],
    queryFn: async () => {
      const res = await apiRequest.get<VendorOpeningBalanceResponse>(
        `/opening-balances/vendors/${vendorId}`
      );
      return res.data;
    },
    enabled: enabled && vendorId !== null,
  });
};

export const useUpdateVendorOpeningBalance = () => {
  const queryClient = useQueryClient();
  return useMutation<
    VendorOpeningBalanceResponse,
    Error,
    { vendorId: number; amount: number; asOfDate: string; note?: string | null }
  >({
    mutationFn: async ({ vendorId, ...data }) => {
      const res = await apiRequest.put<VendorOpeningBalanceResponse>(
        `/opening-balances/vendors/${vendorId}`,
        data
      );
      return res.data;
    },
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "vendors"] });
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });
      toast.success("Cập nhật số dư đầu kỳ nhà cung cấp thành công");
    },
    onError: (err) => {
      toast.error(`Lỗi cập nhật: ${err.message}`);
    },
  });
};

export const useDeleteVendorOpeningBalance = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (vendorId) => {
      await apiRequest.delete(`/opening-balances/vendors/${vendorId}`);
    },
    onSuccess: (_, vendorId) => {
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "vendors"] });
      queryClient.invalidateQueries({ queryKey: ["opening-balances", "vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["vendors", vendorId] });
      toast.success("Xóa số dư đầu kỳ nhà cung cấp thành công");
    },
    onError: (err) => {
      toast.error(`Lỗi xóa: ${err.message}`);
    },
  });
};

export const useImportVendorOpeningBalances = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ImportResultResponse,
    Error,
    Array<{ vendorCode: string; amount: number; asOfDate: string; note?: string | null }>
  >({
    mutationFn: async (data) => {
      const res = await apiRequest.post<ImportResultResponse>(
        "/opening-balances/vendors/import",
        data
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.errorCount === 0) {
        queryClient.invalidateQueries({ queryKey: ["opening-balances", "vendors"] });
        queryClient.invalidateQueries({ queryKey: ["vendors"] });
        toast.success(`Import thành công ${data.successCount} nhà cung cấp!`);
      } else {
        toast.error(`Import thất bại: có ${data.errorCount} lỗi xảy ra.`);
      }
    },
    onError: (err) => {
      toast.error(`Lỗi import: ${err.message}`);
    },
  });
};

// ==========================================
// EXCEL TEMPLATE EXPORT
// ==========================================

export const useDownloadOpeningBalanceTemplate = () => {
  return useMutation<void, Error, "customers" | "vendors">({
    mutationFn: async (type) => {
      const res = await apiRequest.get<ArrayBuffer>(
        `/opening-balances/${type}/export-template`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `template-opening-balances-${type}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Đã tải xuống file Excel mẫu");
    },
    onError: (err) => {
      toast.error(`Lỗi tải file mẫu: ${err.message}`);
    },
  });
};
