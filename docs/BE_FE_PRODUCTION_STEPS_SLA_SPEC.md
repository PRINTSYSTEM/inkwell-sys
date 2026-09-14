# BẢN THIẾT KẾ CẤU TRÚC DỮ LIỆU CÔNG ĐOẠN (STEPS) & THỜI GIAN DỰ KIẾN (SLA)
## ĐỒNG BỘ GIỮA BACKEND (BE) VÀ FRONTEND (FE) CHO HỆ THỐNG LỆNH SẢN XUẤT (LSX)

Document Status: **Draft Specification**  
Date: **14/09/2026**  
Module: **Production Management (Phân hệ Sản xuất)**

---

## 1. Mục tiêu
Hệ thống sản xuất đã được cấu hình Định mức SLA (thời gian chờ & thời gian thực hiện) cho từng công đoạn. 

Để giao diện Frontend (FE) có thể hiển thị:
1. **Tiến độ trực quan từng khâu** (Nốt xanh / vàng / đỏ / xanh dương).
2. **Các mốc giờ thực tế**: Thời điểm sẵn sàng, Bắt đầu, Hoàn thành.
3. **Các mốc giờ dự kiến theo SLA**: Thời điểm dự kiến xong, số phút định mức tiêu chuẩn, và số phút bị chậm/trễ.

Tài liệu này quy định chi tiết cấu trúc JSON trả về từ Backend API `GET /api/production-orders` và `GET /api/production-orders/{id}`.

---

## 2. Cấu trúc dữ liệu chi tiết của mảng `steps` (ProductionStepResponse)

Backend bổ sung/đảm bảo mảng `steps` trong mỗi Lệnh sản xuất trả về cấu trúc như sau:

```typescript
export interface ProductionStepResponse {
  id: number;
  productionOrderId: number;
  stepCode: string;              // VD: "PRINT", "LAM", "DIE_CUT", "GLUE", "KCS"
  stepName: string;              // VD: "In offset", "Cán màng", "Bế gỡ", "Dán thành phẩm"
  stepOrder: number;             // Thứ tự công đoạn: 1, 2, 3, 4...
  status: "pending" | "ready" | "in_progress" | "completed" | "paused" | "overdue";

  // ===== 1. MỐC THỜI GIAN THỰC TẾ (Actual Milestones) =====
  readyAt?: string | null;       // ISO Timestamp: Thời điểm khâu trước xong -> Khâu này sẵn sàng (VD: "2026-09-14T08:00:00Z")
  startedAt?: string | null;     // ISO Timestamp: Thời điểm công nhân bấm "Bắt đầu" (VD: "2026-09-14T08:15:00Z")
  completedAt?: string | null;   // ISO Timestamp: Thời điểm bấm "Hoàn thành" (VD: "2026-09-14T09:30:00Z")
  
  waitingMinutes?: number;       // Số phút chờ thực tế (startedAt - readyAt)
  processingMinutes?: number;    // Số phút thực hiện thực tế (completedAt - startedAt)

  // ===== 2. ĐỊNH MỨC & THỜI GIAN DỰ KIẾN THEO SLA (Configured SLA & Estimates) =====
  standardWaitingMinutes?: number;    // SLA thời gian chờ tối đa cho phép (VD: 30 phút)
  standardProcessingMinutes?: number; // SLA thời gian thực hiện tiêu chuẩn (VD: 60 phút)

  estimatedStartAt?: string | null;    // Thời điểm dự kiến bắt đầu = readyAt + standardWaitingMinutes
  estimatedCompleteAt?: string | null; // Thời điểm dự kiến hoàn thành = startedAt (hoặc estimatedStartAt) + standardProcessingMinutes

  // ===== 3. TRẠNG THÁI & CẢNH BÁO SLA (SLA Status & Overdue Calculation) =====
  slaStatus: "ok" | "warning" | "late" | "inactive"; 
  // ok: Đúng tiến độ (Xanh lá)
  // warning: Sắp chạm mốc SLA (Vàng)
  // late: Quá hạn SLA (Đỏ)
  // inactive: Chưa tới lượt (Xám)

  overdueMinutes?: number;      // Số phút bị trễ thực tế so với SLA (VD: +15 phút). Bằng 0 nếu đúng tiến độ.
  delayReason?: string | null;  // Lý do trễ (nếu công nhân có nhập)
  assignedWorkerName?: string | null; // Thợ phụ trách khâu
}
```

---

## 3. Ví dụ mẫu JSON API trả về từ Backend

```json
{
  "id": 4647,
  "code": "LSX004647",
  "productName": "Hộp thường Duplex",
  "flowCode": "F01",
  "status": "in_production",
  "proofingCompletedAt": "2026-09-14T07:00:00Z",
  "dispatchedAt": "2026-09-14T07:05:00Z",
  "steps": [
    {
      "id": 101,
      "stepCode": "PRINT",
      "stepName": "In offset",
      "stepOrder": 1,
      "status": "completed",
      "readyAt": "2026-09-14T07:05:00Z",
      "startedAt": "2026-09-14T07:10:00Z",
      "completedAt": "2026-09-14T08:00:00Z",
      "waitingMinutes": 5,
      "processingMinutes": 50,
      "standardWaitingMinutes": 15,
      "standardProcessingMinutes": 60,
      "estimatedCompleteAt": "2026-09-14T08:10:00Z",
      "slaStatus": "ok",
      "overdueMinutes": 0
    },
    {
      "id": 102,
      "stepCode": "LAM",
      "stepName": "Cán màng",
      "stepOrder": 2,
      "status": "in_progress",
      "readyAt": "2026-09-14T08:00:00Z",
      "startedAt": "2026-09-14T08:05:00Z",
      "completedAt": null,
      "waitingMinutes": 5,
      "processingMinutes": 45,
      "standardWaitingMinutes": 15,
      "standardProcessingMinutes": 30,
      "estimatedCompleteAt": "2026-09-14T08:35:00Z",
      "slaStatus": "late",
      "overdueMinutes": 15,
      "delayReason": "Máy cán màng kẹt lô"
    },
    {
      "id": 103,
      "stepCode": "DIE_CUT",
      "stepName": "Bế gỡ",
      "stepOrder": 3,
      "status": "pending",
      "readyAt": null,
      "startedAt": null,
      "completedAt": null,
      "standardWaitingMinutes": 20,
      "standardProcessingMinutes": 45,
      "slaStatus": "inactive",
      "overdueMinutes": 0
    }
  ]
}
```

---

## 4. Cách Frontend (FE) hiển thị thông tin này trên Giao diện

### 4.1. Tại Bảng Lệnh Sản Xuất (`ProductionListTable`)
1. **Cột TRẠNG THÁI**:
   - Đơn đang cán màng bị trễ 15 phút $\rightarrow$ Hiển thị Badge: **`🔴 Trễ: Cán (+15p)`** (màu đỏ nhấp nháy).
   - Đơn đang in đúng tiến độ $\rightarrow$ Hiển thị Badge: **`🔵 Đang In`** (dự kiến xong 08:10).
2. **Cột TIẾN ĐỘ SẢN XUẤT (Hover Tooltip tại nốt khâu)**:
   Khi rê chuột vào nốt của khâu **Cán màng**, Tooltip hiển thị:
   ```text
   Khâu: Cán màng (Đang thực hiện)
   -----------------------------------
   ⏱️ Thực tế bắt đầu: 08:05
   🎯 Dự kiến xong (SLA): 08:35 (Định mức 30 phút)
   🔴 Đã trễ: +15 phút (Lý do: Máy cán màng kẹt lô)
   ```

### 4.2. Tại Drawer Chi tiết LSX (`ProductionOrderDetailDrawer`)
- Tab **Quy trình sản xuất**:
  Hiển thị bảng mốc thời gian 2 cột song song **[Thực tế]** vs **[Dự kiến theo SLA]**:
  - **Khâu 1: In offset** $\rightarrow$ 🟢 Đúng tiến độ (Thực tế: 50p / SLA: 60p).
  - **Khâu 2: Cán màng** $\rightarrow$ 🔴 Quá hạn SLA (Dự kiến xong 08:35, thực tế chưa xong $\rightarrow$ Trễ +15p).
  - **Khâu 3: Bế gỡ** $\rightarrow$ ⚪ Chưa tới lượt (Dự kiến bắt đầu ngay sau khi Cán màng hoàn thành).

---

## 5. Tóm tắt Đơn vị Công việc
- **Backend (BE)**: Bổ sung các field `standardProcessingMinutes`, `estimatedCompleteAt`, `overdueMinutes`, `readyAt`, `startedAt`, `completedAt` trong mảng `steps` của API `GET /api/production-orders`.
- **Frontend (FE)**: Đã sẵn sàng logic dựng stepper, đổi mã màu nốt (🟢/🔵/🟡/🔴/⚪) và hiển thị tooltip mốc giờ thực tế vs dự kiến!
