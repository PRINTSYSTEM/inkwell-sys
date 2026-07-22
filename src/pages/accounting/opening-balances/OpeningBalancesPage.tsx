import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCustomerOpeningBalances,
  useVendorOpeningBalances,
  useDeleteCustomerOpeningBalance,
  useDeleteVendorOpeningBalance,
  useDownloadOpeningBalanceTemplate,
} from "@/hooks/use-opening-balance";
import { EditOpeningBalanceDialog } from "./components/EditOpeningBalanceDialog";
import { ImportOpeningBalanceDialog } from "./components/ImportOpeningBalanceDialog";
import {
  Search,
  Plus,
  Download,
  Upload,
  Edit2,
  Trash2,
  Scale,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export default function OpeningBalancesPage() {
  const [activeTab, setActiveTab] = useState<"customer" | "vendor">("customer");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // API hooks
  const {
    data: customerBalances,
    isLoading: loadingCustomers,
    refetch: refetchCustomers,
  } = useCustomerOpeningBalances();

  const {
    data: vendorBalances,
    isLoading: loadingVendors,
    refetch: refetchVendors,
  } = useVendorOpeningBalances();

  const deleteCustomerBalance = useDeleteCustomerOpeningBalance();
  const deleteVendorBalance = useDeleteVendorOpeningBalance();
  const downloadTemplate = useDownloadOpeningBalanceTemplate();

  const isDeleting = deleteCustomerBalance.isPending || deleteVendorBalance.isPending;

  const handleEdit = (item: any) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa số dư đầu kỳ của đối tác này?")) {
      if (activeTab === "customer") {
        await deleteCustomerBalance.mutateAsync(id);
      } else {
        await deleteVendorBalance.mutateAsync(id);
      }
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate.mutate(activeTab === "customer" ? "customers" : "vendors");
  };

  const refetchData = () => {
    if (activeTab === "customer") {
      refetchCustomers();
    } else {
      refetchVendors();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr.substring(0, 10);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "HH:mm dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const filteredItems = useMemo(() => {
    const list = activeTab === "customer" ? customerBalances : vendorBalances;
    if (!list) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (item: any) =>
        item.customerCode?.toLowerCase().includes(query) ||
        item.customerName?.toLowerCase().includes(query) ||
        item.vendorCode?.toLowerCase().includes(query) ||
        item.vendorName?.toLowerCase().includes(query)
    );
  }, [activeTab, customerBalances, vendorBalances, searchQuery]);

  const isLoading = activeTab === "customer" ? loadingCustomers : loadingVendors;

  return (
    <>
      <Helmet>
        <title>Quản lý số dư đầu kỳ | Print System</title>
      </Helmet>

      <div className="space-y-4 flex flex-col h-full overflow-hidden">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Thiết lập số dư đầu kỳ (Opening Balances)
            </h1>
            <p className="text-xs text-muted-foreground">
              Quản lý số dư nợ đầu kỳ ban đầu của Khách hàng & Nhà cung cấp. Dữ liệu sẽ cập nhật vào công nợ hiện tại.
            </p>
          </div>
        </div>

        {/* Tabs Control */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as "customer" | "vendor");
            setSearchQuery("");
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-stone-900 p-3 rounded-lg border border-slate-200 dark:border-stone-800 shadow-sm flex-shrink-0">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="customer" className="w-full sm:w-auto text-xs px-4">
                Khách hàng
              </TabsTrigger>
              <TabsTrigger value="vendor" className="w-full sm:w-auto text-xs px-4">
                Nhà cung cấp
              </TabsTrigger>
            </TabsList>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48 md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã, tên đối tác..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Button variant="outline" size="sm" onClick={refetchData} className="h-8 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="h-8 text-xs font-semibold border-slate-200 dark:border-stone-850 hover:bg-slate-50 dark:hover:bg-stone-900 text-slate-700 dark:text-stone-300"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Tải Excel mẫu
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
                className="h-8 text-xs font-semibold border-emerald-200 dark:border-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Import Excel
              </Button>

              <Button size="sm" onClick={handleAdd} className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Thêm số dư
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 mt-3">
            <TabsContent value="customer" className="mt-0 h-full flex flex-col">
              <OpeningBalanceTable
                data={filteredItems}
                isLoading={isLoading}
                type="customer"
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
              />
            </TabsContent>

            <TabsContent value="vendor" className="mt-0 h-full flex flex-col">
              <OpeningBalanceTable
                data={filteredItems}
                isLoading={isLoading}
                type="vendor"
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit opening balance Dialog */}
      <EditOpeningBalanceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        type={activeTab}
        item={editItem}
      />

      {/* Excel Import Dialog */}
      <ImportOpeningBalanceDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type={activeTab}
      />
    </>
  );
}

interface TableProps {
  data: any[];
  isLoading: boolean;
  type: "customer" | "vendor";
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  formatCurrency: (val: number) => string;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
}

function OpeningBalanceTable({
  data,
  isLoading,
  type,
  onEdit,
  onDelete,
  isDeleting,
  formatCurrency,
  formatDate,
  formatDateTime,
}: TableProps) {
  if (isLoading) {
    return (
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 overflow-auto">
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800">
        <Scale className="h-10 w-10 text-slate-350 dark:text-stone-700 mb-2 opacity-50" />
        <p className="font-semibold text-sm">Chưa có số dư đầu kỳ nào</p>
        <p className="text-xs text-muted-foreground mt-1">
          Bấm "Import Excel" hoặc "Thêm số dư" để thiết lập số dư đầu kỳ.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-stone-800 shadow-xs bg-white dark:bg-stone-900">
      <CardContent className="p-0 flex-1 overflow-auto">
        <Table className="border-collapse min-w-[1000px]">
          <TableHeader className="sticky top-0 bg-slate-50 dark:bg-stone-900 border-b border-slate-200 dark:border-stone-800 z-10">
            <TableRow>
              <TableHead className="w-[60px] text-center">STT</TableHead>
              <TableHead className="w-[120px]">Mã đối tác</TableHead>
              <TableHead>Tên đối tác</TableHead>
              <TableHead className="text-right w-[150px]">Số dư đầu kỳ</TableHead>
              <TableHead className="text-center w-[120px]">Ngày hiệu lực</TableHead>
              <TableHead className="min-w-[150px]">Ghi chú</TableHead>
              <TableHead className="w-[140px]">Người tạo</TableHead>
              <TableHead className="w-[140px]">Ngày tạo</TableHead>
              <TableHead className="text-center w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const code = type === "customer" ? item.customerCode : item.vendorCode;
              const name = type === "customer" ? item.customerName : item.vendorName;
              const partnerId = type === "customer" ? item.customerId : item.vendorId;

              const isPositive = item.amount > 0;
              const isNegative = item.amount < 0;

              return (
                <TableRow key={item.id || idx}>
                  <TableCell className="text-center font-mono text-xs text-slate-500">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-stone-300">
                    {code || partnerId || "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-slate-900 dark:text-stone-50 max-w-[200px] truncate" title={name}>
                    {name || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    <span
                      className={
                        isPositive
                          ? "text-orange-600 dark:text-orange-400"
                          : isNegative
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500"
                      }
                    >
                      {formatCurrency(item.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-slate-700 dark:text-stone-300">
                    {formatDate(item.asOfDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-650 max-w-[200px] truncate" title={item.note}>
                    {item.note || <span className="italic text-muted-foreground">Không có</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-stone-400">
                    {item.createdByName || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-650 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => onDelete(partnerId)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
