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
  // ========== AUTH ==========
  AUTH_LOGIN: "/auth/login",

  // ========== CONSTANTS ==========
  CONSTANTS: "/constants",

  // ========== USERS ==========
  USERS: "/users",
  USER_BY_ID: (id: number) => `/users/${id}`,
  USER_BY_USERNAME: (username: string) => `/users/username/${username}`,
  USER_CHANGE_PASSWORD: (id: number) => `/users/${id}/change-password`,

  // ========== ORDERS ==========
  ORDERS: "/orders",
  ORDER_BY_ID: (id: number) => `/orders/${id}`,
  ORDERS_STATS: "/orders/stats",
  ORDERS_EXPORT: "/orders/export",
  ORDER_UPLOAD_EXCEL: (orderId: number) => `/orders/${orderId}/upload-excel`,
  ORDER_EXCEL: (orderId: number) => `/orders/${orderId}/generate-excel`,

  // ========== INVOICE / ACCOUNTING ==========
  // /invoices/order/{orderId}
  ORDER_INVOICE: (orderId: number) => `/invoices/order/${orderId}`,

  // ========== CUSTOMERS ==========
  CUSTOMERS: "/customers",
  CUSTOMER_BY_ID: (id: number) => `/customers/${id}`,

  // ========== DESIGN TYPES ==========
  // matching backend /api/designs/types
  DESIGN_TYPES: "/designs/types",
  DESIGN_TYPE_BY_ID: (id: number) => `/designs/types/${id}`,

  // ========== MATERIAL TYPES ==========
  // matching backend /api/designs/materials
  MATERIAL_TYPES: "/designs/materials",
  MATERIAL_TYPE_BY_ID: (id: number) => `/designs/materials/${id}`,
  MATERIAL_TYPES_BY_DESIGN_TYPE: (designTypeId: number) =>
    `/designs/materials/design-type/${designTypeId}`,
  MATERIAL_TYPES_BULK: "/designs/materials/bulk",

  // ========== DESIGNS ==========
  DESIGNS: "/designs",
  DESIGN_BY_ID: (id: number) => `/designs/${id}`,
  MY_DESIGNS: "/designs/my",
  DESIGN_BY_USER: (userId: number) => `/designs/user/${userId}`,
  DESIGN_TIMELINE: (id: number) => `/designs/${id}/timeline`,
  DESIGN_UPLOAD_FILE: (id: number) => `/designs/${id}/upload-design-file`,
  DESIGN_UPLOAD_IMAGE: (id: number) => `/designs/${id}/upload-design-image`,
  DESIGN_GENERATE_EXCEL: (id: number) => `/designs/${id}/generate-excel`,

  // Lấy danh sách employee role=design
  // (nếu muốn linh hoạt hơn thì có thể chỉ dùng USERS + params, nhưng giữ cái này cho tiện)
  DESIGN_EMPLOYEES_FIXED_QUERY: () =>
    `/users?pageNumber=1&pageSize=10&role=design`,

  // ========== PROOFING ORDERS (BÌNH BÀI) ==========
  PROOFING_ORDERS: "/proofing-orders",
  PROOFING_ORDER_BY_ID: (id: number) => `/proofing-orders/${id}`,
  PROOFING_FROM_DESIGNS: "/proofing-orders/from-designs",
  PROOFING_AVAILABLE_DESIGNS: "/proofing-orders/available-designs`",

  // ========== PRODUCTIONS (SẢN XUẤT) ==========
  PRODUCTIONS: "/productions",
  PRODUCTION_BY_ID: (id: number) => `/productions/${id}`,
  PRODUCTIONS_BY_PROOFING_ORDER: (proofingOrderId: number) =>
    `/productions/proofing-order/${proofingOrderId}`,
  PRODUCTION_START: (id: number) => `/productions/${id}/start`,
  PRODUCTION_COMPLETE: (id: number) => `/productions/${id}/complete`,
};
