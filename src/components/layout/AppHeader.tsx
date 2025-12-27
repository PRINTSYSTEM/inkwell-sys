import React from "react";
import { LogOut, User } from "lucide-react";
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
};

export function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // #region agent log
  React.useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const logHeaderLayout = () => {
        const headerEl = document.querySelector('header');
        if (!headerEl) return;
        
        const containerEl = headerEl.querySelector('div:first-child');
        const leftEl = containerEl?.querySelector('div:first-child');
        const rightEl = containerEl?.querySelector('div:last-child');
        const headerRect = headerEl.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(headerEl);
        
        // Find parent containers
        let parentEl = headerEl.parentElement;
        const parentInfo = [];
        let depth = 0;
        while (parentEl && depth < 5) {
          const parentComputed = window.getComputedStyle(parentEl);
          parentInfo.push({
            tag: parentEl.tagName,
            className: parentEl.className,
            position: parentComputed.position,
            overflow: parentComputed.overflow,
            overflowX: parentComputed.overflowX,
            overflowY: parentComputed.overflowY,
            height: parentComputed.height,
            minHeight: parentComputed.minHeight,
            maxHeight: parentComputed.maxHeight,
            display: parentComputed.display,
            flexDirection: parentComputed.flexDirection,
          });
          parentEl = parentEl.parentElement;
          depth++;
        }
        
        fetch('http://127.0.0.1:7243/ingest/0ac68b44-beaf-4ee6-8632-2687b7520c17', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'AppHeader.tsx:useEffect',
            message: 'Header sticky position debug',
            data: {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              headerTop: headerRect.top,
              headerBottom: headerRect.bottom,
              headerLeft: headerRect.left,
              headerRight: headerRect.right,
              headerHeight: headerRect.height,
              headerWidth: headerRect.width,
              headerPosition: computedStyle.position,
              headerTopValue: computedStyle.top,
              headerBottomValue: computedStyle.bottom,
              headerLeftValue: computedStyle.left,
              headerRightValue: computedStyle.right,
              headerZIndex: computedStyle.zIndex,
              headerDisplay: computedStyle.display,
              headerClassName: headerEl.className,
              headerHasSticky: headerEl.className.includes('sticky'),
              parentContainers: parentInfo,
              isStickyWorking: computedStyle.position === 'sticky' && headerRect.top === 0 && window.scrollY > 0,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
          })
        }).catch(() => {});
      };
      
      // Log immediately, on resize, and on scroll
      logHeaderLayout();
      const resizeHandler = () => logHeaderLayout();
      const scrollHandler = () => logHeaderLayout();
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('scroll', scrollHandler, { passive: true });
      
      return () => {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('scroll', scrollHandler);
      };
    }
  }, [user]);
  // #endregion

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold ml-4 truncate">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </Button>
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
    </header>
  );
}
