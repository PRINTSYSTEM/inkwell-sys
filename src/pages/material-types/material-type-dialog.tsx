"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateMaterialTypeRequest,
  DesignTypeEntity,
  MaterialType,
} from "@/Schema";

interface MaterialTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designType: DesignTypeEntity;
  materials: MaterialType[];
  onCreateMaterial: (material: CreateMaterialTypeRequest) => void;
  onEditMaterial: (id: number, material: Partial<MaterialType>) => void;
  onDeleteMaterial: (id: number) => void;
}

export function MaterialTypeDialog({
  open,
  onOpenChange,
  designType,
  materials,
  onCreateMaterial,
  onEditMaterial,
  onDeleteMaterial,
}: MaterialTypeDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateMaterialTypeRequest>({
    code: "",
    name: "",
    displayOrder: 1,
    description: "",
    price: 0,
    pricePerCm2: 0,
    designTypeId: designType.id,
    status: "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditMaterial(editingId, formData);
      setEditingId(null);
    } else {
      onCreateMaterial(formData);
    }
    setFormData({
      code: "",
      name: "",
      displayOrder: 1,
      description: "",
      price: 0,
      pricePerCm2: 0,
      designTypeId: designType.id,
      status: "active",
    });
    setShowForm(false);
  };

  const handleEdit = (material: MaterialType) => {
    setFormData({
      code: material.code,
      name: material.name,
      displayOrder: material.displayOrder,
      description: material.description,
      price: material.price,
      pricePerCm2: material.pricePerCm2,
      designTypeId: material.designTypeId,
      status: material.status,
    });
    setEditingId(material.id);
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-blue-600" />
            Quản lý chất liệu - {designType.name}
          </DialogTitle>
          <DialogDescription>
            Quản lý các loại chất liệu cho loại thiết kế{" "}
            <Badge variant="outline">{designType.code}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Thêm chất liệu mới
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-4 border rounded-lg bg-muted/50"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã chất liệu *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên chất liệu *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerCm2">Giá/cm² *</Label>
                  <Input
                    id="pricePerCm2"
                    type="number"
                    value={formData.pricePerCm2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerCm2: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Thứ tự *</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên chất liệu</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Giá/cm²</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Chưa có chất liệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {material.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {material.name}
                      </TableCell>
                      <TableCell>
                        {material.price.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell>
                        {material.pricePerCm2.toLocaleString("vi-VN")} đ
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            material.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {material.status === "active"
                            ? "Hoạt động"
                            : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteMaterial(material.id)}
                            className="text-red-600 hover:text-red-700"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
