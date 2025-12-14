import { http } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import type { DesignResponsePagedResponse } from "@/Schema";

export const updateOrderWorkflow = async (
  orderId: number,
  payload: Record<string, unknown>
): Promise<DesignResponsePagedResponse> => {
  // TODO: This function name doesn't match its implementation - needs review
  return http.get<DesignResponsePagedResponse>(API_SUFFIX.MY_DESIGNS);
};
