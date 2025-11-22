// Centralized entity configuration for status, roles, and enums
export const ENTITY_CONFIG = {
  roles: {
    entityType: 'User',
    description: 'Vai trò người dùng trong hệ thống',
    values: {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      design: 'Nhân viên thiết kế',
      production: 'Nhân viên sản xuất',
      accounting: 'Nhân viên kế toán',
      warehouse: 'Nhân viên kho',
      hr: 'Nhân sự',
      cskh: 'Chăm sóc khách hàng',
    },
  },
  orderStatuses: {
    entityType: 'Order',
    description: 'Trạng thái đơn hàng',
    values: {
      pending: 'Nhận thông tin',
      waiting_for_proofing: 'Chờ bình bài',
      proofed: 'Đã bình bài',
      waiting_for_production: 'Chờ sản xuất',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
      invoice_issued: 'Xuất hóa đơn',
      cancelled: 'Hủy',
    },
  },
  designStatuses: {
    entityType: 'Design',
    description: 'Trạng thái thiết kế',
    values: {
      received_info: 'Nhận thông tin',
      designing: 'Đang thiết kế',
      editing: 'Đang chỉnh sửa',
      waiting_for_customer_approval: 'Chờ khách duyệt',
      confirmed_for_printing: 'Đã chốt in',
      pdf_exported: 'Xuất file PDF',
    },
  },
  proofingOrderStatuses: {
    entityType: 'ProofingOrder',
    description: 'Trạng thái bình bài',
    values: {
      waiting_for_production: 'Chờ sản xuất',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
    },
  },
  productionStatuses: {
    entityType: 'Production',
    description: 'Trạng thái sản xuất',
    values: {
      waiting_for_production: 'Chờ sản xuất',
      in_production: 'Đang sản xuất',
      completed: 'Hoàn thành',
    },
  },
  paymentStatuses: {
    entityType: 'Accounting',
    description: 'Trạng thái thanh toán',
    values: {
      not_paid: 'Chưa thanh toán',
      deposited: 'Đã nhận cọc',
      fully_paid: 'Đã thanh toán đủ',
    },
  },
  customerTypes: {
    entityType: 'Customer',
    description: 'Loại khách hàng',
    values: {
      retail: 'Khách lẻ',
      company: 'Khách công ty',
    },
  },
  paymentMethods: {
    entityType: 'Payment',
    description: 'Phương thức thanh toán',
    values: {
      cash: 'Tiền mặt',
      bank_transfer: 'Chuyển khoản',
      card: 'Thẻ',
      e_wallet: 'Ví điện tử',
    },
  },
  commonStatuses: {
    entityType: 'MaterialType,DesignType',
    description: 'Trạng thái chung (dùng cho MaterialType, DesignType và các entity khác)',
    values: {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
    },
  },
};
