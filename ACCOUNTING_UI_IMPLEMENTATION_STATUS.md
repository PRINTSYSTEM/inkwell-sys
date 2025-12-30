# Accounting UI Implementation Status

## Đã hoàn thành

### 1. Cash Receipt List Page ✅
- ✅ Đầy đủ cột: Số phiếu, Ngày chứng từ, Ngày hạch toán, Người nộp, Lý do thu, Số tiền, Phương thức, Tham chiếu, Trạng thái
- ✅ Filter: Từ ngày–Đến ngày, Trạng thái, Phương thức
- ✅ Chức năng: tạo/sửa/xóa (nháp), duyệt, ghi sổ, hủy
- ✅ Drill-down: click số phiếu → mở chi tiết (route đã có, cần tạo detail page)
- ⏳ Export Excel: button đã có, cần implement

### 2. Cash Payment List Page ✅
- ✅ Đầy đủ cột: Số phiếu, Ngày chứng từ, Ngày hạch toán, Người nhận, Khoản mục chi, Số tiền, Phương thức, Tham chiếu, Trạng thái
- ✅ Filter: Từ ngày–Đến ngày, Trạng thái, Phương thức, Khoản mục chi
- ✅ Chức năng: tạo/sửa/xóa (nháp), duyệt, ghi sổ, hủy
- ✅ Drill-down: click số phiếu → mở chi tiết (route đã có, cần tạo detail page)
- ⏳ Export Excel: button đã có, cần implement

## Đang làm / Cần làm

### 3. Cash Receipt Detail/Create/Edit Pages ⏳
- [ ] CashReceiptDetailPage.tsx
- [ ] CashReceiptCreatePage.tsx
- [ ] CashReceiptEditPage.tsx

### 4. Cash Payment Detail/Create/Edit Pages ⏳
- [ ] CashPaymentDetailPage.tsx
- [ ] CashPaymentCreatePage.tsx
- [ ] CashPaymentEditPage.tsx

### 5. Cash Book Page (Sổ quỹ) ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Thêm đầy đủ cột: Ngày, Số chứng từ, Diễn giải, Đối tượng, Thu, Chi, Tồn quỹ, Tham chiếu
- [ ] Drill-down: click chứng từ → mở phiếu thu/chi
- [ ] Export Excel với dòng Số dư đầu kỳ

### 6. Bank Ledger Page (Sổ ngân hàng) ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Thêm đầy đủ cột tương tự sổ quỹ
- [ ] Drill-down: click chứng từ → mở giao dịch
- [ ] Export Excel

### 7. Stock In List Page ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Thêm đầy đủ cột: Số phiếu, Ngày, Nhà cung cấp/nguồn nhập, Kho, Tổng SL, Tổng giá trị, Trạng thái
- [ ] Filter: Từ ngày–Đến ngày, Kho, Nguồn nhập/NCC, Trạng thái
- [ ] Export Excel

### 8. Stock In Detail/Create/Edit Pages ⏳
- [ ] StockInDetailPage.tsx với chi tiết dòng hàng
- [ ] StockInCreatePage.tsx (đã có nhưng cần cải thiện)
- [ ] StockInEditPage.tsx

### 9. Stock Out List Page ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Thêm đầy đủ cột: Số phiếu, Ngày, Lý do xuất, Kho, Tổng SL, Tổng giá trị, Tham chiếu, Trạng thái
- [ ] Filter: Từ ngày–Đến ngày, Kho, Lý do xuất, Trạng thái
- [ ] Export Excel

### 10. Stock Out Detail/Create/Edit Pages ⏳
- [ ] StockOutDetailPage.tsx với chi tiết dòng hàng
- [ ] StockOutCreatePage.tsx (đã có nhưng cần cải thiện)
- [ ] StockOutEditPage.tsx

### 11. Inventory Summary Page ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Drill-down: click mã hàng → thẻ kho
- [ ] Export Excel

### 12. Stock Card Page ⏳
- ✅ Hiển thị cơ bản đã có
- [ ] Drill-down: click số phiếu → mở phiếu nhập/xuất
- [ ] Export Excel

### 13. Sales Report Pages ⏳
- [ ] SalesByPeriodPage.tsx (đã có, cần cải thiện với drill-down)
- [ ] SalesByCustomerPage.tsx (đã có, cần cải thiện với drill-down)
- [ ] SalesByDimensionPage.tsx (đã có, cần cải thiện với drill-down)
- [ ] TopProductsPage.tsx (đã có, cần cải thiện với drill-down)
- [ ] ReturnsDiscountsPage.tsx (đã có, cần cải thiện với drill-down)

### 14. AR/AP Report Pages ⏳
- ✅ ARSummaryPage.tsx (đã có)
- ✅ ARDetailPage.tsx (đã có)
- ✅ ARAgingPage.tsx (đã có)
- ✅ APSummaryPage.tsx (đã có)
- ✅ APDetailPage.tsx (đã có)
- ✅ APAgingPage.tsx (đã có)
- [ ] Thêm drill-down cho tất cả các trang
- [ ] Export Excel

### 15. Expense Report Pages ⏳
- [ ] ExpenseByPeriodPage.tsx
- [ ] ExpenseByCategoryPage.tsx
- [ ] ExpenseByDepartmentPage.tsx
- [ ] ExpenseByVendorPage.tsx

### 16. Report Export Management Page ⏳
- [ ] ReportExportListPage.tsx (đã có nhưng cần cải thiện)
- [ ] Xem lại filter với đúng filter đã lưu
- [ ] Tải về file
- [ ] Xóa (theo quyền)

## Notes

- Tất cả các trang list đã có pagination
- Các hook đã hỗ trợ đầy đủ filter params
- Cần tạo các trang detail/create/edit cho các entity
- Cần implement export Excel cho tất cả các trang
- Cần thêm drill-down cho các trang báo cáo

