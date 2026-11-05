import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 7070,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      "/uploads": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
