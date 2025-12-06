import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, User, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

import {
  orderStatusLabels,
  customerTypeLabels,
  formatCurrency,
  formatDate,
} from "@/lib/status-utils";

import type { OrderListParams, UserRole } from "@/Schema";
import { useAuth } from "@/hooks";
import { useOrdersByRole } from "@/hooks/use-order";
import { ROLE } from "@/constants";

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();

  const role = user?.role as UserRole;

  // build params cho API
  const listParams: OrderListParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: 50,
      status: statusFilter === "all" ? "" : statusFilter,
      search: searchTerm.trim() || "",
    }),
    [searchTerm, statusFilter]
  );

  // chỉ 1 hook duy nhất, bên trong tự chọn endpoint theo role
  const { data, isLoading, isError, error } = useOrdersByRole(role, listParams);
  console.log(data);

  const orders = data?.items ?? [];

  const totalOrders = data?.totalCount ?? orders.length;

  // quyền tạo đơn:
  // - accounting: KHÔNG được tạo
  // - còn lại (admin, design, ...) được tạo
  const isAccounting = role === ROLE.ACCOUNTING;
  const canCreateOrder = !isAccounting;
  const canViewPrice = role !== ROLE.DESIGN && role !== ROLE.DESIGN_LEAD;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-balance mb-2">
              Quản lý đơn hàng
            </h1>
            <p className="text-muted-foreground">
              Theo dõi và quản lý quy trình đơn hàng từ thiết kế đến sản xuất
            </p>
          </div>

          {canCreateOrder && (
            <Link to="/orders/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Tạo đơn mới
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn hoặc khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table / states */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Thiết kế
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Ngày giao
                  </th>
                  {canViewPrice && (
                    <>
                      {" "}
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        Còn lại
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Loading */}
                {isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Đang tải danh sách đơn hàng...
                    </td>
                  </tr>
                )}

                {/* Error */}
                {isError && !isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-red-600"
                    >
                      Lỗi khi tải đơn hàng:{" "}
                      {(error as any)?.message || "Vui lòng thử lại sau."}
                    </td>
                  </tr>
                )}

                {/* Data */}
                {!isLoading &&
                  !isError &&
                  orders.map((order) => {
                    const customerType = order.customer?.companyName
                      ? "company"
                      : "retail";

                    const remaining =
                      (order.totalAmount || 0) - (order.depositAmount || 0);

                    return (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {order.code}
                          </Link>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {customerType === "company" ? (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {order.customer?.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant="outline">
                            {customerTypeLabels[customerType]}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={order.status}
                            label={
                              orderStatusLabels[order.status || ""] || "N/A"
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="font-medium">
                            {order.designs?.length || 0}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-muted-foreground">
                          {order.deliveryDate
                            ? formatDate(order.deliveryDate)
                            : "-"}
                        </td>

                        {canViewPrice && (
                          <>
                            <td className="px-4 py-4 text-right font-semibold">
                              {formatCurrency(order.totalAmount || 0)}
                            </td>

                            <td className="px-4 py-4 text-right">
                              <span
                                className={
                                  remaining > 0
                                    ? "text-orange-600 font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {formatCurrency(remaining)}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="px-4 py-4 text-center">
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              Xem
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty */}
                {!isLoading && !isError && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-muted-foreground text-lg"
                    >
                      Không tìm thấy đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        {!isLoading && !isError && orders.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Hiển thị {orders.length} / {totalOrders} đơn hàng
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
