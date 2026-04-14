# Tài Liệu API Phần Thanh Toán (Payment Area)

Dưới đây là danh sách toàn bộ các API được gọi trong phần "Thanh toán" (`PaymentPage`) và khi "ấn vào từng thanh toán" (`AccountingOrderDetail`), dựa trên mã nguồn React / Hooks hiện tại.

## 1. Trang Danh Sách Thanh Toán (Payment Page & Payment List)
Đường dẫn: `/accounting/payment`
Các Component chính: `PaymentPage.tsx`, `PaymentList.tsx`

| Hành động / Theo dõi | Hook sử dụng | HTTP Method | Endpoint | Mô tả |
| --- | --- | --- | --- | --- |
| Load dữ liệu thống kê tổng quan (Thẻ số liệu trên cùng) | `useOrdersForAccounting` | `GET` | `/api/v1/orders/for-accounting` | Lấy danh sách toàn bộ đơn hàng (pageSize to) để tính tổng nợ, chờ thanh toán, quá hạn. |
| Load danh sách bảng thanh toán theo trang (Phân trang, tìm kiếm) | `useOrdersForAccounting` | `GET` | `/api/v1/orders/for-accounting` | Lấy dữ liệu cho bảng danh sách thanh toán với các tham số (page, size, query, filter). |

---

## 2. Trang Chi Tiết Thanh Toán (Từng Đơn Hàng Cụ Thể)
Đường dẫn: `/accounting/orders/:id?tab=payment`
Component chính: `AccountingOrderDetail.tsx`

Khi người dùng ấn vào 1 dòng trong danh sách thanh toán, trang chi tiết sẽ gọi các API sau để khởi tạo dữ liệu:

| Hành động lúc khởi tạo | Hook sử dụng | HTTP Method | Endpoint | Mô tả |
| --- | --- | --- | --- | --- |
| Lấy dữ liệu chi tiết đơn hàng | `useOrder` | `GET` | `/api/v1/orders/{id}` | Tải toàn bộ thông tin chi tiết của đơn hàng, thông tin khách hàng, số lượng, v.v. |
| Lấy dữ liệu hoá đơn (Invoices) | `useInvoicesByOrder`| `GET` | `/api/v1/invoices` | Lọc theo `orderId` để xem đơn này đã xuất hóa đơn hay chưa. |
| Lấy phiếu thu (Cash Receipts) | `useCashReceipts` | `GET` | `/api/v1/cash-receipts` | Lọc theo `customerId` của đơn hàng để kiểm tra các khoản thu tiền tệ. |
| Lấy phương thức thanh toán | `usePaymentMethods` | `GET` | `/api/v1/payment-methods` | Lấy danh sách các phương thức thanh toán (Tiền mặt, Chuyển khoản, v.v.) đang active để hiển thị cho phần cập nhật. |

### Các Hành Động / Tương Tác Cụ Thể Trong Chi Tiết:

| Hành động / Tương tác | Hook sử dụng | HTTP Method | Endpoint | Mô tả |
| --- | --- | --- | --- | --- |
| Cập nhật thông tin đơn hàng / chỉnh sửa trường dữ liệu (Note, Số lượng, Đơn giá...) | `useUpdateOrderForAccounting` | `PUT` | `/api/v1/orders/{id}/accounting` | Cập nhật thông tin chi tiết cho Accounting (như tiền cọc, phương thức thanh toán, số lượng sản phẩm, trạng thái...). |
| Xác nhận tiền cọc (Khách lẻ) | `useConfirmDeposit` | `POST` | `/api/v1/accounting/orders/{id}/confirm-deposit` | Cập nhật số tiền đã cọc vào kế toán cho đơn khách lẻ. (Chứa logic đi kèm với `ApproveDebt`). |
| Chuyển / Cộng Công Nợ (Khách công ty) | `useApproveDebt` | `POST` | `/api/v1/accounting/orders/{id}/approve-debt` | Chuyển khoản tiền chưa trả vào danh sách "công nợ" của khách hàng. |
| Tạo phiếu thu (Tự động khi cập nhật thanh toán) | `useCreateCashReceipt` | `POST` | `/api/v1/cash-receipts` | Nếu trong quá trình edit Payment Info có tiền cọc > 0 và chọn phương thức thanh toán -> Tự tạo Phiếu Thu. |
| Xuất Hóa Đơn Trống (Nếu chưa có) | `useCreateInvoice` | `POST` | `/api/v1/invoices` | Tạo một Invoice mới tạm thời trong Database nếu đơn này chưa có Invoice. |
| Xuất File Excel Báo Giá | `useGenerateOrderExcel` | `POST` | `/api/v1/orders/{id}/generate-excel` | Trả về stream file Excel. |
| Xuất File Hóa Đơn ra Excel | `useExportOrderInvoice` | `POST` | `/api/v1/orders/{id}/export-invoice` | Trả về stream file Excel hóa đơn. |
| Xuất Phiếu Giao Hàng | `useExportOrderDeliveryNote` | `POST` | `/api/v1/orders/{id}/export-delivery-note` | Trả về stream file Excel phiếu giao. |
| Xuất PDF Đơn Hàng | `useExportOrderPDF` | `GET` | `/api/v1/orders/{id}/export-pdf` | Lấy file PDF trực tiếp. | 

*(Ghi chú: Theo logic code, khi **Khách Lẻ Xác nhận Cọc** hệ thống sẽ gọi 2 API liên tiếp (bằng custom function handleConfirmDeposit): `PUT .../accounting` để update số tiền cọc & phương thức thanh toán, sau đó tự động gọi `POST .../approve-debt` trong cùng 1 handler).*
