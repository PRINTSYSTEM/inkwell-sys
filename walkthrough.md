# Walkthrough — Theo dõi tiến độ sản xuất theo thời gian thực (Cảnh báo trễ)

Đã hoàn thành xây dựng hệ thống Frontend cho **Theo dõi tiến độ sản xuất theo thời gian thực (Real-time Step Timing & Delay Warning)**.

---

## 1. Các thay đổi đã thực hiện

### 1. Schemas & Endpoints
- **[production.schema.ts](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/Schema/production.schema.ts)**:
  - Bổ sung `timingStatus`, `mostLateStepType`, `referenceAt`, `dueAt`, `elapsedHours`, `remainingHours`, `lateHours` vào `ProductionStepResponse` và `ProductionOrderResponse`.
  - Thêm Zod schemas & types cho Schedule Timeline (`ProductionOrderScheduleResponse`), Config Items (`ProductionConfigItem`), Báo cáo trễ (`ProductionDelayReportResponse`, `ProductionDelaySummaryResponse`).
- **[util.api.ts](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/apis/util.api.ts)** & **[route.constant.ts](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/constants/route.constant.ts)**:
  - Khai báo các API suffix mới: `PRODUCTION_ORDER_SCHEDULE`, `PRODUCTION_CONFIG`, `PRODUCTION_DELAY_REPORT`, `PRODUCTION_DELAY_SUMMARY`.
  - Thêm route paths: `ROUTE_PATHS.PRODUCTION.CONFIG` (`/production/config`), `ROUTE_PATHS.PRODUCTION.DELAY_REPORT` (`/production/delay-report`).

### 2. Custom React Query Hooks
- **[use-production-timing.ts](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/hooks/use-production-timing.ts)**:
  - `useProductionOrderSchedule(id)`: Tải timeline mốc khâu chi tiết của 1 LSX.
  - `useProductionConfig()`: Tải 20 key cấu hình thời hạn/cảnh báo.
  - `useUpdateProductionConfig()`: Cập nhật dictionary cấu hình giờ.
  - `useProductionDelayReport(params)`: Tải danh sách nhật ký trễ phân trang.
  - `useProductionDelaySummary(params)`: Tải thẻ thống kê & phân bổ trễ theo khâu.

### 3. UI Components & Visual Indicators
- **[ProductionTimingBadge.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/components/production/ProductionTimingBadge.tsx)**:
  - Render màu sắc trạng thái tiến độ (`ok` trắng/mặc định, `warning` vàng `#f59e0b`, `late` đỏ `#ef4444 animate-pulse`, `done`/`inactive`).
  - Tooltip khi hover hiển thị mốc bắt đầu (`referenceAt`), Hạn chót (`dueAt`), Số giờ trôi qua (`elapsedHours`), Số giờ còn lại / trễ (`remainingHours`/`lateHours`).
  - Hỗ trợ các biến thể rendering: `badge`, `pill`, `icon`, `full`.
- **[ProductionScheduleTimeline.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/components/production/ProductionScheduleTimeline.tsx)**:
  - Render timeline chuỗi mốc tiến độ từ Bình bài đến Đóng gói.
- **[ProductionListTable.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/pages/production/components/ProductionListTable.tsx)**:
  - Tích hợp `ProductionTimingBadge` ở từng khâu và ở cột Mã Bình Bài cấp độ LSX.
  - Thêm Modal hiển thị Timeline tiến độ chi tiết từng mốc khi bấm vào badge.

### 4. Trang Quản lý & Routing
- **[ProductionConfigPage.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/pages/production/ProductionConfigPage.tsx)**:
  - Màn hình cấu hình giờ cho Trưởng phòng SX / Admin cho 10 khâu sản xuất (`dispatch, material_export, print, lamination, mounting, pressing, die_cut, cut, glue, packaging`).
  - Validation client-side: Đảm bảo Ngưỡng cảnh báo (vàng) < Thời hạn tối đa (đỏ).
- **[ProductionDelayReportPage.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/pages/production/ProductionDelayReportPage.tsx)**:
  - Màn hình báo cáo trễ tiến độ: Thẻ số liệu tổng quan (`warningCount`, `lateCount`, `resolvedCount`, `averageLateHours`, `maxLateHours`), Bảng phân bổ trễ theo khâu (`byStage`), Bộ lọc nâng cao (Từ ngày - Đến ngày, Khâu, Mức độ, Mã bài), Bảng nhật ký phân trang.
- **[routes/index.tsx](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/routes/index.tsx)** & **[menu.config.ts](file:///c:/Users/phucminh/Documents/GitHub/inkwell-sys/src/config/menu.config.ts)**:
  - Khai báo routes & thêm 2 mục menu con "Cấu hình giờ sản xuất" và "Báo cáo trễ tiến độ" dưới nhóm "Sản xuất".

---

## 2. Kiểm tra & Xác minh

- **TypeScript Compilation Check**:
  ```bash
  npx tsc --noEmit
  ```
  -> **Exit Code 0** (Không có bất kỳ lỗi TypeScript nào).
