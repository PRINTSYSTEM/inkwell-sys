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
import type { DieResponse } from "@/Schema";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
} from "lucide-react";

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

  // Combine dieName and sizeFilter for search
  const searchTerm = [dieName, sizeFilter].filter(Boolean).join(" ");

  const { data, isLoading, isFetching, refetch } = useDies({
    pageNumber: page,
    pageSize,
    dieName: searchTerm || "",
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
                    <SelectItem value="usable">Đang sử dụng được</SelectItem>
                    <SelectItem value="unusable">Không sử dụng được</SelectItem>
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
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
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
                                  alt={die.name || "Khuôn bế"}
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
                            {die.name || "—"}
                          </TableCell>
                          <TableCell>{die.size || "—"}</TableCell>
                          <TableCell>{die.vendorName || "—"}</TableCell>
                          <TableCell>{die.location || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={die.isUsable ? "default" : "destructive"}
                            >
                              {die.isUsable
                                ? "Sử dụng được"
                                : "Cần kiểm tra / hỏng"}
                            </Badge>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(die)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Sửa
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUsable(die)}
                              >
                                {die.isUsable ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Đánh dấu hỏng
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Đánh dấu dùng được
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(die.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
