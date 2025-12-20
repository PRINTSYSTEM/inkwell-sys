import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { router } from "./routes";
// import { NotificationProvider } from "./providers/NotificationProvider";

// Debug API configuration in development
if (import.meta.env.DEV) {
  console.log("🔍 API Configuration Debug:");
  // console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
  console.log("VITE_API_TIMEOUT:", import.meta.env.VITE_API_TIMEOUT);
  console.log("Environment:", import.meta.env.MODE);
  import("./tests/validation.spec").catch(() => {});
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
