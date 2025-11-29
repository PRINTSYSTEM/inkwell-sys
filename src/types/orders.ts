export type OrderStatus = {
  pending: string;
  waiting_for_proofing: string;
  proofed: string;
  waiting_for_production: string;
  in_production: string;
  completed: string;
  invoice_issued: string;
  cancelled: string;
};
