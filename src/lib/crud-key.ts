export function createCrudKeys<TListParams = any>(rootKey: string) {
  return {
    all: [rootKey] as const,
    list: (params: TListParams | {} = {}) => [rootKey, "list", params] as const,
    detail: (id: number | string) => [rootKey, "detail", id] as const,
  };
}
