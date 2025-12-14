import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Package } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { DesignListParams, DesignResponse, UserResponse } from "@/Schema";
import { useDesignsByUser } from "@/hooks";
import { useNavigate } from "react-router-dom";

type DesignerDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDesigner: UserResponse;
};

const getStatusBadge = (status: string | null | undefined) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    received_info: {
      label: "Nhận thông tin",
      className: "bg-blue-500 hover:bg-blue-600",
    },
    designing: {
      label: "Đang thiết kế",
      className: "bg-yellow-500 hover:bg-yellow-600",
    },
    editing: {
      label: "Đang chỉnh sửa",
      className: "bg-orange-500 hover:bg-orange-600",
    },
    waiting_for_customer_approval: {
      label: "Chờ khách duyệt",
      className: "bg-purple-500 hover:bg-purple-600",
    },
    confirmed_for_printing: {
      label: "Đã chốt in",
      className: "bg-green-500 hover:bg-green-600",
    },
  };
  return (
    statusMap[status || ""] || {
      label: status || "N/A",
      className: "bg-slate-500",
    }
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DesignerDetail({
  open,
  onOpenChange,
  selectedDesigner,
}: DesignerDetailProps) {
  const navigate = useNavigate();
  // ====== CALL API ======
  const { data, isLoading, isError } = useDesignsByUser(
    Number(selectedDesigner?.id)
  );

  // hỗ trợ cả 2 dạng: Array<Design> hoặc { items, totalPages, ... }
  type PagedData = { items?: DesignResponse[]; totalPages?: number };
  const pagedData = data as PagedData | undefined;

  const designs: DesignResponse[] = Array.isArray(data)
    ? data
    : pagedData?.items ?? [];

  const totalPages: number =
    !Array.isArray(data) && typeof pagedData?.totalPages === "number"
      ? pagedData.totalPages
      : 1;

  const handleViewDesign = (designId: number) => {
    navigate(`/design/detail/${designId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Danh sách thiết kế
          </DialogTitle>
          <DialogDescription>
            {selectedDesigner && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-sm font-semibold text-purple-700">
                  {selectedDesigner.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {selectedDesigner.fullName}
                  </div>
                  <div className="text-sm text-slate-500">
                    @{selectedDesigner.username}
                  </div>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ====== CONTENT ====== */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <p>Đang tải danh sách thiết kế...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <p>Không tải được danh sách thiết kế.</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <FileText className="mb-4 h-16 w-16 text-slate-300" />
              <p className="text-lg font-medium">Chưa có thiết kế nào</p>
              <p className="text-sm">
                Nhân viên này chưa có công việc nào được giao
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {designs.map((design) => {
                  const statusBadge = getStatusBadge(design.status);

                  return (
                    <Card
                      key={design.id}
                      className="group hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-bold text-slate-900">
                                    {design.code || `DES-${design.id}`}
                                  </h3>
                                  <Badge className={statusBadge.className}>
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                {design.designName && (
                                  <p className="mt-1 text-sm text-slate-700 font-medium">
                                    {design.designName}
                                  </p>
                                )}
                              </div>

                              <Button
                                className="text-sm font-medium cursor-pointer"
                                onClick={() => handleViewDesign(design.id!)}
                              >
                                Xem chi tiết
                              </Button>
                            </div>

                            {/* Info Grid */}
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Design Type */}
                              <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                                  <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">
                                    Loại thiết kế
                                  </p>
                                  <p className="font-semibold text-slate-900">
                                    {design.designType?.name || "—"}
                                  </p>
                                </div>
                              </div>

                              {/* Material */}
                              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                  <Package className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">
                                    Chất liệu
                                  </p>
                                  <p className="font-semibold text-slate-900">
                                    {design.materialType?.name || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Dimensions */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-medium text-slate-500 mb-2">
                                Kích thước
                              </p>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">Chiều rộng</p>
                                  <p className="font-semibold">
                                    {design.width != null
                                      ? `${design.width} cm`
                                      : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Chiều cao</p>
                                  <p className="font-semibold">
                                    {design.height != null
                                      ? `${design.height} cm`
                                      : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Diện tích</p>
                                  <p className="font-semibold">
                                    {design.areaCm2 != null
                                      ? `${(design.areaCm2 / 10000).toFixed(
                                          2
                                        )} m²`
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                              {design.dimensions && (
                                <p className="mt-2 text-sm text-slate-600">
                                  Kích thước: {design.dimensions}
                                </p>
                              )}
                            </div>

                            {/* Notes */}
                            {design.notes && (
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p className="text-xs font-medium text-blue-700">
                                  Ghi chú
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                  {design.notes}
                                </p>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex gap-4 text-xs text-slate-500">
                              <span>
                                Tạo: {formatDate(design.createdAt as string)}
                              </span>
                              <span>
                                Cập nhật:{" "}
                                {formatDate(design.updatedAt as string)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
