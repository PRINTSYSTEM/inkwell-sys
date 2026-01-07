import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./providers/AuthProvider";
import { router } from "./routes";
import { NotificationProvider } from "./providers/NotificationProvider";

// Debug API configuration in development
if (import.meta.env.DEV) {
  console.log("🔍 API Configuration Debug:");
  // console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
  console.log("VITE_API_TIMEOUT:", import.meta.env.VITE_API_TIMEOUT);
  console.log("Environment:", import.meta.env.MODE);
  import("./tests/validation.spec").catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors like 400, 401, 403, 404)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry 3 times for server errors (5xx) and network errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s, max 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
            <Sonner />
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
