import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  Trash2,
  Edit,
  Image as ImageIcon,
  Copy,
  Check,
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

  // Combine dieName and sizeFilter for search
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

  // Calculate stats from current page items
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
    <main className="min-h-screen bg-background p-6 space-y-6">
      <Helmet>
        <title>Quản lý khuôn bế</title>
        <meta
          name="description"
          content="Màn hình quản lý khuôn bế: tra cứu, lọc và theo dõi tình trạng sử dụng khuôn bế."
        />
        <link rel="canonical" href="/proofing/dies" />
      </Helmet>

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <Layers className="h-7 w-7 text-primary" />
            Quản lý khuôn bế
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi danh sách khuôn bế, tình trạng sử dụng và vị trí lưu kho.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            disabled={isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm khuôn bế
          </Button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng số khuôn bế</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Layers className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Khuôn đang sử dụng được (trang này)
              </p>
              <p className="text-2xl font-bold">{usableCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Khuôn cần kiểm tra / hỏng (trang này)
              </p>
              <p className="text-2xl font-bold">{unusableCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bộ lọc khuôn bế</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên khuôn..."
                  value={dieName}
                  onChange={(e) => {
                    setDieName(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="relative flex-1 md:max-w-xs">
                <Ruler className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo kích thước (VD: 100x200x50 hoặc 100x200)"
                  value={sizeFilter}
                  onChange={(e) => {
                    setSizeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="relative flex-1 md:max-w-xs">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vị trí lưu kho"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={usableFilter}
                  onValueChange={(v: "all" | "usable" | "unusable") => {
                    setUsableFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách khuôn bế</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                Đang tải danh sách khuôn bế...
              </div>
            ) : dies.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Không có khuôn bế nào phù hợp bộ lọc.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Hình ảnh</TableHead>
                        <TableHead>Tên khuôn</TableHead>
                        <TableHead>Kích thước</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead className="text-right">Giá tiền</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                        <TableHead>Mã bài</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dies.map((die) => (
                        <TableRow key={die.id}>
                          <TableCell>
                            {die.imageUrl ? (
                              <div className="w-16 h-16 rounded border overflow-hidden bg-muted flex items-center justify-center">
                                <img
                                  src={die.imageUrl}
                                  alt={die.code || "Khuôn bế"}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {die.code || "—"}
                          </TableCell>
                          <TableCell>{die.size || "—"}</TableCell>
                          <TableCell>{die.vendorName || "—"}</TableCell>
                          <TableCell>
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
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Được sử dụng trong mã bài:{" "}
                                  <span className="font-medium text-foreground">
                                    {die.firstProofingOrderCode}
                                  </span>
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
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {die.createdAt
                              ? format(
                                  new Date(die.createdAt),
                                  "dd/MM/yyyy HH:mm",
                                  {
                                    locale: vi,
                                  }
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-blue-600 border-blue-200 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all w-[140px] justify-start font-medium"
                                onClick={() => handleEdit(die)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Sửa thông tin
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 transition-all w-[140px] justify-start font-medium",
                                  die.isUsable 
                                    ? "text-orange-600 border-orange-200 hover:border-orange-400 hover:text-orange-700 hover:bg-orange-50" 
                                    : "text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50"
                                )}
                                onClick={() => handleToggleUsable(die)}
                              >
                                {die.isUsable ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Báo hỏng
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Trang {page} / {totalPages}
                  </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Die Dialog */}
      <DieDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        die={selectedDie}
        onSuccess={handleDialogSuccess}
      />
    </main>
  );
}
