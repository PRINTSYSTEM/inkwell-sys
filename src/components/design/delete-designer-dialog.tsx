import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { UserResponse } from "@/Schema";

interface DeleteDesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer: UserResponse | null;
  onSuccess: () => void;
}

export function DeleteDesignerDialog({
  open,
  onOpenChange,
  designer,
  onSuccess,
}: DeleteDesignerDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!designer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${designer.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete designer");
      }

      toast({
        title: "Xóa thành công",
        description: `Đã xóa nhân viên ${designer.fullName}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhân viên này",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa nhân viên{" "}
            <strong>{designer?.fullName}</strong> không? Hành động này không thể
            hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
