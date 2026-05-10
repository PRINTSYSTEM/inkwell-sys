import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAPDetailLedger } from "@/hooks/use-ar-ap";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface VendorHistoryTabProps {
  vendorId: number;
}

export function VendorHistoryTab({ vendorId }: VendorHistoryTabProps) {
  const { data, isLoading } = useAPDetailLedger(vendorId, {
    pageNumber: 1,
    pageSize: 100, // Lấy 100 giao dịch gần nhất
  });

  const items = data?.items || [];

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Sổ chi tiết công nợ</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Xuất dữ liệu
        </Button>
      </div>

      <Card className="flex-1 border-0 shadow-sm flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[120px] font-semibold">Ngày ghi sổ</TableHead>
                <TableHead className="w-[150px] font-semibold">Số chứng từ</TableHead>
                <TableHead className="font-semibold">Loại chứng từ</TableHead>
                <TableHead className="text-right w-[150px] font-semibold">Phát sinh Nợ</TableHead>
                <TableHead className="text-right w-[150px] font-semibold">Phát sinh Có</TableHead>
                <TableHead className="text-right w-[150px] font-semibold">Số dư cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground h-[200px]">
                    <div className="flex flex-col items-center justify-center">
                      <p className="font-medium text-foreground mb-1">Chưa có giao dịch nào</p>
                      <p className="text-sm">Nhà cung cấp này chưa phát sinh giao dịch công nợ</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any, index: number) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      {item.date ? format(new Date(item.date), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {item.documentNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {item.documentType || "—"}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.debit > 0 ? item.debit.toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {item.credit > 0 ? item.credit.toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.balanceAfter !== undefined ? item.balanceAfter.toLocaleString("vi-VN") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
