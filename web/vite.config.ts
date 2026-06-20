import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Client-rendered SPA — Freighter (a browser extension) only works in the browser,
// so there is no SSR here and no need for "use client" guards.
export default defineConfig({
  plugins: [react()],
});
