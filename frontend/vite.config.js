import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Escucha en todas las interfaces (0.0.0.0)
    port: 5173,
  },
  build: {
    // Generar manifesto para mejor cache busting
    manifest: true,
    // Agregar hash a los assets para forzar actualización
    rollupOptions: {
      output: {
        // Nombres con hash para cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
});
