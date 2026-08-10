import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Copy, Check, Image as ImageIcon } from "lucide-react";
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
import { ImageViewerDialog } from "@/components/design/image-viewer-dialog";

export default function SaleDesignSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [selectedMaterialName, setSelectedMaterialName] = useState<
    string | null
  >(null);
  const [dimensionsFilter, setDimensionsFilter] = useState("");
  const [viewingImage, setViewingImage] = useState<{ url: string; title?: string } | null>(null);
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
          { params: { status: "active" } }
        );
        const payload = res.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.items && Array.isArray(payload.items))
          return payload.items;
        return [];
      }

      // fetch all materials - request a large pageSize to get full list
      const res = await apiRequest.get(API_SUFFIX.MATERIAL_TYPES, {
        params: { pageNumber: 1, pageSize: 100, status: "active" },
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



  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100" >
              Tra cứu thiết kế & Giá
            </h1>
          </div>
        </div>
      </div>

      {/* Filters (card, centered) */}
      <div className="px-6 py-2.5">
        <div className="w-full">
          <div className="rounded-md bg-slate-50 dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 items-center">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên thiết kế, mã thiết kế..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Customer */}
              <Input
                placeholder="Tên khách hàng"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />

              {/* Type */}
              <Select
                value={selectedTypeName ?? "0"}
                onValueChange={(v) =>
                  setSelectedTypeName(v && v !== "0" ? String(v) : null)
                }
              >
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                className="h-8 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />

              {/* Clear Button - luôn nằm cuối */}
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs w-full md:w-auto"
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
      <div className="flex-1 overflow-auto px-6 py-2.5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : designs.length > 0 ? (
          <>

            <div className="overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
              {viewingImage && (
                <ImageViewerDialog
                  open={!!viewingImage}
                  onOpenChange={(open) => {
                    if (!open) setViewingImage(null);
                  }}
                  imageUrl={viewingImage.url}
                  title={viewingImage.title}
                />
              )}
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-3 text-center w-14 shrink-0">Hình ảnh&nbsp;</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">Khách hàng</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 w-[110px] max-w-[115px]">Mã thiết kế</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">Tên thiết kế</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Loại</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Kích thước</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Chất liệu</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right whitespace-nowrap leading-tight">
                      Số lượng<br />đặt
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 text-center whitespace-nowrap">Ngày tạo</th>
                    <th className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right whitespace-nowrap">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {designs.map((design: any) => (
                    <tr
                      key={design.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-3 py-3 align-middle text-center w-14 shrink-0">
                        <button
                          onClick={() => {
                            const url = design.designImageUrl || design.designFileUrl;
                            if (url) {
                              setViewingImage({
                                url,
                                title: design.designName || design.code || `DES-${design.id}`
                              });
                            }
                          }}
                          className="w-9 h-9 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700"
                          disabled={!design.designImageUrl && !design.designFileUrl}
                        >
                          {(design.designImageUrl || design.designFileUrl) ? (
                            <img
                              src={design.designImageUrl || design.designFileUrl}
                              alt={design.designName}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 align-middle max-w-[200px] whitespace-normal break-words font-medium text-slate-800 dark:text-slate-200">
                        {design.customer?.name || "—"}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono font-medium text-slate-800 dark:text-slate-200 w-[110px] max-w-[115px]">
                        {(() => {
                          const code = design.code || `DES-${design.id}`;
                          if (code.includes(" (Hủy mã)")) {
                            const [mainCode] = code.split(" (Hủy mã)");
                            return (
                              <div className="flex flex-col leading-tight">
                                <span>{mainCode}</span>
                                <span className="text-red-500 dark:text-red-400 text-xs font-sans">(Hủy mã)</span>
                              </div>
                            );
                          }
                          if (code.includes("(Hủy mã)")) {
                            const [mainCode] = code.split("(Hủy mã)");
                            return (
                              <div className="flex flex-col leading-tight">
                                <span>{mainCode.trim()}</span>
                                <span className="text-red-500 dark:text-red-400 text-xs font-sans">(Hủy mã)</span>
                              </div>
                            );
                          }
                          return <span className="break-all">{code}</span>;
                        })()}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 group flex-wrap">
                            <div
                              className="whitespace-normal break-words text-slate-900 dark:text-slate-100 font-semibold"
                              title={design.designName || "Không tên"}
                            >
                              {design.designName || "Không tên"}
                            </div>
                            {design.isInBinhBai && (
                              <span
                                className="inline-flex items-center bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200/50 shrink-0 select-none animate-pulse cursor-help"
                                title="Đang bình bài"
                              >
                                BB
                              </span>
                            )}
                            {design.designName && (
                              <button
                                onClick={() => handleCopyDesignName(design.designName, design.id)}
                                className="inline-flex items-center justify-center p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
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
                          {design.notes && (
                            <div
                              className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-normal break-words mt-0.5"
                              title={design.notes}
                            >
                              Ghi chú: {design.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        {design.designType?.name || "—"}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {design.dimensions ||
                          `${design.length || ""} x ${design.width || ""} x ${design.height || ""}`}
                      </td>
                      <td className="px-3 py-3 align-middle text-[13px] whitespace-nowrap">
                        {(() => {
                          const typeName = design.designType?.name || "";
                          const matName = design.materialType?.name || design.materialTypeName || "—";
                          const isDecalDesign = typeName.toLowerCase().includes("decal");
                          const isPaperMaterial = matName.toLowerCase().includes("giấy") || matName.toLowerCase().includes("giay");
                          const isDecalPaper = isDecalDesign && isPaperMaterial;
                          const weightStr = design.basisWeight && !isDecalPaper ? `(${design.basisWeight} gsm)` : null;
                          return (
                            <div className="flex flex-col leading-tight">
                              <span>{matName}</span>
                              {weightStr && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                  {weightStr}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 align-middle font-mono font-medium text-slate-800 dark:text-slate-200 text-right whitespace-nowrap">
                        {(() => {
                          const qty = design.requestedQuantity ?? design.quantity;
                          if (qty == null) return "—";
                          const typeName = design.designType?.name || "";
                          const matName = design.materialType?.name || design.materialTypeName || "";
                          const isDecal = typeName.toLowerCase().includes("decal") || matName.toLowerCase().includes("decal");
                          const isBo = isDecal && (
                            design.sidesClassification === "two_side" ||
                            design.sidesClassificationOption === "two_side" ||
                            (design as any).sidesClassification === "two_side" ||
                            design.unitName?.toLowerCase()?.includes("bộ")
                          );
                          return `${Number(qty).toLocaleString("vi-VN")}${isBo ? " bộ" : ""}`;
                        })()}
                      </td>
                      <td className="px-3 py-3 align-middle text-slate-500 text-[13px] text-center whitespace-nowrap">
                        {design.createdAt
                          ? new Date(design.createdAt).toLocaleDateString(
                            "vi-VN",
                          )
                          : "—"}
                      </td>
                      <td className="px-3 py-3 align-middle font-bold text-primary text-[15px] text-right whitespace-nowrap">
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
            <Search className="h-8 w-8 mb-2 opacity-20" />
            <p className="font-medium text-sm">Không tìm thấy mẫu thiết kế nào</p>
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
