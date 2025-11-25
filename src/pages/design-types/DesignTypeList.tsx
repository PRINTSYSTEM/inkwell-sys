import { useState } from "react";

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
} from "@/hooks";

export default function DesignTypesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: designTypes, isLoading, isError } = useDesignTypes();

  const { data: materialTypes } = useMaterialTypes({});

  const materialTypesList = materialTypes || [];

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

  const filteredDesignTypes = designTypes?.filter(
    (dt) =>
      dt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CREATE
  const handleCreateDesignType = (data: CreateDesignTypeRequest) => {
    createDesignTypeMutation(data, {
      // toast đã có trong hook, ở đây chỉ đóng dialog / reset state nếu muốn
      onSuccess: () => {
        setIsDesignTypeDialogOpen(false);
        setEditingDesignType(null);
      },
    });
  };

  // UPDATE
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

  // DELETE
  const handleDeleteDesignType = () => {
    if (!designTypeToDelete) return;

    deleteDesignTypeMutation(designTypeToDelete.id, {
      onSuccess: () => {
        setDesignTypeToDelete(null);
        setDeleteConfirmOpen(false);
      },
    });
  };

  // Material handlers hiện đang thuần FE (vì chưa thấy hooks cho material)
  const handleCreateMaterial = (material: CreateMaterialTypeRequest) => {
    const newMaterial: MaterialTypeEntity = {
      ...material,
      id:
        materialTypes.length > 0
          ? Math.max(...materialTypes.map((m: any) => m.id)) + 1
          : 1,
      statusType: "CommonStatus",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: 1,
        username: "admin",
        fullName: "Administrator",
        role: "admin",
        email: "admin@printsystem.com",
        phone: "0123456789",
      },
    };
    // TODO: nếu sau này có API cho material thì thay bằng mutation + invalidate
    // tạm thời: toast báo lỗi hoặc bỏ local update nếu materialTypes cũng dùng React Query
    toast({
      title: "Chưa implement API",
      description:
        "onCreateMaterial hiện mới là mock. Khi có API cho chất liệu thì sửa handler này.",
      variant: "destructive",
    });
  };

  const handleEditMaterial = (
    id: number,
    updates: Partial<MaterialTypeEntity>
  ) => {
    toast({
      title: "Chưa implement API",
      description:
        "onEditMaterial hiện mới là mock. Khi có API cho chất liệu thì sửa handler này.",
      variant: "destructive",
    });
  };

  const handleDeleteMaterial = (id: number) => {
    toast({
      title: "Chưa implement API",
      description:
        "onDeleteMaterial hiện mới là mock. Khi có API cho chất liệu thì sửa handler này.",
      variant: "destructive",
    });
  };

  const stats = {
    total: designTypes?.length ?? 0,
    active: designTypes?.filter((dt) => dt.status === "active").length ?? 0,
    totalMaterials: materialTypesList?.length ?? 0,
  };

  // (phần render JSX giữ nguyên như anh, chỉ đổi các handler ở dưới)
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ... header, stats, table y như code cũ ... */}

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
          materials={materialTypesList?.filter(
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
