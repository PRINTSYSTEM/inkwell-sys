import React from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/constants/role.constant";

const roleNames = {
  admin: "Quản trị viên",
  production_manager: "Trưởng sản xuất",
  accountant: "Kế toán",
  designer: "Thiết kế",
  prepress: "Bình bài",
  operator: "Vận hành",
  sale: "Sale",
};

export function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 z-50 w-[calc(100%-var(--sidebar-width))] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center justify-between pl-4 pr-8">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-3 transition-all hover:opacity-80 outline-none select-none">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-border bg-primary shadow-md">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white border border-border rounded-full p-0.5 shadow-md group-hover:scale-110 transition-transform">
                      <ChevronDown className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  
                  <div className="hidden md:block text-left min-w-0 select-none">
                    <p className="text-sm font-bold truncate text-foreground">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-medium">
                      {ROLE_LABELS[user.role] || user.role}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
