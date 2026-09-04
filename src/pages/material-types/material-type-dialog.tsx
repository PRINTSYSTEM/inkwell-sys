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
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-5 gap-3">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-[#93631F] to-amber-700 rounded-lg text-white">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Quản Lý Chất Liệu
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 text-xs mt-0.5">
                    Loại thiết kế:{" "}
                    <Badge variant="outline" className="font-mono text-[11px] font-bold">
                      {designType.code}
                    </Badge>
                    <span className="text-slate-900 dark:text-slate-200 font-bold">
                      {designType.name}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Search bar & Add Button */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chất liệu theo tên hoặc mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setShowFormDialog(true)}
              className="h-8 text-xs font-bold px-3 bg-[#93631F] hover:bg-[#7a521a] text-white shadow-2xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm chất liệu
            </Button>
          </div>

          {/* Compact Stat Cards */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded">
                <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Tổng chất liệu</p>
                <p className="text-sm font-extrabold text-blue-950 dark:text-blue-200">{materials.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                <div className="h-3 w-3 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Đang hoạt động</p>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                  {materials.filter((m) => m.status === "active").length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded">
                <div className="h-3 w-3 rounded-full bg-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Tạm dừng</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {materials.filter((m) => m.status === "inactive").length}
                </p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            {isLoadingMaterials ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#93631F] mb-2" />
                <p className="text-xs text-slate-500">
                  Đang tải danh sách chất liệu...
                </p>
              </div>
            ) : isErrorMaterials ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-rose-500 text-xs font-medium mb-2">
                  Không thể tải danh sách chất liệu
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDialogOpenChange(false);
                    setTimeout(() => handleDialogOpenChange(true), 100);
                  }}
                  className="h-7 text-xs"
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
