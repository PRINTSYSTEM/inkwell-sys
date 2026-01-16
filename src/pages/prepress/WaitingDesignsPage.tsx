import { useEffect, useMemo, useState } from "react";
import {
  useAvailableOrderDetailsForProofing,
  useRejectDesignFromProofingOrder,
} from "@/hooks/use-proofing-order";
import { DesignItem } from "@/types/proofing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  Search,
  Layers,
  RotateCcw,
  Loader2,
  Inbox,
} from "lucide-react";
import { CursorTooltip } from "@/components/ui/cursor-tooltip";
import { formatDesignDimensions } from "@/utils/format-die-size";
import {
  processClassificationLabels,
  sidesClassificationLabels,
  laminationTypeLabels,
} from "@/lib/status-utils";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/constants/route.constant";

export default function WaitingDesignsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDesignForReject, setSelectedDesignForReject] =
    useState<DesignItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { mutate: rejectDesign, isPending: isRejecting } =
    useRejectDesignFromProofingOrder();

  const queryParams = useMemo(
    () => ({
      materialTypeId: undefined,
      designCode: searchTerm.trim() ? searchTerm.trim() : undefined,
      pageNumber: currentPage,
      pageSize: itemsPerPage,
    }),
    [searchTerm, currentPage]
  );

  const { data, isLoading } = useAvailableOrderDetailsForProofing(queryParams);

  const designs: DesignItem[] = data?.designs ?? [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? data?.totalCount ?? 0;
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handleRowClick = (design: DesignItem) => {
    // Navigate to order detail (available designs are order details)
    navigate(`${ROUTE_PATHS.ORDERS.DETAIL_BASE}/${design.orderId}`);
  };

  const handleRejectClick = (design: DesignItem) => {
    setSelectedDesignForReject(design);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedDesignForReject) return;

    rejectDesign(
      {
        orderDetailId: selectedDesignForReject.id,
        reason: rejectReason.trim() || null,
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setSelectedDesignForReject(null);
          setRejectReason("");
        },
        onError: () => {
          // Error is already handled in the hook
        },
      }
    );
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedDesignForReject(null);
    setRejectReason("");
  };

  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                  Thiết kế chờ bình bài
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Danh sách các thiết kế đã sẵn sàng cho bình bài. Hoàn hàng về
                  phòng thiết kế nếu cần chỉnh sửa.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tip: Click vào một dòng để mở chi tiết đơn hàng.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className="h-9 rounded-lg border-border/60 bg-background/60 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition-colors duration-200 hover:bg-background/80"
            >
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Tổng: {total}
            </Badge>
          </div>
        </header>

        {/* Content */}
        <main className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              {/* Search & Filters */}
              <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo mã thiết kế, đơn hàng, khách hàng..."
                      className="h-10 pl-10 pr-4 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </CardHeader>

              {/* Table */}
              <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="w-full flex-1 overflow-auto">
                    {isLoading ? (
                      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-6 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            Đang tải danh sách...
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Vui lòng đợi trong giây lát
                          </p>
                        </div>
                      </div>
                    ) : designs.length === 0 ? (
                      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-10">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                          <Inbox className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">
                            {searchTerm.trim()
                              ? "Không tìm thấy thiết kế"
                              : "Chưa có thiết kế chờ bình bài"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {searchTerm.trim()
                              ? "Thử tìm kiếm với từ khóa khác"
                              : "Các thiết kế sẵn sàng sẽ hiển thị tại đây"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                        <Table className="text-[15px]">
                          <TableHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <TableRow className="border-border/60 hover:bg-transparent">
                              <TableHead className="h-14 text-[15px] font-bold text-foreground">
                                Mã thiết kế
                              </TableHead>
                              <TableHead className="h-14 text-[15px] font-bold text-foreground">
                                Tên thiết kế
                              </TableHead>
                              <TableHead className="h-14 text-[15px] font-bold text-foreground">
                                Chất liệu
                              </TableHead>
                              <TableHead className="h-14 text-right text-[15px] font-bold text-foreground">
                                SL còn lại
                              </TableHead>
                              <TableHead className="h-14 w-[220px] text-right text-[15px] font-bold text-foreground">
                                Thao tác
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {designs.map((design) => {
                              // Build full info for tooltip (similar to PrepressDetail.tsx)
                              const tooltipContent = (
                                <div className="space-y-2 text-sm max-w-md">
                                  <div className="font-semibold text-base border-b pb-2">
                                    {design.name}
                                  </div>

                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Mã hàng:
                                      </span>
                                      <span className="ml-2 font-mono">
                                        {design.code}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        Đơn hàng:
                                      </span>
                                      <span className="ml-2 font-semibold">
                                        {design.orderCode || design.orderId}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        Loại:
                                      </span>
                                      <span className="ml-2">
                                        {design.designTypeName || "—"}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        Chất liệu:
                                      </span>
                                      <span className="ml-2">
                                        {design.materialTypeName || "—"}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        Kích thước:
                                      </span>
                                      <span className="ml-2">
                                        {formatDesignDimensions(
                                          design.length,
                                          design.width,
                                          design.height
                                        )}{" "}
                                        mm
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        SL đặt:
                                      </span>
                                      <span className="ml-2 font-semibold">
                                        {design.quantity.toLocaleString()}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        SL có thể bình bài:
                                      </span>
                                      <span
                                        className={`ml-2 font-semibold ${
                                          design.availableQuantity &&
                                          design.availableQuantity > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {design.availableQuantity?.toLocaleString() ||
                                          "—"}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-muted-foreground">
                                        Khách hàng:
                                      </span>
                                      <span className="ml-2">
                                        {design.customerName || "—"}
                                      </span>
                                    </div>

                                    {design.designerName && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Nhân viên mã hàng:
                                        </span>
                                        <span className="ml-2">
                                          {design.designerName}
                                        </span>
                                      </div>
                                    )}

                                    {design.accountantName && (
                                      <div>
                                        <span className="text-muted-foreground">
                                          Nhân viên kế toán:
                                        </span>
                                        <span className="ml-2">
                                          {design.accountantName}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {(design.processClassificationOptionName ||
                                    design.sidesClassification ||
                                    design.laminationType) && (
                                    <div className="pt-2 flex flex-wrap gap-1 justify-between border-t space-y-1">
                                      {design.processClassificationOptionName && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          <span className="text-muted-foreground">
                                            Quy cách:
                                          </span>
                                          <span className="ml-2">
                                            {processClassificationLabels[
                                              design
                                                .processClassificationOptionName
                                            ] ||
                                              design.processClassificationOptionName}
                                          </span>
                                        </Badge>
                                      )}

                                      {design.sidesClassification && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          <span className="text-muted-foreground">
                                            Số mặt:
                                          </span>
                                          <span className="ml-2">
                                            {sidesClassificationLabels[
                                              design.sidesClassification
                                            ] || design.sidesClassification}
                                          </span>
                                        </Badge>
                                      )}

                                      {design.laminationType && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          <span className="text-muted-foreground">
                                            Cán màng:
                                          </span>
                                          <span className="ml-2">
                                            {laminationTypeLabels[
                                              design.laminationType
                                            ] || design.laminationType}
                                          </span>
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );

                              return (
                                <CursorTooltip
                                  key={design.id}
                                  content={tooltipContent}
                                  delayDuration={300}
                                  className="p-4 max-w-md"
                                >
                                  <TableRow
                                    onClick={() => handleRowClick(design)}
                                    className="group h-14 border-border/60 text-[15px] transition-colors duration-200 hover:bg-muted/40 cursor-pointer"
                                  >
                                    <TableCell className="font-semibold">
                                      <div className="flex min-w-0 flex-col gap-1">
                                        <span className="truncate font-semibold text-foreground">
                                          {design.code}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                          Đơn: {design.orderCode}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="line-clamp-2 text-[15px] font-semibold text-foreground">
                                        {design.name}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-sm font-semibold"
                                      >
                                        {design.materialTypeName}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="text-[15px] font-bold text-foreground">
                                        {design.availableQuantity ??
                                          design.quantity}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 rounded-lg px-4 text-sm font-bold"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRejectClick(design);
                                        }}
                                      >
                                        Hoàn về phòng thiết kế
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                </CursorTooltip>
                              );
                            })}

                            {/* Keep table height stable (fits ~10 rows) */}
                            {Array.from({
                              length: Math.max(
                                0,
                                itemsPerPage - designs.length
                              ),
                            }).map((_, idx) => (
                              <TableRow
                                key={`empty-${idx}`}
                                className="h-14 border-border/60"
                              >
                                <TableCell colSpan={5} />
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {!isLoading && total > 0 && (
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/40 px-4 py-3 backdrop-blur-sm">
                      <div className="text-sm font-medium text-muted-foreground">
                        Trang{" "}
                        <span className="font-semibold text-foreground">
                          {currentPage}
                        </span>{" "}
                        /{" "}
                        <span className="font-semibold text-foreground">
                          {totalPages}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-10 px-4 text-sm font-semibold"
                          disabled={currentPage <= 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                        >
                          Trang trước
                        </Button>
                        <Button
                          variant="outline"
                          className="h-10 px-4 text-sm font-semibold"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Trang sau
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Reject Design Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <RotateCcw className="h-4 w-4" />
                </div>
                Hoàn hàng về phòng thiết kế
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-relaxed">
                Bạn có chắc chắn muốn từ chối thiết kế này và hoàn về phòng
                thiết kế không? Vui lòng nhập lý do (nếu có).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedDesignForReject && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {selectedDesignForReject.code}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {selectedDesignForReject.materialTypeName}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDesignForReject.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Khách hàng: {selectedDesignForReject.customerName}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="rejectReason" className="text-sm font-medium">
                  Lý do từ chối{" "}
                  <span className="text-muted-foreground">(tùy chọn)</span>
                </Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối thiết kế..."
                  rows={4}
                  className="resize-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleRejectCancel}
                disabled={isRejecting}
                className="transition-colors duration-200"
              >
                Hủy
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={isRejecting}
                variant="destructive"
                className="transition-colors duration-200"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận từ chối"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
