import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSharedAddresses, useCreateSharedAddress, useUpdateSharedAddress, useDeleteSharedAddress } from "@/hooks/use-shared-address";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function SharedAddressListPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading, refetch } = useSharedAddresses({ pageNumber: page, pageSize, search: search || undefined, isActive: null });
  const createMut = useCreateSharedAddress();
  const updateMut = useUpdateSharedAddress();
  const deleteMut = useDeleteSharedAddress();

  useEffect(() => {
    refetch();
  }, [page, search]);

  const items = data?.items || [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const payload = {
      label: form.get("label") as string,
      address: form.get("address") as string,
    };

    if (editing?.id) {
      await updateMut.mutate(editing.id, payload);
    } else {
      await createMut.mutate(payload);
    }

    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    await deleteMut.mutate(id);
    refetch();
  };

  return (
    <main className="min-h-screen p-6 bg-background space-y-6">
      <Helmet>
        <title>Địa chỉ giao hàng dùng chung</title>
      </Helmet>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Địa chỉ giao hàng dùng chung</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý địa chỉ giao hàng dùng chung cho hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Tìm kiếm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Button onClick={openCreate}>Thêm địa chỉ</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5}>Đang tải...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5}>Không có địa chỉ nào</TableCell></TableRow>
                ) : (
                  items.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium max-w-[240px] truncate" title={it.label}>{it.label}</TableCell>
                      <TableCell className="max-w-[360px] truncate" title={it.address}>{it.address}</TableCell>
                      <TableCell>{it.isActive ? "Hoạt động" : "Không hoạt động"}</TableCell>
                      <TableCell>{it.createdAt ? format(new Date(it.createdAt), "Pp", { locale: vi }) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(it)}>Sửa</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(it.id)}>Xóa</Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Tên</Label>
              <Input name="label" defaultValue={editing?.label || ""} required />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Textarea name="address" defaultValue={editing?.address || ""} required />
            </div>
            <DialogFooter>
              <Button type="submit">Lưu</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
