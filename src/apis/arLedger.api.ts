import { http } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

export interface ArLedgerResponse {
  id: number;
  customerId: number;
  orderId: number;
  deliveryNoteId: number;
  deliveryNoteLineId: number;
  designId?: number | null;
  deliveredAt?: string;
  orderCode?: string | null;
  deliveryNoteCode?: string | null;
  designCode?: string | null;
  designName?: string | null;
  materialTypeName?: string | null;
  deliveredQuantity?: number;
  unitPriceSnapshot?: number;
  lineAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  status?: string | null;
  createdAt?: string;
}

export interface ArLedgerSummaryResponse {
  customerId: number;
  customerName?: string | null;
  totalReceivable?: number;
  totalPaid?: number;
  totalRemaining?: number;
  details?: ArLedgerResponse[] | null;
}

export const arLedgerApi = {
  list: (params?: { customerId?: number; status?: string }) =>
    http.get<ArLedgerResponse[]>(API_SUFFIX.AR_LEDGER, params),

  get: (id: number) => http.get<ArLedgerResponse>(API_SUFFIX.AR_LEDGER_BY_ID(id)),

  summary: (customerId: number) =>
    http.get<ArLedgerSummaryResponse>(API_SUFFIX.AR_LEDGER_SUMMARY(customerId)),
};

export default arLedgerApi;
