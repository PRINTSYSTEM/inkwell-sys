import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ENTITY_CONFIG } from '@/config/entities.config';
import { useDesignType, useUpdateDesignType, useDeleteDesignType } from '@/hooks/use-material-type';
import { MaterialTypeListByDesignType } from './MaterialTypeListByDesignType';

export default function DesignTypeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const designTypeId = Number(id);
  const { data: designType, isLoading: loading, refetch, error } = useDesignType(designTypeId);
  const deleteDesignType = useDeleteDesignType();

  // Kiểm tra id hợp lệ sau khi gọi hook
  if (!id || isNaN(designTypeId) || designTypeId <= 0) {
    navigate('/design-types');
    return null;
  }
  // Nếu có lỗi hoặc không có dữ liệu, hiển thị thông báo và chuyển hướng
  if (error || (!loading && !designType)) {
    toast({
      title: 'Lỗi',
      description: 'Không thể tải thông tin loại thiết kế',
      variant: 'destructive',
    });
    navigate('/design-types');
    return null;
  }

  const handleDelete = async () => {
    if (!designType) return;
    try {
      setDeleting(true);
      await deleteDesignType.mutateAsync(designType.id);
      toast({
        title: "Thành công",
        description: "Đã xóa loại thiết kế",
      });
      navigate('/design-types');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa loại thiết kế",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!designType) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Không tìm thấy loại thiết kế</h2>
          <Button 
            onClick={() => navigate('/design-types')}
            className="mt-4"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/design-types')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{designType.name}</h1>
            <p className="text-gray-600">Chi tiết loại thiết kế</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/design-types/edit/${designType.id}`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Xác nhận xóa
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa loại thiết kế <strong>{designType.name}</strong>? 
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mã loại thiết kế</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-base px-3 py-1">
                      {designType.code}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Thứ tự hiển thị</label>
                  <p className="mt-1 text-base">{designType.displayOrder}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Tên loại thiết kế</label>
                <p className="mt-1 text-lg font-medium">{designType.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                <div className="mt-1">
                  <Badge variant={designType.status === 'active' ? 'default' : 'secondary'}>
                    {ENTITY_CONFIG.commonStatuses.values[designType.status] || designType.status}
                  </Badge>
                </div>
              </div>

              {designType.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Mô tả</label>
                  <p className="mt-1 text-base text-gray-900">{designType.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Danh sách chất liệu của loại thiết kế này */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Chất liệu của loại thiết kế này</CardTitle>
            </CardHeader>
            <CardContent>
              {designType && (
                <MaterialTypeListByDesignType designTypeId={designType.id} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meta Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ID</label>
                <p className="mt-1 font-mono text-sm">{designType.id}</p>
              </div>
              
              <Separator />
              
              {/* Ẩn thông tin người tạo */}
              {/*
              <div>
                <label className="text-sm font-medium text-gray-600">Người tạo</label>
                <div className="mt-1">
                  <p className="font-medium">{designType.createdBy.fullName}</p>
                  <p className="text-sm text-gray-500">@{designType.createdBy.username}</p>
                  {designType.createdBy.email && (
                    <p className="text-sm text-gray-500">{designType.createdBy.email}</p>
                  )}
                </div>
              </div>
              */}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Ngày tạo</label>
                <p className="mt-1 text-sm">
                  {new Date(designType.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Lần cập nhật cuối</label>
                <p className="mt-1 text-sm">
                  {new Date(designType.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}