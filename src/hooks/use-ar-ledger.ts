import { useQuery } from "@tanstack/react-query";
import arLedgerApi, { ArLedgerResponse, ArLedgerSummaryResponse } from "@/apis/arLedger.api";
import { normalizeParams } from "@/apis/util.api";

export const useArLedgerList = (params?: { customerId?: number; status?: string }) => {
  return useQuery({
    queryKey: ["ar-ledger-list", params],
    queryFn: async () => {
      const normalized = normalizeParams((params ?? {}) as Record<string, unknown>);
      const res = await arLedgerApi.list(normalized as any);
      return res;
    },
  });
};

export const useArLedgerSummary = (customerId?: number) => {
  return useQuery({
    queryKey: ["ar-ledger-summary", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const res = await arLedgerApi.summary(customerId);
      return res;
    },
    enabled: !!customerId,
  });
};

export const useArLedgerGet = (id?: number) => {
  return useQuery({
    queryKey: ["ar-ledger-get", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await arLedgerApi.get(id);
      return res;
    },
    enabled: !!id,
  });
};

export default useArLedgerList;
