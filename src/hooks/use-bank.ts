// src/hooks/use-bank.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import { normalizeParams } from "@/apis/util.api";
import { toast } from "sonner";
import type {
  BankAccountResponse,
  BankAccountResponseIPaginate,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  BankLedgerResponse,
} from "@/Schema/accounting.schema";

// ================== BANK ACCOUNT ==================

export interface BankAccountsParams {
  pageNumber?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

export const useBankAccounts = (params?: BankAccountsParams) => {
  return useQuery({
    queryKey: ["bank-accounts", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<BankAccountResponseIPaginate>(
        API_SUFFIX.BANK_ACCOUNTS,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

export const useBankAccount = (id: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["bank-account", id],
    enabled: enabled && !!id,
    queryFn: async () => {
      const res = await apiRequest.get<BankAccountResponse>(
        API_SUFFIX.BANK_ACCOUNT_BY_ID(id as number)
      );
      return res.data;
    },
  });
};

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBankAccountRequest) => {
      const res = await apiRequest.post<BankAccountResponse>(
        API_SUFFIX.BANK_ACCOUNTS,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Tạo tài khoản ngân hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateBankAccountRequest;
    }) => {
      const res = await apiRequest.put<BankAccountResponse>(
        API_SUFFIX.BANK_ACCOUNT_BY_ID(id),
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bank-account", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Cập nhật tài khoản ngân hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest.delete(API_SUFFIX.BANK_ACCOUNT_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Xóa tài khoản ngân hàng thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
};

// ================== BANK LEDGER ==================

export interface BankLedgerParams {
  fromDate?: string;
  toDate?: string;
  bankAccountId?: number;
}

export const useBankLedger = (params?: BankLedgerParams) => {
  return useQuery({
    queryKey: ["bank-ledger", params],
    queryFn: async () => {
      const normalizedParams = normalizeParams(
        (params ?? {}) as Record<string, unknown>
      );
      const res = await apiRequest.get<BankLedgerResponse>(
        API_SUFFIX.BANK_LEDGER,
        { params: normalizedParams }
      );
      return res.data;
    },
  });
};

