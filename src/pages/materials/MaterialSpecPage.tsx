import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Scale,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useMaterialSpecs,
  useCreateMaterialSpec,
  useUpdateMaterialSpec,
  useDeleteMaterialSpec,
} from "@/hooks/use-material-spec";
import { useMaterialTypeList } from "@/hooks/use-material-type";
import { toast } from "sonner";
import type { MaterialSpecResponse } from "@/Schema";

export default function MaterialSpecPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState<string>("");

  // Fetch material types for dropdown
  const { data: materialTypesData, isLoading: isLoadingTypes } = useMaterialTypeList({
    pageSize: 100,
    pageNumber: 1,
  });

  // Material types list
  const materialTypes = materialTypesData?.items || [];

  // Automatically select first material type if none selected
  useEffect(() => {
    if (!selectedMaterialTypeId && materialTypes.length > 0) {
      setSelectedMaterialTypeId(materialTypes[0].id.toString());
    }
  }, [materialTypes, selectedMaterialTypeId]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpec, setCurrentSpec] = useState<MaterialSpecResponse | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [materialTypeId, setMaterialTypeId] = useState<string>("");
  const [basisWeight, setBasisWeight] = useState("");
  const [defaultLength, setDefaultLength] = useState("");
  const [defaultWidth, setDefaultWidth] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("gsm");
  const [isActive, setIsActive] = useState(true);

  // Fetch specs
  const {
    data: specsData,
    isLoading: isLoadingSpecs,
    isError,
    error,
    refetch,
  } = useMaterialSpecs(
    selectedMaterialTypeId ? Number(selectedMaterialTypeId) : null,
    {
      pageNumber: currentPage,
      pageSize: itemsPerPage,
      q: searchQuery || undefined,
    }
  );

  // Mutations
  const createMutation = useCreateMaterialSpec();
  const updateMutation = useUpdateMaterialSpec();
  const deleteMutation = useDeleteMaterialSpec();

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentSpec(null);
    setName("");
    setMaterialTypeId("");
    setBasisWeight("");
    setDefaultLength("");
    setDefaultWidth("");
    setDefaultUnit("gsm");
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (spec: MaterialSpecResponse) => {
    setIsEditing(true);
    setCurrentSpec(spec);
    setName(spec.name || "");
    setMaterialTypeId(spec.materialTypeId?.toString() || "");
    setBasisWeight(spec.basisWeight?.toString() || "");
    setDefaultLength(spec.defaultLength?.toString() || "");
    setDefaultWidth(spec.defaultWidth?.toString() || "");
    setDefaultUnit(spec.defaultUnit || "gsm");
    setIsActive(spec.isActive ?? true);
    setIsOpen(true);
  };

  const handleDelete = async (spec: MaterialSpecResponse) => {
    if (!spec.id || !spec.materialTypeId) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa cấu hình định lượng "${spec.name}"?`)) {
      deleteMutation.mutate({
        materialTypeId: spec.materialTypeId,
        id: spec.id
      }, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên cấu hình");
      return;
    }
    if (!materialTypeId) {
      toast.error("Vui lòng chọn loại chất liệu");
      return;
    }
    if (!basisWeight || isNaN(Number(basisWeight))) {
      toast.error("Vui lòng nhập định lượng hợp lệ (số)");
      return;
    }

    const payload = {
      name: name.trim(),
      materialTypeId: Number(materialTypeId),
      basisWeight: Number(basisWeight),
      defaultLength: defaultLength ? Number(defaultLength) : null,
      defaultWidth: defaultWidth ? Number(defaultWidth) : null,
      defaultUnit: defaultUnit.trim() || null,
      isActive,
    };

    if (isEditing && currentSpec?.id) {
      updateMutation.mutate(
        {
          materialTypeId: Number(materialTypeId),
          id: currentSpec.id,
          data: payload,
        },
        {
          onSuccess: () => {
            setIsOpen(false);
            refetch();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          materialTypeId: Number(materialTypeId),
          data: payload,
        },
        {
          onSuccess: () => {
            setIsOpen(false);
            refetch();
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Helmet>
        <title>Quản lý Định lượng Vật tư | Print Production ERP</title>
      </Helmet>

      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Cấu hình Định lượng Giấy & Vật tư
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý định lượng (basis weight/gsm) và kích thước mặc định cho từng loại chất liệu giấy, màng...
            </p>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Thêm định lượng
          </Button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 border rounded-xl">
          <div className="flex flex-col md:flex-row gap-2 flex-1 w-full md:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm cấu hình định lượng..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 bg-background"
              />
            </div>
            
            <div className="w-full md:w-[220px]">
              <Select
                value={selectedMaterialTypeId}
                onValueChange={(val) => {
                  setSelectedMaterialTypeId(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Chọn chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTypes ? (
                    <SelectItem value="loading" disabled>Đang tải chất liệu...</SelectItem>
                  ) : materialTypes.length === 0 ? (
                    <SelectItem value="none" disabled>Không có chất liệu nào</SelectItem>
                  ) : (
                    materialTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} {(type as any).isSystem ? "(Hệ thống)" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 bg-background"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Vui lòng thử lại sau."}
            </AlertDescription>
          </Alert>
        )}

        {/* Table Container */}
        <div className="flex-1 bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Tên cấu hình</TableHead>
                  <TableHead>Loại chất liệu</TableHead>
                  <TableHead className="text-right">Định lượng</TableHead>
                  <TableHead className="text-center">Kích thước mặc định</TableHead>
                  <TableHead className="text-center">Đơn vị</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center w-[120px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSpecs ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !specsData?.items || specsData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Calendar className="h-8 w-8 mb-2 opacity-20" />
                        <p>Không có dữ liệu định lượng vật tư</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  specsData.items.map((spec) => (
                    <TableRow key={spec.id} className="hover:bg-muted/10">
                      <TableCell className="font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span>{spec.name || "—"}</span>
                          {spec.isDefault && (
                            <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-50 text-[10px] scale-90 shrink-0">
                              Mặc định
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {spec.materialTypeName || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {spec.basisWeight !== undefined ? `${spec.basisWeight} ${spec.defaultUnit || "gsm"}` : "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {spec.defaultLength && spec.defaultWidth
                          ? `${spec.defaultLength} x ${spec.defaultWidth}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 border rounded-full bg-slate-50 dark:bg-slate-900">
                          {spec.defaultUnit || "gsm"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {spec.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">
                            Tạm ngưng
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary hover:bg-primary/5"
                            onClick={() => handleOpenEdit(spec)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                             variant="ghost"
                             size="icon"
                             className="h-7 w-7 text-destructive hover:bg-destructive/5"
                             onClick={() => handleDelete(spec)}
                             disabled={deleteMutation.isPending}
                           >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Container */}
          {specsData && specsData.totalPages > 1 && (
            <div className="px-4 py-3 border-t bg-muted/5 flex items-center justify-between shrink-0">
              <p className="text-xs text-muted-foreground">
                Hiển thị {specsData.items?.length || 0} / {specsData.total} dòng
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoadingSpecs}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium bg-background border px-3 py-1.5 rounded-md min-w-[80px] text-center">
                  Trang {currentPage} / {specsData.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setCurrentPage((p) => Math.min(specsData.totalPages, p + 1))}
                  disabled={currentPage === specsData.totalPages || isLoadingSpecs}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Add/Edit */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                {isEditing ? "Chỉnh sửa cấu hình định lượng" : "Thêm cấu hình định lượng"}
              </DialogTitle>
              <DialogDescription>
                Nhập thông số cho cấu hình định lượng vật tư sản xuất.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="spec-name">Tên cấu hình *</Label>
                <Input
                  id="spec-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Couche 150gsm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="material-type">Loại chất liệu *</Label>
                  <Select
                    value={materialTypeId}
                    onValueChange={setMaterialTypeId}
                  >
                    <SelectTrigger id="material-type" className="bg-background">
                      <SelectValue placeholder={isLoadingTypes ? "Đang tải..." : "Chọn chất liệu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="basis-weight">Định lượng (Basis Weight) *</Label>
                  <Input
                    id="basis-weight"
                    type="number"
                    value={basisWeight}
                    onChange={(e) => setBasisWeight(e.target.value)}
                    placeholder="VD: 150"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="length">Chiều dài mặc định</Label>
                  <Input
                    id="length"
                    type="number"
                    value={defaultLength}
                    onChange={(e) => setDefaultLength(e.target.value)}
                    placeholder="VD: 790"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="width">Chiều rộng mặc định</Label>
                  <Input
                    id="width"
                    type="number"
                    value={defaultWidth}
                    onChange={(e) => setDefaultWidth(e.target.value)}
                    placeholder="VD: 1090"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="unit">Đơn vị mặc định</Label>
                  <Input
                    id="unit"
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    placeholder="VD: gsm"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                  <div className="space-y-0.5">
                    <Label htmlFor="spec-active" className="cursor-pointer font-semibold text-sm">
                      Kích hoạt hoạt động
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cho phép sử dụng cấu hình định lượng này khi tạo đơn hàng mới.
                    </p>
                  </div>
                  <Switch
                    id="spec-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xử lý
                    </>
                  ) : isEditing ? (
                    "Cập nhật"
                  ) : (
                    "Lưu cấu hình"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
