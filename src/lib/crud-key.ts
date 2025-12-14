import { QueryClient } from "@tanstack/react-query";

export function createCrudKeys<
  TListParams = Record<string, unknown>,
  TId = number
>(rootKey: string) {
  return {
    all: [rootKey] as const,

    lists: () => [rootKey, "list"] as const,

    list: (params?: TListParams) =>
      params
        ? ([rootKey, "list", params] as const)
        : ([rootKey, "list"] as const),

    details: () => [rootKey, "detail"] as const,

    detail: (id: TId) => [rootKey, "detail", id] as const,
  } as const;
}

/**
 * Helper để invalidate nhiều queries cùng lúc
 * @param queryClient - QueryClient instance
 * @param rootKeys - Mảng các root key cần invalidate (ví dụ: ["orders", "designs", "proofing-orders"])
 */
export function invalidateRelatedQueries(
  queryClient: QueryClient,
  rootKeys: string[]
) {
  rootKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

/**
 * Định nghĩa các queries liên quan theo entity
 * Khi update/delete một entity, invalidate tất cả các queries liên quan
 */
export const RELATED_QUERIES: Record<string, string[]> = {
  orders: [
    "orders",
    "designs",
    "proofing-orders",
    "productions",
    "accountings",
  ],
  designs: ["designs", "orders"],
  "proofing-orders": ["proofing-orders", "orders", "productions"],
  productions: ["productions", "proofing-orders", "orders"],
  customers: ["customers", "orders"],
  "design-types": ["design-types", "material-types", "designs"],
  "material-types": ["material-types", "design-types", "designs"],
  users: ["users"],
  accountings: ["accountings", "orders"],
};
