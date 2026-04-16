Dưới đây là danh sách tổng hợp tất cả những thay đổi về luồng (Flow), API và định dạng Payload (DTO) quan trọng để đội Frontend (FE) có thể nắm và tích hợp ngay được luồng tính năng "Tạo phiếu giao hàng theo Dòng (OrderDetail)" mới:

### 1. Payload Tạo Mới Phiếu Giao Hàng (`CreateDeliveryNoteRequest`)

Từ bây giờ, việc gửi mảng `OrderIds` bị loại bỏ. FE cần gửi danh sách chi tiết các **Mã hàng (Lines)** cần giao.

**API:** `POST /api/delivery-notes`

**Payload Frontend cần gửi lên:**

```json
{
  "lines": [
    {
      "orderDetailId": 105, // ID của mã hàng (OrderDetail)
      "deliveryQty": 500, // Số lượng muốn giao (phải <= RemainingToDeliver)
      "customerAddressId": 12 // (Tùy chọn) ID lấy từ Sổ địa chỉ của khách hàng
    },
    {
      "orderDetailId": 106,
      "deliveryQty": 200,
      "customerAddressId": 15 // Có thể giao mỗi dòng 1 địa chỉ khác nhau
    }
  ],
  "notes": "Giao cẩn thận, hàng dễ vỡ"
}
```

---

### 2. API Mới: Lấy Danh Sách Mã Hàng (OrderDetails) Chờ Giao

Thay vì FE phải gọi API `available-orders` rồi tự bóc tách mảng `Details` bên trong, Backend đã cung cấp một API trả về danh sách **phẳng (Flat List)** các mã hàng đủ điều kiện giao, giúp FE trực tiếp map vào Table/List để người dùng tick chọn.

**API Mới:** `GET /api/delivery-notes/available-order-details?customerId={id}`

**Response trả về (Mảng):**

```json
[
  {
    "orderDetailId": 105,
    "orderId": 50,
    "orderCode": "ORD-2405-001",
    "designId": 80,
    "designCode": "DS-A4-01",
    "designName": "Tờ rơi A4",
    "orderedQty": 1000,
    "netQtyTotal": 1000,
    "deliveredQtyTotal": 500,
    "remainingToDeliver": 500, // Trọng tâm - FE khóa ô input tối đa ở số lượng này
    "unitPrice": 1200,
    "customerId": 5,
    "customerName": "Công ty TNHH ABC"
  }
]
```

---

### 3. Payload Tạo Lại Phiếu Giao Hàng Thất Bại (`RecreateDeliveryNoteRequest`)

Giao diện tạo lại phiếu khi luồng giao bị thất bại ("Thất bại - hẹn giao lại") đi theo chuẩn mới và thông minh hơn.

**API:** `POST /api/delivery-notes/recreate`

**Payload Frontend cần gửi lên:**

```json
{
  "originalDeliveryNoteId": 1001,
  "lines": null,
  "notes": "Giao lại lần 2 do hôm qua khách đi vắng"
}
```

- 💡 **Mẹo cho FE:** \*
- **Nếu FE truyền `lines: null` hoặc không gửi mảng `lines`**: BE sẽ TỰ ĐỘNG quét tất cả các dòng giao thất bại (`failed_reschedule`) của tờ phiếu 1001 cũ và gom hết vào tờ rơi PGH mới này (địa chỉ và số lượng đều giữ nguyên như đợt gửi đầu). (Phù hợp cho cái nút bấm 1 click "Recreate" ăn liền)
- **Nếu FE truyền mảng `lines: [...]`**: BE sẽ tạo dựa trên đúng các lines và số lượng/địa chỉ mà FE cấu hình. Trình bày giống y hệt ở mục số 1. Các trường rác cũ gồm `OrderIds`, `RecipientName`, `RecipientPhone`, `DeliveryAddress` đã bị xoá.

---

### 4. Dữ Liệu Chi Tiết PGH Tăng Cường (Trong `DeliveryNoteResponse`)

Khi FE vào trang Chi Tiết Phiếu Giao Hàng (`GET /api/delivery-notes/{id}`), ở bên trong mảng `Lines` sẽ đính kèm thêm một số metadata mới phục vụ UI:

```json
"lines": [
  {
    "id": 55,
    "orderDetailId": 105,
    "orderCode": "ORD-2405-001",   // Đã bổ sung OrderCode ở mảng Line để FE dễ hiển thị

    // ... metadata số lượng, thành tiền ...

    "customerAddressId": 12,
    "customerAddress": {           // Chi tiết địa chỉ để FE in/hiển thị cho shipper
      "id": 12,
      "label": "Kho Quận 7 - Chị Lan",
      "recipientName": "Chị Lan",
      "recipientPhone": "0988 123 456",
      "address": "123 Nguyễn Văn Linh, Q7",
      "isDefault": false
    }
  }
]
```

---

### 📌 Summary các rủi ro FE cần lưu ý khi thay đổi:

1. Sổ địa chỉ của từng khách hàng (Customer Address) phải có giao diện CRUD thì FE mới có `customerAddressId` để gắn cho `Lines`. (Khách vãng lai cũng có thể tạo địa chỉ riêng biệt vào sổ của họ). FE dùng mảng `.customerAddresses` trong object Customer.
2. File PDF PGH (do QuestPDF xuất ra từ BE) hiện tại sẽ tự động "cắt trang". Ví dụ PGH gom 5 món đi 3 địa chỉ khác nhau, nó sẽ in ra 3 trang PDF độc lập dùng để dán lên 3 kiện hàng. Hiển thị trên UI FE vẫn là 1 Mã Phiếu duy nhất. Chức năng `Export PDF` giữ nguyên GET endpoint, không cần đổi gì cả.
