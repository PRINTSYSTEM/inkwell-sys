import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
  Building2,
  Phone,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers, useExportDebtComparison } from "@/hooks/use-customer";
import { formatCurrency } from "@/lib/status-utils";

export default function AccountingDebtReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Fetch customers
  const { data: customersData, isLoading } = useCustomers({
    pageNumber,
    pageSize,
    search: searchTerm || "",
    debtStatus: filterStatus !== "all" ? filterStatus : "",
  });

  // Export debt comparison hook
  const { mutate: exportDebtComparison, loading: exporting } =
    useExportDebtComparison();

  const customers = customersData?.items ?? [];
  const totalCount = customersData?.total ?? 0;

  // Calculate stats
  const stats = {
    totalCustomers: totalCount,
    goodStatus: customers.filter((c) => c.debtStatus === "good").length,
    warningStatus: customers.filter((c) => c.debtStatus === "warning").length,
    blockedStatus: customers.filter((c) => c.debtStatus === "blocked").length,
    totalCurrentDebt: customers.reduce(
      (sum, c) => sum + (c.currentDebt ?? 0),
      0
    ),
    totalMaxDebt: customers.reduce((sum, c) => sum + (c.maxDebt ?? 0), 0),
  };

  const handleExportDebtComparison = async (customerId: number) => {
    setExportingId(customerId);
    try {
      await exportDebtComparison(customerId);
    } catch {
      // Error handled in hook
    } finally {
      setExportingId(null);
    }
  };

  const getDebtStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;

    const config: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" }
    > = {
      good: { label: "Tốt", variant: "default" },
      warning: { label: "Cảnh báo", variant: "secondary" },
      blocked: { label: "Bị chặn", variant: "destructive" },
    };

    const { label, variant } = config[status] ?? {
      label: status,
      variant: "default" as const,
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

  const getDebtRatioColor = (ratio: number) => {
    if (ratio > 100) return "text-red-600";
    if (ratio > 80) return "text-yellow-600";
    return "text-green-600";
  };

  const getDebtBarColor = (ratio: number) => {
    if (ratio > 100) return "bg-red-500";
    if (ratio > 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo Công nợ</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý công nợ khách hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng KH</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">khách hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tình trạng tốt
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.goodStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.goodStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần theo dõi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.warningStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.warningStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị chặn</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.blockedStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0
                ? Math.round((stats.blockedStatus / stats.totalCustomers) * 100)
                : 0}
              % khách hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tổng quan công nợ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Tổng công nợ hiện tại
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalCurrentDebt)}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Tổng hạn mức cho phép
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalMaxDebt)}
              </p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Tỷ lệ sử dụng</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalMaxDebt > 0
                  ? Math.round(
                      (stats.totalCurrentDebt / stats.totalMaxDebt) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Debt Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết công nợ khách hàng</CardTitle>
          <div className="flex gap-4 items-center mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={filterStatus === "warning" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("warning")}
              >
                Cảnh báo
              </Button>
              <Button
                variant={filterStatus === "blocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("blocked")}
              >
                Bị chặn
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Không có khách hàng nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Công nợ hiện tại</TableHead>
                      <TableHead>Hạn mức</TableHead>
                      <TableHead>Tỷ lệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const debtRatio =
                        customer.maxDebt && customer.maxDebt > 0
                          ? ((customer.currentDebt ?? 0) / customer.maxDebt) *
                            100
                          : 0;

                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {customer.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {customer.phone}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                (customer.currentDebt ?? 0) >
                                (customer.maxDebt ?? 0)
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {formatCurrency(customer.currentDebt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(customer.maxDebt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${getDebtRatioColor(
                                  debtRatio
                                )}`}
                              >
                                {Math.round(debtRatio)}%
                              </span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getDebtBarColor(
                                    debtRatio
                                  )}`}
                                  style={{
                                    width: `${Math.min(debtRatio, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getDebtStatusBadge(customer.debtStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleExportDebtComparison(customer.id!)
                              }
                              disabled={
                                exporting && exportingId === customer.id
                              }
                            >
                              {exporting && exportingId === customer.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {customers.length} / {totalCount} khách hàng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={customers.length < pageSize}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
