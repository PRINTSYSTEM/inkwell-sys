import { useState, useMemo } from "react";
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
import { useAuth } from "@/hooks/use-auth";
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
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DieListPage() {
  const { user } = useAuth();
  const canViewPrice = useMemo(() => {
    return !!user?.role && ["admin", "sale", "manager", "accounting", "accounting_lead"].includes(user.role);
  }, [user]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [dieName, setDieName] = useState("");
  const [location, setLocation] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [usableFilter, setUsableFilter] = useState<"all" | "usable" | "unusable">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
    category: categoryFilter === "all" ? undefined : categoryFilter,
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
    setCategoryFilter("all");
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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-4">
      <Helmet>
        <title>Quản lý khuôn cắt</title>
        <meta
          name="description"
          content="Màn hình quản lý khuôn cắt: tra cứu, lọc và theo dõi tình trạng sử dụng khuôn cắt."
        />
        <link rel="canonical" href="/proofing/dies" />
      </Helmet>

      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 shrink-0 text-slate-900">
            <Layers className="h-5 w-5 text-primary" />
            Quản lý khuôn cắt
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-slate-900 text-white px-3 py-1">
              Tổng
              <span className="ml-2 text-sm font-bold">{totalCount}</span>
            </Badge>

            <Badge className="bg-emerald-600 text-white px-3 py-1">
              Sử dụng được
              <span className="ml-2 text-sm font-bold">{usableCount}</span>
            </Badge>

            <Badge className="bg-red-600 text-white px-3 py-1">
              Hỏng/Cần KT
              <span className="ml-2 text-sm font-bold">{unusableCount}</span>
            </Badge>
          </div>
        </div>
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
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm bg-muted/50 border-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Phân loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phân loại</SelectItem>
                <SelectItem value="box">Hộp (Box)</SelectItem>
                <SelectItem value="decal">Decal</SelectItem>
              </SelectContent>
            </Select>
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
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={isFetching}
              className="h-9 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-all font-medium flex items-center gap-1.5 px-3"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
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
                      <TableHead className="w-[80px] h-9 px-3 text-xs font-semibold text-slate-700">Hình ảnh</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Mã khuôn</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Loại khuôn</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Kích thước</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">Nhà cung cấp</TableHead>
                      <TableHead className="h-9 px-3 text-center text-xs font-semibold text-slate-700">Lần dùng</TableHead>
                      {canViewPrice && (
                        <TableHead className="h-9 px-3 text-right text-xs font-semibold text-slate-700">Giá tiền</TableHead>
                      )}
                      <TableHead className="h-9 px-3 text-center text-xs font-semibold text-slate-700">Trạng thái</TableHead>
                      <TableHead className="h-9 px-3 text-xs font-semibold text-slate-700">BB đầu tiên</TableHead>
                      <TableHead className="h-9 px-3 text-center text-xs font-semibold text-slate-700">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dies.map((die) => {
                      const isBox = die.category === "box" || !die.category;
                      return (
                      <TableRow key={die.id} className="hover:bg-muted/30 transition-colors border-b border-slate-100">
                        <TableCell className="py-1 px-3">
                          {die.imageUrl ? (
                            <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={die.imageUrl}
                                alt={die.code || "Khuôn bế"}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4.5 w-4.5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-3 font-medium text-xs">
                          {die.code || "—"}
                        </TableCell>
                        <TableCell className="py-1 px-3 text-xs">
                          {isBox ? (
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                              Hộp
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                              Decal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-3 text-xs text-slate-600">{die.size || "—"}</TableCell>
                        <TableCell className="py-1 px-3 text-xs text-slate-600">{die.vendorName || "—"}</TableCell>
                        <TableCell className="py-1 px-3 text-center">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-mono text-[10px] px-1.5 py-0">
                            {(die as any).usageHistory?.length || 0}
                          </Badge>
                        </TableCell>
                        {canViewPrice && (
                          <TableCell className="py-1 px-3 text-right font-medium text-primary text-xs">
                            {die.price ? formatCurrency(die.price) : "—"}
                          </TableCell>
                        )}
                        <TableCell className="py-1 px-3 text-center">
                          <StatusBadge
                            status={die.status || (die.isUsable ? "ready" : "broken")}
                            label={
                              die.status && dieStatusLabels[die.status]
                                ? dieStatusLabels[die.status]
                                : die.isUsable
                                  ? "Sử dụng được"
                                  : "Không sử dụng được"
                            }
                            className="text-[10px] px-1.5 py-0"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-3">
                          {die.firstProofingOrderCode ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-foreground font-mono">
                                {die.firstProofingOrderCode}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-primary/10"
                                onClick={() =>
                                  handleCopyProofingOrderCode(
                                    die.firstProofingOrderCode || ""
                                  )
                                }
                                title="Sao chép mã bài"
                              >
                                {copiedProofingOrderCode ===
                                  die.firstProofingOrderCode ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-xs font-medium flex items-center gap-1 shrink-0"
                              onClick={() => handleEdit(die)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 px-2 text-xs font-medium flex items-center gap-1 shrink-0",
                                die.isUsable
                                  ? "text-orange-600 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                                  : "text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                              )}
                              onClick={() => handleToggleUsable(die)}
                            >
                              {die.isUsable ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                  Hỏng
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Dùng lại
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/60">
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
