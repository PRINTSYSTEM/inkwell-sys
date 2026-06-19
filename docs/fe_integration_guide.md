# Hướng Dẫn Tích Hợp Frontend (FE) — Feature #17: Ghi Nhận Lỗi Sản Xuất

Tài liệu này hướng dẫn chi tiết cho đội ngũ Frontend (FE) để thiết lập giao diện, kết nối API và xử lý luồng nghiệp vụ ghi nhận lỗi sản xuất (Defect Records) phục vụ khấu trừ lương/phạt lỗi.

---

## 1. Các Màn Hình Cần Xây Dựng (UI/UX)

FE cần xây dựng/cập nhật 3 giao diện chính:

### Màn hình A: Form Ghi Nhận Lỗi Sản Xuất
*   **Vị trí xuất hiện:** 
    1. Một nút "Ghi nhận lỗi" (nổi bật, màu cam hoặc đỏ nhẹ) ở góc của **Chi tiết Lệnh Sản xuất** (Production Order Details).
    2. Một nút "Báo lỗi" ngay cạnh mỗi item sản phẩm trong danh sách **Mã hàng sản xuất** (Production Order Items).
    3. Tích hợp trực tiếp vào popup xác nhận Hoàn thành công đoạn (ở Click 2 kết thúc công đoạn).
*   **Các trường nhập liệu (Form Fields):**
    1.  **Lệnh sản xuất (Production Order):** Tự động điền (readonly) ID hoặc Code của lệnh sản xuất hiện tại.
    2.  **Mã hàng lỗi (Production Order Item):** Select dropdown chứa danh sách các thiết kế/sản phẩm thuộc lệnh sản xuất này (FE lấy từ danh sách items của Lệnh sản xuất).
    3.  **Công đoạn lỗi (Production Step):** Select dropdown hiển thị các bước trong lệnh sản xuất này (In, Cán, Bế, Dán...) hoặc chọn "Khác / QC".
    4.  **Nguồn lỗi (Defect Source):** Dropdown bắt buộc:
        *   `design`: Lỗi do thiết kế
        *   `proofing`: Lỗi do bình bài
        *   `production`: Lỗi do sản xuất
        *   `management_decision`: Quyết định quản lý (lỗi do chỉ đạo sếp, lệch màu được sếp duyệt...)
    5.  **Người chịu trách nhiệm (Assigned To):** Dropdown tìm kiếm (Auto-complete search) để chọn nhân viên chịu trách nhiệm. Load từ danh sách nhân viên hoạt động của công ty.
    6.  **Số lượng lỗi (Defect Quantity):** Trường số nguyên bắt buộc, phải lớn hơn 0.
    7.  **Thời gian xảy ra lỗi (Defect Occurred At):** DateTime picker, mặc định là thời gian hiện tại (không được chọn thời gian trong tương lai).
    8.  **Mô tả lỗi (Description):** Textarea nhập chi tiết lỗi (ví dụ: "Lệch màu nhạt hơn bài mẫu", "Cắt lệch biên 2mm"). Tối đa 1000 ký tự.

### Màn hình B: Danh Sách Nhật Ký Lỗi Sản Xuất (Defect Log)
*   **Vị trí:** Menu "Quản lý sản xuất" -> sub-menu "Nhật ký lỗi sản xuất".
*   **Chức năng:** Hiển thị danh sách các lỗi đã ghi nhận dưới dạng bảng phân trang.
*   **Bộ lọc (Filters):**
    *   Người bị gán lỗi (Assigned To User)
    *   Nguồn lỗi (Defect Source)
    *   Lệnh sản xuất (Production Order ID)
    *   Khoảng thời gian xảy ra lỗi (Từ ngày -> Đến ngày)
*   **Hành động (Actions):**
    *   **Xem chi tiết:** Popup xem thông số thiết kế bị lỗi (kích thước, loại, người ghi nhận).
    *   **Chỉnh sửa:** Chỉ cho phép với vai trò `Admin`, `Manager`, `ProductionLead`.
    *   **Xóa:** Chỉ hiển thị nút Xóa cho vai trò `Admin`, `Manager`.

### Màn hình C: Báo Cáo Tổng Hợp Lỗi Theo Nhân Viên (Phục vụ Trừ Lương)
*   **Vị trí:** Menu "Tài chính / Kế toán" -> "Báo cáo lỗi trừ lương".
*   **Phân quyền truy cập:** Chỉ dành cho `Admin`, `Manager`, `Accounting`, `AccountingLead`.
*   **Giao diện:** 
    *   DatePicker chọn khoảng thời gian (Từ ngày -> Đến ngày) bắt buộc.
    *   Dropdown lọc theo "Nguồn lỗi" (không bắt buộc).
    *   Bảng kết quả (Summary Table) hiển thị danh sách nhân viên bị ghi nhận lỗi:
        
        | Tên Nhân Viên | Vai Trò | Số Lần Bị Lỗi | Tổng Số Lượng Lỗi | Do Thiết Kế | Do Bình Bài | Do Sản Xuất | Quyết Định Quản Lý |
        | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
        | Nguyễn Văn A | Production | 3 | **150** | 0 | 10 | 140 | 0 |
        | Trần Thị B | Design | 1 | **10** | 10 | 0 | 0 | 0 |
        
    *   Có nút **Export Excel** (Kế toán dùng để xuất ra làm căn cứ trừ lương cuối tháng).

---

## 2. Đặc Tả Tích Hợp API (API Contracts)

Mã tiền tố API chung: `/api/defect-records`

### 2.1 Lấy danh sách nhân viên để gán lỗi
FE sử dụng API User hiện tại để điền vào dropdown "Người chịu trách nhiệm":
*   **Endpoint:** `GET /api/users`
*   **Query Params:**
    *   `isActive=true` (Chỉ load nhân viên đang hoạt động)
    *   `pageSize=100` (Hoặc dùng auto-complete search để lọc theo tên qua `role` / `fullName`)

---

### 2.2 Tạo bản ghi lỗi mới
Gọi khi người dùng bấm nút Submit ở **Form Ghi Nhận Lỗi**.
*   **Endpoint:** `POST /api/defect-records`
*   **Quyền hạn:** `Admin`, `Manager`, `ProductionLead`, `Production`
*   **Payload (JSON):**
    ```json
    {
      "productionOrderId": 12,          // Bắt buộc
      "productionStepId": 45,           // Tùy chọn (ID công đoạn xảy ra lỗi)
      "productionOrderItemId": 89,      // Tùy chọn (ID item cụ thể bị lỗi)
      "designId": 23,                   // Bắt buộc (Thiết kế bị lỗi)
      "orderDetailId": 147,             // Tùy chọn
      "defectQuantity": 50,             // Bắt buộc (> 0)
      "description": "Lệch màu in",     // Bắt buộc (tối đa 1000 kí tự)
      "defectSource": "production",     // Bắt buộc (design | proofing | production | management_decision)
      "assignedToUserId": 3,            // Bắt buộc (ID nhân viên chịu trách nhiệm)
      "defectOccurredAt": "2026-06-18T03:00:00Z" // Tùy chọn (mặc định hiện tại nếu null)
    }
    ```
*   **Mã phản hồi thành công:** `201 Created`

---

### 2.3 Lấy danh sách lỗi (Phân trang + Bộ lọc)
*   **Endpoint:** `GET /api/defect-records`
*   **Query Params:**
    *   `pageNumber` (mặc định 1)
    *   `pageSize` (mặc định 10)
    *   `assignedToUserId` (lọc theo nhân viên)
    *   `defectSource` (lọc theo nguồn lỗi)
    *   `productionOrderId` (lọc theo lệnh sản xuất)
    *   `designId` (lọc theo thiết kế)
    *   `fromDate` (lọc theo thời điểm lỗi từ ngày - ISO String)
    *   `toDate` (lọc theo thời điểm lỗi đến ngày - ISO String)
    *   `sortColumn` (sắp xếp theo: `defectquantity` | `defectoccurredat` | `assignedtousername`)
    *   `sortOrder` (`asc` | `desc`)
*   **Response (JSON):**
    ```json
    {
      "items": [
        {
          "id": 1,
          "productionOrderId": 100,
          "productionStepId": 5,
          "productionStepType": "print",
          "productionOrderItemId": 12,
          "designId": 20,
          "designCode": "CTA-H001",
          "designName": "Hộp giấy Duplex",
          "dimensions": "20x15x10",
          "orderDetailId": 32,
          "orderId": 5,
          "orderCode": "DH26-001",
          "defectQuantity": 10,
          "description": "Lệch màu nhạt hơn bài mẫu",
          "defectSource": "production",
          "defectSourceDisplay": "Sản xuất",
          "assignedToUserId": 10,
          "assignedToUserName": "Nguyễn Văn A",
          "assignedToUserRole": "Production",
          "recordedByUserId": 1,
          "recordedByUserName": "Admin User",
          "defectOccurredAt": "2026-06-17T15:00:00",
          "createdAt": "2026-06-17T15:00:00",
          "updatedAt": null
        }
      ],
      "total": 1,
      "page": 1,
      "size": 10,
      "totalPages": 1
    }
    ```

---

## 3. Một Số Lưu Ý Quan Trọng Cho FE
1.  **Hiển thị Tên Nguồn Lỗi:** BE trả về thêm trường `defectSourceDisplay` (ví dụ: "Sản xuất", "Bình bài") để FE hiển thị trực tiếp trên bảng hoặc chi tiết mà không cần tự map chuỗi ở client.
2.  **Logic Ràng Buộc Form:**
    *   Khi người dùng chọn **Lệnh sản xuất**, dropdown **Mã hàng lỗi (Design)** chỉ được hiển thị các thiết kế thuộc lệnh đó (không cho chọn bừa bãi ngoài luồng).
    *   Chỉ load các User đang active (`isActive=true`) vào danh sách gán lỗi để tránh gán cho nhân viên đã nghỉ việc.
    *   Validation Client: Báo lỗi đỏ lập tức nếu người dùng nhập Số lượng lỗi `<= 0` hoặc chọn ngày xảy ra lỗi ở tương lai.
