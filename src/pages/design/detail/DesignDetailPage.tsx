import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Package, Ruler, FileText, Download, Calendar, DollarSign } from "lucide-react"
import { useDesign } from "@/hooks"

export default function DesignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: design, isLoading: loading } = useDesign(Number(id))



  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      received_info: { label: "Đã nhận thông tin", variant: "default" },
      designing: { label: "Đang thiết kế", variant: "secondary" },
      completed: { label: "Hoàn thành", variant: "outline" },
    }
    const config = statusMap[status] || { label: status, variant: "default" }
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    )
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

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy thiết kế</p>
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
          <Button variant="outline" size="icon" onClick={() => navigate("/designs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{design.code}</h1>
            <p className="text-muted-foreground mt-1">
              Đơn hàng #{design.orderId} • Thiết kế ID: {design.id}
            </p>
          </div>
          {getStatusBadge(design.designStatus)}
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Thông tin chung</TabsTrigger>
            <TabsTrigger value="specs">Thông số kỹ thuật</TabsTrigger>
            <TabsTrigger value="pricing">Giá & Thanh toán</TabsTrigger>
            <TabsTrigger value="files">Tệp đính kèm</TabsTrigger>
          </TabsList>

          {/* General Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin thiết kế viên
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{design.designer.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{design.designer.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{design.designer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Điện thoại</p>
                  <p className="font-medium">{design.designer.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Loại thiết kế & Chất liệu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Loại thiết kế</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Tên loại</p>
                      <p className="font-medium">{design.designType.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mã loại</p>
                      <p className="font-medium">{design.designType.code}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Chất liệu</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Tên chất liệu</p>
                      <p className="font-medium">{design.materialType.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mã chất liệu</p>
                      <p className="font-medium">{design.materialType.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Giá chất liệu</p>
                      <p className="font-medium">{design.materialType.price.toLocaleString("vi-VN")} VNĐ</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Giá/cm²</p>
                      <p className="font-medium">{design.materialType.pricePerCm2.toLocaleString("vi-VN")} VNĐ</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Yêu cầu & Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Yêu cầu thiết kế</p>
                  <p className="text-sm bg-muted p-4 rounded-lg">{design.requirements || "Không có yêu cầu"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ghi chú thêm</p>
                  <p className="text-sm bg-muted p-4 rounded-lg">{design.additionalNotes || "Không có ghi chú"}</p>
                </div>
                {design.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Ghi chú nội bộ</p>
                    <p className="text-sm bg-muted p-4 rounded-lg">{design.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specs Tab */}
          <TabsContent value="specs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Thông số kỹ thuật
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Kích thước</p>
                  <p className="text-2xl font-bold">{design.dimensions}</p>
                </div>
                {design.width && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chiều rộng</p>
                    <p className="text-2xl font-bold">{design.width} cm</p>
                  </div>
                )}
                {design.height && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chiều cao</p>
                    <p className="text-2xl font-bold">{design.height} cm</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="text-2xl font-bold">{design.quantity.toLocaleString()}</p>
                </div>
                {design.areaCm2 && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Diện tích</p>
                    <p className="text-2xl font-bold">
                      {design.areaCm2.toLocaleString("vi-VN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      cm²
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Thông tin giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn giá</p>
                    <p className="text-2xl font-bold">
                      {design.unitPrice ? `${design.unitPrice.toLocaleString("vi-VN")} VNĐ` : "Chưa có"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng giá</p>
                    <p className="text-2xl font-bold">
                      {design.totalPrice ? `${design.totalPrice.toLocaleString("vi-VN")} VNĐ` : "Chưa có"}
                    </p>
                  </div>
                </div>

                {design.totalPrice && design.unitPrice && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Giá mỗi đơn vị:</span>
                      <span className="text-lg font-semibold">
                        {(design.totalPrice / design.quantity).toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Tệp đính kèm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {design.designFileUrl ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">File thiết kế</p>
                        <p className="text-sm text-muted-foreground">{design.designFileUrl}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={design.designFileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Chưa có file thiết kế</p>
                )}

                {design.excelFileUrl && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">File Excel</p>
                        <p className="text-sm text-muted-foreground">{design.excelFileUrl}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={design.excelFileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <p className="font-medium">{new Date(design.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="font-medium">{new Date(design.updatedAt).toLocaleString("vi-VN")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => navigate(`/orders/${design.orderId}`)}
              >
                Xem đơn hàng
              </Button>
              <Button className="flex-1">Chỉnh sửa thiết kế</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
