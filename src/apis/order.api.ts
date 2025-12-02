import { http } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

export const updateOrderWorkflow = async (
  orderId: number,
  payload: any
): Promise<any> => {
  return http.get<any>(API_SUFFIX.MY_DESIGNS);
};
