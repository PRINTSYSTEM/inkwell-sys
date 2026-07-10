import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { stockOutPurposeLabels } from "@/lib/status-utils";

interface StockOutPrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockOut: any;
  partnerName: string;
  partnerAddress: string;
  partnerPhone: string;
  warehouseName: string;
  warehouseAddress: string;
}

export default function StockOutPrintPreviewDialog({
  open,
  onOpenChange,
  stockOut,
  partnerName,
  partnerAddress,
  partnerPhone,
  warehouseName,
  warehouseAddress,
}: StockOutPrintPreviewDialogProps) {
  const [printType, setPrintType] = useState<"A4" | "A5">("A4");

  if (!stockOut) return null;

  const items = stockOut.items || [];
  const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const dateObj = stockOut.stockOutDate
    ? new Date(stockOut.stockOutDate)
    : stockOut.createdAt
    ? new Date(stockOut.createdAt)
    : new Date();
  const day = format(dateObj, "dd");
  const month = format(dateObj, "MM");
  const year = format(dateObj, "yyyy");

  const purposeLower = (stockOut.purpose || stockOut.type || "").toLowerCase();
  const isOutsourcePrint = purposeLower === "outsource" || purposeLower === "outsource_print";

  const creatorName = stockOut.createdBy?.fullName || stockOut.createdByName || "Quản trị viên";

  const handlePrint = () => {
    const printContent = document.getElementById("stock-out-print-area")?.innerHTML;
    if (!printContent) return;

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Define print styles based on A4/A5 selection
    const isA5 = printType === "A5";
    const printStyles = `
      @page {
        size: ${isA5 ? "A5 landscape" : "A4 portrait"};
        margin: 8mm;
      }
      body {
        font-family: "Times New Roman", Times, serif;
        margin: 0;
        padding: 0;
        color: #000;
        background-color: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page {
        width: 100%;
        box-sizing: border-box;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #000;
        padding-bottom: 8px;
        margin-bottom: 15px;
      }
      .company-info-left {
        text-align: left;
        font-size: 11px;
        line-height: 1.45;
        max-width: 500px;
      }
      .company-info-right {
        text-align: right;
        font-size: 11px;
        line-height: 1.45;
        max-width: 300px;
      }
      .company-name {
        font-size: 13.5px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 3px;
      }
      .title-container {
        text-align: center;
        margin-top: 15px;
        margin-bottom: 15px;
      }
      .print-title {
        font-size: 20px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0;
      }
      .print-subtitle {
        font-size: 12px;
        margin-top: 5px;
        display: flex;
        justify-content: center;
        gap: 20px;
      }
      .info-section {
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
      .info-row {
        display: flex;
        align-items: flex-end;
        margin-bottom: 6px;
        width: 100%;
      }
      .info-label {
        font-weight: bold;
        white-space: nowrap;
        margin-right: 5px;
      }
      .info-val-border {
        border-bottom: 1px dotted #000;
        flex: 1;
        padding-bottom: 1px;
        min-height: 18px;
      }
      .info-flex-group {
        display: flex;
        width: 100%;
        gap: 20px;
        margin-bottom: 6px;
      }
      table.print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 15px;
      }
      table.print-table th, table.print-table td {
        border: 1px solid #000;
        padding: 5px 6px;
        font-size: 12px;
        color: #000;
      }
      table.print-table th {
        background-color: #eaeaea !important;
        font-weight: bold;
        text-align: center;
      }
      .text-center { text-align: center !important; }
      .text-right { text-align: right !important; }
      .font-bold { font-weight: bold; }
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 35px;
        padding: 0 10px;
        font-size: 13px;
        font-weight: bold;
      }
      .sig-box {
        width: 30%;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 110px;
      }
      .sig-title {
        font-weight: bold;
      }
      .sig-sub {
        font-size: 10px;
        font-weight: normal;
        font-style: italic;
        color: #555;
        margin-top: 3px;
      }
      .sig-name {
        margin-top: auto;
        font-weight: bold;
      }
    `;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>In Phiếu Xuất Kho</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="print-page">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[850px] overflow-hidden border-stone-200 dark:border-stone-850 flex flex-col bg-white dark:bg-stone-900 p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-50">
              Xem trước Bản in Phiếu xuất kho
            </DialogTitle>
            <p className="text-xs text-stone-500">
              Xem và kiểm tra nội dung trước khi xuất lệnh in trực tiếp ra máy in.
            </p>
          </div>
          <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg mr-6">
            <Button
              variant={printType === "A4" ? "secondary" : "ghost"}
              onClick={() => setPrintType("A4")}
              className="text-xs font-semibold px-3 py-1.5 h-auto rounded-md"
            >
              Mẫu A4 (Dọc)
            </Button>
            <Button
              variant={printType === "A5" ? "secondary" : "ghost"}
              onClick={() => setPrintType("A5")}
              className="text-xs font-semibold px-3 py-1.5 h-auto rounded-md"
            >
              Mẫu A5 (Ngang)
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto bg-stone-100 dark:bg-stone-950 p-6 flex justify-center items-start">
          <div
            className={`bg-white text-black p-8 shadow-md border border-stone-200 print:shadow-none print:border-none print:p-0 transition-all duration-300 ${
              printType === "A4"
                ? "w-[210mm] min-h-[297mm] aspect-[1/1.414]"
                : "w-[210mm] min-h-[148mm] aspect-[1.414/1]"
            }`}
            style={{
              fontFamily: '"Times New Roman", Times, serif',
            }}
          >
            {/* The Print Area */}
            <div id="stock-out-print-area">
              {/* Company info header (No logo) */}
              <div className="header-container flex justify-between items-start border-b-2 border-black pb-3">
                <div className="company-info-left text-left text-[11px] leading-relaxed max-w-[500px]">
                  <div className="company-name text-[13.5px] font-bold uppercase text-stone-900">
                    Đơn vị: CÔNG TY TNHH SX TMDV QUỐC TẾ QUANG ĐẠT
                  </div>
                  <div>Địa chỉ: 97/3 Đường Tân Thới Nhất 8, P. Đông Hưng Thuận, TP. HCM</div>
                </div>
                <div className="company-info-right text-right text-[11px] leading-relaxed max-w-[300px]">
                  <div className="font-bold text-[13.5px]">Mẫu số 02 - VT</div>
                  <div className="italic text-[10px] text-stone-500">
                    (Ban hành theo Thông tư số 200/2014/TT-BTC
                  </div>
                  <div className="italic text-[10px] text-stone-500">
                    Ngày 22/12/2014 của Bộ Tài chính)
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="title-container text-center my-4">
                <h1 className="print-title text-xl font-bold uppercase tracking-wider">
                  PHIẾU XUẤT KHO
                </h1>
                <div className="print-subtitle text-[12px] flex justify-center gap-10 mt-1">
                  <span>Ngày {day} tháng {month} năm {year}</span>
                  <span className="font-bold">Số: {stockOut.code || stockOut.id}</span>
                </div>
              </div>

              {/* Client & Address Info */}
              <div className="info-section text-[13px] leading-normal space-y-1.5 mb-3">
                <div className="info-row">
                  <span className="info-label">- Họ và tên người nhận hàng:</span>
                  <span className="info-val-border font-semibold">{stockOut.receiverName || partnerName || "—"}</span>
                </div>
                {stockOut.purpose?.toLowerCase() !== "production" && (
                  <div className="info-flex-group">
                    <div className="info-row flex-1">
                      <span className="info-label">- Địa chỉ (bộ phận):</span>
                      <span className="info-val-border">{stockOut.receiverAddress || partnerAddress || "—"}</span>
                    </div>
                    <div className="info-row w-[220px] shrink-0">
                      <span className="info-label">SĐT:</span>
                      <span className="info-val-border font-semibold">{partnerPhone || "—"}</span>
                    </div>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">- Lý do xuất kho:</span>
                  <span className="info-val-border">
                    {stockOut.notes || (stockOut.purpose ? stockOutPurposeLabels[stockOut.purpose.toLowerCase()] || stockOut.purpose : "—")}
                  </span>
                </div>
                <div className="info-flex-group">
                  <div className="info-row flex-1">
                    <span className="info-label">- Xuất tại kho:</span>
                    <span className="info-val-border font-semibold">{warehouseName}</span>
                  </div>
                  <div className="info-row flex-[2]">
                    <span className="info-label">Địa điểm:</span>
                    <span className="info-val-border font-semibold">{warehouseAddress}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="print-table w-full border-collapse border border-black text-xs mt-3">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-black text-center p-1 w-10">STT</th>
                    <th className="border border-black text-left p-1">
                      Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sp, hàng hoá
                    </th>
                    <th className="border border-black text-center p-1 w-16">ĐVT</th>
                    <th className="border border-black text-right p-1 w-24">SỐ LƯỢNG</th>
                    <th className="border border-black text-center p-1 w-22">KT cắt (cm)</th>
                    <th className="border border-black text-right p-1 w-18">Hao hụt</th>
                    <th className="border border-black text-left p-1 w-36">GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    const isCuonItem =
                      (item.unit?.toLowerCase().includes("cuộn") ||
                        item.itemName?.toLowerCase().includes("cuộn")) &&
                      !item.itemName?.toLowerCase().includes("m tới");
                    return (
                      <tr key={item.id || index}>
                        <td className="border border-black text-center p-1.5">{index + 1}</td>
                        <td className="border border-black p-1.5 font-bold">
                          <div>{item.itemName || "—"}</div>
                          {item.jobCode && (
                            <div className="text-[10px] font-mono text-stone-500 font-normal mt-0.5">
                              Mã bài: {item.jobCode}
                            </div>
                          )}
                          {isOutsourcePrint && isCuonItem ? " (m tới)" : ""}
                        </td>
                        <td className="border border-black text-center p-1.5">{item.unit || "—"}</td>
                        <td className="border border-black text-right p-1.5 font-bold">
                          {(item.quantity || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className="border border-black text-center p-1.5">
                          {item.cutLength != null ? `${item.cutLength} × ${item.cutWidth}` : "—"}
                        </td>
                        <td className="border border-black text-right p-1.5 font-mono">
                          {item.cutLength != null ? (item.wasteQuantity?.toLocaleString() ?? "0") : "—"}
                        </td>
                        <td className="border border-black p-1.5 italic text-stone-700">
                          {item.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-stone-50">
                    <td className="border border-black text-center p-1.5" colSpan={5}>
                      Cộng
                    </td>
                    <td className="border border-black text-right p-1.5">
                      {totalQuantity.toLocaleString("vi-VN")}
                    </td>
                    <td className="border border-black p-1.5"></td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures Row */}
              <div className="signatures flex justify-between mt-8 text-[13px] text-center font-bold">
                <div className="w-[30%] flex flex-col justify-between min-h-[115px]">
                  <div>
                    <div>Người lập</div>
                    <div className="text-[10px] text-stone-500 font-normal italic mt-0.5">(Ký, họ tên)</div>
                  </div>
                  <div className="font-bold">{creatorName}</div>
                </div>
                <div className="w-[30%] flex flex-col justify-between min-h-[115px]">
                  <div>
                    <div>Người nhận hàng</div>
                    <div className="text-[10px] text-stone-500 font-normal italic mt-0.5">(Ký, họ tên)</div>
                  </div>
                  <div className="opacity-0">—</div>
                </div>
                <div className="w-[30%] flex flex-col justify-between min-h-[115px]">
                  <div>
                    <div>Thủ kho</div>
                    <div className="text-[10px] text-stone-500 font-normal italic mt-0.5">(Ký, họ tên)</div>
                  </div>
                  <div className="opacity-0">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 flex gap-2 p-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="gap-1.5"
          >
            <X className="w-4 h-4" />
            Đóng
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="w-4 h-4" />
            In Phiếu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
