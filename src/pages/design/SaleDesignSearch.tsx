import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { useDesignsSale } from "@/hooks/use-design";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/status-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiRequest, API_SUFFIX } from "@/apis";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SaleDesignSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [selectedMaterialName, setSelectedMaterialName] = useState<
    string | null
  >(null);
  const [dimensionsFilter, setDimensionsFilter] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedDesignId, setCopiedDesignId] = useState<number | null>(null);

  const handleCopyDesignName = async (name: string, id: number) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedDesignId(id);
      toast.success("Đã sao chép tên thiết kế");
      setTimeout(() => {
        setCopiedDesignId(null);
      }, 2000);
    } catch (err) {
      toast.error("Không thể sao chép");
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load design types
  const { data: designTypes = [] } = useQuery({
    queryKey: ["design-types"],
    queryFn: async () => {
      const res = await apiRequest.get(API_SUFFIX.DESIGN_TYPES);
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload?.items && Array.isArray(payload.items)) return payload.items;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // derive selected type id from name (to call by-type endpoint)
  const selectedTypeId = selectedTypeName
    ? (designTypes.find((t: any) => t.name === selectedTypeName)?.id ?? null)
    : null;

  // Load materials; if a design type is selected, fetch by type id, else fetch all (use large pageSize)
  const { data: materialOptions = [] } = useQuery<any[]>({
    queryKey: ["materials", selectedTypeId],
    queryFn: async () => {
      if (selectedTypeId) {
        const res = await apiRequest.get(
          API_SUFFIX.MATERIAL_TYPES_BY_DESIGN_TYPE(selectedTypeId),
        );
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.items && Array.isArray(payload.items))
          return payload.items;
        return [];
      }

      // fetch all materials - request a large pageSize to get full list
      const res = await apiRequest.get(API_SUFFIX.MATERIAL_TYPES, {
        params: { pageNumber: 1, pageSize: 1000 },
      });
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload?.items && Array.isArray(payload.items)) return payload.items;
      return [];
    },
    placeholderData: keepPreviousData,
  });

  const { data, isLoading } = useDesignsSale({
    search: debouncedSearch,
    customerName: customerName || null,
    designType: selectedTypeName ?? null,
    materialType: selectedMaterialName ?? null,
    dimensions: dimensionsFilter || null,
    pageNumber: currentPage,
    pageSize: pageSize,
    sortColumn: "id",
    sortOrder: "desc",
  });

  const designs = data?.items ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const openPreview = (url?: string | null) => {
    setPreviewUrl(url ?? null);
    setPreviewOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Tra cứu thiết kế & Giá
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tìm mẫu thiết kế và xem báo giá đơn vị gần nhất
            </p>
          </div>
        </div>
      </div>

      {/* Filters (card, centered) */}
      <div className="p-6">
        <div className="w-full">
          <div className="rounded-md bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên thiết kế, mã thiết kế..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Customer */}
              <Input
                placeholder="Tên khách hàng"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />

              {/* Type */}
              <Select
                value={selectedTypeName ?? "0"}
                onValueChange={(v) =>
                  setSelectedTypeName(v && v !== "0" ? String(v) : null)
                }
              >
                <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Chọn loại</SelectItem>
                  {designTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Material */}
              <Select
                value={selectedMaterialName ?? "0"}
                onValueChange={(v) =>
                  setSelectedMaterialName(v && v !== "0" ? String(v) : null)
                }
              >
                <SelectTrigger className="h-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Chất liệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Chọn chất liệu</SelectItem>
                  {materialOptions.map((m: any) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Dimensions */}
              <Input
                placeholder="Kích thước"
                value={dimensionsFilter}
                onChange={(e) => setDimensionsFilter(e.target.value)}
                className="h-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />

              {/* Clear Button - luôn nằm cuối */}
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    setSearchTerm("");
                    setCustomerName("");
                    setSelectedTypeName(null);
                    setSelectedMaterialName(null);
                    setDimensionsFilter("");
                    setCurrentPage(1);
                  }}
                >
                  Làm sạch bộ lọc
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Table) */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : designs.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-slate-500">
              Tìm thấy <span className="font-semibold">{totalCount}</span> kết
              quả
            </div>

            <div className="overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl p-0">
                  <div className="w-full h-[640px] flex items-center justify-center bg-black">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400">No image</div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3">&nbsp;</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Mã thiết kế</th>
                    <th className="px-4 py-3">Tên thiết kế</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Chất liệu</th>
                    <th className="px-4 py-3">Kích thước</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {designs.map((design: any) => (
                    <tr
                      key={design.id}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-4 py-3 align-top">
                        <button
                          onClick={() => openPreview(design.designImageUrl)}
                          className="w-12 h-12 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          {design.designImageUrl ? (
                            <img
                              src={design.designImageUrl}
                              alt={design.designName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {design.customer?.name || "—"}
                      </td>
                      <td className="px-4 py-3 align-top font-mono">
                        {design.code || `DES-${design.id}`}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2 group max-w-[260px]">
                          <div
                            className="whitespace-normal break-words flex-1 text-slate-700 dark:text-slate-300 font-medium"
                            title={design.designName || "Không tên"}
                          >
                            {design.designName || "Không tên"}
                          </div>
                          {design.designName && (
                            <button
                              onClick={() => handleCopyDesignName(design.designName, design.id)}
                              className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-6 w-6 shrink-0"
                              title="Sao chép tên thiết kế"
                            >
                              {copiedDesignId === design.id ? (
                                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {design.designType?.name || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {design.materialType?.name ||
                          design.materialTypeName ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {design.dimensions ||
                          `${design.length || ""} x ${design.width || ""} x ${design.height || ""}`}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-500 text-xs">
                        {design.createdAt
                          ? new Date(design.createdAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3 align-top font-black text-primary">
                        {design.latestUnitPrice
                          ? formatCurrency(design.latestUnitPrice)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Search className="h-10 w-10 mb-2 opacity-20" />
            <p className="font-medium">Không tìm thấy mẫu thiết kế nào</p>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalCount > 0 && (
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Trang {currentPage} / {totalPages} ({totalCount} kết quả)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="h-8 text-xs"
            >
              <ChevronLeft className="h-3 w-3 mr-1" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 text-xs"
            >
              Sau <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
