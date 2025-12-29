# Mock Data Setup Guide

## Tổng quan

Đã tạo mock data cho tất cả các schema mới và tích hợp vào hooks để sử dụng khi API chưa sẵn sàng.

## Cấu trúc Mock Data

### 1. Mock Files (`src/mocks/`)

- `cash.mock.ts` - Mock data cho Cash Management
  - Cash Funds, Cash Payments, Cash Receipts, Cash Book
  
- `bank.mock.ts` - Mock data cho Bank Management
  - Bank Accounts, Bank Ledger
  
- `expense.mock.ts` - Mock data cho Expense & Payment Method
  - Expense Categories, Payment Methods
  
- `ar-ap.mock.ts` - Mock data cho AR/AP Reports
  - AR Summary, AR Detail, AR Aging
  - AP Summary, AP Detail, AP Aging
  - Collection Schedule
  
- `inventory.mock.ts` - Mock data cho Inventory Reports
  - Current Stock, Inventory Summary
  - Low Stock, Slow Moving
  - Stock Card
  
- `sales.mock.ts` - Mock data cho Sales Reports
  - Sales by Period, Customer, Dimension
  - Top Products, Returns Discounts
  - Order Drill Down

### 2. Mock Utils (`src/lib/mock-utils.ts`)

Utility functions để enable/disable mock mode:

```typescript
// Enable mock mode globally via environment variable
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true" || false;

// Wrapper function với mock fallback
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  options?: { useMock?: boolean; delay?: number }
): Promise<T>

// React Query helper
export function createMockQueryFn<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  options?: { useMock?: boolean; delay?: number }
)
```

## Cách sử dụng

### Option 1: Environment Variable (Recommended)

Thêm vào `.env` hoặc `.env.local`:

```env
VITE_USE_MOCK_DATA=true
```

### Option 2: Manual trong code

Các hooks đã được cập nhật để tự động fallback về mock data khi:
1. `USE_MOCK_DATA` = true
2. API call fails

Ví dụ trong `use-cash.ts`:

```typescript
export const useCashFunds = (params?: CashFundsParams) => {
  return useQuery({
    queryKey: ["cash-funds", params],
    queryFn: createMockQueryFn(
      async () => {
        // Real API call
        const res = await apiRequest.get<CashFundResponseIPaginate>(
          API_SUFFIX.CASH_FUNDS,
          { params: normalizedParams }
        );
        return res.data;
      },
      mockCashFundsPaginate // Mock data fallback
    ),
  });
};
```

## Hooks đã được cập nhật

✅ `use-cash.ts` - Tất cả queries đã có mock fallback
- useCashFunds, useCashFund
- useCashPayments, useCashPayment
- useCashReceipts, useCashReceipt
- useCashBook

## Hooks cần cập nhật tiếp

Các hooks sau cần được cập nhật tương tự:

- [ ] `use-bank.ts`
- [ ] `use-expense.ts`
- [ ] `use-ar-ap.ts`
- [ ] `use-inventory-report.ts`
- [ ] `use-sales-report.ts`

## ProofingOrder Schemas

Đã kiểm tra và xác nhận:
- ✅ `CreateProofingOrderRequest` - Không có thay đổi breaking
- ✅ `ProofingOrderResponse` - Không có thay đổi breaking
- ✅ `UpdateProofingOrderRequest` - Không có thay đổi breaking

Các file sử dụng đều đúng:
- ✅ `CreateProofingOrderModal.tsx` - Sử dụng `CreateProofingOrderFromDesignsRequest` (không phải `CreateProofingOrderRequest`)
- ✅ `use-proofing-order.ts` - Sử dụng đúng types
- ✅ `PrepressDetail.tsx` - Sử dụng đúng types

## Next Steps

1. Cập nhật các hooks còn lại với mock data
2. Test UI với mock data
3. Khi API sẵn sàng, set `VITE_USE_MOCK_DATA=false` hoặc xóa env variable

