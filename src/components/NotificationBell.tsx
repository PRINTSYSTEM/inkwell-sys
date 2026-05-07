import React, { useState, useEffect } from "react";
import { Bell, MoreHorizontal, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDebtNotifications } from "@/hooks/use-debt-notification";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { toast } from "sonner";

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [lastNotifId, setLastNotifId] = useState<number | null>(null);

  const { data, isLoading } = useDebtNotifications({ 
    pageSize: 10,
    type: tab === "unread" ? "unread" : undefined 
  });

  const notifications = data?.items ?? [];
  const unreadCount = data?.total ?? 0;

  // Real-time toast logic (Facebook style)
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      
      // Nếu là lần đầu load hoặc có ID mới hơn ID cũ
      if (lastNotifId !== null && latest.id !== lastNotifId) {
        toast(latest.subject || "Thông báo mới", {
          description: latest.body,
          duration: 5000,
          icon: <Bell className="h-4 w-4 text-primary" />,
          className: "rounded-xl shadow-2xl border border-slate-800 bg-slate-900/95 text-white backdrop-blur-md p-4",
          descriptionClassName: "text-slate-400",
        });
      }
      setLastNotifId(latest.id);
    }
  }, [notifications, lastNotifId, navigate]);

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative transition-all hover:bg-secondary/80 cursor-pointer flex items-center justify-center h-10 w-10 rounded-full bg-secondary select-none outline-none"
          title="Thông báo"
        >
          <Bell 
            fill="currentColor"
            className={cn(
              "h-5 w-5 text-foreground",
              unreadCount > 0 && "animate-bell-shake"
            )} 
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground animate-in zoom-in duration-300 leading-none tabular-nums text-center select-none cursor-pointer">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 shadow-2xl rounded-xl border-none bg-background/95 backdrop-blur-md overflow-hidden" align="end">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b bg-background/50">
          <h3 className="text-xl font-bold tracking-tight">Thông báo</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="px-4 py-2 flex gap-2 border-b bg-background/30">
          <button
            onClick={() => setTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold transition-all",
              tab === "all" 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent text-muted-foreground"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTab("unread")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold transition-all",
              tab === "unread" 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-accent text-muted-foreground"
            )}
          >
            Chưa đọc
          </button>
        </div>

        {/* List */}
        <ScrollArea className="h-[450px]">
          <div className="p-2 space-y-1">
            <div className="px-2 py-2 flex items-center justify-between">
              <span className="text-sm font-bold">Mới</span>
              <button 
                onClick={() => handleNavigate("/notifications")}
                className="text-xs text-primary hover:underline font-medium"
              >
                Xem tất cả
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Không có thông báo mới nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="group relative flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1 pr-4">
                    <p className={cn(
                      "text-sm leading-snug line-clamp-3",
                      !notif.sentAt ? "font-bold text-foreground" : "text-muted-foreground"
                    )}>
                      <span className="font-extrabold text-foreground">{notif.subject}: </span>
                      {notif.body}
                    </p>
                    <p className={cn(
                      "text-xs font-medium",
                      !notif.sentAt ? "text-blue-600" : "text-muted-foreground"
                    )}>
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi }) : "Vừa xong"}
                    </p>
                  </div>

                  {!notif.sentAt && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-2.5 w-2.5 bg-blue-600 rounded-full" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t bg-background/50">
          <Button 
            variant="ghost" 
            className="w-full justify-center text-sm font-semibold py-6 rounded-lg hover:bg-accent"
            onClick={() => handleNavigate("/notifications")}
          >
            Xem thông báo trước đó
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
