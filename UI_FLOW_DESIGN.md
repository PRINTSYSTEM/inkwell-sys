# UI Flow Design - Dựa trên Schema mới

## Tổng quan

Dựa trên các schema mới được cập nhật, hệ thống cần các flow UI sau:

## 1. Cash Management (Quản lý tiền mặt)

### 1.1 Cash Fund (Quỹ tiền mặt)
- **Route**: `/accounting/cash-funds`
- **Pages**:
  - `CashFundListPage.tsx` - Danh sách quỹ tiền mặt
  - `CashFundDetailPage.tsx` - Chi tiết quỹ tiền mặt (nếu cần)
- **Features**:
  - Danh sách quỹ với filter (isActive, search)
  - Tạo mới quỹ
  - Cập nhật quỹ
  - Xóa quỹ
  - Hiển thị số dư đầu kỳ

### 1.2 Cash Payment (Phiếu chi)
- **Route**: `/accounting/cash-payments`
- **Pages**:
  - `CashPaymentListPage.tsx` - Danh sách phiếu chi
  - `CashPaymentDetailPage.tsx` - Chi tiết phiếu chi
  - `CashPaymentCreatePage.tsx` - Tạo phiếu chi mới
- **Features**:
  - Danh sách với filter (status, date range, vendor, paymentMethod, expenseCategory)
  - Tạo phiếu chi
  - Cập nhật phiếu chi (chỉ khi chưa approve/post)
  - Duyệt phiếu chi (approve)
  - Hạch toán phiếu chi (post)
  - Hủy phiếu chi (cancel)
  - Xóa phiếu chi (chỉ khi chưa approve/post)

### 1.3 Cash Receipt (Phiếu thu)
- **Route**: `/accounting/cash-receipts`
- **Pages**:
  - `CashReceiptListPage.tsx` - Danh sách phiếu thu
  - `CashReceiptDetailPage.tsx` - Chi tiết phiếu thu
  - `CashReceiptCreatePage.tsx` - Tạo phiếu thu mới
- **Features**:
  - Tương tự Cash Payment nhưng cho phiếu thu
  - Liên kết với customer, invoice, order

### 1.4 Cash Book (Sổ quỹ)
- **Route**: `/accounting/cash-book`
- **Pages**:
  - `CashBookPage.tsx` - Sổ quỹ
- **Features**:
  - Hiển thị sổ quỹ theo cashFund và date range
  - Danh sách các giao dịch (phiếu thu/chi)
  - Số dư đầu kỳ, tổng thu, tổng chi, số dư cuối kỳ

## 2. Bank Management (Quản lý ngân hàng)

### 2.1 Bank Account (Tài khoản ngân hàng)
- **Route**: `/accounting/bank-accounts`
- **Pages**:
  - `BankAccountListPage.tsx` - Danh sách tài khoản ngân hàng
  - `BankAccountDetailPage.tsx` - Chi tiết tài khoản (nếu cần)
- **Features**:
  - Danh sách tài khoản với filter (isActive, search)
  - Tạo mới tài khoản
  - Cập nhật tài khoản
  - Xóa tài khoản
  - Hiển thị số dư đầu kỳ

### 2.2 Bank Ledger (Sổ ngân hàng)
- **Route**: `/accounting/bank-ledger`
- **Pages**:
  - `BankLedgerPage.tsx` - Sổ ngân hàng
- **Features**:
  - Hiển thị sổ ngân hàng theo bankAccount và date range
  - Danh sách các giao dịch
  - Số dư đầu kỳ, tổng nợ, tổng có, số dư cuối kỳ

## 3. AR/AP Management (Quản lý công nợ)

### 3.1 AR (Accounts Receivable - Công nợ phải thu)
- **Route**: `/accounting/ar`
- **Pages**:
  - `ARSummaryPage.tsx` - Tổng hợp công nợ phải thu
  - `ARDetailPage.tsx` - Chi tiết công nợ phải thu
  - `ARAgingPage.tsx` - Phân tích tuổi nợ phải thu
- **Features**:
  - AR Summary: Tổng hợp theo khách hàng
  - AR Detail: Chi tiết từng giao dịch
  - AR Aging: Phân tích tuổi nợ (0-30, 31-60, 61-90, >90 ngày)
  - Export Excel/PDF

### 3.2 AP (Accounts Payable - Công nợ phải trả)
- **Route**: `/accounting/ap`
- **Pages**:
  - `APSummaryPage.tsx` - Tổng hợp công nợ phải trả
  - `APDetailPage.tsx` - Chi tiết công nợ phải trả
  - `APAgingPage.tsx` - Phân tích tuổi nợ phải trả
- **Features**:
  - Tương tự AR nhưng cho nhà cung cấp

### 3.3 Collection Schedule (Lịch thu tiền)
- **Route**: `/accounting/collection-schedule`
- **Pages**:
  - `CollectionSchedulePage.tsx` - Lịch thu tiền
- **Features**:
  - Danh sách các khoản cần thu theo ngày
  - Filter theo customer, date range

## 4. Expense & Payment Method Management

### 4.1 Expense Category (Danh mục chi phí)
- **Route**: `/accounting/expense-categories`
- **Pages**:
  - `ExpenseCategoryListPage.tsx` - Danh sách danh mục chi phí
- **Features**:
  - Danh sách với filter (type: income/expense, isActive, search)
  - Tạo mới
  - Cập nhật
  - Xóa

### 4.2 Payment Method (Phương thức thanh toán)
- **Route**: `/accounting/payment-methods`
- **Pages**:
  - `PaymentMethodListPage.tsx` - Danh sách phương thức thanh toán
- **Features**:
  - Danh sách với filter (isActive, search)
  - Tạo mới
  - Cập nhật
  - Xóa

## 5. Inventory Reports (Báo cáo tồn kho)

### 5.1 Current Stock (Tồn kho hiện tại)
- **Route**: `/reports/inventory/current-stock`
- **Pages**:
  - `CurrentStockPage.tsx` - Tồn kho hiện tại
- **Features**:
  - Danh sách tồn kho theo materialType, designType
  - Filter và search
  - Export Excel

### 5.2 Inventory Summary (Tổng hợp tồn kho)
- **Route**: `/reports/inventory/summary`
- **Pages**:
  - `InventorySummaryPage.tsx` - Tổng hợp tồn kho
- **Features**:
  - Tổng hợp tồn kho theo ngày
  - Filter theo materialType, designType, asOfDate

### 5.3 Low Stock (Hàng tồn kho thấp)
- **Route**: `/reports/inventory/low-stock`
- **Pages**:
  - `LowStockPage.tsx` - Hàng tồn kho thấp
- **Features**:
  - Danh sách hàng có số lượng dưới ngưỡng
  - Filter theo threshold, materialType, designType

### 5.4 Slow Moving (Hàng chậm luân chuyển)
- **Route**: `/reports/inventory/slow-moving`
- **Pages**:
  - `SlowMovingPage.tsx` - Hàng chậm luân chuyển
- **Features**:
  - Danh sách hàng không có giao dịch trong X ngày
  - Filter theo daysThreshold

### 5.5 Stock Card (Thẻ kho)
- **Route**: `/reports/inventory/stock-card/:itemCode`
- **Pages**:
  - `StockCardPage.tsx` - Thẻ kho
- **Features**:
  - Hiển thị thẻ kho cho một item
  - Lịch sử nhập/xuất
  - Số dư đầu kỳ, tổng nhập, tổng xuất, số dư cuối kỳ

## 6. Sales Reports (Báo cáo bán hàng)

### 6.1 Sales by Period (Doanh số theo kỳ)
- **Route**: `/reports/sales/by-period`
- **Pages**:
  - `SalesByPeriodPage.tsx` - Doanh số theo kỳ
- **Features**:
  - Doanh số theo ngày/tuần/tháng/quý/năm
  - Filter theo periodType, date range
  - Export Excel

### 6.2 Sales by Customer (Doanh số theo khách hàng)
- **Route**: `/reports/sales/by-customer`
- **Pages**:
  - `SalesByCustomerPage.tsx` - Doanh số theo khách hàng
- **Features**:
  - Tổng hợp doanh số theo khách hàng
  - Filter theo customer, date range

### 6.3 Sales by Dimension (Doanh số theo chiều)
- **Route**: `/reports/sales/by-dimension`
- **Pages**:
  - `SalesByDimensionPage.tsx` - Doanh số theo chiều
- **Features**:
  - Tổng hợp doanh số theo designType, materialType, etc.
  - Filter theo dimensionType, date range

### 6.4 Top Products (Sản phẩm bán chạy)
- **Route**: `/reports/sales/top-products`
- **Pages**:
  - `TopProductsPage.tsx` - Sản phẩm bán chạy
- **Features**:
  - Top sản phẩm theo số lượng hoặc doanh thu
  - Filter theo sortBy, date range

### 6.5 Returns Discounts (Trả hàng & giảm giá)
- **Route**: `/reports/sales/returns-discounts`
- **Pages**:
  - `ReturnsDiscountsPage.tsx` - Trả hàng & giảm giá
- **Features**:
  - Danh sách các giao dịch trả hàng và giảm giá
  - Filter theo date range

### 6.6 Order Drill Down (Chi tiết đơn hàng)
- **Route**: `/reports/sales/order-drill-down`
- **Pages**:
  - `OrderDrillDownPage.tsx` - Chi tiết đơn hàng
- **Features**:
  - Chi tiết đơn hàng theo customer hoặc period
  - Filter theo customer, date range

## 7. Report Export (Xuất báo cáo)

### 7.1 Report Export List
- **Route**: `/reports/exports`
- **Pages**:
  - `ReportExportListPage.tsx` - Danh sách báo cáo đã xuất
- **Features**:
  - Danh sách các báo cáo đã xuất
  - Download báo cáo
  - Xóa báo cáo

## Navigation Structure

```
Kế toán
├── Thanh toán
├── Hóa đơn
├── Danh sách hóa đơn
├── Giao hàng
├── Danh sách phiếu giao hàng
├── Báo cáo công nợ
├── Quản lý tiền mặt
│   ├── Quỹ tiền mặt
│   ├── Phiếu chi
│   ├── Phiếu thu
│   └── Sổ quỹ
├── Quản lý ngân hàng
│   ├── Tài khoản ngân hàng
│   └── Sổ ngân hàng
├── Công nợ phải thu (AR)
│   ├── Tổng hợp
│   ├── Chi tiết
│   └── Phân tích tuổi nợ
├── Công nợ phải trả (AP)
│   ├── Tổng hợp
│   ├── Chi tiết
│   └── Phân tích tuổi nợ
├── Lịch thu tiền
├── Danh mục chi phí
└── Phương thức thanh toán

Báo cáo
├── Tồn kho
│   ├── Tồn kho hiện tại
│   ├── Tổng hợp tồn kho
│   ├── Hàng tồn kho thấp
│   ├── Hàng chậm luân chuyển
│   └── Thẻ kho
├── Bán hàng
│   ├── Doanh số theo kỳ
│   ├── Doanh số theo khách hàng
│   ├── Doanh số theo chiều
│   ├── Sản phẩm bán chạy
│   ├── Trả hàng & giảm giá
│   └── Chi tiết đơn hàng
└── Báo cáo đã xuất
```

## Implementation Priority

1. **High Priority** (Core functionality):
   - Cash Payment/Receipt (quan trọng nhất)
   - Cash Book
   - AR Summary/Detail/Aging
   - AP Summary/Detail/Aging

2. **Medium Priority**:
   - Cash Fund, Bank Account
   - Bank Ledger
   - Expense Category, Payment Method
   - Current Stock, Low Stock

3. **Low Priority** (Nice to have):
   - Sales Reports
   - Inventory Summary, Slow Moving, Stock Card
   - Collection Schedule

