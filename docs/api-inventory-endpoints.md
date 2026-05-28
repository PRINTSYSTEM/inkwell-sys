# API Endpoints - Inventory Cut/Import/Export

## 1. Phiếu cắt (Material Cut)

### `POST /api/material-cuts` — Tạo phiếu cắt

```json
{
  "inputMaterialId": 5,          // ID cuộn (bắt buộc, type phải = "cuon")
  "quantityUsed": 76,            // Số mét sử dụng
  "quantityWasted": 2,           // Số mét hao hụt
  "jobCode": "MB-2025-001",      // Mã bài (optional)
  "cutAt": "2025-06-01T08:00:00", // Ngày cắt (optional, default = now)
  "notes": "Ghi chú",
  "outputs": [
    {
      "outputMaterialId": null,   // null = auto-create tờ mới
      "cutLength": 32,            // Bắt buộc khi outputMaterialId = null
      "cutWidth": 63,             // Bắt buộc khi outputMaterialId = null
      "quantityProduced": 1200    // Số tờ cắt được
    }
  ]
}
```

**Lưu ý FE:**
- Khi `outputMaterialId = null`, hệ thống tự tìm/tạo material "32x63" thuộc cùng vendor với cuộn input
- Nếu `outputMaterialId = null` mà không có `cutLength`/`cutWidth` → lỗi 400
- Input material phải là type "cuon", nếu không → lỗi 400
- Response trả về phiếu cắt status = "pending"

### `POST /api/material-cuts/{id}/complete` — Hoàn thành phiếu cắt

Không cần body. Gọi để xác nhận cắt xong → hệ thống tự trừ tồn cuộn, cộng tồn tờ.

**Lỗi có thể gặp:**
- 400: Phiếu đã hoàn thành / đã hủy
- 400: Tồn kho cuộn không đủ (trả chi tiết: available vs required)

### `POST /api/material-cuts/{id}/cancel` — Hủy phiếu cắt

Nếu phiếu đã completed → hệ thống reverse lại tồn kho (cộng lại cuộn, trừ lại tờ).

---

## 2. Xuất kho đặc biệt

### `POST /api/stock-outs/for-special-reason` — Xuất trả NCC / xuất sang xưởng

```json
{
  "reason": "return_vendor",   // "return_vendor" hoặc "transfer"
  "materialId": 5,             // ID vật liệu xuất
  "quantity": 50,              // Số lượng
  "documentCode": null,        // Số chứng từ (null = auto-generate)
  "notes": "Cuộn bị lỗi in"
}
```

**Lưu ý FE:**
- Phiếu xuất được complete ngay lập tức (không qua pending)
- Validate tồn kho trước khi xuất → 400 nếu không đủ
- `reason` chỉ chấp nhận 2 giá trị: `return_vendor`, `transfer`

---

## 3. Nhập kho từ phiếu cắt (Optional)

### `POST /api/stock-ins/from-cut` — Tạo phiếu nhập từ phiếu cắt

```json
{
  "materialCutId": 1,    // ID phiếu cắt đã completed
  "notes": "Ghi chú"    // Optional
}
```

**Lưu ý FE:**
- Endpoint này chỉ tạo record nhập kho cho mục đích tracking/audit
- Tồn kho đã được cập nhật tự động khi complete phiếu cắt
- Phiếu cắt phải ở status "completed" → 400 nếu chưa complete

---

## 4. Export Excel - Lịch sử vật liệu

### `GET /api/inventory-reports/material-history/{materialId}/excel`

**Query params:**
- `fromDate` (optional, default = 1 tháng trước)
- `toDate` (optional, default = now)

**Response:** File .xlsx download

**Columns trong Excel:** Ngày, Loại GD, Số lượng, Tồn trước, Tồn sau, Mã chứng từ, Ghi chú

**FE:** Gọi bằng `window.open()` hoặc `<a href="..." download>` hoặc fetch + blob download.

---

## 5. Đối soát NCC (Vendor Reconciliation)

### `GET /api/inventory-reports/vendor-reconciliation/{vendorId}` — JSON

**Query params:**
- `fromDate` (optional)
- `toDate` (optional)

**Response:**
```json
{
  "vendorId": 3,
  "vendorName": "Thuận Tiền",
  "fromDate": "2025-06-01",
  "toDate": "2025-06-30",
  "items": [
    {
      "materialId": 5,
      "materialName": "PE khổ 32",
      "materialType": "cuon",
      "unit": "m",
      "openingBalance": 300,    // Tồn đầu kỳ
      "totalImport": 200,       // Nhập trong kỳ
      "totalExport": 140,       // Xuất trong kỳ
      "totalWaste": 10,         // Hao hụt
      "closingBalance": 350     // Tồn cuối kỳ = SDĐK + Nhập - Xuất - Hao hụt
    }
  ]
}
```

### `GET /api/inventory-reports/vendor-reconciliation/{vendorId}/excel` — File download

Cùng data nhưng trả về file .xlsx.

---

## 6. Export PDF - Phiếu xuất kho

### `GET /api/stock-outs/{id}/pdf`

**Response:** File PDF download (phiếu xuất kho format chuẩn: header, bảng items, chữ ký)

**Lỗi:** 404 nếu phiếu không tồn tại

---

## Tổng hợp TransactionType mới

| Type | Ý nghĩa | Khi nào tạo |
|------|----------|-------------|
| `cut_out` | Giảm cuộn khi cắt | Complete phiếu cắt |
| `cut_in` | Tăng tờ khi cắt | Complete phiếu cắt |
| `waste` | Hao hụt từ cắt | Complete phiếu cắt (nếu > 0) |
| `return_vendor` | Trả NCC | Xuất đặc biệt |
| `transfer` | Xuất sang xưởng | Xuất đặc biệt |
