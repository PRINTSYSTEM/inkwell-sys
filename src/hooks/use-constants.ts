import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { API_SUFFIX } from "@/apis";
import type { ConstantsResponse } from "@/Schema";

export const useConstants = () => {
  return useQuery<ConstantsResponse>({
    queryKey: ["constants"],
    queryFn: () => http.get<ConstantsResponse>(API_SUFFIX.CONSTANTS),
    staleTime: 24 * 60 * 60 * 1000, // Keep constants cached for 24 hours
  });
};
