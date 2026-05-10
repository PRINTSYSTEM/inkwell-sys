import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import type { VendorResponse } from "@/Schema";

interface VendorDebtTabProps {
  vendor: VendorResponse;
}

export function VendorDebtTab({ vendor }: VendorDebtTabProps) {
  const currentDebt = vendor.currentDebt ?? 0;

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Tổng quan công nợ</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-primary/5">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Công nợ hiện tại
              </p>
              <CreditCard className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1">
              <h3 className={`text-lg font-bold ${currentDebt > 0 ? "text-red-600" : "text-green-600"}`}>
                {currentDebt.toLocaleString("vi-VN")} ₫
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 bg-card border rounded-lg p-8 flex flex-col items-center justify-center shadow-sm text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground text-lg">Biểu đồ & Thống kê công nợ</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Tính năng phân tích tuổi nợ và đối soát công nợ chi tiết sẽ được cập nhật trong phiên bản tiếp theo. Bạn có thể xem chi tiết từng lần phát sinh bên tab <strong>Lịch sử giao dịch</strong>.
        </p>
      </div>
    </div>
  );
}
