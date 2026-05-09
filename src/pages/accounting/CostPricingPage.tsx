// src/pages/accounting/CostPricingPage.tsx
import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  RefreshCw,
  Loader2,
  Check,
  X,
  Pencil,
  Filter,
  Layers,
  Scissors,
  AlertCircle,
  CircleDollarSign,
  Users,
} from "lucide-react";
import { usePlateExports, useUpdatePlateExport } from "@/hooks/use-plate-export";
import { useDies, useUpdateDie } from "@/hooks/use-die";
import { useActiveVendors } from "@/hooks/use-vendor";
import type { PlateExportResponse } from "@/Schema";
import type { DieResponse } from "@/Schema";
import { toast } from "sonner";

const DEFAULT_PLATE_PRICE = 60000;

function formatVND(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return "—";
  }
}

// ───────────────────────────────────────────────────────
// Inline editable price cell
// ───────────────────────────────────────────────────────
interface InlinePriceCellProps {
  id: number;
  currentPrice?: number | null;
  defaultValue?: number;
  onSave: (id: number, price: number) => Promise<void>;
  isSaving?: boolean;
}

function InlinePriceCell({
  id,
  currentPrice,
  defaultValue,
  onSave,
  isSaving,
}: InlinePriceCellProps) {
  const displayPrice = (currentPrice && currentPrice > 0) ? currentPrice : (defaultValue ?? 0);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayPrice.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setValue(displayPrice.toString());
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [displayPrice]);

  const cancel = () => {
    setValue(displayPrice.toString());
    setEditing(false);
  };

  const save = async () => {
    const price = parseFloat(value.replace(/,/g, ""));
    if (isNaN(price) || price < 0) {
      toast.error("Giá không hợp lệ");
      return;
    }
    await onSave(id, price);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 min-w-[180px]">
        <Input
          ref={inputRef}
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm w-32 focus:border-[#93631F]"
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-green-600 hover:bg-green-50"
          onClick={save}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-500 hover:bg-red-50"
          onClick={cancel}
          disabled={isSaving}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/cell">
      <span className="font-semibold tabular-nums text-slate-800">
        {formatVND(displayPrice)}
      </span>
      <Button
        size="icon"
        variant="outline"
        className="h-7 w-7 shrink-0 bg-white border-[#93631F]/20 text-[#93631F] hover:bg-[#93631F]/10 hover:text-[#93631F] hover:border-[#93631F]/40 shadow-sm transition-all"
        onClick={startEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ───────────────────────────────────────────────────────
// Kẽm (Plate Exports) Tab
// ───────────────────────────────────────────────────────
function PlateTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: vendorsData } = useActiveVendors();
  const { data, isLoading, refetch } = usePlateExports({
    pageNumber: page,
    pageSize: 15,
    search: search || undefined,
    vendorId: vendorId ? parseInt(vendorId) : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  } as any);
  const { mutateAsync: updatePlate } = useUpdatePlateExport();

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleSavePrice = async (id: number, price: number) => {
    const plate = items.find((p: any) => p.id === id);
    if (!plate) return;

    setSavingId(id);
    try {
      await updatePlate({
        id,
        data: {
          plateCount: plate.plateCount ?? 0,
          unitPrice: price,
          estimatedReceiveAt: plate.estimatedReceiveAt || undefined,
          receivedAt: plate.receivedAt || undefined,
        } as any,
      });
      toast.success(`Đã cập nhật giá kẽm: ${formatVND(price)}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60 py-3 px-5">
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã bình bài..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>
            <Select
              value={vendorId || "all"}
              onValueChange={(v) => {
                setVendorId(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-48">
                <SelectValue placeholder="Nhà cung cấp kẽm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NCC</SelectItem>
                {vendorsData?.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-[140px] h-10"
              title="Từ ngày"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-[140px] h-10"
              title="Đến ngày"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info banner about default price */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Giá mặc định cho mỗi bản kẽm là{" "}
          <strong>{formatVND(DEFAULT_PLATE_PRICE)}</strong>. Kế toán có thể
          click vào ô giá để chỉnh sửa khi thực tế thay đổi.
        </span>
      </div>

      {/* Table */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#93631F]" />
              <span className="ml-3 text-slate-500">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Layers className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">Không có dữ liệu</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#93631F]/5 border-b border-slate-200/60">
                      <TableHead className="font-semibold text-slate-700">
                        Mã bình bài
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Nhà cung cấp kẽm
                      </TableHead>
                      <TableHead className="text-center font-semibold text-slate-700 w-[100px]">
                        Số bản
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Ngày gửi
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Ngày nhận
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[280px]">
                        Đơn giá / bản
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">
                        Thành tiền
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((plate: PlateExportResponse) => {
                      const effectivePrice =
                        (plate as { unitPrice?: number }).unitPrice ?? DEFAULT_PLATE_PRICE;
                      const totalCost =
                        effectivePrice * (plate.plateCount ?? 1);
                      return (
                        <TableRow
                          key={plate.id}
                          className="group hover:bg-[#93631F]/5 transition-colors border-b border-slate-100"
                        >
                          <TableCell className="font-mono font-medium text-sm">
                            {plate.proofingOrderCode || `PX-${plate.id}`}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {plate.vendorName ||
                              plate.plateVendor?.name ||
                              "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {plate.plateCount ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDateTime(plate.sentAt)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDateTime(plate.receivedAt)}
                          </TableCell>
                          <TableCell>
                            <InlinePriceCell
                              id={plate.id!}
                              currentPrice={effectivePrice}
                              defaultValue={DEFAULT_PLATE_PRICE}
                              onSave={handleSavePrice}
                              isSaving={savingId === plate.id}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-800 tabular-nums">
                            {formatVND(totalCost)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
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
                      setPage((p) => Math.min(totalPages, p + 1))
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
    </div>
  );
}

// ───────────────────────────────────────────────────────
// Khuôn (Dies) Tab
// ───────────────────────────────────────────────────────
function DieTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<"all" | "no_price">("all");
  const [savingId, setSavingId] = useState<number | null>(null);

  const { data: vendorsData } = useActiveVendors();
  const { data, isLoading, refetch } = useDies({
    pageNumber: page,
    pageSize: 15,
    q: search || undefined,
    vendorName: vendorId ? vendorsData?.find(v => v.id.toString() === vendorId)?.name : undefined,
  });
  const { mutateAsync: updateDie } = useUpdateDie();

  const allItems = data?.items ?? [];
  // Client-side filter for "no price" since the API doesn't support it natively
  const items =
    priceFilter === "no_price"
      ? allItems.filter((d: DieResponse) => !d.price || d.price === 0)
      : allItems;
  const totalPages = data?.totalPages ?? 1;

  const handleSavePrice = async (id: number, price: number) => {
    setSavingId(id);
    try {
      await updateDie({ id, data: { price } });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-[#93631F]/5 border-b border-slate-200/60 py-3 px-5">
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo mã khuôn, tên..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>
            <Select
              value={vendorId || "all"}
              onValueChange={(v) => {
                setVendorId(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-48">
                <SelectValue placeholder="Nhà cung cấp khuôn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NCC</SelectItem>
                {vendorsData?.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priceFilter}
              onValueChange={(v) => {
                setPriceFilter(v as "all" | "no_price");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder="Trạng thái giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_price">Chưa có giá</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {priceFilter === "no_price" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Đang lọc khuôn <strong>chưa có giá</strong>. Kế toán vui lòng cập
            nhật giá cho từng khuôn bằng cách click vào biểu tượng chỉnh sửa.
          </span>
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-[#93631F]" />
              <span className="ml-3 text-slate-500">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Scissors className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">
                {priceFilter === "no_price"
                  ? "Không có khuôn nào chưa có giá 🎉"
                  : "Không có dữ liệu"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#93631F]/5 border-b border-slate-200/60">
                      <TableHead className="font-semibold text-slate-700">
                        Mã khuôn
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Kích thước
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Nhà cung cấp
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Người tạo
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Bình bài đầu
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Ngày nhận
                      </TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">
                        Lần dùng
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[280px]">
                        Đơn giá
                      </TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">
                        Trạng thái
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((die: DieResponse) => (
                      <TableRow
                        key={die.id}
                        className="group hover:bg-[#93631F]/5 transition-colors border-b border-slate-100"
                      >
                        <TableCell className="font-mono font-medium text-sm">
                          {die.code || `KB-${die.id}`}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {die.size || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {die.vendorName || die.vendor?.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {(die as any).createdBy?.fullName || (die as any).createdBy?.username || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {(() => {
                            const code = die.firstProofingOrderCode || (die as any).usageHistory?.[0]?.proofingOrderCode;
                            const orderId = die.firstProofingOrderId || (die as any).usageHistory?.[0]?.proofingOrderId;
                            
                            if (code && orderId) {
                              return (
                                <Link 
                                  to={`/proofing/${orderId}`} 
                                  className="text-[#93631F] hover:text-[#7A521A] hover:underline font-medium transition-colors"
                                  target="_blank"
                                >
                                  {code}
                                </Link>
                              );
                            }
                            return <span className="text-slate-500">—</span>;
                          })()}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {die.receivedAt ? formatDateTime(die.receivedAt) : (
                            <span className="text-slate-400 italic">
                              {formatDateTime((die as any).estimatedReceiveAt || die.createdAt)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-mono">
                            {(die as any).usageHistory?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <InlinePriceCell
                            id={die.id!}
                            currentPrice={die.price}
                            onSave={handleSavePrice}
                            isSaving={savingId === die.id}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {die.price && die.price > 0 ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 border">
                              Đã có giá
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-300 bg-orange-50"
                            >
                              Chưa có giá
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
                  {priceFilter === "no_price" && (
                    <span className="ml-2 text-orange-600">
                      ({items.length} khuôn cần cập nhật giá)
                    </span>
                  )}
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
                      setPage((p) => Math.min(totalPages, p + 1))
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
    </div>
  );
}



// ───────────────────────────────────────────────────────
// Main Page
// ───────────────────────────────────────────────────────
export default function CostPricingPage() {
  return (
    <>
      <Helmet>
        <title>Bảng kê chi phí Khuôn/Kẽm | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý và cập nhật giá chi phí khuôn bế và kẽm in cho kế toán"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Standard Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bảng kê chi phí Khuôn / Kẽm
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-[#93631F]" />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="plates">
            <TabsList className="h-11 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger
                value="plates"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#93631F]"
              >
                <Layers className="h-4 w-4" />
                Kẽm
              </TabsTrigger>
              <TabsTrigger
                value="dies"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#93631F]"
              >
                <Scissors className="h-4 w-4" />
                Khuôn bế
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plates" className="mt-6">
              <PlateTab />
            </TabsContent>
            <TabsContent value="dies" className="mt-6">
              <DieTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
