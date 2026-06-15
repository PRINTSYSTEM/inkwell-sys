# Luồng mới: Thiết kế độc lập (Standalone Design) + Kho thiết kế (ReadyDesign Pool)

## 1. Tổng quan
Trước đây: Mỗi thiết kế phải gắn vào đơn hàng (`Order`) ngay từ đầu.  
**Luồng mới:** Thiết kế được tạo **độc lập**, chỉ khi nào **chốt in** (`confirmed_for_printing`) mới đẩy vào **kho thiết kế** (`ReadyDesign`). Đơn hàng sau đó có thể lên từ kho thiết kế — 1 thiết kế có thể tái bản (reprint) nhiều lần và lên nhiều đơn hàng khác nhau.

---

## 2. Các API mới & thay đổi

### 2.1. Tạo thiết kế độc lập (không cần đơn hàng)
```http
POST /api/designs
```
* **Role:** Admin, Manager, Design, DesignLead
* **Request:** `CreateDesignStandaloneRequest` (JSON)
  ```json
  {
    "customerId": 1,
    "designTypeId": 1,
    "materialTypeId": 1,
    "quantity": 200,
    "designName": "Hộp giấy A4",
    "length": 20,
    "width": 15,
    "height": 10,
    "adhesiveOffset": 2,
    "sidesClassification": "one_side",  // "one_side" | "two_side"
    "processClassification": "die_cut", // "cut" | "die_cut"
    "laminationType": "mang_bong",
    "notes": "Ghi chú"
  }
  ```
* **Response:** `DesignResponse` (giống cũ)
  * `code`: Bắt đầu bằng `NHAP` (nháp, chưa có mã hệ thống)
  * `status`: `received_info`

**Lưu ý cho FE:**
* Khi tạo xong, design nằm ở trạng thái `received_info`, chưa có trong kho thiết kế.
* Designer tiếp tục làm việc qua các API cũ (`PUT /api/designs/{id}`) để cập nhật file, tên, kích thước.

---

### 2.2. Chốt in → Tạo mã hệ thống + Đẩy vào kho
```http
PUT /api/designs/{id}
```
* **Request:** `UpdateDesignRequest` (JSON)
  ```json
  {
    "designStatus": "confirmed_for_printing"
  }
  ```

**Quy tắc BE:**
* Nếu design đang có mã nháp (`NHAP...`) → BE tự động cấp **mã hệ thống**: `{CustomerCode}-{DesignTypeCode}{seq:000}`
  * Ví dụ: Khách `CTA`, loại `H` → `CTA-H001`, `CTA-H002`...
* Tạo 1 dòng `ReadyDesign` với `status = "available"` (đưa vào kho).
* Nếu design **đã có mã hệ thống** (tái bản) → giữ nguyên mã cũ, chỉ tạo thêm dòng `ReadyDesign`.

**Lưu ý cho FE:**
* Nút "Chốt in" trên màn hình thiết kế sẽ trigger API này.
* Sau khi chốt in, design có thể xuất hiện trong danh sách **Kho thiết kế**.

---

### 2.3. Tái bản (Reprint) — Thêm số lượng vào kho
```http
POST /api/designs/{id}/reprint
```
* **Role:** Admin, Manager, Design, DesignLead
* **Request:** `ReprintDesignRequest` (JSON)
  ```json
  {
    "quantity": 500
  }
  ```
* **Điều kiện:** Design phải có `status = "confirmed_for_printing"`.

**Quy tắc BE:**
* Tạo thêm 1 dòng `ReadyDesign` mới với `status = "available"` và số lượng `quantity`.
* Giữ nguyên mã hệ thống của design.

**Lưu ý cho FE:**
* Dùng khi khách đã in 1 lần, muốn in thêm (cùng design, không cần thiết kế lại).
* Mỗi lần tái bản tạo 1 dòng mới trong kho → có thể lên đơn riêng biệt.

---

### 2.4. Kéo về chờ duyệt → Xóa khỏi kho
```http
PUT /api/designs/{id}
```
* **Request:** (JSON)
  ```json
  {
    "designStatus": "waiting_for_customer_approval"
  }
  ```

**Quy tắc BE:**
* Nếu design có các dòng `ReadyDesign` đang `available` (chưa lên đơn) → **xóa** khỏi kho.
* Nếu đã lên đơn (`ordered`) thì không xóa.

**Lưu ý cho FE:**
* Dùng khi khách chưa chốt in, muốn sửa lại design → design bị rút khỏi kho, không thể lên đơn nữa.

---

### 2.5. Xem kho thiết kế (ReadyDesign Pool)
```http
GET /api/ready-designs?customerId={}&search={}&pageNumber={}&pageSize={}
```
* **Role:** Admin, Manager, Accounting, AccountingLead, Sale
* **Response:** `Paginate<ReadyDesignResponse>` (JSON)
  ```json
  {
    "items": [
      {
        "id": 50,
        "designId": 100,
        "designCode": "CTA-H001",
        "designName": "Hộp giấy A4",
        "customerId": 1,
        "customerName": "Công ty A",
        "quantity": 200,
        "dimensions": "20x15x10",
        "materialTypeName": "Giấy C300",
        "status": "available",
        "orderCode": null,
        "createdAt": "2026-06-15T10:00:00",
        "updatedAt": "2026-06-15T10:00:00"
      }
    ]
  }
  ```

**Filter:**
* `customerId`: Lọc theo khách hàng (Sale có thể chọn khách rồi xem kho của khách đó).
* `search`: Tìm theo `designCode`, `designName`, `customerName`.

**Lưu ý cho FE:**
* Chỉ hiện `status = "available"` (đã ẩn `ordered` trong BE).
* Đây là màn hình **"Kho thiết kế"** để Sale chọn lên đơn.

---

### 2.6. Lên đơn hàng từ kho thiết kế
```http
POST /api/orders/from-ready-designs
```
* **Role:** Admin, Manager, Accounting, AccountingLead, Sale
* **Request:** `CreateOrderFromReadyDesignsRequest` (JSON)
  ```json
  {
    "readyDesignIds": [50, 51],
    "customerAddressId": 10,
    "assignedToUserId": 3,
    "deliveryDate": "2026-06-20",
    "note": "Giao gấp"
  }
  ```

**Quy tắc BE:**
* Tất cả `readyDesignIds` phải thuộc **cùng 1 khách hàng**.
* `customerAddressId` phải thuộc về khách hàng đó và `isActive = true`.
* Tạo đơn hàng mới + `OrderDetail` tự động từ các `ReadyDesign`.
* Cập nhật `ReadyDesign.status = "ordered"`, ghi `orderId` và `orderCode`.
* Tính `TotalAmount` từ `UnitPrice × Quantity` của từng dòng.
* **Response:** `OrderResponse` (giống `POST /api/orders` cũ)

**Lưu ý cho FE:**
* Màn hình **"Lên đơn từ kho"**: Sale chọn 1 hoặc nhiều dòng `ReadyDesign` (checkbox) → chọn địa chỉ giao hàng → submit.
* Nếu chọn nhiều khách hàng → BE trả lỗi `ValidationError`: *"Các thiết kế được chọn phải thuộc cùng một khách hàng."*

---

### 2.7. Bình bài reject → Gỡ design khỏi đơn
```http
POST /api/proofing-orders/designs/reject
```
* **Request:** `RejectDesignRequest` (JSON)
  ```json
  {
    "orderDetailId": 123,
    "reason": "Lý do từ chối"
  }
  ```

**Quy tắc BE mới:**
1. Design chuyển về `status = "returned"`.
2. **Gỡ design khỏi đơn hàng** (xóa `OrderDetail` hoặc tách rời).
3. Nếu đơn hàng không còn design nào → **tự động hủy đơn** (`status = "cancelled"`).
4. Xóa `orderCode` khỏi `ReadyDesign` (để có thể lên đơn khác sau này).

**Lưu ý cho FE:**
* Nút từ chối thiết kế sẽ gọi API này với `orderDetailId` tương ứng.
* Sau khi bình bài reject, design có thể được:
  * Sửa lại → chốt in lại (giữ mã cũ, không cấp mã mới).
  * Tái bản (reprint) để lên đơn mới.

---

### 2.8. Trả về từ bình bài → Chốt in lại (Idempotent)
```http
PUT /api/designs/{id}
```
* **Request:** (JSON)
  ```json
  {
    "designStatus": "confirmed_for_printing"
  }
  ```

**Quy tắc BE:**
* Nếu design đã có mã hệ thống (ví dụ `CTA-H001`) → **không cấp mã mới**, giữ nguyên mã cũ.
* Chỉ tạo thêm dòng `ReadyDesign` mới để lên đơn.

---

## 3. State Machine (Trạng thái thiết kế & ReadyDesign)

```
[Tạo mới] 
   ↓ POST /api/designs
received_info (code: NHAPxxx)
   ↓ Designer làm việc
designing → editing → waiting_for_customer_approval
   ↓ Khách chốt in
confirmed_for_printing (code: CTA-H001)
   ↓ BE tự động tạo ReadyDesign
[ReadyDesign: available]
   ↓ Sale lên đơn
[ReadyDesign: ordered] → [Order: pending]
   ↓ Bình bài reject
design: returned / ReadyDesign: available (orderCode bị xóa)
   ↓ Sửa lại → chốt in lại
confirmed_for_printing (giữ mã CTA-H001) → ReadyDesign mới
```

---

## 4. Các thay đổi khác liên quan FE

### 4.1. OrderResponse / OrderListResponse thêm `InvoiceNumber`
```json
{
  "id": 999,
  "code": "DH26-001",
  "invoiceNumber": "INV-2026-0001"  // <-- Mới
}
```
* **Nguồn:** `Accounting.InvoiceNumber` nếu có, fallback `Invoice.InvoiceNumber`.

### 4.2. Export Order Excel/PDF thêm dòng Tiền cọc
File xuất ra (Excel/PDF) giờ có thêm dòng:
* **TIỀN CỌC:** `{DepositAmount:N0} đ`
* **TỔNG THANH TOÁN:** `Tiền hàng + VAT - Tiền cọc`

### 4.3. Bảng đối chiếu công nợ (Export)
* Export công nợ **ẩn** các dòng `order_created` (tạo đơn).
* Chỉ hiện: `delivered` (giao hàng), VAT, thanh toán.

### 4.4. Lịch sử công nợ (UI)
* API lấy chi tiết công nợ khách hàng cũng đã ẩn `order_created`.

---

## 5. Checklist các màn hình FE cần triển khai / sửa đổi

| Màn hình | Thay đổi / Yêu cầu triển khai |
| :--- | :--- |
| **Tạo thiết kế mới** | Thay đổi từ "Tạo trong đơn hàng" → **Tạo độc lập** (gọi `POST /api/designs`). Có thể chọn khách hàng, loại thiết kế, chất liệu ngay từ đầu. |
| **Chi tiết thiết kế** | Thêm nút **"Chốt in"** (`PUT /api/designs/{id}` → `confirmed_for_printing`). Sau khi chốt in, hiện mã hệ thống (ví dụ `CTA-H001`). |
| **Kho thiết kế** | Màn hình mới: gọi `GET /api/ready-designs`. Hiện danh sách các thiết kế đã chốt in chưa lên đơn. Cho phép chọn nhiều dòng để lên đơn. |
| **Tái bản** | Trên màn hình thiết kế đã chốt in, thêm nút **"Tái bản"** (`POST /api/designs/{id}/reprint`) với input số lượng. |
| **Lên đơn từ kho** | Màn hình mới / modal: chọn địa chỉ giao hàng, ngày giao, ghi chú → `POST /api/orders/from-ready-designs`. |
| **Đơn hàng** | Thêm hiển thị `InvoiceNumber` nếu có. Export Excel/PDF tự động có dòng Tiền cọc. |
| **Bình bài** | Khi reject, BE tự động gỡ design khỏi đơn + hủy đơn nếu rỗng. FE chỉ cần thông báo kết quả. |
| **Công nợ** | Export / Chi tiết công nợ không còn hiển thị dòng `order_created`. |

---

## 6. Ví dụ luồng đầy đủ

1. **Designer** tạo design: `POST /api/designs` → Trả về design với mã `NHAPa1b2c3d4`.
2. Designer cập nhật file, kích thước qua `PUT /api/designs/100`.
3. **Designer** nhấn "Chốt in": `PUT /api/designs/100` với body `{ "designStatus": "confirmed_for_printing" }` → mã đổi thành `CTA-H001`, xuất hiện trong kho thiết kế.
4. **Sale** xem kho: `GET /api/ready-designs?customerId=1` → thấy `CTA-H001` với số lượng 200, status `available`.
5. **Sale** chọn dòng này và lên đơn: `POST /api/orders/from-ready-designs` → tạo thành công đơn `DH26-001`.
6. Khách muốn in thêm: **Designer** nhấn "Tái bản" → `POST /api/designs/100/reprint` với body `{ "quantity": 500 }` → hệ thống tạo thêm một dòng `CTA-H001` số lượng 500 trong kho với status `available`.
7. **Sale** lên đơn thứ hai từ dòng này: `POST /api/orders/from-ready-designs` → tạo thành công đơn `DH26-002`.
