import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, Filter, RefreshCw, Loader2, Users } from "lucide-react";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendor";
import { vendorTypeLabels } from "@/lib/status-utils";
import { SortControls, type SortOrder } from "@/components/ui/sort-controls";

export default function VendorListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { data, isLoading } = useVendors({
    pageNumber: page,
    pageSize,
    search: search || "",
    vendorType: vendorTypeFilter || "",
    ...(sortColumn.trim()
      ? { sortColumn: sortColumn.trim(), sortOrder: sortOrder }
      : {}),
  });

  const { mutate: deleteVendor } = useDeleteVendor();

  const vendors = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      deleteVendor(id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý nhà cung cấp</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách nhà cung cấp Chất liệu
          </p>
        </div>
        <Button onClick={() => navigate("/vendors/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhà cung cấp
        </Button>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60 py-3 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-[#93631F]" />
            <CardTitle className="text-sm font-semibold text-slate-700">
              Bộ lọc & Tìm kiếm
            </CardTitle>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0 w-full">
              <Input
                placeholder="Tìm kiếm nhà cung cấp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full lg:max-w-sm h-10 sm:h-9 text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
              <Select
                value={vendorTypeFilter || "all"}
                onValueChange={(v) => setVendorTypeFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9 text-sm">
                <SelectValue placeholder="Loại nhà cung cấp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(vendorTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-full lg:w-[420px] min-w-0">
              <SortControls
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onSortColumnChange={(v) => {
                  setSortColumn(v);
                  setPage(1);
                }}
                onSortOrderChange={(v) => {
                  setSortOrder(v);
                  setPage(1);
                }}
                onClear={() => {
                  setSortColumn("");
                  setSortOrder("asc");
                  setPage(1);
                }}
                options={[
                  { value: "name", label: "Tên nhà cung cấp" },
                  { value: "vendorType", label: "Loại" },
                  { value: "isActive", label: "Trạng thái" },
                ]}
                placeholder="Sắp xếp theo"
              />
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#93631F]" />
              <span className="ml-3 text-slate-500">Đang tải...</span>
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">Không có nhà cung cấp nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#93631F]/5 border-b border-slate-200/60">
                      <TableHead className="font-semibold text-slate-700">Tên nhà cung cấp</TableHead>
                      <TableHead className="font-semibold text-slate-700">Loại</TableHead>
                      <TableHead className="font-semibold text-slate-700">Điện thoại</TableHead>
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Địa chỉ</TableHead>
                      <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow 
                      key={vendor.id}
                      className="group hover:bg-[#93631F]/5 transition-colors border-b border-slate-100"
                    >
                      <TableCell className="font-medium text-sm">
                        {vendor.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {vendor.vendorType
                          ? vendorTypeLabels[vendor.vendorType] ||
                            vendor.vendorType
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{vendor.phone || "—"}</TableCell>
                      <TableCell className="text-sm text-slate-600">{vendor.email || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-slate-600">
                        {vendor.address || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={vendor.isActive ? "default" : "secondary"}
                          className={vendor.isActive ? "bg-green-100 text-green-700 border-green-200" : ""}
                        >
                          {vendor.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/vendors/${vendor.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/vendors/${vendor.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(vendor.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
