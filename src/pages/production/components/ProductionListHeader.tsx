import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Clock, Factory, CheckCircle } from "lucide-react";

interface ProductionListHeaderProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  onCreateClick: () => void;
}

export function ProductionListHeader({
  stats,
  onCreateClick,
}: ProductionListHeaderProps) {
  return (
    <div className="relative border-2 border-red-500/50">
      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[9999] font-mono pointer-events-none rounded-bl">
        ProductionListHeader.tsx
      </div>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-balance">Quản lý Sản xuất</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi và quản lý tiến độ sản xuất
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2" onClick={onCreateClick}>
            <Plus className="h-4 w-4" />
            Tạo đơn sản xuất
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">Tổng đơn</CardTitle>
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-lg font-bold">{stats?.total}</div>
            <p className="text-[10px] text-muted-foreground">
              Tất cả đơn sản xuất
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">
              Chờ sản xuất
            </CardTitle>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-lg font-bold">{stats?.pending || 0}</div>
            <p className="text-[10px] text-muted-foreground">Chưa bắt đầu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">
              Đang sản xuất
            </CardTitle>
            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-lg font-bold">{stats.inProgress}</div>
            <p className="text-[10px] text-muted-foreground">Đang thực hiện</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-medium">
              Hoàn thành
            </CardTitle>
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-lg font-bold">{stats.completed}</div>
            <p className="text-[10px] text-muted-foreground">Đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
