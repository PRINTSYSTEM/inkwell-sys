# Phân Tích & Tổng Hợp API Mới Từ Swagger (2).json (Đã Cập Nhật)

Hồ sơ đối chiếu và phân tích dưới đây đã được cập nhật dựa trên phiên bản mới nhất của file [swagger (2).json](file:///w:/DevPool/PrintSytem/inkwell-sys/swagger%20%282%29.json) (đã tích hợp các API quản lý kho, phiếu cắt, xuất nhập kho đặc biệt và đối soát nhà cung cấp).

---

## I. CÁC ENDPOINT MỚI ĐÃ ĐƯỢC TÍCH HỢP VÀO SWAGGER

Backend đã cập nhật chính thức các endpoint sau đây vào tài liệu API:

### 1. Phiếu xuất kho đặc biệt (Xuất trả NCC / Xuất xưởng)
* **Endpoint**: `POST /api/stock-outs/for-special-reason`
* **Tags**: `StockOut`
* **Request Body** (`CreateStockOutForSpecialReasonRequest`):
  ```json
  {
    "reason": "string",       // "return_vendor" hoặc "transfer"
    "materialId": 0,          // ID vật tư cần xuất
    "quantity": 0,            // Số lượng xuất
    "documentCode": "string", // Mã chứng từ (optional, sinh tự động nếu null)
    "notes": "string"         // Ghi chú lý do xuất
  }
  ```
* **Responses**:
  * `200 OK`: Xuất kho đặc biệt thành công.

### 2. Nhập kho từ phiếu cắt (Stock In From Cut)
* **Endpoint**: `POST /api/stock-ins/from-cut`
* **Tags**: `StockIn`
* **Request Body** (`CreateStockInFromCutRequest`):
  ```json
  {
    "materialCutId": 0, // ID phiếu cắt ở trạng thái completed
    "notes": "string"   // Ghi chú phiếu nhập (optional)
  }
  ```
* **Responses**:
  * `200 OK`: Tạo phiếu nhập kho đối soát thành công.

### 3. Xuất file Excel Lịch sử vật tư (Export Material History Excel)
* **Endpoint**: `GET /api/inventory-reports/material-history/{materialId}/excel`
* **Tags**: `InventoryReport`
* **Path Parameter**: `materialId` (int) - ID của nguyên vật liệu.
* **Query Parameters**:
  * `fromDate` (string, format: date-time, optional)
  * `toDate` (string, format: date-time, optional)
* **Responses**:
  * `200 OK`: Trả về luồng file binary `.xlsx` để tải xuống trực tiếp.

### 4. Đối soát Nhà Cung Cấp (Vendor Reconciliation)
Hỗ trợ cả định dạng JSON trả về dữ liệu đối soát và định dạng tải file Excel đối soát NCC:
* **Endpoint 1 (JSON Data)**: `GET /api/inventory-reports/vendor-reconciliation/{vendorId}`
  * **Tags**: `InventoryReport`
  * **Parameters**:
    * `vendorId` (int, path parameter, bắt buộc)
    * `fromDate`, `toDate` (date-time, query parameters, optional)
  * **Response** (`VendorReconciliationResponse`):
    ```json
    {
      "vendorId": 0,
      "vendorName": "string",
      "fromDate": "2025-06-01",
      "toDate": "2025-06-30",
      "items": [
        {
          "materialId": 0,
          "materialName": "string",
          "materialType": "string",
          "unit": "string",
          "openingBalance": 0.0,
          "totalImport": 0.0,
          "totalExport": 0.0,
          "totalWaste": 0.0,
          "closingBalance": 0.0
        }
      ]
    }
    ```
* **Endpoint 2 (Excel Download)**: `GET /api/inventory-reports/vendor-reconciliation/{vendorId}/excel`
  * **Tags**: `InventoryReport`
  * **Parameters**: `vendorId` (path), `fromDate` (query), `toDate` (query).
  * **Responses**:
    * `200 OK`: Tải xuống file Excel báo cáo đối soát NCC.

### 5. Xuất PDF Phiếu Xuất Kho (Export Stock-Out PDF)
* **Endpoint**: `GET /api/stock-outs/{id}/pdf`
* **Tags**: `StockOut`
* **Path Parameter**: `id` (int) - ID phiếu xuất kho cần in.
* **Responses**:
  * `200 OK`: Trả về file PDF thiết kế phiếu xuất kho.
  * `404 Not Found`: Khi ID phiếu xuất kho không tồn tại trong hệ thống.

---

## II. THAY ĐỔI CỦA CÁC API ĐÃ CÓ SẴN (CỰC KỲ QUAN TRỌNG)

Dưới đây là các thay đổi/nâng cấp cấu trúc dữ liệu trên các API Phiếu cắt (**Material Cuts**) mà Backend vừa cập nhật:

### 1. Model Tạo phiếu cắt (`CreateMaterialCutRequest`)
Đã bổ sung thêm 3 trường dữ liệu mới (đều ở dạng optional/nullable):
* `jobCode` (string, nullable): Mã bài sản xuất hỗ trợ đối chiếu.
* `cutAt` (string, format: date-time, nullable): Thời gian thực hiện cắt thực tế.
* `notes` (string, nullable): Ghi chú bổ sung cho phiếu cắt.

### 2. Chi tiết dòng sản phẩm ra (`MaterialCutOutputLineRequest`)
Thay đổi cơ chế sinh tờ thông minh từ cuộn:
* `outputMaterialId` hiện đã được chuyển thành **nullable: true** (không bắt buộc phải truyền ID chất liệu tờ có sẵn nữa).
* Bổ sung thêm 2 trường kích thước mới:
  * `cutLength` (double, nullable): Chiều dài của tờ chất liệu mới cần cắt ra.
  * `cutWidth` (double, nullable): Chiều rộng của tờ chất liệu mới cần cắt ra.
* **Quy trình nghiệp vụ mới**: Khi người dùng nhập kích thước tờ mới chưa có trong hệ thống, FE truyền `outputMaterialId: null` và truyền kích thước vào `cutLength` và `cutWidth`. Backend sẽ tự động tìm kiếm hoặc sinh chất liệu tờ mới phù hợp với cùng Vendor của cuộn đầu vào!

---

## III. NHÓM API QUẢN LÝ KHO BỔ SUNG KHÁC (TỪ SWAGGER GỐC)

Chúng ta có các API cốt lõi về quản lý giao dịch kho chưa được khai báo đầy đủ trong `util.api.ts`:
1. `POST /api/inventory/adjust`: Điều chỉnh tồn kho thủ công (`AdjustInventoryRequest`).
2. `GET /api/inventory/balance`: Xem số dư tồn kho chi tiết (`InventoryBalanceResponseIPaginate`).
3. `GET /api/inventory/transactions`: Truy xuất sổ chi tiết giao dịch biến động kho (`InventoryTransactionResponseIPaginate`).
4. `POST /api/inventory/migrate`: Đồng bộ hóa cơ sở dữ liệu tồn kho lịch sử.
5. `GET /api/inventory-reports/history`: Truy xuất báo cáo chi tiết giao dịch kho (`StockHistoryResponseIPaginate`).

---

## 💡 HƯỚNG DẪN CẬP NHẬT CẤU HÌNH TRONG CODE FE

Hãy thêm các định nghĩa Suffix mới này vào `API_SUFFIX` trong file [src/apis/util.api.ts](file:///w:/DevPool/PrintSytem/inkwell-sys/src/apis/util.api.ts) để sẵn sàng sử dụng:

```typescript
  // Thêm vào API_SUFFIX trong util.api.ts:
  
  // ========== STOCK EXTRAS ==========
  STOCK_OUT_SPECIAL: "/stock-outs/for-special-reason",
  STOCK_IN_FROM_CUT: "/stock-ins/from-cut",
  STOCK_OUT_PDF: (id: number) => `/stock-outs/${id}/pdf`,
  
  // ========== INVENTORY EXTRAS ==========
  INVENTORY_ADJUST: "/inventory/adjust",
  INVENTORY_BALANCE: "/inventory/balance",
  INVENTORY_TRANSACTIONS: "/inventory/transactions",
  
  // ========== INVENTORY REPORTS EXTRAS ==========
  MATERIAL_HISTORY_EXCEL: (materialId: number) => `/inventory-reports/material-history/${materialId}/excel`,
  VENDOR_RECONCILIATION: (vendorId: number) => `/inventory-reports/vendor-reconciliation/${vendorId}`,
  VENDOR_RECONCILIATION_EXCEL: (vendorId: number) => `/inventory-reports/vendor-reconciliation/${vendorId}/excel`,
```
