import { FileText } from "lucide-react";
import type { DesignItem } from "@/types/proofing";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-components";
import { PrepressOrderRow } from "./PrepressOrderRow";

interface PrepressOrdersTableProps {
  title: string;
  count: number;
  orders: any[];
  loading: boolean;
  shouldShowExpand: boolean;
  expandedOrderIds: Set<number>;
  searchTermLower: string;
  debouncedSearchTerm: string;
  onNavigate: (id: number) => void;
  tableRef?: React.RefObject<HTMLDivElement>;
}

export function PrepressOrdersTable({
  title,
  count,
  orders,
  loading,
  shouldShowExpand,
  expandedOrderIds,
  searchTermLower,
  debouncedSearchTerm,
  onNavigate,
  tableRef,
}: PrepressOrdersTableProps) {
  return (
    <div >
      <div className="relative flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
        <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
          <h3 className="text-sm font-semibold text-foreground">
            {title} ({count})
          </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div ref={tableRef} className="w-full">
              <div className="w-full overflow-x-auto p-4">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      {shouldShowExpand && (
                        <TableHead className="h-10 text-sm font-bold w-12"></TableHead>
                      )}
                      <TableHead className="h-10 text-sm font-bold w-12">
                        Ảnh
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Mã bài
                      </TableHead>

                      <TableHead className="h-10 text-sm font-bold">
                        Chất liệu
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Quy cách
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Trạng thái
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Xuất kẽm
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Xuất khuôn
                      </TableHead>
                      <TableHead className="h-10 text-sm font-bold">
                        Ngày tạo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton
                        cols={shouldShowExpand ? 9 : 8}
                        rows={5}
                        rowHeight="h-14"
                      />
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={shouldShowExpand ? 9 : 8}
                          className="py-10"
                        >
                          <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground opacity-60" />
                            <p className="text-sm font-semibold text-muted-foreground">
                              Không có {title.toLowerCase()}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <PrepressOrderRow
                          key={order.id}
                          order={order}
                          shouldShowExpand={shouldShowExpand}
                          searchTermLower={searchTermLower}
                          debouncedSearchTerm={debouncedSearchTerm}
                          onNavigate={onNavigate}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
