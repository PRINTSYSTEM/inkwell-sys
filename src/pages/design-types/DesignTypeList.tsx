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
import { TruncatedText } from "@/components/ui/truncated-text";

// Kiểu generic cho response phân trang từ backend (updated to match swagger)
type PagedResponse<T> = {
  items: T[] | null;
  size: number;
  page: number;
  total: number;
  totalPages: number;
};

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

  const { mutate: createMaterialTypeMutation, isPending: isCreatingMaterial } =
    useCreateMaterialType();
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

  // ====== MATERIAL HANDLERS ======

  const handleCreateMaterial = (material: CreateMaterialTypeRequest) => {
    // Ensure designTypeId is set from selectedDesignType
    if (!selectedDesignType?.id) {
      toast.error("Lỗi", {
        description: "Vui lòng chọn loại thiết kế trước khi tạo chất liệu",
      });
      return;
    }

    // Use designTypeId from selectedDesignType (prioritize this over material.designTypeId)
    const designTypeId = Number(selectedDesignType.id);

    // Build payload with required fields
    const payload: CreateMaterialTypeRequest = {
      ...material,
      designTypeId: designTypeId,
    };

    // Validate required fields
    if (!payload.code || !payload.name) {
      toast.error("Lỗi", {
        description:
          "Vui lòng điền đầy đủ thông tin bắt buộc (Mã và Tên chất liệu)",
      });
      return;
    }

    if (payload.pricePerM2 === undefined || payload.pricePerM2 < 0) {
      toast.error("Lỗi", {
        description: "Giá trên m² phải lớn hơn hoặc bằng 0",
      });
      return;
    }

    createMaterialTypeMutation(payload, {
      onSuccess: () => {
        // Invalidate materials-by-design-type query to refresh the list
        queryClient.invalidateQueries({
          queryKey: ["materials-by-design-type", designTypeId],
        });
        // Also invalidate all material type queries
        queryClient.invalidateQueries({
          queryKey: ["material-types"],
        });
        toast.success("Thành công", {
          description: `Đã thêm chất liệu "${payload.name}" thành công`,
        });
      },
      onError: (error: unknown) => {
        const apiError = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const errorMessage =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Không thể thêm chất liệu. Vui lòng thử lại.";
        toast.error("Lỗi", {
          description: errorMessage,
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

    // Get designTypeId from selectedDesignType or from updates
    const designTypeId =
      selectedDesignType?.id ||
      (updates as { designTypeId?: number })?.designTypeId;

    updateMaterialTypeMutation(
      {
        id,
        data,
      },
      {
        onSuccess: () => {
          // Invalidate materials-by-design-type query to refresh the list
          if (designTypeId) {
            queryClient.invalidateQueries({
              queryKey: ["materials-by-design-type", designTypeId],
            });
          } else {
            // Fallback: invalidate all materials-by-design-type queries
            queryClient.invalidateQueries({
              queryKey: ["materials-by-design-type"],
            });
          }
          toast.success("Thành công", {
            description: "Đã cập nhật chất liệu",
          });
        },
        onError: (error: Error) => {
          toast.error("Lỗi", {
            description: error.message || "Không thể cập nhật chất liệu",
          });
        },
      }
    );
  };

  const handleDeleteMaterial = (id: number) => {
    // Get designTypeId from selectedDesignType
    const designTypeId = selectedDesignType?.id;

    deleteMaterialTypeMutation(id, {
      onSuccess: () => {
        // Invalidate materials-by-design-type query to refresh the list
        if (designTypeId) {
          queryClient.invalidateQueries({
            queryKey: ["materials-by-design-type", designTypeId],
          });
        } else {
          // Fallback: invalidate all materials-by-design-type queries
          queryClient.invalidateQueries({
            queryKey: ["materials-by-design-type"],
          });
        }
        toast.success("Thành công", {
          description: "Đã xóa chất liệu",
        });
      },
      onError: (error: Error) => {
        toast.error("Lỗi", {
          description: error.message || "Không thể xóa chất liệu",
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
    <div className="h-full flex flex-col justify-between overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-5 gap-3.5 text-xs">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#93631F]" />
            Quản Lý Loại Thiết Kế & Chất Liệu
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý danh mục các loại thiết kế và bảng định mức chất liệu tương ứng
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs font-bold px-3 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs gap-1.5 cursor-pointer"
          onClick={() => setIsDesignTypeDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Thêm loại thiết kế
        </Button>
      </div>

      {/* Compact Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 p-2.5 px-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Tổng loại thiết kế</p>
            <p className="text-lg font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">{stats.total}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px]">
            {stats.active} hoạt động
          </Badge>
        </div>

        <div className="flex items-center justify-between bg-purple-50/70 dark:bg-purple-950/30 p-2.5 px-4 rounded-xl border border-purple-200/80 dark:border-purple-900/60 shadow-2xs">
          <div>
            <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">Tổng chất liệu</p>
            <p className="text-lg font-extrabold text-purple-900 dark:text-purple-200 mt-0.5">{stats.totalMaterials}</p>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400">Trên hệ thống</span>
        </div>

        <div className="flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/30 p-2.5 px-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 shadow-2xs">
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Trung bình</p>
            <p className="text-lg font-extrabold text-amber-900 dark:text-amber-200 mt-0.5">
              {stats.total > 0 ? Math.round(stats.totalMaterials / stats.total) : 0}
            </p>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">Chất liệu / loại</span>
        </div>
      </div>

      {/* Main Table Container (Single-Screen Fit) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col">
        {/* Search Bar Toolbar */}
        <div className="p-2.5 px-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã loại thiết kế..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        {/* Table Body Area */}
        <div className="flex-1 overflow-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 border-b border-slate-200 dark:border-slate-800">
              <TableRow className="bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300">
                <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[200px]">Mã / Tên loại thiết kế</TableHead>
                <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 text-center w-[80px]">Thứ tự</TableHead>
                <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 text-center w-[120px]">Trạng thái</TableHead>
                <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 w-[180px]">Người tạo</TableHead>
                <TableHead className="h-9 font-bold text-slate-700 dark:text-slate-300 text-right w-[180px] pr-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesignTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                    Không tìm thấy loại thiết kế nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDesignTypes.map((designType) => (
                  <TableRow
                    key={designType.id}
                    className="h-10 text-xs border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[11px] font-bold shrink-0">
                          {designType.code}
                        </Badge>
                        <TruncatedText
                          text={designType.name}
                          className="font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-center font-mono font-medium text-slate-600">
                      {designType.displayOrder}
                    </TableCell>

                    <TableCell className="py-2 text-center">
                      <Badge
                        variant={designType.status === "active" ? "default" : "secondary"}
                        className={
                          designType.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]"
                        }
                      >
                        {designType.status === "active" ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {designType.createdBy.fullName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          @{designType.createdBy.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right pr-4">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDesignType(designType)}
                          className="h-7 text-xs font-bold px-2.5 text-[#93631F] border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer gap-1"
                          disabled={isCreatingMaterial}
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>Chất liệu</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDesignType(designType);
                            setIsDesignTypeDialogOpen(true);
                          }}
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDesignTypeToDelete(designType);
                            setDeleteConfirmOpen(true);
                          }}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="shrink-0 p-2.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <div>
            {stats.total > 0 ? (
              <span>
                Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-300">{startIndex}-{endIndex}</span> trên{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{designTypesPaged.total}</span> loại thiết kế
              </span>
            ) : (
              <span>Không có dữ liệu.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium px-2.5 cursor-pointer"
              disabled={!hasPreviousPage}
              onClick={() => handlePageChange(pageNumber - 1)}
            >
              Trước
            </Button>
            <span>
              Trang <span className="font-bold text-slate-800 dark:text-slate-200">{designTypesPaged.page}</span> /{" "}
              {designTypesPaged.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium px-2.5 cursor-pointer"
              disabled={!hasNextPage}
              onClick={() => handlePageChange(pageNumber + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

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
