export default function AdminPermissions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Phân quyền</h1>
          <p className="text-muted-foreground mt-1">Quản lý phân quyền và vai trò người dùng</p>
        </div>
      </div>

      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Trang phân quyền</h3>
          <p className="text-muted-foreground">
            Chức năng phân quyền chi tiết sẽ được phát triển trong phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
}