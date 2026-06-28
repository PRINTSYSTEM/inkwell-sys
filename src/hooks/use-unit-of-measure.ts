import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";

export interface UnitOfMeasureResponse {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
  displayOrder: number;
}

export const useUnitOfMeasures = () => {
  return useQuery<UnitOfMeasureResponse[]>({
    queryKey: ["unit-of-measures"],
    queryFn: () => http.get<UnitOfMeasureResponse[]>("/unit-of-measures"),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    retry: 1, // Minimize retry attempts if it 404s
  });
};
