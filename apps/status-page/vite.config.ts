import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The page is published to GitHub Pages at
// https://walnuthq.github.io/miden-playground/, so every asset URL needs that
// repository prefix baked in. Overridable so `vite preview`, a custom domain or
// any other host can serve it from the root instead.
const base = process.env.STATUS_PAGE_BASE ?? "/miden-playground/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
