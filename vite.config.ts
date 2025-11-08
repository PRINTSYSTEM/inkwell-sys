import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep manualChunks conservative to avoid referencing packages
        // that may not be installed under exact names. Group heavy,
        // well-known libraries only.
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
          charts: ['recharts'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          query: ['@tanstack/react-query'],
          http: ['axios'],
          utils: ['clsx', 'date-fns', 'class-variance-authority']
        }
      }
    },

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Enable source maps in production for debugging
    sourcemap: mode === 'development'
  }
}));
