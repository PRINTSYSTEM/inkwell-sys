export const normalizeParams = (filters: Record<string, unknown>) => {
  const normalized = { ...filters };
  const sort = filters.sort as string;

  if (typeof sort === 'string') {
    const sortParts = sort.split(",");
    if (sortParts.length >= 2) {
      normalized.sortBy = sortParts[0];
      normalized.sortDirection = sortParts[1];
    }
  }

  const removeEmptyValueParams = Object.fromEntries(
    Object.entries(normalized).filter(([_, v]) => v != null)
  );
  return removeEmptyValueParams;
};


export const API_SUFFIX = {
  // Auth
  AUTH_API: "/auth/login",

};
