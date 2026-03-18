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
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-balance">Quản lý Sản xuất</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi và quản lý tiến độ sản xuất
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={onCreateClick}>
            <Plus className="h-3.5 w-3.5" />
            Tạo đơn sản xuất
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-3 shrink-0">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-2 px-3">
            <CardTitle className="text-[13px] font-bold uppercase text-foreground/80">Tổng đơn</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-1">
            <div className="text-base font-bold">{stats?.total}</div>
            <p className="text-[10px] text-muted-foreground">
              Tất cả đơn sản xuất
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-2 px-3">
            <CardTitle className="text-[13px] font-bold uppercase text-foreground/80">
              Chờ sản xuất
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-1">
            <div className="text-base font-bold">{stats?.pending || 0}</div>
            <p className="text-[10px] text-muted-foreground">Chưa bắt đầu</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-2 px-3">
            <CardTitle className="text-[13px] font-bold uppercase text-foreground/80">
              Đang sản xuất
            </CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-1">
            <div className="text-base font-bold">{stats.inProgress}</div>
            <p className="text-[10px] text-muted-foreground">Đang thực hiện</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 pt-2 px-3">
            <CardTitle className="text-[13px] font-bold uppercase text-foreground/80">
              Hoàn thành
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-1">
            <div className="text-base font-bold">{stats.completed}</div>
            <p className="text-[10px] text-muted-foreground">Đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
