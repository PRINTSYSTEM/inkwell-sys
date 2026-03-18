import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  User,
  Layers,
  Calendar,
  CheckCircle2,
  Package,
} from "lucide-react";
import { orderDetailItemStatusLabels } from "@/lib/status-utils";
import type { ProofingOrderResponse } from "@/Schema";

interface CreateProductionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  proofingSearchTerm: string;
  onProofingSearchChange: (value: string) => void;
  filteredProofingOrders: ProofingOrderResponse[];
  selectedProofingOrderId: number | null;
  onSelectProofingOrder: (id: number | null) => void;
  selectedProofingOrder: ProofingOrderResponse | null;
  notes: string;
  onNotesChange: (value: string) => void;
  isCreating: boolean;
  onCreateProduction: () => void;
  onFormatDateTime: (dateStr?: string | null) => string;
}

export function CreateProductionDialog({
  isOpen,
  onOpenChange,
  proofingSearchTerm,
  onProofingSearchChange,
  filteredProofingOrders,
  selectedProofingOrderId,
  onSelectProofingOrder,
  selectedProofingOrder,
  notes,
  onNotesChange,
  isCreating,
  onCreateProduction,
  onFormatDateTime,
}: CreateProductionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-red-500/50 max-w-6xl max-h-[90vh] p-0 gap-0 flex flex-col">
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[50] font-mono pointer-events-none rounded-bl">
          CreateProductionDialog.tsx
        </div>
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl">
            Tạo đơn sản xuất mới
          </DialogTitle>
          <DialogDescription>
            Chọn một bình bài đang chờ sản xuất để tạo lệnh sản xuất
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0 bg-background">
          {/* Left Panel: Proofing Orders List */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border/50">
            <div className="p-4 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã BB, thiết kế, chất liệu, người tạo..."
                  className="pl-9 h-10 bg-background"
                  value={proofingSearchTerm}
                  onChange={(e) => onProofingSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {filteredProofingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Không tìm thấy bình bài</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Không có bình bài nào đang chờ sản xuất hoặc phù hợp với từ
                    khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead>Mã BB</TableHead>
                      <TableHead>Chất liệu</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Người tạo</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProofingOrders.map((order) => {
                      const isSelected = selectedProofingOrderId === order.id;
                      return (
                        <TableRow
                          key={order.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() =>
                            onSelectProofingOrder(order.id || null)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{order.code || `BB${order.id}`}</span>
                              <StatusBadge
                                status={order.status}
                                label={orderDetailItemStatusLabels[order.status]}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {order.materialType?.name || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {order.totalQuantity || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {order.createdBy?.fullName || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {onFormatDateTime(order.createdAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Right Panel: Selected Order Details */}
          <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l">
            {selectedProofingOrder ? (
              <>
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-semibold text-lg mb-1">
                    Chi tiết bình bài
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProofingOrder.code ||
                      `BB${selectedProofingOrder.id}`}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Layers className="h-3 w-3" />
                        Chất liệu
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedProofingOrder.materialType?.name || "N/A"}
                      </p>
                      {selectedProofingOrder.materialType?.code && (
                        <p className="text-xs text-muted-foreground">
                          {selectedProofingOrder.materialType.code}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Package className="h-3 w-3" />
                        Tổng số lượng
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedProofingOrder.totalQuantity || 0} sản phẩm
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        Người tạo
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedProofingOrder.createdBy?.fullName || "N/A"}
                      </p>
                      {selectedProofingOrder.createdBy?.email && (
                        <p className="text-xs text-muted-foreground">
                          {selectedProofingOrder.createdBy.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        Ngày tạo
                      </Label>
                      <p className="text-sm">
                        {onFormatDateTime(selectedProofingOrder.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Designs */}
                  {selectedProofingOrder.proofingOrderDesigns &&
                    selectedProofingOrder.proofingOrderDesigns.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Thiết kế (
                          {selectedProofingOrder.proofingOrderDesigns.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedProofingOrder.proofingOrderDesigns.map(
                            (pod) => (
                              <Card key={pod.id} className="p-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">
                                    {pod.design?.designName ||
                                      pod.design?.code ||
                                      "N/A"}
                                  </p>
                                  {pod.design?.code && (
                                    <p className="text-xs text-muted-foreground">
                                      Mã: {pod.design.code}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">
                                      Số lượng: {pod.quantity}
                                    </Badge>
                                    {pod.design?.dimensions && (
                                      <Badge variant="outline">
                                        {pod.design.dimensions}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Notes */}
                  {selectedProofingOrder.notes && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ghi chú bình bài
                      </Label>
                      <Card className="p-3 bg-muted/30">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedProofingOrder.notes}
                        </p>
                      </Card>
                    </div>
                  )}

                  {/* Production Notes Input */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="production-notes">
                      Ghi chú cho lệnh sản xuất (tùy chọn)
                    </Label>
                    <Textarea
                      id="production-notes"
                      placeholder="Nhập ghi chú cho đơn sản xuất..."
                      value={notes}
                      onChange={(e) => onNotesChange(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">
                  Chưa chọn bình bài
                </p>
                <p className="text-xs text-muted-foreground">
                  Vui lòng chọn một bình bài từ danh sách bên trái để xem chi
                  tiết
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
          <div className="flex items-center gap-3 w-full justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0"
            >
              Hủy
            </Button>
            <Button
              onClick={onCreateProduction}
              disabled={isCreating || !selectedProofingOrderId}
              className="flex-shrink-0 min-w-[140px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo đơn sản xuất
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
