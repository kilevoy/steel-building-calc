import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` matches the GitHub Pages URL path: https://<user>.github.io/steel-building-calc/
export default defineConfig({
  plugins: [react()],
  base: "/steel-building-calc/",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        chunkFileNames: "assets/chunk-[hash].js",
      },
    },
  },
});
