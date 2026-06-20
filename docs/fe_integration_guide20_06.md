# Hướng dẫn tích hợp FE — Luồng Song song Bình bài & Đơn hàng (V4)

> **Mục đích**: Tài liệu này mô tả những thay đổi trên API và luồng giao diện mà Frontend cần cập nhật để hỗ trợ kiến trúc mới. Mọi thay đổi nghiệp vụ chính trên BE đã được ổn định.

---

## 1. Tổng quan luồng mới

### Trước (V3) — Luồng tuần tự
```
Sale lên đơn → Duyệt công nợ → Bình bài → Sản xuất → Giao hàng
```

### Sau (V4) — Luồng song song

```
Thiết kế được chốt in
        ↓
  [ReadyDesign Pool]  ← Kho thiết kế vật lý, KHÔNG gắn với đơn hàng
       ↙        ↘
Bình bài        Sale lên đơn
(bất kỳ lúc)   (bất kỳ lúc)
       ↘        ↙
    Sản xuất → Nhập kho
                ↓
    [Giao hàng — Delivery Gate]
       ↙          ↘
 Đơn A giao     Đơn B giao
```

**Điểm quan trọng cho FE:**
- Bình bài và lên đơn là 2 luồng **độc lập**, không cần đợi nhau.
- 1 thiết kế (`ReadyDesign`) có thể được chia cho **nhiều đơn hàng**.
- Khi giao hàng mới cần chỉ định rõ **giao bao nhiêu cho đơn nào**.

---

## 2. Màn hình: Chốt in thiết kế (ConfirmedForPrinting)

### Thay đổi
| Trước | Sau |
|---|---|
| Chốt in luôn cho phép | Chốt in **chặn nếu khách hàng đang nợ xấu** |

### FE cần làm
- Khi API trả về lỗi `403` / `400` với message `debt_exceeded` ở bước chốt in → **hiển thị cảnh báo**: _"Khách hàng đang vượt hạn mức công nợ. Không thể thêm thiết kế mới vào hàng chờ sản xuất."_
- Không cần thay đổi UI form chốt in, chỉ xử lý thêm error case này.

---

## 3. Màn hình: Hàng chờ bình bài (Proofing Queue)

### Thay đổi API
| Trước | Sau |
|---|---|
| Query từ `OrderDetail` (chỉ lấy hàng đã lên đơn) | Query từ View `view_proofing_queue` gộp cả 2 nguồn |

### Cấu trúc item mới trong danh sách hàng chờ

Mỗi item trong hàng chờ bình bài sẽ có thêm field:

```json
{
  "queueItemId": "RD_123",
  "readyDesignId": 123,
  "orderDetailId": null,
  "designCode": "TK-2024-001",
  "designName": "Hộp đựng...",
  "quantity": 10000,
  "availableForProofing": 8000,
  "itemStatus": "available"
}
```

- `queueItemId` prefix `RD_` → thiết kế **chưa lên đơn** (từ pool)
- `queueItemId` prefix `OD_` → thiết kế **đã lên đơn**
- `availableForProofing` = `quantity - lockedQty`

### FE cần làm
1. **Nhận biết loại item**: Đọc `queueItemId` prefix:
   - Prefix `RD_` → hiển thị badge "Chưa lên đơn" / màu xám.
   - Prefix `OD_` → hiển thị mã đơn hàng liên quan.
2. **Hiển thị số lượng khả dụng**: Dùng `availableForProofing` thay vì `quantity`.
3. **Payload khi thêm vào bình bài**:
   ```json
   // Item chưa lên đơn (RD_xxx):
   { "readyDesignId": 123, "orderDetailId": null, "quantityTaken": 5000 }

   // Item đã lên đơn (OD_xxx):
   { "readyDesignId": 123, "orderDetailId": 456, "quantityTaken": 5000 }
   ```

> ⚠️ Khi khách hàng bị nợ xấu, nhân viên vẫn **được phép** thêm vào bình bài. Không hiển thị cảnh báo nợ ở màn hình này.

---

## 4. Màn hình: Lên đơn hàng từ thiết kế chốt in (CreateOrderFromReadyDesigns)

### Thay đổi quan trọng — Số lượng KHÔNG cho nhập tay

| Trước | Sau |
|---|---|
| Sale tự nhập số lượng | API trả về `availableQuantityForOrdering` → FE truyền lại số đó, **trường readonly** |

### Response API thiết kế pool

```json
{
  "readyDesignId": 123,
  "requestedQuantity": 10000,
  "activeOrderedQty": 3000,
  "availableQuantityForOrdering": 7000
}
```

### FE cần làm
1. Hiển thị `availableQuantityForOrdering` (ví dụ: _"Có thể đặt: 7,000"_).
2. Khi bấm "Lên đơn", **tự động truyền** `quantity = availableQuantityForOrdering` — trường số lượng phải **readonly/disabled**.
3. Nếu `availableQuantityForOrdering == 0` → ẩn nút "Lên đơn" hoặc hiển thị trạng thái `FullyOrdered`.

### Trạng thái `ReadyDesign` mới (badge)

| Status (int) | Tên | Badge FE |
|---|---|---|
| `1` | `Available` | 🟢 Sẵn sàng |
| `2` | `PartiallyOrdered` | 🟡 Đặt một phần |
| `3` | `FullyOrdered` | 🔴 Đã đặt đủ |
| `4` | `Cancelled` | ⚫ Đã hủy |

> ⚠️ Đây là **Commercial Status** (trạng thái thương mại) — không phản ánh tiến độ sản xuất. Sản xuất chạy độc lập.

### Chặn lên đơn khi khách nợ xấu
- API trả về lỗi với message `debt_exceeded` → hiển thị: _"Khách hàng đang vượt hạn mức công nợ. Không thể tạo đơn hàng mới."_

---

## 5. Màn hình: Chi tiết đơn hàng / Danh sách dòng hàng

### Trạng thái `OrderDetail` mới

| Status | Ý nghĩa | Hiển thị |
|---|---|---|
| `WaitingForProofing` | Chờ bình bài | ⏳ Chờ bình bài |
| `WaitingForDelivery` | Sản xuất xong, chờ giao | 📦 Chờ giao hàng |
| `PartiallyDelivered` | Đã giao một phần | 🚚 Giao một phần |
| `Completed` | Đã giao đủ | ✅ Hoàn thành |

> **Lưu ý**: Bỏ trạng thái `PartiallyProduced` và `ProductionCompleted` ở cấp `OrderDetail`. Tiến độ sản xuất theo dõi ở cấp Pool (ReadyDesign), không tách biệt theo đơn.

### Response OrderDetail bổ sung

```json
{
  "orderDetailId": 456,
  "quantity": 7000,
  "deliveredQtyTotal": 3000,
  "remainingQty": 4000
}
```

FE hiển thị progress: `3,000 / 7,000 đã giao`.

---

## 6. Màn hình: Tạo phiếu giao hàng (Delivery Note) ← LỚN NHẤT

### Thay đổi — Phải phân bổ số lượng per OrderDetail

Vì 1 thiết kế phục vụ nhiều đơn, khi giao hàng phải chỉ định rõ giao bao nhiêu cho đơn nào.

### Luồng UI giao hàng mới

```
1. Chọn thiết kế cần giao (ReadyDesign)
2. Xem AvailableStock = StockQty (API trả về)
3. Xem danh sách OrderDetail đang chờ giao thuộc thiết kế đó
4. Nhập phân bổ: Đơn A ← X, Đơn B ← Y
5. Validate FE: X + Y <= AvailableStock và X + Y == tổng số xuất
6. Submit
```

### Payload request tạo phiếu giao hàng

```json
{
  "readyDesignId": 123,
  "stockOutItems": [
    {
      "quantity": 300,
      "allocations": [
        { "orderDetailId": 456, "quantity": 200 },
        { "orderDetailId": 789, "quantity": 100 }
      ]
    }
  ]
}
```

> ⚠️ **Validate FE bắt buộc**: `SUM(allocations[].quantity)` phải bằng `stockOutItem.quantity` trước khi cho phép submit.

### Tồn kho khả dụng — nguồn dữ liệu duy nhất

```
AvailableStock = summary.StockQty = StockIn - StockOut (vật lý)
```

API trả về `availableStock` trực tiếp. **Không tính lại** theo `ProducedQty - DeliveredQty` nữa.

---

## 7. Màn hình: Reject thiết kế từ bình bài

### Thay đổi hành vi Reject

| Trước | Sau |
|---|---|
| Reject → hủy POD + xóa khỏi đơn hàng mới nhất | Reject → **chỉ** hủy POD + ReadyDesign về Available |

### FE cần làm
- Sau Reject thành công → hiển thị thông báo:
  > _"Đã từ chối thiết kế. Thiết kế quay về hàng chờ sẵn sàng. Nếu muốn xóa khỏi đơn hàng, vui lòng thao tác tại trang chi tiết đơn."_
- Không kỳ vọng đơn hàng tự động cập nhật trạng thái sau Reject.

---

## 8. Màn hình: Theo dõi Pool thiết kế (ReadyDesign Pool View)

FE nên có màn hình/tab theo dõi Pool với các cột:

| Cột | Field API | Mô tả |
|---|---|---|
| Mã thiết kế | `designCode` | |
| Khách hàng | `customerName` | |
| SL chốt in | `requestedQuantity` | Tổng số lượng chốt |
| SL đã đặt | `activeOrderedQty` | Tổng đơn hàng đang liên kết |
| Còn có thể đặt | `availableQuantityForOrdering` | |
| SL bình bài | `summary.lockedQty` | Đang trong bình bài |
| SL đã SX | `summary.producedQty` | Đã hoàn thành sản xuất |
| Tồn kho | `summary.stockQty` | Có thể giao |
| Trạng thái | `status` (int) | Available / PartiallyOrdered / FullyOrdered |

---

## 9. Tóm tắt — Bảng việc cần làm

| # | Màn hình | Việc cần làm | Mức độ |
|---|---|---|---|
| 1 | Chốt in thiết kế | Xử lý error `debt_exceeded` | 🟢 Nhỏ |
| 2 | Hàng chờ bình bài | Nhận item mới (`RD_` / `OD_`), badge + `availableForProofing` | 🟡 Trung bình |
| 3 | Lên đơn từ pool | Field số lượng readonly, truyền `availableQuantityForOrdering` | 🟡 Trung bình |
| 4 | Lên đơn từ pool | Badge status mới (4 trạng thái), xử lý error `debt_exceeded` | 🟢 Nhỏ |
| 5 | Chi tiết đơn hàng | Status `OrderDetail` mới, hiển thị `deliveredQtyTotal` / `remainingQty` | 🟡 Trung bình |
| 6 | Tạo phiếu giao hàng | Phân bổ per OrderDetail, payload mới, validate SUM | 🔴 Lớn |
| 7 | Reject bình bài | Cập nhật thông báo, không kỳ vọng auto-update đơn | 🟢 Nhỏ |
| 8 | Pool View | Thêm màn hình theo dõi ReadyDesign pool | 🟡 Trung bình |

---

## 10. Thay đổi API Endpoint

| Endpoint | Thay đổi response/request |
|---|---|
| `GET /api/proofing/queue` | Thêm `queueItemId`, `readyDesignId`, `availableForProofing` |
| `POST /api/proofing/{id}/designs` | Payload thêm `readyDesignId` (nullable) |
| `GET /api/ready-designs` | Thêm `availableQuantityForOrdering`, `status` mới (int 1-4) |
| `POST /api/orders/from-ready-designs` | BE kiểm soát số lượng, FE truyền nguyên `availableQuantityForOrdering` |
| `GET /api/orders/{id}` | `OrderDetail` thêm `deliveredQtyTotal`, `remainingQty`; bỏ `PartiallyProduced` |
| `POST /api/delivery-notes` | Payload thêm `allocations[]` per StockOutItem |
| `POST /api/designs/{id}/reject` | Chỉ hủy POD, không gỡ OrderDetail |
| `PUT /api/designs/{id}` (ConfirmedForPrinting) | Có thể trả về error `debt_exceeded` |
| `POST /api/orders` | Có thể trả về error `debt_exceeded` |
