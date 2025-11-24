export const normalizeParams = (filters: Record<string, unknown>) => {
  const normalized = { ...filters };
  const sort = filters.sort as string;

  if (typeof sort === "string") {
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

  // Orders
  ORDERS: "/orders",
  ORDERS_STATS: "/orders/stats",
  ORDERS_EXPORT: "/orders/export",
  ORDER_UPLOAD_EXCEL: (orderId: number) => `/orders/${orderId}/upload-excel`,

  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_BY_ID: (id: number) => `/customers/${id}`,

  // Design Types (matching backend /api/designs/types)
  DESIGN_TYPES: "/designs/types",
  DESIGN_TYPE_BY_ID: (id: number) => `/designs/types/${id}`,

  // Material Types (matching backend /api/designs/materials)
  MATERIAL_TYPES: "/designs/materials",
  MATERIAL_TYPE_BY_ID: (id: number) => `/designs/materials/${id}`,

  // Designs
  DESIGNS: "/designs",
  MY_DESIGNS: "/designs/my",
  DESIGN_BY_ID: (id: number) => `/designs/${id}`,
  DESIGN_TIMELINE: (id: number) => `/designs/${id}/timeline`,
  DESIGN_UPLOAD: (id: number) => `/designs/${id}/upload-design-file`,
  DESIGN_GENERATE_EXCEL: (id: number) => `/designs/${id}/generate-excel`,
};
