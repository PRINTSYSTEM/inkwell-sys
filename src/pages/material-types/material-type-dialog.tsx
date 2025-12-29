import { useState, lazy, Suspense, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  CreateMaterialTypeRequest,
  DesignTypeResponse,
  MaterialTypeResponse,
} from "@/Schema";
import { MaterialTypeList } from "./material-type-list";
import { useMaterialsByDesignType } from "@/hooks";
const MaterialTypeFormDialogLazy = lazy(() =>
  import("./material-type-form-dialog").then((m) => ({
    default: m.MaterialTypeFormDialog,
  }))
);
const DeleteConfirmDialogLazy = lazy(() =>
  import("./delete-confirm-dialog").then((m) => ({
    default: m.DeleteConfirmDialog,
  }))
);

interface MaterialTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designType: DesignTypeResponse;
  onCreateMaterial: (material: CreateMaterialTypeRequest) => void;
  onEditMaterial: (id: number, material: Partial<MaterialTypeResponse>) => void;
  onDeleteMaterial: (id: number) => void;
}

export function MaterialTypeDialog({
  open,
  onOpenChange,
  designType,
  onCreateMaterial,
  onEditMaterial,
  onDeleteMaterial,
}: MaterialTypeDialogProps) {
  const queryClient = useQueryClient();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<MaterialTypeResponse | null>(null);
  const [deletingMaterial, setDeletingMaterial] =
    useState<MaterialTypeResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch material types when dialog is open and designType is available
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    isError: isErrorMaterials,
    refetch: refetchMaterials,
  } = useMaterialsByDesignType(
    open && designType?.id ? designType.id : undefined,
    undefined
  );

  // Normalize materials data - handle both array and paginated response
  const materials: MaterialTypeResponse[] = useMemo(() => {
    if (!materialsData) return [];
    
    // Handle paginated response: { items: [...], size, page, total, totalPages }
    if (typeof materialsData === 'object' && !Array.isArray(materialsData) && 'items' in materialsData) {
      const paginatedData = materialsData as { items?: MaterialTypeResponse[] | null };
      return Array.isArray(paginatedData.items) ? paginatedData.items : [];
    }
    
    // Handle direct array response
    return Array.isArray(materialsData) ? materialsData : [];
  }, [materialsData]);

  const handleEdit = (material: MaterialTypeResponse) => {
    setEditingMaterial(material);
    setShowFormDialog(true);
  };

  const handleFormClose = () => {
    setShowFormDialog(false);
    setEditingMaterial(null);
  };

  const handleFormSubmit = (material: CreateMaterialTypeRequest) => {
    if (editingMaterial) {
      onEditMaterial(editingMaterial.id, material);
    } else {
      onCreateMaterial(material);
    }
    handleFormClose();
    // Invalidate and refetch materials after mutation
    if (designType?.id) {
      queryClient.invalidateQueries({
        queryKey: ["materials-by-design-type", designType.id],
      });
      setTimeout(() => refetchMaterials(), 100);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingMaterial) {
      onDeleteMaterial(deletingMaterial.id);
      setDeletingMaterial(null);
      // Invalidate and refetch materials after deletion
      if (designType?.id) {
        queryClient.invalidateQueries({
          queryKey: ["materials-by-design-type", designType.id],
        });
        setTimeout(() => refetchMaterials(), 100);
      }
    }
  };

  // Reset search when dialog closes
  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Quản lý chất liệu
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    Loại thiết kế:{" "}
                    <Badge variant="outline" className="font-mono">
                      {designType.code}
                    </Badge>
                    <span className="text-foreground font-medium">
                      {designType.name}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-3 py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chất liệu theo tên hoặc mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowFormDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm chất liệu
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 py-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng chất liệu</p>
                <p className="text-lg font-semibold">{materials.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded">
                <div className="h-4 w-4 rounded-full bg-green-600 dark:bg-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                <p className="text-lg font-semibold">
                  {materials.filter((m) => m.status === "active").length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
              <div className="p-2 bg-gray-100 dark:bg-gray-900/40 rounded">
                <div className="h-4 w-4 rounded-full bg-gray-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tạm dừng</p>
                <p className="text-lg font-semibold">
                  {materials.filter((m) => m.status === "inactive").length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {isLoadingMaterials ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Đang tải danh sách chất liệu...
                </p>
              </div>
            ) : isErrorMaterials ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-red-500 mb-2">
                  Không thể tải danh sách chất liệu
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Retry by closing and reopening
                    handleDialogOpenChange(false);
                    setTimeout(() => handleDialogOpenChange(true), 100);
                  }}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <MaterialTypeList
                materials={filteredMaterials}
                onEdit={handleEdit}
                onDelete={setDeletingMaterial}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<div>Đang tải...</div>}>
        <MaterialTypeFormDialogLazy
          open={showFormDialog}
          onOpenChange={handleFormClose}
          designTypeId={designType.id}
          editingMaterial={editingMaterial}
          onSubmit={handleFormSubmit}
        />
      </Suspense>

      <Suspense fallback={<div>Đang tải...</div>}>
        <DeleteConfirmDialogLazy
          open={!!deletingMaterial}
          onOpenChange={(open) => !open && setDeletingMaterial(null)}
          title="Xóa chất liệu"
          description={`Bạn có chắc chắn muốn xóa chất liệu "${deletingMaterial?.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDeleteConfirm}
        />
      </Suspense>
    </>
  );
}
