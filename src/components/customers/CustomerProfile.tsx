import { Phone, MapPin, Building2, FileText, Copy, ExternalLink, User, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CustomerResponse } from '@/Schema';

interface CustomerProfileProps {
  customer: CustomerResponse;
  isDesignRole?: boolean;
}

export function CustomerProfile({ customer, isDesignRole = false }: CustomerProfileProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const openMap = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <Card className={cn("h-fit", isDesignRole && "shadow-lg")}>
      <CardHeader className={cn("pb-4", isDesignRole && "pb-6")}>
        <CardTitle className={cn(
          "font-semibold",
          isDesignRole ? "text-2xl font-bold" : "text-base"
        )}>
          Thông tin khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-6", isDesignRole && "space-y-8")}>
        {/* Thông tin cơ bản */}
        <div className={cn("space-y-4", isDesignRole && "space-y-6")}>
          <p className={cn(
            "font-semibold text-foreground uppercase tracking-wide",
            isDesignRole ? "text-base font-bold" : "text-sm"
          )}>
            Thông tin cơ bản
          </p>
          
          <div className={cn("space-y-3", isDesignRole && "space-y-5")}>
            {/* Tên khách hàng */}
            {customer.name ? (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <User className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Tên khách hàng
                  </p>
                  <p className={cn(
                    "font-semibold text-foreground",
                    isDesignRole ? "text-xl font-bold" : "text-base"
                  )}>
                    {customer.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <User className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Tên khách hàng
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isDesignRole ? "text-lg" : "text-base"
                  )}>
                    Chưa có tên
                  </p>
                </div>
              </div>
            )}

            {/* MST */}
            {customer.taxCode ? (
              <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
                <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                  <FileText className={cn(
                    "text-muted-foreground shrink-0",
                    isDesignRole ? "h-5 w-5" : "h-4 w-4"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-muted-foreground mb-0.5",
                      isDesignRole ? "text-sm font-medium" : "text-xs"
                    )}>
                      Mã số thuế
                    </p>
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.taxCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => copyToClipboard(customer.taxCode!, 'mã số thuế')}
                >
                  <Copy className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              </div>
            ) : (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <FileText className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Mã số thuế
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isDesignRole ? "text-lg" : "text-base"
                  )}>
                    Chưa có mã số thuế
                  </p>
                </div>
              </div>
            )}

            {/* Tên công ty - chỉ hiển thị nếu là công ty */}
            {customer.type === 'company' && customer.companyName && (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <Building2 className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Tên công ty
                  </p>
                  <p className={cn(
                    "font-semibold text-foreground",
                    isDesignRole ? "text-xl font-bold" : "text-base"
                  )}>
                    {customer.companyName}
                  </p>
                </div>
              </div>
            )}

            {/* Người đại diện - chỉ hiển thị nếu là công ty */}
            {customer.type === 'company' && customer.representativeName && (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <User className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Người đại diện
                  </p>
                  <p className={cn(
                    "font-semibold text-foreground",
                    isDesignRole ? "text-xl font-bold" : "text-base"
                  )}>
                    {customer.representativeName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Thông tin liên hệ */}
        <div className={cn("space-y-4", isDesignRole && "space-y-6")}>
          <p className={cn(
            "font-semibold text-foreground uppercase tracking-wide",
            isDesignRole ? "text-base font-bold" : "text-sm"
          )}>
            Thông tin liên hệ
          </p>
          
          <div className={cn("space-y-3", isDesignRole && "space-y-5")}>
            {customer.phone ? (
              <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
                <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                  <Phone className={cn(
                    "text-muted-foreground shrink-0",
                    isDesignRole ? "h-5 w-5" : "h-4 w-4"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-muted-foreground mb-0.5",
                      isDesignRole ? "text-sm font-medium" : "text-xs"
                    )}>
                      Số điện thoại
                    </p>
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.phone}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => copyToClipboard(customer.phone!, 'số điện thoại')}
                >
                  <Copy className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              </div>
            ) : (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <Phone className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Số điện thoại
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isDesignRole ? "text-lg" : "text-base"
                  )}>
                    Chưa có số điện thoại
                  </p>
                </div>
              </div>
            )}

            {customer.email ? (
              <div className={cn("flex items-center justify-between group", isDesignRole && "gap-4")}>
                <div className={cn("flex items-center gap-3 flex-1", isDesignRole && "gap-4")}>
                  <Mail className={cn(
                    "text-muted-foreground shrink-0",
                    isDesignRole ? "h-5 w-5" : "h-4 w-4"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-muted-foreground mb-0.5",
                      isDesignRole ? "text-sm font-medium" : "text-xs"
                    )}>
                      Email
                    </p>
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => {
                    window.location.href = `mailto:${customer.email}`;
                  }}
                >
                  <ExternalLink className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              </div>
            ) : (
              <div className={cn("flex items-center gap-3", isDesignRole && "gap-4")}>
                <Mail className={cn(
                  "text-muted-foreground shrink-0",
                  isDesignRole ? "h-5 w-5" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Email
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isDesignRole ? "text-lg" : "text-base"
                  )}>
                    Chưa có email
                  </p>
                </div>
              </div>
            )}

            {customer.address ? (
              <div className={cn("flex items-start justify-between group", isDesignRole && "gap-4")}>
                <div className={cn("flex items-start gap-3 flex-1", isDesignRole && "gap-4")}>
                  <MapPin className={cn(
                    "text-muted-foreground mt-0.5 shrink-0",
                    isDesignRole ? "h-5 w-5 mt-1" : "h-4 w-4"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-muted-foreground mb-0.5",
                      isDesignRole ? "text-sm font-medium" : "text-xs"
                    )}>
                      Địa chỉ
                    </p>
                    <p className={cn(
                      "font-semibold text-foreground",
                      isDesignRole ? "text-xl font-bold" : "text-base"
                    )}>
                      {customer.address}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                    isDesignRole ? "h-8 w-8" : "h-7 w-7"
                  )}
                  onClick={() => openMap(customer.address!)}
                >
                  <ExternalLink className={cn(isDesignRole ? "h-5 w-5" : "h-4 w-4")} />
                </Button>
              </div>
            ) : (
              <div className={cn("flex items-start gap-3", isDesignRole && "gap-4")}>
                <MapPin className={cn(
                  "text-muted-foreground mt-0.5 shrink-0",
                  isDesignRole ? "h-5 w-5 mt-1" : "h-4 w-4"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "text-muted-foreground mb-0.5",
                    isDesignRole ? "text-sm font-medium" : "text-xs"
                  )}>
                    Địa chỉ
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isDesignRole ? "text-lg" : "text-base"
                  )}>
                    Chưa có địa chỉ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
