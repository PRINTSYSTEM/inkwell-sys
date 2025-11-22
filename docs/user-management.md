# Tính năng Quản lý Tài khoản Nhân sự (User Management)

## Mô tả
Tính năng này cho phép Admin quản lý tài khoản của tất cả nhân viên trong hệ thống, bao gồm tạo, xem, chỉnh sửa và xóa tài khoản.

## Đường dẫn truy cập
- URL: `/admin/users`
- Quyền truy cập: Chỉ dành cho Admin

## Các tính năng chính

### 1. Xem danh sách nhân viên
- Hiển thị bảng danh sách tất cả nhân viên
- Thông tin hiển thị: Tên, Username, Vai trò, Email, Điện thoại, Trạng thái, Ngày tạo
- Hỗ trợ phân trang (10 users/trang)

### 2. Tìm kiếm và lọc
- **Tìm kiếm**: Theo tên hoặc email
- **Lọc theo vai trò**: 
  - Tất cả vai trò
  - Quản trị viên (admin)
  - Quản lý (manager) 
  - Thiết kế (design)
  - Sản xuất (production)
  - Tiền ấn (prepress)
  - Kế toán (accounting)
  - Chăm sóc khách hàng (customer_service)
- **Lọc theo trạng thái**: Chỉ hiển thị tài khoản đang hoạt động

### 3. Tạo tài khoản mới
**Thông tin bắt buộc:**
- Tên đăng nhập (username)
- Mật khẩu (password)
- Họ và tên (fullName)
- Email
- Vai trò (role)

**Thông tin tùy chọn:**
- Số điện thoại (phone)

### 4. Quản lý tài khoản
- **Kích hoạt/Tạm khóa**: Thay đổi trạng thái hoạt động của tài khoản
- **Chỉnh sửa**: Cập nhật thông tin tài khoản (chưa implemented)
- **Xóa**: Xóa tài khoản vĩnh viễn (có confirm)

## API tích hợp

### Base URL
```
https://checkafe.online/api/users
```

### Endpoints

#### 1. Lấy danh sách users
```http
GET /api/users?pageNumber=1&pageSize=10
```

**Query Parameters:**
- `pageNumber`: Số trang (mặc định: 1)
- `pageSize`: Số items/trang (mặc định: 10)
- `search`: Từ khóa tìm kiếm
- `role`: Lọc theo vai trò
- `isActive`: Lọc theo trạng thái (true/false)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "username": "admin",
      "fullName": "Administrator",
      "role": "admin",
      "email": "admin@printsystem.com",
      "phone": "0123456789",
      "isActive": true,
      "createdAt": "2025-10-30T10:46:30.8526364",
      "updatedAt": "2025-10-30T10:46:30.8526933"
    }
  ],
  "totalCount": 5,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

#### 2. Tạo user mới
```http
POST /api/users
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "fullName": "string",
  "role": "design",
  "email": "user@example.com",
  "phone": "string"
}
```

#### 3. Cập nhật user
```http
PUT /api/users/{id}
```

#### 4. Xóa user
```http
DELETE /api/users/{id}
```

#### 5. Thay đổi trạng thái
```http
PUT /api/users/{id}/status
```

**Request Body:**
```json
{
  "isActive": true
}
```

## Vai trò (Roles)

| Giá trị | Tên hiển thị | Mô tả |
|---------|-------------|-------|
| admin | Quản trị viên | Toàn quyền hệ thống |
| manager | Quản lý | Quản lý đơn hàng và nhân viên |
| design | Thiết kế | Thiết kế sản phẩm |
| production | Sản xuất | Quản lý sản xuất |
| prepress | Tiền ấn | Chuẩn bị file in |
| accounting | Kế toán | Quản lý tài chính |
| customer_service | Chăm sóc khách hàng | Hỗ trợ khách hàng |

## File code

### Service
- `src/services/userApiService.ts`: API service tích hợp với backend

### Component  
- `src/pages/admin/UserManagementAPI.tsx`: Component chính
- `src/pages/admin/AdminDashboard.tsx`: Routing cho admin

### Routing
- Route: `/admin/users`
- Component: `UserManagementAPI`

## Ghi chú kỹ thuật

1. **Authentication**: Sử dụng Bearer token trong header
2. **Error Handling**: Toast notifications cho user feedback
3. **Loading States**: Spinner khi tải dữ liệu
4. **Validation**: Client-side validation cho form
5. **Responsive**: Tương thích mobile và desktop

## Cách sử dụng

1. Đăng nhập với tài khoản Admin
2. Vào menu "Admin" → "Quản lý nhân sự" 
3. Xem danh sách nhân viên hiện tại
4. Sử dụng tìm kiếm/lọc để tìm nhân viên cụ thể
5. Nhấn "Thêm nhân viên" để tạo tài khoản mới
6. Sử dụng menu actions (3 chấm) để quản lý từng tài khoản