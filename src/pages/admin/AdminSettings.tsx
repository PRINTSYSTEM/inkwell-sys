export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground mt-1">Cấu hình và thiết lập hệ thống</p>
        </div>
      </div>

      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Trang cài đặt hệ thống</h3>
          <p className="text-muted-foreground">
            Chức năng cài đặt hệ thống sẽ được phát triển trong phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
}