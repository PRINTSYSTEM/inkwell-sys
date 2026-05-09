import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, Calendar } from "lucide-react";
import type { DeliveryNoteResponse, DeliveryNoteLineResponse } from "@/Schema/delivery-note.schema";
import { deliveryFailureTypeLabels } from "@/lib/status-utils";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Thông tin giao hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveryNote.recipientName && (
          <>
            <div>
              <Label className="text-muted-foreground">Người nhận</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{deliveryNote.recipientName}</span>
              </div>
            </div>
            <Separator />
          </>
        )}

        {deliveryNote.recipientPhone && (
          <>
            <div>
              <Label className="text-muted-foreground">Số điện thoại</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{deliveryNote.recipientPhone}</span>
              </div>
            </div>
            <Separator />
          </>
        )}

        {deliveryNote.deliveryAddress && (
          <>
            <div>
              <Label className="text-muted-foreground">Địa chỉ giao hàng</Label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{deliveryNote.deliveryAddress}</span>
              </div>
            </div>
            <Separator />
          </>
        )}

        {uniqueAddresses.length > 0 ? (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Địa chỉ giao hàng (theo dòng)</Label>
              <div className="space-y-3 mt-2">
                {uniqueAddresses.map((a, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium">Địa chỉ giao hàng {idx + 1}{a.label ? ` — ${a.label}` : ""}</div>
                    {a.recipientName && (
                      <div className="text-xs text-muted-foreground">{a.recipientName}{a.recipientPhone ? ` • ${a.recipientPhone}` : ""}</div>
                    )}
                    {a.address && <div className="text-xs text-muted-foreground">{a.address}</div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          !deliveryNote.recipientName && !deliveryNote.deliveryAddress && (
            <p className="text-sm text-muted-foreground">Địa chỉ giao được cấu hình riêng cho từng dòng hàng.</p>
          )
        )}

        {deliveryNote.deliveredAt && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Ngày giao</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDateTime(deliveryNote.deliveredAt)}</span>
              </div>
            </div>
          </>
        )}

        {deliveryNote.confirmedAt && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Xác nhận</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDateTime(deliveryNote.confirmedAt)}</span>
              </div>
            </div>
          </>
        )}

        {deliveryNote.handedOverAt && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Bàn giao</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDateTime(deliveryNote.handedOverAt)}</span>
              </div>
            </div>
          </>
        )}

        {deliveryNote.cancelledAt && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Hủy</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDateTime(deliveryNote.cancelledAt)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
