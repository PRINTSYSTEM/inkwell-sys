Dưới đây là bản tổng hợp ngắn gọn cho **FE** triển khai (Feature 18 + chỉnh nhập kho + danh sách vật liệu). Tất cả route đều cần **JWT** như các API hiện có (`[Authorize]`).

---

## 1. Phiếu nhập kho (`StockIn`)

**Không đổi URL** (`api/stock-ins`, `from-vendor`, `from-production`, `from-delivery-return`, `PUT`, `complete`, …).

### Thay đổi quan trọng cho FE

- **`TotalAmount` (phiếu):** Backend **tự tính** = `Σ (unitPrice ?? 0) × quantity` trên **tất cả** dòng `Items` khi:
  - Tạo phiếu (mọi luồng tạo),
  - Cập nhật phiếu **có gửi lại `items`**.
- Nếu **chỉ** sửa header, **không** gửi `items`: có thể gửi `totalAmount` trong `UpdateStockInRequest` như cũ.
- Field mới trên từng dòng nhập:

| Field | Ý nghĩa |
|--------|---------|
| `lineKind` | Optional. Giá trị hợp lệ (không phân biệt hoa thường khi gửi, server lưu lowercase): `sheet`, `roll`, `custom`, `service`. Để trống = không phân loại. |

**Gợi ý mapping nghiệp vụ**

| Loại hàng | `lineKind` | `unit` gợi ý | Ghi chú |
|-----------|------------|--------------|----------|
| Tờ (giấy, decal…) | `sheet` | `tờ` | `length` / `width` optional trên dòng |
| Cuộn (PE, PA, Metaline…) | `roll` | `m` | `quantity` = **tổng mét** sau khi user tự quy đổi |
| Hàng khác (tên tự đặt) | `custom` | tùy | Có/không kích thước |
| Công cắt (chỉ tiền, không tồn) | `service` | tùy | **`materialId` = null**, `quantity` ≥ 1 (vd `1`), `unitPrice` = tiền công (**có thể 0**; nếu 0 thì không cần dòng cũng được) |

Response mỗi dòng có thêm `lineKind` trong `StockInItemResponse`.

---

## 2. Cắt nguyên liệu (mới)

**Base:** `GET/POST /api/material-cuts`  
**Auth:** Bearer như cũ.

| Method | Path | Body / Query | Mô tả |
|--------|------|--------------|--------|
| `POST` | `/api/material-cuts` | JSON bên dưới | Tạo phiếu **`pending`** (chưa trừ/cộng tồn) |
| `POST` | `/api/material-cuts/{id}/complete` | — | Trừ tồn vào, cộng từng dòng ra; lưu snapshot tồn trước cắt |
| `POST` | `/api/material-cuts/{id}/cancel` | — | Chỉ khi **`pending`** |
| `GET` | `/api/material-cuts/{id}` | — | Chi tiết |
| `GET` | `/api/material-cuts` | `pageNumber`, `pageSize`, `status`, `inputMaterialId`, `fromDate`, `toDate`, `sortColumn`, `sortOrder` | Danh sách phân trang |

### Request tạo phiếu — `CreateMaterialCutRequest`

```json
{
  "inputMaterialId": 0,
  "quantityUsed": 0,
  "quantityWasted": 0,
  "cutAt": "2026-05-12T10:00:00",
  "notes": "optional",
  "outputs": [
    { "outputMaterialId": 0, "quantityProduced": 0 }
  ]
}
```

**Rule backend (FE nên validate UI cho khớt):**

- `outputs`: **ít nhất 1** dòng.
- **Không** trùng `outputMaterialId` trong cùng một phiếu.
- `quantityUsed + quantityWasted` **> 0**.
- Mỗi dòng `outputs`: `quantityProduced` **≥ 1**.
- `cutAt` optional; không gửi → server dùng thời điểm hiện tại.

### Response — `MaterialCutResponse`

- Header: `code`, `inputMaterialId`, `inputMaterialName`, `quantityUsed`, `quantityWasted`, `inputStockBefore` (null đến khi **complete**), `cutAt`, `status` (`pending` | `completed` | `cancelled`), `notes`, `createdBy`, `createdAt`, `updatedAt`.
- `outputs[]`: `id`, `outputMaterialId`, `outputMaterialName`, `quantityProduced`, `outputStockBefore` (set khi **complete**).

**Lỗi:** `400` / `404` với body `ErrorResponse` (`error`, `statusCode`, `timeStamp`) giống pattern controller hiện tại.

---

## 3. Danh sách vật liệu (dropdown chọn vào / ra)

**`GET /api/materials`**

Query **mới / cập nhật:**

| Param | Ý nghĩa |
|--------|---------|
| `search` | Nếu có → **ưu tiên** dùng làm chuỗi tìm (trim). Nếu không có → fallback `name` như trước. Tìm trong **tên vật liệu**, **mã loại** (`materialType.code`), **tên loại** (`materialType.name`). |
| `quantityMin` | Optional. Lọc `material.quantity >= quantityMin` (vd chỉ hiện còn tồn). |

Các param cũ: `pageNumber`, `pageSize`, `name`, `materialTypeId`, `sortColumn`, `sortOrder`.

---

## 4. Việc môi trường / triển khai

- DB cần chạy migration mới (bảng `material_cuts`, `material_cut_outputs`, cột `line_kind` trên `stock_in_items`). Nếu chưa migrate, API sẽ lỗi khi đụng schema mới.

---

## 5. Gợi ý flow UI

1. **Nhập NCC:** form dòng + dòng “Công cắt” (`lineKind: service`, không chọn `materialId`); preview `totalAmount` = tổng dòng cho khớp server.
2. **Cắt:** bước 1 — chọn `inputMaterialId` từ `GET /api/materials`; bước 2 — nhập used/waste + nhiều dòng `outputs`; bước 3 — `POST` tạo rồi nút “Hoàn thành” gọi `.../complete` (hoặc tách bước tùy UX).

Nếu cần thêm field hiển thị (vd đơn vị mét vs tờ), FE có thể dựa vào `material` + `lineKind` / `unit` trên phiếu nhập mà không cần API mới.