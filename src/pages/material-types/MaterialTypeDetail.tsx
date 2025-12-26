import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { MaterialTypeResponse } from '@/Schema/material-type.schema';
import { useMaterialType, useUpdateMaterialType, useDeleteMaterialType } from '@/hooks/use-material-type';

export default function MaterialTypeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [materialType, setMaterialType] = useState<MaterialTypeResponse | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadMaterialType = async () => {
      if (!id) {
        toast.error("Lỗi", {
          description: "ID loại vật liệu không hợp lệ",
        });
        navigate('/material-types');
        return;
      }

      try {
        setLoading(true);
        const data = await materialTypeService.getMaterialTypeById(Number(id));
        if (data) {
          setMaterialType(data);
        } else {
          toast.error("Lỗi", {
            description: "Không tìm thấy loại vật liệu",
          });
          navigate('/material-types');
        }
      } catch (error) {
        toast.error("Lỗi", {
          description: "Không thể tải thông tin loại vật liệu",
        });
        navigate('/material-types');
      } finally {
        setLoading(false);
      }
    };

    loadMaterialType();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!materialType?.id) return;

    try {
      setDeleting(true);
      await materialTypeService.deleteMaterialType(materialType.id);
      toast.success("Thành công", {
        description: "Đã xóa loại vật liệu",
      });
      navigate('/material-types');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể xóa loại vật liệu";
      toast.error("Lỗi", {
        description: message,
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCopyCode = () => {
    if (materialType?.code) {
      navigator.clipboard.writeText(materialType.code);
      toast.success("Đã sao chép", {
        description: `Đã sao chép mã "${materialType.code}" vào clipboard`,
      });
    }
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Chưa có thông tin';
    return new Date(date).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!materialType) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/material-types')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold">
            Chi tiết loại vật liệu
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/material-types/edit/${materialType.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Sửa
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyCode}>
                <Copy className="mr-2 h-4 w-4" />
                Sao chép mã
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chính</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Mã loại vật liệu</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {materialType.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Thứ tự hiển thị</p>
                  <p className="text-lg font-semibold mt-1">{materialType.displayOrder}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Tên loại vật liệu</p>
                <p className="text-lg font-semibold mt-1">{materialType.name}</p>
              </div>

              {materialType.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Mô tả</p>
                  <p className="text-gray-800 mt-1 leading-relaxed">
                    {materialType.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={materialType.status === 'active' ? "default" : "secondary"}
                className="text-sm"
              >
                {materialType.status === 'active' ? "Đang sử dụng" : "Tạm dừng"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin tạo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialType.createdBy && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Người tạo</p>
                  <p className="text-sm mt-1">
                    {materialType.createdBy.fullName || materialType.createdBy.username}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                <p className="text-sm mt-1">{formatDate(materialType.createdAt)}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                <p className="text-sm mt-1">{formatDate(materialType.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại vật liệu "{materialType.name}" (mã: {materialType.code})?
              <br />
              <span className="font-medium text-red-600">
                Hành động này không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}