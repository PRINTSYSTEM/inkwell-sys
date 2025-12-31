import { Outlet, useNavigation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function RouteLoadingOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-xl bg-card px-8 py-6 shadow-lg shadow-primary/20 border border-border animate-scale-in">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-hidden="true"
        />
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-foreground">
            Đang tải trang
          </p>
          <p className="text-xs text-muted-foreground">
            Vui lòng chờ trong giây lát…
          </p>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary animate-[progress_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="relative flex flex-1 flex-col">
          <AppHeader />
          <main className="relative flex-1 bg-muted/30 p-6">
            {isLoading && <RouteLoadingOverlay />}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Also export as named export for compatibility
export { DashboardLayout };
