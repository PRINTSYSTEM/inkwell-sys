import React from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDebtNotifications } from "@/hooks/use-debt-notification";

function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useDebtNotifications({ pageSize: 1 });

  // For now, we'll use the total count as unread count
  const unreadCount = data?.total ?? 0;

  return (
    <div
      className="relative transition-colors cursor-pointer flex items-center justify-center h-10 w-10"
      onClick={() => navigate("/notifications")}
      title="Thông báo"
    >
      <Bell size={40} className="text-slate-600 dark:text-slate-400" style={{ width: '25px', height: '25px' }} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-300">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}

export default NotificationBell;
