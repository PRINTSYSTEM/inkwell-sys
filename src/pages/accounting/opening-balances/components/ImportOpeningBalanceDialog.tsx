import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useImportCustomerOpeningBalances, useImportVendorOpeningBalances } from "@/hooks/use-opening-balance";
import { Loader2, Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";

interface ImportOpeningBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "customer" | "vendor";
}

export function ImportOpeningBalanceDialog({
  open,
  onOpenChange,
  type,
}: ImportOpeningBalanceDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ totalCount: number; totalAmount: number }>({
    totalCount: 0,
    totalAmount: 0,
  });

  const [parseError, setParseError] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const importCustomerBalances = useImportCustomerOpeningBalances();
  const importVendorBalances = useImportVendorOpeningBalances();

  const isImporting = importCustomerBalances.isPending || importVendorBalances.isPending;

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setPreviewRows([]);
    setSummary({ totalCount: 0, totalAmount: 0 });
    setParseError(null);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert Excel date serial number to string
  const parseExcelDate = (serial: any) => {
    if (typeof serial === "number") {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().substring(0, 10);
    }
    if (typeof serial === "string") {
      // If matches YYYY-MM-DD or DD/MM/YYYY
      const parts = serial.split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
        // DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    return new Date().toISOString().substring(0, 10);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    setFile(selectedFile);
    setParseError(null);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length === 0) {
          throw new Error("File Excel không chứa dữ liệu.");
        }

        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const row = data[i];
          if (row.some(cell => typeof cell === "string" && (
            cell.includes("Mã khách hàng") || 
            cell.includes("Mã NCC") || 
            cell.includes("Mã nhà cung cấp") ||
            cell.includes("Mã đối tác")
          ))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Default to row 1 (index 1) if not found, since row 0 might be instructions
          headerRowIndex = data.length > 1 ? 1 : 0;
        }

        const headers = data[headerRowIndex];
        
        // Map headers to indices
        let codeIdx = -1;
        let nameIdx = -1;
        let dateIdx = -1;
        let amountIdx = -1;
        let noteIdx = -1;

        headers.forEach((h: any, idx: number) => {
          if (!h) return;
          const hStr = h.toString().toLowerCase().trim();
          if (hStr.includes("mã khách hàng") || hStr.includes("mã ncc") || hStr.includes("mã nhà cung cấp") || hStr.includes("mã đối tác")) {
            codeIdx = idx;
          } else if (hStr.includes("tên khách hàng") || hStr.includes("tên ncc") || hStr.includes("tên nhà cung cấp") || hStr.includes("tên đối tác")) {
            nameIdx = idx;
          } else if (hStr.includes("ngày") || hStr.includes("hiệu lực") || hStr.includes("asofdate")) {
            dateIdx = idx;
          } else if (hStr.includes("dư nợ") || hStr.includes("số dư") || hStr.includes("amount") || hStr.includes("đầu kỳ")) {
            amountIdx = idx;
          } else if (hStr.includes("ghi chú") || hStr.includes("note")) {
            noteIdx = idx;
          }
        });

        // If Code or Amount indices not found, throw error
        if (codeIdx === -1) {
          throw new Error("Không tìm thấy cột chứa Mã khách hàng hoặc Mã nhà cung cấp.");
        }
        if (amountIdx === -1) {
          throw new Error("Không tìm thấy cột số dư nợ đầu kỳ.");
        }

        // Process rows after header
        const itemsList: any[] = [];
        let totalSum = 0;

        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const partnerCode = row[codeIdx]?.toString().trim();
          if (!partnerCode) continue; // Skip empty rows

          // Parse amount
          let amtVal = row[amountIdx];
          if (typeof amtVal === "string") {
            amtVal = parseFloat(amtVal.replace(/[^\d.\-]/g, ""));
          }
          const amount = isNaN(amtVal) ? 0 : amtVal;

          // Parse date
          const dateVal = row[dateIdx];
          const parsedDate = parseExcelDate(dateVal);

          // Parse note
          const note = noteIdx !== -1 ? row[noteIdx]?.toString() || "" : "";

          // Partner name for preview
          const partnerName = nameIdx !== -1 ? row[nameIdx]?.toString() || "" : "";

          itemsList.push({
            partnerCode,
            partnerName,
            amount,
            asOfDate: parsedDate,
            note,
          });

          totalSum += amount;
        }

        if (itemsList.length === 0) {
          throw new Error("Không tìm thấy hàng dữ liệu hợp lệ nào dưới dòng tiêu đề.");
        }

        setParsedData(itemsList);
        setPreviewRows(itemsList.slice(0, 5));
        setSummary({
          totalCount: itemsList.length,
          totalAmount: totalSum,
        });

      } catch (err: any) {
        setParseError(err.message || "Không thể parse file Excel. Vui lòng kiểm tra lại định dạng file.");
        setFile(null);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    try {
      setImportErrors([]);
      if (type === "customer") {
        const payload = parsedData.map(item => ({
          customerCode: item.partnerCode,
          amount: item.amount,
          asOfDate: `${item.asOfDate}T00:00:00`,
          note: item.note || null,
        }));
        const res = await importCustomerBalances.mutateAsync(payload);
        if (res.errorCount > 0) {
          setImportErrors(res.errors || []);
        } else {
          onOpenChange(false);
          handleReset();
        }
      } else {
        const payload = parsedData.map(item => ({
          vendorCode: item.partnerCode,
          amount: item.amount,
          asOfDate: `${item.asOfDate}T00:00:00`,
          note: item.note || null,
        }));
        const res = await importVendorBalances.mutateAsync(payload);
        if (res.errorCount > 0) {
          setImportErrors(res.errors || []);
        } else {
          onOpenChange(false);
          handleReset();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Dialog open={open} onOpenChange={(openVal) => {
      if (!openVal) handleReset();
      onOpenChange(openVal);
    }}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            Import số dư đầu kỳ {type === "customer" ? "khách hàng" : "nhà cung cấp"} từ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload Zone */}
          {!file && (
            <div
              className="border-2 border-dashed border-slate-300 dark:border-stone-700 rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-stone-900/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-sm">Nhấp để chọn hoặc kéo thả file Excel</p>
              <p className="text-xs text-muted-foreground">Chỉ chấp nhận file .xlsx hoặc .xls</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi định dạng</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Excel details preview */}
          {file && parsedData.length > 0 && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-stone-900 rounded-lg border border-slate-200 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-red-500 hover:text-red-600">
                  Chọn file khác
                </Button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                  <p className="text-xs text-blue-600 font-semibold">TỔNG ĐỐI TÁC</p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-200 mt-1">{summary.totalCount}</p>
                </div>
                <div className="p-3 bg-orange-50/50 dark:bg-orange-950/10 rounded-lg border border-orange-100 dark:border-orange-900/30 text-center">
                  <p className="text-xs text-orange-600 font-semibold">TỔNG DƯ NỢ</p>
                  <p className="text-xl font-bold text-orange-800 dark:text-orange-200 mt-1">{formatCurrency(summary.totalAmount)}</p>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Xem trước 5 hàng đầu tiên</p>
                <div className="border border-slate-200 dark:border-stone-800 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-stone-900">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">STT</TableHead>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên đối tác</TableHead>
                        <TableHead className="text-right">Số dư đầu kỳ</TableHead>
                        <TableHead className="text-center">Ngày hiệu lực</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center font-mono text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-semibold font-mono text-xs text-slate-800 dark:text-stone-300">{row.partnerCode}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate" title={row.partnerName}>{row.partnerName || "—"}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold">{formatCurrency(row.amount)}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{row.asOfDate}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{row.note || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Import errors from server */}
          {importErrors.length > 0 && (
            <Alert variant="destructive" className="max-h-48 overflow-y-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi Import từ Server (Dữ liệu chưa được ghi nhận vào DB)</AlertTitle>
              <AlertDescription className="mt-2 space-y-1">
                {importErrors.map((err, idx) => (
                  <div key={idx} className="text-xs border-b border-red-200 dark:border-red-900/30 pb-1">
                    Dòng <strong>{err.rowIndex}</strong>: Mã <strong>{err.code}</strong> - {err.message}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { handleReset(); onOpenChange(false); }} disabled={isImporting}>
            Hủy
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || parsedData.length === 0 || importErrors.length > 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang import...
              </>
            ) : (
              "Lưu dữ liệu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
