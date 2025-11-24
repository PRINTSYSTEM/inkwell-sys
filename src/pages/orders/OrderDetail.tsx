import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Package, DollarSign, MapPin, Calendar, FileText, Download } from "lucide-react"
import { useOrder } from "@/hooks/use-order"

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {data: order, isLoading: loading, refetch} = useOrder(id ? parseInt(id) : null)

  

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Chờ xử lý", variant: "secondary" },
      processing: { label: "Đang xử lý", variant: "default" },
      completed: { label: "Hoàn thành", variant: "outline" },
      cancelled: { label: "Đã hủy", variant: "destructive" },
    }
    const config = statusMap[status] || { label: status, variant: "default" }
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    )
  }

  const getDebtStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      good: { label: "Tốt", variant: "outline" },
      warning: { label: "Cảnh báo", variant: "secondary" },
      bad: { label: "Xấu", variant: "destructive" },
    }
    const config = statusMap[status] || { label: status, variant: "default" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy đơn hàng</p>
            <Button onClick={() => navigate("/designs")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{order.code}</h1>
            <p className="text-muted-foreground mt-1">Đơn hàng ID: {order.id}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="customer">Khách hàng</TabsTrigger>
            <TabsTrigger value="designs">Thiết kế</TabsTrigger>
            <TabsTrigger value="payment">Thanh toán</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Người tạo đơn
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{order.creator.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{order.creator.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Điện thoại</p>
                    <p className="font-medium">{order.creator.phone}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Người phụ trách
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{order.assignedUser.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{order.assignedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Điện thoại</p>
                    <p className="font-medium">{order.assignedUser.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Thông tin giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày giao hàng dự kiến</p>
                  <p className="font-medium">
                    {new Date(order.deliveryDate).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {order.note && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ghi chú
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted p-4 rounded-lg">{order.note}</p>
                </CardContent>
              </Card>
            )}

            {order.excelFileUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File đính kèm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">File Excel đơn hàng</p>
                        <p className="text-sm text-muted-foreground">{order.excelFileUrl}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={order.excelFileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thời gian
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="font-medium">{new Date(order.updatedAt).toLocaleString("vi-VN")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Tab */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Mã khách hàng</p>
                    <p className="font-medium">{order.customer.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                    <p className="font-medium">{order.customer.name}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Tên công ty</p>
                    <p className="font-medium">{order.customer.companyName}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Thông tin công nợ
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Trạng thái công nợ</p>
                      <div className="mt-1">{getDebtStatusBadge(order.customer.debtStatus)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Công nợ hiện tại</p>
                      <p className="text-lg font-bold text-red-600">
                        {order.customer.currentDebt.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hạn mức công nợ</p>
                      <p className="text-lg font-bold">{order.customer.maxDebt.toLocaleString("vi-VN")} VNĐ</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Công nợ còn lại có thể sử dụng</span>
                      <span className="font-bold text-green-600">
                        {(order.customer.maxDebt - order.customer.currentDebt).toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Designs Tab */}
          <TabsContent value="designs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Danh sách thiết kế ({order.designs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.designs.map((design) => (
                    <div
                      key={design.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/design/detail/${design.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{design.code}</h4>
                          <p className="text-sm text-muted-foreground">{design.designType.name}</p>
                        </div>
                        <Badge variant="secondary">{design.designStatus}</Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Chất liệu</p>
                          <p className="font-medium">{design.materialType.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Số lượng</p>
                          <p className="font-medium">{design.quantity.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Kích thước</p>
                          <p className="font-medium">{design.dimensions}</p>
                        </div>
                      </div>

                      {design.totalPrice && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tổng giá</span>
                            <span className="text-lg font-bold">{design.totalPrice.toLocaleString("vi-VN")} VNĐ</span>
                          </div>
                        </div>
                      )}

                      <Button variant="outline" className="w-full mt-3 bg-transparent">
                        Xem chi tiết thiết kế
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Tổng giá trị đơn hàng</p>
                    <p className="text-3xl font-bold">{order.totalAmount.toLocaleString("vi-VN")} VNĐ</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Số tiền đã cọc</p>
                    <p className="text-3xl font-bold text-green-600">
                      {order.depositAmount.toLocaleString("vi-VN")} VNĐ
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Số tiền còn lại</span>
                    <span className="text-3xl font-bold text-primary">
                      {(order.totalAmount - order.depositAmount).toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="p-4 border rounded-lg">
                    <p className="text-muted-foreground mb-1">Tỷ lệ đã thanh toán</p>
                    <p className="text-2xl font-bold">
                      {((order.depositAmount / order.totalAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-muted-foreground mb-1">Tỷ lệ còn lại</p>
                    <p className="text-2xl font-bold">
                      {(((order.totalAmount - order.depositAmount) / order.totalAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
