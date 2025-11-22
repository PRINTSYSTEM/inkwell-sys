import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ENTITY_CONFIG } from '@/config/entities.config';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMaterialsByDesignType, useCreateMaterialType, useUpdateMaterialType, useDeleteMaterialType } from '@/hooks/use-material-type';
import type { MaterialType } from '@/apis/material-type.api';
import { BulkMaterialAddDialog } from './BulkMaterialAddDialog';

export function MaterialTypeListByDesignType({ designTypeId }: { designTypeId: number }) {
  const { data: materials, isLoading, refetch } = useMaterialsByDesignType(designTypeId, 'active');
  const createMaterial = useCreateMaterialType();
  const updateMaterial = useUpdateMaterialType();
  const deleteMaterial = useDeleteMaterialType();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    pricePerCm2: 0,
    displayOrder: 0,
    status: Object.keys(ENTITY_CONFIG.commonStatuses.values)[0],
  });

  // Thêm chất liệu mới
  const handleAdd = async () => {
    await createMaterial.mutateAsync({
      ...form,
      designTypeId,
    });
    setForm({ name: '', code: '', description: '', price: 0, pricePerCm2: 0, displayOrder: 0, status: 'active' });
    refetch();
  };

  // Sửa chất liệu
  const handleEdit = async (id: number) => {
    await updateMaterial.mutateAsync({
      id,
      data: { ...form },
    });
    setEditingId(null);
    setForm({ name: '', code: '', description: '', price: 0, pricePerCm2: 0, displayOrder: 0, status: 'active' });
    refetch();
  };

  // Xóa chất liệu
  const handleDelete = async (id: number) => {
    await deleteMaterial.mutateAsync(id);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Danh sách chất liệu</h3>
        <BulkMaterialAddDialog designTypeId={designTypeId} onSuccess={refetch} />
      </div>
      {isLoading ? (
        <div>Đang tải...</div>
      ) : (
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Mã</th>
              <th className="px-2 py-1 border">Tên chất liệu</th>
              <th className="px-2 py-1 border">Thứ tự</th>
              <th className="px-2 py-1 border">Mô tả</th>
              <th className="px-2 py-1 border">Giá</th>
              <th className="px-2 py-1 border">Giá/cm2</th>
              <th className="px-2 py-1 border">Trạng thái</th>
              <th className="px-2 py-1 border">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {materials && materials.length > 0 ? materials.map((m: MaterialType) => (
              <tr key={m.id}>
                {editingId === m.id ? (
                  <>
                    <td className="border px-2 py-1"><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Mã" /></td>
                    <td className="border px-2 py-1"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên chất liệu" /></td>
                    <td className="border px-2 py-1"><Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} placeholder="Thứ tự" /></td>
                    <td className="border px-2 py-1"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả" /></td>
                    <td className="border px-2 py-1"><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="Giá" /></td>
                    <td className="border px-2 py-1"><Input type="number" value={form.pricePerCm2} onChange={e => setForm(f => ({ ...f, pricePerCm2: Number(e.target.value) }))} placeholder="Giá/cm2" /></td>
                    <td className="border px-2 py-1">
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1">
                        {Object.entries(ENTITY_CONFIG.commonStatuses.values).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1 flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(m.id)}>Lưu</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-2 py-1 font-mono">{m.code}</td>
                    <td className="border px-2 py-1 font-medium">{m.name}</td>
                    <td className="border px-2 py-1">{m.displayOrder}</td>
                    <td className="border px-2 py-1">{m.description}</td>
                    <td className="border px-2 py-1">{m.price}</td>
                    <td className="border px-2 py-1">{m.pricePerCm2}</td>
                    <td className="border px-2 py-1">
                      {ENTITY_CONFIG.commonStatuses.values[m.status] || m.status}
                    </td>
                    <td className="border px-2 py-1 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(m.id); setForm(m); }}>Sửa</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>Xóa</Button>
                    </td>
                  </>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-4">Chưa có chất liệu nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
