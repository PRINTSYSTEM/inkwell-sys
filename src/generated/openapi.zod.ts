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
const BankLedgerEntryResponse = z
  .object({
    date: z.string().datetime({ offset: true }),
    voucherCode: z.string().nullable(),
    description: z.string().nullable(),
    objectName: z.string().nullable(),
    debitAmount: z.number(),
    creditAmount: z.number(),
    runningBalance: z.number(),
    reference: z.string().nullable(),
    voucherType: z.string().nullable(),
    voucherId: z.number().int(),
  })
  .partial();
const BankLedgerResponse = z
  .object({
    bankAccountId: z.number().int(),
    bankAccountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    openingBalance: z.number(),
    entries: z.array(BankLedgerEntryResponse).nullable(),
    totalDebit: z.number(),
    totalCredit: z.number(),
    closingBalance: z.number(),
  })
  .partial();
const CashBookEntryResponse = z
  .object({
    date: z.string().datetime({ offset: true }),
    voucherCode: z.string().nullable(),
    description: z.string().nullable(),
    objectName: z.string().nullable(),
    receiptAmount: z.number(),
    paymentAmount: z.number(),
    runningBalance: z.number(),
    reference: z.string().nullable(),
    voucherType: z.string().nullable(),
    voucherId: z.number().int(),
  })
  .partial();
const CashBookResponse = z
  .object({
    openingBalance: z.number(),
    entries: z.array(CashBookEntryResponse).nullable(),
    totalReceipt: z.number(),
    totalPayment: z.number(),
    closingBalance: z.number(),
  })
  .partial();
const CreateCashPaymentRequest = z.object({
  voucherDate: z.string().datetime({ offset: true }),
  postingDate: z.string().datetime({ offset: true }),
  receiverName: z.string().min(0).max(200),
  expenseCategoryId: z.number().int(),
  reason: z.string().min(0).max(500).nullish(),
  amount: z.number().gte(0.01),
  paymentMethodId: z.number().int(),
  orderId: z.number().int().nullish(),
  vendorId: z.number().int().nullish(),
  cashFundId: z.number().int().nullish(),
  bankAccountId: z.number().int().nullish(),
  notes: z.string().min(0).max(1000).nullish(),
});
const CashPaymentResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    voucherDate: z.string().datetime({ offset: true }),
    postingDate: z.string().datetime({ offset: true }),
    receiverName: z.string().nullable(),
    reason: z.string().nullable(),
    amount: z.number(),
    status: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    approvedAt: z.string().datetime({ offset: true }).nullable(),
    postedAt: z.string().datetime({ offset: true }).nullable(),
    expenseCategoryId: z.number().int().nullable(),
    expenseCategoryName: z.string().nullable(),
    paymentMethodId: z.number().int(),
    paymentMethodName: z.string().nullable(),
    orderId: z.number().int().nullable(),
    orderCode: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    cashFundId: z.number().int().nullable(),
    cashFundName: z.string().nullable(),
    bankAccountId: z.number().int().nullable(),
    bankAccountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    createdById: z.number().int(),
    createdByName: z.string().nullable(),
    approvedById: z.number().int().nullable(),
    approvedByName: z.string().nullable(),
    postedById: z.number().int().nullable(),
    postedByName: z.string().nullable(),
  })
  .partial();
const CashPaymentResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CashPaymentResponse).nullable(),
  })
  .partial();
const UpdateCashPaymentRequest = z.object({
  voucherDate: z.string().datetime({ offset: true }),
  postingDate: z.string().datetime({ offset: true }),
  receiverName: z.string().min(0).max(200),
  expenseCategoryId: z.number().int(),
  reason: z.string().min(0).max(500).nullish(),
  amount: z.number().gte(0.01),
  paymentMethodId: z.number().int(),
  orderId: z.number().int().nullish(),
  vendorId: z.number().int().nullish(),
  cashFundId: z.number().int().nullish(),
  bankAccountId: z.number().int().nullish(),
  notes: z.string().min(0).max(1000).nullish(),
});
const CreateCashReceiptRequest = z.object({
  voucherDate: z.string().datetime({ offset: true }),
  postingDate: z.string().datetime({ offset: true }),
  payerName: z.string().min(0).max(200),
  expenseCategoryId: z.number().int().nullish(),
  reason: z.string().min(0).max(500).nullish(),
  amount: z.number().gte(0.01),
  paymentMethodId: z.number().int(),
  orderId: z.number().int().nullish(),
  invoiceId: z.number().int().nullish(),
  customerId: z.number().int().nullish(),
  cashFundId: z.number().int().nullish(),
  bankAccountId: z.number().int().nullish(),
  notes: z.string().min(0).max(1000).nullish(),
});
const CashReceiptResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    voucherDate: z.string().datetime({ offset: true }),
    postingDate: z.string().datetime({ offset: true }),
    payerName: z.string().nullable(),
    reason: z.string().nullable(),
    amount: z.number(),
    status: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    approvedAt: z.string().datetime({ offset: true }).nullable(),
    postedAt: z.string().datetime({ offset: true }).nullable(),
    expenseCategoryId: z.number().int().nullable(),
    expenseCategoryName: z.string().nullable(),
    paymentMethodId: z.number().int(),
    paymentMethodName: z.string().nullable(),
    orderId: z.number().int().nullable(),
    orderCode: z.string().nullable(),
    invoiceId: z.number().int().nullable(),
    invoiceNumber: z.string().nullable(),
    customerId: z.number().int().nullable(),
    customerName: z.string().nullable(),
    cashFundId: z.number().int().nullable(),
    cashFundName: z.string().nullable(),
    bankAccountId: z.number().int().nullable(),
    bankAccountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    createdById: z.number().int(),
    createdByName: z.string().nullable(),
    approvedById: z.number().int().nullable(),
    approvedByName: z.string().nullable(),
    postedById: z.number().int().nullable(),
    postedByName: z.string().nullable(),
  })
  .partial();
const CashReceiptResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CashReceiptResponse).nullable(),
  })
  .partial();
const UpdateCashReceiptRequest = z.object({
  voucherDate: z.string().datetime({ offset: true }),
  postingDate: z.string().datetime({ offset: true }),
  payerName: z.string().min(0).max(200),
  expenseCategoryId: z.number().int().nullish(),
  reason: z.string().min(0).max(500).nullish(),
  amount: z.number().gte(0.01),
  paymentMethodId: z.number().int(),
  orderId: z.number().int().nullish(),
  invoiceId: z.number().int().nullish(),
  customerId: z.number().int().nullish(),
  cashFundId: z.number().int().nullish(),
  bankAccountId: z.number().int().nullish(),
  notes: z.string().min(0).max(1000).nullish(),
});
const ExpenseCategoryResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    type: z.string().nullable(),
    description: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const ExpenseCategoryResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ExpenseCategoryResponse).nullable(),
  })
  .partial();
const CreateExpenseCategoryRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  type: z
    .string()
    .min(1)
    .regex(/^(income|expense)$/),
  description: z.string().min(0).max(500).nullish(),
  isActive: z.boolean().optional(),
});
const UpdateExpenseCategoryRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  type: z
    .string()
    .min(1)
    .regex(/^(income|expense)$/),
  description: z.string().min(0).max(500).nullish(),
  isActive: z.boolean().optional(),
});
const PaymentMethodResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const PaymentMethodResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PaymentMethodResponse).nullable(),
  })
  .partial();
const CreatePaymentMethodRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  isActive: z.boolean().optional(),
});
const UpdatePaymentMethodRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  isActive: z.boolean().optional(),
});
const CashFundResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    openingBalance: z.number(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const CashFundResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CashFundResponse).nullable(),
  })
  .partial();
const CreateCashFundRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  openingBalance: z.number().gte(0).optional(),
  isActive: z.boolean().optional(),
});
const UpdateCashFundRequest = z.object({
  code: z.string().min(0).max(50),
  name: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  openingBalance: z.number().gte(0).optional(),
  isActive: z.boolean().optional(),
});
const BankAccountResponse = z
  .object({
    id: z.number().int(),
    accountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    bankBranch: z.string().nullable(),
    accountHolder: z.string().nullable(),
    description: z.string().nullable(),
    openingBalance: z.number(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const BankAccountResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(BankAccountResponse).nullable(),
  })
  .partial();
const CreateBankAccountRequest = z.object({
  accountNumber: z.string().min(0).max(50),
  bankName: z.string().min(0).max(200),
  bankBranch: z.string().min(0).max(200).nullish(),
  accountHolder: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  openingBalance: z.number().gte(0).optional(),
  isActive: z.boolean().optional(),
});
const UpdateBankAccountRequest = z.object({
  accountNumber: z.string().min(0).max(50),
  bankName: z.string().min(0).max(200),
  bankBranch: z.string().min(0).max(200).nullish(),
  accountHolder: z.string().min(0).max(200),
  description: z.string().min(0).max(500).nullish(),
  openingBalance: z.number().gte(0).optional(),
  isActive: z.boolean().optional(),
});
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
    sidesClassification: ConstantGroup,
    processClassification: ConstantGroup,
    vendorTypes: ConstantGroup,
    deliveryNoteStatuses: ConstantGroup,
    deliveryLineStatuses: ConstantGroup,
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
const CustomerDebtHistoryResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CustomerDebtHistoryResponse).nullable(),
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
const ARSummaryResponse = z
  .object({
    customerId: z.number().int(),
    customerCode: z.string().nullable(),
    customerName: z.string().nullable(),
    companyName: z.string().nullable(),
    openingBalance: z.number(),
    increase: z.number(),
    decrease: z.number(),
    closingBalance: z.number(),
    overdue: z.number(),
  })
  .partial();
const ARSummaryResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARSummaryResponse).nullable(),
  })
  .partial();
const ARDetailResponse = z
  .object({
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    documentId: z.number().int().nullable(),
    documentDate: z.string().datetime({ offset: true }),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    amountDue: z.number(),
    amountPaid: z.number(),
    outstanding: z.number(),
    overdueDays: z.number().int(),
  })
  .partial();
const ARDetailResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARDetailResponse).nullable(),
  })
  .partial();
const ARAgingResponse = z
  .object({
    customerId: z.number().int(),
    customerCode: z.string().nullable(),
    customerName: z.string().nullable(),
    companyName: z.string().nullable(),
    notDue: z.number(),
    days0_30: z.number(),
    days31_60: z.number(),
    days61_90: z.number(),
    daysOver90: z.number(),
    total: z.number(),
  })
  .partial();
const ARAgingResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARAgingResponse).nullable(),
  })
  .partial();
const CollectionScheduleResponse = z
  .object({
    dueDate: z.string().datetime({ offset: true }),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    documentId: z.number().int().nullable(),
    amountDue: z.number(),
    notes: z.string().nullable(),
  })
  .partial();
const CollectionScheduleResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CollectionScheduleResponse).nullable(),
  })
  .partial();
const APSummaryResponse = z
  .object({
    vendorId: z.number().int(),
    vendorCode: z.string().nullable(),
    vendorName: z.string().nullable(),
    openingBalance: z.number(),
    increase: z.number(),
    decrease: z.number(),
    closingBalance: z.number(),
    overdue: z.number(),
  })
  .partial();
const APSummaryResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APSummaryResponse).nullable(),
  })
  .partial();
const APDetailResponse = z
  .object({
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    documentId: z.number().int().nullable(),
    documentDate: z.string().datetime({ offset: true }),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    amountDue: z.number(),
    amountPaid: z.number(),
    outstanding: z.number(),
    overdueDays: z.number().int(),
  })
  .partial();
const APDetailResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APDetailResponse).nullable(),
  })
  .partial();
const APAgingResponse = z
  .object({
    vendorId: z.number().int(),
    vendorCode: z.string().nullable(),
    vendorName: z.string().nullable(),
    notDue: z.number(),
    days0_30: z.number(),
    days31_60: z.number(),
    days61_90: z.number(),
    daysOver90: z.number(),
    total: z.number(),
  })
  .partial();
const APAgingResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APAgingResponse).nullable(),
  })
  .partial();
const DeliveryLineRequest = z.object({
  orderDetailId: z.number().int(),
  deliveryQty: z.number().int().gte(1).lte(2147483647),
});
const CreateDeliveryNoteRequest = z
  .object({
    orderIds: z.array(z.number().int()).nullable(),
    lines: z.array(DeliveryLineRequest).nullable(),
    recipientName: z.string().min(0).max(255).nullable(),
    recipientPhone: z.string().min(0).max(20).nullable(),
    deliveryAddress: z.string().min(0).max(500).nullable(),
    notes: z.string().nullable(),
  })
  .partial();
const DeliveryNoteOrderResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    customerName: z.string().nullable(),
    totalAmount: z.number(),
    deliveryAddress: z.string().nullable(),
  })
  .partial();
const DeliveryNoteLineResponse = z
  .object({
    id: z.number().int(),
    orderDetailId: z.number().int(),
    designId: z.number().int(),
    designName: z.string().nullable(),
    designCode: z.string().nullable(),
    orderedQty: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyBefore: z.number().int(),
    deliveryQty: z.number().int(),
    actualDeliveredQty: z.number().int().nullable(),
    remainingAfter: z.number().int(),
    unitPriceSnapshot: z.number(),
    lineAmount: z.number(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    failureReasonId: z.number().int().nullable(),
    failureReasonCode: z.string().nullable(),
    failureReasonName: z.string().nullable(),
    failureNotes: z.string().nullable(),
    failedAt: z.string().datetime({ offset: true }).nullable(),
    deliveredAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const DeliveryNoteResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    notes: z.string().nullable(),
    pdfUrl: z.string().nullable(),
    failureReason: z.string().nullable(),
    failureType: z.string().nullable(),
    affectsDebt: z.boolean(),
    cancelReason: z.string().nullable(),
    createdBy: UserInfo,
    createdAt: z.string().datetime({ offset: true }),
    confirmedAt: z.string().datetime({ offset: true }).nullable(),
    confirmedBy: UserInfo,
    readyToShipAt: z.string().datetime({ offset: true }).nullable(),
    handedOverAt: z.string().datetime({ offset: true }).nullable(),
    handedOverBy: UserInfo,
    inTransitAt: z.string().datetime({ offset: true }).nullable(),
    deliveredAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    cancelledAt: z.string().datetime({ offset: true }).nullable(),
    cancelledBy: UserInfo,
    orders: z.array(DeliveryNoteOrderResponse).nullable(),
    lines: z.array(DeliveryNoteLineResponse).nullable(),
    totalDeliveryQty: z.number().int(),
    totalLineAmount: z.number(),
    totalPendingLines: z.number().int(),
    totalDeliveredLines: z.number().int(),
    totalFailedLines: z.number().int(),
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
  status: z.string().min(0).max(30),
  cancelReason: z.string().min(0).max(500).nullish(),
  failureReason: z.string().nullish(),
  failureType: z.string().min(0).max(50).nullish(),
  affectsDebt: z.boolean().nullish(),
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
const OrderDetailForDeliveryResponse = z
  .object({
    orderDetailId: z.number().int(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    orderedQty: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyTotal: z.number().int(),
    remainingToDeliver: z.number().int(),
    unitPrice: z.number(),
  })
  .partial();
const OrderForDeliveryResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerPhone: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    totalAmount: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    details: z.array(OrderDetailForDeliveryResponse).nullable(),
  })
  .partial();
const UpdateDeliveryLineResultRequest = z.object({
  status: z.string().min(0).max(30),
  failureReasonId: z.number().int().nullish(),
  failureNotes: z.string().min(0).max(500).nullish(),
  actualDeliveredQty: z.number().int().gte(0).lte(2147483647).nullish(),
});
const FailureReasonResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    allowRedelivery: z.boolean(),
    category: z.string().nullable(),
  })
  .partial();
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
    laminationType: z.string().nullable(),
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
const DesignTimelineEntryResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DesignTimelineEntryResponse).nullable(),
  })
  .partial();
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
const InventorySummaryItemResponse = z
  .object({
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    openingQuantity: z.number(),
    inQuantity: z.number(),
    outQuantity: z.number(),
    closingQuantity: z.number(),
    openingValue: z.number().nullable(),
    inValue: z.number().nullable(),
    outValue: z.number().nullable(),
    closingValue: z.number().nullable(),
  })
  .partial();
const InventorySummaryItemResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(InventorySummaryItemResponse).nullable(),
  })
  .partial();
const StockCardEntryResponse = z
  .object({
    date: z.string().datetime({ offset: true }),
    voucherCode: z.string().nullable(),
    inQuantity: z.number(),
    outQuantity: z.number(),
    balance: z.number(),
    notes: z.string().nullable(),
    reference: z.string().nullable(),
    voucherType: z.string().nullable(),
    voucherId: z.number().int(),
  })
  .partial();
const StockCardResponse = z
  .object({
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    warehouse: z.string().nullable(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    openingBalance: z.number(),
    entries: z.array(StockCardEntryResponse).nullable(),
    closingBalance: z.number(),
  })
  .partial();
const CurrentStockResponse = z
  .object({
    warehouse: z.string().nullable(),
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    currentQuantity: z.number(),
    stockValue: z.number(),
    minStock: z.number(),
    status: z.string().nullable(),
  })
  .partial();
const CurrentStockResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CurrentStockResponse).nullable(),
  })
  .partial();
const LowStockResponse = z
  .object({
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    currentQuantity: z.number(),
    minStock: z.number(),
    shortage: z.number(),
    suggestedOrder: z.number(),
  })
  .partial();
const LowStockResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(LowStockResponse).nullable(),
  })
  .partial();
const SlowMovingResponse = z
  .object({
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    currentQuantity: z.number(),
    lastTxnDate: z.string().datetime({ offset: true }).nullable(),
    daysNoMovement: z.number().int(),
    stockValue: z.number(),
  })
  .partial();
const SlowMovingResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SlowMovingResponse).nullable(),
  })
  .partial();
const CreateInvoiceRequest = z.object({
  orderIds: z.array(z.number().int()).min(1),
  invoiceNumber: z.string().nullish(),
  taxRate: z.number().gte(0).lte(1).optional(),
  notes: z.string().nullish(),
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
    deliveryLineId: z.number().int().nullable(),
    orderDetailId: z.number().int().nullable(),
    sortOrder: z.number().int(),
    description: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
    discountPercent: z.number(),
    discountAmount: z.number(),
    amountAfterDiscount: z.number(),
  })
  .partial();
const InvoiceResponse = z
  .object({
    id: z.number().int(),
    invoiceNumber: z.string().nullable(),
    invoiceType: z.string().nullable(),
    status: z.string().nullable(),
    statusName: z.string().nullable(),
    subTotal: z.number(),
    discountPercent: z.number(),
    discountAmount: z.number(),
    discountReason: z.string().nullable(),
    totalAfterDiscount: z.number(),
    taxRate: z.number(),
    vatAmount: z.number(),
    grandTotal: z.number(),
    totalAmount: z.number(),
    taxAmount: z.number(),
    eInvoiceNumber: z.string().nullable(),
    eInvoiceSerial: z.string().nullable(),
    taxAuthorityCode: z.string().nullable(),
    eInvoiceIssuedAt: z.string().datetime({ offset: true }).nullable(),
    pdfUrl: z.string().nullable(),
    notes: z.string().nullable(),
    sellerName: z.string().nullable(),
    sellerTaxCode: z.string().nullable(),
    sellerAddress: z.string().nullable(),
    sellerPhone: z.string().nullable(),
    sellerBankAccount: z.string().nullable(),
    sellerBankName: z.string().nullable(),
    customerId: z.number().int().nullable(),
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
const InvoiceResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(InvoiceResponse).nullable(),
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
const BillableItemResponse = z
  .object({
    deliveryLineId: z.number().int(),
    deliveryNoteId: z.number().int(),
    deliveryNoteCode: z.string().nullable(),
    orderDetailId: z.number().int(),
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerTaxCode: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    deliveredQty: z.number().int(),
    invoicedQty: z.number().int(),
    remainingToInvoice: z.number().int(),
    unitPrice: z.number(),
    deliveredAt: z.string().datetime({ offset: true }),
  })
  .partial();
const InvoiceLineInput = z.object({
  deliveryLineId: z.number().int(),
  invoiceQty: z.number().int().gte(1).lte(2147483647),
  discountPercent: z.number().gte(0).lte(100).nullish(),
});
const CreateInvoiceFromLinesRequest = z.object({
  lines: z.array(InvoiceLineInput).min(1),
  discountPercent: z.number().gte(0).lte(100).nullish(),
  discountAmount: z.number().gte(0).nullish(),
  discountReason: z.string().min(0).max(500).nullish(),
  taxRate: z.number().gte(0).lte(1).optional(),
  notes: z.string().nullish(),
  buyerName: z.string().nullish(),
  buyerCompanyName: z.string().nullish(),
  buyerTaxCode: z.string().nullish(),
  buyerAddress: z.string().nullish(),
  buyerEmail: z.string().nullish(),
});
const IssueInvoiceRequest = z.object({
  invoiceNumber: z.string().min(0).max(50),
  issuedAt: z.string().datetime({ offset: true }).nullish(),
});
const UpdateEInvoiceInfoRequest = z
  .object({
    eInvoiceNumber: z.string().min(0).max(50).nullable(),
    eInvoiceSerial: z.string().min(0).max(50).nullable(),
    taxAuthorityCode: z.string().min(0).max(100).nullable(),
    eInvoiceIssuedAt: z.string().datetime({ offset: true }).nullable(),
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
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    customerPhone: z.string().nullable(),
    customerEmail: z.string().nullable(),
    customerTaxCode: z.string().nullable(),
    customerAddress: z.string().nullable(),
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
const VendorResponse = z
  .object({
    id: z.number().int(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    note: z.string().nullable(),
    vendorType: z.string().nullable(),
    vendorTypeName: z.string().nullable(),
    isActive: z.boolean(),
    createdById: z.number().int(),
    createdByName: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const PlateExportResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    plateVendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    plateVendor: VendorResponse,
    plateCount: z.number().int(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
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
const CompleteProductionRequest = z.object({
  progressPercent: z.number().int().gte(0).lte(100).optional(),
  defectNotes: z.string().nullish(),
  wastage: z.number().gte(0).optional(),
  producedQty: z.number().int().gte(1).lte(2147483647),
});
const CreateProofingOrderRequest = z.object({
  materialTypeId: z.number().int(),
  designIds: z.array(z.number().int()),
  notes: z.string().nullish(),
  paperSizeId: z.number().int().nullish(),
  customPaperSize: z.string().nullish(),
});
const DieExportResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    dieVendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    dieVendor: VendorResponse,
    dieCount: z.number().int(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    imageUrl: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
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
    totalQuantity: z.number().int(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    proofingFileUrl: z.string().nullable(),
    imageUrl: z.string().nullable(),
    notes: z.string().nullable(),
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
const UpdateProofingDesignItem = z.object({
  proofingOrderDesignId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
});
const UpdateProofingOrderRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    proofingFileUrl: z.string().nullable(),
    notes: z.string().nullable(),
    paperSizeId: z.number().int().nullable(),
    customPaperSize: z.string().nullable(),
    totalQuantity: z.number().int().gte(1).lte(2147483647).nullable(),
    designUpdates: z.array(UpdateProofingDesignItem).nullable(),
  })
  .partial();
const OrderDetailResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderDetailResponse).nullable(),
  })
  .partial();
const RecordPlateExportRequest = z
  .object({
    plateVendorId: z.number().int().nullable(),
    plateCount: z.number().int().gte(1).lte(6),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
  })
  .partial();
const postApiproofingOrdersIddieExport_Body = z
  .object({
    DieVendorId: z.number().int(),
    DieCount: z.number().int(),
    SentAt: z.string().datetime({ offset: true }),
    EstimatedReceiveAt: z.string().datetime({ offset: true }),
    ReceivedAt: z.string().datetime({ offset: true }),
    ImageFile: z.instanceof(File),
    Notes: z.string(),
  })
  .partial()
  .passthrough();
const ReportExportResponse = z
  .object({
    id: z.number().int(),
    reportCode: z.string().nullable(),
    reportName: z.string().nullable(),
    fileName: z.string().nullable(),
    fileSize: z.number().int(),
    fileType: z.string().nullable(),
    filterJson: z.string().nullable(),
    status: z.string().nullable(),
    errorMessage: z.string().nullable(),
    exportedById: z.number().int(),
    exportedByName: z.string().nullable(),
    exportedAt: z.string().datetime({ offset: true }),
  })
  .partial();
const ReportExportResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ReportExportResponse).nullable(),
  })
  .partial();
const ProblemDetails = z
  .object({
    type: z.string().nullable(),
    title: z.string().nullable(),
    status: z.number().int().nullable(),
    detail: z.string().nullable(),
    instance: z.string().nullable(),
  })
  .partial()
  .passthrough();
const SalesByPeriodResponse = z
  .object({
    period: z.string().nullable(),
    orderCount: z.number().int(),
    grossRevenue: z.number(),
    discount: z.number(),
    returns: z.number(),
    netRevenue: z.number(),
    customerCount: z.number().int(),
  })
  .partial();
const SalesByPeriodResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SalesByPeriodResponse).nullable(),
  })
  .partial();
const SalesByCustomerResponse = z
  .object({
    customerId: z.number().int(),
    customerCode: z.string().nullable(),
    customerName: z.string().nullable(),
    companyName: z.string().nullable(),
    orderCount: z.number().int(),
    netRevenue: z.number(),
    returns: z.number(),
    aov: z.number(),
    lastPurchase: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const SalesByCustomerResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SalesByCustomerResponse).nullable(),
  })
  .partial();
const SalesByDimensionResponse = z
  .object({
    dimensionId: z.number().int().nullable(),
    dimensionValue: z.string().nullable(),
    orderCount: z.number().int(),
    netRevenue: z.number(),
    discount: z.number(),
    returns: z.number(),
  })
  .partial();
const SalesByDimensionResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SalesByDimensionResponse).nullable(),
  })
  .partial();
const TopProductResponse = z
  .object({
    productCode: z.string().nullable(),
    productName: z.string().nullable(),
    productGroup: z.string().nullable(),
    soldQuantity: z.number().int(),
    netRevenue: z.number(),
    orderCount: z.number().int(),
    averagePrice: z.number(),
  })
  .partial();
const TopProductResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(TopProductResponse).nullable(),
  })
  .partial();
const ReturnsDiscountsResponse = z
  .object({
    period: z.string().nullable(),
    voucherCount: z.number().int(),
    adjustmentValue: z.number(),
    topReason: z.string().nullable(),
  })
  .partial();
const ReturnsDiscountsResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ReturnsDiscountsResponse).nullable(),
  })
  .partial();
const OrderDrillDownResponse = z
  .object({
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    customerName: z.string().nullable(),
    netAmount: z.number(),
    status: z.string().nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const OrderDrillDownResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderDrillDownResponse).nullable(),
  })
  .partial();
const StockInItemRequest = z.object({
  itemName: z.string().min(1),
  itemCode: z.string().nullish(),
  unit: z.string().nullish(),
  quantity: z.number().int().gte(1).lte(2147483647),
  unitPrice: z.number().nullish(),
  notes: z.string().nullish(),
});
const CreateStockInRequest = z.object({
  type: z.string().nullish(),
  supplierId: z.number().int().nullish(),
  orderId: z.number().int().nullish(),
  productionId: z.number().int().nullish(),
  notes: z.string().nullish(),
  stockInDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockInItemRequest),
});
const UpdateStockInRequest = z
  .object({
    type: z.string().nullable(),
    status: z.string().nullable(),
    supplierId: z.number().int().nullable(),
    orderId: z.number().int().nullable(),
    productionId: z.number().int().nullable(),
    notes: z.string().nullable(),
    stockInDate: z.string().datetime({ offset: true }).nullable(),
    items: z.array(StockInItemRequest).nullable(),
  })
  .partial();
const StockOutItemRequest = z.object({
  itemName: z.string().min(1),
  itemCode: z.string().nullish(),
  unit: z.string().nullish(),
  quantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().nullish(),
});
const CreateStockOutRequest = z.object({
  type: z.string().nullish(),
  customerId: z.number().int().nullish(),
  orderId: z.number().int().nullish(),
  productionId: z.number().int().nullish(),
  deliveryNoteId: z.number().int().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockOutItemRequest),
});
const UpdateStockOutRequest = z
  .object({
    type: z.string().nullable(),
    status: z.string().nullable(),
    customerId: z.number().int().nullable(),
    orderId: z.number().int().nullable(),
    productionId: z.number().int().nullable(),
    deliveryNoteId: z.number().int().nullable(),
    notes: z.string().nullable(),
    stockOutDate: z.string().datetime({ offset: true }).nullable(),
    items: z.array(StockOutItemRequest).nullable(),
  })
  .partial();
const CreateUserRequest = z.object({
  username: z.string().min(0).max(100),
  password: z.string().min(6).max(100),
  fullName: z.string().min(0).max(255),
  role: z
    .string()
    .min(1)
    .regex(
      /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/,
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
        /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead)$/,
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
const CreateVendorRequest = z.object({
  name: z.string().min(0).max(255),
  phone: z.string().min(0).max(20).nullish(),
  email: z.string().min(0).max(255).nullish(),
  address: z.string().nullish(),
  note: z.string().nullish(),
  vendorType: z.string().min(0).max(20),
});
const VendorResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(VendorResponse).nullable(),
  })
  .partial();
const UpdateVendorRequest = z
  .object({
    name: z.string().min(0).max(255).nullable(),
    phone: z.string().min(0).max(20).nullable(),
    email: z.string().min(0).max(255).nullable(),
    address: z.string().nullable(),
    note: z.string().nullable(),
    vendorType: z.string().min(0).max(20).nullable(),
    isActive: z.boolean().nullable(),
  })
  .partial();
const VendorCountOptionResponse = z
  .object({ value: z.number().int(), label: z.string().nullable() })
  .partial();
const VendorCountOptionResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(VendorCountOptionResponse).nullable(),
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
  BankLedgerEntryResponse,
  BankLedgerResponse,
  CashBookEntryResponse,
  CashBookResponse,
  CreateCashPaymentRequest,
  CashPaymentResponse,
  CashPaymentResponseIPaginate,
  UpdateCashPaymentRequest,
  CreateCashReceiptRequest,
  CashReceiptResponse,
  CashReceiptResponseIPaginate,
  UpdateCashReceiptRequest,
  ExpenseCategoryResponse,
  ExpenseCategoryResponseIPaginate,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  PaymentMethodResponse,
  PaymentMethodResponseIPaginate,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  CashFundResponse,
  CashFundResponseIPaginate,
  CreateCashFundRequest,
  UpdateCashFundRequest,
  BankAccountResponse,
  BankAccountResponseIPaginate,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  ConstantGroup,
  ConstantsResponse,
  CreateCustomerRequest,
  CustomerResponse,
  CustomerSummaryResponse,
  CustomerSummaryResponsePaginate,
  UpdateCustomerRequest,
  CustomerDebtHistoryResponse,
  CustomerDebtHistoryResponsePaginate,
  CustomerMonthlyDebtResponse,
  CustomerDebtSummaryResponse,
  FrequentProductResponse,
  CustomerStatisticsResponse,
  OrderHistoryDetailResponse,
  CustomerOrderHistoryResponse,
  CustomerOrderHistoryResponsePaginate,
  ARSummaryResponse,
  ARSummaryResponseIPaginate,
  ARDetailResponse,
  ARDetailResponseIPaginate,
  ARAgingResponse,
  ARAgingResponseIPaginate,
  CollectionScheduleResponse,
  CollectionScheduleResponseIPaginate,
  APSummaryResponse,
  APSummaryResponseIPaginate,
  APDetailResponse,
  APDetailResponseIPaginate,
  APAgingResponse,
  APAgingResponseIPaginate,
  DeliveryLineRequest,
  CreateDeliveryNoteRequest,
  DeliveryNoteOrderResponse,
  DeliveryNoteLineResponse,
  DeliveryNoteResponse,
  DeliveryNoteResponsePaginate,
  UpdateDeliveryStatusRequest,
  RecreateDeliveryNoteRequest,
  OrderDetailForDeliveryResponse,
  OrderForDeliveryResponse,
  UpdateDeliveryLineResultRequest,
  FailureReasonResponse,
  DesignTypeResponse,
  MaterialTypeResponse,
  DesignTimelineEntryResponse,
  DesignResponse,
  UpdateDesignRequest,
  DesignResponsePaginate,
  postApidesignsIdtimeline_Body,
  DesignTimelineEntryResponsePaginate,
  CreateDesignTypeRequest,
  DesignTypeResponsePaginate,
  UpdateDesignTypeRequest,
  InventorySummaryItemResponse,
  InventorySummaryItemResponseIPaginate,
  StockCardEntryResponse,
  StockCardResponse,
  CurrentStockResponse,
  CurrentStockResponseIPaginate,
  LowStockResponse,
  LowStockResponseIPaginate,
  SlowMovingResponse,
  SlowMovingResponseIPaginate,
  CreateInvoiceRequest,
  InvoiceOrderResponse,
  InvoiceItemResponse,
  InvoiceResponse,
  InvoiceResponsePaginate,
  UpdateInvoiceRequest,
  BillableItemResponse,
  InvoiceLineInput,
  CreateInvoiceFromLinesRequest,
  IssueInvoiceRequest,
  UpdateEInvoiceInfoRequest,
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
  VendorResponse,
  PlateExportResponse,
  PlateExportResponsePaginate,
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
  UpdateProofingDesignItem,
  UpdateProofingOrderRequest,
  OrderDetailResponsePaginate,
  RecordPlateExportRequest,
  postApiproofingOrdersIddieExport_Body,
  ReportExportResponse,
  ReportExportResponseIPaginate,
  ProblemDetails,
  SalesByPeriodResponse,
  SalesByPeriodResponseIPaginate,
  SalesByCustomerResponse,
  SalesByCustomerResponseIPaginate,
  SalesByDimensionResponse,
  SalesByDimensionResponseIPaginate,
  TopProductResponse,
  TopProductResponseIPaginate,
  ReturnsDiscountsResponse,
  ReturnsDiscountsResponseIPaginate,
  OrderDrillDownResponse,
  OrderDrillDownResponseIPaginate,
  StockInItemRequest,
  CreateStockInRequest,
  UpdateStockInRequest,
  StockOutItemRequest,
  CreateStockOutRequest,
  UpdateStockOutRequest,
  CreateUserRequest,
  UserResponse,
  UserResponsePaginate,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserKpiResponse,
  TeamKpiSummaryResponse,
  CreateVendorRequest,
  VendorResponsePaginate,
  UpdateVendorRequest,
  VendorCountOptionResponse,
  VendorCountOptionResponseIPaginate,
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
    path: "/api/bank-ledger",
    alias: "getApibankLedger",
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
        name: "bankAccountId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: BankLedgerResponse,
  },
  {
    method: "get",
    path: "/api/cash-book",
    alias: "getApicashBook",
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
        name: "cashFundId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: CashBookResponse,
  },
  {
    method: "post",
    path: "/api/cash-payments",
    alias: "postApicashPayments",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCashPaymentRequest,
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "get",
    path: "/api/cash-payments",
    alias: "getApicashPayments",
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
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "paymentMethodId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "expenseCategoryId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CashPaymentResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/cash-payments/:id",
    alias: "getApicashPaymentsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "put",
    path: "/api/cash-payments/:id",
    alias: "putApicashPaymentsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCashPaymentRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "delete",
    path: "/api/cash-payments/:id",
    alias: "deleteApicashPaymentsId",
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
    method: "post",
    path: "/api/cash-payments/:id/approve",
    alias: "postApicashPaymentsIdapprove",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "post",
    path: "/api/cash-payments/:id/cancel",
    alias: "postApicashPaymentsIdcancel",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "post",
    path: "/api/cash-payments/:id/post",
    alias: "postApicashPaymentsIdpost",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashPaymentResponse,
  },
  {
    method: "post",
    path: "/api/cash-receipts",
    alias: "postApicashReceipts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCashReceiptRequest,
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "get",
    path: "/api/cash-receipts",
    alias: "getApicashReceipts",
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
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "paymentMethodId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CashReceiptResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/cash-receipts/:id",
    alias: "getApicashReceiptsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "put",
    path: "/api/cash-receipts/:id",
    alias: "putApicashReceiptsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCashReceiptRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "delete",
    path: "/api/cash-receipts/:id",
    alias: "deleteApicashReceiptsId",
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
    method: "post",
    path: "/api/cash-receipts/:id/approve",
    alias: "postApicashReceiptsIdapprove",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "post",
    path: "/api/cash-receipts/:id/cancel",
    alias: "postApicashReceiptsIdcancel",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "post",
    path: "/api/cash-receipts/:id/post",
    alias: "postApicashReceiptsIdpost",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashReceiptResponse,
  },
  {
    method: "get",
    path: "/api/categories/bank-accounts",
    alias: "getApicategoriesbankAccounts",
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
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: BankAccountResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/categories/bank-accounts",
    alias: "postApicategoriesbankAccounts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateBankAccountRequest,
      },
    ],
    response: BankAccountResponse,
  },
  {
    method: "get",
    path: "/api/categories/bank-accounts/:id",
    alias: "getApicategoriesbankAccountsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: BankAccountResponse,
  },
  {
    method: "put",
    path: "/api/categories/bank-accounts/:id",
    alias: "putApicategoriesbankAccountsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateBankAccountRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: BankAccountResponse,
  },
  {
    method: "delete",
    path: "/api/categories/bank-accounts/:id",
    alias: "deleteApicategoriesbankAccountsId",
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
    path: "/api/categories/cash-funds",
    alias: "getApicategoriescashFunds",
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
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CashFundResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/categories/cash-funds",
    alias: "postApicategoriescashFunds",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCashFundRequest,
      },
    ],
    response: CashFundResponse,
  },
  {
    method: "get",
    path: "/api/categories/cash-funds/:id",
    alias: "getApicategoriescashFundsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashFundResponse,
  },
  {
    method: "put",
    path: "/api/categories/cash-funds/:id",
    alias: "putApicategoriescashFundsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCashFundRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CashFundResponse,
  },
  {
    method: "delete",
    path: "/api/categories/cash-funds/:id",
    alias: "deleteApicategoriescashFundsId",
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
    path: "/api/categories/expense-categories",
    alias: "getApicategoriesexpenseCategories",
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
        name: "type",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ExpenseCategoryResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/categories/expense-categories",
    alias: "postApicategoriesexpenseCategories",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateExpenseCategoryRequest,
      },
    ],
    response: ExpenseCategoryResponse,
  },
  {
    method: "get",
    path: "/api/categories/expense-categories/:id",
    alias: "getApicategoriesexpenseCategoriesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ExpenseCategoryResponse,
  },
  {
    method: "put",
    path: "/api/categories/expense-categories/:id",
    alias: "putApicategoriesexpenseCategoriesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateExpenseCategoryRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ExpenseCategoryResponse,
  },
  {
    method: "delete",
    path: "/api/categories/expense-categories/:id",
    alias: "deleteApicategoriesexpenseCategoriesId",
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
    path: "/api/categories/payment-methods",
    alias: "getApicategoriespaymentMethods",
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
        name: "isActive",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PaymentMethodResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/categories/payment-methods",
    alias: "postApicategoriespaymentMethods",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePaymentMethodRequest,
      },
    ],
    response: PaymentMethodResponse,
  },
  {
    method: "get",
    path: "/api/categories/payment-methods/:id",
    alias: "getApicategoriespaymentMethodsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PaymentMethodResponse,
  },
  {
    method: "put",
    path: "/api/categories/payment-methods/:id",
    alias: "putApicategoriespaymentMethodsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePaymentMethodRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PaymentMethodResponse,
  },
  {
    method: "delete",
    path: "/api/categories/payment-methods/:id",
    alias: "deleteApicategoriespaymentMethodsId",
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
    response: CustomerDebtHistoryResponsePaginate,
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
    method: "get",
    path: "/api/debt-reports/ap-aging",
    alias: "getApidebtReportsapAging",
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
        name: "asOfDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: APAgingResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-aging/export",
    alias: "getApidebtReportsapAgingexport",
    requestFormat: "json",
    parameters: [
      {
        name: "asOfDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-detail",
    alias: "getApidebtReportsapDetail",
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
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: APDetailResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-summary",
    alias: "getApidebtReportsapSummary",
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
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: APSummaryResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-summary/export",
    alias: "getApidebtReportsapSummaryexport",
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
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-aging",
    alias: "getApidebtReportsarAging",
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
        name: "asOfDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: ARAgingResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-aging/export",
    alias: "getApidebtReportsarAgingexport",
    requestFormat: "json",
    parameters: [
      {
        name: "asOfDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-detail",
    alias: "getApidebtReportsarDetail",
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
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: ARDetailResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-summary",
    alias: "getApidebtReportsarSummary",
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
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARSummaryResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-summary/export",
    alias: "getApidebtReportsarSummaryexport",
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
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/collection-schedule",
    alias: "getApidebtReportscollectionSchedule",
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
        name: "dueDateFrom",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "dueDateTo",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: CollectionScheduleResponseIPaginate,
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
    method: "get",
    path: "/api/delivery-notes/available-orders",
    alias: "getApideliveryNotesavailableOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(OrderForDeliveryResponse),
  },
  {
    method: "get",
    path: "/api/delivery-notes/failure-reasons",
    alias: "getApideliveryNotesfailureReasons",
    requestFormat: "json",
    parameters: [
      {
        name: "allowRedeliveryOnly",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: z.array(FailureReasonResponse),
  },
  {
    method: "put",
    path: "/api/delivery-notes/lines/:lineId/result",
    alias: "putApideliveryNoteslinesLineIdresult",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDeliveryLineResultRequest,
      },
      {
        name: "lineId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DeliveryNoteLineResponse,
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
    response: DesignTimelineEntryResponsePaginate,
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
    response: DesignResponsePaginate,
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
    response: MaterialTypeResponsePaginate,
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
    response: DesignResponsePaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/current-stock",
    alias: "getApiinventoryReportscurrentStock",
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
        name: "asOfDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "warehouse",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemGroup",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CurrentStockResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/low-stock",
    alias: "getApiinventoryReportslowStock",
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
        name: "warehouse",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemGroup",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: LowStockResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/slow-moving",
    alias: "getApiinventoryReportsslowMoving",
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
        name: "warehouse",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "daysThreshold",
        type: "Query",
        schema: z.number().int().optional().default(90),
      },
    ],
    response: SlowMovingResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/stock-card/:itemCode",
    alias: "getApiinventoryReportsstockCardItemCode",
    requestFormat: "json",
    parameters: [
      {
        name: "itemCode",
        type: "Path",
        schema: z.string(),
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
      {
        name: "warehouse",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: StockCardResponse,
  },
  {
    method: "get",
    path: "/api/inventory-reports/summary",
    alias: "getApiinventoryReportssummary",
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
        name: "warehouse",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemGroup",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: InventorySummaryItemResponseIPaginate,
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
    path: "/api/invoices",
    alias: "getApiinvoices",
    requestFormat: "json",
    parameters: [
      {
        name: "CustomerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "Status",
        type: "Query",
        schema: z.string().min(0).max(20).optional(),
      },
      {
        name: "FromDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "ToDate",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "Search",
        type: "Query",
        schema: z.string().min(0).max(100).optional(),
      },
      {
        name: "PageNumber",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "PageSize",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: InvoiceResponsePaginate,
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
    method: "put",
    path: "/api/invoices/:id/e-invoice",
    alias: "putApiinvoicesIdeInvoice",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateEInvoiceInfoRequest,
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
    method: "put",
    path: "/api/invoices/:id/issue",
    alias: "putApiinvoicesIdissue",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: IssueInvoiceRequest,
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
    method: "put",
    path: "/api/invoices/:id/void",
    alias: "putApiinvoicesIdvoid",
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
    response: InvoiceResponse,
  },
  {
    method: "get",
    path: "/api/invoices/billable-items",
    alias: "getApiinvoicesbillableItems",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(BillableItemResponse),
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
    response: InvoiceResponsePaginate,
  },
  {
    method: "post",
    path: "/api/invoices/from-lines",
    alias: "postApiinvoicesfromLines",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateInvoiceFromLinesRequest,
      },
    ],
    response: InvoiceResponse,
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
    method: "delete",
    path: "/api/orders/:orderId/designs/:orderDetailId",
    alias: "deleteApiordersOrderIddesignsOrderDetailId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "orderDetailId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: OrderResponse,
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
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiproofingOrdersIddieExport_Body,
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
    method: "delete",
    path: "/api/proofing-orders/:proofingOrderId/designs/:proofingOrderDesignId",
    alias: "deleteApiproofingOrdersProofingOrderIddesignsProofingOrderDesignId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "proofingOrderDesignId",
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
    response: OrderDetailResponsePaginate,
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
    method: "get",
    path: "/api/report-exports",
    alias: "getApireportExports",
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
        name: "reportCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "exportedById",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: ReportExportResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/report-exports/:id",
    alias: "getApireportExportsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ReportExportResponse,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z
          .object({
            type: z.string().nullable(),
            title: z.string().nullable(),
            status: z.number().int().nullable(),
            detail: z.string().nullable(),
            instance: z.string().nullable(),
          })
          .partial()
          .passthrough(),
      },
    ],
  },
  {
    method: "delete",
    path: "/api/report-exports/:id",
    alias: "deleteApireportExportsId",
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
        status: 404,
        description: `Not Found`,
        schema: z
          .object({
            type: z.string().nullable(),
            title: z.string().nullable(),
            status: z.number().int().nullable(),
            detail: z.string().nullable(),
            instance: z.string().nullable(),
          })
          .partial()
          .passthrough(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/report-exports/:id/download",
    alias: "getApireportExportsIddownload",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.instanceof(File),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z
          .object({
            type: z.string().nullable(),
            title: z.string().nullable(),
            status: z.number().int().nullable(),
            detail: z.string().nullable(),
            instance: z.string().nullable(),
          })
          .partial()
          .passthrough(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/sales-reports/by-customer",
    alias: "getApisalesReportsbyCustomer",
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
        name: "salespersonId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: SalesByCustomerResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/by-dimension",
    alias: "getApisalesReportsbyDimension",
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
        name: "dimension",
        type: "Query",
        schema: z.string().optional().default("salesperson"),
      },
    ],
    response: SalesByDimensionResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/by-period",
    alias: "getApisalesReportsbyPeriod",
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
        name: "groupBy",
        type: "Query",
        schema: z.string().optional().default("month"),
      },
      {
        name: "salespersonId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: SalesByPeriodResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/by-period/export",
    alias: "getApisalesReportsbyPeriodexport",
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
        name: "groupBy",
        type: "Query",
        schema: z.string().optional().default("month"),
      },
      {
        name: "salespersonId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/sales-reports/orders-by-customer/:customerId",
    alias: "getApisalesReportsordersByCustomerCustomerId",
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
    response: OrderDrillDownResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/orders-by-period",
    alias: "getApisalesReportsordersByPeriod",
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
        name: "salespersonId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderDrillDownResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/returns-discounts",
    alias: "getApisalesReportsreturnsDiscounts",
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
        name: "groupBy",
        type: "Query",
        schema: z.string().optional().default("month"),
      },
    ],
    response: ReturnsDiscountsResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/top-products",
    alias: "getApisalesReportstopProducts",
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
        name: "topN",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "itemGroup",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: TopProductResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/stock-ins",
    alias: "postApistockIns",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockInRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-ins",
    alias: "getApistockIns",
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
        name: "type",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-ins/:id",
    alias: "getApistockInsId",
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
    path: "/api/stock-ins/:id",
    alias: "putApistockInsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateStockInRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/stock-ins/:id",
    alias: "deleteApistockInsId",
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
    method: "post",
    path: "/api/stock-ins/:id/cancel",
    alias: "postApistockInsIdcancel",
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
    method: "post",
    path: "/api/stock-ins/:id/complete",
    alias: "postApistockInsIdcomplete",
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
    method: "post",
    path: "/api/stock-outs",
    alias: "postApistockOuts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockOutRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs",
    alias: "getApistockOuts",
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
        name: "type",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs/:id",
    alias: "getApistockOutsId",
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
    path: "/api/stock-outs/:id",
    alias: "putApistockOutsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateStockOutRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/stock-outs/:id",
    alias: "deleteApistockOutsId",
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
    method: "post",
    path: "/api/stock-outs/:id/cancel",
    alias: "postApistockOutsIdcancel",
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
    method: "post",
    path: "/api/stock-outs/:id/complete",
    alias: "postApistockOutsIdcomplete",
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
    response: UserResponsePaginate,
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
  {
    method: "post",
    path: "/api/vendors",
    alias: "postApivendors",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateVendorRequest,
      },
    ],
    response: VendorResponse,
  },
  {
    method: "get",
    path: "/api/vendors",
    alias: "getApivendors",
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
    response: VendorResponsePaginate,
  },
  {
    method: "put",
    path: "/api/vendors/:id",
    alias: "putApivendorsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateVendorRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: VendorResponse,
  },
  {
    method: "get",
    path: "/api/vendors/:id",
    alias: "getApivendorsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: VendorResponse,
  },
  {
    method: "delete",
    path: "/api/vendors/:id",
    alias: "deleteApivendorsId",
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
    path: "/api/vendors/plate-count-options",
    alias: "getApivendorsplateCountOptions",
    requestFormat: "json",
    response: VendorCountOptionResponseIPaginate,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
