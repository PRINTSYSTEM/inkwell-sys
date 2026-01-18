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
      waiting_for_proofing: "Chờ bình bài",
      waiting_for_production: "Chờ sản xuất",
      in_production: "Đang sản xuất",
      production_completed: "Hoàn thành sản xuất",
      waiting_for_delivery: "Chờ giao hàng",
      waiting_for_redelivery: "Chờ giao lại",
      delivering: "Đang giao hàng",
      delivered: "Đã giao hàng",
      invoice_issued: "Xuất hóa đơn",
      completed: "Hoàn thành",
      return_processing: "Xử lý trả/đổi hàng",
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
      returned: "Bị trả về",
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
      returned: "Bị trả về",
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
      returned: "Trả về (từ bình bài)",
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
      none: "Không cán",
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
  deliveryNoteStatuses: {
    entityType: "DeliveryNote",
    description: "Trạng thái phiếu giao hàng",
    values: {
      draft: "Nháp",
      confirmed: "Đã xác nhận",
      ready_to_ship: "Sẵn sàng giao",
      handed_over: "Đã bàn giao ĐVVC",
      in_transit: "Đang giao",
      partially_completed: "Hoàn tất một phần",
      completed: "Kết thúc",
      cancelled: "Hủy",
    },
  },
  deliveryLineStatuses: {
    entityType: "DeliveryNoteLine",
    description: "Trạng thái dòng giao hàng",
    values: {
      pending: "Chưa có kết quả",
      delivered: "Giao thành công",
      failed_reschedule: "Thất bại - hẹn giao lại",
      returned: "Trả hàng",
      cancelled: "Hủy món",
    },
  },
  debtStatuses: {
    entityType: "Customer",
    description: "Trạng thái công nợ khách hàng",
    values: {
      normal: "Bình thường",
      warning: "Cảnh báo",
      exceeded: "Vượt hạn mức",
    },
  },
  productionStepTypes: {
    entityType: "ProductionStep",
    description: "Loại công đoạn sản xuất",
    values: {
      material_export: "Xuất nguyên liệu",
      print: "In",
      lamination: "Cán màng",
      die_cut: "Bế",
      cut: "Cắt",
      glue: "Dán",
      packaging: "Đóng gói",
    },
  },
  productionStepStatuses: {
    entityType: "ProductionStep",
    description: "Trạng thái công đoạn sản xuất",
    values: {
      pending: "Chờ",
      ready: "Sẵn sàng",
      in_progress: "Đang thực hiện",
      done: "Hoàn thành",
      blocked: "Bị chặn/Lỗi",
    },
  },
  stockInSources: {
    entityType: "StockIn",
    description: "Nguồn nhập kho",
    values: {
      vendor: "Nhập từ NCC",
      production: "Nhập từ sản xuất",
      delivery_return: "Nhập từ trả hàng",
      adjustment: "Điều chỉnh",
    },
  },
  stockInItemTypes: {
    entityType: "StockIn",
    description: "Loại vật phẩm nhập kho",
    values: {
      material: "Nguyên vật liệu",
      product: "Thành phẩm",
    },
  },
  stockInStatuses: {
    entityType: "StockIn",
    description: "Trạng thái nhập kho",
    values: {
      pending: "Chờ xử lý",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    },
  },
  stockOutPurposes: {
    entityType: "StockOut",
    description: "Mục đích xuất kho",
    values: {
      production: "Xuất sản xuất",
      delivery: "Xuất giao hàng",
      adjustment: "Điều chỉnh",
      transfer: "Chuyển kho",
    },
  },
  stockOutItemTypes: {
    entityType: "StockOut",
    description: "Loại vật phẩm xuất kho",
    values: {
      material: "Nguyên vật liệu",
      product: "Thành phẩm",
    },
  },
  stockOutStatuses: {
    entityType: "StockOut",
    description: "Trạng thái xuất kho",
    values: {
      pending: "Chờ xử lý",
      completed: "Hoàn thành",
      returned: "Đã trả hàng",
      partially_returned: "Trả một phần",
      cancelled: "Đã hủy",
    },
  },
  dieSearchRelevances: {
    entityType: "Die",
    description: "Loại tìm kiếm khuôn (query parameter)",
    values: {
      exact_match: "Khớp chính xác (tất cả)",
      related: "Liên quan (cùng/khác khách hàng)",
      unrelated: "Không liên quan (chỉ khách hàng hiện tại)",
    },
  },
  deliveryFailureTypes: {
    entityType: "DeliveryNote",
    description: "Loại lý do giao hàng thất bại",
    values: {
      customer_refused: "Do khách từ chối",
      company_issue: "Do công ty",
    },
  },
  invoiceStatuses: {
    entityType: "Invoice",
    description: "Trạng thái hóa đơn VAT",
    values: {
      draft: "Nháp",
      pending_issue: "Chờ phát hành",
      issued: "Đã phát hành",
      rejected: "Bị từ chối",
      voided: "Đã hủy",
      adjusted: "Điều chỉnh",
      replaced: "Thay thế",
    },
  },
  paymentTypes: {
    entityType: "Payment",
    description: "Loại thanh toán",
    values: {
      deposit: "Đặt cọc",
      payment: "Thanh toán",
    },
  },
  debtChangeTypes: {
    entityType: "DebtHistory",
    description: "Loại thay đổi công nợ",
    values: {
      order_created: "Phát sinh đơn hàng",
      payment_received: "Thanh toán",
      deposit_received: "Nhận cọc",
      debt_adjustment: "Điều chỉnh",
    },
  },
  dieUsageTypes: {
    entityType: "Die",
    description: "Loại sử dụng khuôn bế",
    values: {
      one_time: "Dùng 1 lần",
      reusable: "Tái sử dụng",
    },
  },
  dieStatuses: {
    entityType: "Die",
    description: "Trạng thái khuôn bế",
    values: {
      new: "Mới tạo (chờ SX)",
      ready: "Sẵn sàng (trong kho)",
      in_production: "Đang sử dụng",
      broken: "Hỏng",
      disposed: "Đã hủy",
    },
  },
  dieLocations: {
    entityType: "Die",
    description: "Vị trí khuôn bế",
    values: {
      InStock: "Trong kho",
      InUse: "Đang sử dụng",
    },
  },
};
