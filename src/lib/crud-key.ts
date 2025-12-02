export function createCrudKeys<TListParams = Record<string, any>, TId = number>(
  rootKey: string
) {
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
