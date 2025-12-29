// Centralized entity configuration for status, roles, and enums
// Synced with backend constants
export const ENTITY_CONFIG = {
  roles: {
    entityType: "User",
    description: "Vai trò người dùng trong hệ thống",
    values: {
      admin: "Quản trị viên hệ thống",
      manager: "Quản lý",
      accounting: "Nhân viên kế toán",
      accounting_lead: "Trưởng phòng kế toán",
      proofer: "Nhân viên bình bài",
      design: "Nhân viên thiết kế",
      design_lead: "Trưởng phòng thiết kế",
      production: "Nhân viên sản xuất",
      production_lead: "Trưởng phòng sản xuất",
    },
  },
  orderStatuses: {
    entityType: "Order",
    description: "Trạng thái đơn hàng",
    values: {
      pending: "Nhận thông tin",
      designing: "Đang thiết kế",
      waiting_for_customer_approval: "Chờ khách duyệt",
      editing: "Đang chỉnh sửa",
      confirmed_for_printing: "Đã chốt in",
      waiting_for_deposit: "Chờ đặt cọc",
      deposit_received: "Đã nhận cọc",
      debt_approved: "Đã duyệt công nợ",
      waiting_for_proofing: "Chờ bình bài",
      waiting_for_production: "Chờ sản xuất",
      in_production: "Đang sản xuất",
      production_completed: "Hoàn thành sản xuất",
      invoice_issued: "Xuất hóa đơn",
      delivering: "Đang giao hàng",
      completed: "Hoàn thành",
      cancelled: "Hủy",
    },
  },
  designStatuses: {
    entityType: "Design",
    description: "Trạng thái thiết kế",
    values: {
      received_info: "Nhận thông tin",
      designing: "Đang thiết kế",
      editing: "Đang chỉnh sửa",
      waiting_for_customer_approval: "Chờ khách duyệt",
      confirmed_for_printing: "Đã chốt in",
    },
  },
  proofingOrderStatuses: {
    entityType: "ProofingOrder",
    description: "Trạng thái bình bài",
    values: {
      not_completed: "Chưa hoàn thành",
      completed: "Hoàn thành",
      paused: "Tạm dừng",
    },
  },
  orderDetailDerivedStatuses: {
    entityType: "OrderDetail",
    description:
      "Trạng thái chi tiết đơn hàng trước chốt in (đồng bộ từ Design.Status)",
    values: {
      received_info: "Nhận thông tin",
      designing: "Đang thiết kế",
      editing: "Đang chỉnh sửa",
      waiting_for_customer_approval: "Chờ khách duyệt",
      confirmed_for_printing: "Đã chốt in",
    },
  },
  orderDetailItemStatuses: {
    entityType: "OrderDetail",
    description: "Trạng thái chi tiết đơn hàng sau chốt in",
    values: {
      waiting_for_proofing: "Chờ bình bài",
      waiting_for_production: "Chờ sản xuất",
      in_production: "Đang sản xuất",
      production_completed: "Hoàn thành sản xuất",
      delivering: "Đang giao hàng",
      completed: "Hoàn thành",
    },
  },
  productionStatuses: {
    entityType: "Production",
    description: "Trạng thái sản xuất",
    values: {
      waiting_for_production: "Chờ sản xuất",
      in_production: "Đang sản xuất",
      completed: "Hoàn thành",
      paused: "Tạm dừng",
    },
  },
  paymentStatuses: {
    entityType: "Accounting",
    description: "Trạng thái thanh toán",
    values: {
      not_paid: "Chưa thanh toán",
      deposited: "Đã nhận cọc",
      fully_paid: "Đã thanh toán đủ",
    },
  },
  customerTypes: {
    entityType: "Customer",
    description: "Loại khách hàng",
    values: {
      retail: "Khách lẻ",
      company: "Khách công ty",
    },
  },
  paymentMethods: {
    entityType: "Payment",
    description: "Phương thức thanh toán",
    values: {
      cash: "Tiền mặt",
      bank_transfer: "Chuyển khoản",
      card: "Thẻ",
      e_wallet: "Ví điện tử",
    },
  },
  commonStatuses: {
    entityType: "MaterialType,DesignType",
    description:
      "Trạng thái chung (dùng cho MaterialType, DesignType và các entity khác)",
    values: {
      active: "Hoạt động",
      inactive: "Không hoạt động",
    },
  },
  laminationTypes: {
    entityType: "Design,OrderDetail",
    description: "Loại cán màng",
    values: {
      glossy: "Cán bóng",
      matte: "Cán mờ",
    },
  },
  sidesClassification: {
    entityType: "Design,OrderDetail",
    description: "Loại mặt",
    values: {
      one_side: "1 mặt",
      two_side: "2 mặt",
    },
  },
  processClassification: {
    entityType: "Design,OrderDetail",
    description: "Loại quy trình",
    values: {
      cut: "Cắt",
      die_cut: "Bế",
    },
  },
  vendorTypes: {
    entityType: "Vendor",
    description: "Loại nhà cung cấp",
    values: {
      plate: "Nhà cung cấp kẽm",
      die: "Nhà cung cấp khuôn bế",
    },
  },
};
