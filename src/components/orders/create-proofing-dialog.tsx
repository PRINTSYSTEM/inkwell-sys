// src/components/orders/create-proofing-dialog.tsx
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/status-utils";
import type { DesignResponse } from "@/Schema/design.schema";
import type { MaterialTypeResponse } from "@/Schema/material-type.schema";
import type { CreateProofingOrderFromDesignsRequest } from "@/Schema/proofing-order.schema";
import { useCreateProofingOrderFromDesigns } from "@/hooks";

type CreateProofingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  designs: DesignResponse[];
  materialOptions: MaterialTypeResponse[];
};

export function CreateProofingDialog({
  open,
  onOpenChange,
  orderId,
  designs,
  materialOptions,
}: CreateProofingDialogProps) {
  const [selectedDesignIds, setSelectedDesignIds] = useState<number[]>([]);
  const [materialTypeId, setMaterialTypeId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const { mutate: createFromDesigns, loading } =
    useCreateProofingOrderFromDesigns();

  const totalQuantity = useMemo(
    () =>
      designs
        .filter((d) => selectedDesignIds.includes(d.id))
        .reduce((sum, d) => sum + (d.quantity || 0), 0),
    [designs, selectedDesignIds]
  );

  const totalAmount = useMemo(
    () =>
      designs
        .filter((d) => selectedDesignIds.includes(d.id))
        .reduce((sum, d) => sum + (d.totalPrice || 0), 0),
    [designs, selectedDesignIds]
  );

  const toggleDesign = (id: number, checked: boolean) => {
    setSelectedDesignIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!materialTypeId || selectedDesignIds.length === 0) return;

    // Schema expects orderDetailIds instead of designIds
    const payload: CreateProofingOrderFromDesignsRequest = {
      orderDetailIds: selectedDesignIds,
      notes: notes || undefined,
    };

    await createFromDesigns(payload);
    // TODO: có thể refetch orders/proofings ở parent bằng invalidateQueries

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tạo bình bài từ thiết kế</DialogTitle>
          <DialogDescription>
            Chọn các thiết kế đã chốt in để gom lại thành một lệnh bình bài.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bên trái: chọn thiết kế */}
          <div className="lg:col-span-2 space-y-3">
            <Label>Chọn thiết kế</Label>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Mã TK</TableHead>
                    <TableHead>Loại / Chất liệu</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designs.map((d) => {
                    const checked = selectedDesignIds.includes(d.id);
                    return (
                      <TableRow
                        key={d.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => toggleDesign(d.id, !checked)}
                      >
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="align-middle"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleDesign(d.id, !!v)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{d.code}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {d.designType?.name}
                          </div>
                          <div className="text-sm">{d.materialType?.name}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {d.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(d.totalPrice || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {designs.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Đơn hàng chưa có thiết kế nào.
              </p>
            )}
          </div>

          {/* Bên phải: thông tin bình bài */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chất liệu bình bài</Label>
              <Select
                value={materialTypeId?.toString()}
                onValueChange={(v) => setMaterialTypeId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  {materialOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Ghi chú cho bình bài..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số thiết kế</span>
                <span className="font-medium">{selectedDesignIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tổng SL</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Tổng thành tiền</span>
                <span className="font-semibold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading || !materialTypeId || selectedDesignIds.length === 0
            }
          >
            {loading ? "Đang tạo..." : "Tạo bình bài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
