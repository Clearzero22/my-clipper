import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "strip-crossorigin",
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin/g, "");
      },
    },
  ],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, "newtab.html"),
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["**/*.dom.test.tsx", "jsdom"]],
  },
});
