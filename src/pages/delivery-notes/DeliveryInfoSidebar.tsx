import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Phone, MapPin, Calendar, Building2 } from "lucide-react";
import type { DeliveryNoteResponse } from "@/Schema/delivery-note.schema";

export default function DeliveryInfoSidebar({
  deliveryNote,
  uniqueAddresses,
  formatDateTime,
}: {
  deliveryNote: DeliveryNoteResponse;
  uniqueAddresses: Array<any>;
  formatDateTime: (d?: string | null) => string;
}) {
  return (
    <Card className="w-full bg-card shadow-sm border border-stone-200 dark:border-stone-800">
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-sm">
          {/* Customer / Company */}
          <div className="md:col-span-3 space-y-3">
            <div>
              <Label className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Khách hàng</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Building2 className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {deliveryNote.orders?.[0]?.customerName || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Recipient */}
          {deliveryNote.recipientName && (
            <div className="md:col-span-3 space-y-3">
              <div>
                <Label className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Người nhận</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <User className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{deliveryNote.recipientName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Phone */}
          {deliveryNote.recipientPhone && (
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Số điện thoại</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="font-medium text-stone-850 dark:text-stone-200">{deliveryNote.recipientPhone}</span>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {deliveryNote.deliveryAddress && (
            <div className="md:col-span-4 space-y-3">
              <div>
                <Label className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Địa chỉ giao hàng</Label>
                <div className="flex items-start gap-2 mt-1.5">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span className="text-stone-800 dark:text-stone-250 leading-snug break-words">{deliveryNote.deliveryAddress}</span>
                </div>
              </div>
            </div>
          )}

          {/* Line-level addresses */}
          {uniqueAddresses.length > 0 && (
            <div className="col-span-12 mt-2 pt-3 border-t border-stone-100 dark:border-stone-800/60">
              <Label className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Địa chỉ giao hàng (theo mặt hàng)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {uniqueAddresses.map((a, idx) => (
                  <div key={idx} className="text-xs p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/40">
                    <div className="font-semibold text-stone-800 dark:text-stone-200">Địa chỉ {idx + 1}{a.label ? ` — ${a.label}` : ""}</div>
                    {a.recipientName && (
                      <div className="text-stone-500 dark:text-stone-400 mt-1">{a.recipientName}{a.recipientPhone ? ` • ${a.recipientPhone}` : ""}</div>
                    )}
                    {a.address && <div className="text-stone-500 dark:text-stone-400 mt-0.5 truncate" title={a.address}>{a.address}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Dates in one clean horizontal list */}
          {(deliveryNote.confirmedAt || deliveryNote.handedOverAt || deliveryNote.deliveredAt || deliveryNote.cancelledAt) && (
            <div className="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 pt-3 border-t border-stone-100 dark:border-stone-800/60 text-xs">
              {deliveryNote.confirmedAt && (
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <div>
                    <span className="font-medium text-stone-400">Xác nhận:</span>{" "}
                    <span className="font-semibold">{formatDateTime(deliveryNote.confirmedAt)}</span>
                  </div>
                </div>
              )}
              {deliveryNote.handedOverAt && (
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <div>
                    <span className="font-medium text-stone-400">Bàn giao:</span>{" "}
                    <span className="font-semibold">{formatDateTime(deliveryNote.handedOverAt)}</span>
                  </div>
                </div>
              )}
              {deliveryNote.deliveredAt && (
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <div>
                    <span className="font-medium text-stone-400">Giao hàng:</span>{" "}
                    <span className="font-semibold">{formatDateTime(deliveryNote.deliveredAt)}</span>
                  </div>
                </div>
              )}
              {deliveryNote.cancelledAt && (
                <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <div>
                    <span className="font-medium text-stone-400">Hủy:</span>{" "}
                    <span className="font-semibold">{formatDateTime(deliveryNote.cancelledAt)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
