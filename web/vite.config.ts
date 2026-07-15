import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Client-rendered SPA — Freighter (a browser extension) only works in the browser,
// so there is no SSR here and no need for "use client" guards.
export default defineConfig({
  // Vercel serves at the root; keep "/" everywhere. (The old GitHub Pages
  // "/EskoLokt/" sub-path is retired now that we deploy to Vercel.)
  base: "/",
  // StellarWalletsKit / stellar-sdk reference Node's `global` in the browser bundle.
  define: { global: "globalThis" },
  plugins: [react()],
});
