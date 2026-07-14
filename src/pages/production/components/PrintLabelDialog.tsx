import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Loader2, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { PrintLabelResponse } from "@/hooks/use-kcs";

interface PrintLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: number | null;
  itemId: number | null;
  defaultQty: number;
}

export function PrintLabelDialog({
  open,
  onOpenChange,
  poId,
  itemId,
  defaultQty,
}: PrintLabelDialogProps) {
  const [printQty, setPrintQty] = useState<string>(String(defaultQty));

  // Sync printQty when defaultQty changes or dialog opens
  useEffect(() => {
    if (open) {
      setPrintQty(String(defaultQty || 0));
    }
  }, [open, defaultQty]);

  // Fetch label printing data from BE
  const {
    data: labelData,
    isLoading,
    error,
  } = useQuery<PrintLabelResponse>({
    queryKey: ["print-label", poId, itemId],
    enabled: open && poId !== null && itemId !== null,
    queryFn: async () => {
      const res = await apiRequest.get<PrintLabelResponse>(
        API_SUFFIX.PRODUCTION_ORDER_PRINT_LABEL(poId!, itemId!)
      );
      return res.data;
    },
    staleTime: 0,
    retry: false,
  });

  // Handle errors gracefully without blocking the UI
  useEffect(() => {
    if (error) {
      console.error("Lỗi API print-label:", error);
      toast.error("Không thể tải thông tin tem nhãn từ hệ thống!");
      onOpenChange(false);
    }
  }, [error, onOpenChange]);

  const handlePrint = () => {
    if (!labelData) return;

    const qtyNumber = Number(printQty);
    if (isNaN(qtyNumber) || qtyNumber < 0) {
      toast.error("Số lượng in nhãn không hợp lệ!");
      return;
    }

    // Format design image URL
    const formatUrl = (url: string | null | undefined) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");
      const cleanUrl = url.startsWith("/") ? url : `/${url}`;
      return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl;
    };

    const formattedImgUrl = formatUrl(labelData.designImageUrl);

    // Create an invisible iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.error("Không thể tạo cửa sổ in!");
      document.body.removeChild(iframe);
      return;
    }

    const printStyles = `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body, body * {
        font-family: "Times New Roman", Times, serif !important;
      }
      body {
        width: 80mm;
        margin: 0;
        padding: 5mm;
        box-sizing: border-box;
        color: #000;
        background: #fff;
        -webkit-print-color-adjust: exact;
      }
      .label-box {
        width: 100%;
        border: 2px solid #000;
        padding: 3mm;
        box-sizing: border-box;
        border-radius: 4px;
      }
      .label-title {
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 4mm;
        border-bottom: 2px solid #000;
        padding-bottom: 2mm;
      }
      .label-body {
        display: flex;
        gap: 3mm;
        align-items: flex-start;
      }
      .label-info {
        flex: 1;
        min-width: 0;
      }
      .label-row {
        margin-bottom: 2.5mm;
        font-size: 12px;
        line-height: 1.3;
        display: flex;
      }
      .label-row:last-child {
        margin-bottom: 0;
      }
      .label-lbl {
        font-weight: bold;
        width: 24mm;
        flex-shrink: 0;
      }
      .label-val {
        flex: 1;
        word-break: break-word;
      }
      .label-val-code {
        font-size: 13px;
        font-weight: bold;
      }
      .label-val-qty {
        font-size: 18px;
        font-weight: 900;
      }
      .label-img-container {
        width: 22mm;
        height: 22mm;
        border: 1px solid #000;
        padding: 0.5mm;
        box-sizing: border-box;
        flex-shrink: 0;
        background: #fff;
      }
      .label-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .label-footer {
        margin-top: 4mm;
        border-top: 1px dashed #000;
        padding-top: 2mm;
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        font-weight: bold;
      }
    `;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Tem Nhãn Thùng - ${labelData.designCode || "Label"}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="label-box">
            <div class="label-title">THÔNG TIN ĐÓNG GÓI</div>
            <div class="label-body">
              <div class="label-info">
                <div class="label-row">
                  <span class="label-lbl">Khách hàng:</span>
                  <span class="label-val">${labelData.customerName || "—"}</span>
                </div>
                <div class="label-row">
                  <span class="label-lbl">Mã hàng:</span>
                  <span class="label-val label-val-code">${labelData.designCode || "—"}</span>
                </div>
                <div class="label-row">
                  <span class="label-lbl">Tên hàng:</span>
                  <span class="label-val">${labelData.designName || "—"}</span>
                </div>
                <div class="label-row">
                  <span class="label-lbl">Số lượng:</span>
                  <span class="label-val label-val-qty">${qtyNumber.toLocaleString("vi-VN")}</span>
                </div>
              </div>
              ${
                formattedImgUrl
                  ? `
              <div class="label-img-container">
                <img src="${formattedImgUrl}" class="label-img" />
              </div>
              `
                  : ""
              }
            </div>
            <div class="label-footer">
              <span>Người kiểm: QC KCS</span>
              <span>Ngày in: ${new Date().toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
      toast.success("Đã mở lệnh in nhiệt!");
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-md font-bold">
            <FileText className="w-5 h-5 text-primary" />
            Xem trước & In nhãn thùng hàng
          </DialogTitle>
          <DialogDescription className="text-xs">
            Kiểm tra thông tin chi tiết của thùng hàng và click "In Nhãn" để gửi tới máy in bill/nhiệt.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Đang tải thông tin nhãn...</span>
          </div>
        ) : labelData ? (
          <div className="space-y-4 py-2">
            {/* Front-end Form for setting print quantity */}
            <div className="flex flex-col gap-1.5 bg-muted/40 p-2.5 rounded border">
              <Label htmlFor="print-qty" className="text-xs font-bold text-slate-700">
                Số lượng trên nhãn
              </Label>
              <Input
                id="print-qty"
                type="number"
                value={printQty}
                onChange={(e) => setPrintQty(e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="h-8 text-xs font-bold tabular-nums"
                min="0"
              />
              <p className="text-[10px] text-muted-foreground">
                Mặc định lấy từ số lượng KCS báo ra. Bạn có thể sửa nếu đóng thùng lẻ.
              </p>
            </div>

            {/* Label preview inside Dialog */}
            <div
              id="label-preview-container"
              className="border border-slate-300 rounded p-3 bg-white text-black shadow-sm mx-auto w-full max-w-[320px]"
            >
              <style dangerouslySetInnerHTML={{ __html: `
                #label-preview-container,
                #label-preview-container * {
                  font-family: "Times New Roman", Times, serif !important;
                }
              ` }} />
              <div className="text-center font-bold text-sm border-b pb-1.5 uppercase tracking-wide">
                THÔNG TIN ĐÓNG GÓI
              </div>
              <div className="flex gap-2.5 mt-3 items-start">
                <div className="flex-1 min-w-0 text-[11px] space-y-1.5">
                  <div>
                    <span className="font-semibold block text-slate-500 text-[10px] uppercase">
                      Khách hàng
                    </span>
                    <span className="font-bold text-slate-800 break-words">
                      {labelData.customerName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500 text-[10px] uppercase">
                      Mã hàng
                    </span>
                    <span className="font-bold text-slate-900 break-all">
                      {labelData.designCode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500 text-[10px] uppercase">
                      Tên hàng
                    </span>
                    <span className="font-medium text-slate-800 break-words leading-snug">
                      {labelData.designName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500 text-[10px] uppercase">
                      Số lượng
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      {Number(printQty || 0).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {labelData.designImageUrl && (
                  <div className="w-16 h-16 border rounded bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={
                        labelData.designImageUrl.startsWith("http")
                          ? labelData.designImageUrl
                          : `${
                              (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "")
                            }/${labelData.designImageUrl.replace(/^\//, "")}`
                      }
                      alt="design"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-1 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-semibold">Lỗi tải dữ liệu tem in.</span>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-end border-t pt-3 mt-1.5">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !labelData}
            className="gap-1.5 font-bold"
          >
            <Printer className="w-4 h-4" />
            In Nhãn (Thermal)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
