import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { Factory, ChevronLeft, ChevronRight, FileText, Layers, Hash, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productionStepStatusLabels } from "@/lib/status-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProductionOrderResponse, ProductionStepResponse } from "@/Schema";
import { useProofingOrder } from "@/hooks/use-proofing-order";

interface ProductionListTableProps {
  isLoading: boolean;
  productions: ProductionOrderResponse[];
  searchTerm: string;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  pageInput: string;
  tableContainerRef: React.RefObject<HTMLDivElement>;
  onProductionClick: (id: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputBlur: () => void;
}

// Helper to find a specific step
function getStepStatus(
  steps: ProductionStepResponse[] | null | undefined,
  keywords: string[],
  stepTypeMatcher?: string
): ProductionStepResponse | null {
  if (!steps) return null;
  return (
    steps.find((s) => {
      if (stepTypeMatcher && s.stepType === stepTypeMatcher) return true;
      if (s.stepTypeName) {
        const nameLower = s.stepTypeName.toLowerCase();
        return keywords.some((k) => nameLower.includes(k.toLowerCase()));
      }
      return false;
    }) || null
  );
}

// Inner component to render each row and fetch proofing details
function ProductionTableRow({
  prod,
  onClick,
}: {
  prod: ProductionOrderResponse;
  onClick: () => void;
}) {
  const { data: proofingOrder, isLoading } = useProofingOrder(
    prod.proofingOrderId || null,
    !!prod.proofingOrderId
  );

  const steps = prod.steps || [];

  // Extract steps based on requested columns
  const laminationStep = getStepStatus(steps, ["cán màng", "cán"], "lamination");
  const cutStep = getStepStatus(steps, ["cắt"], "cut");
  const pasteStep = getStepStatus(steps, ["bồi"]);
  const dieCutStep = getStepStatus(steps, ["bế"], "die_cut");
  const glueStep = getStepStatus(steps, ["dán"], "glue");
  const checkStep = getStepStatus(steps, ["kiểm hàng", "kiểm tra"]);
  const deliveryStep = getStepStatus(steps, ["giao hàng", "đóng gói", "giao"], "packaging");

  const StepCell = ({ step }: { step: ProductionStepResponse | null }) => {
    if (!step) return <TableCell className="text-center py-3 text-muted-foreground">—</TableCell>;
    return (
      <TableCell className="text-center py-3">
        <StatusBadge
          status={step.status || "pending"}
          label={productionStepStatusLabels[step.status || "pending"] || step.status || "N/A"}
        />
      </TableCell>
    );
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50 border-b" onClick={onClick}>
      <TableCell className="py-3 align-top min-w-[300px]">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        ) : proofingOrder ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                 <h4 className="font-semibold text-sm text-primary">Thông tin bình bài</h4>
                 <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">ID: {prod.id}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-x-2 text-sm">
                <span className="text-muted-foreground">Mã bình bài:</span>
                <span className="font-medium">{proofingOrder.code || `BB${proofingOrder.id}`}</span>
                
                <span className="text-muted-foreground">Chất liệu:</span>
                <span className="font-medium">{proofingOrder.materialType?.name || "N/A"}</span>
                
                <span className="text-muted-foreground">Số giấy in:</span>
                <span className="font-medium">{String(proofingOrder.totalProcessedQty || proofingOrder.totalQuantity || "0")} tờ</span>
              </div>
            </div>

            {proofingOrder.proofingOrderDesigns && proofingOrder.proofingOrderDesigns.length > 0 && (
              <div className="space-y-2 border-t pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Thiết kế ({proofingOrder.proofingOrderDesigns.length})</span>
                <div className="space-y-2">
                  {proofingOrder.proofingOrderDesigns.map((pod) => (
                    <div key={pod.id} className="bg-muted/30 p-2 rounded-md text-sm border">
                      <p className="font-semibold text-foreground mb-1">
                        {pod.design?.designName || pod.design?.code || "N/A"}
                      </p>
                      <div className="flex flex-wrap gap-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Box className="w-3 h-3" />{pod.quantity} sản phẩm</span>
                        {pod.design?.code && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Mã: {pod.design.code}</span>}
                        {pod.design?.dimensions && <span className="break-all flex items-center gap-1"><Layers className="w-3 h-3" />KT: {String(pod.design.dimensions)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Không tìm thấy thông tin bình bài</div>
        )}
      </TableCell>
      <StepCell step={laminationStep} />
      <StepCell step={cutStep} />
      <StepCell step={pasteStep} />
      <StepCell step={dieCutStep} />
      <StepCell step={glueStep} />
      <StepCell step={checkStep} />
      <StepCell step={deliveryStep} />
    </TableRow>
  );
}

export function ProductionListTable({
  isLoading,
  productions,
  searchTerm,
  totalCount,
  currentPage,
  itemsPerPage,
  totalPages,
  pageInput,
  tableContainerRef,
  onProductionClick,
  onPreviousPage,
  onNextPage,
  onPageInputChange,
  onPageInputBlur,
}: ProductionListTableProps) {
  return (
    <div className="relative border-2 border-red-500/50 flex-1 flex flex-col min-h-0">
      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 z-[9999] font-mono pointer-events-none rounded-bl">
        ProductionListTable.tsx
      </div>
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 font-bold text-sm w-[300px]">LỆNH IN</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">CÁN MÀNG</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">CẮT</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">BỒI</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">BẾ</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">DÁN</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">KIỂM HÀNG</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center">GIAO HÀNG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={8} rows={5} rowHeight="h-32" />
            </TableBody>
          </Table>
        ) : productions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Factory className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy đơn sản xuất nào
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 font-bold text-sm w-[300px]">LỆNH IN</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">CÁN MÀNG</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">CẮT</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">BỒI</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">BẾ</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">DÁN</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">KIỂM HÀNG</TableHead>
                <TableHead className="h-10 font-bold text-sm text-center whitespace-nowrap">GIAO HÀNG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((prod: ProductionOrderResponse) => (
                <ProductionTableRow
                  key={prod.id}
                  prod={prod}
                  onClick={() => onProductionClick(prod.id!)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && productions.length > 0 && totalCount > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3 shrink-0 bg-background">
          <div className="text-sm font-medium text-muted-foreground">
            {searchTerm.trim() ? (
              <>
                Hiển thị {productions.length} / {totalCount} đơn sản xuất (đã lọc theo
                từ khóa)
              </>
            ) : (
              <>
                Hiển thị{" "}
                <span className="font-bold text-foreground">
                  {productions.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}
                </span>
                {" - "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-foreground">{totalCount}</span>{" "}
                đơn sản xuất
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onPreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trang trước</span>
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-muted-foreground">
                Trang
              </span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={pageInput}
                onChange={onPageInputChange}
                onBlur={onPageInputBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="w-14 h-8 text-center text-sm font-semibold"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-muted-foreground">
                / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              <span className="hidden sm:inline">Trang sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
