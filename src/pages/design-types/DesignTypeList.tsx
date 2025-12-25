import { useState, lazy, Suspense } from "react";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMaterialsByDesignType } from "@/hooks";

const DesignTypeFormDialogLazy = lazy(() =>
  import("@/pages/design-types/design-type-form-dialog").then((m) => ({
    default: m.DesignTypeFormDialog,
  }))
);
const MaterialTypeDialogLazy = lazy(() =>
  import("@/pages/material-types/material-type-dialog").then((m) => ({
    default: m.MaterialTypeDialog,
  }))
);

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreateDesignTypeRequest,
  CreateMaterialTypeRequest,
  DesignTypeResponse,
  MaterialTypeResponse,
} from "@/Schema";
import {
  useCreateDesignType,
  useDesignTypes,
  useUpdateDesignType,
  useDeleteDesignType,
  useCreateMaterialType,
  useDeleteMaterialType,
  useUpdateMaterialType,
} from "@/hooks";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Kiểu generic cho response phân trang từ backend (updated to match swagger)
type PagedResponse<T> = {
  items: T[] | null;
  size: number;
  page: number;
  total: number;
  totalPages: number;
};

// Component to display average price per m² for a design type
function DesignTypeAvgPrice({ designTypeId }: { designTypeId?: number }) {
  const { data: materialsData } = useMaterialsByDesignType(
    designTypeId,
    undefined
  );

  const materials = Array.isArray(materialsData) ? materialsData : [];

  if (materials.length === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const activeMaterials = materials.filter((m) => m.status === "active");
  if (activeMaterials.length === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const avgPricePerCm2 =
    activeMaterials.reduce((sum, m) => sum + (m.pricePerCm2 || 0), 0) /
    activeMaterials.length;
  const avgPricePerM2 = avgPricePerCm2 * 10000;

  return (
    <span className="font-semibold text-primary">
      {avgPricePerM2.toLocaleString("vi-VN")}
      <span className="text-xs text-muted-foreground ml-1">đ</span>
    </span>
  );
}

export default function DesignTypesPage() {
  const queryClient = useQueryClient();

  // ====== Search & Pagination state ======
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10; // có thể cho user đổi về sau

  // ====== Queries ======
  // Giữ nguyên hook, chỉ truyền thêm params phân trang
  const {
    data: designTypesData,
    isLoading,
    isError,
  } = useDesignTypes({
    pageNumber,
    pageSize,
  });

  // Chuẩn hoá dữ liệu phân trang của designTypes
  const designTypesPaged: PagedResponse<DesignTypeResponse> = (() => {
    if (!designTypesData) {
      return {
        items: [],
        size: 10,
        page: 1,
        total: 0,
        totalPages: 1,
      };
    }
    if (Array.isArray(designTypesData)) {
      return {
        items: designTypesData,
        size: designTypesData.length || 10,
        page: 1,
        total: designTypesData.length,
        totalPages: 1,
      };
    }
    // It's a paged response - use unknown first to satisfy TypeScript
    return designTypesData as unknown as PagedResponse<DesignTypeResponse>;
  })();

  const designTypes: DesignTypeResponse[] = designTypesPaged.items ?? [];

  // ====== Local UI state ======
  const [selectedDesignType, setSelectedDesignType] =
    useState<DesignTypeResponse | null>(null);

  const [isDesignTypeDialogOpen, setIsDesignTypeDialogOpen] = useState(false);
  const [editingDesignType, setEditingDesignType] =
    useState<DesignTypeResponse | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [designTypeToDelete, setDesignTypeToDelete] =
    useState<DesignTypeResponse | null>(null);

  // ====== Mutations ======
  const { mutate: createDesignTypeMutation } = useCreateDesignType();
  const { mutate: updateDesignTypeMutation } = useUpdateDesignType();
  const { mutate: deleteDesignTypeMutation } = useDeleteDesignType();

  const { mutate: createMaterialTypeMutation } = useCreateMaterialType();
  const { mutate: updateMaterialTypeMutation } = useUpdateMaterialType();
  const { mutate: deleteMaterialTypeMutation } = useDeleteMaterialType();

  // ====== Search (filter client-side trên page hiện tại) ======
  const filteredDesignTypes = designTypes.filter(
    (dt) =>
      dt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ====== DESIGN TYPE HANDLERS ======

  const handleCreateDesignType = (data: CreateDesignTypeRequest) => {
    createDesignTypeMutation(data, {
      onSuccess: () => {
        setIsDesignTypeDialogOpen(false);
        setEditingDesignType(null);
        // Có thể setPageNumber(1) nếu muốn luôn quay về trang đầu
      },
    });
  };

  const handleUpdateDesignType = (data: CreateDesignTypeRequest) => {
    if (!editingDesignType) return;

    // API PUT chỉ nhận name, displayOrder, description, status
    const { code, ...payload } = data;

    updateDesignTypeMutation(
      { id: Number(editingDesignType.id), data: payload },
      {
        onSuccess: () => {
          setEditingDesignType(null);
          setIsDesignTypeDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteDesignType = () => {
    if (!designTypeToDelete) return;

    deleteDesignTypeMutation(Number(designTypeToDelete.id), {
      onSuccess: () => {
        setDesignTypeToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  };

  // ====== MATERIAL HANDLERS (GIỮ API CŨ) ======

  const handleCreateMaterial = (material: CreateMaterialTypeRequest) => {
    // Prioritize: material.designTypeId -> selectedDesignType.id
    const designTypeId = material.designTypeId || selectedDesignType?.id || 0;

    const payload: CreateMaterialTypeRequest = {
      ...material,
      designTypeId: Number(designTypeId),
    };

    if (!payload.designTypeId) {
      toast.error("Lỗi", {
        description: "Thiếu designTypeId khi tạo chất liệu",
      });
      return;
    }

    createMaterialTypeMutation(payload, {
      onSuccess: () => {
        // Invalidate materials-by-design-type query to refresh the list
        queryClient.invalidateQueries({
          queryKey: ["materials-by-design-type", designTypeId],
        });
        toast.success("Thành công", {
          description: "Đã thêm chất liệu mới",
        });
      },
    });
  };

  const handleEditMaterial = (
    id: number,
    updates: Partial<MaterialTypeResponse>
  ) => {
    const {
      id: _ignoreId,
      createdAt,
      updatedAt,
      statusType,
      ...data
    } = updates as Record<string, unknown>;

    updateMaterialTypeMutation(
      {
        id,
        data,
      },
      {
        onSuccess: () => {
          // Invalidate materials-by-design-type query to refresh the list
          queryClient.invalidateQueries({
            queryKey: ["materials-by-design-type"],
          });
          toast.success("Thành công", {
            description: "Đã cập nhật chất liệu",
          });
        },
      }
    );
  };

  const handleDeleteMaterial = (id: number) => {
    deleteMaterialTypeMutation(id, {
      onSuccess: () => {
        // Invalidate materials-by-design-type query to refresh the list
        queryClient.invalidateQueries({
          queryKey: ["materials-by-design-type"],
        });
        toast.success("Thành công", {
          description: "Đã xóa chất liệu",
        });
      },
    });
  };

  // ====== Stats (dùng total từ backend nếu có) ======
  const stats = {
    total: designTypesPaged.total ?? designTypes.length,
    active: designTypes.filter((dt) => dt.status === "active").length, // trong trang hiện tại
    totalMaterials: 0, // Material types sẽ được fetch trong dialog khi cần
  };

  // ====== Pagination logic ======
  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > (designTypesPaged.totalPages || 1) ||
      nextPage === pageNumber
    ) {
      return;
    }
    setPageNumber(nextPage);
  };

  const startIndex =
    designTypes.length > 0
      ? (designTypesPaged.page - 1) * designTypesPaged.size + 1
      : 0;
  const endIndex =
    designTypes.length > 0 ? startIndex + designTypes.length - 1 : 0;
  const hasPreviousPage = designTypesPaged.page > 1;
  const hasNextPage = designTypesPaged.page < designTypesPaged.totalPages;

  // ====== Loading / Error ======
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <p>Đang tải loại thiết kế...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <p>Không thể tải dữ liệu loại thiết kế.</p>
      </div>
    );
  }

  // ====== UI ======
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý loại thiết kế & chất liệu
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý các loại thiết kế và chất liệu tương ứng trong hệ thống
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsDesignTypeDialogOpen(true)}
        >
          <Plus className="h-4 w-4" /> Thêm loại thiết kế
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Tổng loại thiết kế
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats.total}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.active} đang hoạt động (trong trang hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">
              Tổng chất liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {stats.totalMaterials}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Trên tất cả loại thiết kế (theo backend)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700">
              Trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {stats.total > 0
                ? Math.round(stats.totalMaterials / stats.total)
                : 0}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              chất liệu/loại thiết kế
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main table + pagination */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã loại thiết kế..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // có thể setPageNumber(1) nếu muốn reset về trang đầu khi search
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[180px] font-semibold text-slate-700">
                    Mã / Tên
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Thứ tự
                  </TableHead>

                  <TableHead className="font-semibold text-slate-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Người tạo
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesignTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <p className="text-sm text-slate-500">
                        Không tìm thấy loại thiết kế nào.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDesignTypes.map((designType) => (
                    <TableRow
                      key={designType.id}
                      className="hover:bg-blue-50/40"
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {designType.code}
                            </Badge>
                          </div>
                          <div className="font-medium text-slate-900">
                            {designType.name}
                          </div>
                          {designType.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {designType.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {designType.displayOrder}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            designType.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            designType.status === "active"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }
                        >
                          {designType.status === "active"
                            ? "Hoạt động"
                            : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {designType.createdBy.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            @{designType.createdBy.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDesignType(designType)}
                            className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            <Package className="h-4 w-4" />
                            <span className="text-xs">Chất liệu</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDesignType(designType);
                              setIsDesignTypeDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDesignTypeToDelete(designType);
                              setDeleteConfirmOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination UI */}
          <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
            <div>
              {stats.total > 0 ? (
                <span>
                  Hiển thị{" "}
                  <span className="font-semibold">
                    {startIndex}-{endIndex}
                  </span>{" "}
                  trên{" "}
                  <span className="font-semibold">
                    {designTypesPaged.total}
                  </span>{" "}
                  loại thiết kế
                </span>
              ) : (
                <span>Không có dữ liệu.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPreviousPage}
                onClick={() => handlePageChange(pageNumber - 1)}
              >
                Trước
              </Button>
              <span>
                Trang{" "}
                <span className="font-semibold">{designTypesPaged.page}</span> /{" "}
                {designTypesPaged.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => handlePageChange(pageNumber + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Loại thiết kế */}
      <Suspense fallback={<div>Đang tải...</div>}>
        <DesignTypeFormDialogLazy
          open={isDesignTypeDialogOpen}
          onOpenChange={(open) => {
            setIsDesignTypeDialogOpen(open);
            if (!open) setEditingDesignType(null);
          }}
          designType={editingDesignType}
          onSubmit={
            editingDesignType ? handleUpdateDesignType : handleCreateDesignType
          }
        />
      </Suspense>

      {/* Confirm xóa loại thiết kế */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa loại thiết kế</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại thiết kế{" "}
              <strong>{designTypeToDelete?.name}</strong>? Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDesignType}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog chất liệu */}
      {selectedDesignType && (
        <Suspense fallback={<div>Đang tải...</div>}>
          <MaterialTypeDialogLazy
            open={!!selectedDesignType}
            onOpenChange={(open) => !open && setSelectedDesignType(null)}
            designType={selectedDesignType}
            onCreateMaterial={handleCreateMaterial}
            onEditMaterial={handleEditMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        </Suspense>
      )}
    </div>
  );
}
