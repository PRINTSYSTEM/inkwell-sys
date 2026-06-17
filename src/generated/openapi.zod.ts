import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

type FinanceAccountNodeResponse = Partial<{
  id: number;
  code: string | null;
  name: string | null;
  parentId: number | null;
  totalReceipt: number;
  totalPayment: number;
  balance: number;
  children: Array<FinanceAccountNodeResponse> | null;
}>;

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
  paymentMethod: z.string().nullable(),
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
  bankAccountId: z.number().int().nullish(),
  financeAccountId: z.number().int().nullish(),
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
    bankAccountId: z.number().int().nullable(),
    bankAccountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    financeAccountId: z.number().int().nullable(),
    financeAccountCode: z.string().nullable(),
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
  bankAccountId: z.number().int().nullish(),
  financeAccountId: z.number().int().nullish(),
  notes: z.string().min(0).max(1000).nullish(),
});
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
  bankAccountId: z.number().int().nullish(),
  financeAccountId: z.number().int().nullish(),
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
    bankAccountId: z.number().int().nullable(),
    bankAccountNumber: z.string().nullable(),
    bankName: z.string().nullable(),
    financeAccountId: z.number().int().nullable(),
    financeAccountCode: z.string().nullable(),
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
  bankAccountId: z.number().int().nullish(),
  financeAccountId: z.number().int().nullish(),
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
    productionMethods: ConstantGroup,
    vendorTypes: ConstantGroup,
    deliveryNoteStatuses: ConstantGroup,
    deliveryLineStatuses: ConstantGroup,
    debtStatuses: ConstantGroup,
    productionStepTypes: ConstantGroup,
    productionStepStatuses: ConstantGroup,
    stockInSources: ConstantGroup,
    stockInItemTypes: ConstantGroup,
    stockInStatuses: ConstantGroup,
    stockOutPurposes: ConstantGroup,
    stockOutItemTypes: ConstantGroup,
    stockOutStatuses: ConstantGroup,
    dieSearchRelevances: ConstantGroup,
    deliveryFailureTypes: ConstantGroup,
    invoiceStatuses: ConstantGroup,
    paymentTypes: ConstantGroup,
    debtChangeTypes: ConstantGroup,
    dieUsageTypes: ConstantGroup,
    dieStatuses: ConstantGroup,
    dieLocations: ConstantGroup,
    stockItemTypes: ConstantGroup,
    materialUnits: ConstantGroup,
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
  scrapRate: z.number().gte(0).lte(1).nullish(),
  currentDebt: z.number().gte(0).optional(),
  maxDebt: z.number().gte(0).optional(),
  parentCustomerId: z.number().int().nullish(),
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
    scrapRate: z.number().nullable(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    debtStatus: z.string().nullable(),
    isComplete: z.boolean(),
    parentCustomerId: z.number().int().nullable(),
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
    taxCode: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    type: z.string().nullable(),
    debtStatus: z.string().nullable(),
    scrapRate: z.number().nullable(),
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
    scrapRate: z.number().gte(0).lte(1).nullable(),
    currentDebt: z.number().gte(0).nullable(),
    maxDebt: z.number().gte(0).nullable(),
    parentCustomerId: z.number().int().nullable(),
  })
  .partial();
const CreateCustomerAddressRequest = z.object({
  label: z.string().min(0).max(100),
  recipientName: z.string().min(0).max(255).nullish(),
  recipientPhone: z.string().min(0).max(20).nullish(),
  address: z.string().min(0).max(500),
  isDefault: z.boolean().optional(),
});
const CustomerAddressResponse = z
  .object({
    id: z.number().int(),
    customerId: z.number().int(),
    label: z.string().nullable(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    address: z.string().nullable(),
    isDefault: z.boolean(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const CustomerAddressResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(CustomerAddressResponse).nullable(),
  })
  .partial();
const UpdateCustomerAddressRequest = z
  .object({
    label: z.string().min(0).max(100).nullable(),
    recipientName: z.string().min(0).max(255).nullable(),
    recipientPhone: z.string().min(0).max(20).nullable(),
    address: z.string().min(0).max(500).nullable(),
    isDefault: z.boolean().nullable(),
    isActive: z.boolean().nullable(),
  })
  .partial();
const CustomerDebtHistoryResponse = z
  .object({
    id: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    previousDebt: z.number(),
    changeAmount: z.number(),
    newDebt: z.number(),
    changeType: z.string().nullable(),
    note: z.string().nullable(),
    orderId: z.number().int().nullable(),
    orderCode: z.string().nullable(),
    paymentId: z.number().int().nullable(),
    paymentCode: z.string().nullable(),
    cashReceiptId: z.number().int().nullable(),
    cashReceiptCode: z.string().nullable(),
    createdById: z.number().int(),
    createdByName: z.string().nullable(),
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
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    companyName: z.string().nullable(),
    taxCode: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    type: z.string().nullable(),
    debtStatus: z.string().nullable(),
    scrapRate: z.number().nullable(),
    currentDebt: z.number(),
    maxDebt: z.number(),
    isComplete: z.boolean(),
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
    scrapRate: z.number().nullable(),
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
const CreateDebtNotificationRequest = z
  .object({
    type: z.string().nullable(),
    subject: z.string().nullable(),
    body: z.string().nullable(),
    customerIds: z.array(z.number().int()).nullable(),
  })
  .partial();
const DebtNotificationResponse = z
  .object({
    id: z.number().int(),
    type: z.string().nullable(),
    subject: z.string().nullable(),
    body: z.string().nullable(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    isRead: z.boolean(),
  })
  .partial();
const DebtNotificationResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DebtNotificationResponse).nullable(),
  })
  .partial();
const DebtNotificationPreviewResponse = z
  .object({
    id: z.number().int(),
    subject: z.string().nullable(),
    body: z.string().nullable(),
  })
  .partial();
const DebtReconciliationARRequest = z
  .object({
    customerId: z.number().int(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
  })
  .partial();
const DebtReconciliationResponse = z
  .object({
    id: z.number().int(),
    type: z.string().nullable(),
    customerId: z.number().int().nullable(),
    vendorId: z.number().int().nullable(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const DebtReconciliationAPRequest = z
  .object({
    vendorId: z.number().int(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
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
const ARDetailLedgerRow = z
  .object({
    date: z.string().datetime({ offset: true }),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    debit: z.number(),
    credit: z.number(),
    balanceAfter: z.number(),
  })
  .partial();
const ARDetailLedgerRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARDetailLedgerRow).nullable(),
  })
  .partial();
const ARDetailByInvoiceResponse = z
  .object({
    invoiceId: z.number().int(),
    invoiceNumber: z.string().nullable(),
    invoiceDate: z.string().datetime({ offset: true }),
    customerId: z.number().int().nullable(),
    customerName: z.string().nullable(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    paymentStatus: z.string().nullable(),
  })
  .partial();
const ARDetailByInvoiceResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARDetailByInvoiceResponse).nullable(),
  })
  .partial();
const ARDetailResponse = z
  .object({
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    documentId: z.number().int(),
    documentDate: z.string().datetime({ offset: true }),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    amountDue: z.number(),
    amountPaid: z.number(),
    outstanding: z.number(),
    overdueDays: z.number().int(),
    vatRate: z.number(),
    vatAmount: z.number(),
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
    documentId: z.number().int(),
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
const ARByItemResponse = z
  .object({
    itemDescription: z.string().nullable(),
    totalInvoiced: z.number(),
    totalOutstanding: z.number(),
    invoiceCount: z.number().int(),
    customerCount: z.number().int(),
  })
  .partial();
const ARByItemResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARByItemResponse).nullable(),
  })
  .partial();
const ARUnderdueResponse = z
  .object({
    invoiceId: z.number().int(),
    invoiceNumber: z.string().nullable(),
    customerId: z.number().int().nullable(),
    customerName: z.string().nullable(),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    daysUntilDue: z.number().int(),
    outstandingAmount: z.number(),
  })
  .partial();
const ARUnderdueResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARUnderdueResponse).nullable(),
  })
  .partial();
const ARSummaryByCustomerGroupResponse = z
  .object({
    groupName: z.string().nullable(),
    customerCount: z.number().int(),
    openingBalance: z.number(),
    increase: z.number(),
    decrease: z.number(),
    closingBalance: z.number(),
  })
  .partial();
const ARSummaryByCustomerGroupResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARSummaryByCustomerGroupResponse).nullable(),
  })
  .partial();
const ARSummaryByBranchResponse = z
  .object({
    branchId: z.number().int(),
    branchName: z.string().nullable(),
    openingBalance: z.number(),
    increase: z.number(),
    decrease: z.number(),
    closingBalance: z.number(),
  })
  .partial();
const ARSummaryByBranchResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ARSummaryByBranchResponse).nullable(),
  })
  .partial();
const AROverdueResponse = z
  .object({
    invoiceId: z.number().int(),
    invoiceNumber: z.string().nullable(),
    customerId: z.number().int().nullable(),
    customerName: z.string().nullable(),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    overdueDays: z.number().int(),
    overdueAmount: z.number(),
  })
  .partial();
const AROverdueResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(AROverdueResponse).nullable(),
  })
  .partial();
const APByPurchaseInvoiceResponse = z
  .object({
    stockInId: z.number().int(),
    code: z.string().nullable(),
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    stockInDate: z.string().datetime({ offset: true }),
    totalAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    dueDate: z.string().datetime({ offset: true }),
  })
  .partial();
const APByPurchaseInvoiceResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APByPurchaseInvoiceResponse).nullable(),
  })
  .partial();
const APOverdueResponse = z
  .object({
    stockInId: z.number().int(),
    code: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    overdueDays: z.number().int(),
    overdueAmount: z.number(),
  })
  .partial();
const APOverdueResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APOverdueResponse).nullable(),
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
const APDetailLedgerRow = z
  .object({
    date: z.string().datetime({ offset: true }),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    debit: z.number(),
    credit: z.number(),
    balanceAfter: z.number(),
  })
  .partial();
const APDetailLedgerRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(APDetailLedgerRow).nullable(),
  })
  .partial();
const APDetailResponse = z
  .object({
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    documentNumber: z.string().nullable(),
    documentType: z.string().nullable(),
    documentId: z.number().int(),
    documentDate: z.string().datetime({ offset: true }),
    dueDate: z.string().datetime({ offset: true }),
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
const CreateDefectRecordRequest = z.object({
  productionOrderId: z.number().int(),
  productionStepId: z.number().int().nullish(),
  productionOrderItemId: z.number().int().nullish(),
  designId: z.number().int(),
  orderDetailId: z.number().int().nullish(),
  defectQuantity: z.number().int().gte(1).lte(2147483647),
  description: z.string().min(1).max(1000),
  defectSource: z.string().min(1),
  assignedToUserId: z.number().int(),
  defectOccurredAt: z.string().datetime({ offset: true }).nullish(),
});
const DefectRecordResponse = z
  .object({
    id: z.number().int(),
    productionOrderId: z.number().int(),
    productionStepId: z.number().int().nullable(),
    productionStepType: z.string().nullable(),
    productionOrderItemId: z.number().int().nullable(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    dimensions: z.string().nullable(),
    orderDetailId: z.number().int().nullable(),
    orderId: z.number().int().nullable(),
    orderCode: z.string().nullable(),
    defectQuantity: z.number().int(),
    description: z.string().nullable(),
    defectSource: z.string().nullable(),
    defectSourceDisplay: z.string().nullable(),
    assignedToUserId: z.number().int(),
    assignedToUserName: z.string().nullable(),
    assignedToUserRole: z.string().nullable(),
    recordedByUserId: z.number().int(),
    recordedByUserName: z.string().nullable(),
    defectOccurredAt: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const DefectRecordResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DefectRecordResponse).nullable(),
  })
  .partial();
const UpdateDefectRecordRequest = z
  .object({
    defectQuantity: z.number().int().gte(1).lte(2147483647).nullable(),
    description: z.string().max(1000).nullable(),
    defectSource: z.string().nullable(),
    assignedToUserId: z.number().int().nullable(),
    defectOccurredAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const DefectBySourceBreakdown = z
  .object({
    design: z.number().int(),
    proofing: z.number().int(),
    production: z.number().int(),
    managementDecision: z.number().int(),
  })
  .partial();
const DefectRecordSummaryByUserResponse = z
  .object({
    userId: z.number().int(),
    userName: z.string().nullable(),
    userRole: z.string().nullable(),
    totalDefectRecords: z.number().int(),
    totalDefectQuantity: z.number().int(),
    bySource: DefectBySourceBreakdown,
  })
  .partial();
const DeliveryLineRequest = z.object({
  orderDetailId: z.number().int(),
  deliveryQty: z.number().int().gte(1).lte(2147483647),
  note: z.string().min(0).max(500).nullish(),
});
const CreateDeliveryNoteRequest = z.object({
  lines: z.array(DeliveryLineRequest).min(1),
  customerAddressId: z.number().int().nullish(),
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
const DeliveryNoteLineResponse = z
  .object({
    id: z.number().int(),
    orderDetailId: z.number().int(),
    orderCode: z.string().nullable(),
    proofingOrderCodes: z.array(z.string()).nullable(),
    designId: z.number().int(),
    designName: z.string().nullable(),
    designCode: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    orderedQty: z.number().int(),
    scrapQty: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyBefore: z.number().int(),
    deliveryQty: z.number().int(),
    actualDeliveredQty: z.number().int().nullable(),
    remainingAfter: z.number().int(),
    unitPriceSnapshot: z.number(),
    lineAmount: z.number(),
    note: z.string().nullable(),
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
    customerAddressId: z.number().int().nullable(),
    customerAddress: CustomerAddressResponse,
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
  lines: z.array(DeliveryLineRequest).nullish(),
  customerAddressId: z.number().int().nullish(),
  notes: z.string().nullish(),
});
const OrderDetailForDeliveryResponse = z
  .object({
    orderDetailId: z.number().int(),
    orderId: z.number().int(),
    orderCode: z.string().nullable(),
    itemStatus: z.string().nullable(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    orderedQty: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyTotal: z.number().int(),
    remainingToDeliver: z.number().int(),
    scrapQty: z.number().int(),
    unitPrice: z.number(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    proofingOrderCodes: z.array(z.string()).nullable(),
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
const OrderForDeliveryResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderForDeliveryResponse).nullable(),
  })
  .partial();
const UpdateDeliveryLineResultRequest = z.object({
  status: z.string().min(0).max(30),
  failureReasonId: z.number().int().nullish(),
  failureNotes: z.string().min(0).max(500).nullish(),
  actualDeliveredQty: z.number().int().gte(0).lte(2147483647).nullish(),
  note: z.string().min(0).max(500).nullish(),
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
const CustomerReturnRequest = z.object({
  returnQuantity: z.number().int().gte(1).lte(2147483647),
  returnReason: z.string().min(0).max(500),
  notes: z.string().min(0).max(1000).nullish(),
});
const CustomerReturnResponse = z
  .object({
    deliveryNoteLineId: z.number().int(),
    deliveryNoteCode: z.string().nullable(),
    orderDetailId: z.number().int(),
    designName: z.string().nullable(),
    designCode: z.string().nullable(),
    originalDeliveredQty: z.number().int(),
    returnQuantity: z.number().int(),
    newLineStatus: z.string().nullable(),
    returnReason: z.string().nullable(),
    stockInCode: z.string().nullable(),
    processedAt: z.string().datetime({ offset: true }),
    message: z.string().nullable(),
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
    requestedQuantity: z.number().int(),
    designerId: z.number().int(),
    designer: UserInfo,
    designTypeId: z.number().int(),
    designType: DesignTypeResponse,
    materialTypeId: z.number().int(),
    materialType: MaterialTypeResponse,
    designName: z.string().nullable(),
    unitName: z.string().nullable(),
    dimensions: z.string().nullable(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    areaM2: z.number().nullable(),
    sidesClassification: z.string().nullable(),
    processClassification: z.string().nullable(),
    laminationType: z.string().nullable(),
    adhesiveOffset: z.number().nullable(),
    laminationTypeName: z.string().nullable(),
    designFileUrl: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    excelFileUrl: z.string().nullable(),
    notes: z.string().nullable(),
    customer: CustomerSummaryResponse,
    latestOrderCode: z.string().nullable(),
    latestRequirements: z.string().nullable(),
    latestUnitPrice: z.number().nullable(),
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
    requestedQuantity: z.number().int().nullable(),
    designFileUrl: z.string().nullable(),
    excelFileUrl: z.string().nullable(),
    length: z.number().gte(0).nullable(),
    width: z.number().gte(0).nullable(),
    height: z.number().gte(0).nullable(),
    adhesiveOffset: z.number().gte(0).nullable(),
    sidesClassification: z.string().nullable(),
    processClassification: z.string().nullable(),
    laminationType: z.string().min(0).max(20).nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    isUrgent: z.boolean().nullable(),
  })
  .partial();
const CreateDesignStandaloneRequest = z.object({
  customerId: z.number().int(),
  designTypeId: z.number().int(),
  materialTypeId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
  designName: z.string().min(0).max(255).nullish(),
  length: z.number().gte(0).nullish(),
  width: z.number().gte(0).nullish(),
  height: z.number().gte(0).nullish(),
  adhesiveOffset: z.number().gte(0).nullish(),
  sidesClassification: z.string().nullish(),
  processClassification: z.string().nullish(),
  laminationType: z.string().min(0).max(20).nullish(),
  notes: z.string().nullish(),
});
const DesignResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DesignResponse).nullable(),
  })
  .partial();
const ReprintDesignRequest = z.object({
  quantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().nullish(),
  isUrgent: z.boolean().nullish(),
});
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
const RevertDesignRequest = z.object({ reason: z.string().min(0).max(500) });
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
    currentDebt: z.number(),
    createdById: z.number().int(),
    createdByName: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const DieUsageHistoryItem = z
  .object({
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    exportedAt: z.string().datetime({ offset: true }),
  })
  .partial();
const DieResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    size: z.string().nullable(),
    price: z.number().nullable(),
    imageUrl: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    vendor: VendorResponse,
    location: z.string().nullable(),
    status: z.string().nullable(),
    usageType: z.string().nullable(),
    isUsable: z.boolean(),
    notes: z.string().nullable(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: UserInfo,
    firstProofingOrderId: z.number().int().nullable(),
    firstProofingOrderCode: z.string().nullable(),
    usageHistory: z.array(DieUsageHistoryItem).nullable(),
  })
  .partial();
const DieResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(DieResponse).nullable(),
  })
  .partial();
const postApidies_Body = z
  .object({
    Size: z.string(),
    Price: z.number().optional(),
    VendorId: z.number().int().optional(),
    Notes: z.string().optional(),
    EstimatedReceiveAt: z.string().datetime({ offset: true }).optional(),
    ReceivedAt: z.string().datetime({ offset: true }).optional(),
    IsReusable: z.boolean().optional(),
    FirstProofingOrderId: z.number().int().optional(),
    image: z.instanceof(File).optional(),
  })
  .passthrough();
const UpdateDieRequest = z
  .object({
    code: z.string().nullable(),
    size: z.string().min(0).max(100).nullable(),
    price: z.number().nullable(),
    location: z.string().min(0).max(50).nullable(),
    isUsable: z.boolean().nullable(),
    notes: z.string().nullable(),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const DieExportResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    dieId: z.number().int(),
    die: DieResponse,
    notes: z.string().nullable(),
    createdBy: UserInfo,
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const AssignDieToProofingOrderRequest = z.object({
  dieId: z.number().int(),
  isNewDie: z.boolean().optional(),
  borrowedFromProofingOrderId: z.number().int().nullish(),
  notes: z.string().nullish(),
});
const ReplaceDieRequest = z
  .object({ newDieId: z.number().int(), notes: z.string().nullable() })
  .partial();
const CreateDieRequest = z.object({
  size: z.string().nullable(),
  price: z.number().nullish(),
  vendorId: z.number().int().nullish(),
  notes: z.string().nullish(),
  estimatedReceiveAt: z.string().datetime({ offset: true }).nullish(),
  receivedAt: z.string().datetime({ offset: true }).nullish(),
  isReusable: z.boolean().optional(),
  firstProofingOrderId: z.number().int().nullish(),
});
const UpdateDieStatusRequest = z.object({ status: z.string().min(1) });
const FinanceAccountFlatResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    name: z.string().nullable(),
    parentId: z.number().int().nullable(),
  })
  .partial();
const FinanceAccountNodeResponse: z.ZodType<FinanceAccountNodeResponse> =
  z.lazy(() =>
    z
      .object({
        id: z.number().int(),
        code: z.string().nullable(),
        name: z.string().nullable(),
        parentId: z.number().int().nullable(),
        totalReceipt: z.number(),
        totalPayment: z.number(),
        balance: z.number(),
        children: z.array(FinanceAccountNodeResponse).nullable(),
      })
      .partial(),
  );
const AdjustInventoryRequest = z.object({
  itemCode: z.string().min(1),
  itemType: z.string().min(1),
  newQuantity: z.number().int(),
  note: z.string().min(1).max(500),
});
const InventoryBalanceResponse = z
  .object({
    id: z.number().int(),
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    itemType: z.string().nullable(),
    unit: z.string().nullable(),
    currentQuantity: z.number().int(),
    averageUnitPrice: z.number(),
    lastTransactionDate: z.string().datetime({ offset: true }).nullable(),
    materialId: z.number().int().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const InventoryBalanceResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(InventoryBalanceResponse).nullable(),
  })
  .partial();
const InventoryTransactionResponse = z
  .object({
    id: z.number().int(),
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    itemType: z.string().nullable(),
    unit: z.string().nullable(),
    transactionType: z.string().nullable(),
    quantity: z.number().int(),
    previousQuantity: z.number().int(),
    newQuantity: z.number().int(),
    unitPrice: z.number().nullable(),
    referenceType: z.string().nullable(),
    referenceId: z.number().int().nullable(),
    referenceCode: z.string().nullable(),
    note: z.string().nullable(),
    createdById: z.number().int().nullable(),
    createdByName: z.string().nullable(),
    jobCode: z.string().nullable(),
    size: z.string().nullable(),
    quantityProduced: z.number().int().nullable(),
    stockOutPurpose: z.string().nullable(),
    stockOutPurposeName: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const InventoryTransactionResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(InventoryTransactionResponse).nullable(),
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
const StockHistoryResponse = z
  .object({
    id: z.number().int(),
    transactionType: z.string().nullable(),
    voucherCode: z.string().nullable(),
    voucherId: z.number().int(),
    transactionDate: z.string().datetime({ offset: true }),
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    itemType: z.string().nullable(),
    sourceOrPurpose: z.string().nullable(),
    sourceOrPurposeLabel: z.string().nullable(),
    status: z.string().nullable(),
    orderCode: z.string().nullable(),
    notes: z.string().nullable(),
    createdBy: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const StockHistoryResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(StockHistoryResponse).nullable(),
  })
  .partial();
const VendorReconciliationItemResponse = z
  .object({
    materialId: z.number().int(),
    materialName: z.string().nullable(),
    materialType: z.string().nullable(),
    unit: z.string().nullable(),
    openingBalance: z.number().int(),
    totalImport: z.number().int(),
    totalExport: z.number().int(),
    totalWaste: z.number().int(),
    closingBalance: z.number().int(),
  })
  .partial();
const VendorReconciliationResponse = z
  .object({
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    items: z.array(VendorReconciliationItemResponse).nullable(),
  })
  .partial();
const CreateInvoiceRequest = z.object({
  orderIds: z.array(z.number().int()).min(1),
  billToCustomerId: z.number().int().nullish(),
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
    paidAmount: z.number(),
    remainingDebt: z.number(),
    totalAmount: z.number(),
    taxAmount: z.number(),
    customerDisplayName: z.string().nullable(),
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
  billToCustomerId: z.number().int().nullish(),
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
const MaterialResponse = z
  .object({
    id: z.number().int(),
    name: z.string().nullable(),
    type: z.string().nullable(),
    length: z.number(),
    width: z.number().nullable(),
    unit: z.string().nullable(),
    unitPrice: z.number(),
    basisWeight: z.number().int().nullable(),
    currentStock: z.number().int(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    createdById: z.number().int(),
    createdBy: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const MaterialResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(MaterialResponse).nullable(),
  })
  .partial();
const CreateMaterialRequest = z.object({
  name: z.string().min(1),
  type: z
    .string()
    .min(1)
    .regex(/^(cuon|to)$/),
  length: z.number().gte(0),
  width: z.number().gte(0).nullish(),
  unit: z.string().max(50).nullish(),
  unitPrice: z.number().gte(0),
  basisWeight: z.number().int().nullish(),
  vendorId: z.number().int().nullish(),
});
const UpdateMaterialRequest = z
  .object({
    name: z.string().nullable(),
    type: z
      .string()
      .regex(/^(cuon|to)$/)
      .nullable(),
    length: z.number().gte(0).nullable(),
    width: z.number().gte(0).nullable(),
    unit: z.string().max(50).nullable(),
    unitPrice: z.number().gte(0).nullable(),
    basisWeight: z.number().int().nullable(),
    vendorId: z.number().int().nullable(),
    clearVendor: z.boolean().nullable(),
  })
  .partial();
const MaterialCutOutputLineRequest = z
  .object({
    outputMaterialId: z.number().int().nullable(),
    cutLength: z.number().nullable(),
    cutWidth: z.number().nullable(),
    quantityProduced: z.number().int().gte(1).lte(2147483647),
  })
  .partial();
const CreateMaterialCutRequest = z.object({
  inputMaterialId: z.number().int(),
  quantityUsed: z.number().int().gte(0).lte(2147483647).optional(),
  quantityWasted: z.number().int().gte(0).lte(2147483647).optional(),
  jobCode: z.string().nullish(),
  cutAt: z.string().datetime({ offset: true }).nullish(),
  notes: z.string().nullish(),
  outputs: z.array(MaterialCutOutputLineRequest),
});
const MaterialCutOutputLineResponse = z
  .object({
    id: z.number().int(),
    outputMaterialId: z.number().int(),
    outputMaterialName: z.string().nullable(),
    quantityProduced: z.number().int(),
    outputStockBefore: z.number().int().nullable(),
  })
  .partial();
const MaterialCutResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    inputMaterialId: z.number().int(),
    inputMaterialName: z.string().nullable(),
    quantityUsed: z.number().int(),
    quantityWasted: z.number().int(),
    inputStockBefore: z.number().int().nullable(),
    cutAt: z.string().datetime({ offset: true }),
    status: z.string().nullable(),
    notes: z.string().nullable(),
    createdBy: UserInfo,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    outputs: z.array(MaterialCutOutputLineResponse).nullable(),
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
  sharedAddressId: z.number().int().nullish(),
  designTypeId: z.number().int().nullish(),
  materialTypeId: z.number().int().nullish(),
  assignedDesignerId: z.number().int().nullish(),
  quantity: z.number().int().gte(1).lte(2147483647),
  designName: z.string().min(0).max(255).nullish(),
  length: z.number().gte(0).nullish(),
  width: z.number().gte(0).nullish(),
  height: z.number().gte(0).nullish(),
  adhesiveOffset: z.number().gte(0).nullish(),
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
const SharedAddressResponse = z
  .object({
    id: z.number().int(),
    label: z.string().nullable(),
    address: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
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
    sharedAddressId: z.number().int().nullable(),
    sharedAddress: SharedAddressResponse,
    deliveryAddressLabel: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    design: DesignResponse,
    specification: z.array(z.string()).nullable(),
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    lastUpdatedByAccountantId: z.number().int().nullable(),
    lastUpdatedByAccountant: UserInfo,
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
    producedQtyTotal: z.number().int(),
    scrapRate: z.number(),
    scrapQtyTotal: z.number().int(),
    netQtyTotal: z.number().int(),
    deliveredQtyTotal: z.number().int(),
    invoicedQtyTotal: z.number().int(),
    billableQuantity: z.number().int(),
    lineTotalAtBillableQty: z.number().nullable(),
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
    creator: UserInfo,
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
    isDebtApproved: z.boolean(),
    isComplete: z.boolean(),
    missingFields: z.array(z.string()).nullable(),
    orderDetails: z.array(OrderDetailResponse).nullable(),
    payments: z.array(PaymentSummaryResponse).nullable(),
    invoiceNumber: z.string().nullable(),
  })
  .partial();
const OrderDetailListResponse = z
  .object({
    id: z.number().int(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    quantity: z.number().int(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
  })
  .partial();
const OrderListResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    totalAmount: z.number(),
    depositAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    deliveryDate: z.string().datetime({ offset: true }).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    orderDetails: z.array(OrderDetailListResponse).nullable(),
    invoiceNumber: z.string().nullable(),
  })
  .partial();
const OrderListResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderListResponse).nullable(),
  })
  .partial();
const CreateOrderFromReadyDesignsRequest = z.object({
  readyDesignIds: z.array(z.number().int()),
  customerAddressId: z.number().int(),
  assignedToUserId: z.number().int().nullish(),
  deliveryDate: z.string().datetime({ offset: true }).nullish(),
  note: z.string().nullish(),
});
const UpdateOrderRequest = z
  .object({
    customerId: z.number().int().nullable(),
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
    lastUpdatedByAccountant: UserInfo,
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
  sharedAddressId: z.number().int().nullish(),
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
    paymentMethodId: z.number().int().nullable(),
    orderDetails: z.array(UpdateOrderDetailForAccountingRequest).nullable(),
  })
  .partial();
const CancelOrderRequest = z.object({ reason: z.string().min(0).max(500) });
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
    unitName: z.string().nullable(),
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
const PaperSizeResponseIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PaperSizeResponse).nullable(),
  })
  .partial();
const CreatePaperSizeRequest = z
  .object({
    name: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    isCustom: z.boolean(),
  })
  .partial();
const UpdatePaperSizeRequest = z
  .object({
    name: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    isCustom: z.boolean().nullable(),
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
    plateVendor: VendorResponse,
    plateCount: z.number().int(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    isActive: z.boolean(),
    productionMethod: z.string().nullable(),
    productionMethodName: z.string().nullable(),
    printingVendorId: z.number().int().nullable(),
    printingVendor: VendorResponse,
    printingVendorName: z.string().nullable(),
    outsourceCost: z.number(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
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
const UpdatePlateExportRequest = z
  .object({
    plateCount: z.number().int().gte(1).lte(6).nullable(),
    unitPrice: z.number().gte(0).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
    outsourceCost: z.number().gte(0).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const CreateProductionOrderRequest = z.object({
  proofingOrderId: z.number().int(),
  customSteps: z.array(z.string()).nullish(),
});
const ProductionStepResponse = z
  .object({
    id: z.number().int(),
    productionOrderId: z.number().int(),
    stepType: z.string().nullable(),
    stepTypeName: z.string().nullable(),
    stepOrder: z.number().int(),
    status: z.string().nullable(),
    assignedToId: z.number().int().nullable(),
    assignedToName: z.string().nullable(),
    inputQty: z.number().int(),
    outputQty: z.number().int(),
    defectQty: z.number().int(),
    defectNotes: z.string().nullable(),
    startedAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const ProductionOrderItemResponse = z
  .object({
    id: z.number().int(),
    productionOrderId: z.number().int(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    orderDetailId: z.number().int().nullable(),
    inputQty: z.number().int(),
    outputQty: z.number().int(),
    defectQty: z.number().int(),
    notes: z.string().nullable(),
  })
  .partial();
const ProofingOrderImageResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    imageUrl: z.string().nullable(),
    originalFileName: z.string().nullable(),
    sortOrder: z.number().int(),
    createdById: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const ProductionOrderResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    proofingOrderCode: z.string().nullable(),
    productionLeadId: z.number().int(),
    productionLeadName: z.string().nullable(),
    status: z.string().nullable(),
    progressPercent: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    startedAt: z.string().datetime({ offset: true }).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    producedQty: z.number().int(),
    totalWastage: z.number(),
    steps: z.array(ProductionStepResponse).nullable(),
    items: z.array(ProductionOrderItemResponse).nullable(),
    proofingOrderImages: z.array(ProofingOrderImageResponse).nullable(),
    customerName: z.string().nullable(),
    customerCompanyName: z.string().nullable(),
    deliveryStatus: z.string().nullable(),
    hasDeliveryNote: z.boolean(),
  })
  .partial();
const ProductionOrderResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ProductionOrderResponse).nullable(),
  })
  .partial();
const UpdateProductionStepRequest = z.object({
  status: z.string().min(1),
  inputQty: z.number().int().nullish(),
  outputQty: z.number().int().nullish(),
  defectQty: z.number().int().nullish(),
  defectNotes: z.string().nullish(),
});
const AssignProductionStepRequest = z
  .object({ assignedToUserId: z.number().int().nullable() })
  .partial();
const UpdateProductionOrderItemRequest = z.object({
  outputQty: z.number().int(),
  defectQty: z.number().int().nullish(),
  notes: z.string().nullish(),
});
const ProofingOrderDesignResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    designId: z.number().int(),
    design: DesignResponse,
    quantity: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    specification: z.array(z.string()).nullable(),
  })
  .partial();
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
    processClassification: z.string().nullable(),
    laminationType: z.string().nullable(),
    laminationTypeName: z.string().nullable(),
    isPlateExported: z.boolean(),
    plateOutputCount: z.number().int(),
    plateExport: PlateExportResponse,
    plateExports: z.array(PlateExportResponse).nullable(),
    dieExports: z.array(DieExportResponse).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    proofingOrderDesigns: z.array(ProofingOrderDesignResponse).nullable(),
    productions: z.array(ProductionResponse).nullable(),
    proofingOrderDies: z.array(DieExportResponse).nullable(),
    images: z.array(ProofingOrderImageResponse).nullable(),
  })
  .partial();
const DesignSimpleResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    customerId: z.number().int(),
    requestedQuantity: z.number().int(),
    designerId: z.number().int(),
    designTypeId: z.number().int(),
    designType: DesignTypeResponse,
    materialTypeId: z.number().int(),
    materialType: MaterialTypeResponse,
    designName: z.string().nullable(),
    unitName: z.string().nullable(),
    dimensions: z.string().nullable(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    areaM2: z.number().nullable(),
    sidesClassification: z.string().nullable(),
    processClassification: z.string().nullable(),
    laminationType: z.string().nullable(),
    adhesiveOffset: z.number().nullable(),
    laminationTypeName: z.string().nullable(),
    designFileUrl: z.string().nullable(),
    designImageUrl: z.string().nullable(),
    excelFileUrl: z.string().nullable(),
    notes: z.string().nullable(),
    status: z.string().nullable(),
    statusType: z.string().nullable(),
    availableQuantityForProofing: z.number().int().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .partial();
const ProofingOrderDesignListResponse = z
  .object({
    id: z.number().int(),
    proofingOrderId: z.number().int(),
    designId: z.number().int(),
    design: DesignSimpleResponse,
    quantity: z.number().int(),
  })
  .partial();
const ProofingOrderListResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    materialTypeId: z.number().int().nullable(),
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
    plateOutputCount: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    proofingOrderDesigns: z.array(ProofingOrderDesignListResponse).nullable(),
  })
  .partial();
const ProofingOrderListResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ProofingOrderListResponse).nullable(),
  })
  .partial();
const AddProofingOrderDetailItem = z.object({
  orderDetailId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
});
const AddDesignsToProofingOrderRequest = z.object({
  materialTypeId: z.number().int(),
  items: z.array(AddProofingOrderDetailItem),
});
const UpdateProofingDesignItem = z.object({
  proofingOrderDesignId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
});
const UpdateProofingOrderRequest = z
  .object({
    status: z.string().min(0).max(50).nullable(),
    notes: z.string().nullable(),
    paperSizeId: z.number().int().nullable(),
    customPaperSize: z.string().nullable(),
    totalQuantity: z.number().int().gte(1).lte(2147483647).nullable(),
    designUpdates: z.array(UpdateProofingDesignItem).nullable(),
  })
  .partial();
const RejectDesignRequest = z.object({
  orderDetailId: z.number().int(),
  reason: z.string().nullish(),
});
const OrderDetailAvailableResponse = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    designId: z.number().int(),
    sharedAddressId: z.number().int().nullable(),
    sharedAddress: SharedAddressResponse,
    deliveryAddressLabel: z.string().nullable(),
    deliveryAddress: z.string().nullable(),
    design: DesignSimpleResponse,
    specification: z.array(z.string()).nullable(),
    quantity: z.number().int(),
    unitPrice: z.number().nullable(),
    totalPrice: z.number().nullable(),
    requirements: z.string().nullable(),
    additionalNotes: z.string().nullable(),
    lastUpdatedByAccountantId: z.number().int().nullable(),
    lastUpdatedByAccountant: UserInfo,
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
const OrderDetailAvailableResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(OrderDetailAvailableResponse).nullable(),
  })
  .partial();
const DesignTypeCountResponse = z
  .object({
    designTypeId: z.number().int(),
    designTypeName: z.string().nullable(),
    designTypeCode: z.string().nullable(),
    count: z.number().int(),
  })
  .partial();
const RecordPlateExportRequest = z
  .object({
    plateVendorId: z.number().int().nullable(),
    plateCount: z.number().int().gte(1).lte(6),
    unitPrice: z.number().gte(0),
    sentAt: z.string().datetime({ offset: true }).nullable(),
    estimatedReceiveAt: z.string().datetime({ offset: true }).nullable(),
    receivedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
    productionMethod: z.string().nullable(),
    printingVendorId: z.number().int().nullable(),
  })
  .partial();
const RecordDieExportRequest = z.object({
  dieIds: z.array(z.number().int()).min(1),
  notes: z.string().nullish(),
});
const CancelProofingOrderRequest = z.object({ reason: z.string().min(1) });
const postApiproofingOrdersIdimages_Body = z
  .object({ files: z.array(z.instanceof(File)) })
  .partial()
  .passthrough();
const PurchaseSummaryRow = z
  .object({
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    vendorPhone: z.string().nullable(),
    vendorType: z.string().nullable(),
    purchaseCount: z.number().int(),
    totalQuantity: z.number(),
    totalAmount: z.number(),
    paymentAmount: z.number(),
    remainingDebt: z.number(),
  })
  .partial();
const PurchaseSummaryRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PurchaseSummaryRow).nullable(),
  })
  .partial();
const PurchaseDetailLedgerRow = z
  .object({
    stockInId: z.number().int(),
    date: z.string().datetime({ offset: true }),
    voucherCode: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    itemName: z.string().nullable(),
    itemCode: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number(),
    unitPrice: z.number().nullable(),
    amount: z.number(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    notes: z.string().nullable(),
  })
  .partial();
const PurchaseDetailLedgerRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PurchaseDetailLedgerRow).nullable(),
  })
  .partial();
const PurchaseByItemRow = z
  .object({
    itemCode: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    length: z.number().nullable(),
    width: z.number().nullable(),
    totalQuantity: z.number(),
    totalAmount: z.number(),
    vendorCount: z.number().int(),
    purchaseCount: z.number().int(),
    avgUnitPrice: z.number(),
  })
  .partial();
const PurchaseByItemRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PurchaseByItemRow).nullable(),
  })
  .partial();
const PurchaseJournalRow = z
  .object({
    stockInId: z.number().int(),
    date: z.string().datetime({ offset: true }),
    voucherCode: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    vendorName: z.string().nullable(),
    description: z.string().nullable(),
    itemCount: z.number().int(),
    totalQuantity: z.number(),
    totalAmount: z.number(),
    status: z.string().nullable(),
    createdBy: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial();
const PurchaseJournalRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(PurchaseJournalRow).nullable(),
  })
  .partial();
const VendorReceiptStatisticsRow = z
  .object({
    vendorId: z.number().int(),
    vendorName: z.string().nullable(),
    vendorType: z.string().nullable(),
    receiptCount: z.number().int(),
    totalItemCount: z.number().int(),
    totalQuantity: z.number(),
    totalAmount: z.number(),
    pendingCount: z.number().int(),
    completedCount: z.number().int(),
  })
  .partial();
const VendorReceiptStatisticsRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(VendorReceiptStatisticsRow).nullable(),
  })
  .partial();
const ReadyDesignResponse = z
  .object({
    id: z.number().int(),
    designId: z.number().int(),
    designCode: z.string().nullable(),
    designName: z.string().nullable(),
    customerId: z.number().int(),
    customerName: z.string().nullable(),
    quantity: z.number().int(),
    dimensions: z.string().nullable(),
    materialTypeName: z.string().nullable(),
    status: z.string().nullable(),
    orderCode: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    notes: z.string().nullable(),
    isUrgent: z.boolean(),
  })
  .partial();
const ReadyDesignResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(ReadyDesignResponse).nullable(),
  })
  .partial();
const UpdateReadyDesignRequest = z
  .object({ isUrgent: z.boolean().nullable(), notes: z.string().nullable() })
  .partial();
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
const ReturnLineRequest = z.object({
  deliveryNoteLineId: z.number().int(),
  returnQty: z.number().int().gte(1).lte(2147483647),
  reason: z.string().min(1).max(500),
});
const CreateReturnNoteRequest = z.object({
  deliveryNoteId: z.number().int(),
  lines: z.array(ReturnLineRequest).min(1),
});
const ReturnNoteLineResponse = z
  .object({
    id: z.number().int(),
    deliveryNoteLineId: z.number().int(),
    productName: z.string().nullable(),
    productCode: z.string().nullable(),
    returnQty: z.number().int(),
    reason: z.string().nullable(),
  })
  .partial();
const ReturnNoteResponse = z
  .object({
    id: z.number().int(),
    code: z.string().nullable(),
    deliveryNoteId: z.number().int(),
    deliveryNoteCode: z.string().nullable(),
    status: z.string().nullable(),
    statusLabel: z.string().nullable(),
    totalReturnQty: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    createdByName: z.string().nullable(),
    processedAt: z.string().datetime({ offset: true }).nullable(),
    processedByName: z.string().nullable(),
    lines: z.array(ReturnNoteLineResponse).nullable(),
  })
  .partial();
const ReturnableLineResponse = z
  .object({
    deliveryNoteLineId: z.number().int(),
    productName: z.string().nullable(),
    productCode: z.string().nullable(),
    actualDeliveredQty: z.number().int(),
    alreadyReturnedQty: z.number().int(),
    maxReturnableQty: z.number().int(),
    status: z.string().nullable(),
  })
  .partial();
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
const SalesDetailLedgerRow = z
  .object({
    date: z.string().datetime({ offset: true }),
    documentNumber: z.string().nullable(),
    description: z.string().nullable(),
    revenue: z.number(),
    tax: z.number(),
    total: z.number(),
  })
  .partial();
const SalesDetailLedgerRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SalesDetailLedgerRow).nullable(),
  })
  .partial();
const SalesSummaryRow = z
  .object({
    period: z.string().nullable(),
    invoiceCount: z.number().int(),
    revenue: z.number(),
    tax: z.number(),
    total: z.number(),
  })
  .partial();
const SalesSummaryRowIPaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SalesSummaryRow).nullable(),
  })
  .partial();
const CreateSharedAddressRequest = z.object({
  label: z.string().min(0).max(100),
  address: z.string().min(0).max(500),
});
const SharedAddressResponsePaginate = z
  .object({
    size: z.number().int(),
    page: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(SharedAddressResponse).nullable(),
  })
  .partial();
const UpdateSharedAddressRequest = z
  .object({
    label: z.string().min(0).max(100).nullable(),
    address: z.string().min(0).max(500).nullable(),
  })
  .partial();
const StockInItemRequest = z.object({
  lineKind: z.string().max(32).nullish(),
  itemName: z.string().min(1),
  itemCode: z.string().nullish(),
  unit: z.string().nullish(),
  quantity: z.number().int().gte(1).lte(2147483647),
  unitPrice: z.number().nullish(),
  lineAmount: z.number().nullish(),
  notes: z.string().nullish(),
  materialId: z.number().int().nullish(),
  orderDetailId: z.number().int().nullish(),
  length: z.number().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  ramQuantity: z.number().nullish(),
  proofingOrderId: z.number().int().nullish(),
  jobCode: z.string().nullish(),
});
const CreateStockInRequest = z.object({
  source: z.string().min(1),
  itemType: z.string().nullish(),
  vendorId: z.number().int().nullish(),
  productionOrderId: z.number().int().nullish(),
  deliveryNoteId: z.number().int().nullish(),
  originalStockOutId: z.number().int().nullish(),
  orderId: z.number().int().nullish(),
  totalAmount: z.number().nullish(),
  laborCost: z.number().optional(),
  notes: z.string().nullish(),
  stockInDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockInItemRequest),
});
const CreateStockInFromVendorRequest = z.object({
  vendorId: z.number().int(),
  laborCost: z.number().optional(),
  itemType: z.string().nullish(),
  totalAmount: z.number().nullish(),
  notes: z.string().nullish(),
  stockInDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockInItemRequest),
});
const CreateStockInFromProductionRequest = z.object({
  productionOrderId: z.number().int(),
  itemType: z.string().nullish(),
  notes: z.string().nullish(),
  stockInDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockInItemRequest),
});
const CreateStockInFromCutRequest = z.object({
  materialCutId: z.number().int(),
  notes: z.string().nullish(),
});
const CreateStockInFromDeliveryReturnRequest = z.object({
  deliveryNoteId: z.number().int(),
  originalStockOutId: z.number().int(),
  itemType: z.string().nullish(),
  returnReason: z.string().nullish(),
  notes: z.string().nullish(),
  stockInDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockInItemRequest),
});
const UpdateStockInRequest = z
  .object({
    source: z.string().nullable(),
    itemType: z.string().nullable(),
    status: z.string().nullable(),
    vendorId: z.number().int().nullable(),
    productionOrderId: z.number().int().nullable(),
    deliveryNoteId: z.number().int().nullable(),
    orderId: z.number().int().nullable(),
    totalAmount: z.number().nullable(),
    laborCost: z.number().nullable(),
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
  materialId: z.number().int().nullish(),
  orderDetailId: z.number().int().nullish(),
});
const CreateStockOutRequest = z.object({
  purpose: z.string().min(1),
  itemType: z.string().nullish(),
  productionOrderId: z.number().int().nullish(),
  deliveryNoteId: z.number().int().nullish(),
  customerId: z.number().int().nullish(),
  orderId: z.number().int().nullish(),
  vendorId: z.number().int().nullish(),
  receiverName: z.string().nullish(),
  receiverAddress: z.string().nullish(),
  warehouseName: z.string().nullish(),
  warehouseAddress: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockOutItemRequest),
});
const CreateStockOutForProductionRequest = z.object({
  productionOrderId: z.number().int(),
  itemType: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockOutItemRequest),
});
const CreateStockOutForDeliveryRequest = z.object({
  deliveryNoteId: z.number().int(),
  customerId: z.number().int().nullish(),
  orderId: z.number().int().nullish(),
  itemType: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(StockOutItemRequest),
});
const CreateStockOutForSpecialReasonRequest = z.object({
  reason: z
    .string()
    .min(1)
    .regex(/^(return_vendor|transfer)$/),
  materialId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
  documentCode: z.string().nullish(),
  notes: z.string().nullish(),
});
const ProductionStockOutItemRequest = z.object({
  materialId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().nullish(),
});
const CreateProductionStockOutByVendorRequest = z.object({
  vendorId: z.number().int(),
  receiverName: z.string().min(1),
  exportReason: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(ProductionStockOutItemRequest).min(1),
});
const CreateOutsourceStockOutRequest = z.object({
  vendorId: z.number().int(),
  exportReason: z.string().nullish(),
  warehouseName: z.string().nullish(),
  warehouseAddress: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(ProductionStockOutItemRequest).min(1),
});
const CreateReturnVendorStockOutRequest = z.object({
  vendorId: z.number().int(),
  exportReason: z.string().nullish(),
  warehouseName: z.string().nullish(),
  warehouseAddress: z.string().nullish(),
  notes: z.string().nullish(),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
  items: z.array(ProductionStockOutItemRequest).min(1),
});
const CreateAdjustmentStockOutRequest = z.object({
  materialId: z.number().int(),
  quantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().min(1),
  stockOutDate: z.string().datetime({ offset: true }).nullish(),
});
const ReturnItemRequest = z.object({
  stockOutItemId: z.number().int(),
  returnQuantity: z.number().int().gte(1).lte(2147483647),
  notes: z.string().nullish(),
});
const ProcessDeliveryReturnRequest = z.object({
  stockOutId: z.number().int(),
  returnReason: z.string().min(1),
  notes: z.string().nullish(),
  returnItems: z.array(ReturnItemRequest),
});
const UpdateStockOutRequest = z
  .object({
    purpose: z.string().nullable(),
    itemType: z.string().nullable(),
    status: z.string().nullable(),
    productionOrderId: z.number().int().nullable(),
    deliveryNoteId: z.number().int().nullable(),
    customerId: z.number().int().nullable(),
    orderId: z.number().int().nullable(),
    vendorId: z.number().int().nullable(),
    receiverName: z.string().nullable(),
    receiverAddress: z.string().nullable(),
    warehouseName: z.string().nullable(),
    warehouseAddress: z.string().nullable(),
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
      /^(admin|manager|design|design_lead|proofer|production|production_lead|accounting|accounting_lead|warehouse|warehouse_lead|hr|hr_lead|cskh|cskh_lead|sale)$/,
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
const UpdateMyProfileRequest = z
  .object({
    fullName: z.string().min(0).max(255).nullable(),
    email: z.string().min(0).max(255).email().nullable(),
    phone: z.string().min(0).max(20).nullable(),
  })
  .partial();
const ResetPasswordRequest = z.object({
  newPassword: z.string().min(6).max(100),
});
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
  ProblemDetails,
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
  CreateCustomerAddressRequest,
  CustomerAddressResponse,
  CustomerAddressResponsePaginate,
  UpdateCustomerAddressRequest,
  CustomerDebtHistoryResponse,
  CustomerDebtHistoryResponsePaginate,
  CustomerMonthlyDebtResponse,
  CustomerDebtSummaryResponse,
  FrequentProductResponse,
  CustomerStatisticsResponse,
  OrderHistoryDetailResponse,
  CustomerOrderHistoryResponse,
  CustomerOrderHistoryResponsePaginate,
  CreateDebtNotificationRequest,
  DebtNotificationResponse,
  DebtNotificationResponseIPaginate,
  DebtNotificationPreviewResponse,
  DebtReconciliationARRequest,
  DebtReconciliationResponse,
  DebtReconciliationAPRequest,
  ARSummaryResponse,
  ARSummaryResponseIPaginate,
  ARDetailLedgerRow,
  ARDetailLedgerRowIPaginate,
  ARDetailByInvoiceResponse,
  ARDetailByInvoiceResponseIPaginate,
  ARDetailResponse,
  ARDetailResponseIPaginate,
  ARAgingResponse,
  ARAgingResponseIPaginate,
  CollectionScheduleResponse,
  CollectionScheduleResponseIPaginate,
  ARByItemResponse,
  ARByItemResponseIPaginate,
  ARUnderdueResponse,
  ARUnderdueResponseIPaginate,
  ARSummaryByCustomerGroupResponse,
  ARSummaryByCustomerGroupResponseIPaginate,
  ARSummaryByBranchResponse,
  ARSummaryByBranchResponseIPaginate,
  AROverdueResponse,
  AROverdueResponseIPaginate,
  APByPurchaseInvoiceResponse,
  APByPurchaseInvoiceResponseIPaginate,
  APOverdueResponse,
  APOverdueResponseIPaginate,
  APSummaryResponse,
  APSummaryResponseIPaginate,
  APDetailLedgerRow,
  APDetailLedgerRowIPaginate,
  APDetailResponse,
  APDetailResponseIPaginate,
  APAgingResponse,
  APAgingResponseIPaginate,
  CreateDefectRecordRequest,
  DefectRecordResponse,
  DefectRecordResponsePaginate,
  UpdateDefectRecordRequest,
  DefectBySourceBreakdown,
  DefectRecordSummaryByUserResponse,
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
  OrderForDeliveryResponsePaginate,
  UpdateDeliveryLineResultRequest,
  FailureReasonResponse,
  CustomerReturnRequest,
  CustomerReturnResponse,
  DesignTypeResponse,
  MaterialTypeResponse,
  DesignTimelineEntryResponse,
  DesignResponse,
  UpdateDesignRequest,
  CreateDesignStandaloneRequest,
  DesignResponsePaginate,
  ReprintDesignRequest,
  postApidesignsIdtimeline_Body,
  DesignTimelineEntryResponsePaginate,
  RevertDesignRequest,
  CreateDesignTypeRequest,
  DesignTypeResponsePaginate,
  UpdateDesignTypeRequest,
  VendorResponse,
  DieUsageHistoryItem,
  DieResponse,
  DieResponseIPaginate,
  postApidies_Body,
  UpdateDieRequest,
  DieExportResponse,
  AssignDieToProofingOrderRequest,
  ReplaceDieRequest,
  CreateDieRequest,
  UpdateDieStatusRequest,
  FinanceAccountFlatResponse,
  FinanceAccountNodeResponse,
  AdjustInventoryRequest,
  InventoryBalanceResponse,
  InventoryBalanceResponseIPaginate,
  InventoryTransactionResponse,
  InventoryTransactionResponseIPaginate,
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
  StockHistoryResponse,
  StockHistoryResponseIPaginate,
  VendorReconciliationItemResponse,
  VendorReconciliationResponse,
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
  MaterialResponse,
  MaterialResponseIPaginate,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  MaterialCutOutputLineRequest,
  CreateMaterialCutRequest,
  MaterialCutOutputLineResponse,
  MaterialCutResponse,
  CreateMaterialTypeRequest,
  MaterialTypeResponsePaginate,
  MaterialTypeItem,
  BulkCreateMaterialTypeRequest,
  UpdateMaterialTypeRequest,
  CreateDesignRequest,
  CreateOrderRequest,
  SharedAddressResponse,
  ProofingAllocationResponse,
  OrderDetailResponse,
  PaymentSummaryResponse,
  OrderResponse,
  OrderDetailListResponse,
  OrderListResponse,
  OrderListResponsePaginate,
  CreateOrderFromReadyDesignsRequest,
  UpdateOrderRequest,
  AddDesignToOrderRequest,
  OrderDetailResponseForDesigner,
  OrderResponseForDesigner,
  OrderResponseForDesignerPaginate,
  UpdateOrderDetailForAccountingRequest,
  UpdateOrderForAccountingRequest,
  CancelOrderRequest,
  OrderDetailExportResponse,
  OrderExportResponse,
  PaperSizeResponse,
  PaperSizeResponseIPaginate,
  CreatePaperSizeRequest,
  UpdatePaperSizeRequest,
  CreatePaymentRequest,
  PaymentResponse,
  PaymentResponsePaginate,
  PlateExportResponse,
  PlateExportResponsePaginate,
  UpdatePlateExportRequest,
  CreateProductionOrderRequest,
  ProductionStepResponse,
  ProductionOrderItemResponse,
  ProofingOrderImageResponse,
  ProductionOrderResponse,
  ProductionOrderResponsePaginate,
  UpdateProductionStepRequest,
  AssignProductionStepRequest,
  UpdateProductionOrderItemRequest,
  ProofingOrderDesignResponse,
  ProductionResponse,
  ProofingOrderResponse,
  DesignSimpleResponse,
  ProofingOrderDesignListResponse,
  ProofingOrderListResponse,
  ProofingOrderListResponsePaginate,
  AddProofingOrderDetailItem,
  AddDesignsToProofingOrderRequest,
  UpdateProofingDesignItem,
  UpdateProofingOrderRequest,
  RejectDesignRequest,
  OrderDetailAvailableResponse,
  OrderDetailAvailableResponsePaginate,
  DesignTypeCountResponse,
  RecordPlateExportRequest,
  RecordDieExportRequest,
  CancelProofingOrderRequest,
  postApiproofingOrdersIdimages_Body,
  PurchaseSummaryRow,
  PurchaseSummaryRowIPaginate,
  PurchaseDetailLedgerRow,
  PurchaseDetailLedgerRowIPaginate,
  PurchaseByItemRow,
  PurchaseByItemRowIPaginate,
  PurchaseJournalRow,
  PurchaseJournalRowIPaginate,
  VendorReceiptStatisticsRow,
  VendorReceiptStatisticsRowIPaginate,
  ReadyDesignResponse,
  ReadyDesignResponsePaginate,
  UpdateReadyDesignRequest,
  ReportExportResponse,
  ReportExportResponseIPaginate,
  ReturnLineRequest,
  CreateReturnNoteRequest,
  ReturnNoteLineResponse,
  ReturnNoteResponse,
  ReturnableLineResponse,
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
  SalesDetailLedgerRow,
  SalesDetailLedgerRowIPaginate,
  SalesSummaryRow,
  SalesSummaryRowIPaginate,
  CreateSharedAddressRequest,
  SharedAddressResponsePaginate,
  UpdateSharedAddressRequest,
  StockInItemRequest,
  CreateStockInRequest,
  CreateStockInFromVendorRequest,
  CreateStockInFromProductionRequest,
  CreateStockInFromCutRequest,
  CreateStockInFromDeliveryReturnRequest,
  UpdateStockInRequest,
  StockOutItemRequest,
  CreateStockOutRequest,
  CreateStockOutForProductionRequest,
  CreateStockOutForDeliveryRequest,
  CreateStockOutForSpecialReasonRequest,
  ProductionStockOutItemRequest,
  CreateProductionStockOutByVendorRequest,
  CreateOutsourceStockOutRequest,
  CreateReturnVendorStockOutRequest,
  CreateAdjustmentStockOutRequest,
  ReturnItemRequest,
  ProcessDeliveryReturnRequest,
  UpdateStockOutRequest,
  CreateUserRequest,
  UserResponse,
  UserResponsePaginate,
  UpdateMyProfileRequest,
  ResetPasswordRequest,
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
    path: "/api/accounting/:accountingId/confirm-payment",
    alias: "postApiaccountingAccountingIdconfirmPayment",
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
    path: "/api/accounting/export-debt",
    alias: "postApiaccountingexportDebt",
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
    path: "/api/accounting/order/:orderId",
    alias: "postApiaccountingorderOrderId",
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
    path: "/api/accounting/order/:orderId",
    alias: "getApiaccountingorderOrderId",
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
    path: "/api/accounting/order/:orderId/approve-debt",
    alias: "postApiaccountingorderOrderIdapproveDebt",
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
    path: "/api/accounting/order/:orderId/confirm-deposit",
    alias: "postApiaccountingorderOrderIdconfirmDeposit",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    method: "get",
    path: "/api/cash-payments/:id/export-pdf",
    alias: "getApicashPaymentsIdexportPdf",
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
    method: "get",
    path: "/api/cash-payments/export",
    alias: "getApicashPaymentsexport",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    method: "get",
    path: "/api/cash-receipts/:id/export-pdf",
    alias: "getApicashReceiptsIdexportPdf",
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
    path: "/api/cash-receipts/export",
    alias: "getApicashReceiptsexport",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    method: "delete",
    path: "/api/customers/:id",
    alias: "deleteApicustomersId",
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
    method: "post",
    path: "/api/customers/:id/addresses",
    alias: "postApicustomersIdaddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCustomerAddressRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerAddressResponse,
  },
  {
    method: "get",
    path: "/api/customers/:id/addresses",
    alias: "getApicustomersIdaddresses",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CustomerAddressResponsePaginate,
  },
  {
    method: "put",
    path: "/api/customers/:id/addresses/:addressId",
    alias: "putApicustomersIdaddressesAddressId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateCustomerAddressRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "addressId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerAddressResponse,
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/api/debt-notifications",
    alias: "postApidebtNotifications",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDebtNotificationRequest,
      },
    ],
    response: DebtNotificationResponse,
  },
  {
    method: "get",
    path: "/api/debt-notifications",
    alias: "getApidebtNotifications",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "isRead",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: DebtNotificationResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-notifications/:id/preview",
    alias: "getApidebtNotificationsIdpreview",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DebtNotificationPreviewResponse,
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
    method: "put",
    path: "/api/debt-notifications/:id/read",
    alias: "putApidebtNotificationsIdread",
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
    path: "/api/debt-notifications/read-all",
    alias: "putApidebtNotificationsreadAll",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/debt-reconciliations/ap",
    alias: "postApidebtReconciliationsap",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DebtReconciliationAPRequest,
      },
    ],
    response: DebtReconciliationResponse,
  },
  {
    method: "get",
    path: "/api/debt-reconciliations/ap/:id/download",
    alias: "getApidebtReconciliationsapIddownload",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "format",
        type: "Query",
        schema: z.string().optional().default("pdf"),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "post",
    path: "/api/debt-reconciliations/ar",
    alias: "postApidebtReconciliationsar",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DebtReconciliationARRequest,
      },
    ],
    response: DebtReconciliationResponse,
  },
  {
    method: "get",
    path: "/api/debt-reconciliations/ar/:id/download",
    alias: "getApidebtReconciliationsarIddownload",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "format",
        type: "Query",
        schema: z.string().optional().default("pdf"),
      },
    ],
    response: z.instanceof(File),
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-by-purchase-invoice",
    alias: "getApidebtReportsapByPurchaseInvoice",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: APByPurchaseInvoiceResponseIPaginate,
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: APDetailResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-detail-ledger/:vendorId",
    alias: "getApidebtReportsapDetailLedgerVendorId",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: APDetailLedgerRowIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-detail-ledger/:vendorId/export",
    alias: "getApidebtReportsapDetailLedgerVendorIdexport",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ap-overdue",
    alias: "getApidebtReportsapOverdue",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: APOverdueResponseIPaginate,
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-aging/export-pdf",
    alias: "getApidebtReportsarAgingexportPdf",
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-by-item",
    alias: "getApidebtReportsarByItem",
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARByItemResponseIPaginate,
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARDetailResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-detail-by-invoice",
    alias: "getApidebtReportsarDetailByInvoice",
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
        name: "paymentStatus",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARDetailByInvoiceResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-detail-ledger/:customerId",
    alias: "getApidebtReportsarDetailLedgerCustomerId",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARDetailLedgerRowIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-overdue",
    alias: "getApidebtReportsarOverdue",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: AROverdueResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-overdue/export",
    alias: "getApidebtReportsarOverdueexport",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARSummaryResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-summary-by-branch",
    alias: "getApidebtReportsarSummaryByBranch",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARSummaryByBranchResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-summary-by-customer-group",
    alias: "getApidebtReportsarSummaryByCustomerGroup",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARSummaryByCustomerGroupResponseIPaginate,
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-summary/export-pdf",
    alias: "getApidebtReportsarSummaryexportPdf",
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/ar-underdue",
    alias: "getApidebtReportsarUnderdue",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ARUnderdueResponseIPaginate,
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CollectionScheduleResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/debt-reports/customer-reconciliation/export",
    alias: "getApidebtReportscustomerReconciliationexport",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
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
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/customer-reconciliation/export-pdf",
    alias: "getApidebtReportscustomerReconciliationexportPdf",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
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
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/debt-reports/customer-reconciliation/export-word",
    alias: "getApidebtReportscustomerReconciliationexportWord",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
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
    response: z.instanceof(File),
  },
  {
    method: "post",
    path: "/api/defect-records",
    alias: "postApidefectRecords",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDefectRecordRequest,
      },
    ],
    response: DefectRecordResponse,
  },
  {
    method: "get",
    path: "/api/defect-records",
    alias: "getApidefectRecords",
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
        name: "assignedToUserId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "defectSource",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "productionOrderId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "designId",
        type: "Query",
        schema: z.number().int().optional(),
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DefectRecordResponsePaginate,
  },
  {
    method: "get",
    path: "/api/defect-records/:id",
    alias: "getApidefectRecordsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DefectRecordResponse,
  },
  {
    method: "put",
    path: "/api/defect-records/:id",
    alias: "putApidefectRecordsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDefectRecordRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DefectRecordResponse,
  },
  {
    method: "delete",
    path: "/api/defect-records/:id",
    alias: "deleteApidefectRecordsId",
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
    path: "/api/defect-records/by-production-order/:productionOrderId",
    alias: "getApidefectRecordsbyProductionOrderProductionOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "productionOrderId",
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
    response: DefectRecordResponsePaginate,
  },
  {
    method: "get",
    path: "/api/defect-records/summary-by-user",
    alias: "getApidefectRecordssummaryByUser",
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
        name: "defectSource",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(DefectRecordSummaryByUserResponse),
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DeliveryNoteResponsePaginate,
  },
  {
    method: "get",
    path: "/api/delivery-notes/:deliveryNoteId/returnable-lines",
    alias: "getApideliveryNotesDeliveryNoteIdreturnableLines",
    requestFormat: "json",
    parameters: [
      {
        name: "deliveryNoteId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(ReturnableLineResponse),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
      {
        name: "type",
        type: "Query",
        schema: z.string().optional().default("A4"),
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
    path: "/api/delivery-notes/available-order-details",
    alias: "getApideliveryNotesavailableOrderDetails",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(OrderDetailForDeliveryResponse),
  },
  {
    method: "get",
    path: "/api/delivery-notes/available-orders",
    alias: "getApideliveryNotesavailableOrders",
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "productName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "proofingOrderCode",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderForDeliveryResponsePaginate,
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
    method: "post",
    path: "/api/delivery-notes/lines/:lineId/customer-return",
    alias: "postApideliveryNoteslinesLineIdcustomerReturn",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CustomerReturnRequest,
      },
      {
        name: "lineId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: CustomerReturnResponse,
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
    method: "post",
    path: "/api/designs",
    alias: "postApidesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDesignStandaloneRequest,
      },
    ],
    response: DesignResponse,
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/api/designs/:id/reprint",
    alias: "postApidesignsIdreprint",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ReprintDesignRequest,
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
    path: "/api/designs/:id/revert-to-waiting",
    alias: "postApidesignsIdrevertToWaiting",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(0).max(500) }),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DesignResponsePaginate,
  },
  {
    method: "get",
    path: "/api/designs/sale",
    alias: "getApidesignssale",
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
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "dimensions",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designType",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "materialType",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "searchQuery",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DesignResponsePaginate,
  },
  {
    method: "get",
    path: "/api/dies",
    alias: "getApidies",
    requestFormat: "json",
    parameters: [
      {
        name: "q",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "code",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "size",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designTypeName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "proofingOrderCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "vendorName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "notes",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "isUsable",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "location",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "designTypeId",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: DieResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/dies",
    alias: "postApidies",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApidies_Body,
      },
    ],
    response: DieResponse,
  },
  {
    method: "get",
    path: "/api/dies/:id",
    alias: "getApidiesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieResponse,
  },
  {
    method: "put",
    path: "/api/dies/:id",
    alias: "putApidiesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDieRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieResponse,
  },
  {
    method: "delete",
    path: "/api/dies/:id",
    alias: "deleteApidiesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.boolean(),
  },
  {
    method: "post",
    path: "/api/dies/:id/image",
    alias: "postApidiesIdimage",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ image: z.instanceof(File) })
          .partial()
          .passthrough(),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieResponse,
  },
  {
    method: "put",
    path: "/api/dies/:id/status",
    alias: "putApidiesIdstatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ status: z.string().min(1) }),
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieResponse,
  },
  {
    method: "post",
    path: "/api/dies/die-export/:dieExportId/return",
    alias: "postApidiesdieExportDieExportIdreturn",
    requestFormat: "json",
    parameters: [
      {
        name: "dieExportId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieExportResponse,
  },
  {
    method: "post",
    path: "/api/dies/die-export/:dieExportId/take-out",
    alias: "postApidiesdieExportDieExportIdtakeOut",
    requestFormat: "json",
    parameters: [
      {
        name: "dieExportId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieExportResponse,
  },
  {
    method: "post",
    path: "/api/dies/from-die-export/:dieExportId",
    alias: "postApidiesfromDieExportDieExportId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDieRequest,
      },
      {
        name: "dieExportId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieResponse,
  },
  {
    method: "get",
    path: "/api/dies/proofing-order/:proofingOrderId",
    alias: "getApidiesproofingOrderProofingOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(DieExportResponse),
  },
  {
    method: "post",
    path: "/api/dies/proofing-order/:proofingOrderId/assign",
    alias: "postApidiesproofingOrderProofingOrderIdassign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AssignDieToProofingOrderRequest,
      },
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieExportResponse,
  },
  {
    method: "put",
    path: "/api/dies/proofing-order/:proofingOrderId/die/:currentDieId",
    alias: "putApidiesproofingOrderProofingOrderIddieCurrentDieId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ReplaceDieRequest,
      },
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "currentDieId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: DieExportResponse,
  },
  {
    method: "delete",
    path: "/api/dies/proofing-order/:proofingOrderId/die/:dieId",
    alias: "deleteApidiesproofingOrderProofingOrderIddieDieId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "dieId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/api/dies/related",
    alias: "getApidiesrelated",
    requestFormat: "json",
    parameters: [
      {
        name: "designId",
        type: "Query",
        schema: z.number().int().optional(),
      },
    ],
    response: z.array(DieResponse),
  },
  {
    method: "get",
    path: "/api/dies/related/proofing-order/:proofingOrderId",
    alias: "getApidiesrelatedproofingOrderProofingOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "relevance",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customer",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(DieResponse),
  },
  {
    method: "get",
    path: "/api/finance-accounts/search",
    alias: "getApifinanceAccountssearch",
    requestFormat: "json",
    parameters: [
      {
        name: "q",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(FinanceAccountFlatResponse),
  },
  {
    method: "get",
    path: "/api/finance-accounts/tree",
    alias: "getApifinanceAccountstree",
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
    ],
    response: z.array(FinanceAccountNodeResponse),
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
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "materialTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "length",
        type: "Query",
        schema: z.number().optional(),
      },
      {
        name: "width",
        type: "Query",
        schema: z.number().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: CurrentStockResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/history",
    alias: "getApiinventoryReportshistory",
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
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "transactionType",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: StockHistoryResponseIPaginate,
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: LowStockResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/material-history/:materialId/excel",
    alias: "getApiinventoryReportsmaterialHistoryMaterialIdexcel",
    requestFormat: "json",
    parameters: [
      {
        name: "materialId",
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
    response: z.void(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: StockCardResponse,
  },
  {
    method: "get",
    path: "/api/inventory-reports/stock-card/:itemCode/excel",
    alias: "getApiinventoryReportsstockCardItemCodeexcel",
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
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional().default("finished_product"),
      },
    ],
    response: InventorySummaryItemResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/inventory-reports/summary/excel",
    alias: "getApiinventoryReportssummaryexcel",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional().default("finished_product"),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/inventory-reports/vendor-reconciliation/:vendorId",
    alias: "getApiinventoryReportsvendorReconciliationVendorId",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
    response: VendorReconciliationResponse,
  },
  {
    method: "get",
    path: "/api/inventory-reports/vendor-reconciliation/:vendorId/excel",
    alias: "getApiinventoryReportsvendorReconciliationVendorIdexcel",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/inventory/adjust",
    alias: "postApiinventoryadjust",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AdjustInventoryRequest,
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
    path: "/api/inventory/balance",
    alias: "getApiinventorybalance",
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
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: InventoryBalanceResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/inventory/migrate",
    alias: "postApiinventorymigrate",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
      {
        status: 403,
        description: `Forbidden`,
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
    path: "/api/inventory/transactions",
    alias: "getApiinventorytransactions",
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
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "transactionType",
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
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: InventoryTransactionResponseIPaginate,
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
        name: "SalespersonId",
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
      {
        name: "SortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "SortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/api/material-cuts",
    alias: "postApimaterialCuts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMaterialCutRequest,
      },
    ],
    response: MaterialCutResponse,
  },
  {
    method: "get",
    path: "/api/material-cuts",
    alias: "getApimaterialCuts",
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
        name: "inputMaterialId",
        type: "Query",
        schema: z.number().int().optional(),
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/material-cuts/:id",
    alias: "getApimaterialCutsId",
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
    path: "/api/material-cuts/:id/cancel",
    alias: "postApimaterialCutsIdcancel",
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
    path: "/api/material-cuts/:id/complete",
    alias: "postApimaterialCutsIdcomplete",
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
    path: "/api/materials",
    alias: "getApimaterials",
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
        name: "name",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "quantityMin",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "vendorId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "type",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: MaterialResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/materials",
    alias: "postApimaterials",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMaterialRequest,
      },
    ],
    response: MaterialResponse,
  },
  {
    method: "get",
    path: "/api/materials/:id",
    alias: "getApimaterialsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MaterialResponse,
  },
  {
    method: "put",
    path: "/api/materials/:id",
    alias: "putApimaterialsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMaterialRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MaterialResponse,
  },
  {
    method: "delete",
    path: "/api/materials/:id",
    alias: "deleteApimaterialsId",
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
    path: "/api/materials/:id/history",
    alias: "getApimaterialsIdhistory",
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
      {
        name: "transactionType",
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
    response: InventoryTransactionResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/materials/sync-inventory-balances",
    alias: "postApimaterialssyncInventoryBalances",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/notifications",
    alias: "getApinotifications",
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
        name: "isRead",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/notifications/:id/read",
    alias: "putApinotificationsIdread",
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
    path: "/api/notifications/read-all",
    alias: "putApinotificationsreadAll",
    requestFormat: "json",
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/notifications/unread-count",
    alias: "getApinotificationsunreadCount",
    requestFormat: "json",
    response: z.void(),
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
        name: "search",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderListResponsePaginate,
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
    method: "post",
    path: "/api/orders/:id/cancel",
    alias: "postApiordersIdcancel",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(0).max(500) }),
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
    method: "put",
    path: "/api/orders/:id/sale",
    alias: "putApiordersIdsale",
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
      {
        name: "orderCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderListResponsePaginate,
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
      {
        name: "orderCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderResponseForDesignerPaginate,
  },
  {
    method: "get",
    path: "/api/orders/for-sale",
    alias: "getApiordersforSale",
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
        name: "orderCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderListResponsePaginate,
  },
  {
    method: "post",
    path: "/api/orders/from-ready-designs",
    alias: "postApiordersfromReadyDesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateOrderFromReadyDesignsRequest,
      },
    ],
    response: OrderResponse,
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
        name: "orderCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "customerName",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: OrderListResponsePaginate,
  },
  {
    method: "get",
    path: "/api/paper-sizes",
    alias: "getApipaperSizes",
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
        name: "isCustom",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PaperSizeResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/paper-sizes",
    alias: "postApipaperSizes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePaperSizeRequest,
      },
    ],
    response: PaperSizeResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
      {
        status: 409,
        description: `Conflict`,
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
    path: "/api/paper-sizes/:id",
    alias: "getApipaperSizesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PaperSizeResponse,
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
    method: "put",
    path: "/api/paper-sizes/:id",
    alias: "putApipaperSizesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePaperSizeRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PaperSizeResponse,
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
      {
        status: 409,
        description: `Conflict`,
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
    path: "/api/paper-sizes/:id",
    alias: "deleteApipaperSizesId",
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
        status: 400,
        description: `Bad Request`,
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    method: "put",
    path: "/api/plate-exports/:id",
    alias: "putApiplateExportsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePlateExportRequest,
      },
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
    path: "/api/production-orders",
    alias: "postApiproductionOrders",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateProductionOrderRequest,
      },
    ],
    response: ProductionOrderResponse,
  },
  {
    method: "get",
    path: "/api/production-orders",
    alias: "getApiproductionOrders",
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
        name: "proofingOrderId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProductionOrderResponsePaginate,
  },
  {
    method: "get",
    path: "/api/production-orders/:id",
    alias: "getApiproductionOrdersId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionOrderResponse,
  },
  {
    method: "delete",
    path: "/api/production-orders/:id",
    alias: "deleteApiproductionOrdersId",
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
    path: "/api/production-orders/:productionOrderId/items/:itemId",
    alias: "putApiproductionOrdersProductionOrderIditemsItemId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProductionOrderItemRequest,
      },
      {
        name: "productionOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "itemId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionOrderItemResponse,
  },
  {
    method: "get",
    path: "/api/production-orders/by-order/:orderId",
    alias: "getApiproductionOrdersbyOrderOrderId",
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
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProductionOrderResponsePaginate,
  },
  {
    method: "put",
    path: "/api/production-orders/steps/:stepId/assign",
    alias: "putApiproductionOrdersstepsStepIdassign",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ assignedToUserId: z.number().int().nullable() })
          .partial(),
      },
      {
        name: "stepId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionStepResponse,
  },
  {
    method: "put",
    path: "/api/production-orders/steps/:stepId/status",
    alias: "putApiproductionOrdersstepsStepIdstatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProductionStepRequest,
      },
      {
        name: "stepId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ProductionStepResponse,
  },
  {
    method: "post",
    path: "/api/proofing-orders",
    alias: "postApiproofingOrders",
    requestFormat: "json",
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
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProofingOrderListResponsePaginate,
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
    path: "/api/proofing-orders/:id/cancel",
    alias: "putApiproofingOrdersIdcancel",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(1) }),
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
    path: "/api/proofing-orders/:id/designs",
    alias: "postApiproofingOrdersIddesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddDesignsToProofingOrderRequest,
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
    method: "post",
    path: "/api/proofing-orders/:id/images",
    alias: "postApiproofingOrdersIdimages",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postApiproofingOrdersIdimages_Body,
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
    method: "put",
    path: "/api/proofing-orders/:id/update-image",
    alias: "putApiproofingOrdersIdupdateImage",
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
    method: "delete",
    path: "/api/proofing-orders/:proofingOrderId/images/:imageId",
    alias: "deleteApiproofingOrdersProofingOrderIdimagesImageId",
    requestFormat: "json",
    parameters: [
      {
        name: "proofingOrderId",
        type: "Path",
        schema: z.number().int(),
      },
      {
        name: "imageId",
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
        name: "designTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "designCode",
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
    response: OrderDetailAvailableResponsePaginate,
  },
  {
    method: "get",
    path: "/api/proofing-orders/available-order-details/design-type-summary",
    alias: "getApiproofingOrdersavailableOrderDetailsdesignTypeSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "materialTypeId",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "designCode",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.array(DesignTypeCountResponse),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProofingOrderListResponsePaginate,
  },
  {
    method: "post",
    path: "/api/proofing-orders/designs/reject",
    alias: "postApiproofingOrdersdesignsreject",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RejectDesignRequest,
      },
    ],
    response: z.void(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProofingOrderListResponsePaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/by-item",
    alias: "getApipurchaseReportsbyItem",
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
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PurchaseByItemRowIPaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/detail-ledger",
    alias: "getApipurchaseReportsdetailLedger",
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
      {
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PurchaseDetailLedgerRowIPaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/detail-ledger/:vendorId",
    alias: "getApipurchaseReportsdetailLedgerVendorId",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PurchaseDetailLedgerRowIPaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/detail-ledger/export",
    alias: "getApipurchaseReportsdetailLedgerexport",
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
        name: "itemCode",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/purchase-reports/journal",
    alias: "getApipurchaseReportsjournal",
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
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PurchaseJournalRowIPaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/journal/export",
    alias: "getApipurchaseReportsjournalexport",
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
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/purchase-reports/summary",
    alias: "getApipurchaseReportssummary",
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
      {
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: PurchaseSummaryRowIPaginate,
  },
  {
    method: "get",
    path: "/api/purchase-reports/summary/export",
    alias: "getApipurchaseReportssummaryexport",
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
        name: "searchTerm",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "saveHistory",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/purchase-reports/vendor-statistics",
    alias: "getApipurchaseReportsvendorStatistics",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: VendorReceiptStatisticsRowIPaginate,
  },
  {
    method: "get",
    path: "/api/ready-designs",
    alias: "getApireadyDesigns",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Query",
        schema: z.number().int().optional(),
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
    response: ReadyDesignResponsePaginate,
  },
  {
    method: "put",
    path: "/api/ready-designs/:id",
    alias: "putApireadyDesignsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateReadyDesignRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ReadyDesignResponse,
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    method: "post",
    path: "/api/return-notes",
    alias: "postApireturnNotes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateReturnNoteRequest,
      },
    ],
    response: ReturnNoteResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
    method: "get",
    path: "/api/return-notes/:id",
    alias: "getApireturnNotesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ReturnNoteResponse,
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
    path: "/api/return-notes/:id/process",
    alias: "postApireturnNotesIdprocess",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ReturnNoteResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
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
    method: "get",
    path: "/api/return-notes/by-delivery-note/:deliveryNoteId",
    alias: "getApireturnNotesbyDeliveryNoteDeliveryNoteId",
    requestFormat: "json",
    parameters: [
      {
        name: "deliveryNoteId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.array(ReturnNoteResponse),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    path: "/api/sales-reports/invoice-list/export",
    alias: "getApisalesReportsinvoiceListexport",
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
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/sales-reports/invoice-list/export-pdf",
    alias: "getApisalesReportsinvoiceListexportPdf",
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
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ReturnsDiscountsResponseIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-detail-ledger",
    alias: "getApisalesReportssalesDetailLedger",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: SalesDetailLedgerRowIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-detail-ledger/export",
    alias: "getApisalesReportssalesDetailLedgerexport",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-detail-ledger/export-pdf",
    alias: "getApisalesReportssalesDetailLedgerexportPdf",
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
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-summary",
    alias: "getApisalesReportssalesSummary",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: SalesSummaryRowIPaginate,
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-summary/export",
    alias: "getApisalesReportssalesSummaryexport",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.instanceof(File),
  },
  {
    method: "get",
    path: "/api/sales-reports/sales-summary/export-pdf",
    alias: "getApisalesReportssalesSummaryexportPdf",
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
    ],
    response: z.instanceof(File),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: TopProductResponseIPaginate,
  },
  {
    method: "post",
    path: "/api/shared-addresses",
    alias: "postApisharedAddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateSharedAddressRequest,
      },
    ],
    response: SharedAddressResponse,
  },
  {
    method: "get",
    path: "/api/shared-addresses",
    alias: "getApisharedAddresses",
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
        schema: z.boolean().optional().default(true),
      },
      {
        name: "search",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: SharedAddressResponsePaginate,
  },
  {
    method: "put",
    path: "/api/shared-addresses/:id",
    alias: "putApisharedAddressesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateSharedAddressRequest,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: SharedAddressResponse,
  },
  {
    method: "get",
    path: "/api/shared-addresses/:id",
    alias: "getApisharedAddressesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: SharedAddressResponse,
  },
  {
    method: "delete",
    path: "/api/shared-addresses/:id",
    alias: "deleteApisharedAddressesId",
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
        name: "source",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    method: "get",
    path: "/api/stock-ins/by-delivery-note/:deliveryNoteId",
    alias: "getApistockInsbyDeliveryNoteDeliveryNoteId",
    requestFormat: "json",
    parameters: [
      {
        name: "deliveryNoteId",
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-ins/by-production-order/:productionOrderId",
    alias: "getApistockInsbyProductionOrderProductionOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "productionOrderId",
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
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-ins/by-vendor/:vendorId",
    alias: "getApistockInsbyVendorVendorId",
    requestFormat: "json",
    parameters: [
      {
        name: "vendorId",
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
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-ins/from-cut",
    alias: "postApistockInsfromCut",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockInFromCutRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-ins/from-delivery-return",
    alias: "postApistockInsfromDeliveryReturn",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockInFromDeliveryReturnRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-ins/from-production",
    alias: "postApistockInsfromProduction",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockInFromProductionRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-ins/from-vendor",
    alias: "postApistockInsfromVendor",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockInFromVendorRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-ins/summary",
    alias: "getApistockInssummary",
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
        name: "purpose",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "itemType",
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
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
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
    method: "get",
    path: "/api/stock-outs/:id/excel",
    alias: "getApistockOutsIdexcel",
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
    path: "/api/stock-outs/:id/pdf",
    alias: "getApistockOutsIdpdf",
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
    method: "post",
    path: "/api/stock-outs/adjustment",
    alias: "postApistockOutsadjustment",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateAdjustmentStockOutRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs/by-delivery-note/:deliveryNoteId",
    alias: "getApistockOutsbyDeliveryNoteDeliveryNoteId",
    requestFormat: "json",
    parameters: [
      {
        name: "deliveryNoteId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs/by-production-order/:productionOrderId",
    alias: "getApistockOutsbyProductionOrderProductionOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "productionOrderId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/for-delivery",
    alias: "postApistockOutsforDelivery",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockOutForDeliveryRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/for-production",
    alias: "postApistockOutsforProduction",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockOutForProductionRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/for-special-reason",
    alias: "postApistockOutsforSpecialReason",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateStockOutForSpecialReasonRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/outsource",
    alias: "postApistockOutsoutsource",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateOutsourceStockOutRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/process-return",
    alias: "postApistockOutsprocessReturn",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ProcessDeliveryReturnRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/production-by-vendor",
    alias: "postApistockOutsproductionByVendor",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateProductionStockOutByVendorRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/stock-outs/return-vendor",
    alias: "postApistockOutsreturnVendor",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateReturnVendorStockOutRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs/returnable/by-delivery-note/:deliveryNoteId",
    alias: "getApistockOutsreturnablebyDeliveryNoteDeliveryNoteId",
    requestFormat: "json",
    parameters: [
      {
        name: "deliveryNoteId",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/stock-outs/summary",
    alias: "getApistockOutssummary",
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    method: "post",
    path: "/api/users/:id/department-reset-password",
    alias: "postApiusersIddepartmentResetPassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ newPassword: z.string().min(6).max(100) }),
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
    method: "post",
    path: "/api/users/:id/reset-password",
    alias: "postApiusersIdresetPassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ newPassword: z.string().min(6).max(100) }),
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/api/users/me",
    alias: "getApiusersme",
    requestFormat: "json",
    response: UserResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "put",
    path: "/api/users/me",
    alias: "putApiusersme",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateMyProfileRequest,
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
        status: 401,
        description: `Unauthorized`,
        schema: ErrorResponse,
      },
    ],
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
      {
        name: "sortColumn",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "sortOrder",
        type: "Query",
        schema: z.string().optional(),
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
    method: "post",
    path: "/api/vendors/:id/recalculate-debt",
    alias: "postApivendorsIdrecalculateDebt",
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
  {
    method: "post",
    path: "/api/vendors/recalculate-all-debts",
    alias: "postApivendorsrecalculateAllDebts",
    requestFormat: "json",
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
