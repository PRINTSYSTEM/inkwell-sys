import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Package, 
  Maximize2, 
  User, 
  DollarSign, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { useDesignsSale } from "@/hooks/use-design";
import { formatCurrency } from "@/lib/status-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SaleDesignSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useDesignsSale({
    search: debouncedSearch,
    pageNumber: currentPage,
    pageSize: pageSize,
  });

  const designs = data?.items ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Search Header Area */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tra cứu thiết kế & Giá
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tìm mẫu thiết kế và xem báo giá đơn vị gần nhất
          </p>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Tìm theo tên thiết kế, kích thước (10x20...), mã thiết kế hoặc tên khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-primary text-base"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-none">
                <Skeleton className="h-40 w-full" />
                <CardHeader className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : designs.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-slate-500">
              Tìm thấy <span className="font-semibold">{totalCount}</span> kết quả
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {designs.map((design) => (
                <Card 
                  key={design.id} 
                  className="group border border-slate-200 dark:border-slate-800 shadow-none hover:border-primary/50 transition-colors bg-white dark:bg-slate-900 flex flex-col"
                >
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                    {design.designImageUrl ? (
                      <img 
                        src={design.designImageUrl} 
                        alt={design.designName}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8 mb-1 opacity-20" />
                        <span className="text-[10px] uppercase opacity-40">No Image</span>
                      </div>
                    )}
                    <Badge variant="outline" className="absolute top-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-[10px]">
                      {design.designType?.name || "N/A"}
                    </Badge>
                  </div>

                  <div className="p-4 flex-1 flex flex-col space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 text-sm mb-0.5 break-all">
                        {design.designName || "Không tên"}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {design.code || `DES-${design.id}`}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Maximize2 className="h-3 w-3" /> Size:
                        </span>
                        <span className="font-medium">
                          {design.dimensions || `${design.length}x${design.width}x${design.height}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3" /> Khách:
                        </span>
                        <span className="font-medium truncate max-w-[120px]" title={design.customer?.name}>
                          {design.customer?.name || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Giá gần nhất</span>
                        <span className="text-base font-black text-primary">
                          {design.latestUnitPrice ? formatCurrency(design.latestUnitPrice) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
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
