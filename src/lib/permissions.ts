import { Role } from '@/lib/mockData/users';
import type { Order, Production } from '@/types';

// Định nghĩa các quyền chi tiết cho từng role
export const rolePermissions = {
  admin: {
    canViewCustomerInfo: true,
    canViewPricing: true,
    canViewDesignFiles: true,
    canViewFinancials: true,
    canViewProduction: true,
    canViewAllOrders: true,
    canEdit: true,
    canDelete: true,
    dataScope: 'all' as const
  },

  // Cổ đông - Xem được nhiều thứ như admin nhưng chỉ view only
  shareholder: {
    canViewCustomerInfo: true,
    canViewPricing: true,
    canViewDesignFiles: true,
    canViewFinancials: true,
    canViewProduction: true,
    canViewAllOrders: true,
    canEdit: false, // View only
    canDelete: false, // View only
    dataScope: 'all-readonly' as const
  },

  // CSKH - Trưởng phòng thiết kế (có quyền cả CSKH + Design)
  designer_manager: {
    canViewCustomerInfo: true,
    canViewPricing: true, // Trưởng phòng có thể thấy giá để báo giá
    canViewDesignFiles: true,
    canViewFinancials: false, // Không thấy chi tiết tài chính internal
    canViewProduction: false,
    canViewAllOrders: true,
    canEdit: true,
    canDelete: false,
    dataScope: 'customer-design' as const
  },

  // CSKH - Chăm sóc khách hàng
  customer_service: {
    canViewCustomerInfo: true,
    canViewPricing: true, // Cần biết giá để tư vấn khách hàng
    canViewDesignFiles: false,
    canViewFinancials: false,
    canViewProduction: false,
    canViewAllOrders: true,
    canEdit: false,
    canDelete: false,
    dataScope: 'customer-facing' as const
  },
  
  // Kế toán - Chỉ thấy số liệu tài chính, không biết ai thiết kế
  accountant: {
    canViewCustomerInfo: false, // Chỉ thấy mã khách hàng, không thấy tên
    canViewPricing: true,
    canViewDesignFiles: false,
    canViewFinancials: true,
    canViewProduction: false,
    canViewAllOrders: false, // Chỉ thấy đơn có financial data
    canEdit: false,
    canDelete: false,
    dataScope: 'financial-only' as const
  },
  
  // Thiết kế Staff - Thấy yêu cầu thiết kế, không thấy giá tiền
  designer: {
    canViewCustomerInfo: true, // Cần biết yêu cầu của khách
    canViewPricing: false, // Không được biết giá
    canViewDesignFiles: true,
    canViewFinancials: false,
    canViewProduction: false,
    canViewAllOrders: false, // Chỉ thấy đơn được assign
    canEdit: true,
    canDelete: false,
    dataScope: 'design-only' as const
  },
  
  // Bình bài - Xử lý file in, không biết thông tin khách hàng
  prepress: {
    canViewCustomerInfo: false, // Hoàn toàn ẩn thông tin khách hàng
    canViewPricing: false,
    canViewDesignFiles: true,
    canViewFinancials: false,
    canViewProduction: true,
    canViewAllOrders: false, // Chỉ thấy đơn cần bình bài
    canEdit: true,
    canDelete: false,
    dataScope: 'technical-only' as const
  },
  
  // Sản xuất - Chỉ biết specs kỹ thuật, hoàn toàn bảo mật khách hàng
  operator: {
    canViewCustomerInfo: false, // Không biết làm cho ai
    canViewPricing: false,
    canViewDesignFiles: false, // Chỉ thấy file đã qua bình bài
    canViewFinancials: false,
    canViewProduction: true,
    canViewAllOrders: false, // Chỉ thấy đơn trong production
    canEdit: false,
    canDelete: false,
    dataScope: 'production-only' as const
  },
  
  // Production Manager - Quản lý sản xuất, thấy thông tin cần thiết
  production_manager: {
    canViewCustomerInfo: false, // Chỉ thấy mã khách hàng
    canViewPricing: false,
    canViewDesignFiles: false,
    canViewFinancials: false,
    canViewProduction: true,
    canViewAllOrders: false, // Thấy tất cả đơn trong production
    canEdit: true,
    canDelete: false,
    dataScope: 'production-management' as const
  }
} as const;

// Utility function để mask customer info
export const maskCustomerInfo = (customerName: string, role: Role): string => {
  const permissions = rolePermissions[role];
  
  if (!permissions.canViewCustomerInfo) {
    // Chuyển thành mã ẩn danh
    const hash = customerName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `KH-${Math.abs(hash).toString().slice(0, 4)}`;
  }
  
  return customerName;
};

// Utility function để mask/hide pricing
export const filterPricingInfo = (amount: number | undefined, role: Role): number | string | undefined => {
  const permissions = rolePermissions[role];
  
  if (!permissions.canViewPricing) {
    return '***'; // Ẩn hoàn toàn
  }
  
  return amount;
};

// Utility function để filter order data theo role
export const filterOrderData = (order: Order, role: Role) => {
  const permissions = rolePermissions[role];
  
  return {
    ...order,
    customerName: maskCustomerInfo(order.customerName, role),
    totalAmount: filterPricingInfo(order.totalAmount, role),
    depositAmount: permissions.canViewPricing ? order.depositAmount : undefined,
    // Ẩn địa chỉ giao hàng nếu không có quyền xem thông tin khách hàng
    deliveryAddress: permissions.canViewCustomerInfo ? order.deliveryAddress : 'Địa chỉ bảo mật',
  };
};

// Utility function để filter production data
export const filterProductionData = (production: Production, role: Role) => {
  const permissions = rolePermissions[role];
  
  return {
    ...production,
    customerName: maskCustomerInfo(production.customerName, role),
    // Chỉ production roles mới thấy notes đầy đủ
    notes: permissions.canViewProduction ? production.notes : undefined,
  };
};

// Utility function để check xem user có thể access module không
export const canAccessModule = (module: string, role: Role): boolean => {
  const permissions = rolePermissions[role];
  
  switch (module) {
    case 'customers':
      return permissions.canViewCustomerInfo || ['admin', 'shareholder', 'designer_manager', 'customer_service'].includes(role);
    case 'accounting':
      return permissions.canViewFinancials || ['admin', 'shareholder', 'accountant'].includes(role);
    case 'design':
      return permissions.canViewDesignFiles || ['admin', 'shareholder', 'designer', 'designer_manager', 'prepress'].includes(role);
    case 'production':
      return permissions.canViewProduction || ['admin', 'shareholder', 'production_manager', 'operator', 'prepress'].includes(role);
    case 'orders':
      return ['admin', 'shareholder', 'designer_manager', 'customer_service', 'accountant', 'designer'].includes(role);
    case 'dashboard':
      return true; // Tất cả roles đều có dashboard, nhưng nội dung khác nhau
    case 'inventory':
      return ['admin', 'shareholder', 'production_manager', 'operator'].includes(role);
    case 'material-types':
      return ['admin', 'shareholder', 'production_manager'].includes(role);
    case 'notifications':
      return true; // Tất cả roles đều có notifications
    case 'attendance':
      return ['admin', 'shareholder', 'production_manager'].includes(role);
    default:
      return role === 'admin';
  }
};

// Hook để sử dụng permissions trong components
export const usePermissions = (role: Role) => {
  return {
    permissions: rolePermissions[role],
    maskCustomerInfo: (name: string) => maskCustomerInfo(name, role),
    filterPricingInfo: (amount: number | undefined) => filterPricingInfo(amount, role),
    filterOrderData: (order: Order) => filterOrderData(order, role),
    filterProductionData: (production: Production) => filterProductionData(production, role),
    canAccessModule: (module: string) => canAccessModule(module, role),
  };
};