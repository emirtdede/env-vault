import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is available in node build environment
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "es2022",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
          if (/[\\/]node_modules[\\/](@codemirror|codemirror)[\\/]/.test(id)) return "editor";
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return "icons";
          if (/[\\/]node_modules[\\/]@tauri-apps[\\/]/.test(id)) return "tauri";
          if (/[\\/]node_modules[\\/](zustand|immer)[\\/]/.test(id)) return "state";
          return "vendor";
        },
      },
    },
  },
});
