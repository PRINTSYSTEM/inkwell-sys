import { http } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import type { DesignResponsePaginate } from "@/Schema";

export const updateOrderWorkflow = async (
  orderId: number,
  payload: Record<string, unknown>
): Promise<DesignResponsePaginate> => {
  // TODO: This function name doesn't match its implementation - needs review
  return http.get<DesignResponsePaginate>(API_SUFFIX.MY_DESIGNS);
};
