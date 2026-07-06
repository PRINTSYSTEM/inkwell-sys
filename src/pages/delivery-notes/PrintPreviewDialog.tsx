import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, FileText, Check } from "lucide-react";
import type { DeliveryNoteResponse } from "@/Schema/delivery-note.schema";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNoteResponse;
  showPrice?: boolean;
}

export default function PrintPreviewDialog({
  open,
  onOpenChange,
  deliveryNote,
  showPrice = false,
}: PrintPreviewDialogProps) {
  const [printType, setPrintType] = useState<"A4" | "A5">("A4");

  const lines = deliveryNote.lines || [];
  const today = new Date();
  const dateFormatted = format(today, "'Ngày' dd 'Tháng' MM 'Năm' yyyy", { locale: vi });

  const totalDeliveryQty = lines.reduce((sum, l) => sum + (l.deliveryQty || 0), 0);
  const totalScrapQty = lines.reduce((sum, l) => {
    const scrap = typeof l.scrapQty === "number"
      ? l.scrapQty
      : typeof l.orderedQty === "number" && typeof l.netQtyTotal === "number"
        ? l.orderedQty - l.netQtyTotal
        : 0;
    return sum + scrap;
  }, 0);
  const totalNetQty = lines.reduce((sum, l) => sum + (l.netQtyTotal || l.deliveryQty || 0), 0);

  const totalAmount = lines.reduce((sum, l) => {
    const qty = l.netQtyTotal || l.deliveryQty || 0;
    const price = (l as any).unitPriceSnapshot ?? (l as any).unitPrice ?? (l as any).price ?? 0;
    const amount = (l as any).lineAmount ?? (qty * price);
    return sum + (amount || 0);
  }, 0);

  const handlePrint = () => {
    const printContent = document.getElementById("delivery-note-print-area")?.innerHTML;
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const printStyles = `
      @page {
        size: ${printType === "A4" ? "A4 portrait" : "A5 landscape"};
        margin: 8mm 12mm;
      }
      body {
        font-family: "Times New Roman", Times, serif, Arial, sans-serif;
        color: #000;
        background: #fff;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
      }
      .print-container {
        width: 100%;
        box-sizing: border-box;
      }
      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 150px;
        padding-left: 20px;
        flex-shrink: 0;
      }
      .logo-image {
        height: 70px;
        width: auto;
        object-fit: contain;
      }
      .company-info {
        text-align: center;
        flex: 1;
        padding-right: 24px;
        font-size: 12px;
        line-height: 1.45;
      }
      .company-name {
        font-size: 13.5px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 3px;
        letter-spacing: -0.2px;
      }
      .title-container {
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
        position: relative;
      }
      .print-title {
        font-size: 22px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0;
      }
      .print-subtitle {
        font-size: 13px;
        margin-top: 5px;
        display: flex;
        justify-content: space-between;
        padding: 0 10px;
      }
      .info-section {
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 2px 10px;
      }
      .info-label {
        font-weight: bold;
        white-space: nowrap;
      }
      table.print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 15px;
      }
      table.print-table th, table.print-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        font-size: 13px;
        color: #000;
        text-align: center;
      }
      table.print-table th {
        background-color: #eaeaea !important;
        font-weight: bold;
        text-align: center;
        vertical-align: middle;
      }
      .text-center { text-align: center !important; }
      .text-right { text-align: right !important; }
      .text-left { text-align: left !important; }
      .font-bold { font-weight: bold; }
      .disclaimer {
        font-size: 13px;
        font-weight: bold;
        font-style: italic;
        color: #000;
        margin-top: 8px;
        line-height: 1.35;
      }
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding: 0 40px;
        font-size: 14px;
        font-weight: bold;
      }
    `;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Phiếu Giao Hàng - ${deliveryNote.code || deliveryNote.id}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="print-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing after styles are parsed
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[94vw] h-[85vh] flex flex-col p-6 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-850">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b pb-4">
          <div>
            <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Xem trước Bản in Phiếu giao hàng {showPrice ? "(Có Tiền)" : ""}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Xem và kiểm tra nội dung trước khi xuất lệnh in trực tiếp ra máy in.
            </p>
          </div>
          <div className="flex gap-1.5 bg-muted p-1 rounded-md text-xs font-semibold mr-8">
            <Button
              size="sm"
              variant={printType === "A4" ? "secondary" : "ghost"}
              onClick={() => setPrintType("A4")}
              className="h-7 px-3 text-xs"
            >
              Mẫu A4 (Dọc)
            </Button>
            <Button
              size="sm"
              variant={printType === "A5" ? "secondary" : "ghost"}
              onClick={() => setPrintType("A5")}
              className="h-7 px-3 text-xs"
            >
              Mẫu A5 (Ngang)
            </Button>
          </div>
        </DialogHeader>

        {/* Paper Area wrapper */}
        <div className="flex-1 overflow-auto py-6 flex justify-center bg-stone-200/50 dark:bg-stone-950/40 rounded-lg border border-inner">
          <div
            className={`bg-white text-black p-8 shadow-md border border-stone-300 transition-all duration-300 origin-top ${printType === "A4"
              ? "w-[210mm] min-h-[297mm] aspect-[1/1.414]"
              : "w-[210mm] min-h-[148mm] aspect-[1.414/1]"
              }`}
            style={{
              fontFamily: '"Times New Roman", Times, serif',
            }}
          >
            {/* The Print Area */}
            <div id="delivery-note-print-area">
              {/* Logo & Company info */}
              <div className="header-container flex items-center justify-between border-b-2 border-black pb-3">
                <div className="logo-container flex flex-col items-center justify-center w-[150px] pl-5 shrink-0">
                  <img
                    src="/images/logo.png"
                    alt="QUANG DAT LOGO"
                    className="logo-image h-[70px] w-auto object-contain"
                  />
                </div>
                <div className="company-info text-center flex-1 pr-6 text-[12px] leading-relaxed">
                  <div className="company-name text-[13.5px] font-bold uppercase text-stone-900 tracking-tight">
                    CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI DỊCH VỤ QUỐC TẾ QUANG ĐẠT
                  </div>
                  <div>43D Ao Đôi, P. Bình Trị Đông A, Q. Bình Tân, TP. Hồ Chí Minh</div>
                  <div>MST: 0317703989 - Điện thoại: 0906 649 812</div>
                </div>
              </div>

              {/* Title Section */}
              <div className="title-container text-center mt-3 mb-2 relative">
                <h1 className="print-title text-[22px] font-bold uppercase tracking-wider">
                  PHIẾU GIAO HÀNG
                </h1>
              </div>

              {/* Client & Address Info */}
              <table style={{ width: "100%", border: "none", marginBottom: "12px", fontSize: "14.5px", lineHeight: "1.5", borderCollapse: "collapse", fontFamily: '"Times New Roman", Times, serif' }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ padding: "4px 0" }}>
                      <table style={{ width: "100%", border: "none", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: 0, textAlign: "left", fontStyle: "italic" }}>{dateFormatted}</td>
                            <td style={{ padding: 0, textAlign: "right" }}>
                              <span style={{ fontWeight: "bold" }}>Số phiếu: </span>
                              <span style={{ fontWeight: "900", fontSize: "16px", textDecorationColor: "#a8a29e", textUnderlineOffset: "2px" }}>{deliveryNote.code || deliveryNote.id}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: "105px", fontWeight: "bold", verticalAlign: "top", padding: "4px 0" }}>Khách hàng:</td>
                    <td style={{ textAlign: "left", fontWeight: "bold", textTransform: "uppercase", padding: "4px 0" }}>{deliveryNote.orders?.[0]?.customerName || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", verticalAlign: "top", padding: "4px 0" }}>Địa chỉ:</td>
                    <td style={{ textAlign: "left", padding: "4px 0" }}>{deliveryNote.deliveryAddress || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", verticalAlign: "top", padding: "4px 0" }}>Người nhận:</td>
                    <td style={{ textAlign: "left", padding: "4px 0" }}>
                      <table style={{ width: "100%", border: "none", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: 0, textAlign: "left" }}>{deliveryNote.recipientName || "—"}</td>
                            <td style={{ padding: 0, textAlign: "right", width: "260px" }}>
                              <span style={{ fontWeight: "bold", marginRight: "6px" }}>Số điện thoại:</span>
                              <span style={{ fontWeight: "normal" }}>{deliveryNote.recipientPhone || "—"}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Line Items Table */}
              <table className="print-table w-full border-collapse border border-black text-[13px] mt-3">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-black text-center p-1.5 w-10">STT</th>
                    <th className="border border-black text-center p-1.5">TÊN SẢN PHẨM</th>
                    <th className="border border-black text-center p-1.5 w-12">ĐVT</th>
                    <th className="border border-black text-center p-1.5 w-16 leading-tight">SỐ<br />LƯỢNG</th>
                    <th className="border border-black text-center p-1.5 w-14 leading-tight">PHỤ<br />HAO</th>
                    <th className="border border-black text-center p-1.5 w-16 leading-tight">SL<br />THỰC</th>
                    {showPrice && (
                      <>
                        <th className="border border-black text-center p-1.5 w-18 leading-tight">ĐƠN<br />GIÁ</th>
                        <th className="border border-black text-center p-1.5 w-22 leading-tight">THÀNH<br />TIỀN</th>
                      </>
                    )}
                    <th className="border border-black text-center p-1.5 w-20 leading-tight">GHI<br />CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, index) => {
                    const scrap = typeof l.scrapQty === "number"
                      ? l.scrapQty
                      : typeof l.orderedQty === "number" && typeof l.netQtyTotal === "number"
                        ? l.orderedQty - l.netQtyTotal
                        : 0;
                    const qty = l.netQtyTotal || l.deliveryQty || 0;
                    const price = (l as any).unitPriceSnapshot ?? (l as any).unitPrice ?? (l as any).price ?? 0;
                    const amount = (l as any).lineAmount ?? (qty * price);

                    return (
                      <tr key={l.id || index}>
                        <td className="border border-black text-center p-2">{index + 1}</td>
                        <td className="border border-black p-2 font-medium text-left" style={{ textAlign: "left", paddingLeft: "8px" }}>{l.designName || "—"}</td>
                        <td className="border border-black text-center p-2">Cái</td>
                        <td className="border border-black text-center p-2 font-medium">
                          {(l.deliveryQty || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className="border border-black text-center p-2">
                          {scrap.toLocaleString("vi-VN")}
                        </td>
                        <td className="border border-black text-center p-2 font-bold">
                          {(l.netQtyTotal || l.deliveryQty || 0).toLocaleString("vi-VN")}
                        </td>
                        {showPrice && (
                          <>
                            <td className="border border-black text-center p-2">
                              {(price || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="border border-black text-center p-2 font-semibold">
                              {(amount || 0).toLocaleString("vi-VN")}
                            </td>
                          </>
                        )}
                        <td className="border border-black text-center p-2 italic text-stone-700">
                          {l.note || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-stone-50">
                    <td className="border border-black text-center p-2" colSpan={showPrice ? 7 : 6}>
                      CỘNG TIỀN HÀNG
                    </td>
                    {showPrice && (
                      <td className="border border-black text-center p-2">
                        {totalAmount.toLocaleString("vi-VN")}
                      </td>
                    )}
                    <td className="border border-black text-center p-2"></td>
                  </tr>
                </tbody>
              </table>

              {/* Disclaimer Notice */}
              <div className="disclaimer text-[13px] font-bold italic text-black mt-2 leading-relaxed" style={{ fontSize: "13px", fontWeight: "bold" }}>
                *Quý khách vui lòng kiểm tra kỹ hàng trước khi ký nhận. Quý khách hàng có thắc mắc về lô hàng đã nhận vui lòng liên hệ với chúng tôi trong vòng 7 ngày kể từ ngày nhận hàng.
              </div>

              {/* Signatures Row */}
              <table style={{ width: "100%", border: "none", marginTop: "10px", fontSize: "14px", fontWeight: "bold", textAlign: "center", borderCollapse: "collapse", fontFamily: '"Times New Roman", Times, serif' }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", textAlign: "center", padding: "0px 0" }}>Bên giao</td>
                    <td style={{ width: "50%", textAlign: "center", padding: "0px 0" }}>Bên nhận</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 flex gap-2">
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
