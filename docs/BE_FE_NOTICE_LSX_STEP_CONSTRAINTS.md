# THÔNG BÁO QUY TẮC RÀNG BUỘC TUẦN TỰ & HỆ THỐNG SLA CẢNH BÁO TRỄ CÔNG ĐOẠN LSX

Tài liệu đồng bộ chi tiết nghiệp vụ và API giữa **Backend (BE)** & **Frontend (FE)**.

---

## 1. Quy tắc Khâu Xuất Nguyên Liệu (`material_export`) & Ràng buộc tuần tự

### 1.1. Khâu Xuất Nguyên Liệu (`material_export`)
- **Tồn tại trong CSDL**: Được khởi tạo tự động là Step 0 trong bảng `ProductionStep` ở CSDL để Phân hệ Kho thực hiện xuất vật tư (`StockOut`).
- **Không gây nghẽn luồng sản xuất**: Backend (`UpdateProductionStepStatusAsync`) chủ động loại bỏ `material_export` ra khỏi chuỗi thứ tự các khâu sản xuất vật lý:
  $$\text{In (Print)} \longrightarrow \text{Cán} \longrightarrow \text{Bế} \longrightarrow \text{Cắt} \longrightarrow \text{Ép} \longrightarrow \text{Đóng gói}$$
- Phân hệ Kho quản lý xuất vật tư độc lập mà không ảnh hưởng hoặc làm nghẽn tiến độ các khâu sản xuất tại xưởng.

### 1.2. Khởi tạo & Ràng buộc chuyển trạng thái công đoạn (`PUT /api/v1/production-orders/steps/{stepId}/status`)
- **Khi mới tạo LSX (Bình bài hoàn thành)**:
  - `dispatchedAt` / `scheduledPrintDate` = `null` (Chưa điều lệnh in).
  - Trạng thái LSX: `waiting_for_production` (Chờ sản xuất).
  - **Mảng steps**: Tất cả các bước sản xuất vật lý đều ở trạng thái `pending` (Chưa tới / Chờ điều lệnh).
- **Khi thực hiện Điều lệnh in (Dispatch)**:
  - Ghi nhận `dispatchedAt` = `DateTime.UtcNow`.
  - **CHỈ gán `readyAt = DateTime.UtcNow` và `status = "ready"` cho Khâu 1 (In)**.
  - Tất cả các khâu 2, 3, 4... đằng sau **phải để `readyAt = null` và `status = "pending"`**.
- **Khi Khâu N hoàn thành (`completed`)**:
  - **Gán `completedAt = DateTime.UtcNow` cho Khâu N**.
  - Kích hoạt **Khâu N+1** chuyển trạng thái từ `pending` $\rightarrow$ `ready` và gán `readyAt = DateTime.UtcNow` cho Khâu N+1.
- **Ràng buộc chuyển trạng thái tuần tự**:
  - Đối với Khâu $N$ ($N > 0$): Muốn chuyển sang `ready`, `in_progress`, hoặc `done`, **Khâu $N-1$ phải có trạng thái `completed` hoặc `done`**.
  - Nếu Khâu $N-1$ chưa `done`, BE trả về `400 Bad Request`. FE hiển thị ngay thông báo cảnh báo `toast.error` (VD: *"Khâu '[Tên khâu N-1]' chưa hoàn thành. Chưa thể chuyển trạng thái khâu này!"*).
- **Ngoại lệ: Thao tác Báo số sản lượng & Phế phẩm**:
  - Giữ nguyên sự linh hoạt: Công nhân / Tổ trưởng có thể nhập số lượng đạt / phế phẩm bất kỳ lúc nào mà không bị chặn bởi trạng thái khâu trước.

---

## 2. Hệ Thống SLA, Cảnh Báo Trễ Tiến Độ, Notification & Màu Sắc

### 2.1. Công cụ tính SLA 2 chiều (`ProductionSlaHelper.cs`)
1. **Thời gian chờ (Waiting SLA)**: Tính từ khi khâu trước hoàn thành $\rightarrow$ bắt đầu khâu hiện tại.
2. **Thời gian thực hiện (Processing SLA)**: Tính từ khi bấm "Bắt đầu" $\rightarrow$ "Hoàn thành" khâu đó.

### 2.2. Ngưỡng cảnh báo màu sắc trên Frontend
- 🟢 **ok**: Đúng tiến độ (Màu xanh).
- 🟡 **warning**: Sắp vượt mốc SLA (Màu vàng - Cảnh báo).
- 🔴 **late**: Quá hạn SLA (Màu đỏ - Cảnh báo trễ).

### 2.3. Quét định kỳ & Bắn Notification (`ProductionDelayCheckJobService.cs`)
- Hệ thống chạy Job ngầm định kỳ quét toàn bộ các LSX đang sản xuất.
- Khi chạm ngưỡng Vàng (Yellow) hoặc Đỏ (Red):
  1. Ghi nhận log vào bảng `production_delay_logs`.
  2. Tự động gửi **Notification** trực tiếp đến Trưởng sản xuất & Thợ phụ trách khâu đó.

### 2.4. Endpoints API cung cấp cho Frontend
- `GET /api/v1/production-orders/{id}/schedule` (hoặc `/api/production-orders/{id}/schedule`): Trả về snapshot timeline đầy đủ, các mốc thời gian cảnh báo Vàng/Đỏ và status của từng khâu.
- `GET /api/v1/production-orders/delay-report/excel` (hoặc `/api/production-orders/delay-report/excel`): Xuất file Excel báo cáo chi tiết các LSX bị chậm tiến độ, thời gian trễ và nguyên nhân.

---

## 3. Tóm tắt các điều chỉnh Frontend đã hoàn thành
1. **Ẩn Tab Tài liệu** & **Ẩn nút thao tác dưới footer** của Drawer chi tiết LSX.
2. **Hiển thị mốc thời gian tổng hợp LSX**:
   - `Bình bài hoàn thành`: Timestamp bình bài / ngày tạo LSX.
   - `Điều lệnh in`: Chỉ hiển thị timestamp khi đã điều lệnh thực sự (nếu chưa sẽ hiển thị `—`).
3. **Mảng tiến độ công đoạn (Horizontal Dots)**:
   - Sửa lỗi tính toán `activeIndex` và mảng chấm tiến độ. Chỉ tô xanh khâu thực sự `done`/`completed`.
4. **Cảnh báo chuyển trạng thái khâu**:
   - Tích hợp toast cảnh báo khi đổi trạng thái khâu nếu khâu trước chưa hoàn thành hoặc lệnh chưa điều lệnh.
5. **Xuất Excel Báo cáo Trễ**:
   - Đã tích hợp handler tải về file Excel `.xlsx` tại màn hình Báo cáo trễ tiến độ LSX.
