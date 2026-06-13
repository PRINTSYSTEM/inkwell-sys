import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { useDies, useDeleteDie, useUpdateDie } from "@/hooks/use-die";
import { DieDialog } from "@/components/dies/DieDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DieResponse } from "@/Schema";
import { dieStatusLabels, dieLocationLabels } from "@/lib/status-utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency } from "@/lib/status-utils";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Search,
  MapPin,
  Ruler,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Edit,
  Image as ImageIcon,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DieListPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [dieName, setDieName] = useState("");
  const [location, setLocation] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [usableFilter, setUsableFilter] = useState<
    "all" | "usable" | "unusable"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDie, setSelectedDie] = useState<DieResponse | null>(null);
  const [copiedProofingOrderCode, setCopiedProofingOrderCode] = useState<
    string | null
  >(null);

  const searchTerm = [dieName, sizeFilter].filter(Boolean).join(" ");

  const { data, isLoading, isFetching, refetch } = useDies({
    pageNumber: page,
    pageSize,
    q: searchTerm || "",
    location: location || "",
    isUsable:
      usableFilter === "all" ? null : usableFilter === "usable" ? true : false,
  });

  const { mutate: deleteDie } = useDeleteDie();
  const { mutate: updateDie } = useUpdateDie();

  const dies: DieResponse[] = (data?.items as DieResponse[] | null) ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.total ?? 0;

  const usableCount = dies.filter((d) => d.isUsable).length;
  const unusableCount = dies.length - usableCount;

  const handleDelete = (id?: number | null) => {
    if (!id) return;
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa khuôn bế này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }
    deleteDie(id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleToggleUsable = (die: DieResponse) => {
    if (!die.id) return;
    updateDie(
      {
        id: die.id,
        data: { isUsable: !die.isUsable },
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const handleResetFilters = () => {
    setDieName("");
    setLocation("");
    setSizeFilter("");
    setUsableFilter("all");
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedDie(null);
    setDialogOpen(true);
  };

  const handleEdit = (die: DieResponse) => {
    setSelectedDie(die);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  const handleCopyProofingOrderCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedProofingOrderCode(code);
      toast.success("Đã sao chép mã bài", {
        description: `Mã bài "${code}" đã được sao chép vào clipboard`,
      });
      setTimeout(() => {
        setCopiedProofingOrderCode(null);
      }, 2000);
    } catch (error) {
      toast.error("Không thể sao chép mã bài", {
        description: "Đã xảy ra lỗi khi sao chép vào clipboard",
      });
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 -mt-4 space-y-4">
      <Helmet>
        <title>Quản lý khuôn bế</title>
        <meta
          name="description"
          content="Màn hình quản lý khuôn bế: tra cứu, lọc và theo dõi tình trạng sử dụng khuôn bế."
        />
        <link rel="canonical" href="/proofing/dies" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Quản lý khuôn bế
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách khuôn bế, tình trạng sử dụng và vị trí lưu kho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm khuôn bế
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Tổng số khuôn
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none">
                {totalCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Sử dụng được
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-emerald-600">
                {usableCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none truncate">
                Cần kiểm tra/hỏng
              </p>
              <p className="text-base sm:text-xl font-bold mt-1 leading-none text-destructive">
                {unusableCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên khuôn..."
                value={dieName}
                onChange={(e) => {
                  setDieName(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <div className="relative min-w-[180px]">
              <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Kích thước (VD: 100x200)"
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <div className="relative min-w-[160px]">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Vị trí lưu kho"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <Select
              value={usableFilter}
              onValueChange={(v: "all" | "usable" | "unusable") => {
                setUsableFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm bg-muted/50 border-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Trạng thái khuôn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="usable">
                  {dieStatusLabels.ready || "Sử dụng được"}
                </SelectItem>
                <SelectItem value="unusable">
                  {dieStatusLabels.broken || "Không sử dụng được"}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={isFetching}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : null}
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="ml-3 text-slate-500">Đang tải...</span>
            </div>
          ) : dies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Layers className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">Không có khuôn bế nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[80px] font-semibold text-slate-700">Hình ảnh</TableHead>
                      <TableHead className="font-semibold text-slate-700">Tên khuôn</TableHead>
                      <TableHead className="font-semibold text-slate-700">Kích thước</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nhà cung cấp</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vị trí</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Giá tiền</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mã bài</TableHead>
                      <TableHead className="font-semibold text-slate-700">Ngày tạo</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dies.map((die) => (
                      <TableRow key={die.id} className="hover:bg-muted/30 transition-colors border-b border-slate-100">
                        <TableCell>
                          {die.imageUrl ? (
                            <div className="w-14 h-14 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={die.imageUrl}
                                alt={die.code || "Khuôn bế"}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-md border bg-muted flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {die.code || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{die.size || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{die.vendorName || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {die.location
                            ? dieLocationLabels[die.location]
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {die.price ? formatCurrency(die.price) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge
                            status={die.status || (die.isUsable ? "ready" : "broken")}
                            label={
                              die.status && dieStatusLabels[die.status]
                                ? dieStatusLabels[die.status]
                                : die.isUsable
                                  ? "Sử dụng được"
                                  : "Không sử dụng được"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {die.firstProofingOrderCode ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground font-mono">
                                {die.firstProofingOrderCode}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-primary/10"
                                onClick={() =>
                                  handleCopyProofingOrderCode(
                                    die.firstProofingOrderCode || ""
                                  )
                                }
                                title="Sao chép mã bài"
                              >
                                {copiedProofingOrderCode ===
                                die.firstProofingOrderCode ? (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {die.createdAt
                            ? format(
                                new Date(die.createdAt),
                                "dd/MM/yyyy",
                                { locale: vi }
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50 w-[130px] justify-start text-xs font-medium"
                              onClick={() => handleEdit(die)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Sửa thông tin
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 px-3 w-[130px] justify-start text-xs font-medium",
                                die.isUsable
                                  ? "text-orange-600 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                                  : "text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                              )}
                              onClick={() => handleToggleUsable(die)}
                            >
                              {die.isUsable ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Báo hỏng
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Dùng lại
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60">
                <span className="text-sm text-slate-500">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                  <span className="ml-2 text-muted-foreground">({totalCount} khuôn)</span>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages || 1, p + 1))
                    }
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Die Dialog */}
      <DieDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        die={selectedDie}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
