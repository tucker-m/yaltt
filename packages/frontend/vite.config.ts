import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: __dirname,
  server: {
    port: 80,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://yaltt-backend:3000/",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    host: true,
  },
});
