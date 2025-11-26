import { useState } from "react";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";

import { DesignTypeFormDialog } from "@/pages/design-types/design-type-form-dialog";
import { MaterialTypeDialog } from "@/pages/material-types/material-type-dialog";
import { useToast } from "@/hooks/use-toast";
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
  DesignTypeEntity,
  MaterialTypeEntity,
} from "@/Schema";
import {
  useCreateDesignType,
  useDesignTypes,
  useMaterialTypes,
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

export default function DesignTypesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: designTypesData, isLoading, isError } = useDesignTypes();
  const { data: materialTypesData } = useMaterialTypes({});

  // Chuẩn hoá: luôn ra array, dù backend trả [] hay { items: [] }
  const designTypes: DesignTypeEntity[] = Array.isArray(designTypesData)
    ? designTypesData
    : (designTypesData as any)?.items ?? [];

  const materialTypesList: MaterialTypeEntity[] = Array.isArray(
    materialTypesData
  )
    ? materialTypesData
    : (materialTypesData as any)?.items ?? [];

  const [selectedDesignType, setSelectedDesignType] =
    useState<DesignTypeEntity | null>(null);

  const [isDesignTypeDialogOpen, setIsDesignTypeDialogOpen] = useState(false);
  const [editingDesignType, setEditingDesignType] =
    useState<DesignTypeEntity | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [designTypeToDelete, setDesignTypeToDelete] =
    useState<DesignTypeEntity | null>(null);

  const { mutate: createDesignTypeMutation } = useCreateDesignType();
  const { mutate: updateDesignTypeMutation } = useUpdateDesignType();
  const { mutate: deleteDesignTypeMutation } = useDeleteDesignType();

  const { mutate: createMaterialTypeMutation } = useCreateMaterialType();
  const { mutate: updateMaterialTypeMutation } = useUpdateMaterialType();
  const { mutate: deleteMaterialTypeMutation } = useDeleteMaterialType();

  const filteredDesignTypes = designTypes.filter(
    (dt) =>
      dt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CREATE DESIGN TYPE
  const handleCreateDesignType = (data: CreateDesignTypeRequest) => {
    createDesignTypeMutation(data, {
      onSuccess: () => {
        setIsDesignTypeDialogOpen(false);
        setEditingDesignType(null);
      },
    });
  };

  // UPDATE DESIGN TYPE
  const handleUpdateDesignType = (data: CreateDesignTypeRequest) => {
    if (!editingDesignType) return;

    // API PUT chỉ nhận name, displayOrder, description, status
    const { code, ...payload } = data;

    updateDesignTypeMutation(
      { id: editingDesignType.id, data: payload },
      {
        onSuccess: () => {
          setEditingDesignType(null);
          setIsDesignTypeDialogOpen(false);
        },
      }
    );
  };

  // DELETE DESIGN TYPE
  const handleDeleteDesignType = () => {
    if (!designTypeToDelete) return;

    deleteDesignTypeMutation(designTypeToDelete.id, {
      onSuccess: () => {
        setDesignTypeToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  };

  // ========== MATERIAL HANDLERS (DÙNG API THẬT) ==========

  const handleCreateMaterial = (material: CreateMaterialTypeRequest) => {
    // đảm bảo có designTypeId (nếu form không gán sẵn)
    const payload: CreateMaterialTypeRequest = {
      ...material,
      designTypeId:
        material.designTypeId ??
        selectedDesignType?.id ??
        material.designTypeId,
    };

    if (!payload.designTypeId) {
      toast({
        title: "Lỗi",
        description: "Thiếu designTypeId khi tạo chất liệu",
        variant: "destructive",
      });
      return;
    }

    createMaterialTypeMutation(payload, {
      onSuccess: () => {
        toast({
          title: "Thành công",
          description: "Đã thêm chất liệu mới",
        });
        // MaterialTypeDialog vẫn mở, user có thể tạo tiếp
      },
    });
  };

  const handleEditMaterial = (
    id: number,
    updates: Partial<MaterialTypeEntity>
  ) => {
    // Chuyển về kiểu payload phù hợp với API (thường là Partial<CreateMaterialTypeRequest>)
    const {
      id: _ignoreId,
      createdAt,
      updatedAt,
      statusType,
      ...data
    } = updates as any;

    updateMaterialTypeMutation(
      {
        id,
        data,
      },
      {
        onSuccess: () => {
          toast({
            title: "Thành công",
            description: "Đã cập nhật chất liệu",
          });
        },
      }
    );
  };

  const handleDeleteMaterial = (id: number) => {
    deleteMaterialTypeMutation(id, {
      onSuccess: () => {
        toast({
          title: "Thành công",
          description: "Đã xóa chất liệu",
        });
      },
    });
  };

  const stats = {
    total: designTypes.length,
    active: designTypes.filter((dt) => dt.status === "active").length,
    totalMaterials: materialTypesList.length,
  };

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
              {stats.active} đang hoạt động
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
              Trên tất cả loại thiết kế
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

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã loại thiết kế..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    <TableCell colSpan={5} className="h-24 text-center">
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
        </CardContent>
      </Card>

      <DesignTypeFormDialog
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

      {selectedDesignType && (
        <MaterialTypeDialog
          open={!!selectedDesignType}
          onOpenChange={(open) => !open && setSelectedDesignType(null)}
          designType={selectedDesignType}
          materials={materialTypesList.filter(
            (m) => m.designTypeId === selectedDesignType.id
          )}
          onCreateMaterial={handleCreateMaterial}
          onEditMaterial={handleEditMaterial}
          onDeleteMaterial={handleDeleteMaterial}
        />
      )}
    </div>
  );
}
