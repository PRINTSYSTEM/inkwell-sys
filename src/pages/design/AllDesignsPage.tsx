import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Eye, Package, Ruler, User } from "lucide-react"
import { useDesigns, useFilters } from "@/hooks"
import type { Design } from "@/Schema"

type DesignWithSearch = Design & {
  designerFullName: string
}

export default function AllDesignsPage() {
  const navigate = useNavigate()

  // gọi React Query lấy list
  const { data, isLoading } = useDesigns()
  const designs: Design[] = data?.items ?? [] // hoặc data?.data tùy API

  // hook filter
  const [filterState, filterActions] = useFilters({
    initialFilters: {},
    initialSearch: "",
    persistKey: "designs-list",
  })

  // map thêm field để search theo tên designer
  const designsWithSearch: DesignWithSearch[] = useMemo(
    () =>
      designs.map((d) => ({
        ...d,
        designerFullName: d.designer.fullName,
      })),
    [designs],
  )

  // áp dụng search + filters + sort
  const filteredDesigns = useMemo(
    () =>
      filterActions.applyFilters<DesignWithSearch>(designsWithSearch, {
        searchFields: ["code", "designerFullName"],
      }),
    [designsWithSearch, filterActions, filterState], // nhớ thêm filterState để không bị stale
  )

  // ====== mapping UI <-> filter state ======

  const handleSearchChange = (value: string) => {
    filterActions.setSearch(value)
  }

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      filterActions.removeFilter("designStatus")
    } else {
      filterActions.setFilter("designStatus", value, "eq")
    }
  }

  const handleTypeChange = (value: string) => {
    if (value === "all") {
      filterActions.removeFilter("designTypeId")
    } else {
      filterActions.setFilter("designTypeId", Number(value), "eq")
    }
  }

  // giá trị đang chọn cho Select (đọc từ filterState)
  const statusFilterValue =
    (filterState.filters["designStatus"]?.value as string | undefined) ?? "all"

  const typeFilterValue =
    (filterState.filters["designTypeId"]?.value as number | undefined)?.toString() ?? "all"

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Danh sách thiết kế</h1>
            <p className="text-muted-foreground mt-1">
              Tổng số: {filteredDesigns.length} thiết kế
              {filterState.activeFiltersCount > 0 && (
                <> · {filterState.activeFiltersCount} bộ lọc đang áp dụng</>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã hoặc thiết kế viên..."
                  value={filterState.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilterValue} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="received_info">Đã nhận thông tin</SelectItem>
                  <SelectItem value="designing">Đang thiết kế</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select value={typeFilterValue} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {Array.from(new Set(designs.map((d) => d.designTypeId))).map((typeId) => {
                    const type = designs.find((d) => d.designTypeId === typeId)?.designType
                    return type ? (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ) : null
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Designs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDesigns.map((design) => (
            <Card
              key={design.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/design/detail/${design.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{design.code}</CardTitle>
                    <p className="text-sm text-muted-foreground">Đơn hàng #{design.orderId}</p>
                  </div>
                  {getStatusBadge(design.designStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Thiết kế viên:</span>
                  <span className="font-medium">{design.designer.fullName}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Loại:</span>
                    <span className="font-medium">{design.designType.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Chất liệu:</span>
                    <span className="font-medium">{design.materialType.name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kích thước:</span>
                    <span className="font-medium">{design.dimensions}</span>
                  </div>
                  {design.width && design.height && (
                    <div className="text-sm text-muted-foreground">
                      {design.width} x {design.height} cm
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Số lượng:</span>
                    <span className="font-medium">{design.quantity.toLocaleString()}</span>
                  </div>
                </div>

                {design.areaCm2 && (
                  <div className="pt-2 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diện tích:</span>
                      <span className="font-medium">{design.areaCm2.toFixed(2)} cm²</span>
                    </div>
                  </div>
                )}

                <Button className="w-full bg-transparent" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDesigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">Không tìm thấy thiết kế nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
