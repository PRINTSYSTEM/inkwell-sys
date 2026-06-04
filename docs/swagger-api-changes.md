# Báo Cáo Thay Đổi API (So sánh với Git HEAD)

*Thời gian thực hiện so sánh:* `20:15:32 4/6/2026`

## I. Tổng Quan Thay Đổi

| Thành phần | Mới | Thay đổi | Xóa |
| :--- | :---: | :---: | :---: |
| **API (Endpoints)** | 0 | 8 | 0 |
| **Models (Schemas)** | 9 | 0 | 3 |

## II. Các API Mới Thêm (0)

*Không có API nào mới.*

## III. Các API Đã Xóa (0)

*Không có API nào bị xóa.*

## IV. Các API Thay Đổi Cấu Trúc (8)

### 🟡 `GET /api/orders`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `Order`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `OrderResponsePaginate`` thành `Model `OrderListResponsePaginate``

---

### 🟡 `GET /api/orders/my`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `Order`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `OrderResponsePaginate`` thành `Model `OrderListResponsePaginate``

---

### 🟡 `GET /api/orders/for-accounting`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `Order`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `OrderResponsePaginate`` thành `Model `OrderListResponsePaginate``

---

### 🟡 `GET /api/orders/for-sale`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `Order`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `OrderResponsePaginate`` thành `Model `OrderListResponsePaginate``

---

### 🟡 `GET /api/proofing-orders`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `ProofingOrder`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `ProofingOrderResponsePaginate`` thành `Model `ProofingOrderListResponsePaginate``

---

### 🟡 `GET /api/proofing-orders/by-order/{orderId}`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `ProofingOrder`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `ProofingOrderResponsePaginate`` thành `Model `ProofingOrderListResponsePaginate``

---

### 🟡 `GET /api/proofing-orders/available-order-details`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `ProofingOrder`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `OrderDetailResponsePaginate`` thành `Model `OrderDetailAvailableResponsePaginate``

---

### 🟡 `GET /api/proofing-orders/for-production`
* **Chức năng:** Không có mô tả
* **Nhóm (Tag):** `ProofingOrder`
* **Chi tiết thay đổi:**
  - 🔄 Thay đổi phản hồi `200`: từ `Model `ProofingOrderResponsePaginate`` thành `Model `ProofingOrderListResponsePaginate``

---

## V. Thay Đổi Ở Các Models / Schemas

### 1. Model Mới (9)

#### 🟢 Model `DesignSimpleResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `code` (string | null) (Tùy chọn)
- `customerId` (integer (int32)) (Tùy chọn)
- `designerId` (integer (int32)) (Tùy chọn)
- `designTypeId` (integer (int32)) (Tùy chọn)
- `designType` (Model `DesignTypeResponse`) (Tùy chọn)
- `materialTypeId` (integer (int32)) (Tùy chọn)
- `materialType` (Model `MaterialTypeResponse`) (Tùy chọn)
- `designName` (string | null) (Tùy chọn)
- `unitName` (string | null) (Tùy chọn)
- `dimensions` (string | null) (Tùy chọn)
- `length` (number (double) | null) (Tùy chọn)
- `width` (number (double) | null) (Tùy chọn)
- `height` (number (double) | null) (Tùy chọn)
- `areaM2` (number (double) | null) (Tùy chọn)
- `sidesClassification` (string | null) (Tùy chọn)
- `processClassification` (string | null) (Tùy chọn)
- `laminationType` (string | null) (Tùy chọn)
- `adhesiveOffset` (number (double) | null) (Tùy chọn)
- `laminationTypeName` (string | null) (Tùy chọn)
- `designFileUrl` (string | null) (Tùy chọn)
- `designImageUrl` (string | null) (Tùy chọn)
- `excelFileUrl` (string | null) (Tùy chọn)
- `notes` (string | null) (Tùy chọn)
- `status` (string | null) (Tùy chọn)
- `statusType` (string | null) (Tùy chọn)
- `availableQuantityForProofing` (integer (int32) | null) (Tùy chọn)
- `createdAt` (string (date-time)) (Tùy chọn)
- `updatedAt` (string (date-time) | null) (Tùy chọn)

#### 🟢 Model `OrderDetailAvailableResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `orderId` (integer (int32)) (Tùy chọn)
- `designId` (integer (int32)) (Tùy chọn)
- `sharedAddressId` (integer (int32) | null) (Tùy chọn)
- `sharedAddress` (Model `SharedAddressResponse`) (Tùy chọn)
- `deliveryAddressLabel` (string | null) (Tùy chọn)
- `deliveryAddress` (string | null) (Tùy chọn)
- `design` (Model `DesignSimpleResponse`) (Tùy chọn)
- `specification` (Array of string) (Tùy chọn)
- `quantity` (integer (int32)) (Tùy chọn)
- `unitPrice` (number (double) | null) (Tùy chọn)
- `totalPrice` (number (double) | null) (Tùy chọn)
- `requirements` (string | null) (Tùy chọn)
- `additionalNotes` (string | null) (Tùy chọn)
- `lastUpdatedByAccountantId` (integer (int32) | null) (Tùy chọn)
- `lastUpdatedByAccountant` (Model `UserInfo`) (Tùy chọn)
- `orderTotalAmount` (number (double)) (Tùy chọn)
- `orderDepositAmount` (number (double)) (Tùy chọn)
- `derivedStatus` (string | null) (Tùy chọn)
- `cutOverAt` (string (date-time) | null) (Tùy chọn)
- `itemStatus` (string | null) (Tùy chọn)
- `isCutOver` (boolean) (Tùy chọn)
- `status` (string | null) (Tùy chọn)
- `statusType` (string | null) (Tùy chọn)
- `proofedQuantity` (integer (int32)) (Tùy chọn)
- `pendingQuantity` (integer (int32)) (Tùy chọn)
- `proofingAllocations` (Array of Model `ProofingAllocationResponse`) (Tùy chọn)
- `createdAt` (string (date-time)) (Tùy chọn)
- `updatedAt` (string (date-time)) (Tùy chọn)

#### 🟢 Model `OrderDetailAvailableResponsePaginate`
Các trường thuộc tính:
- `size` (integer (int32)) (Tùy chọn)
- `page` (integer (int32)) (Tùy chọn)
- `total` (integer (int32)) (Tùy chọn)
- `totalPages` (integer (int32)) (Tùy chọn)
- `items` (Array of Model `OrderDetailAvailableResponse`) (Tùy chọn)

#### 🟢 Model `OrderDetailListResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `designId` (integer (int32)) (Tùy chọn)
- `designCode` (string | null) (Tùy chọn)
- `designName` (string | null) (Tùy chọn)
- `designImageUrl` (string | null) (Tùy chọn)
- `quantity` (integer (int32)) (Tùy chọn)
- `status` (string | null) (Tùy chọn)
- `statusType` (string | null) (Tùy chọn)

#### 🟢 Model `OrderListResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `code` (string | null) (Tùy chọn)
- `customerId` (integer (int32)) (Tùy chọn)
- `customerName` (string | null) (Tùy chọn)
- `customerCompanyName` (string | null) (Tùy chọn)
- `status` (string | null) (Tùy chọn)
- `statusType` (string | null) (Tùy chọn)
- `totalAmount` (number (double)) (Tùy chọn)
- `depositAmount` (number (double)) (Tùy chọn)
- `paidAmount` (number (double)) (Tùy chọn)
- `remainingAmount` (number (double)) (Tùy chọn)
- `deliveryDate` (string (date-time) | null) (Tùy chọn)
- `createdAt` (string (date-time)) (Tùy chọn)
- `orderDetails` (Array of Model `OrderDetailListResponse`) (Tùy chọn)

#### 🟢 Model `OrderListResponsePaginate`
Các trường thuộc tính:
- `size` (integer (int32)) (Tùy chọn)
- `page` (integer (int32)) (Tùy chọn)
- `total` (integer (int32)) (Tùy chọn)
- `totalPages` (integer (int32)) (Tùy chọn)
- `items` (Array of Model `OrderListResponse`) (Tùy chọn)

#### 🟢 Model `ProofingOrderDesignListResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `proofingOrderId` (integer (int32)) (Tùy chọn)
- `designId` (integer (int32)) (Tùy chọn)
- `design` (Model `DesignSimpleResponse`) (Tùy chọn)
- `quantity` (integer (int32)) (Tùy chọn)

#### 🟢 Model `ProofingOrderListResponse`
Các trường thuộc tính:
- `id` (integer (int32)) (Tùy chọn)
- `code` (string | null) (Tùy chọn)
- `materialTypeId` (integer (int32) | null) (Tùy chọn)
- `materialType` (Model `MaterialTypeResponse`) (Tùy chọn)
- `createdById` (integer (int32)) (Tùy chọn)
- `createdBy` (Model `UserInfo`) (Tùy chọn)
- `totalQuantity` (integer (int32)) (Tùy chọn)
- `status` (string | null) (Tùy chọn)
- `statusType` (string | null) (Tùy chọn)
- `proofingFileUrl` (string | null) (Tùy chọn)
- `imageUrl` (string | null) (Tùy chọn)
- `notes` (string | null) (Tùy chọn)
- `paperSizeId` (integer (int32) | null) (Tùy chọn)
- `paperSize` (Model `PaperSizeResponse`) (Tùy chọn)
- `customPaperSize` (string | null) (Tùy chọn)
- `plateOutputCount` (integer (int32)) (Tùy chọn)
- `createdAt` (string (date-time)) (Tùy chọn)
- `updatedAt` (string (date-time)) (Tùy chọn)
- `proofingOrderDesigns` (Array of Model `ProofingOrderDesignListResponse`) (Tùy chọn)

#### 🟢 Model `ProofingOrderListResponsePaginate`
Các trường thuộc tính:
- `size` (integer (int32)) (Tùy chọn)
- `page` (integer (int32)) (Tùy chọn)
- `total` (integer (int32)) (Tùy chọn)
- `totalPages` (integer (int32)) (Tùy chọn)
- `items` (Array of Model `ProofingOrderListResponse`) (Tùy chọn)


### 2. Model Đã Xóa (3)

- `OrderDetailResponsePaginate`
- `OrderResponsePaginate`
- `ProofingOrderResponsePaginate`

### 3. Model Bị Thay Đổi Cấu Trúc (0)

*Không có model nào bị thay đổi.*

