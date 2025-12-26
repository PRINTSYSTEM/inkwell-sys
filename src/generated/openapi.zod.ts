import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const AccountingResponse = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    accountantId: z.number().int(),
    accountantName: z.string().nullable(),
    invoiceNumber: z.string().nullable(),
    invoiceUrl: z.string().nullable(),
    paymentStatus: z.string().nullable(),
    totalAmount: z.number(),
    deposit: z.number(),
    remainingAmount: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerType: z.string().nullable(),
    customerCurrentDebt: z.number(),
  })
  .partial();
const ConfirmPaymentRequest = z.object({
  amount: z.number().gte(0.01),
  paymentMethod: z.string().nullish(),
  notes: z.string().nullish(),
});
const ExportDebtRequest = z
  .object({
    customerId: z.number().int().nullable(),
    startDate: z.string().datetime({ offset: true }).nullable(),
    endDate: z.string().datetime({ offset: true }).nullable(),
    year: z.number().int().nullable(),
    month: z.number().int().nullable(),
  })
  .partial();
const LoginRequest = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
const UserInfo = z
  .object({
    id: z.number().int(),
    username: z.string().nullable(),
    fullName: z.string().nullable(),
    role: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  })
  .partial();
const LoginResponse = z
  .object({ accessToken: z.string().nullable(), userInfo: UserInfo })
  .partial();
const ErrorResponse = z
  .object({
    statusCode: z.number().int(),
    error: z.string().nullable(),
    timeStamp: z.string().datetime({ offset: true }),
    details: z.object({}).partial().passthrough().nullable(),
  })
  .partial();
const RoleDefinition = z
  .object({
    code: z.string().nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
  })
  .partial();
const RolesResponse = z
  .object({ roles: z.array(RoleDefinition).nullable() })
  .partial();
const ConstantGroup = z
  .object({
    entityType: z.string().nullable(),
    description: z.string().nullable(),
    values: z.record(z.string()).nullable(),
  })
  .partial();
const ConstantsResponse = z
  .object({
    roles: ConstantGroup,
    orderStatuses: ConstantGroup,
    designStatuses: ConstantGroup,
    proofingOrderStatuses: ConstantGroup,
    orderDetailDerivedStatuses: ConstantGroup,
    orderDetailItemStatuses: ConstantGroup,
    productionStatuses: ConstantGroup,
    paymentStatuses: ConstantGroup,
    customerTypes: ConstantGroup,
    paymentMethods: ConstantGroup,
    commonStatuses: ConstantGroup,
    laminationTypes: ConstantGroup,
  })
  .partial();
const CreateCustomerRequest = z.object({
  name: z.string().min(0).max(255),
  companyName: z.string().min(0).max(255).nullish(),
  representativeName: z.string().min(0).max(255).nullish(),
  phone: z.string().min(0).max(20).nullish(),
  email: z.string().min(0).max(255).email().nullish(),
  taxCode: z.string().min(0).max(50).nullish(),
  address: z.string().min(0).max(255).nullish(),
  type: z.string().min(0).max(50).nullish(),
  currentDebt: z.number().gte(0).optional(),
  maxDebt: z.number().gte(0).optional(),
});
const CustomerResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    companyName: z.string().nullable(),
    representativeName: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    taxCode: z.string().nullable(),
    address: z.string().nullable(),
    type: z.string().nullable(),
    typeStatusType: z.string().nullable(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    debtStatus: z.string().nullable(),
    isComplete: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const CustomerSummaryResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    companyName: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    debtStatus: z.string().nullable(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    isComplete: z.boolean(),
  })
  .partial();
const CustomerSummaryResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CustomerSummaryResponse).nullable(),
  })
  .partial();
const UpdateCustomerRequest = z
  .object({
    name: z.string().min(0).max(255).nullable(),
    companyName: z.string().min(0).max(255).nullable(),
    representativeName: z.string().min(0).max(255).nullable(),
    phone: z.string().min(0).max(20).nullable(),
    email: z.string().min(0).max(255).email().nullable(),
    taxCode: z.string().min(0).max(50).nullable(),
    address: z.string().min(0).max(255).nullable(),
    type: z.string().min(0).max(50).nullable(),
    currentDebt: z.number().gte(0).nullable(),
    maxDebt: z.number().gte(0).nullable(),
  })
  .partial();
const CustomerDebtHistoryResponse = z
  .object({
    id: z.number().int(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    orderId: z.number().int().nullable(),
    orderCode: z.string().nullable(),
    paymentId: z.number().int().nullable(),
    previousDebt: z.number(),
    changeAmount: z.number(),
    newDebt: z.number(),
    changeType: z.string().nullable(),
    changeTypeDisplay: z.string().nullable(),
    note: z.string().nullable(),
    createdById: z.number().int().nullable(),
    createdByName: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const CustomerMonthlyDebtResponse = z
  .object({
    id: z.number().int(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    year: z.number().int(),
    month: z.number().int(),
    openingDebt: z.number(),
    closingDebt: z.number(),
    changeInMonth: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const CustomerDebtSummaryResponse = z
  .object({
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerType: z.string().nullable(),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    openingDebt: z.number(),
    totalDebtIncurred: z.number(),
    totalPaymentReceived: z.number(),
    closingDebt: z.number(),
    orderCount: z.number().int(),
    paymentCount: z.number().int(),
    details: z.array(CustomerDebtHistoryResponse).nullable(),
  })
  .partial();
const FrequentProductResponse = z
  .object({
    designTypeId: z.number().int().nullable(),
    designTypeName: z.string().nullable(),
    materialTypeId: z.number().int().nullable(),
    materialTypeName: z.string().nullable(),
    orderCount: z.number().int(),
    totalQuantity: z.number().int(),
    lastOrderDate: z.string().datetime({ offset: true }),
  })
  .partial();
const CustomerStatisticsResponse = z
  .object({
    customerId: z.number().int(),
    customerCode: z.string().nullable(),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    totalOrders: z.number().int(),
    completedOrders: z.number().int(),
    totalOrderAmount: z.number(),
    totalPaidAmount: z.number(),
    totalRemainingAmount: z.number(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    debtStatus: z.string().nullable(),
    frequentProducts: z.array(FrequentProductResponse).nullable(),
  })
  .partial();
const OrderHistoryDetailResponse = z
  .object({
    id: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    quantity: z.number().int(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    status: z.string().nullable(),
  })
  .partial();
const CustomerOrderHistoryResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    invoiceNumber: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    totalAmount: z.number(),
    depositAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    paymentDueDate: z.string().datetime({ offset: true }).nullable(),
    isPaymentOverdue: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    itemCount: z.number().int(),
    designTypeNames: z.array(z.string()).nullable(),
    details: z.array(OrderHistoryDetailResponse).nullable(),
  })
  .partial();
const CustomerOrderHistoryResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CustomerOrderHistoryResponse).nullable(),
  })
  .partial();
const CreateDeliveryNoteRequest = z.object({
  orderIds: z.array(z.number().int()).min(1),
  recipientName: z.string().min(0).max(255).nullish(),
  recipientPhone: z.string().min(0).max(20).nullish(),
  deliveryAddress: z.string().min(0).max(500).nullish(),
  notes: z.string().nullish(),
});
const DeliveryNoteOrderResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    customerName: z.string().nullable(),
    totalAmount: z.number(),
    deliveryAddress: z.string().nullable(),
  })
  .partial();
const DeliveryNoteResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    failureReason: z.string().nullable(),
    failureType: z.string().nullable(),
    failureTypeName: z.string().nullable(),
    affectsDebt: z.boolean(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    deliveredBy: UserInfo,
    deliveredAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
    pdfUrl: z.string().nullable(),
    createdBy: UserInfo,
    createdAt: z.string().datetime({ offset: true }),
    orders: z.array(DeliveryNoteOrderResponse).nullable(),
  })
  .partial();
const DeliveryNoteResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DeliveryNoteResponse).nullable(),
  })
  .partial();
const UpdateDeliveryStatusRequest = z.object({
  status: z.string().min(0).max(20),
  failureReason: z.string().nullish(),
  failureType: z.string().min(0).max(50).nullish(),
  affectsDebt: z.boolean().nullish(),
  deliveredAt: z.string().datetime({ offset: true }).nullish(),
  deliveredById: z.number().int().nullish(),
  notes: z.string().nullish(),
});
const RecreateDeliveryNoteRequest = z.object({
  originalDeliveryNoteId: z.number().int(),
  orderIds: z.array(z.number().int()).nullish(),
  recipientName: z.string().min(0).max(255).nullish(),
  recipientPhone: z.string().min(0).max(20).nullish(),
  deliveryAddress: z.string().min(0).max(500).nullish(),
  notes: z.string().nullish(),
});
const DesignTypeResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    displayOrder: z.number().int(),
    description: z.string().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const MaterialTypeResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    displayOrder: z.number().int(),
    description: z.string().nullable(),
    pricePerM2: z.number(),
    minimumQuantity: z.number().int(),
    designTypeId: z.number().int().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const DesignTimelineEntryResponse = z
  .object({
    id: z.number().int(),
    fileUrl: z.string().nullable(),
    description: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const DesignResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    customerId: z.number().int(),
    designerId: z.number().int(),
    designer: UserInfo,
    designTypeId: z.number().int(),
    designType: DesignTypeResponse,
    materialTypeId: z.number().int(),
    materialType: MaterialTypeResponse,
    designName: z.string().nullable(),
    dimensions: z.string().nullable(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    areaM2: z.number().nullable(),
    sidesClassification: z.string().nullable(),
    processClassification: z.string().nullable(),
    sidesClassificationName: z.string().nullable(),
    processClassificationName: z.string().nullable(),
    laminationType: z.string().nullable(),
    laminationTypeName: z.string().nullable(),
    designFileUrl: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    excelFileUrl: z.string().nullable(),
    notes: z.string().nullable(),
    customer: CustomerSummaryResponse,
    latestOrderCode: z.string().nullable(),
    latestRequirements: z.string().nullable(),
    availableQuantityForProofing: z.number().int().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    timelineEntries: z.array(DesignTimelineEntryResponse).nullable(),
  })
  .partial();
const UpdateDesignRequest = z
  .object({
    assignedDesignerId: z.number().int().nullable(),
    designName: z.string().min(0).max(255).nullable(),
    designStatus: z.string().min(0).max(50).nullable(),
    designFileUrl: z.string().nullable(),
    excelFileUrl: z.string().nullable(),
    length: z.number().gte(0).nullable(),
    width: z.number().gte(0).nullable(),
    height: z.number().gte(0).nullable(),
    sidesClassification: z.string().nullable(),
    processClassification: z.string().nullable(),
    laminationType: z.string().min(0).max(20).nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
  })
  .partial();
const DesignResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DesignResponse).nullable(),
  })
  .partial();
const postApidesignsIdtimeline_Body = z
  .object({ File: z.instanceof(File), Description: z.string().optional() })
  .passthrough();
const CreateDesignTypeRequest = z.object({
  code: z.string().min(0).max(20),
  name: z.string().min(0).max(255),
  displayOrder: z.number().int().gte(0).lte(2147483647).optional(),
  description: z.string().nullish(),
  status: z
    .string()
    .min(1)
    .regex(/^(active|inactive)$/),
});
const DesignTypeResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DesignTypeResponse).nullable(),
  })
  .partial();
const UpdateDesignTypeRequest = z
  .object({
    name: z.string().min(0).max(255).nullable(),
    displayOrder: z.number().int().gte(0).lte(2147483647).nullable(),
    description: z.string().nullable(),
    status: z
      .string()
      .regex(/^(active|inactive)$/)
      .nullable(),
  })
  .partial();
const CreateInvoiceItemRequest = z.object({
  orderDetailId: z.number().int().nullish(),
  description: z.string().min(0).max(500),
  unit: z.string().min(0).max(20).nullish(),
  quantity: z.number().gte(0.01).optional(),
  unitPrice: z.number().gte(0).optional(),
});
const CreateInvoiceRequest = z.object({
  orderIds: z.array(z.number().int()).min(1),
  invoiceNumber: z.string().nullish(),
  taxRate: z.number().gte(0).lte(1).optional(),
  notes: z.string().nullish(),
  buyerName: z.string().nullish(),
  buyerCompanyName: z.string().nullish(),
  buyerTaxCode: z.string().nullish(),
  buyerAddress: z.string().nullish(),
  buyerEmail: z.string().nullish(),
  paymentMethod: z.string().nullish(),
  buyerBankAccount: z.string().nullish(),
  customItems: z.array(CreateInvoiceItemRequest).nullish(),
});
const InvoiceOrderResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    amount: z.number(),
  })
  .partial();
const InvoiceItemResponse = z
  .object({
    id: z.number().int(),
    orderDetailId: z.number().int().nullable(),
    sortOrder: z.number().int(),
    description: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
  })
  .partial();
const InvoiceResponse = z
  .object({
    id: z.number().int(),
    invoiceNumber: z.string().nullable(),
    invoiceType: z.string().nullable(),
    totalAmount: z.number(),
    taxRate: z.number(),
    taxAmount: z.number(),
    grandTotal: z.number(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    pdfUrl: z.string().nullable(),
    notes: z.string().nullable(),
    sellerName: z.string().nullable(),
    sellerTaxCode: z.string().nullable(),
    sellerAddress: z.string().nullable(),
    sellerPhone: z.string().nullable(),
    sellerBankAccount: z.string().nullable(),
    sellerBankName: z.string().nullable(),
    buyerName: z.string().nullable(),
    buyerCompanyName: z.string().nullable(),
    buyerTaxCode: z.string().nullable(),
    buyerAddress: z.string().nullable(),
    buyerEmail: z.string().nullable(),
    paymentMethod: z.string().nullable(),
    buyerBankAccount: z.string().nullable(),
    createdBy: UserInfo,
    issuedAt: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
    orders: z.array(InvoiceOrderResponse).nullable(),
    items: z.array(InvoiceItemResponse).nullable(),
  })
  .partial();
const UpdateInvoiceRequest = z
  .object({
    invoiceNumber: z.string().nullable(),
    status: z.string().min(0).max(20).nullable(),
    notes: z.string().nullable(),
    buyerName: z.string().nullable(),
    buyerCompanyName: z.string().nullable(),
    buyerTaxCode: z.string().nullable(),
    buyerAddress: z.string().nullable(),
    buyerEmail: z.string().nullable(),
  })
  .partial();
const CreateMaterialTypeRequest = z.object({
  code: z.string().min(0).max(20),
  name: z.string().min(0).max(255),
  displayOrder: z.number().int().gte(0).lte(2147483647).optional(),
  description: z.string().nullish(),
  pricePerM2: z.number().gte(0),
  designTypeId: z.number().int().nullish(),
  status: z
    .string()
    .min(1)
    .regex(/^(active|inactive)$/),
});
const MaterialTypeResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(MaterialTypeResponse).nullable(),
  })
  .partial();
const MaterialTypeItem = z.object({
  code: z.string().min(0).max(20),
  name: z.string().min(0).max(255),
  displayOrder: z.number().int().gte(0).lte(2147483647).optional(),
  description: z.string().nullish(),
  pricePerM2: z.number().gte(0),
  status: z
    .string()
    .min(1)
    .regex(/^(active|inactive)$/),
});
const BulkCreateMaterialTypeRequest = z.object({
  designTypeId: z.number().int(),
  materials: z.array(MaterialTypeItem).min(1),
});
const UpdateMaterialTypeRequest = z
  .object({
    name: z.string().min(0).max(255).nullable(),
    displayOrder: z.number().int().gte(0).lte(2147483647).nullable(),
    description: z.string().nullable(),
    pricePerM2: z.number().gte(0).nullable(),
    designTypeId: z.number().int().nullable(),
    status: z
      .string()
      .regex(/^(active|inactive)$/)
      .nullable(),
  })
  .partial();
const CreateDesignRequest = z.object({
  designId: z.number().int().nullish(),
  designTypeId: z.number().int().nullish(),
  materialTypeId: z.number().int().nullish(),
  assignedDesignerId: z.number().int().nullish(),
  quantity: z.number().int().gte(1).lte(2147483647),
  designName: z.string().min(0).max(255).nullish(),
  length: z.number().gte(0).nullish(),
  width: z.number().gte(0).nullish(),
  height: z.number().gte(0).nullish(),
  sidesClassification: z.string().nullish(),
  processClassification: z.string().nullish(),
  laminationType: z.string().min(0).max(20).nullish(),
  requirements: z.string().nullish(),
  additionalNotes: z.string().nullish(),
});
const CreateOrderRequest = z.object({
  customerId: z.number().int(),
  assignedToUserId: z.number().int().nullish(),
  deliveryAddress: z.string().min(0).max(500).nullish(),
  totalAmount: z.number().gte(0).optional(),
  depositAmount: z.number().gte(0).optional(),
  deliveryDate: z.string().datetime({ offset: true }).nullish(),
  note: z.string().nullish(),
  recipientCustomerId: z.number().int().nullish(),
  recipientName: z.string().min(0).max(255).nullish(),
  recipientPhone: z.string().min(0).max(20).nullish(),
  recipientAddress: z.string().min(0).max(500).nullish(),
  designRequests: z.array(CreateDesignRequest).nullish(),
});
const ProofingAllocationResponse = z
  .object({
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    quantityTaken: z.number().int(),
    proofingOrderStatus: z.string().nullable(),
  })
  .partial();
const OrderDetailResponse = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    designId: z.number().int(),
    design: DesignResponse,
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    orderTotalAmount: z.number(),
    orderDepositAmount: z.number(),
    derivedStatus: z.string().nullable(),
    cutOverAt: z.string().datetime({ offset: true }).nullable(),
    itemStatus: z.string().nullable(),
    isCutOver: z.boolean(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    proofedQuantity: z.number().int(),
    pendingQuantity: z.number().int(),
    proofingAllocations: z.array(ProofingAllocationResponse).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial();
const PaymentSummaryResponse = z
  .object({
    id: z.number().int(),
    paymentType: z.string().nullable(),
    paymentTypeName: z.string().nullable(),
    method: z.string().nullable(),
    amount: z.number(),
    paidAt: z.string().datetime({ offset: true }),
    transactionCode: z.string().nullable(),
    note: z.string().nullable(),
    createdBy: UserInfo,
  })
  .partial();
const OrderResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    customerId: z.number().int(),
    customer: CustomerSummaryResponse,
    createdBy: z.number().int(),
    creator: UserInfo,
    assignedTo: z.number().int().nullable(),
    assignedUser: UserInfo,
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    totalAmount: z.number(),
    depositAmount: z.number(),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    excelFileUrl: z.string().nullable(),
    note: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    customerPhone: z.string().nullable(),
    customerEmail: z.string().nullable(),
    customerTaxCode: z.string().nullable(),
    customerAddress: z.string().nullable(),
    recipientCustomerId: z.number().int().nullable(),
    recipientCustomer: CustomerSummaryResponse,
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    recipientAddress: z.string().nullable(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    paymentDueDate: z.string().datetime({ offset: true }).nullable(),
    isComplete: z.boolean(),
    missingFields: z.array(z.string()).nullable(),
    orderDetails: z.array(OrderDetailResponse).nullable(),
    payments: z.array(PaymentSummaryResponse).nullable(),
  })
  .partial();
const OrderResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderResponse).nullable(),
  })
  .partial();
const UpdateOrderRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    deliveryAddress: z.string().min(0).max(500).nullable(),
    totalAmount: z.number().gte(0).nullable(),
    depositAmount: z.number().gte(0).nullable(),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    note: z.string().nullable(),
    assignedToUserId: z.number().int().nullable(),
    recipientCustomerId: z.number().int().nullable(),
    recipientName: z.string().min(0).max(255).nullable(),
    recipientPhone: z.string().min(0).max(20).nullable(),
    recipientAddress: z.string().min(0).max(500).nullable(),
  })
  .partial();
const AddDesignToOrderRequest = z.object({
  designId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
});
const OrderDetailResponseForDesigner = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    designId: z.number().int(),
    derivedStatus: z.string().nullable(),
    cutOverAt: z.string().datetime({ offset: true }).nullable(),
    itemStatus: z.string().nullable(),
    isCutOver: z.boolean(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    design: DesignResponse,
  })
  .partial();
const OrderResponseForDesigner = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    note: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    orderDetails: z.array(OrderDetailResponseForDesigner).nullable(),
  })
  .partial();
const OrderResponseForDesignerPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderResponseForDesigner).nullable(),
  })
  .partial();
const UpdateOrderDetailForAccountingRequest = z.object({
  orderDetailId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647).nullish(),
  unitPrice: z.number().gte(0).nullish(),
  requirements: z.string().nullish(),
  additionalNotes: z.string().nullish(),
});
const UpdateOrderForAccountingRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    deliveryAddress: z.string().min(0).max(500).nullable(),
    totalAmount: z.number().gte(0).nullable(),
    depositAmount: z.number().gte(0).nullable(),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    note: z.string().nullable(),
    assignedToUserId: z.number().int().nullable(),
    customerName: z.string().min(0).max(255).nullable(),
    customerCompanyName: z.string().min(0).max(255).nullable(),
    customerPhone: z.string().min(0).max(20).nullable(),
    customerEmail: z.string().min(0).max(255).email().nullable(),
    customerTaxCode: z.string().min(0).max(50).nullable(),
    customerAddress: z.string().min(0).max(500).nullable(),
    recipientCustomerId: z.number().int().nullable(),
    recipientName: z.string().min(0).max(255).nullable(),
    recipientPhone: z.string().min(0).max(20).nullable(),
    recipientAddress: z.string().min(0).max(500).nullable(),
    paymentDueDate: z.string().datetime({ offset: true }).nullable(),
    orderDetails: z.array(UpdateOrderDetailForAccountingRequest).nullable(),
  })
  .partial();
const OrderDetailExportResponse = z
  .object({
    id: z.number().int(),
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    designTypeName: z.string().nullable(),
    materialTypeName: z.string().nullable(),
    dimensions: z.string().nullable(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    areaM2: z.number().nullable(),
    sidesClassificationName: z.string().nullable(),
    processClassificationName: z.string().nullable(),
    laminationType: z.string().nullable(),
    laminationTypeName: z.string().nullable(),
  })
  .partial();
const OrderExportResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    note: z.string().nullable(),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    customerPhone: z.string().nullable(),
    customerEmail: z.string().nullable(),
    customerTaxCode: z.string().nullable(),
    customerAddress: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    recipientAddress: z.string().nullable(),
    totalAmount: z.number(),
    depositAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    paymentDueDate: z.string().datetime({ offset: true }).nullable(),
    orderDetails: z.array(OrderDetailExportResponse).nullable(),
    creatorName: z.string().nullable(),
  })
  .partial();
const PaperSizeResponse = z
  .object({
    id: z.number().int(),
    name: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    isCustom: z.boolean(),
  })
  .partial();
const CreatePaymentRequest = z.object({
  orderId: z.number().int(),
  paymentType: z.string().min(0).max(20),
  method: z.string().min(0).max(20),
  amount: z.number().gte(0.01),
  paidAt: z.string().datetime({ offset: true }).nullish(),
  transactionCode: z.string().min(0).max(100).nullish(),
  note: z.string().nullish(),
});
const PaymentResponse = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    accountingId: z.number().int().nullable(),
    paymentType: z.string().nullable(),
    paymentTypeName: z.string().nullable(),
    method: z.string().nullable(),
    methodName: z.string().nullable(),
    amount: z.number(),
    paidAt: z.string().datetime({ offset: true }),
    transactionCode: z.string().nullable(),
    note: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
    orderTotalAmount: z.number(),
    orderPaidAmount: z.number(),
    orderRemainingAmount: z.number(),
  })
  .partial();
const PaymentResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PaymentResponse).nullable(),
  })
  .partial();
const PlateExportResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    plateVendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    plateCount: z.number().int(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const PlateExportResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PlateExportResponse).nullable(),
  })
  .partial();
const CreatePlateVendorRequest = z.object({
  name: z.string().min(0).max(255),
  phone: z.string().min(0).max(20).nullish(),
  email: z.string().min(0).max(255).email().nullish(),
  address: z.string().min(0).max(500).nullish(),
  note: z.string().nullish(),
  isActive: z.boolean().optional(),
});
const PlateVendorResponse = z
  .object({
    id: z.number().int(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    note: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
  })
  .partial();
const PlateVendorResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PlateVendorResponse).nullable(),
  })
  .partial();
const UpdatePlateVendorRequest = z
  .object({
    name: z.string().min(0).max(255).nullable(),
    phone: z.string().min(0).max(20).nullable(),
    email: z.string().min(0).max(255).email().nullable(),
    address: z.string().min(0).max(500).nullable(),
    note: z.string().nullable(),
    isActive: z.boolean().nullable(),
  })
  .partial();
const PlateCountOptionResponse = z
  .object({ value: z.number().int(), label: z.string().nullable() })
  .partial();
const CreateProductionRequest = z.object({
  proofingOrderId: z.number().int(),
  productionLeadId: z.number().int(),
  notes: z.string().nullish(),
});
const ProductionResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    productionLeadId: z.number().int(),
    productionLead: UserInfo,
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    progressPercent: z.number().int(),
    defectNotes: z.string().nullable(),
    wastage: z.number(),
    startedAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial();
const ProductionResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ProductionResponse).nullable(),
  })
  .partial();
const UpdateProductionRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    progressPercent: z.number().int().gte(0).lte(100).nullable(),
    defectNotes: z.string().nullable(),
    wastage: z.number().gte(0).nullable(),
    startedAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const StartProductionRequest = z
  .object({ notes: z.string().nullable() })
  .partial();
const CompleteProductionRequest = z
  .object({
    progressPercent: z.number().int().gte(0).lte(100),
    defectNotes: z.string().nullable(),
    wastage: z.number().gte(0),
  })
  .partial();
const CreateProofingOrderRequest = z.object({
  materialTypeId: z.number().int(),
  designIds: z.array(z.number().int()),
  assignedToId: z.number().int().nullish(),
  notes: z.string().nullish(),
  paperSizeId: z.number().int().nullish(),
  customPaperSize: z.string().nullish(),
});
const DieExportResponse = z
  .object({
    id: z.number().int(),
    imageUrl: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const ProofingOrderDesignResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    designId: z.number().int(),
    design: DesignResponse,
    quantity: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const ProofingOrderResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    materialTypeId: z.number().int(),
    materialType: MaterialTypeResponse,
    createdById: z.number().int(),
    createdBy: UserInfo,
    assignedToId: z.number().int().nullable(),
    assignedTo: UserInfo,
    totalQuantity: z.number().int(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    proofingFileUrl: z.string().nullable(),
    imageUrl: z.string().nullable(),
    notes: z.string().nullable(),
    approvedById: z.number().int().nullable(),
    approvedBy: UserInfo,
    approvedAt: z.string().datetime({ offset: true }).nullable(),
    finalQuantity: z.number().int().nullable(),
    paperSizeId: z.number().int().nullable(),
    paperSize: PaperSizeResponse,
    customPaperSize: z.string().nullable(),
    isPlateExported: z.boolean(),
    isDieExported: z.boolean(),
    plateExport: PlateExportResponse,
    dieExport: DieExportResponse,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    proofingOrderDesigns: z.array(ProofingOrderDesignResponse).nullable(),
    productions: z.array(ProductionResponse).nullable(),
  })
  .partial();
const ProofingOrderResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ProofingOrderResponse).nullable(),
  })
  .partial();
const CreateProofingOrderDetailItem = z.object({
  orderDetailId: z.number().int(),
  quantity: z.number().int(),
});
const CreateProofingOrderFromDesignsRequest = z.object({
  orderDetailItems: z.array(CreateProofingOrderDetailItem),
  totalQuantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().nullish(),
  paperSizeId: z.number().int().nullish(),
  customPaperSize: z.string().nullish(),
});
const UpdateProofingOrderRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    proofingFileUrl: z.string().nullable(),
    assignedToId: z.number().int().nullable(),
    notes: z.string().nullable(),
    paperSizeId: z.number().int().nullable(),
    customPaperSize: z.string().nullable(),
  })
  .partial();
const ApproveProofingOrderRequest = z
  .object({
    finalQuantity: z.number().int().nullable(),
    approvalNotes: z.string().nullable(),
  })
  .partial();
const RecordPlateExportRequest = z
  .object({
    plateVendorId: z.number().int().nullable(),
    vendorName: z.string().min(0).max(255).nullable(),
    plateCount: z.number().int().gte(1).lte(6),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
  })
  .partial();
const RecordDieExportRequest = z
  .object({ imageUrl: z.string().nullable(), notes: z.string().nullable() })
  .partial();
const CreateUserRequest = z.object({
  username: z.string().min(0).max(100),
  password: z.string().min(6).max(100),
  fullName: z.string().min(0).max(255),
  role: z
    .string()
    .min(1)
    .regex(
      /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/
    ),
  email: z.string().min(0).max(255).email().nullish(),
  phone: z.string().min(0).max(20).nullish(),
});
const UserResponse = z
  .object({
    id: z.number().int(),
    username: z.string().nullable(),
    fullName: z.string().nullable(),
    role: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial();
const UserResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(UserResponse).nullable(),
  })
  .partial();
const UpdateUserRequest = z
  .object({
    fullName: z.string().min(0).max(255).nullable(),
    role: z
      .string()
      .regex(
        /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/
      )
      .nullable(),
    email: z.string().min(0).max(255).email().nullable(),
    phone: z.string().min(0).max(20).nullable(),
    isActive: z.boolean().nullable(),
  })
  .partial();
const ChangePasswordRequest = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
  confirmPassword: z.string().min(1),
});
const UserKpiResponse = z
  .object({
    userId: z.number().int(),
    fullName: z.string().nullable(),
    role: z.string().nullable(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    totalDesignsAssigned: z.number().int(),
    designsCompleted: z.number().int(),
    designsInProgress: z.number().int(),
    designCompletionRate: z.number(),
    averageDesignTimeHours: z.number(),
    totalProofingOrdersAssigned: z.number().int(),
    proofingOrdersCompleted: z.number().int(),
    proofingOrdersInProgress: z.number().int(),
    proofingCompletionRate: z.number(),
    totalProductionsAssigned: z.number().int(),
    productionsCompleted: z.number().int(),
    productionsInProgress: z.number().int(),
    productionCompletionRate: z.number(),
    totalOrdersHandled: z.number().int(),
    totalRevenueGenerated: z.number(),
  })
  .partial();
const TeamKpiSummaryResponse = z
  .object({
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    userKpis: z.array(UserKpiResponse).nullable(),
    totalDesignsCompleted: z.number().int(),
    totalProofingOrdersCompleted: z.number().int(),
    totalProductionsCompleted: z.number().int(),
    totalRevenue: z.number(),
  })
  .partial();

export const schemas = {
  AccountingResponse,
  ConfirmPaymentRequest,
  ExportDebtRequest,
  LoginRequest,
  UserInfo,
  LoginResponse,
  ErrorResponse,
  RoleDefinition,
  RolesResponse,
  ConstantGroup,
  ConstantsResponse,
  CreateCustomerRequest,
  CustomerResponse,
  CustomerSummaryResponse,
  CustomerSummaryResponsePaginate,
  UpdateCustomerRequest,
  CustomerDebtHistoryResponse,
  CustomerMonthlyDebtResponse,
  CustomerDebtSummaryResponse,
  FrequentProductResponse,
  CustomerStatisticsResponse,
  OrderHistoryDetailResponse,
  CustomerOrderHistoryResponse,
  CustomerOrderHistoryResponsePaginate,
  CreateDeliveryNoteRequest,
  DeliveryNoteOrderResponse,
  DeliveryNoteResponse,
  DeliveryNoteResponsePaginate,
  UpdateDeliveryStatusRequest,
  RecreateDeliveryNoteRequest,
  DesignTypeResponse,
  MaterialTypeResponse,
  DesignTimelineEntryResponse,
  DesignResponse,
  UpdateDesignRequest,
  DesignResponsePaginate,
  postApidesignsIdtimeline_Body,
  CreateDesignTypeRequest,
  DesignTypeResponsePaginate,
  UpdateDesignTypeRequest,
  CreateInvoiceItemRequest,
  CreateInvoiceRequest,
  InvoiceOrderResponse,
  InvoiceItemResponse,
  InvoiceResponse,
  UpdateInvoiceRequest,
  CreateMaterialTypeRequest,
  MaterialTypeResponsePaginate,
  MaterialTypeItem,
  BulkCreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  CreateDesignRequest,
  CreateOrderRequest,
  ProofingAllocationResponse,
  OrderDetailResponse,
  PaymentSummaryResponse,
  OrderResponse,
  OrderResponsePaginate,
  UpdateOrderRequest,
  AddDesignToOrderRequest,
  OrderDetailResponseForDesigner,
  OrderResponseForDesigner,
  OrderResponseForDesignerPaginate,
  UpdateOrderDetailForAccountingRequest,
  UpdateOrderForAccountingRequest,
  OrderDetailExportResponse,
  OrderExportResponse,
  PaperSizeResponse,
  CreatePaymentRequest,
  PaymentResponse,
  PaymentResponsePaginate,
  PlateExportResponse,
  PlateExportResponsePaginate,
  CreatePlateVendorRequest,
  PlateVendorResponse,
  PlateVendorResponsePaginate,
  UpdatePlateVendorRequest,
  PlateCountOptionResponse,
  CreateProductionRequest,
  ProductionResponse,
  ProductionResponsePaginate,
  UpdateProductionRequest,
  StartProductionRequest,
  CompleteProductionRequest,
  CreateProofingOrderRequest,
  DieExportResponse,
  ProofingOrderDesignResponse,
  ProofingOrderResponse,
  ProofingOrderResponsePaginate,
  CreateProofingOrderDetailItem,
  CreateProofingOrderFromDesignsRequest,
  UpdateProofingOrderRequest,
  ApproveProofingOrderRequest,
  RecordPlateExportRequest,
  RecordDieExportRequest,
  CreateUserRequest,
  UserResponse,
  UserResponsePaginate,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserKpiResponse,
  TeamKpiSummaryResponse,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/accountings/:accountingId/confirm-payment",
    alias: "postApiaccountingsAccountingIdconfirmPayment",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ConfirmPaymentRequest,
      },
      {
        name: "accountingId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: AccountingResponse,
  },
  {
    method: "post",
    path: "/api/accountings/export-debt",
    alias: "postApiaccountingsexportDebt",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ExportDebtRequest,
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "post",
    path: "/api/accountings/order/:orderId",
    alias: "postApiaccountingsorderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: AccountingResponse,
  },
  {
    method: "get",
    path: "/api/accountings/order/:orderId",
    alias: "getApiaccountingsorderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: AccountingResponse,
  },
  {
    method: "post",
    path: "/api/accountings/order/:orderId/approve-debt",
    alias: "postApiaccountingsorderOrderIdapproveDebt",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/accountings/order/:orderId/confirm-deposit",
    alias: "postApiaccountingsorderOrderIdconfirmDeposit",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "depositAmount",
        type: "Query",
        schema: z.number().optional(),
      },
    ],
    response: AccountingResponse,
  },
  {
    method: "post",
    path: "/api/auth/login",
    alias: "postApiauthlogin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: LoginResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: ErrorResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/auth/roles",
    alias: "getApiauthroles",
    requestFormat: "json",
    response: RolesResponse,
  },
  {
    method: "get",
    path: "/api/constants",
    alias: "getApiconstants",
    requestFormat: "json",
    response: ConstantsResponse,
  },
  {
    method: "post",
    path: "/api/customers",
    alias: "postApicustomers",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCustomerRequest,
      },
    ],
    response: CustomerResponse,
  },
  {
    method: "get",
    path: "/api/customers",
    alias: "getApicustomers",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "debtStatus",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CustomerSummaryResponsePaginate,
  },
  {
    method: "put",
    path: "/api/customers/:id",
    alias: "putApicustomersId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCustomerRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerResponse,
  },
  {
    method: "get",
    path: "/api/customers/:id",
    alias: "getApicustomersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerResponse,
  },
  {
    method: "get",
    path: "/api/customers/:id/debt-history",
    alias: "getApicustomersIddebtHistory",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: z.array(CustomerDebtHistoryResponse),
  },
  {
    method: "get",
    path: "/api/customers/:id/debt-summary",
    alias: "getApicustomersIddebtSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: CustomerDebtSummaryResponse,
  },
  {
    method: "post",
    path: "/api/customers/:id/export-debt-comparison",
    alias: "postApicustomersIdexportDebtComparison",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/customers/:id/monthly-debt",
    alias: "getApicustomersIdmonthlyDebt",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "year",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "month",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: CustomerMonthlyDebtResponse,
  },
  {
    method: "get",
    path: "/api/customers/:id/order-history",
    alias: "getApicustomersIdorderHistory",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
    ],
    response: CustomerOrderHistoryResponsePaginate,
  },
  {
    method: "get",
    path: "/api/customers/:id/statistics",
    alias: "getApicustomersIdstatistics",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerStatisticsResponse,
  },
  {
    method: "post",
    path: "/api/delivery-notes",
    alias: "postApideliveryNotes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDeliveryNoteRequest,
      },
    ],
    response: DeliveryNoteResponse,
  },
  {
    method: "get",
    path: "/api/delivery-notes",
    alias: "getApideliveryNotes",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DeliveryNoteResponsePaginate,
  },
  {
    method: "get",
    path: "/api/delivery-notes/:id",
    alias: "getApideliveryNotesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DeliveryNoteResponse,
  },
  {
    method: "get",
    path: "/api/delivery-notes/:id/export-pdf",
    alias: "getApideliveryNotesIdexportPdf",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "put",
    path: "/api/delivery-notes/:id/status",
    alias: "putApideliveryNotesIdstatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDeliveryStatusRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DeliveryNoteResponse,
  },
  {
    method: "post",
    path: "/api/delivery-notes/recreate",
    alias: "postApideliveryNotesrecreate",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecreateDeliveryNoteRequest,
      },
    ],
    response: DeliveryNoteResponse,
  },
  {
    method: "get",
    path: "/api/designs",
    alias: "getApidesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "designerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "month",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "year",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: DesignResponsePaginate,
  },
  {
    method: "get",
    path: "/api/designs/:id",
    alias: "getApidesignsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DesignResponse,
  },
  {
    method: "put",
    path: "/api/designs/:id",
    alias: "putApidesignsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDesignRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DesignResponse,
  },
  {
    method: "post",
    path: "/api/designs/:id/generate-excel",
    alias: "postApidesignsIdgenerateExcel",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/api/designs/:id/timeline",
    alias: "postApidesignsIdtimeline",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApidesignsIdtimeline_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DesignTimelineEntryResponse,
  },
  {
    method: "get",
    path: "/api/designs/:id/timeline",
    alias: "getApidesignsIdtimeline",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(DesignTimelineEntryResponse),
  },
  {
    method: "post",
    path: "/api/designs/:id/upload-design-file",
    alias: "postApidesignsIduploadDesignFile",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ File: z.instanceof(File) }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/api/designs/:id/upload-design-image",
    alias: "postApidesignsIduploadDesignImage",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ File: z.instanceof(File) }).passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "get",
    path: "/api/designs/by-customer/:customerId",
    alias: "getApidesignsbyCustomerCustomerId",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(DesignResponse),
  },
  {
    method: "post",
    path: "/api/designs/materials",
    alias: "postApidesignsmaterials",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMaterialTypeRequest,
      },
    ],
    response: MaterialTypeResponse,
  },
  {
    method: "get",
    path: "/api/designs/materials",
    alias: "getApidesignsmaterials",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: MaterialTypeResponsePaginate,
  },
  {
    method: "put",
    path: "/api/designs/materials/:id",
    alias: "putApidesignsmaterialsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMaterialTypeRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MaterialTypeResponse,
  },
  {
    method: "delete",
    path: "/api/designs/materials/:id",
    alias: "deleteApidesignsmaterialsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/designs/materials/:id",
    alias: "getApidesignsmaterialsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MaterialTypeResponse,
  },
  {
    method: "post",
    path: "/api/designs/materials/bulk",
    alias: "postApidesignsmaterialsbulk",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: BulkCreateMaterialTypeRequest,
      },
    ],
    response: z.array(MaterialTypeResponse),
  },
  {
    method: "get",
    path: "/api/designs/materials/design-type/:designTypeId",
    alias: "getApidesignsmaterialsdesignTypeDesignTypeId",
    requestFormat: "json",
    parameters: [
      {
        name: "designTypeId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(MaterialTypeResponse),
  },
  {
    method: "get",
    path: "/api/designs/my",
    alias: "getApidesignsmy",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "month",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "year",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: DesignResponsePaginate,
  },
  {
    method: "post",
    path: "/api/designs/types",
    alias: "postApidesignstypes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDesignTypeRequest,
      },
    ],
    response: DesignTypeResponse,
  },
  {
    method: "get",
    path: "/api/designs/types",
    alias: "getApidesignstypes",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DesignTypeResponsePaginate,
  },
  {
    method: "put",
    path: "/api/designs/types/:id",
    alias: "putApidesignstypesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDesignTypeRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DesignTypeResponse,
  },
  {
    method: "delete",
    path: "/api/designs/types/:id",
    alias: "deleteApidesignstypesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/designs/types/:id",
    alias: "getApidesignstypesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DesignTypeResponse,
  },
  {
    method: "get",
    path: "/api/designs/user/:userId",
    alias: "getApidesignsuserUserId",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "month",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "year",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(DesignResponse),
  },
  {
    method: "post",
    path: "/api/invoices",
    alias: "postApiinvoices",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateInvoiceRequest,
      },
    ],
    response: InvoiceResponse,
  },
  {
    method: "get",
    path: "/api/invoices/:id",
    alias: "getApiinvoicesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: InvoiceResponse,
  },
  {
    method: "put",
    path: "/api/invoices/:id",
    alias: "putApiinvoicesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateInvoiceRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: InvoiceResponse,
  },
  {
    method: "get",
    path: "/api/invoices/:id/export-sinvoice",
    alias: "getApiinvoicesIdexportSinvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/invoices/by-order/:orderId",
    alias: "getApiinvoicesbyOrderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(InvoiceResponse),
  },
  {
    method: "post",
    path: "/api/invoices/order/:orderId",
    alias: "postApiinvoicesorderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "get",
    path: "/api/invoices/order/:orderId",
    alias: "getApiinvoicesorderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/api/orders",
    alias: "postApiorders",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateOrderRequest,
      },
    ],
    response: OrderResponse,
  },
  {
    method: "get",
    path: "/api/orders",
    alias: "getApiorders",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: OrderResponsePaginate,
  },
  {
    method: "put",
    path: "/api/orders/:id",
    alias: "putApiordersId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateOrderRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
  },
  {
    method: "get",
    path: "/api/orders/:id",
    alias: "getApiordersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
  },
  {
    method: "put",
    path: "/api/orders/:id/accounting",
    alias: "putApiordersIdaccounting",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateOrderForAccountingRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
  },
  {
    method: "put",
    path: "/api/orders/:id/add-design",
    alias: "putApiordersIdaddDesign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddDesignToOrderRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
  },
  {
    method: "get",
    path: "/api/orders/:id/export-data",
    alias: "getApiordersIdexportData",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderExportResponse,
  },
  {
    method: "post",
    path: "/api/orders/:id/export-delivery-note",
    alias: "postApiordersIdexportDeliveryNote",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "post",
    path: "/api/orders/:id/export-invoice",
    alias: "postApiordersIdexportInvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/orders/:id/export-pdf",
    alias: "getApiordersIdexportPdf",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "post",
    path: "/api/orders/:id/generate-excel",
    alias: "postApiordersIdgenerateExcel",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/api/orders/:id/recalculate-total",
    alias: "postApiordersIdrecalculateTotal",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
  },
  {
    method: "get",
    path: "/api/orders/:id/validate-export",
    alias: "getApiordersIdvalidateExport",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/api/orders/for-accounting",
    alias: "getApiordersforAccounting",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "filterType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderResponsePaginate,
  },
  {
    method: "get",
    path: "/api/orders/for-designer",
    alias: "getApiordersforDesigner",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderResponseForDesignerPaginate,
  },
  {
    method: "get",
    path: "/api/orders/my",
    alias: "getApiordersmy",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: OrderResponsePaginate,
  },
  {
    method: "get",
    path: "/api/paper-sizes",
    alias: "getApipaperSizes",
    requestFormat: "json",
    response: z.array(PaperSizeResponse),
  },
  {
    method: "post",
    path: "/api/payments",
    alias: "postApipayments",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePaymentRequest,
      },
    ],
    response: PaymentResponse,
  },
  {
    method: "get",
    path: "/api/payments/:id",
    alias: "getApipaymentsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PaymentResponse,
  },
  {
    method: "get",
    path: "/api/payments/by-customer/:customerId",
    alias: "getApipaymentsbyCustomerCustomerId",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
    ],
    response: PaymentResponsePaginate,
  },
  {
    method: "get",
    path: "/api/payments/by-order/:orderId",
    alias: "getApipaymentsbyOrderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(PaymentResponse),
  },
  {
    method: "get",
    path: "/api/plate-exports",
    alias: "getApiplateExports",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "fromDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "toDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: PlateExportResponsePaginate,
  },
  {
    method: "get",
    path: "/api/plate-exports/:id",
    alias: "getApiplateExportsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PlateExportResponse,
  },
  {
    method: "post",
    path: "/api/plate-vendors",
    alias: "postApiplateVendors",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePlateVendorRequest,
      },
    ],
    response: PlateVendorResponse,
  },
  {
    method: "get",
    path: "/api/plate-vendors",
    alias: "getApiplateVendors",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: PlateVendorResponsePaginate,
  },
  {
    method: "put",
    path: "/api/plate-vendors/:id",
    alias: "putApiplateVendorsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePlateVendorRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PlateVendorResponse,
  },
  {
    method: "get",
    path: "/api/plate-vendors/:id",
    alias: "getApiplateVendorsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PlateVendorResponse,
  },
  {
    method: "delete",
    path: "/api/plate-vendors/:id",
    alias: "deleteApiplateVendorsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/plate-vendors/active",
    alias: "getApiplateVendorsactive",
    requestFormat: "json",
    response: z.array(PlateVendorResponse),
  },
  {
    method: "get",
    path: "/api/plate-vendors/plate-count-options",
    alias: "getApiplateVendorsplateCountOptions",
    requestFormat: "json",
    response: z.array(PlateCountOptionResponse),
  },
  {
    method: "post",
    path: "/api/productions",
    alias: "postApiproductions",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateProductionRequest,
      },
    ],
    response: ProductionResponse,
  },
  {
    method: "get",
    path: "/api/productions",
    alias: "getApiproductions",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "proofingOrderId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "productionLeadId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProductionResponsePaginate,
  },
  {
    method: "put",
    path: "/api/productions/:id",
    alias: "putApiproductionsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProductionRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionResponse,
  },
  {
    method: "get",
    path: "/api/productions/:id",
    alias: "getApiproductionsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionResponse,
  },
  {
    method: "post",
    path: "/api/productions/:id/complete",
    alias: "postApiproductionsIdcomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CompleteProductionRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionResponse,
  },
  {
    method: "post",
    path: "/api/productions/:id/start",
    alias: "postApiproductionsIdstart",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ notes: z.string().nullable() }).partial(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionResponse,
  },
  {
    method: "get",
    path: "/api/productions/proofing-order/:proofingOrderId",
    alias: "getApiproductionsproofingOrderProofingOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(ProductionResponse),
  },
  {
    method: "post",
    path: "/api/proofing-orders",
    alias: "postApiproofingOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateProofingOrderRequest,
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "get",
    path: "/api/proofing-orders",
    alias: "getApiproofingOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "materialTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProofingOrderResponsePaginate,
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id",
    alias: "putApiproofingOrdersId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProofingOrderRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "get",
    path: "/api/proofing-orders/:id",
    alias: "getApiproofingOrdersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id/approve",
    alias: "putApiproofingOrdersIdapprove",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ApproveProofingOrderRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id/complete",
    alias: "putApiproofingOrdersIdcomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "post",
    path: "/api/proofing-orders/:id/die-export",
    alias: "postApiproofingOrdersIddieExport",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecordDieExportRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "get",
    path: "/api/proofing-orders/:id/download-file",
    alias: "getApiproofingOrdersIddownloadFile",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id/hand-to-production",
    alias: "putApiproofingOrdersIdhandToProduction",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id/pause",
    alias: "putApiproofingOrdersIdpause",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "reason",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "post",
    path: "/api/proofing-orders/:id/plate-export",
    alias: "postApiproofingOrdersIdplateExport",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecordPlateExportRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "put",
    path: "/api/proofing-orders/:id/update-file",
    alias: "putApiproofingOrdersIdupdateFile",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ proofingFile: z.instanceof(File) })
          .partial()
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "post",
    path: "/api/proofing-orders/:id/upload-file",
    alias: "postApiproofingOrdersIduploadFile",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ proofingFile: z.instanceof(File) })
          .partial()
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "post",
    path: "/api/proofing-orders/:id/upload-image",
    alias: "postApiproofingOrdersIduploadImage",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ imageFile: z.instanceof(File) })
          .partial()
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "get",
    path: "/api/proofing-orders/available-order-details",
    alias: "getApiproofingOrdersavailableOrderDetails",
    requestFormat: "json",
    parameters: [
      {
        name: "materialTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(OrderDetailResponse),
  },
  {
    method: "get",
    path: "/api/proofing-orders/available-quantity/:designId",
    alias: "getApiproofingOrdersavailableQuantityDesignId",
    requestFormat: "json",
    parameters: [
      {
        name: "designId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/api/proofing-orders/by-order/:orderId",
    alias: "getApiproofingOrdersbyOrderOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(ProofingOrderResponse),
  },
  {
    method: "get",
    path: "/api/proofing-orders/for-production",
    alias: "getApiproofingOrdersforProduction",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ProofingOrderResponsePaginate,
  },
  {
    method: "post",
    path: "/api/proofing-orders/from-designs",
    alias: "postApiproofingOrdersfromDesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateProofingOrderFromDesignsRequest,
      },
    ],
    response: ProofingOrderResponse,
  },
  {
    method: "post",
    path: "/api/users",
    alias: "postApiusers",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateUserRequest,
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: ErrorResponse,
      },
      {
        status: 403,
        description: `Forbidden`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/users",
    alias: "getApiusers",
    requestFormat: "json",
    parameters: [
      {
        name: "pageNumber",
        type: "Query",
        schema: z.number().int().optional().default(1),
      },
      {
        name: "pageSize",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "role",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: UserResponsePaginate,
  },
  {
    method: "get",
    path: "/api/users/:id",
    alias: "getApiusersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "put",
    path: "/api/users/:id",
    alias: "putApiusersId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateUserRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 403,
        description: `Forbidden`,
        schema: ErrorResponse,
      },
      {
        status: 404,
        description: `Not Found`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "delete",
    path: "/api/users/:id",
    alias: "deleteApiusersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 403,
        description: `Forbidden`,
        schema: ErrorResponse,
      },
      {
        status: 404,
        description: `Not Found`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/api/users/:id/change-password",
    alias: "postApiusersIdchangePassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChangePasswordRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: ErrorResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/users/:id/kpi",
    alias: "getApiusersIdkpi",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "fromDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "toDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: UserKpiResponse,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/api/users/designers",
    alias: "getApiusersdesigners",
    requestFormat: "json",
    response: z.array(UserResponse),
  },
  {
    method: "get",
    path: "/api/users/kpi/team",
    alias: "getApiuserskpiteam",
    requestFormat: "json",
    parameters: [
      {
        name: "fromDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "toDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "role",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: TeamKpiSummaryResponse,
  },
  {
    method: "get",
    path: "/api/users/username/:username",
    alias: "getApiusersusernameUsername",
    requestFormat: "json",
    parameters: [
      {
        name: "username",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: ErrorResponse,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
