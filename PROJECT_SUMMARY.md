# Tổng quan Dự án Inkwell-Sys (Hệ thống Quản lý Ngành In)

Dựa trên việc đọc và phân tích cấu trúc mã nguồn, đây là một hệ thống **ERP (Enterprise Resource Planning)** chuyên biệt cho ngành in ấn. Hệ thống quản lý toàn bộ quy trình sản xuất kinh doanh từ lúc nhận đơn hàng, thiết kế, chế bản, sản xuất, kho bãi cho đến kế toán và báo cáo.

## 1. Công nghệ sử dụng (Tech Stack)

*   **Frontend Core**: React 18, TypeScript 5, Vite 5.
*   **UI Framework**: Tailwind CSS + ShadcnUI (dựa trên Radix UI).
*   **Quản lý trạng thái & Data Fetching**: TanStack Query v5 (React Query) - sử dụng rất triệt để cho toàn bộ API.
*   **Quản lý Form**: React Hook Form kết hợp với Zod để validate dữ liệu.
*   **HTTP Client**: Axios.
*   **Xử lý thời gian**: date-fns.
*   **Biểu đồ & Báo cáo**: Recharts.
*   **Xuất bản tài liệu**: jsPDF, jsPDF-AutoTable.
*   **Giao tiếp thời gian thực**: SignalR (Dùng cho thông báo và cập nhật trạng thái).
*   **Công cụ dev**: openapi-zod-client (tự động đồng bộ schema từ Swagger).

## 2. Các Phân hệ chính (Core Modules)

Hệ thống được thiết kế theo dạng module hóa cao (Domain-Driven):

### A. Quản lý Đơn hàng & Khách hàng (CRM & Order Management)
*   **Khách hàng (Customers)**: Quản lý thông tin khách hàng, lịch sử đơn hàng, thống kê nợ.
*   **Đơn hàng (Orders)**: Tiếp nhận đơn hàng mới, tính toán chi phí, theo dõi tiến độ đơn hàng.

### B. Phân hệ Thiết kế & Chế bản (Design & Prepress/Proofing)
*   **Thiết kế (Designs)**: Quản lý file thiết kế, phân loại loại hình thiết kế, giao việc cho designer.
*   **Chế bản (Proofing/Prepress)**: Chuẩn bị khuôn (Dies) và kẽm (Plates). Có tích hợp quản lý việc xuất/nhập khuôn và kẽm.
*   **Khuôn (Dies)**: Quản lý danh sách khuôn, hình ảnh khuôn, lịch sử sử dụng khuôn cho các đơn hàng.

### C. Quản lý Sản xuất (Production)
*   Theo dõi các bước sản xuất (Production steps).
*   Giao việc cho nhân viên sản xuất.
*   Cập nhật trạng thái sản xuất từ lúc bắt đầu cho đến khi hoàn thành.

### D. Quản lý Kho & Vật tư (Inventory & Stock)
*   **Vật tư (Materials)**: Quản lý danh mục vật tư, nguyên liệu ngành in.
*   **Nhập kho (Stock-in)**: Từ nhà cung cấp, từ sản xuất hoàn thành, hoặc hàng trả về.
*   **Xuất kho (Stock-out)**: Xuất cho sản xuất, xuất đi giao hàng.
*   **Báo cáo kho**: Tồn kho hiện tại, hàng chậm luân chuyển, thẻ kho.

### E. Quản lý Kế toán & Công nợ (Accounting & Debt)
*   **Hóa đơn (Invoices)**: Xuất hóa đơn, quản lý hóa đơn điện tử (E-invoice).
*   **Phiếu thu/chi (Cash Management)**: Quản lý quỹ tiền mặt, lập phiếu thu, phiếu chi, duyệt phiếu.
*   **Ngân hàng (Bank Management)**: Quản lý tài khoản ngân hàng và sổ phụ.
*   **Công nợ (AR/AP)**:
    *   **AR (Accounts Receivable)**: Phải thu khách hàng, phân tích tuổi nợ.
    *   **AP (Accounts Payable)**: Phải trả nhà cung cấp.
    *   **Đối chiếu công nợ**: Xuất văn bản đối chiếu công nợ.

### F. Báo cáo (Reporting)
*   Báo cáo doanh số (theo kỳ, khách hàng).
*   Báo cáo chi phí (theo hạng mục, nhà cung cấp).
*   Báo cáo KPI nhân viên.

## 3. Quy trình nghiệp vụ tiêu biểu

1.  **Nhận đơn**: Tạo đơn hàng -> Khách hàng duyệt -> Chuyển thiết kế.
2.  **Thiết kế**: Designer cập nhật file -> Duyệt thiết kế -> Chuyển sang Chế bản.
3.  **Chế bản**: Xuất kẽm/khuôn -> Lưu thông số kỹ thuật -> Chuyển Sản xuất.
4.  **Sản xuất**: Thực hiện các công đoạn in, cán màng, bế, dán... -> Nhập kho thành phẩm.
5.  **Giao hàng**: Tạo phiếu giao hàng (Delivery Note) -> Xuất kho thành phẩm -> Khách hàng ký nhận.
6.  **Kế toán**: Xuất hóa đơn -> Ghi nhận công nợ -> Lập phiếu thu khi khách thanh toán.

## 4. Cấu trúc Thư mục (Project structure)

*   `src/apis`: Chứa các định nghĩa endpoint và logic gọi API (sử dụng axios).
*   `src/components`: Các component dùng chung (layout, ui, filters...).
*   `src/hooks`: Custom hooks xử lý logic nghiệp vụ và kết nối với React Query.
*   `src/pages`: Các màn hình chính của ứng dụng, chia theo module (accounting, production, inventory...).
*   `src/Schema`: Định nghĩa kiểu dữ liệu Zod cho validation và TypeScript types.
*   `src/providers`: Các Context Provider (Auth, Notification, Theme).
*   `src/routes`: Quản lý routing của ứng dụng.

## 5. Đánh giá về dự án

*   **Độ phức tạp**: Đây là một hệ thống rất lớn và chi tiết về mặt nghiệp vụ. Việc quản lý khuôn (Dies) và kẽm (Plates) cho thấy dự án hướng tới sự chính xác rất cao trong quy trình sản xuất.
*   **Kiến trúc**: Sử dụng kiến trúc hiện đại, tách biệt rõ ràng giữa UI và Logic (thông qua hooks và services). Codebase sạch sẽ, sử dụng nhiều lazy loading để tối ưu hiệu năng.
*   **Tính mở rộng**: Với việc sử dụng React Query và cấu trúc router tập trung, hệ thống dễ dàng mở rộng thêm các phân hệ mới nếu cần.

---
*Tài liệu này được tổng hợp bởi Antigravity dựa trên cấu trúc mã nguồn hiện tại.*
